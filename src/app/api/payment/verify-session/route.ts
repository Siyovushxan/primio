import { NextRequest, NextResponse, after } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { applyPayment, notifyOutranked, paymentTypeFrom } from "@/lib/payments";

export const dynamic = "force-dynamic";

const DODO_BASE =
  process.env.DODO_LIVE_MODE === "true"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

// Called by the payment return page. The webhook applies the same payment;
// applyPayment() guarantees it is recorded only once whichever arrives first.
export async function POST(req: NextRequest) {
  const callerUid = await verifyFirebaseToken(req);
  if (!callerUid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { adId } = await req.json();
    if (typeof adId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(adId)) {
      return NextResponse.json({ error: "Missing adId" }, { status: 400 });
    }

    const adSnap = await adminDb.doc(`ads/${adId}`).get();
    if (!adSnap.exists) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }
    const ad = adSnap.data()!;
    if (ad.advertiserUID !== callerUid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paymentId: string = ad.pendingPaymentId || ad.externalTxId;
    if (!paymentId) {
      return NextResponse.json({ error: "Payment not initiated" }, { status: 400 });
    }

    // Already applied (by the webhook or an earlier visit) — no need to ask Dodo again
    if (!ad.pendingPaymentId && ad.externalTxId === paymentId) {
      return NextResponse.json({
        paid: true,
        type: paymentTypeFrom(ad.paymentType),
        adId,
        alreadyProcessed: true,
      });
    }

    const res = await fetch(`${DODO_BASE}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${process.env.DODO_API_KEY}` },
    });
    if (!res.ok) {
      console.error("Dodo get payment error:", await res.text());
      return NextResponse.json({ error: "To'lov ma'lumotini olib bo'lmadi" }, { status: 502 });
    }

    const payment = await res.json();
    if (payment.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const metadata = payment.metadata || {};
    if (metadata.adId !== adId || metadata.advertiserUID !== callerUid) {
      console.error(`verify-session: payment ${paymentId} metadata does not match ad ${adId}`);
      return NextResponse.json({ error: "Payment does not belong to this ad" }, { status: 409 });
    }

    const result = await applyPayment({
      paymentId,
      metadata,
      amountCents: Number(payment.total_amount) || 0,
      source: "verify",
    });

    if (result.bidUpgrade) {
      const upgrade = result.bidUpgrade;
      after(() => notifyOutranked(adId, upgrade).catch((err) => console.error("Outbid notify error:", err)));
    }

    if (result.outcome === "needs_review") {
      return NextResponse.json({
        paid: true,
        type: result.type,
        adId,
        needsReview: true,
        error: "To'lov qabul qilindi, lekin reklama holati o'zgargan. Jamoamiz tekshirib, siz bilan bog'lanadi.",
      });
    }

    return NextResponse.json({
      paid: true,
      type: result.type,
      adId,
      alreadyProcessed: result.outcome === "already_processed",
    });
  } catch (err: unknown) {
    console.error("Verify session error:", err);
    return NextResponse.json({ error: "To'lovni tekshirishda xato" }, { status: 500 });
  }
}
