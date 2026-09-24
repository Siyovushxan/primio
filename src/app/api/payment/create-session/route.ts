import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifiedIdentity } from "@/lib/verifyFirebaseToken";
import { quotePayment, type PaymentKind, type QuotedAd } from "@/lib/auction";
import { dodoRequest } from "@/lib/payments";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const user = await verifiedIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let orderId: string | undefined;
  let reservedAdId: string | undefined;
  try {
    const body = await req.json();
    const { adId, newDailyBidCents, durationDays } = body;
    const type: PaymentKind = body.type ?? "purchase";
    if (typeof adId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(adId) || !["purchase","renewal","bid_upgrade"].includes(type)) throw new Error("Invalid payment request.");
    const orderRef = adminDb.collection("paymentOrders").doc();
    const adRef = adminDb.doc(`ads/${adId}`);
    const result = await adminDb.runTransaction(async tx => {
      const snap = await tx.get(adRef);
      if (!snap.exists || snap.data()!.advertiserUID !== user.uid) throw new Error("Ad not found.");
      const ad = snap.data()!;
      const quote = quotePayment(ad as QuotedAd, type, newDailyBidCents, durationDays);
      if (ad.pendingOrderId) {
        const previous = await tx.get(adminDb.doc(`paymentOrders/${ad.pendingOrderId}`));
        if (previous.exists && ["pending", "creating"].includes(previous.data()!.status)) {
          const old = previous.data()!;
          if (old.type !== quote.type || old.dailyBidCents !== quote.dailyBidCents || old.durationDays !== quote.durationDays || old.contentVersion !== quote.contentVersion) throw new Error("Cancel the previous checkout before changing your order.");
          if (old.checkoutUrl) return { url: old.checkoutUrl as string };
          throw new Error("Checkout is being created. Please try again shortly.");
        }
      }
      tx.create(orderRef, { ...quote, uid: user.uid, adId, status: "creating", createdAt: FieldValue.serverTimestamp() });
      tx.update(adRef, { pendingOrderId: orderRef.id });
      return { quote, title: ad.title as string };
    });
    if ("url" in result) return NextResponse.json({ url: result.url });
    orderId = orderRef.id; reservedAdId = adId;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.primio.com.uz";
    if (!process.env.DODO_PRODUCT_ID) throw new Error("Payment product is not configured.");
    const data = await dodoRequest("/payments", {
      billing: { country: "UZ" }, billing_currency: "USD", customer: { name: result.title, email: user.email },
      product_cart: [{ product_id: process.env.DODO_PRODUCT_ID, quantity: 1, amount: result.quote!.amountCents }],
      metadata: { orderId, adId, advertiserUID: user.uid, type }, payment_link: true,
      return_url: `${baseUrl}/payment/success?adId=${adId}&orderId=${orderId}`
    });
    if (!data.payment_link || !data.payment_id) throw new Error("Could not create checkout.");
    await adminDb.runTransaction(async tx => {
      const snap = await tx.get(orderRef);
      const currentAd = await tx.get(adRef);
      tx.update(orderRef, { providerPaymentId: data.payment_id, providerTotal: data.total_amount,
        checkoutUrl: data.payment_link, ...(snap.data()?.status === "creating" ? { status: "pending" } : {}) });
      if (currentAd.data()?.pendingOrderId === orderId) tx.update(adRef, { pendingPaymentId: data.payment_id });
    });
    return NextResponse.json({ url: data.payment_link });
  } catch (error) {
    if (orderId && reservedAdId) {
      await adminDb.runTransaction(async tx => {
        const adRef = adminDb.doc(`ads/${reservedAdId}`);
        const snap = await tx.get(adRef);
        const orderRef = adminDb.doc(`paymentOrders/${orderId}`);
        const order = await tx.get(orderRef);
        if (order.data()?.status === "creating") {
          tx.update(orderRef, { status: "cancelled" });
          if (snap.data()?.pendingOrderId === orderId) tx.update(adRef, { pendingOrderId: FieldValue.delete() });
        }
      }).catch(console.error);
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment failed." }, { status: 400 });
  }
}
