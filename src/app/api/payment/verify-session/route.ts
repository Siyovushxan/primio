import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { dodoRequest, applyPayment } from "@/lib/payments";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const uid = await verifyFirebaseToken(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { adId, orderId } = await req.json();
    if (typeof adId !== "string" || !/^[\w-]{1,128}$/.test(adId)) throw new Error("Invalid ad.");
    const ad = (await adminDb.doc(`ads/${adId}`).get()).data();
    if (!ad || ad.advertiserUID !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    let paymentId = ad.pendingPaymentId || ad.externalTxId;
    if (orderId) {
      if (typeof orderId !== "string" || !/^[\w-]{1,128}$/.test(orderId)) throw new Error("Invalid order.");
      const order = (await adminDb.doc(`paymentOrders/${orderId}`).get()).data();
      if (!order || order.uid !== uid || order.adId !== adId) throw new Error("Order not found.");
      paymentId = order.providerPaymentId;
    }
    if (!paymentId) return NextResponse.json({ paid: false });
    const payment = await dodoRequest(`/payments/${encodeURIComponent(paymentId)}`);
    if (payment.metadata?.adId !== adId) throw new Error("Payment does not belong to this ad.");
    return NextResponse.json(await applyPayment(payment));
  } catch (error) { console.error("Verify payment:", error); return NextResponse.json({ error: "Payment could not be confirmed. Try again or contact support." }, { status: 400 }); }
}