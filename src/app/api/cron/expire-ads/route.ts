import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const adminKey = req.headers.get("x-admin-secret");

  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.ADMIN_SECRET;

  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isAdminCall = adminSecret && adminKey === adminSecret;

  if (!isVercelCron && !isAdminCall) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find active ads whose expiresAt has passed
  const snap = await adminDb
    .collection("ads")
    .where("status", "==", "active")
    .where("expiresAt", "<=", now)
    .get();

  if (snap.empty) {
    return NextResponse.json({ expired: 0, message: "No expired ads found" });
  }

  // Batch update in groups of 500 (Firestore batch limit)
  const batches: FirebaseFirestore.WriteBatch[] = [];
  let current = adminDb.batch();
  let count = 0;

  for (const doc of snap.docs) {
    current.update(doc.ref, {
      status: "expired",
      expiredAt: FieldValue.serverTimestamp(),
    });
    count++;
    if (count % 500 === 0) {
      batches.push(current);
      current = adminDb.batch();
    }
  }
  batches.push(current);

  await Promise.all(batches.map((b) => b.commit()));

  console.log(`expire-ads cron: expired ${snap.size} ads at ${now.toISOString()}`);
  return NextResponse.json({ expired: snap.size, at: now.toISOString() });
}
