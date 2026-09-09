import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia" as any,
});

export async function POST(req: NextRequest) {
  try {
    const { adId, amount, method } = await req.json();

    if (!adId || !amount) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify the ad exists and is in pending status
    const adSnap = await getDoc(doc(db, "ads", adId));
    if (!adSnap.exists()) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }
    const ad = adSnap.data();
    if (ad.status !== "pending") {
      return NextResponse.json({ error: "Ad is not in pending status" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount, // already in cents
            product_data: {
              name: `PRIMIO Reklama — ${ad.title}`,
              description: `${ad.durationDays} kunlik reklama · ${ad.category} toifasi`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        adId,
        advertiserUID: ad.advertiserUID,
      },
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&adId=${adId}`,
      cancel_url: `${baseUrl}/ads/${adId}/pay`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
