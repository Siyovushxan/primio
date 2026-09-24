import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { applyPayment, applyRefund, dodoRequest } from "@/lib/payments";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const body = await req.text();
  const id = req.headers.get("webhook-id") ?? "";
  const timestamp = req.headers.get("webhook-timestamp") ?? "";
  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  if (!id || !Number.isFinite(Number(timestamp)) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300)
    return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
  const expected = createHmac("sha256", Buffer.from(secret.replace(/^whsec_/, ""), "base64")).update(`${id}.${timestamp}.${body}`).digest();
  const valid = (req.headers.get("webhook-signature") ?? "").split(" ").some(sig => {
    try { const got = Buffer.from(sig.replace(/^v1,/, ""), "base64"); return got.length === expected.length && timingSafeEqual(got, expected); } catch { return false; }
  });
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  try {
    const event = JSON.parse(body);
    if (event.type === "payment.succeeded") {
      const paymentId = (event.data?.payload ?? event.data)?.payment_id;
      if (typeof paymentId !== "string" || !/^[\w-]{1,128}$/.test(paymentId)) throw new Error("Missing payment id.");
      await applyPayment(await dodoRequest(`/payments/${paymentId}`));
    }
    if (event.type === "refund.succeeded") {
      const refundId = (event.data?.payload ?? event.data)?.refund_id;
      if (typeof refundId !== "string" || !/^[\w-]{1,128}$/.test(refundId)) throw new Error("Missing refund id.");
      await applyRefund(await dodoRequest(`/refunds/${refundId}`));
    }
    return NextResponse.json({ received: true });
  } catch (error) { console.error("Webhook:", error); return NextResponse.json({ error: "Processing failed" }, { status: 500 }); }
}
