import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia" as any,
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const adId = session.metadata?.adId;
    const advertiserUID = session.metadata?.advertiserUID;
    const type = session.metadata?.type || "purchase";
    const newDailyBidCents = parseInt(session.metadata?.newDailyBidCents || "0");

    if (!adId || !advertiserUID) {
      return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 });
    }

    const adRef = adminDb.doc(`ads/${adId}`);
    const adSnap = await adRef.get();
    if (!adSnap.exists) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }
    const ad = adSnap.data()!;

    // Idempotency: already processed
    if (ad.externalTxId === sessionId) {
      return NextResponse.json({ paid: true, type, adId, advertiserUID, alreadyProcessed: true });
    }

    if (type === "bid_upgrade") {
      // Bid upgrade: update dailyBidCents, keep status active
      await adRef.update({
        dailyBidCents: newDailyBidCents,
        externalTxId: sessionId,
      });

      await adminDb.collection("transactions").add({
        uid: advertiserUID,
        adId,
        type: "bid_upgrade",
        amountCents: session.amount_total,
        externalTxId: sessionId,
        paymentMethod: "card",
        createdAt: FieldValue.serverTimestamp(),
      });

      await adminDb.doc(`users/${advertiserUID}`).update({
        totalSpentCents: FieldValue.increment(session.amount_total || 0),
      });
    } else {
      // New ad purchase: activate ad
      const userSnap = await adminDb.doc(`users/${advertiserUID}`).get();
      const isNew = userSnap.exists ? userSnap.data()?.isNewAccount === true : false;
      const newStatus = isNew ? "pending_verification" : "active";

      const now = new Date();
      const expiresAt = new Date(now.getTime() + (ad.durationDays || 7) * 24 * 60 * 60 * 1000);

      await adRef.update({
        status: newStatus,
        startsAt: isNew ? null : FieldValue.serverTimestamp(),
        expiresAt: isNew ? null : expiresAt,
        totalPaidCents: session.amount_total,
        externalTxId: sessionId,
        paymentMethod: "card",
      });

      await adminDb.collection("transactions").add({
        uid: advertiserUID,
        adId,
        type: "purchase",
        amountCents: session.amount_total,
        externalTxId: sessionId,
        paymentMethod: "card",
        createdAt: FieldValue.serverTimestamp(),
      });

      await adminDb.doc(`users/${advertiserUID}`).update({
        totalSpentCents: FieldValue.increment(session.amount_total || 0),
        isNewAccount: false,
      });
    }

    return NextResponse.json({ paid: true, type, adId, advertiserUID, amountTotal: session.amount_total });
  } catch (err: any) {
    console.error("Verify session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
