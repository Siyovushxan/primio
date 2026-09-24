export const MIN_BID_CENTS = 100;
export const MAX_BID_CENTS = 1_000_000;
export const DAY_MS = 86_400_000;
export const CATEGORY_IDS = ["technology", "food", "fashion", "education", "health", "real_estate", "entertainment", "other"] as const;
export type PaymentKind = "purchase" | "renewal" | "bid_upgrade";
type DateValue = { toMillis?: () => number; toDate?: () => Date; seconds?: number } | string | number | null | undefined;
export function milliseconds(value: DateValue): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Date.parse(value) || 0;
  return value?.toMillis?.() ?? value?.toDate?.().getTime() ?? (value?.seconds ?? 0) * 1000;
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
  if (!title || title.length > 60 || description.length > 200) throw new Error("Title: 1–60 characters. Description: up to 200.");
  if (!CATEGORY_IDS.includes(body.category as typeof CATEGORY_IDS[number])) throw new Error("Choose a category.");
  if (!validBid(body.dailyBidCents)) throw new Error("Daily bid must be $1–$10,000, in whole cents.");
  if (!validDuration(body.durationDays)) throw new Error("Choose a duration of 1–365 whole days.");
  return { title, description, destinationURL: publicWebsite(body.destinationURL), imageURL: publicWebsite(body.imageURL),
    category: body.category as typeof CATEGORY_IDS[number], dailyBidCents: body.dailyBidCents, durationDays: body.durationDays };
}
export interface Rankable { id: string; dailyBidCents: number; status?: string; startsAt?: DateValue; createdAt?: DateValue; expiresAt?: DateValue }
export function rankAds<T extends Rankable>(ads: T[], now = Date.now()): T[] {
  return ads.filter(ad => (!ad.status || ad.status === "active") && milliseconds(ad.expiresAt) > now)
    .sort((a, b) => b.dailyBidCents - a.dailyBidCents ||
      (milliseconds(a.startsAt) || milliseconds(a.createdAt)) - (milliseconds(b.startsAt) || milliseconds(b.createdAt)) || a.id.localeCompare(b.id));
}
export interface QuotedAd { status: string; dailyBidCents: number; durationDays: number; expiresAt?: DateValue; moderationPassed?: boolean; contentVersion?: number; paymentReviewRequired?: boolean }
export function quotePayment(ad: QuotedAd, type: PaymentKind, newBid?: unknown, duration?: unknown, now = Date.now()) {
  if (ad.paymentReviewRequired) throw new Error("A previous payment needs review. Do not pay again.");
  if (!ad.moderationPassed) throw new Error("Moderation approval is required.");
  if (!validBid(ad.dailyBidCents)) throw new Error("Invalid daily bid.");
  let dailyBidCents = ad.dailyBidCents;
  let durationDays = ad.durationDays;
  let amountCents: number;
  if (type === "bid_upgrade") {
    if (ad.status !== "active" || milliseconds(ad.expiresAt) <= now) throw new Error("This ad is no longer active.");
    if (!validBid(newBid) || newBid <= ad.dailyBidCents) throw new Error("The new bid must exceed the current bid.");
    durationDays = Math.ceil((milliseconds(ad.expiresAt) - now) / DAY_MS);
    dailyBidCents = newBid;
    amountCents = (newBid - ad.dailyBidCents) * durationDays;
  } else {
    if (type === "purchase" && ad.status !== "pending") throw new Error("This ad is not awaiting payment.");
    if (type === "renewal" && ad.status !== "expired" && !(ad.status === "active" && milliseconds(ad.expiresAt) <= now)) throw new Error("Only expired ads can be renewed.");
    if (type === "renewal") durationDays = duration as number;
    if (!validDuration(durationDays)) throw new Error("Choose a duration of 1–365 whole days.");
    amountCents = dailyBidCents * durationDays;
  }
  return { type, amountCents, dailyBidCents, previousBidCents: ad.dailyBidCents, durationDays, contentVersion: ad.contentVersion ?? 0, currency: "USD" };
}
