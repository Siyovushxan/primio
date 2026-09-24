import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import { DAY_MS, milliseconds } from "./auction";
export const dodoBase = process.env.DODO_LIVE_MODE === "true" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
export async function dodoRequest(path: string, body?: unknown) {
  if (!process.env.DODO_API_KEY) throw new Error("Payment service is not configured.");
  const response = await fetch(dodoBase + path, { method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${process.env.DODO_API_KEY}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000), cache: "no-store" });
  if (!response.ok) throw new Error("Payment service is temporarily unavailable.");
  return response.json();
}
export interface ProviderPayment { payment_id: string; status: string; total_amount: number; currency: string; metadata?: Record<string, string> }
export interface ProviderRefund { refund_id: string; payment_id: string; status: string; amount: number | null; currency: string | null; is_partial?: boolean }
export async function applyRefund(refund: ProviderRefund) {
  if (refund.status !== "succeeded") return { refunded: false };
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(refund.refund_id) || !/^[a-zA-Z0-9_-]{1,128}$/.test(refund.payment_id) ||
      refund.currency !== "USD" || !Number.isSafeInteger(refund.amount) || (refund.amount ?? 0) <= 0) throw new Error("Invalid refund.");
  const amount = refund.amount as number;
  const paymentRef = adminDb.doc(`transactions/${refund.payment_id}`);
  const refundRef = adminDb.doc(`transactions/refund_${refund.refund_id}`);
  const totalRef = adminDb.doc(`paymentRefunds/${refund.payment_id}`);
  return adminDb.runTransaction(async tx => {
    const [paymentSnap, refundSnap, totalSnap] = await Promise.all([tx.get(paymentRef), tx.get(refundRef), tx.get(totalRef)]);
    if (refundSnap.exists) return { refunded: true, alreadyProcessed: true };
    const payment = paymentSnap.data();
    if (!payment || payment.type === "refund" || payment.currency !== "USD" ||
        (totalSnap.data()?.totalCents ?? 0) + amount > payment.amountCents) throw new Error("Refund needs manual reconciliation.");
    const adRef = adminDb.doc(`ads/${payment.adId}`);
    const userRef = adminDb.doc(`users/${payment.uid}`);
    const adSnap = await tx.get(adRef);
    const isCurrent = adSnap.data()?.advertiserUID === payment.uid && adSnap.data()?.externalTxId === refund.payment_id;
    const fullyRefunded = (totalSnap.data()?.totalCents ?? 0) + amount === payment.amountCents;
    tx.create(refundRef, { uid: payment.uid, adId: payment.adId, type: "refund", amountCents: amount,
      currency: "USD", paymentId: refund.payment_id, externalTxId: refund.refund_id,
      paymentMethod: "card", createdAt: FieldValue.serverTimestamp() });
    tx.set(totalRef, { totalCents: FieldValue.increment(amount), paymentId: refund.payment_id }, { merge: true });
    tx.set(userRef, { totalSpentCents: FieldValue.increment(-amount) }, { merge: true });
    if (adSnap.exists && adSnap.data()?.advertiserUID === payment.uid) {
      tx.update(adRef, { totalPaidCents: FieldValue.increment(-amount),
        ...(fullyRefunded && isCurrent ? { status: "expired", expiresAt: new Date(), paymentReviewRequired: true } : {}) });
    }
    return { refunded: true, fullyRefunded };
  });
}
export async function applyPayment(payment: ProviderPayment) {
  if (payment.status !== "succeeded") return { paid: false };
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(payment.payment_id)) throw new Error("Invalid provider payment ID.");
  const orderId = payment.metadata?.orderId;
  if (!orderId || !/^[a-zA-Z0-9_-]{1,128}$/.test(orderId)) throw new Error("Payment needs manual reconciliation: order missing.");
  const orderRef = adminDb.doc(`paymentOrders/${orderId}`);
  const txRef = adminDb.doc(`transactions/${payment.payment_id}`);
  return adminDb.runTransaction(async tx => {
    const [orderSnap, existingTx] = await Promise.all([tx.get(orderRef), tx.get(txRef)]);
    if (!orderSnap.exists) throw new Error("Payment order not found.");
    const order = orderSnap.data()!;
    if (existingTx.exists) return { paid: true, type: order.type, adId: order.adId, alreadyProcessed: true, needsReview: existingTx.data()?.needsReview === true };
    if (payment.currency !== "USD" || !Number.isSafeInteger(payment.total_amount) || payment.total_amount < order.amountCents ||
        (order.providerPaymentId && order.providerPaymentId !== payment.payment_id) ||
        (order.providerTotal && order.providerTotal !== payment.total_amount)) throw new Error("Payment amount or currency mismatch.");
    const adRef = adminDb.doc(`ads/${order.adId}`);
    const userRef = adminDb.doc(`users/${order.uid}`);
    const ad = (await tx.get(adRef)).data();
    const now = new Date();
    const conflict = !ad || ad.advertiserUID !== order.uid || order.status === "cancelled" ||
      (ad.contentVersion ?? 0) !== order.contentVersion ||
      (order.type === "bid_upgrade" ? ad.status !== "active" || ad.dailyBidCents !== order.previousBidCents || milliseconds(ad.expiresAt) <= now.getTime()
      : order.type === "purchase" ? ad.status !== "pending" : !(ad.status === "expired" || (ad.status === "active" && milliseconds(ad.expiresAt) <= now.getTime())));
    tx.create(txRef, { uid: order.uid, adId: order.adId, orderId, type: order.type, amountCents: payment.total_amount,
      currency: "USD", externalTxId: payment.payment_id, paymentMethod: "card", needsReview: conflict, createdAt: FieldValue.serverTimestamp() });
    tx.update(orderRef, { status: conflict ? "needs_review" : "applied", providerPaymentId: payment.payment_id, paidAt: FieldValue.serverTimestamp() });
    tx.set(userRef, { totalSpentCents: FieldValue.increment(payment.total_amount) }, { merge: true });
    if (ad && ad.advertiserUID === order.uid) {
      const update: Record<string, unknown> = { externalTxId: payment.payment_id, paymentType: order.type,
        totalPaidCents: FieldValue.increment(payment.total_amount), paymentMethod: "card" };
      if (ad.pendingOrderId === orderId) { update.pendingOrderId = FieldValue.delete(); update.pendingPaymentId = FieldValue.delete(); }
      if (conflict) update.paymentReviewRequired = true;
      else if (order.type === "bid_upgrade") update.dailyBidCents = order.dailyBidCents;
      // AI-moderated and paid ads go live immediately — there is no manual verification step
      else Object.assign(update, { dailyBidCents: order.dailyBidCents, durationDays: order.durationDays,
        status: "active", startsAt: now, expiresAt: new Date(now.getTime() + order.durationDays * DAY_MS) });
      tx.update(adRef, update);
    }
    return { paid: true, type: order.type, adId: order.adId, needsReview: conflict };
  });
}
