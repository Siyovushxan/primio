// Applies a succeeded Dodo payment to Firestore exactly once.
// Both the webhook and the return-page verification call applyPayment(); the
// transaction document id is the payment id, so concurrent calls serialize in a
// Firestore transaction and only the first one writes.

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { DocumentData } from "firebase-admin/firestore";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebaseAdmin";
import { outbidEmail } from "@/lib/emailTemplates";
import { DAY_MS, compareAdRank, isValidDailyBid, isValidDuration, type RankableAd } from "@/lib/adRules";

export type PaymentType = "purchase" | "renewal" | "bid_upgrade";

export interface ApplyPaymentResult {
  outcome: "applied" | "already_processed" | "needs_review";
  type: PaymentType;
  adId: string;
  advertiserUID: string;
  /** Set when a bid upgrade was applied, for outbid notifications. */
  bidUpgrade?: { category: string; oldBidCents: number; newBidCents: number };
}

function intFrom(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isInteger(n) ? n : null;
}

export function paymentTypeFrom(v: unknown): PaymentType {
  return v === "bid_upgrade" || v === "renewal" ? v : "purchase";
}

export async function applyPayment({
  paymentId,
  metadata,
  amountCents,
  source,
}: {
  paymentId: string;
  metadata: Record<string, unknown>;
  amountCents: number;
  source: "webhook" | "verify";
}): Promise<ApplyPaymentResult> {
  const adId = String(metadata.adId || "");
  const advertiserUID = String(metadata.advertiserUID || "");
  const type = paymentTypeFrom(metadata.type);
  const idOk = (s: string) => /^[A-Za-z0-9_-]{1,128}$/.test(s);
  if (!idOk(paymentId) || !idOk(adId) || !idOk(advertiserUID)) {
    throw new Error(`Payment ${paymentId} has incomplete metadata`);
  }

  const txRef = adminDb.doc(`transactions/${paymentId}`);
  const adRef = adminDb.doc(`ads/${adId}`);
  const userRef = adminDb.doc(`users/${advertiserUID}`);
  const base = { type, adId, advertiserUID };

  return adminDb.runTransaction(async (tx): Promise<ApplyPaymentResult> => {
    const txSnap = await tx.get(txRef);
    // Payments recorded before transaction ids were keyed by payment id
    const legacySnap = await tx.get(
      adminDb.collection("transactions").where("externalTxId", "==", paymentId).limit(1),
    );
    const adSnap = await tx.get(adRef);

    if (txSnap.exists || !legacySnap.empty) return { ...base, outcome: "already_processed" };

    const now = Date.now();
    const record = {
      uid: advertiserUID,
      adId,
      type,
      amountCents,
      externalTxId: paymentId,
      paymentMethod: "card",
      source,
      createdAt: FieldValue.serverTimestamp(),
    };
    const recordSpend = () =>
      tx.set(userRef, { totalSpentCents: FieldValue.increment(amountCents) }, { merge: true });

    // Money was taken but the ad cannot be changed as paid for: keep the record, flag it for a refund decision.
    const needsReview = (note: string): ApplyPaymentResult => {
      tx.set(txRef, { ...record, needsReview: true, note });
      recordSpend();
      if (adSnap.exists && adSnap.data()!.pendingPaymentId === paymentId) {
        tx.update(adRef, { pendingPaymentId: FieldValue.delete() });
      }
      console.warn(`Payment ${paymentId} needs review: ${note}`);
      return { ...base, outcome: "needs_review" };
    };

    if (!adSnap.exists) return needsReview("Ad was deleted before the payment was processed");
    const ad = adSnap.data()!;
    if (ad.advertiserUID !== advertiserUID) return needsReview("Payment owner does not match the ad owner");

    const clearPending = ad.pendingPaymentId === paymentId ? { pendingPaymentId: FieldValue.delete() } : {};
    const expiresMs: number = ad.expiresAt?.toMillis?.() ?? 0;
    const paidDays = (() => {
      const d = intFrom(metadata.durationDays);
      return d !== null && isValidDuration(d) ? d : isValidDuration(ad.durationDays) ? ad.durationDays : null;
    })();
    let bidUpgrade: ApplyPaymentResult["bidUpgrade"];

    if (type === "purchase") {
      if (ad.status !== "pending") return needsReview(`Purchase paid while ad status was "${ad.status}"`);
      if (ad.moderationPassed !== true) return needsReview("Purchase paid for an ad without moderation approval");
      if (paidDays === null) return needsReview("Purchase has no valid duration");
      const bid = intFrom(metadata.dailyBidCents);
      // The paid-for price and duration come from the payment, not from the (editable) ad.
      tx.update(adRef, {
        status: "active",
        dailyBidCents: bid !== null && isValidDailyBid(bid) ? bid : ad.dailyBidCents,
        durationDays: paidDays,
        startsAt: Timestamp.fromMillis(now),
        expiresAt: Timestamp.fromMillis(now + paidDays * DAY_MS),
        totalPaidCents: FieldValue.increment(amountCents),
        externalTxId: paymentId,
        paymentMethod: "card",
        paymentType: type,
        ...clearPending,
      });
    } else if (type === "renewal") {
      if (ad.status !== "active" && ad.status !== "expired") {
        return needsReview(`Renewal paid while ad status was "${ad.status}"`);
      }
      if (paidDays === null) return needsReview("Renewal has no valid duration");
      // Still running: extend from the current end. Otherwise: a new period starts now.
      const running = ad.status === "active" && expiresMs > now;
      tx.update(adRef, {
        status: "active",
        ...(running ? {} : { startsAt: Timestamp.fromMillis(now) }),
        expiresAt: Timestamp.fromMillis((running ? expiresMs : now) + paidDays * DAY_MS),
        durationDays: running ? (ad.durationDays || 0) + paidDays : paidDays,
        totalPaidCents: FieldValue.increment(amountCents),
        externalTxId: paymentId,
        paymentMethod: "card",
        paymentType: type,
        ...clearPending,
      });
    } else {
      const newBid = intFrom(metadata.dailyBidCents) ?? intFrom(metadata.newDailyBidCents);
      if (ad.status !== "active" || expiresMs <= now) return needsReview("Bid upgrade paid after the ad stopped running");
      if (newBid === null || !isValidDailyBid(newBid) || newBid <= ad.dailyBidCents) {
        return needsReview("Bid upgrade no longer raises the bid");
      }
      tx.update(adRef, {
        dailyBidCents: newBid,
        totalPaidCents: FieldValue.increment(amountCents),
        externalTxId: paymentId,
        paymentType: type,
        ...clearPending,
      });
      bidUpgrade = { category: ad.category || "", oldBidCents: ad.dailyBidCents, newBidCents: newBid };
    }

    tx.set(txRef, record);
    recordSpend();
    return { ...base, outcome: "applied", bidUpgrade };
  });
}

