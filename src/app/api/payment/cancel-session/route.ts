import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
export async function POST(req: NextRequest) {
  const uid = await verifyFirebaseToken(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { adId } = await req.json();
    if (typeof adId !== "string" || !/^[\w-]{1,128}$/.test(adId)) throw new Error("Invalid ad.");
    await adminDb.runTransaction(async tx => {
      const ref = adminDb.doc(`ads/${adId}`);
      const snap = await tx.get(ref);
      const ad = snap.data();
      if (!ad || ad.advertiserUID !== uid) throw new Error("Ad not found.");
      if (ad.pendingOrderId) {
        const orderRef = adminDb.doc(`paymentOrders/${ad.pendingOrderId}`);
        const order = await tx.get(orderRef);
        if (order.exists && ["pending", "creating"].includes(order.data()!.status)) tx.update(orderRef, { status: "cancelled" });
        tx.update(ref, { pendingOrderId: FieldValue.delete(), pendingPaymentId: FieldValue.delete() });
      }
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Could not cancel checkout." }, { status: 400 }); }
}