"use client";

// Category picker + price calculator over the live ranking. The expected rank uses
// the catalog's own ranking rule, treating the new ad as the most recent placement.

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Ad, Category } from "@/types";
import { CATEGORIES } from "@/types";
import {
  CATEGORY_KEYS,
  MAX_DAILY_BID_CENTS,
  MIN_BID_INCREMENT_CENTS,
  MIN_DAILY_BID_CENTS,
  rankAds,
} from "@/lib/adRules";
import { CATEGORY_NAMES, formatUsd, type UiLang } from "@/lib/categoryNames";
import type { LandingCopy } from "./landingCopy";
import s from "./landing.module.css";

const DURATIONS = [7, 14, 30] as const;
const STEP = 50;

export default function PriceCalculator({
  copy,
  lang,
  ads,
}: {
  copy: LandingCopy;
  lang: UiLang;
  ads: Ad[] | null;
}) {
  const byCat = useMemo(() => {
    const m = new Map<Category, Ad[]>();
    for (const k of CATEGORY_KEYS) m.set(k, rankAds((ads || []).filter((a) => a.category === k)));
    return m;
  }, [ads]);

  const [cat, setCat] = useState<Category>("technology");
  const catAds = useMemo(() => byCat.get(cat) || [], [byCat, cat]);
  const firstPlaceBid = catAds[0] ? catAds[0].dailyBidCents + MIN_BID_INCREMENT_CENTS : MIN_DAILY_BID_CENTS;

  // Until the visitor picks a bid for a category, it shows the price of first place there
  const [bidByCat, setBidByCat] = useState<Partial<Record<Category, number>>>({});
  const bid = bidByCat[cat] ?? firstPlaceBid;
  const setBid = (v: number) => setBidByCat((m) => ({ ...m, [cat]: v }));
  const [days, setDays] = useState<(typeof DURATIONS)[number]>(14);

  const rank = useMemo(() => {
    const now = new Date();
    const withYou = rankAds([
      ...catAds,
      { id: "~you", dailyBidCents: bid, startsAt: now, expiresAt: new Date(now.getTime() + days * 86_400_000) } as unknown as Ad,
    ]);
    return withYou.findIndex((a) => a.id === "~you") + 1;
  }, [catAds, bid, days]);

  const change = (delta: number) =>
    setBid(Math.min(MAX_DAILY_BID_CENTS, Math.max(MIN_DAILY_BID_CENTS, bid + delta)));

  return (
    <div className={s.pricingGrid}>
      <div className={s.catGrid} role="radiogroup" aria-label={copy.pricingLabel}>
        {CATEGORY_KEYS.map((k) => {
          const list = byCat.get(k) || [];
          const top = list[0]?.dailyBidCents;
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={cat === k}
              className={`${s.catBtn} ${cat === k ? s.catOn : ""}`}
              onClick={() => setCat(k)}
            >
              <span className={s.catName}>
                <span aria-hidden="true">{CATEGORIES[k].emoji}</span>
                {CATEGORY_NAMES[lang][k]}
              </span>
              <span className={s.catMeta}>
                {ads === null ? (
                  copy.calcLoading
                ) : top ? (
                  <>
                    {copy.firstPlace}: <b>{formatUsd(top)}</b>
                    {copy.perDay} · {list.length} {copy.liveAds}
                  </>
                ) : (
                  copy.emptyCategory
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className={s.calc}>
        <div className={s.calcHead}>
          <span aria-hidden="true">{CATEGORIES[cat].emoji}</span>
          {CATEGORY_NAMES[lang][cat]}
        </div>

        <div>
          <div className={s.controlLabel}>
            <span>{copy.calcBid}</span>
            <span className={s.positionHint}>{copy.calcHint(formatUsd(firstPlaceBid))}</span>
          </div>
          <div className={s.stepper}>
            <button type="button" className={s.stepBtn} onClick={() => change(-STEP)} disabled={bid <= MIN_DAILY_BID_CENTS} aria-label="−$0.50">
              −
            </button>
            <input
              className={s.range}
              type="range"
              min={MIN_DAILY_BID_CENTS}
              max={Math.max(firstPlaceBid * 2, 2000)}
              step={STEP}
              value={bid}
              onChange={(e) => setBid(Number(e.target.value))}
              aria-label={copy.calcBid}
            />
            <button type="button" className={s.stepBtn} onClick={() => change(STEP)} aria-label="+$0.50">
              +
            </button>
          </div>
          <div className={s.controlValue} style={{ marginTop: 6 }}>
            {formatUsd(bid)}
            {copy.perDay}
          </div>
        </div>

        <div role="radiogroup" aria-label={copy.calcDays}>
          <div className={s.controlLabel}>
            <span>{copy.calcDays}</span>
          </div>
          <div className={s.chips}>
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={days === d}
                className={`${s.chip} ${days === d ? s.chipOn : ""}`}
                onClick={() => setDays(d)}
              >
                {d} {copy.daysUnit}
              </button>
            ))}
          </div>
        </div>

        <div className={s.position} aria-live="polite">
          <span>
            {copy.calcRank}: <strong>#{rank}</strong>
          </span>
          <span className={s.positionHint}>
            {rank === 1 ? copy.demoIsFirst : copy.demoToFirst(formatUsd(firstPlaceBid))}
          </span>
        </div>

        <div className={s.calcTotal}>
          <span>
            {copy.calcTotal} · {formatUsd(bid)} × {days}
          </span>
          <strong>{formatUsd(bid * days)}</strong>
        </div>

        <Link className={s.btn} href={`/create?cat=${cat}&minBid=${bid}&days=${days}`}>
          {copy.calcCta} →
        </Link>
      </div>
    </div>
  );
}
