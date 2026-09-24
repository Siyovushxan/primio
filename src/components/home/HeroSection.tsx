"use client";

import Link from "next/link";
import { useLang } from "@/contexts/LangContext";

const MATH_CARD_STYLES = [
  { labelColor: "#A855F7", valColor: "var(--text)", bg: "var(--surface)", borderColor: "var(--border)" },
  { labelColor: "#FCD34D", valColor: "#FCD34D", bg: "rgba(245,158,11,.09)", borderColor: "#F59E0B" },
  { labelColor: "#A855F7", valColor: "var(--text)", bg: "var(--surface)", borderColor: "var(--border)" },
  { labelColor: "#34D399", valColor: "#34D399", bg: "rgba(52,211,153,.06)", borderColor: "#34D399" },
];

export default function HeroSection() {
  const { t } = useLang();
  const W = 1180;
  const pad = "0 26px";

  const DEMO_RANK = [
    { pos: "🥇 1", name: "TechStore.uz", bid: `$12.00/${t.day}`, highlight: true },
    { pos: "🥈 2", name: "SizningBrend", bid: `$8.50/${t.day}`, highlight: true, isYou: true },
    { pos: "🥉 3", name: "MobiShop", bid: `$6.00/${t.day}`, highlight: false },
    { pos: "4", name: "DigitalMall", bid: `$4.50/${t.day}`, highlight: false },
  ];

  return (
    <div style={{ animation: "fade .35s ease both" }}>
      {/* === HERO === */}
      <div className="hero-top" style={{ padding: "70px 0 54px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 13px", borderRadius: 100, background: "rgba(124,58,237,.12)", border: "1px solid var(--border)", marginBottom: 26 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", animation: "livedot 1.8s infinite" }} />
            <span style={{ fontSize: ".74rem", fontWeight: 600, color: "#A855F7" }}>{t.heroBadge}</span>
          </div>
          <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "clamp(2.2rem,5.4vw,4rem)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-.035em", maxWidth: "16ch", marginBottom: 20, textWrap: "balance" as "balance" }}>
            {t.heroTitle} <span style={{ color: "#F59E0B" }}>{t.heroTitleHighlight}</span>
          </h1>
          <p style={{ fontSize: "1.05rem", color: "#A78BFA", maxWidth: "52ch", lineHeight: 1.7, marginBottom: 30 }}>
            {t.heroSub}
          </p>
          <div style={{ display: "flex", gap: 11, flexWrap: "wrap" }}>
            <Link href="/create" style={{ padding: "13px 22px", borderRadius: 12, background: "#7C3AED", color: "#fff", fontSize: ".9rem", fontWeight: 700, textDecoration: "none" }}>
              {t.heroCta1}
            </Link>
            <Link href="/browse" style={{ padding: "13px 22px", borderRadius: 12, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", fontSize: ".9rem", fontWeight: 600, textDecoration: "none" }}>
              {t.heroCta2}
            </Link>
          </div>
        </div>
      </div>

      {/* === RULE (2-col) === */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div className="rg-hero">
            <div>
              <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 14 }}>{t.ruleLabel}</div>
              <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em", lineHeight: 1.2, marginBottom: 14 }}>
                {t.ruleTitle}
              </h2>
              <p style={{ fontSize: ".95rem", color: "#A78BFA", lineHeight: 1.75, marginBottom: 20 }}>
                {t.ruleSub}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {[t.rulePoint1, t.rulePoint2, t.rulePoint3].map((text, i) => (
                  <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(16,185,129,.14)", color: "#34D399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, flexShrink: 0, marginTop: 3 }}>✓</span>
                    <span style={{ fontSize: ".88rem", color: "var(--text)", lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo ranking card */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: ".72rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>{t.ruleDemoLabel}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".72rem", color: "var(--muted)" }}>E-commerce</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DEMO_RANK.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, background: d.isYou ? "rgba(124,58,237,.14)" : i === 0 ? "rgba(245,158,11,.07)" : "rgba(255,255,255,.03)", border: d.isYou ? "1px solid #7C3AED" : "1px solid transparent" }}>
                    <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".75rem", fontWeight: 700, color: i === 0 ? "#F59E0B" : d.isYou ? "#A78BFA" : "var(--muted)", minWidth: 24 }}>{d.pos}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: ".86rem", fontWeight: 600, color: d.isYou ? "#A78BFA" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.name}{d.isYou && <span style={{ marginLeft: 6, fontSize: ".68rem", background: "rgba(124,58,237,.2)", color: "#A855F7", padding: "2px 7px", borderRadius: 100 }}>{t.ruleYouBadge}</span>}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".82rem", fontWeight: 600, color: i === 0 ? "#FCD34D" : d.isYou ? "#A78BFA" : "var(--muted)" }}>{d.bid}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: "13px 15px", borderRadius: 12, background: "rgba(245,158,11,.09)", border: "1px solid #F59E0B", fontSize: ".82rem", color: "#FCD34D", lineHeight: 1.6 }}>
                {t.ruleDemoTip}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === FLOW (3-col step cards) === */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ padding: "48px 0" }}>
            <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>{t.howLabel}</div>
            <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em", marginBottom: 8 }}>{t.howTitle}</h2>
            <p style={{ fontSize: ".95rem", color: "#A78BFA", maxWidth: "56ch", marginBottom: 28 }}>{t.howSub}</p>
            <div className="rg-3">
              {t.howCards.map((f) => (
                <div key={f.num} style={{ textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 15, padding: 20, color: "var(--text)", transition: "border-color .15s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--muted)" }}>{f.num}</span>
                    <span style={{ fontSize: "1.05rem" }}>{f.icon}</span>
                  </div>
                  <div style={{ fontSize: ".95rem", fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: ".83rem", color: "#A78BFA", lineHeight: 1.6 }}>{f.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === CATEGORIES (4-col) === */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ padding: "48px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>{t.catsLabel}</div>
                <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em" }}>{t.catsTitle}</h2>
              </div>
              <Link href="/browse" style={{ padding: "11px 18px", borderRadius: 11, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", fontSize: ".84rem", fontWeight: 600, textDecoration: "none" }}>
                {t.catsViewAll}
              </Link>
            </div>
            <div className="rg-4">
              {t.homeCats.map((c) => (
                <Link key={c.name} href={`/browse?category=${encodeURIComponent(c.name)}`} style={{ textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 17, color: "var(--text)", textDecoration: "none", display: "block" }}>
                  <div style={{ fontSize: "1.15rem", marginBottom: 11 }}>{c.icon}</div>
                  <div style={{ fontSize: ".86rem", fontWeight: 700, marginBottom: 9, lineHeight: 1.35 }}>{c.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".9rem", fontWeight: 600, color: "#FCD34D" }}>{c.top}</span>
                    <span style={{ fontSize: ".68rem", color: "var(--muted)" }}>{t.catForFirst}</span>
                  </div>
                  <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: 4 }}>{c.count} {t.catAdsCount} {c.min}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === WHO IS IT FOR (3-col) === */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ padding: "48px 0" }}>
            <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>{t.whoLabel}</div>
            <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em", marginBottom: 8 }}>{t.whoTitle}</h2>
            <p style={{ fontSize: ".95rem", color: "#A78BFA", maxWidth: "58ch", marginBottom: 26 }}>{t.whoSub}</p>
            <div className="rg-3">
              {t.whoCards.map((w) => (
                <div key={w.title} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
                  <div style={{ fontSize: "1.3rem", marginBottom: 14 }}>{w.icon}</div>
                  <div style={{ fontSize: ".98rem", fontWeight: 700, marginBottom: 7 }}>{w.title}</div>
                  <div style={{ fontSize: ".85rem", color: "#A78BFA", lineHeight: 1.65, marginBottom: 16 }}>{w.body}</div>
                  <div style={{ padding: "12px 14px", borderRadius: 11, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: ".68rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: 5 }}>{t.whoExampleLabel}</div>
                    <div style={{ fontSize: ".82rem", color: "var(--text)", lineHeight: 1.55 }}>&ldquo;{w.example}&rdquo;</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === MATH/PRICING (2-col) === */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div className="rg-pricing" style={{ padding: "48px 0" }}>
            <div>
              <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>{t.pricingLabel}</div>
              <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em", lineHeight: 1.2, marginBottom: 14 }}>
                {t.pricingTitle}
              </h2>
              <p style={{ fontSize: ".95rem", color: "#A78BFA", lineHeight: 1.75, marginBottom: 20 }}>
                {t.pricingSub}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {[t.pricingPoint1, t.pricingPoint2, t.pricingPoint3].map((text, i) => (
                  <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(245,158,11,.14)", color: "#FCD34D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, flexShrink: 0, marginTop: 3 }}>✓</span>
                    <span style={{ fontSize: ".88rem", color: "var(--text)", lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 11 }}>
              {t.mathCards.map((m, i) => {
                const s = MATH_CARD_STYLES[i];
                return (
                  <div key={m.label} style={{ background: s.bg, border: `1px solid ${s.borderColor}`, borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: ".7rem", letterSpacing: ".09em", textTransform: "uppercase", fontWeight: 700, color: s.labelColor, marginBottom: 9 }}>{m.label}</div>
                    <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.5rem", fontWeight: 700, lineHeight: 1, color: s.valColor, marginBottom: 7 }}>{m.value}</div>
                    <div style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.5 }}>{m.hint}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* === FAQ (2-col grid) === */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ padding: "48px 0" }}>
            <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>{t.faqLabel}</div>
            <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em", marginBottom: 24 }}>{t.faqTitle}</h2>
            <div className="rg-2">
              {t.faqItems.map((f) => (
                <div key={f.q} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 15, padding: 19 }}>
                  <div style={{ fontSize: ".9rem", fontWeight: 700, marginBottom: 7, lineHeight: 1.45 }}>{f.q}</div>
                  <div style={{ fontSize: ".84rem", color: "#A78BFA", lineHeight: 1.7 }}>{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === CTA gradient card === */}
      <div style={{ maxWidth: W, margin: "0 auto", padding: pad, paddingBottom: 60 }}>
        <div style={{ padding: "44px 34px", margin: "20px 0 0", borderRadius: 22, background: "linear-gradient(140deg,rgba(124,58,237,.25),var(--surface-2) 62%)", border: "1px solid var(--border)", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.9rem", fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.15, marginBottom: 12, textWrap: "balance" as "balance" }}>
            {t.ctaTitle}
          </h2>
          <p style={{ fontSize: ".95rem", color: "#A78BFA", maxWidth: "52ch", margin: "0 auto 24px", lineHeight: 1.7 }}>
            {t.ctaSub}
          </p>
          <div style={{ display: "flex", gap: 11, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth" style={{ padding: "14px 24px", borderRadius: 12, background: "#7C3AED", color: "#fff", fontSize: ".92rem", fontWeight: 700, textDecoration: "none" }}>
              {t.ctaRegister}
            </Link>
            <Link href="/browse" style={{ padding: "14px 24px", borderRadius: 12, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", fontSize: ".92rem", fontWeight: 600, textDecoration: "none" }}>
              {t.ctaAllAds}
            </Link>
          </div>
          <div style={{ fontSize: ".79rem", color: "var(--muted)", marginTop: 18 }}>
            {t.ctaNote}
          </div>
        </div>
      </div>
    </div>
  );
}
