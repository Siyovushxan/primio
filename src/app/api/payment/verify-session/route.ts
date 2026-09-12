import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";
import { outbidEmail } from "@/lib/emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = "force-dynamic";

const DODO_BASE =
  process.env.DODO_LIVE_MODE === "true"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

export async function POST(req: NextRequest) {
  // Verify Firebase auth token
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
    const { adId } = await req.json();
    if (!adId) return NextResponse.json({ error: "Missing adId" }, { status: 400 });

    const adRef = adminDb.doc(`ads/${adId}`);
    const adSnap = await adRef.get();
    if (!adSnap.exists) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }
    const ad = adSnap.data()!;
    const oldBidCents: number = ad.dailyBidCents || 0;

    // Verify caller owns this ad
    if (ad.advertiserUID !== callerUid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paymentId = ad.pendingPaymentId || ad.externalTxId;
    if (!paymentId) {
      return NextResponse.json({ error: "Payment not initiated" }, { status: 400 });
    }

    // Idempotency: already processed
    if (ad.externalTxId === paymentId && ad.status !== "pending") {
      return NextResponse.json({
        paid: true,
        type: ad.paymentType || "purchase",
        adId,
        advertiserUID: ad.advertiserUID,
        alreadyProcessed: true,
      });
    }

    const res = await fetch(`${DODO_BASE}/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.DODO_API_KEY}` },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Dodo get payment error:", err);
      return NextResponse.json({ error: "To'lov ma'lumotini olib bo'lmadi" }, { status: 500 });
    }

    const payment = await res.json();

    if (payment.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const metadata = payment.metadata || {};
    const advertiserUID = metadata.advertiserUID || ad.advertiserUID;
    const type = metadata.type || "purchase";
    const newDailyBidCents = parseInt(metadata.newDailyBidCents || "0");
    const amountTotal = payment.total_amount || 0;

    if (type === "bid_upgrade") {
      await adRef.update({
        dailyBidCents: newDailyBidCents,
        externalTxId: paymentId,
        pendingPaymentId: FieldValue.delete(),
      });

      await adminDb.collection("transactions").add({
        uid: advertiserUID,
        adId,
        type: "bid_upgrade",
        amountCents: amountTotal,
        externalTxId: paymentId,
        paymentMethod: "card",
        createdAt: FieldValue.serverTimestamp(),
      });

      await adminDb.doc(`users/${advertiserUID}`).update({
        totalSpentCents: FieldValue.increment(amountTotal),
      });

      // Fire-and-forget: notify outranked advertisers in the same category
      notifyOutranked({
        adId,
        category: ad.category || "",
        adTitle: ad.title || "Reklama",
        oldBidCents,
        newBidCents: newDailyBidCents,
      }).catch((err) => console.error("Outbid notify error:", err));
    } else {
      const userSnap = await adminDb.doc(`users/${advertiserUID}`).get();
      const isNew = userSnap.exists ? userSnap.data()?.isNewAccount === true : false;
      const newStatus = isNew ? "pending_verification" : "active";

      const now = new Date();
      const expiresAt = new Date(now.getTime() + (ad.durationDays || 7) * 24 * 60 * 60 * 1000);

      await adRef.update({
        status: newStatus,
        startsAt: isNew ? null : FieldValue.serverTimestamp(),
        expiresAt: isNew ? null : expiresAt,
        totalPaidCents: amountTotal,
        externalTxId: paymentId,
        paymentMethod: "card",
        pendingPaymentId: FieldValue.delete(),
      });

      await adminDb.collection("transactions").add({
        uid: advertiserUID,
        adId,
        type: "purchase",
        amountCents: amountTotal,
        externalTxId: paymentId,
        paymentMethod: "card",
        createdAt: FieldValue.serverTimestamp(),
      });

      await adminDb.doc(`users/${advertiserUID}`).update({
        totalSpentCents: FieldValue.increment(amountTotal),
        isNewAccount: false,
      });
    }

    return NextResponse.json({ paid: true, type, adId, advertiserUID, amountTotal });
  } catch (err: any) {
    console.error("Verify session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Outbid notification (background, non-blocking) ───────────────────────────
async function notifyOutranked({
  adId,
  category,
  adTitle,
  oldBidCents,
  newBidCents,
}: {
  adId: string;
  category: string;
  adTitle: string;
  oldBidCents: number;
  newBidCents: number;
}) {
  if (!category || newBidCents <= oldBidCents) return;

  // Find active ads in same category whose bid is between old and new (they got bumped)
  const snap = await adminDb
    .collection("ads")
    .where("category", "==", category)
    .where("status", "==", "active")
    .get();

  const outranked = snap.docs.filter((doc) => {
    if (doc.id === adId) return false;
    const bid = doc.data().dailyBidCents || 0;
    return bid > oldBidCents && bid <= newBidCents;
  });

  if (outranked.length === 0) return;

  // Get all ads in category to compute new positions
  const allInCategory = snap.docs
    .map((d) => ({ id: d.id, bid: d.data().dailyBidCents || 0 }))
    .sort((a, b) => b.bid - a.bid);

  // Override the upgrader's bid in the sorted list for position calculation
  const upgraderIdx = allInCategory.findIndex((d) => d.id === adId);
  if (upgraderIdx !== -1) allInCategory[upgraderIdx].bid = newBidCents;
  allInCategory.sort((a, b) => b.bid - a.bid);

  const posMap: Record<string, number> = {};
  allInCategory.forEach((d, i) => { posMap[d.id] = i + 1; });

  // Fetch owner emails
  const ownerUids = [...new Set(outranked.map((d) => d.data().advertiserUID).filter(Boolean))];
  const userDocs = await Promise.all(ownerUids.map((uid) => adminDb.doc(`users/${uid}`).get()));
  const emailMap: Record<string, string> = {};
  const nameMap: Record<string, string> = {};
  userDocs.forEach((doc) => {
    if (doc.exists) {
      emailMap[doc.id] = doc.data()?.email || "";
      nameMap[doc.id] = doc.data()?.displayName || "Advertiser";
    }
  });

  const newBidUsd = `$${(newBidCents / 100).toFixed(2)}`;

  await Promise.all(
    outranked.map(async (doc) => {
      const d = doc.data();
      const ownerEmail = emailMap[d.advertiserUID];
      if (!ownerEmail) return;

      const { subject, html } = outbidEmail({
        advertiserName: nameMap[d.advertiserUID] || "Advertiser",
        adTitle: d.title || "Reklama",
        category,
        yourBidUsd: `$${((d.dailyBidCents || 0) / 100).toFixed(2)}`,
        winnerBidUsd: newBidUsd,
        adId: doc.id,
        currentPosition: posMap[doc.id] ?? 99,
      });

      await resend.emails.send({
        from: "PRIMIO <noreply@primio.com.uz>",
        to: ownerEmail,
        subject,
        html,
      });
    }),
  );
}
