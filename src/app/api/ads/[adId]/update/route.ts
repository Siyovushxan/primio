import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { validateAdInput, milliseconds } from "@/lib/auction";
import { contentHash } from "@/lib/moderation-receipt";
export async function POST(req: NextRequest, { params }: { params: Promise<{ adId: string }> }) {
  const uid = await verifyFirebaseToken(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { adId } = await params;
    const body = await req.json();
    const data = validateAdInput(body);
    if (!/^[\w-]{1,128}$/.test(adId) || typeof body.reviewId !== "string" || !/^[\w-]{1,128}$/.test(body.reviewId)) throw new Error("Invalid request.");
    await adminDb.runTransaction(async tx => {
      const ref = adminDb.doc(`ads/${adId}`);
      const reviewRef = adminDb.doc(`moderationReviews/${body.reviewId}`);
      const [snap, reviewSnap] = await Promise.all([tx.get(ref), tx.get(reviewRef)]);
      const ad = snap.data(); const review = reviewSnap.data();
      if (!ad || ad.advertiserUID !== uid) throw new Error("Ad not found.");
      if (!["pending","rejected"].includes(ad.status) || ad.totalPaidCents > 0 || ad.pendingOrderId) throw new Error("Only unpaid ads without an open checkout can be edited.");
      if (!review || review.uid !== uid || review.used || milliseconds(review.expiresAt) <= Date.now() || review.hash !== contentHash(data)) throw new Error("A matching moderation approval is required.");
      tx.update(ref, { ...data, status: "pending", moderationPassed: true, contentVersion: (ad.contentVersion ?? 0) + 1, updatedAt: FieldValue.serverTimestamp() });
      tx.update(reviewRef, { used: true, adId });
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update ad." }, { status: 400 }); }
}