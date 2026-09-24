// Single source of truth for ad business rules — used by API routes and UI.
// Client-safe: no Node or firebase-admin imports.

import { CATEGORIES, type Category } from "@/types";

export const MIN_DAILY_BID_CENTS = 100;          // $1/day
export const MAX_DAILY_BID_CENTS = 1_000_000;    // $10,000/day sanity cap
export const MIN_BID_INCREMENT_CENTS = 50;       // bid upgrade must add at least $0.50/day
export const MIN_DURATION_DAYS = 1;
export const MAX_DURATION_DAYS = 365;
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 200;
export const URL_MAX = 2048;
export const DAY_MS = 86_400_000;

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

export function isValidCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORY_KEYS as string[]).includes(v);
}

export function isValidDuration(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= MIN_DURATION_DAYS && (v as number) <= MAX_DURATION_DAYS;
}

export function isValidDailyBid(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= MIN_DAILY_BID_CENTS && (v as number) <= MAX_DAILY_BID_CENTS;
}

export function isValidHttpsUrl(v: unknown): v is string {
  if (typeof v !== "string" || v.length > URL_MAX) return false;
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
}

export interface AdContent {
  title: string;
  description: string;
  destinationURL: string;
  imageURL: string;
}

export interface AdInput extends AdContent {
  category: Category;
  dailyBidCents: number;
  durationDays: number;
}

/** Normalizes moderated content so the moderation route and the save routes hash identical values. */
export function normalizeAdContent(raw: Partial<Record<keyof AdContent, unknown>>): AdContent {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    title: str(raw.title),
    description: str(raw.description),
    destinationURL: str(raw.destinationURL),
    imageURL: str(raw.imageURL),
  };
}

export function validateAdInput(
  raw: Record<string, unknown>,
): { ok: true; value: AdInput } | { ok: false; error: string } {
  const content = normalizeAdContent(raw);
  const dailyBidCents = Number(raw.dailyBidCents);
  const durationDays = Number(raw.durationDays);

  if (!content.title) return { ok: false, error: "Title is required" };
  if (content.title.length > TITLE_MAX) return { ok: false, error: `Title must be at most ${TITLE_MAX} characters` };
  if (content.description.length > DESCRIPTION_MAX) {
    return { ok: false, error: `Description must be at most ${DESCRIPTION_MAX} characters` };
  }
  if (!isValidHttpsUrl(content.destinationURL)) return { ok: false, error: "URL must start with https://" };
  if (content.imageURL && !isValidHttpsUrl(content.imageURL)) return { ok: false, error: "Invalid image URL" };
  if (!isValidCategory(raw.category)) return { ok: false, error: "Invalid category" };
  if (!isValidDailyBid(dailyBidCents)) {
    return { ok: false, error: `Daily bid must be a whole number of cents, at least ${MIN_DAILY_BID_CENTS}` };
  }
  if (!isValidDuration(durationDays)) {
    return { ok: false, error: `Duration must be ${MIN_DURATION_DAYS}–${MAX_DURATION_DAYS} days` };
  }

  return { ok: true, value: { ...content, category: raw.category, dailyBidCents, durationDays } };
}

// ── Ranking ────────────────────────────────────────────────────────────────
// One ordering for the catalog, the dashboard and outbid e-mails:
//   1. higher daily bid first
//   2. equal bids: the ad whose paid period has not ended ranks above one that has
//   3. still equal: earlier activation (startsAt, falling back to createdAt) wins
//   4. still equal: id, so the order is stable everywhere

type TimestampLike = { toMillis(): number } | Date | null | undefined;

export interface RankableAd {
  id: string;
  dailyBidCents: number;
  startsAt?: TimestampLike;
  expiresAt?: TimestampLike;
  createdAt?: TimestampLike;
}

function toMillis(t: TimestampLike): number | null {
  if (!t) return null;
  if (t instanceof Date) return t.getTime();
  return typeof t.toMillis === "function" ? t.toMillis() : null;
}

export function compareAdRank(a: RankableAd, b: RankableAd, now: number = Date.now()): number {
  const bidDiff = (b.dailyBidCents || 0) - (a.dailyBidCents || 0);
  if (bidDiff !== 0) return bidDiff;

  const aFresh = (toMillis(a.expiresAt) ?? 0) > now;
  const bFresh = (toMillis(b.expiresAt) ?? 0) > now;
  if (aFresh !== bFresh) return aFresh ? -1 : 1;

  const aStart = toMillis(a.startsAt) ?? toMillis(a.createdAt) ?? Number.MAX_SAFE_INTEGER;
  const bStart = toMillis(b.startsAt) ?? toMillis(b.createdAt) ?? Number.MAX_SAFE_INTEGER;
  if (aStart !== bStart) return aStart - bStart;

  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function rankAds<T extends RankableAd>(ads: T[], now: number = Date.now()): T[] {
  return ads.slice().sort((a, b) => compareAdRank(a, b, now));
}
