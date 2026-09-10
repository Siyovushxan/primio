import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia" as any,
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const adId = session.metadata?.adId;
    const advertiserUID = session.metadata?.advertiserUID;
    const externalTxId = session.id;

    if (!adId || !advertiserUID) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    try {
      const adRef = adminDb.doc(`ads/${adId}`);
      const adSnap = await adRef.get();

      if (!adSnap.exists) {
        return NextResponse.json({ error: "Ad not found" }, { status: 404 });
      }

      const ad = adSnap.data()!;

      if (ad.externalTxId === externalTxId) {
        return NextResponse.json({ received: true });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + ad.durationDays * 24 * 60 * 60 * 1000);

      const userSnap = await adminDb.doc(`users/${advertiserUID}`).get();
      const isNewAccount = userSnap.exists ? userSnap.data()!.isNewAccount : false;
      const newStatus = isNewAccount ? "pending_verification" : "active";

      await adRef.update({
        status: newStatus,
        startsAt: isNewAccount ? null : FieldValue.serverTimestamp(),
        expiresAt: isNewAccount ? null : expiresAt,
        totalPaidCents: session.amount_total,
        externalTxId,
        paymentMethod: "card",
      });

      await adminDb.collection("transactions").add({
        uid: advertiserUID,
        adId,
        type: "purchase",
        amountCents: session.amount_total,
        externalTxId,
        paymentMethod: "card",
        createdAt: FieldValue.serverTimestamp(),
      });

      if (userSnap.exists) {
        await adminDb.doc(`users/${advertiserUID}`).update({
          totalSpentCents: FieldValue.increment(session.amount_total || 0),
          isNewAccount: false,
        });
      }

      console.log(`Ad ${adId} activated. Status: ${newStatus}`);
    } catch (err) {
      console.error("Webhook processing error:", err);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
