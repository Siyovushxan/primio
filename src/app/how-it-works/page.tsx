"use client";

import Link from "next/link";
import { useLang } from "@/contexts/LangContext";

const W = 1180;
const pad = "0 26px";

export default function HowItWorksPage() {
  const { t } = useLang();

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", animation: "fade .35s ease both" }}>

      {/* Hero */}
      <div style={{ padding: "64px 0 48px", borderBottom: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 14 }}>{t.howPageLabel}</div>
          <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.1, marginBottom: 16, maxWidth: "18ch" }}>
            {t.howPageTitle}
          </h1>
          <p style={{ fontSize: "1rem", color: "#A78BFA", maxWidth: "52ch", lineHeight: 1.7, marginBottom: 28 }}>
            {t.howPageSub}
          </p>
          {/* Core rule card */}
          <div style={{ display: "inline-block", padding: "16px 22px", borderRadius: 16, background: "linear-gradient(135deg,rgba(124,58,237,.18),rgba(245,158,11,.08))", border: "1px solid #7C3AED" }}>
            <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#EDE9FE" }}>
              {t.howPageRule} <span style={{ color: "#F59E0B" }}>{t.howPageRuleHighlight}</span>
            </span>
            <div style={{ fontSize: ".82rem", color: "#A78BFA", marginTop: 6 }}>{t.howPageRuleSub}</div>
          </div>
        </div>
      </div>

      {/* Steps 3-col grid */}
      <div style={{ borderBottom: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ padding: "48px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
              {t.howSteps.map((s) => (
                <div key={s.num} style={{ background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 15, padding: 20, color: "#EDE9FE" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#6D5B8E" }}>{s.num}</span>
                    <span style={{ fontSize: "1.05rem" }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize: ".95rem", fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: ".83rem", color: "#A78BFA", lineHeight: 1.6 }}>{s.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ borderBottom: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ padding: "48px 0" }}>
            <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>{t.howFaqLabel}</div>
            <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em", marginBottom: 24 }}>
              {t.howFaqTitle}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
              {t.howFaqs.map((f) => (
                <div key={f.q} style={{ background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 15, padding: 19 }}>
                  <div style={{ fontSize: ".9rem", fontWeight: 700, marginBottom: 7, lineHeight: 1.45 }}>{f.q}</div>
                  <div style={{ fontSize: ".84rem", color: "#A78BFA", lineHeight: 1.7 }}>{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: W, margin: "0 auto", padding: pad, paddingBottom: 60 }}>
        <div style={{ padding: "44px 34px", margin: "40px 0 0", borderRadius: 22, background: "linear-gradient(140deg,rgba(124,58,237,.25),#160F2A 62%)", border: "1px solid #2D1F50", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.7rem", fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.2, marginBottom: 10 }}>
            {t.howCtaTitle}
          </h2>
          <p style={{ fontSize: ".95rem", color: "#A78BFA", maxWidth: "46ch", margin: "0 auto 22px", lineHeight: 1.7 }}>
            {t.howCtaSub}
          </p>
          <div style={{ display: "flex", gap: 11, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/create" style={{ padding: "13px 22px", borderRadius: 12, background: "#7C3AED", color: "#fff", fontSize: ".9rem", fontWeight: 700, textDecoration: "none" }}>
              {t.howCtaBtn}
            </Link>
            <Link href="/browse" style={{ padding: "13px 22px", borderRadius: 12, background: "transparent", border: "1px solid #2D1F50", color: "#EDE9FE", fontSize: ".9rem", fontWeight: 600, textDecoration: "none" }}>
              {t.howCtaBrowse}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
