import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

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

    return NextResponse.json({
      paid: true,
      adId: session.metadata?.adId,
      advertiserUID: session.metadata?.advertiserUID,
      amountTotal: session.amount_total,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error("Verify session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
