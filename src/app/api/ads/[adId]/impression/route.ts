import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

// 1 impression per IP per adId per 60 seconds
const rateMap = new Map<string, number>();
setInterval(() => rateMap.clear(), 120_000);

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/ads/[adId]/impression">
) {
  const { adId } = await ctx.params;

  if (!adId || adId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(adId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const key = `${ip}:${adId}`;
  const last = rateMap.get(key) ?? 0;
  if (Date.now() - last < 60_000) {
    return NextResponse.json({ ok: true });
  }
  rateMap.set(key, Date.now());

  try {
    const adRef = adminDb.doc(`ads/${adId}`);
    const snap = await adRef.get();
    if (!snap.exists || snap.data()?.status !== "active") {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    await adRef.update({ impressions: FieldValue.increment(1) });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
