import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

function verifyDodoWebhook(
  body: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: string,
): boolean {
  try {
    // Standard Webhooks: secret is "whsec_<base64>"
    const rawSecret = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
    const expected = createHmac("sha256", rawSecret)
      .update(signedContent)
      .digest("base64");

    // webhookSignature may be "v1,<sig1> v1,<sig2>"
    const signatures = webhookSignature.split(" ").map((s) => s.replace(/^v1,/, ""));
    return signatures.some((sig) => {
      try {
        return timingSafeEqual(Buffer.from(sig, "base64"), Buffer.from(expected, "base64"));
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  const webhookId = req.headers.get("webhook-id") || "";
  const webhookTimestamp = req.headers.get("webhook-timestamp") || "";
  const webhookSignature = req.headers.get("webhook-signature") || "";
  const secret = process.env.DODO_WEBHOOK_SECRET || "";

  if (!secret) {
    console.error("DODO_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  if (!verifyDodoWebhook(body, webhookId, webhookTimestamp, webhookSignature, secret)) {
    console.error("Dodo webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "payment.succeeded") {
    const payload = event.data?.payload ?? event.data ?? {};
    const paymentId = payload.payment_id;
    const metadata = payload.metadata || {};
    const adId = metadata.adId;
    const advertiserUID = metadata.advertiserUID;
    const type = metadata.type || "purchase";
    const newDailyBidCents = parseInt(metadata.newDailyBidCents || "0");
    const amountTotal = payload.total_amount || 0;

    if (!adId || !advertiserUID) {
      console.error("Webhook missing metadata:", metadata);
      return NextResponse.json({ received: true });
    }

    try {
      const adRef = adminDb.doc(`ads/${adId}`);
      const adSnap = await adRef.get();

      if (!adSnap.exists) {
        console.error("Ad not found:", adId);
        return NextResponse.json({ received: true });
      }

      const ad = adSnap.data()!;

      // Idempotency: already processed
      if (ad.externalTxId === paymentId) {
        return NextResponse.json({ received: true });
      }

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
        const isNewAccount = userSnap.exists ? userSnap.data()!.isNewAccount : false;
        const newStatus = isNewAccount ? "pending_verification" : "active";

        const now = new Date();
        const expiresAt = new Date(now.getTime() + (ad.durationDays || 7) * 24 * 60 * 60 * 1000);

        await adRef.update({
          status: newStatus,
          startsAt: isNewAccount ? null : FieldValue.serverTimestamp(),
          expiresAt: isNewAccount ? null : expiresAt,
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

        if (userSnap.exists) {
          await adminDb.doc(`users/${advertiserUID}`).update({
            totalSpentCents: FieldValue.increment(amountTotal),
            isNewAccount: false,
          });
        }

        console.log(`Ad ${adId} activated via webhook. Status: ${newStatus}`);
      }
    } catch (err) {
      console.error("Webhook processing error:", err);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
