export const MIN_BID_CENTS = 100;
export const MAX_BID_CENTS = 1_000_000;
export const DAY_MS = 86_400_000;
export const TOP_HOLD_MS = 7 * DAY_MS; // 168 hours, confirmed by the product owner.
export const TOP_DECAY_MS = DAY_MS;
export const RANKING_VERSION = 2;
export const CATEGORY_IDS = ["technology", "food", "fashion", "education", "health", "real_estate", "entertainment", "other"] as const;
export type PaymentKind = "purchase" | "renewal" | "bid_upgrade";
type DateValue = Date | { toMillis?: () => number; toDate?: () => Date; seconds?: number } | string | number | null | undefined;
export function milliseconds(value: DateValue): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Date.parse(value) || 0;
  if (value instanceof Date) return value.getTime();
  return value?.toMillis?.() ?? value?.toDate?.().getTime() ?? (value?.seconds ?? 0) * 1000;
}
export function effectiveBidCents(ad: { dailyBidCents: number; trialBidCents?: number; trialBidUntil?: DateValue }, now = Date.now()): number {
  return Number.isSafeInteger(ad.trialBidCents) && (ad.trialBidCents as number) > 0 && milliseconds(ad.trialBidUntil) > now
    ? ad.trialBidCents as number
    : ad.dailyBidCents;
}
export interface RankingBid {
  dailyBidCents: number; trialBidCents?: number; trialBidUntil?: DateValue;
  rankingVersion?: number; rankingBidAt?: DateValue;
}
// Ranking strength is separate from the daily price already paid. Never discount
// an invoice or use this value when computing a bid-upgrade charge.
export function rankingBidCents(ad: RankingBid, now = Date.now()): number {
  const bid = effectiveBidCents(ad, now);
  const anchor = milliseconds(ad.rankingBidAt);
  if (ad.rankingVersion !== RANKING_VERSION || !Number.isFinite(anchor) || anchor <= 0 ||
      (milliseconds(ad.trialBidUntil) > now && ad.trialBidCents)) return bid;
  const hours = Math.floor(Math.max(0, now - anchor - TOP_HOLD_MS) / 3_600_000);
  const remaining = Math.max(0, 1 - hours / (TOP_DECAY_MS / 3_600_000));
  return Math.max(MIN_BID_CENTS, MIN_BID_CENTS + Math.ceil((bid - MIN_BID_CENTS) * remaining));
}
export function validBid(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= MIN_BID_CENTS && value <= MAX_BID_CENTS;
}
export function validDuration(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1 && value <= 365;
}
export function publicWebsite(value: unknown): string {
  if (typeof value !== "string" || value.length > 2048) throw new Error("Enter a valid HTTPS website.");
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") ||
      !host.includes(".") || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost") ||
      host.includes(":") || /^\d+(\.\d+){3}$/.test(host)) throw new Error("Enter a public HTTPS website.");
  return url.href;
}
export function validateAdInput(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!title || title.length > 60 || description.length > 500) throw new Error("Title: 1–60 characters. Description: up to 500.");
  if (!CATEGORY_IDS.includes(body.category as typeof CATEGORY_IDS[number])) throw new Error("Choose a category.");
  if (!validBid(body.dailyBidCents)) throw new Error("Daily bid must be $1–$10,000, in whole cents.");
  if (!validDuration(body.durationDays)) throw new Error("Choose a duration of 1–365 whole days.");
  return { title, description, destinationURL: publicWebsite(body.destinationURL), imageURL: publicWebsite(body.imageURL),
    category: body.category as typeof CATEGORY_IDS[number], dailyBidCents: body.dailyBidCents, durationDays: body.durationDays };
}
export interface Rankable extends RankingBid { id: string; status?: string; startsAt?: DateValue; createdAt?: DateValue; expiresAt?: DateValue }
export function rankAds<T extends Rankable>(ads: T[], now = Date.now()): T[] {
  return ads.filter(ad => (!ad.status || ad.status === "active") && milliseconds(ad.expiresAt) > now)
    .sort((a, b) => rankingBidCents(b, now) - rankingBidCents(a, now) ||
      (milliseconds(a.startsAt) || milliseconds(a.createdAt)) - (milliseconds(b.startsAt) || milliseconds(b.createdAt)) || a.id.localeCompare(b.id));
}
export function topBidCents(ads: Rankable[], now = Date.now(), excludeId?: string): number | null {
  const first = rankAds(ads.filter(ad => ad.id !== excludeId), now)[0];
  const minimum = first ? rankingBidCents(first, now) + 1 : MIN_BID_CENTS;
  return minimum <= MAX_BID_CENTS ? minimum : null;
}
export function estimatedPosition(ads: Rankable[], bidCents: number, now = Date.now(), excludeId?: string): number {
  const existing = excludeId ? ads.find(ad => ad.id === excludeId) : undefined;
  const candidate: Rankable = {id: excludeId || "~new-ad",dailyBidCents:bidCents,status:"active",
    startsAt:existing?.startsAt || now,createdAt:existing?.createdAt || now,expiresAt:existing?.expiresAt || now + DAY_MS};
  return rankAds([...ads.filter(ad => ad.id !== excludeId),candidate],now)
    .findIndex(ad => ad === candidate) + 1;
}
export interface QuotedAd { status: string; dailyBidCents: number; trialBidCents?: number; trialBidUntil?: DateValue; durationDays: number; expiresAt?: DateValue; moderationPassed?: boolean; contentVersion?: number; paymentReviewRequired?: boolean }
export function quotePayment(ad: QuotedAd, type: PaymentKind, newBid?: unknown, duration?: unknown, now = Date.now()) {
  if (ad.paymentReviewRequired) throw new Error("A previous payment needs review. Do not pay again.");
  if (!ad.moderationPassed) throw new Error("Moderation approval is required.");
  const currentBidCents = effectiveBidCents(ad, now);
  if (!validBid(currentBidCents)) throw new Error("Invalid daily bid.");
  let dailyBidCents = currentBidCents;
  let durationDays = ad.durationDays;
  let amountCents: number;
  if (type === "bid_upgrade") {
    if (ad.status !== "active" || milliseconds(ad.expiresAt) <= now) throw new Error("This ad is no longer active.");
    if (!validBid(newBid) || newBid <= currentBidCents) throw new Error("The new bid must exceed the current bid.");
    durationDays = Math.ceil((milliseconds(ad.expiresAt) - now) / DAY_MS);
    dailyBidCents = newBid;
    amountCents = (newBid - currentBidCents) * durationDays;
  } else {
    if (type === "purchase" && ad.status !== "pending") throw new Error("This ad is not awaiting payment.");
    if (type === "renewal" && ad.status !== "expired" && !(ad.status === "active" && milliseconds(ad.expiresAt) <= now)) throw new Error("Only expired ads can be renewed.");
    if (type === "renewal") {
      durationDays = duration as number;
      if (newBid !== undefined) {
        if (!validBid(newBid)) throw new Error("Daily bid must be $1–$10,000, in whole cents.");
        dailyBidCents = newBid;
      }
    }
    if (!validDuration(durationDays)) throw new Error("Choose a duration of 1–365 whole days.");
    amountCents = dailyBidCents * durationDays;
  }
  return { type, amountCents, dailyBidCents, previousBidCents: currentBidCents, durationDays, contentVersion: ad.contentVersion ?? 0, currency: "USD" };
}
