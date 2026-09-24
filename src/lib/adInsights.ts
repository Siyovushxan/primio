// What the dashboard tells an advertiser about each ad: rank in its category, what it
// costs to move up, and what needs attention. Pure functions over the ads already loaded;
// ranking and upgrade pricing follow adRules and /api/payment/create-session exactly.

import type { Ad } from "@/types";
import { DAY_MS, MIN_BID_INCREMENT_CENTS, rankAds } from "@/lib/adRules";

export const EXPIRING_SOON_DAYS = 3;

export interface AdInsight {
  ad: Ad;
  /** 1-based rank among active ads of the same category; null when the ad is not running */
  position: number | null;
  categorySize: number;
  /** Whole days left in the paid period (rounded up, like upgrade pricing); null when not running */
  daysLeft: number | null;
  /** Daily bid needed to pass the ad directly above; null at #1 or when not running */
  nextBidCents: number | null;
  /** One-off payment for that upgrade: (next bid − current bid) × days left */
  nextExtraCents: number | null;
  /** At #1: how far ahead of #2 the bid is; null otherwise */
  leadCents: number | null;
}

type Millis = { toMillis(): number } | null | undefined;
const ms = (t: Millis) => (t && typeof t.toMillis === "function" ? t.toMillis() : 0);

export function isRunning(ad: Ad, now: number): boolean {
  return ad.status === "active" && ms(ad.expiresAt as Millis) > now;
}

export function buildInsights(myAds: Ad[], activeAds: Ad[], now: number = Date.now()): AdInsight[] {
  const byCategory = new Map<string, Ad[]>();
  for (const a of activeAds) {
    if (a.status !== "active") continue;
    const list = byCategory.get(a.category) || [];
    list.push(a);
    byCategory.set(a.category, list);
  }
  const ranked = new Map<string, Ad[]>();
  for (const [cat, list] of byCategory) ranked.set(cat, rankAds(list, now));

  return myAds.map((ad): AdInsight => {
    const list = ranked.get(ad.category) || [];
    const base: AdInsight = {
      ad,
      position: null,
      categorySize: list.length,
      daysLeft: null,
      nextBidCents: null,
      nextExtraCents: null,
      leadCents: null,
    };
    if (!isRunning(ad, now)) return base;

    const idx = list.findIndex((a) => a.id === ad.id);
    const daysLeft = Math.max(1, Math.ceil((ms(ad.expiresAt as Millis) - now) / DAY_MS));
    if (idx < 0) return { ...base, daysLeft };

    const insight: AdInsight = { ...base, position: idx + 1, daysLeft };
    if (idx === 0) {
      const second = list[1];
      insight.leadCents = second ? ad.dailyBidCents - second.dailyBidCents : null;
    } else {
      const above = list[idx - 1];
      // Must beat the bid above, and an upgrade must add at least the minimum increment
      const next = Math.max(above.dailyBidCents, ad.dailyBidCents) + MIN_BID_INCREMENT_CENTS;
      insight.nextBidCents = next;
      insight.nextExtraCents = (next - ad.dailyBidCents) * daysLeft;
    }
    return insight;
  });
}

export type AttentionKind = "pay" | "expiring" | "outranked" | "expired" | "rejected" | "review";

export interface AttentionItem {
  kind: AttentionKind;
  insight: AdInsight;
}

const ORDER: AttentionKind[] = ["pay", "expiring", "outranked", "expired", "rejected", "review"];

/** Everything the advertiser should act on, most urgent first. */
export function attentionItems(insights: AdInsight[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const i of insights) {
    const { ad } = i;
    if (ad.status === "pending") items.push({ kind: "pay", insight: i });
    else if (ad.status === "rejected") items.push({ kind: "rejected", insight: i });
    else if (ad.status === "pending_verification") items.push({ kind: "review", insight: i });
    else if (ad.status === "expired" || (ad.status === "active" && i.daysLeft === null)) {
      items.push({ kind: "expired", insight: i });
    } else if (i.daysLeft !== null) {
      if (i.daysLeft <= EXPIRING_SOON_DAYS) items.push({ kind: "expiring", insight: i });
      if (i.position !== null && i.position > 1) items.push({ kind: "outranked", insight: i });
    }
  }
  return items.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}

export interface Totals {
  impressions: number;
  clicks: number;
  ctr: number; // percent
}

export function totals(ads: Ad[]): Totals {
  const impressions = ads.reduce((n, a) => n + (a.impressions || 0), 0);
  const clicks = ads.reduce((n, a) => n + (a.clicks || 0), 0);
  return { impressions, clicks, ctr: impressions > 0 ? (clicks / impressions) * 100 : 0 };
}
