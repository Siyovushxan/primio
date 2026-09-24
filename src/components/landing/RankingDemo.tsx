"use client";

// "Interaktiv namuna": a sample category ranking in 3D. Moving the bid slider re-ranks the
// visitor's card with the same rule the real catalog uses (rankAds), and the card glides to
// its new place. Sample brands are fictional; the badge and note say so.

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { MIN_BID_INCREMENT_CENTS, MIN_DAILY_BID_CENTS, rankAds } from "@/lib/adRules";
import { formatUsd } from "@/lib/categoryNames";
import type { LandingCopy } from "./landingCopy";
import s from "./landing.module.css";

const YOU = "you";
const DURATIONS = [7, 14, 30] as const;
const MAX_BID_CENTS = 1200;

// Older placements than the visitor's, so equal bids rank them higher — as in the real ranking
const SAMPLE = [
  { id: "a", name: "Ilm Markazi", initial: "I", color: "#B45309", dailyBidCents: 900, startsAt: new Date(2026, 0, 10) },
  { id: "b", name: "Smart Kurs", initial: "S", color: "#0E7490", dailyBidCents: 650, startsAt: new Date(2026, 1, 3) },
  { id: "c", name: "Til Studio", initial: "T", color: "#4D7C0F", dailyBidCents: 400, startsAt: new Date(2026, 2, 21) },
  { id: "d", name: "Kod Maktab", initial: "K", color: "#9D174D", dailyBidCents: 250, startsAt: new Date(2026, 3, 8) },
  { id: "e", name: "Bilim Plus", initial: "B", color: "#475569", dailyBidCents: 150, startsAt: new Date(2026, 4, 2) },
];
const FAR_FUTURE = new Date(2100, 0, 1);

export default function RankingDemo({ copy }: { copy: LandingCopy }) {
  const [bid, setBid] = useState(300);
  const [days, setDays] = useState<(typeof DURATIONS)[number]>(14);
  const boardRef = useRef<HTMLDivElement>(null);
  const [youStartsAt] = useState(() => new Date());

  const ranked = useMemo(
    () =>
      rankAds([
        ...SAMPLE.map((a) => ({ ...a, expiresAt: FAR_FUTURE })),
        { id: YOU, name: copy.demoYou, initial: "★", color: "#7C3AED", dailyBidCents: bid, startsAt: youStartsAt, expiresAt: FAR_FUTURE },
      ]),
    [bid, copy.demoYou, youStartsAt],
  );
  const index = new Map(ranked.map((a, i) => [a.id, i]));
  const position = (index.get(YOU) ?? 0) + 1;
  const firstPlaceBid = SAMPLE[0].dailyBidCents + MIN_BID_INCREMENT_CENTS;

  // Gentle pointer tilt on devices with a precise pointer; off for reduced motion
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    const scene = board.parentElement!;
    const onMove = (e: PointerEvent) => {
      const r = scene.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      board.style.setProperty("--tx", `${(x * 6).toFixed(2)}deg`);
      board.style.setProperty("--ty", `${(-y * 5).toFixed(2)}deg`);
    };
    const onLeave = () => {
      board.style.removeProperty("--tx");
      board.style.removeProperty("--ty");
    };
    scene.addEventListener("pointermove", onMove);
    scene.addEventListener("pointerleave", onLeave);
    return () => {
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const rows = [...SAMPLE, { id: YOU, name: copy.demoYou, initial: "★", color: "#7C3AED", dailyBidCents: bid }];

  return (
    <div className={s.demo}>
      <div className={s.demoHead}>
        <span className={s.badge}>{copy.demoBadge}</span>
        <span className={s.demoCat}>{copy.demoCategory}</span>
      </div>

      <div className={s.scene} style={{ height: `calc(${rows.length} * var(--row-step) + 26px)` }} aria-hidden="true">
        <div ref={boardRef} className={s.board}>
          {/* Stable DOM order; position comes from --i so every card animates to its new place */}
          {rows.map((row) => {
            const i = index.get(row.id) ?? 0;
            const cls = [s.row, i === 0 ? s.rowFirst : "", row.id === YOU ? s.rowYou : ""].join(" ");
            return (
              <div key={row.id} className={cls} style={{ "--i": i } as CSSProperties}>
                <span className={s.rank}>#{i + 1}</span>
                <span className={s.logo} style={{ background: row.color }}>{row.initial}</span>
                <span className={s.rowName}>{row.name}</span>
                <span className={s.rowBid}>
                  {formatUsd(row.dailyBidCents)}
                  {copy.perDay}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={s.controls}>
        <div>
          <label className={s.controlLabel} htmlFor="demo-bid">
            <span>{copy.demoBidLabel}</span>
            <span className={s.controlValue}>
              {formatUsd(bid)}
              {copy.perDay}
            </span>
          </label>
          <input
            id="demo-bid"
            className={s.range}
            type="range"
            min={MIN_DAILY_BID_CENTS}
            max={MAX_BID_CENTS}
            step={50}
            value={bid}
            onChange={(e) => setBid(Number(e.target.value))}
          />
        </div>

        <div role="radiogroup" aria-label={copy.demoDays}>
          <div className={s.controlLabel}>
            <span>{copy.demoDays}</span>
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

        <div className={s.summary}>
          <div className={s.stat}>
            <div className={s.statLabel}>{copy.demoDaily}</div>
            <div className={s.statValue}>{formatUsd(bid)}</div>
          </div>
          <div className={s.stat}>
            <div className={s.statLabel}>{copy.demoDays}</div>
            <div className={s.statValue}>
              {days} {copy.daysUnit}
            </div>
          </div>
          <div className={s.stat}>
            <div className={s.statLabel}>{copy.demoTotal}</div>
            <div className={`${s.statValue} ${s.statGold}`}>{formatUsd(bid * days)}</div>
          </div>
        </div>

        <div className={s.position} aria-live="polite">
          <span>
            {copy.demoPosition}: <strong>#{position}</strong>
          </span>
          <span className={s.positionHint}>
            {position === 1 ? copy.demoIsFirst : copy.demoToFirst(formatUsd(firstPlaceBid))}
          </span>
        </div>
      </div>

      <p className={s.demoNote}>{copy.demoNote}</p>
    </div>
  );
}
