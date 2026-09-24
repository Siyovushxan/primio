"use client";

// Dashboard home: the advertiser's own results and what to do next.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Ad } from "@/types";
import { attentionItems, buildInsights, totals, type AttentionItem } from "@/lib/adInsights";
import { CATEGORY_NAMES, formatUsd, type UiLang } from "@/lib/categoryNames";
import { lastDayKeys } from "@/lib/dailyStats";
import { OVERVIEW_COPY } from "./overviewCopy";
import { STATUS_COLOR, fmtCount, fmtDate, primaryAction } from "./adActions";
import s from "./overview.module.css";

type Screen = "overview" | "myads" | "ranking" | "wallet" | "profile";

interface Tx {
  id: string;
  amountCents?: number;
  needsReview?: boolean;
}

const ATT_COLOR: Record<AttentionItem["kind"], string> = {
  pay: "var(--gold)",
  expiring: "var(--gold)",
  outranked: "var(--violet-soft)",
  expired: "var(--dim)",
  rejected: "var(--danger)",
  review: "var(--violet-soft)",
};

export default function OverviewView({
  lang,
  brand,
  myAds,
  activeAds,
  txs,
  paidCents,
  loading,
  onNavigate,
}: {
  lang: UiLang;
  brand: string;
  myAds: Ad[];
  activeAds: Ad[];
  txs: Tx[];
  paidCents: number;
  loading: boolean;
  onNavigate: (s: Screen) => void;
}) {
  const c = OVERVIEW_COPY[lang];
  // A clock that ticks each minute keeps "days left" and freshness-based ranks current
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const insights = useMemo(() => buildInsights(myAds, activeAds, now), [myAds, activeAds, now]);
  const attention = useMemo(() => attentionItems(insights), [insights]);
  const reviewTxs = txs.filter((t) => t.needsReview);
  const sum = totals(myAds);
  const live = insights.filter((i) => i.daysLeft !== null).length;
  const running = insights.filter((i) => i.position !== null);

  const attentionText = (a: AttentionItem) => {
    const { ad } = a.insight;
    switch (a.kind) {
      case "pay":
        return { title: c.att.pay.title, body: c.att.pay.body(ad.title, formatUsd(ad.dailyBidCents * ad.durationDays)) };
      case "expiring":
        return { title: c.att.expiring.title, body: c.att.expiring.body(ad.title, a.insight.daysLeft || 0) };
      case "outranked":
        return {
          title: c.att.outranked.title(a.insight.position || 0),
          body: c.att.outranked.body(ad.title, formatUsd(a.insight.nextBidCents || 0), formatUsd(a.insight.nextExtraCents || 0)),
        };
      case "expired":
        return { title: c.att.expired.title, body: c.att.expired.body(ad.title) };
      case "rejected":
        return { title: c.att.rejected.title, body: c.att.rejected.body(ad.title) };
      case "review":
        return { title: c.att.review.title, body: c.att.review.body(ad.title) };
    }
  };

  return (
    <div className={s.wrap}>
      <div className={s.head}>
        <div>
          <div className={s.eyebrow}>{c.label}</div>
          <h1 className={s.title}>{c.hello(brand)}</h1>
          <p className={s.summary}>{c.summary(live, attention.length + reviewTxs.length)}</p>
        </div>
        <Link className={s.btn} href="/create">+ {c.create}</Link>
      </div>

      <div className={s.kpis}>
        {[
          { k: c.kpi.views, v: fmtCount(sum.impressions), hint: c.kpiHint.views },
          { k: c.kpi.clicks, v: fmtCount(sum.clicks), hint: c.kpiHint.clicks },
          { k: c.kpi.ctr, v: `${sum.ctr.toFixed(1)}%`, hint: c.kpiHint.ctr },
          { k: c.kpi.paid, v: formatUsd(paidCents), hint: c.kpiHint.paid, gold: true },
        ].map((x) => (
          <div key={x.k} className={s.kpi}>
            <div className={s.kpiLabel}>{x.k}</div>
            <div className={`${s.kpiValue} ${x.gold ? s.kpiGold : ""}`}>{x.v}</div>
            <div className={s.kpiHint}>{x.hint}</div>
          </div>
        ))}
      </div>

      <div className={s.grid}>
        <div className={s.col}>
          {/* Needs attention */}
          <section className={s.panel} aria-labelledby="att-title">
            <div className={s.panelHead}>
              <h2 id="att-title" className={s.panelTitle}>
                {c.attentionTitle}
                {attention.length + reviewTxs.length > 0 && <span className={s.count}>{attention.length + reviewTxs.length}</span>}
              </h2>
            </div>
            {attention.length + reviewTxs.length === 0 ? (
              <p className={`${s.empty} ${s.emptyGood}`}>{loading ? "…" : c.allGood}</p>
            ) : (
              <ul className={s.list}>
                {attention.map((a) => {
                  const text = attentionText(a);
                  const act = primaryAction(a.insight);
                  const actKind = a.kind === "expiring" ? "renew" : act.kind;
                  const href = a.kind === "expiring" ? `/ads/${a.insight.ad.id}/renew` : act.href;
                  return (
                    <li key={`${a.kind}-${a.insight.ad.id}`} className={s.row}>
                      <span className={s.dot} style={{ background: ATT_COLOR[a.kind] }} />
                      <div className={s.rowMain}>
                        <div className={s.rowTitle}>{text.title}</div>
                        <div className={s.rowBody}>{text.body}</div>
                      </div>
                      {a.kind !== "review" && (
                        <Link className={`${s.btnSm} ${a.kind === "pay" ? s.btnGold : ""}`} href={href}>
                          {c.action[actKind]}
                        </Link>
                      )}
                    </li>
                  );
                })}
                {reviewTxs.map((t) => (
                  <li key={t.id} className={s.row}>
                    <span className={s.dot} style={{ background: "var(--gold)" }} />
                    <div className={s.rowMain}>
                      <div className={s.rowTitle}>{c.att.paymentReview.title}</div>
                      <div className={s.rowBody}>{c.att.paymentReview.body(formatUsd(t.amountCents || 0))}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* My ads (compact) */}
          <section className={s.panel} aria-labelledby="ads-title">
            <div className={s.panelHead}>
              <h2 id="ads-title" className={s.panelTitle}>{c.myAdsTitle}</h2>
              {myAds.length > 0 && (
                <button type="button" className={s.link} onClick={() => onNavigate("myads")}>
                  {c.seeAll} →
                </button>
              )}
            </div>
            {myAds.length === 0 ? (
              <p className={s.empty}>{loading ? "…" : c.noAds}</p>
            ) : (
              <ul className={s.list}>
                {insights.slice(0, 5).map((i) => {
                  const act = primaryAction(i);
                  const color = STATUS_COLOR[i.ad.status] || "var(--muted)";
                  const ctr = i.ad.impressions > 0 ? ((i.ad.clicks / i.ad.impressions) * 100).toFixed(1) : "0.0";
                  return (
                    <li key={i.ad.id} className={s.row}>
                      <div className={s.rowMain}>
                        <div className={s.rowTitle}>
                          {i.ad.title}
                          <span className={s.badge} style={{ color }}>
                            {c.status[i.ad.status as keyof typeof c.status] || i.ad.status}
                          </span>
                        </div>
                        <div className={s.rowMeta}>
                          <span>{CATEGORY_NAMES[lang][i.ad.category]}{i.position !== null && <> · <b>#{i.position}</b>/{i.categorySize}</>}</span>
                          <span><b>{formatUsd(i.ad.dailyBidCents)}</b>{c.perDay}</span>
                          {i.ad.expiresAt && <span>{c.ends}: <b>{fmtDate(i.ad.expiresAt)}</b></span>}
                          {(i.ad.status === "active" || i.ad.status === "expired") && (
                            <span>👁 {fmtCount(i.ad.impressions || 0)} · ↗ {fmtCount(i.ad.clicks || 0)} · {ctr}%</span>
                          )}
                        </div>
                      </div>
                      <Link className={`${s.btnSm} ${act.kind === "pay" ? s.btnGold : ""}`} href={act.href}>
                        {c.action[act.kind]}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className={s.col}>
          {/* Competition */}
          <section className={s.panel} aria-labelledby="comp-title">
            <div className={s.panelHead}>
              <h2 id="comp-title" className={s.panelTitle}>{c.competitionTitle}</h2>
              <button type="button" className={s.link} onClick={() => onNavigate("ranking")}>
                {c.nav.ranking} →
              </button>
            </div>
            {running.length === 0 ? (
              <p className={s.empty}>{c.competitionEmpty}</p>
            ) : (
              <ul className={s.list}>
                {running.map((i) => (
                  <li key={i.ad.id} className={s.row}>
                    <span className={`${s.rankBig} ${i.position === 1 ? s.rankFirst : ""}`}>#{i.position}</span>
                    <div className={s.rowMain}>
                      <div className={s.rowTitle}>{i.ad.title}</div>
                      <div className={s.rowBody}>
                        {c.rankOf(i.position!, i.categorySize, CATEGORY_NAMES[lang][i.ad.category])}
                      </div>
                      <div className={s.rowBody}>
                        {i.position === 1 ? (
                          c.leading(i.leadCents !== null ? formatUsd(i.leadCents) : null)
                        ) : (
                          <>
                            {c.toNext(formatUsd(i.nextBidCents!))}
                            <br />
                            {c.extra(formatUsd(i.nextExtraCents!), i.daysLeft!)}
                          </>
                        )}
                      </div>
                    </div>
                    {i.position !== 1 && (
                      <Link className={s.btnSm} href={`/ads/${i.ad.id}/bid?to=${i.nextBidCents}`}>
                        {c.action.raise}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <ResultsChart lang={lang} ads={myAds} />
        </div>
      </div>
    </div>
  );
}

// ── Results chart ─────────────────────────────────────────────────────────────
// Reads ads/{id}/daily for the advertiser's ads that have run, and sums per day.

function ResultsChart({ lang, ads }: { lang: UiLang; ads: Ad[] }) {
  const c = OVERVIEW_COPY[lang];
  const [range, setRange] = useState<7 | 30>(7);
  const [series, setSeries] = useState<{ key: string; impressions: number; clicks: number }[] | null>(null);
  const ids = ads
    .filter((a) => a.status === "active" || a.status === "expired")
    .slice(0, 20)
    .map((a) => a.id)
    .join(",");

  useEffect(() => {
    let cancelled = false;
    const keys = lastDayKeys(range);
    const idList = ids ? ids.split(",") : [];
    Promise.all(
      idList.map((id) =>
        getDocs(query(collection(db, "ads", id, "daily"), where("date", ">=", keys[0])))
          .then((snap) => snap.docs.map((d) => d.data() as { date: string; impressions?: number; clicks?: number }))
          .catch(() => []),
      ),
    ).then((perAd) => {
      if (cancelled) return;
      const byDay = new Map(keys.map((k) => [k, { key: k, impressions: 0, clicks: 0 }]));
      for (const rows of perAd) {
        for (const r of rows) {
          const d = byDay.get(r.date);
          if (d) {
            d.impressions += r.impressions || 0;
            d.clicks += r.clicks || 0;
          }
        }
      }
      setSeries([...byDay.values()]);
    });
    return () => {
      cancelled = true;
    };
  }, [ids, range]);

  const hasData = !!series && series.some((d) => d.impressions > 0 || d.clicks > 0);
  const maxV = Math.max(1, ...(series || []).map((d) => d.impressions));
  const sumV = (series || []).reduce((n, d) => n + d.impressions, 0);
  const sumC = (series || []).reduce((n, d) => n + d.clicks, 0);
  const W = 300;
  const H = 150;
  const n = series?.length || range;
  const slot = W / n;
  const barW = Math.max(3, slot * 0.62);
  const shortDate = (k: string) => `${k.slice(8, 10)}.${k.slice(5, 7)}`;

  return (
    <section className={s.panel} aria-labelledby="chart-title">
      <div className={s.panelHead}>
        <h2 id="chart-title" className={s.panelTitle}>{c.chartTitle}</h2>
        <div className={s.seg} role="group" aria-label={c.chartTitle}>
          <button type="button" aria-pressed={range === 7} onClick={() => setRange(7)}>{c.days7}</button>
          <button type="button" aria-pressed={range === 30} onClick={() => setRange(30)}>{c.days30}</button>
        </div>
      </div>
      {!hasData ? (
        <p className={s.empty}>{series === null ? "…" : c.chartEmpty}</p>
      ) : (
        <div className={s.chartBody}>
          <div className={s.legend}>
            <span><i style={{ background: "var(--violet)" }} />{c.chartViews}: <b>{fmtCount(sumV)}</b></span>
            <span><i style={{ background: "var(--gold)" }} />{c.chartClicks}: <b>{fmtCount(sumC)}</b></span>
          </div>
          <svg className={s.chart} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${c.chartViews} ${fmtCount(sumV)}, ${c.chartClicks} ${fmtCount(sumC)}`}>
            {series!.map((d, i) => {
              const h = (d.impressions / maxV) * (H - 8);
              const ch = (d.clicks / maxV) * (H - 8);
              const x = i * slot + (slot - barW) / 2;
              return (
                <g key={d.key}>
                  <title>{`${shortDate(d.key)} — ${c.chartViews}: ${d.impressions}, ${c.chartClicks}: ${d.clicks}`}</title>
                  <rect className={s.chartBar} x={x} y={H - h} width={barW} height={h} rx={2} fill="#7C3AED" opacity={0.85} style={{ animationDelay: `${i * 20}ms` }} />
                  {ch > 0 && <rect className={s.chartBar} x={x + barW * 0.25} y={H - ch} width={barW * 0.5} height={ch} rx={1.5} fill="#F5B83D" />}
                </g>
              );
            })}
          </svg>
          <div className={s.axis}>
            <span>{shortDate(series![0].key)}</span>
            <span>{shortDate(series![series!.length - 1].key)}</span>
          </div>
        </div>
      )}
    </section>
  );
}
