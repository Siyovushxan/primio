import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const DODO_BASE =
  process.env.DODO_LIVE_MODE === "true"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

export async function POST(req: NextRequest) {
  try {
    const { adId } = await req.json();
    if (!adId) return NextResponse.json({ error: "Missing adId" }, { status: 400 });

    const adRef = adminDb.doc(`ads/${adId}`);
    const adSnap = await adRef.get();
    if (!adSnap.exists) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }
    const ad = adSnap.data()!;

    const paymentId = ad.pendingPaymentId || ad.externalTxId;
    if (!paymentId) {
      return NextResponse.json({ error: "Payment not initiated" }, { status: 400 });
    }

    // Idempotency: already processed
    if (ad.externalTxId === paymentId && ad.status !== "pending") {
      return NextResponse.json({
        paid: true,
        type: ad.paymentType || "purchase",
        adId,
        advertiserUID: ad.advertiserUID,
        alreadyProcessed: true,
      });
    }

    const res = await fetch(`${DODO_BASE}/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.DODO_API_KEY}` },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Dodo get payment error:", err);
      return NextResponse.json({ error: "To'lov ma'lumotini olib bo'lmadi" }, { status: 500 });
    }

    const payment = await res.json();

    if (payment.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const metadata = payment.metadata || {};
    const advertiserUID = metadata.advertiserUID || ad.advertiserUID;
    const type = metadata.type || "purchase";
    const newDailyBidCents = parseInt(metadata.newDailyBidCents || "0");
    const amountTotal = payment.total_amount || 0;

    if (type === "bid_upgrade") {
      await adRef.update({
        dailyBidCents: newDailyBidCents,
        externalTxId: paymentId,
        pendingPaymentId: FieldValue.delete(),
      });

      await adminDb.collection("transactions").add({
        uid: advertiserUID,
        adId,
        type: "bid_upgrade",
        amountCents: amountTotal,
        externalTxId: paymentId,
        paymentMethod: "card",
        createdAt: FieldValue.serverTimestamp(),
      });

      await adminDb.doc(`users/${advertiserUID}`).update({
        totalSpentCents: FieldValue.increment(amountTotal),
      });
    } else {
      const userSnap = await adminDb.doc(`users/${advertiserUID}`).get();
      const isNew = userSnap.exists ? userSnap.data()?.isNewAccount === true : false;
      const newStatus = isNew ? "pending_verification" : "active";

      const now = new Date();
      const expiresAt = new Date(now.getTime() + (ad.durationDays || 7) * 24 * 60 * 60 * 1000);

      await adRef.update({
        status: newStatus,
        startsAt: isNew ? null : FieldValue.serverTimestamp(),
        expiresAt: isNew ? null : expiresAt,
        totalPaidCents: amountTotal,
        externalTxId: paymentId,
        paymentMethod: "card",
        pendingPaymentId: FieldValue.delete(),
      });

      await adminDb.collection("transactions").add({
        uid: advertiserUID,
        adId,
        type: "purchase",
        amountCents: amountTotal,
        externalTxId: paymentId,
        paymentMethod: "card",
        createdAt: FieldValue.serverTimestamp(),
      });

      await adminDb.doc(`users/${advertiserUID}`).update({
        totalSpentCents: FieldValue.increment(amountTotal),
        isNewAccount: false,
      });
    }

    return NextResponse.json({ paid: true, type, adId, advertiserUID, amountTotal });
  } catch (err: any) {
    console.error("Verify session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
