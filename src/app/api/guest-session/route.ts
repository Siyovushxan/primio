import { createHmac, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

// A new browser gets only a fresh guest UID. No client-provided UID or privileged claim is accepted.
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403, headers: PRIVATE_HEADERS });
  }
  if (!req.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 415, headers: PRIVATE_HEADERS });
  }
  try {
    const body = await req.text();
    if (body.length > 100 || body.trim() !== "{}") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: PRIVATE_HEADERS });
    }
    const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.CRON_SECRET;
    if (!key) throw new Error("Guest signing is not configured");
    const ip = req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const id = createHmac("sha256", key).update(ip).digest("hex");
    const minute = Math.floor(Date.now() / 60000);
    const ref = adminDb.doc(`guestSessionLimits/${id}`);
    const allowed = await adminDb.runTransaction(async tx => {
      const data = (await tx.get(ref)).data();
      const count = data?.minute === minute ? Number(data.count) : 0;
      if (count >= 20) return false;
      tx.set(ref, { minute, count: count + 1, expiresAt: new Date(Date.now() + 3600000) });
      return true;
    });
    if (!allowed) return NextResponse.json({ error: "Please try again in a minute." }, { status: 429, headers: { ...PRIVATE_HEADERS, "Retry-After": "60" } });
    const uid = "guest_" + randomUUID();
    await adminAuth.createUser({ uid });
    await adminAuth.setCustomUserClaims(uid, { primioGuest: true });
    const token = await adminAuth.createCustomToken(uid, { primioGuest: true });
    return NextResponse.json({ token }, { headers: PRIVATE_HEADERS });
  } catch {
    return NextResponse.json({ error: "Could not start your guest session. Please try again." }, { status: 503, headers: PRIVATE_HEADERS });
  }
}
