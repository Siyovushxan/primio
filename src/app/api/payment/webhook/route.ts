import { NextRequest, NextResponse, after } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { applyPayment, notifyOutranked } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Reject deliveries whose signed timestamp is too far from now (replay protection)
const TIMESTAMP_TOLERANCE_SEC = 5 * 60;

function verifyDodoWebhook(
  body: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: string,
): boolean {
  try {
    const ts = Number(webhookTimestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TIMESTAMP_TOLERANCE_SEC) return false;

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

  if (event.type !== "payment.succeeded") return NextResponse.json({ received: true });

  const payload = event.data?.payload ?? event.data ?? {};
  const metadata = payload.metadata || {};
  if (!payload.payment_id || !metadata.adId || !metadata.advertiserUID) {
    console.error("Webhook missing payment id or metadata:", payload.payment_id, metadata);
    return NextResponse.json({ received: true });
  }

  try {
    const result = await applyPayment({
      paymentId: String(payload.payment_id),
      metadata,
      amountCents: Number(payload.total_amount) || 0,
      source: "webhook",
    });
    console.log(`Webhook ${payload.payment_id}: ${result.type} → ${result.outcome}`);

    if (result.bidUpgrade) {
      const upgrade = result.bidUpgrade;
      after(() => notifyOutranked(result.adId, upgrade).catch((err) => console.error("Outbid notify error:", err)));
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
