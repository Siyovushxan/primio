import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify cron secret so only Vercel Cron (or our server) can call this
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all active ads whose expiresAt is in the past
    const snapshot = await adminDb
      .collection("ads")
      .where("status", "==", "active")
      .where("expiresAt", "<=", now)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ expired: 0, message: "No ads to expire" });
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "expired",
        expiredAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    console.log(`expire-ads: ${snapshot.size} ads expired at ${now.toISOString()}`);
    return NextResponse.json({ expired: snapshot.size });
  } catch (err) {
    console.error("expire-ads error:", err);
    return NextResponse.json({ error: "Failed to expire ads" }, { status: 500 });
  }
}
