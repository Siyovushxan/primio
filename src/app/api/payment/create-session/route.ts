import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const DODO_BASE =
  process.env.DODO_LIVE_MODE === "true"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

const DODO_PRODUCT_ID = process.env.DODO_PRODUCT_ID || "pdt_0NnMK7juPTBBNjaJIZmgz";

export async function POST(req: NextRequest) {
  // Verify caller is authenticated
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let callerUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const { adId, type, newDailyBidCents, durationDays } = await req.json();

    if (!adId) {
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

    // Validate status and inputs per payment type, then compute amount server-side
    let amount: number;
    if (type === "bid_upgrade") {
      if (ad.status !== "active") {
        return NextResponse.json({ error: "Ad is not active" }, { status: 400 });
      }
      const newBid = Number(newDailyBidCents);
      if (!newBid || newBid <= ad.dailyBidCents) {
        return NextResponse.json({ error: "New bid must exceed current bid" }, { status: 400 });
      }
      const expiresAt: Date = ad.expiresAt?.toDate?.() ?? new Date();
      const remainingDays = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000));
      amount = (newBid - ad.dailyBidCents) * remainingDays;
    } else if (type === "renewal") {
      if (ad.status !== "expired") {
        return NextResponse.json({ error: "Only expired ads can be renewed" }, { status: 400 });
      }
      const days = Math.max(1, Number(durationDays) || ad.durationDays);
      amount = ad.dailyBidCents * days;
    } else {
      // purchase — new ad awaiting first payment
      if (ad.status !== "pending") {
        return NextResponse.json({ error: "Ad is not in pending status" }, { status: 400 });
      }
      amount = ad.dailyBidCents * ad.durationDays;
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
          type: type === "bid_upgrade" ? "bid_upgrade" : type === "renewal" ? "renewal" : "purchase",
          newDailyBidCents: String(newDailyBidCents || ""),
          durationDays: String(durationDays || ""),
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
  } catch (err: any) {
    console.error("Create session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
