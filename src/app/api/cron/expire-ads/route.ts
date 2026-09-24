import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { DAY_MS, isValidDuration } from "@/lib/adRules";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify cron secret so only Vercel Cron (or our server) can call this
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const batch = adminDb.batch();

    // Find all active ads whose expiresAt is in the past
    const expiredSnap = await adminDb
      .collection("ads")
      .where("status", "==", "active")
      .where("expiresAt", "<=", now)
      .get();
    expiredSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "expired",
        expiredAt: FieldValue.serverTimestamp(),
      });
    });

    // Paid ads left in the retired "pending_verification" state: they passed AI moderation
    // and were paid for, so they go live now and their period starts now.
    const stuckSnap = await adminDb
      .collection("ads")
      .where("status", "==", "pending_verification")
      .get();
    stuckSnap.docs.forEach((doc) => {
      const days = doc.data().durationDays;
      const paidDays = isValidDuration(days) ? days : 7;
      batch.update(doc.ref, {
        status: "active",
        startsAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromMillis(now.getTime() + paidDays * DAY_MS),
      });
    });

    if (expiredSnap.empty && stuckSnap.empty) {
      return NextResponse.json({ expired: 0, activated: 0, message: "Nothing to do" });
    }
    await batch.commit();

    console.log(
      `expire-ads: ${expiredSnap.size} expired, ${stuckSnap.size} activated from pending_verification at ${now.toISOString()}`,
    );
    return NextResponse.json({ expired: expiredSnap.size, activated: stuckSnap.size });
  } catch (err) {
    console.error("expire-ads error:", err);
    return NextResponse.json({ error: "Failed to expire ads" }, { status: 500 });
  }
}
