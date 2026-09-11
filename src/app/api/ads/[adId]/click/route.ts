import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

// Simple in-memory rate limit: 1 click per IP per adId per 30 seconds
const rateMap = new Map<string, number>();
setInterval(() => rateMap.clear(), 60_000);

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/ads/[adId]/click">
) {
  const { adId } = await ctx.params;

  // Basic adId format validation
  if (!adId || adId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(adId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Rate limit: 1 click per IP+adId per minute
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const key = `${ip}:${adId}`;
  const last = rateMap.get(key) ?? 0;
  if (Date.now() - last < 30_000) {
    return NextResponse.json({ ok: true }); // silent ignore, not an error
  }
  rateMap.set(key, Date.now());

  try {
    const adRef = adminDb.doc(`ads/${adId}`);
    const snap = await adRef.get();
    if (!snap.exists || snap.data()?.status !== "active") {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    await adRef.update({ clicks: FieldValue.increment(1) });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
