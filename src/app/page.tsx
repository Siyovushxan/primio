"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLang } from "@/contexts/LangContext";
import type { Ad } from "@/types";
import { uiLang } from "@/lib/categoryNames";
import { LANDING_COPY } from "@/components/landing/landingCopy";
import RankingDemo from "@/components/landing/RankingDemo";
import PriceCalculator from "@/components/landing/PriceCalculator";
import s from "@/components/landing/landing.module.css";

// Illustrative bars for the dashboard preview (labelled as a sample on the page)
const MOCK_BARS = [34, 42, 38, 51, 47, 63, 58, 71, 66, 80, 74, 88, 83, 95];

function fmtCount(n: number) {
  return n.toLocaleString("en-US").replace(/,/g, " ");
}

export default function HomePage() {
  const { lang: rawLang } = useLang();
  const lang = uiLang(rawLang);
  const c = LANDING_COPY[lang];

  // Live catalog: active ads are public. Drives the calculator and the proof numbers.
  const [ads, setAds] = useState<Ad[] | null>(null);
  useEffect(() => {
    getDocs(query(collection(db, "ads"), where("status", "==", "active")))
      .then((snap) => setAds(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ad)))
      .catch(() => setAds([]));
  }, []);

  const proof = ads && {
    ads: ads.length,
    cats: new Set(ads.map((a) => a.category)).size,
    views: ads.reduce((n, a) => n + (a.impressions || 0), 0),
    clicks: ads.reduce((n, a) => n + (a.clicks || 0), 0),
  };

  const cta = (
    <div className={s.ctaRow}>
      <Link className={s.btn} href="/create">
        {c.ctaPrimary} →
      </Link>
      <Link className={s.btnGhost} href="/browse">
        {c.ctaSecondary}
      </Link>
    </div>
  );

  return (
    <div className={s.page}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className={s.hero}>
        <div className={`${s.container} ${s.heroGrid}`}>
          <div>
            <p className={s.eyebrow}>{c.heroEyebrow}</p>
            <h1 className={s.heroTitle}>{c.heroTitle}</h1>
            <p className={s.heroSub}>{c.heroSub}</p>
            {cta}
            <ul className={s.trust}>
              {c.heroTrust.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <RankingDemo copy={c} />
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.container}>
          <p className={s.eyebrow}>{c.benefitsLabel}</p>
          <h2 className={s.h2}>{c.benefitsTitle}</h2>
          <div className={s.grid4}>
            {c.benefits.map((b, i) => (
              <div key={b.title} className={s.card}>
                <span className={s.cardNum}>0{i + 1}</span>
                <h3 className={s.cardTitle}>{b.title}</h3>
                <p className={s.cardBody}>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className={s.section} id="how">
        <div className={s.container}>
          <p className={s.eyebrow}>{c.howLabel}</p>
          <h2 className={s.h2}>{c.howTitle}</h2>
          <ol className={s.steps}>
            {c.steps.map((st, i) => (
              <li key={st.title} className={`${s.step} ${i === c.steps.length - 1 ? s.stepLast : ""}`}>
                <span className={s.stepNum}>{i + 1}</span>
                <div>
                  <h3 className={s.cardTitle}>{st.title}</h3>
                  <p className={s.cardBody}>{st.body}</p>
                </div>
              </li>
            ))}
          </ol>
          {cta}
        </div>
      </section>

      {/* ── Where it runs / what you buy / how it is measured ────────────── */}
      <section className={s.section}>
        <div className={s.container}>
          <p className={s.eyebrow}>{c.whereLabel}</p>
          <h2 className={s.h2}>{c.whereTitle}</h2>
          <div className={s.grid3}>
            {c.where.map((w) => (
              <div key={w.title} className={s.card}>
                <h3 className={s.cardTitle}>{w.title}</h3>
                <p className={s.cardBody}>{w.body}</p>
              </div>
            ))}
          </div>
          <p className={s.note}>{c.whereNote}</p>
        </div>
      </section>

      {/* ── Categories & price calculator ────────────────────────────────── */}
      <section className={s.section} id="pricing">
        <div className={s.container}>
          <p className={s.eyebrow}>{c.pricingLabel}</p>
          <h2 className={s.h2}>{c.pricingTitle}</h2>
          <p className={s.lead}>{c.pricingSub}</p>
          <PriceCalculator copy={c} lang={lang} ads={ads} />
        </div>
      </section>

      {/* ── Dashboard ────────────────────────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.container}>
          <p className={s.eyebrow}>{c.dashLabel}</p>
          <h2 className={s.h2}>{c.dashTitle}</h2>
          <div className={s.dashGrid}>
            <ul className={s.dashList}>
              {c.dashPoints.map((p) => (
                <li key={p.title}>
                  <h3 className={s.cardTitle}>{p.title}</h3>
                  <p className={s.cardBody}>{p.body}</p>
                </li>
              ))}
            </ul>
            <figure className={s.mock} aria-label={c.dashPreviewNote}>
              <div className={s.mockKpis}>
                {[
                  ["4 820", c.mockKpis[0]],
                  ["312", c.mockKpis[1]],
                  ["6.5%", c.mockKpis[2]],
                  ["$84", c.mockKpis[3]],
                ].map(([v, k]) => (
                  <div key={k} className={s.mockKpi}>
                    <span>{k}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
              <div className={s.mockAlert}>
                <span>{c.mockAttention}</span>
                <b>{c.mockAction}</b>
              </div>
              <div className={s.mockChart}>
                <svg viewBox="0 0 280 90" width="100%" height="90" role="presentation">
                  {MOCK_BARS.map((h, i) => (
                    <rect
                      key={i}
                      x={i * 20 + 3}
                      y={90 - h * 0.9}
                      width="14"
                      height={h * 0.9}
                      rx="3"
                      fill={i === MOCK_BARS.length - 1 ? "#F5B83D" : "#7C3AED"}
                      opacity={i === MOCK_BARS.length - 1 ? 1 : 0.55 + i * 0.03}
                    />
                  ))}
                </svg>
              </div>
              <figcaption className={s.mockCaption}>{c.dashPreviewNote}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ── Real numbers ─────────────────────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.container}>
          <p className={s.eyebrow}>{c.proofLabel}</p>
          <h2 className={s.h2}>{c.proofTitle}</h2>
          {proof && proof.ads === 0 ? (
            <p className={s.note}>{c.proofEmpty}</p>
          ) : (
            <>
              <div className={s.proofGrid}>
                {(
                  [
                    ["ads", proof?.ads],
                    ["cats", proof?.cats],
                    ["views", proof?.views],
                    ["clicks", proof?.clicks],
                  ] as const
                )
                  // Zero counters say nothing useful yet — show only what has data
                  .filter(([, v]) => v === undefined || v > 0)
                  .map(([k, v]) => (
                  <div key={k} className={s.proofStat}>
                    <strong>{v === undefined ? "—" : fmtCount(v)}</strong>
                    <span>{c.proofStats[k]}</span>
                  </div>
                ))}
              </div>
              <p className={s.proofSource}>{c.proofSource}</p>
            </>
          )}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.container}>
          <p className={s.eyebrow}>{c.faqLabel}</p>
          <h2 className={s.h2}>{c.faqTitle}</h2>
          <div className={s.faq}>
            {c.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.final}>
            <h2 className={s.h2}>{c.finalTitle}</h2>
            <p className={s.lead}>{c.finalSub}</p>
            {cta}
          </div>
        </div>
      </section>

      <div className={s.bottomSpace} />
    </div>
  );
}
