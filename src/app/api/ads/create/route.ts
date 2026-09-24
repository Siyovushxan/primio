import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { validateAdInput, milliseconds } from "@/lib/auction";
import { contentHash } from "@/lib/moderation-receipt";
export async function POST(req: NextRequest) {
  const uid = await verifyFirebaseToken(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const data = validateAdInput(body);
    if (typeof body.reviewId !== "string" || !/^[\w-]{1,128}$/.test(body.reviewId)) throw new Error("Moderation approval is required.");
    const ref = adminDb.collection("ads").doc();
    const reviewRef = adminDb.doc(`moderationReviews/${body.reviewId}`);
    const adId = await adminDb.runTransaction(async tx => {
      const review = (await tx.get(reviewRef)).data();
      if (!review || review.uid !== uid || review.hash !== contentHash(data)) throw new Error("Content does not match the moderation approval.");
      if (review.used && review.adId) return review.adId as string;
      if (milliseconds(review.expiresAt) <= Date.now()) throw new Error("Moderation approval expired. Please review again.");
      tx.create(ref, { ...data, advertiserUID: uid, status: "pending", moderationPassed: true, contentVersion: 1,
        totalPaidCents: 0, startsAt: null, expiresAt: null, impressions: 0, clicks: 0,
        externalTxId: "", paymentMethod: "", createdAt: FieldValue.serverTimestamp() });
      tx.update(reviewRef, { used: true, adId: ref.id });
      return ref.id;
    });
    return NextResponse.json({ adId });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create ad." }, { status: 400 }); }
}