// ── Outbid notification ─────────────────────────────────────────────────────
// E-mails owners of active ads in the same category that the upgraded ad just passed.

export async function notifyOutranked(adId: string, upgrade: NonNullable<ApplyPaymentResult["bidUpgrade"]>) {
  const { category, oldBidCents, newBidCents } = upgrade;
  if (!category || newBidCents <= oldBidCents) return;

  const snap = await adminDb
    .collection("ads")
    .where("category", "==", category)
    .where("status", "==", "active")
    .get();

  type Row = RankableAd & { data: DocumentData };
  const rows: Row[] = snap.docs.map((d) => ({ ...(d.data() as RankableAd), id: d.id, data: d.data() }));
  const now = Date.now();
  // 0-based positions with the upgraded ad at a given bid
  const positionsWithBid = (bid: number) =>
    new Map(
      rows
        .map((r) => (r.id === adId ? { ...r, dailyBidCents: bid } : r))
        .sort((a, b) => compareAdRank(a, b, now))
        .map((r, i) => [r.id, i]),
    );

  const before = positionsWithBid(oldBidCents);
  const after = positionsWithBid(newBidCents);
  const upBefore = before.get(adId);
  const upAfter = after.get(adId);
  if (upBefore === undefined || upAfter === undefined) return;

  // Was above the upgraded ad before, is below it now
  const outranked = rows.filter(
    (r) => r.id !== adId && before.get(r.id)! < upBefore && after.get(r.id)! > upAfter,
  );
  if (outranked.length === 0) return;

  const ownerUids = [...new Set(outranked.map((r) => r.data.advertiserUID).filter(Boolean))] as string[];
  const userDocs = await Promise.all(ownerUids.map((uid) => adminDb.doc(`users/${uid}`).get()));
  const owners = new Map(
    userDocs
      .filter((d) => d.exists)
      .map((d) => {
        const u = d.data()!;
        return [d.id, { email: u.email || "", name: u.displayName || "Advertiser", outbid: u.notifPrefs?.outbid !== false }];
      }),
  );

  const resend = new Resend(process.env.RESEND_API_KEY);
  const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  await Promise.all(
    outranked.map(async (r) => {
      const owner = owners.get(r.data.advertiserUID);
      if (!owner?.email || !owner.outbid) return;
      const { subject, html } = outbidEmail({
        advertiserName: owner.name,
        adTitle: r.data.title || "Reklama",
        category,
        yourBidUsd: usd(r.data.dailyBidCents || 0),
        winnerBidUsd: usd(newBidCents),
        adId: r.id,
        currentPosition: after.get(r.id)! + 1,
      });
      await resend.emails.send({ from: "PRIMIO <noreply@primio.com.uz>", to: owner.email, subject, html });
    }),
  );
}
