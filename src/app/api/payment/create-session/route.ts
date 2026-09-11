import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia" as any,
});

export async function POST(req: NextRequest) {
  try {
    const { adId, amount, type, newDailyBidCents } = await req.json();

    if (!adId || !amount) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const adSnap = await adminDb.doc(`ads/${adId}`).get();
    if (!adSnap.exists) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }
    const ad = adSnap.data()!;

    const isBidUpgrade = type === "bid_upgrade";

    if (isBidUpgrade) {
      if (ad.status !== "active") {
        return NextResponse.json({ error: "Ad is not active" }, { status: 400 });
      }
    } else {
      if (ad.status !== "pending") {
        return NextResponse.json({ error: "Ad is not in pending status" }, { status: 400 });
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://primio.com.uz";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: `PRIMIO Reklama — ${ad.title}`,
              description: isBidUpgrade
                ? `Bid oshirish: $${(ad.dailyBidCents / 100).toFixed(2)} → $${((newDailyBidCents || 0) / 100).toFixed(2)}/kun`
                : `${ad.durationDays} kunlik reklama · ${ad.category} toifasi`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        adId,
        advertiserUID: ad.advertiserUID,
        type: isBidUpgrade ? "bid_upgrade" : "purchase",
        newDailyBidCents: String(newDailyBidCents || ""),
      },
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&adId=${adId}`,
      cancel_url: isBidUpgrade ? `${baseUrl}/ads/${adId}/bid` : `${baseUrl}/ads/${adId}/pay`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
