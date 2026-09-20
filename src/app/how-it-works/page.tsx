"use client";

import Link from "next/link";
import { useLang } from "@/contexts/LangContext";
import { useRef } from "react";

const W = 1180;

export default function HowItWorksPage() {
  const { t } = useLang();

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "#0A0715", position: "relative", overflow: "hidden" }}>

      {/* ── Background ─────────────────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "5%", right: "5%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.11) 0%, transparent 70%)", animation: "orb-drift 20s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "0%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,.07) 0%, transparent 70%)", animation: "orb-drift2 25s ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,58,237,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div style={{ padding: "72px 24px 60px", borderBottom: "1px solid rgba(45,31,80,.6)" }}>
          <div style={{ maxWidth: W, margin: "0 auto", display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap" }}>

            {/* Left text */}
            <div style={{ flex: 1, minWidth: 280, animation: "slideUp .6s both" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 100, background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.3)", marginBottom: 22 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C3AED", boxShadow: "0 0 8px #7C3AED" }} />
                <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#A78BFA" }}>{t.howPageLabel}</span>
              </div>
              <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.1, marginBottom: 16, maxWidth: "18ch" }}>
                {t.howPageTitle}
              </h1>
              <p style={{ fontSize: "1rem", color: "#7C6E9E", maxWidth: "48ch", lineHeight: 1.7, marginBottom: 28 }}>
                {t.howPageSub}
              </p>

              {/* Core rule card */}
              <div style={{ display: "inline-block", padding: "18px 24px", borderRadius: 18, background: "linear-gradient(135deg,rgba(124,58,237,.18),rgba(245,158,11,.08))", border: "1px solid rgba(124,58,237,.4)", animation: "glow-pulse 3s ease-in-out infinite" }}>
                <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "#EDE9FE" }}>
                  {t.howPageRule} <span style={{ color: "#F59E0B", animation: "rank-glow 2.5s ease-in-out infinite" }}>{t.howPageRuleHighlight}</span>
                </span>
                <div style={{ fontSize: ".8rem", color: "#A78BFA", marginTop: 6 }}>{t.howPageRuleSub}</div>
              </div>
            </div>

            {/* Right: visual step numbers */}
            <div style={{ flex: "0 0 auto", animation: "slideUp .7s both .15s" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 320 }}>
                {["01","02","03","04","05","06"].map((n, i) => {
                  const icons = ["✏️","💰","🏆","📈","⚡","🛡️"];
                  return (
                    <div key={n} style={{
                      background: "rgba(45,31,80,.5)", border: "1px solid rgba(124,58,237,.2)", borderRadius: 14, padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: 10,
                      animation: `slideUp .5s both ${i * 60}ms`,
                    }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem", fontWeight: 700, color: "rgba(124,58,237,.5)", minWidth: 22 }}>{n}</span>
                      <span style={{ fontSize: "1.1rem" }}>{icons[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── STEPS GRID ───────────────────────────────────────────────────── */}
        <div style={{ borderBottom: "1px solid rgba(45,31,80,.6)" }}>
          <div style={{ maxWidth: W, margin: "0 auto", padding: "56px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
              {t.howSteps.map((s, i) => (
                <StepCard key={s.num} s={s} delay={i * 80} />
              ))}
            </div>
          </div>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <div style={{ borderBottom: "1px solid rgba(45,31,80,.6)" }}>
          <div style={{ maxWidth: W, margin: "0 auto", padding: "56px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: ".65rem", letterSpacing: ".16em", textTransform: "uppercase", color: "#7C3AED", fontWeight: 700, marginBottom: 8 }}>{t.howFaqLabel}</div>
                <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 700, letterSpacing: "-.02em", color: "#EDE9FE", margin: 0 }}>
                  {t.howFaqTitle}
                </h2>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
              {t.howFaqs.map((f, i) => (
                <FaqCard key={f.q} f={f} delay={i * 60} />
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: W, margin: "0 auto", padding: "56px 24px 80px" }}>
          <div style={{
            padding: "52px 40px", borderRadius: 26,
            background: "linear-gradient(135deg, rgba(124,58,237,.15) 0%, rgba(45,31,80,.4) 50%, rgba(124,58,237,.08) 100%)",
            border: "1px solid rgba(124,58,237,.35)", textAlign: "center",
            position: "relative", overflow: "hidden",
            animation: "glow-pulse 4s ease-in-out infinite",
          }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,58,237,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,.04) 1px, transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: "2.8rem", marginBottom: 14, animation: "float-sm 3s ease-in-out infinite" }}>🚀</div>
              <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "clamp(1.4rem,3.5vw,2rem)", fontWeight: 700, letterSpacing: "-.02em", lineHeight: 1.2, marginBottom: 10, color: "#EDE9FE" }}>
                {t.howCtaTitle}
              </h2>
              <p style={{ fontSize: ".92rem", color: "#7C6E9E", maxWidth: "46ch", margin: "0 auto 28px", lineHeight: 1.7 }}>
                {t.howCtaSub}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/create" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 26px", borderRadius: 13, background: "#7C3AED", color: "#fff", fontSize: ".9rem", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 20px rgba(124,58,237,.3)", transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#6D28D9"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#7C3AED"; (e.currentTarget as HTMLElement).style.transform = ""; }}>
                  {t.howCtaBtn} →
                </Link>
                <Link href="/browse" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 26px", borderRadius: 13, background: "transparent", border: "1px solid rgba(124,58,237,.3)", color: "#A78BFA", fontSize: ".9rem", fontWeight: 600, textDecoration: "none", transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.transform = ""; }}>
                  {t.howCtaBrowse}
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepCard({ s, delay }: { s: { num: string; icon: string; title: string; body: string }; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isTop3 = parseInt(s.num) <= 3;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateY(-4px)`;
    el.style.borderColor = "rgba(124,58,237,.5)";
    el.style.boxShadow = "0 20px 50px rgba(124,58,237,.15)";
  };
  const onLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.transform = "";
    el.style.borderColor = isTop3 ? "rgba(124,58,237,.3)" : "rgba(45,31,80,.7)";
    el.style.boxShadow = isTop3 ? "0 0 20px rgba(124,58,237,.08)" : "";
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        background: "linear-gradient(135deg, rgba(45,31,80,.6) 0%, rgba(22,15,42,.9) 100%)",
        border: `1px solid ${isTop3 ? "rgba(124,58,237,.3)" : "rgba(45,31,80,.7)"}`,
        borderRadius: 18,
        padding: "22px 20px",
        cursor: "default",
        transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
        animation: `slideUp .55s both ${delay}ms`,
        boxShadow: isTop3 ? "0 0 20px rgba(124,58,237,.08)" : "",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle top glow for first 3 */}
      {isTop3 && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(124,58,237,.6), transparent)" }} />
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: isTop3 ? "rgba(124,58,237,.5)" : "#3D2E5A" }}>{s.num}</span>
        <span style={{ fontSize: "1.3rem" }}>{s.icon}</span>
      </div>
      <div style={{ fontSize: ".93rem", fontWeight: 700, marginBottom: 7, color: "#EDE9FE", lineHeight: 1.35 }}>{s.title}</div>
      <div style={{ fontSize: ".81rem", color: "#7C6E9E", lineHeight: 1.65 }}>{s.body}</div>
    </div>
  );
}

function FaqCard({ f, delay }: { f: { q: string; a: string }; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onMouseEnter={() => { if (ref.current) { ref.current.style.borderColor = "rgba(124,58,237,.4)"; ref.current.style.background = "rgba(45,31,80,.5)"; } }}
      onMouseLeave={() => { if (ref.current) { ref.current.style.borderColor = "rgba(45,31,80,.6)"; ref.current.style.background = "rgba(22,15,42,.7)"; } }}
      style={{
        background: "rgba(22,15,42,.7)", border: "1px solid rgba(45,31,80,.6)", borderRadius: 16, padding: 20,
        transition: "border-color .2s, background .2s",
        animation: `slideUp .5s both ${delay}ms`,
      }}
    >
      <div style={{ fontSize: ".88rem", fontWeight: 700, marginBottom: 8, lineHeight: 1.45, color: "#EDE9FE" }}>{f.q}</div>
      <div style={{ fontSize: ".82rem", color: "#7C6E9E", lineHeight: 1.7 }}>{f.a}</div>
    </div>
  );
}
