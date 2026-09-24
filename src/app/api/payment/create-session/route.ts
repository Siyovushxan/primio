import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { DAY_MS, MIN_BID_INCREMENT_CENTS, isValidDailyBid, isValidDuration } from "@/lib/adRules";
import { paymentTypeFrom } from "@/lib/payments";

export const dynamic = "force-dynamic";

const DODO_BASE =
  process.env.DODO_LIVE_MODE === "true"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

const DODO_PRODUCT_ID = process.env.DODO_PRODUCT_ID || "pdt_0NnMK7juPTBBNjaJIZmgz";

export async function POST(req: NextRequest) {
  const callerUid = await verifyFirebaseToken(req);
  if (!callerUid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { adId } = body;
    const type = paymentTypeFrom(body.type);

    if (typeof adId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(adId)) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const adSnap = await adminDb.doc(`ads/${adId}`).get();
    if (!adSnap.exists) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }
    const ad = adSnap.data()!;

    // Verify caller owns this ad
    if (ad.advertiserUID !== callerUid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate status and inputs per payment type, then compute amount server-side.
    // What is paid for (bid and days) goes into the payment metadata, and that is
    // what gets applied — later edits to the ad cannot change a paid order.
    let amount: number;
    let paidBidCents: number;
    let paidDays: number | null = null;
    if (type === "bid_upgrade") {
      const expiresMs: number = ad.expiresAt?.toMillis?.() ?? 0;
      if (ad.status !== "active" || expiresMs <= Date.now()) {
        return NextResponse.json({ error: "Ad is not active" }, { status: 400 });
      }
      paidBidCents = Number(body.newDailyBidCents);
      if (!isValidDailyBid(paidBidCents) || paidBidCents < ad.dailyBidCents + MIN_BID_INCREMENT_CENTS) {
        return NextResponse.json(
          { error: `New bid must be at least $${((ad.dailyBidCents + MIN_BID_INCREMENT_CENTS) / 100).toFixed(2)}/day` },
          { status: 400 },
        );
      }
      const remainingDays = Math.ceil((expiresMs - Date.now()) / DAY_MS);
      amount = (paidBidCents - ad.dailyBidCents) * remainingDays;
    } else if (type === "renewal") {
      if (ad.status !== "expired" && ad.status !== "active") {
        return NextResponse.json({ error: "Only active or expired ads can be renewed" }, { status: 400 });
      }
      paidDays = body.durationDays === undefined ? ad.durationDays : Number(body.durationDays);
      if (!isValidDuration(paidDays)) {
        return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
      }
      paidBidCents = ad.dailyBidCents;
      amount = paidBidCents * paidDays;
    } else {
      // purchase — new ad awaiting first payment; only AI-approved content can be paid for
      if (ad.status !== "pending") {
        return NextResponse.json({ error: "Ad is not in pending status" }, { status: 400 });
      }
      if (ad.moderationPassed !== true) {
        return NextResponse.json({ error: "Ad has not passed moderation" }, { status: 403 });
      }
      paidDays = ad.durationDays;
      paidBidCents = ad.dailyBidCents;
      if (!isValidDuration(paidDays) || !isValidDailyBid(paidBidCents)) {
        return NextResponse.json({ error: "Ad has an invalid bid or duration — please edit it" }, { status: 400 });
      }
      amount = paidBidCents * paidDays;
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    // Get user email for Dodo customer record
    let customerEmail = `user_${ad.advertiserUID}@primio.com.uz`;
    try {
      const userSnap = await adminDb.doc(`users/${ad.advertiserUID}`).get();
      if (userSnap.exists && userSnap.data()?.email) {
        customerEmail = userSnap.data()!.email;
      }
    } catch {}

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.primio.com.uz";

    const res = await fetch(`${DODO_BASE}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DODO_API_KEY}`,
      },
      body: JSON.stringify({
        billing: { country: "UZ" },
        customer: {
          name: ad.title || "PRIMIO Customer",
          email: customerEmail,
        },
        product_cart: [
          {
            product_id: DODO_PRODUCT_ID,
            quantity: 1,
            amount, // override product price with actual amount in cents
          },
        ],
        metadata: {
          adId,
          advertiserUID: ad.advertiserUID,
          type,
          dailyBidCents: String(paidBidCents),
          durationDays: paidDays === null ? "" : String(paidDays),
          amountCents: String(amount),
          // kept for payments created before dailyBidCents was added
          newDailyBidCents: type === "bid_upgrade" ? String(paidBidCents) : "",
        },
        payment_link: true,
        return_url: `${baseUrl}/payment/success?adId=${adId}`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Dodo create payment error:", err);
      return NextResponse.json({ error: "To'lov yaratishda xato" }, { status: 500 });
    }

    const data = await res.json();

    if (!data.payment_link) {
      return NextResponse.json({ error: "To'lov havolasi yaratilmadi" }, { status: 500 });
    }

    // Pre-save payment_id to Firestore so verify-session can look it up
    await adminDb.doc(`ads/${adId}`).update({ pendingPaymentId: data.payment_id });

    return NextResponse.json({ url: data.payment_link });
  } catch (err: unknown) {
    console.error("Create session error:", err);
    return NextResponse.json({ error: "To'lov yaratishda xato" }, { status: 500 });
  }
}
