"use client";

import Link from "next/link";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRef, useCallback, useEffect, useState } from "react";

// ── 3D tilt hook ─────────────────────────────────────────────────────────────
function useTilt(max = 15) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-y * max}deg) rotateY(${x * max}deg) scale(1.03)`;
  }, [max]);
  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
  }, []);
  return { ref, onMove, onLeave };
}

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, duration = 1800 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(ease * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (elRef.current) obs.observe(elRef.current);
    return () => obs.disconnect();
  }, [to, duration]);

  return <span ref={elRef}>{val.toLocaleString()}</span>;
}

// ── Step card ────────────────────────────────────────────────────────────────
function StepCard({ num, icon, title, body, delay }: { num: string; icon: string; title: string; body: string; delay: number }) {
  const tilt = useTilt(10);
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMove}
      onMouseLeave={tilt.onLeave}
      style={{
        background: "linear-gradient(135deg, rgba(45,31,80,.7) 0%, rgba(22,15,42,.9) 100%)",
        border: "1px solid rgba(124,58,237,.25)",
        borderRadius: 20,
        padding: "28px 24px",
        transition: "transform .12s ease, box-shadow .12s ease",
        cursor: "default",
        animationDelay: `${delay}ms`,
        animation: "slideUp .6s both",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 16, right: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: ".65rem", fontWeight: 700, color: "rgba(124,58,237,.4)", letterSpacing: ".1em" }}>{num}</div>
      <div style={{ fontSize: "2rem", marginBottom: 14, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: ".92rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 8, lineHeight: 1.35 }}>{title}</div>
      <div style={{ fontSize: ".78rem", color: "#6D5B8E", lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { t, lang } = useLang();
  const { firebaseUser } = useAuth();

  const MOCK_ADS = [
    { rank: 1, medal: "🥇", name: lang === "uz" ? "TechStart UZ" : lang === "ru" ? "TechStart RU" : "TechStart", bid: "$9.00", color: "#F59E0B" },
    { rank: 2, medal: "🥈", name: lang === "uz" ? "OnlineShop.uz" : lang === "ru" ? "OnlineShop.ru" : "OnlineShop", bid: "$6.50", color: "#94A3B8" },
    { rank: 3, medal: "🥉", name: lang === "uz" ? "EduCenter.uz" : lang === "ru" ? "EduCenter.ru" : "EduCenter", bid: "$4.00", color: "#CD7F32" },
  ];

  const STEPS = [
    { num: "01", icon: "✏️", title: lang === "uz" ? "Reklama yarating" : lang === "ru" ? "Создайте объявление" : "Create your ad", body: lang === "uz" ? "Nom, tasvir va tavsifni kiriting. 5 daqiqa — tayyor." : lang === "ru" ? "Введите название, фото и описание. 5 минут — готово." : "Enter name, image and description. 5 minutes — done." },
    { num: "02", icon: "💰", title: lang === "uz" ? "Kunlik taklif qo'ying" : lang === "ru" ? "Установите дневную ставку" : "Set your daily bid", body: lang === "uz" ? "Qancha ko'p to'lasangiz — shuncha yuqorida turasiz. Bozor real vaqtda yangilanadi." : lang === "ru" ? "Чем больше платите — тем выше позиция. Рынок обновляется в реальном времени." : "The more you pay — the higher you rank. Market updates in real time." },
    { num: "03", icon: "🏆", title: lang === "uz" ? "Birinchi o'ringa chiqing" : lang === "ru" ? "Займите первое место" : "Rank #1", body: lang === "uz" ? "Raqobatchilarni kuzating va taklifingizni har qachon yangilang." : lang === "ru" ? "Следите за конкурентами и обновляйте ставку в любое время." : "Monitor competitors and update your bid anytime." },
  ];

  const STATS = [
    { val: 340, suffix: "+", label: lang === "uz" ? "Jonli reklamalar" : lang === "ru" ? "Живых рекламы" : "Live Ads" },
    { val: 18, suffix: "", label: lang === "uz" ? "Toifalar" : lang === "ru" ? "Категории" : "Categories" },
    { val: 12000, suffix: "+", label: lang === "uz" ? "Kunlik ko'rishlar" : lang === "ru" ? "Ежедневных просмотров" : "Daily Views" },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float3d {
          0%, 100% { transform: perspective(1000px) rotateX(-6deg) rotateY(14deg) rotateZ(-1deg) translateY(0px); }
          33% { transform: perspective(1000px) rotateX(-10deg) rotateY(10deg) rotateZ(1deg) translateY(-12px); }
          66% { transform: perspective(1000px) rotateX(-4deg) rotateY(18deg) rotateZ(-2deg) translateY(-6px); }
        }
        @keyframes float3d-sm {
          0%, 100% { transform: perspective(600px) rotateX(4deg) rotateY(-8deg) translateY(0px); }
          50% { transform: perspective(600px) rotateX(8deg) rotateY(-12deg) translateY(-10px); }
        }
        @keyframes orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(.9); }
        }
        @keyframes orb-drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-40px, 30px) scale(1.15); }
          80% { transform: translate(20px, -20px) scale(.85); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(124,58,237,.3), 0 0 80px rgba(124,58,237,.08), inset 0 0 20px rgba(124,58,237,.05); }
          50% { box-shadow: 0 0 50px rgba(124,58,237,.5), 0 0 120px rgba(124,58,237,.15), inset 0 0 30px rgba(124,58,237,.1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes rank-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(245,158,11,.4); }
          50% { text-shadow: 0 0 25px rgba(245,158,11,.9), 0 0 50px rgba(245,158,11,.4); }
        }
        @keyframes badge-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .hero-cta-primary:hover { background: #6D28D9 !important; transform: translateY(-2px) !important; box-shadow: 0 8px 30px rgba(124,58,237,.4) !important; }
        .hero-cta-secondary:hover { background: rgba(124,58,237,.1) !important; border-color: rgba(124,58,237,.5) !important; transform: translateY(-2px) !important; }
        .hero-cta-primary, .hero-cta-secondary { transition: all .2s ease !important; }
        @media (max-width: 768px) {
          .landing-hero { flex-direction: column !important; }
          .landing-hero-right { display: none !important; }
          .landing-steps { grid-template-columns: 1fr !important; }
          .landing-stats { flex-direction: column; gap: 20px !important; align-items: center !important; }
        }
      `}} />

      <div style={{ minHeight: "100vh", background: "#0A0715", position: "relative", overflow: "hidden" }}>

        {/* ── Background orbs ──────────────────────────────────────────────── */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.12) 0%, transparent 70%)", animation: "orb-drift 18s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,.08) 0%, transparent 70%)", animation: "orb-drift2 22s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "60%", left: "50%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.07) 0%, transparent 70%)", animation: "orb-drift 28s ease-in-out infinite reverse" }} />
          {/* Grid overlay */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,58,237,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        {/* ── HERO SECTION ────────────────────────────────────────────────── */}
        <section style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 24px 100px", display: "flex", alignItems: "center", gap: 60, minHeight: "88vh" }}>

          {/* Left: text */}
          <div style={{ flex: 1, minWidth: 0, animation: "slideUp .7s both" }}>

            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 100, background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.3)", marginBottom: 28, animation: "badge-pulse 3s ease-in-out infinite" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7C3AED", boxShadow: "0 0 8px #7C3AED", flexShrink: 0 }} />
              <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#A78BFA" }}>{t.heroBadge}</span>
            </div>

            {/* Title */}
            <h1 style={{ margin: "0 0 20px", lineHeight: 1.12, fontFamily: "'Unbounded', sans-serif" }}>
              <span style={{ display: "block", fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontWeight: 800, color: "#EDE9FE", letterSpacing: "-.02em" }}>{t.heroTitle}</span>
              <span style={{ display: "block", fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontWeight: 800, letterSpacing: "-.02em", background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 40%, #F59E0B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{t.heroTitleHighlight}</span>
            </h1>

            {/* Sub */}
            <p style={{ margin: "0 0 36px", fontSize: "clamp(.9rem, 2vw, 1.05rem)", color: "#7C6E9E", lineHeight: 1.7, maxWidth: 480 }}>{t.heroSub}</p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/create" className="hero-cta-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 26px", borderRadius: 13, background: "#7C3AED", color: "#fff", fontSize: ".9rem", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 20px rgba(124,58,237,.3)" }}>
                {t.heroCta1} →
              </Link>
              <Link href="/browse" className="hero-cta-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 26px", borderRadius: 13, background: "transparent", color: "#A78BFA", fontSize: ".9rem", fontWeight: 700, textDecoration: "none", border: "1px solid rgba(124,58,237,.3)" }}>
                {t.heroCta2}
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ marginTop: 40, display: "flex", gap: 24, flexWrap: "wrap" }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", fontWeight: 700, color: "#EDE9FE" }}>
                    <Counter to={s.val} />{s.suffix}
                  </span>
                  <span style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#4A3C6E", fontWeight: 600 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D floating card */}
          <div className="landing-hero-right" style={{ flex: "0 0 420px", position: "relative", height: 420, display: "flex", alignItems: "center", justifyContent: "center", animation: "slideUp .9s both .2s" }}>

            {/* Glow behind card */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: "radial-gradient(ellipse at center, rgba(124,58,237,.25) 0%, transparent 70%)", animation: "glow-pulse 3s ease-in-out infinite" }} />

            {/* 3D Leaderboard card */}
            <div style={{ width: 340, animation: "float3d 6s ease-in-out infinite", transformStyle: "preserve-3d" }}>
              <div style={{
                background: "linear-gradient(160deg, rgba(45,31,80,.95) 0%, rgba(14,11,26,.98) 100%)",
                border: "1px solid rgba(124,58,237,.4)",
                borderRadius: 22,
                overflow: "hidden",
                boxShadow: "0 30px 80px rgba(0,0,0,.6), 0 0 40px rgba(124,58,237,.2), inset 0 1px 0 rgba(255,255,255,.05)",
                transformStyle: "preserve-3d",
              }}>
                {/* Card header */}
                <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(124,58,237,.2)", display: "flex", alignItems: "center", gap: 10, background: "rgba(124,58,237,.08)" }}>
                  <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" rx="24" fill="#7C3AED"/>
                    <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
                    <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
                  </svg>
                  <span style={{ fontFamily: "'Unbounded', sans-serif", fontSize: ".75rem", fontWeight: 700, color: "#EDE9FE", letterSpacing: ".05em" }}>PRIMIO</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 5, alignItems: "center" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 6px #22C55E" }} />
                    <span style={{ fontSize: ".64rem", color: "#22C55E", fontWeight: 600, letterSpacing: ".06em" }}>LIVE</span>
                  </div>
                </div>

                {/* Category label */}
                <div style={{ padding: "10px 20px 6px", fontSize: ".6rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#4A3C6E", fontWeight: 700 }}>
                  {lang === "uz" ? "📱 Ilovalar & SaaS — TOP REYTING" : lang === "ru" ? "📱 Приложения & SaaS — ТОП РЕЙТИНГ" : "📱 Apps & SaaS — TOP RANKING"}
                </div>

                {/* Leaderboard rows */}
                {MOCK_ADS.map((ad, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < 2 ? "1px solid rgba(45,31,80,.5)" : "none", background: i === 0 ? "rgba(245,158,11,.06)" : "transparent" }}>
                    <span style={{ fontSize: "1.2rem", lineHeight: 1, minWidth: 28, textAlign: "center", animation: i === 0 ? "rank-glow 2.5s ease-in-out infinite" : "none" }}>{ad.medal}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: ".82rem", fontWeight: 700, color: i === 0 ? "#FCD34D" : "#A78BFA", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.name}</div>
                      <div style={{ fontSize: ".65rem", color: "#4A3C6E", marginTop: 2 }}>#{ad.rank} {lang === "uz" ? "o'rin" : lang === "ru" ? "место" : "position"}</div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: ".82rem", fontWeight: 700, color: ad.color, flexShrink: 0 }}>{ad.bid}<span style={{ fontSize: ".6rem", color: "#4A3C6E", fontWeight: 400 }}>/kun</span></div>
                  </div>
                ))}

                {/* You card — highlighted */}
                <div style={{ margin: "12px", borderRadius: 12, background: "rgba(124,58,237,.12)", border: "1px dashed rgba(124,58,237,.35)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>?</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#A78BFA" }}>{t.ruleYouBadge}</div>
                    <div style={{ fontSize: ".62rem", color: "#4A3C6E" }}>#{4} {lang === "uz" ? "o'rinda" : lang === "ru" ? "место" : "position"}</div>
                  </div>
                  <div style={{ fontSize: ".72rem", color: "#7C3AED", fontWeight: 700 }}>$2.50<span style={{ fontSize: ".58rem", color: "#4A3C6E" }}>/kun</span></div>
                </div>

                {/* Tip */}
                <div style={{ padding: "10px 20px 14px", fontSize: ".65rem", color: "#7C6E9E", fontStyle: "italic" }}>
                  💡 {t.ruleDemoTip}
                </div>
              </div>
            </div>

            {/* Floating badges behind card */}
            <div style={{ position: "absolute", top: "15%", right: "2%", background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", borderRadius: 10, padding: "7px 12px", fontSize: ".7rem", fontWeight: 700, color: "#F59E0B", animation: "float3d-sm 5s ease-in-out infinite" }}>
              🏆 #1
            </div>
            <div style={{ position: "absolute", bottom: "18%", left: "0%", background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.3)", borderRadius: 10, padding: "7px 12px", fontSize: ".7rem", fontWeight: 700, color: "#A78BFA", animation: "float3d-sm 7s ease-in-out infinite reverse" }}>
              ⚡ LIVE
            </div>
          </div>
        </section>

        {/* ── RULE SECTION ────────────────────────────────────────────────── */}
        <section style={{ position: "relative", zIndex: 1, background: "linear-gradient(180deg, transparent 0%, rgba(22,15,42,.8) 30%, rgba(22,15,42,.8) 70%, transparent 100%)", padding: "80px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <div style={{ display: "inline-block", fontSize: ".65rem", letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 700, color: "#7C3AED", padding: "6px 14px", borderRadius: 100, border: "1px solid rgba(124,58,237,.3)", marginBottom: 20 }}>{t.ruleLabel}</div>
            <h2 style={{ margin: "0 0 14px", fontFamily: "'Unbounded', sans-serif", fontSize: "clamp(1.6rem, 4vw, 2.5rem)", fontWeight: 800, color: "#EDE9FE", lineHeight: 1.2 }}>{t.ruleTitle}</h2>
            <p style={{ margin: "0 0 48px", color: "#6D5B8E", fontSize: ".95rem", lineHeight: 1.7 }}>{t.ruleSub}</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {[t.rulePoint1, t.rulePoint2, t.rulePoint3].map((pt, i) => (
                <div key={i} style={{ background: "rgba(45,31,80,.4)", border: "1px solid rgba(124,58,237,.2)", borderRadius: 16, padding: "20px 18px", display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left", animation: `slideUp .6s both ${200 + i * 120}ms` }}>
                  <span style={{ fontSize: "1.1rem", marginTop: 2, flexShrink: 0 }}>{["⚡","📊","🛡️"][i]}</span>
                  <span style={{ fontSize: ".82rem", color: "#A78BFA", lineHeight: 1.55, fontWeight: 500 }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
        <section style={{ position: "relative", zIndex: 1, padding: "80px 24px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{ display: "inline-block", fontSize: ".65rem", letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 700, color: "#7C3AED", padding: "6px 14px", borderRadius: 100, border: "1px solid rgba(124,58,237,.3)", marginBottom: 16 }}>{t.howLabel}</div>
              <h2 style={{ margin: "0 0 12px", fontFamily: "'Unbounded', sans-serif", fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, color: "#EDE9FE", lineHeight: 1.2 }}>{t.howTitle}</h2>
              <p style={{ color: "#6D5B8E", fontSize: ".92rem", lineHeight: 1.6, margin: 0 }}>{t.howSub}</p>
            </div>

            <div className="landing-steps" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {STEPS.map((s, i) => (
                <StepCard key={i} num={s.num} icon={s.icon} title={s.title} body={s.body} delay={i * 120} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA SECTION ─────────────────────────────────────────────────── */}
        <section style={{ position: "relative", zIndex: 1, padding: "80px 24px 120px" }}>
          <div style={{
            maxWidth: 760, margin: "0 auto",
            background: "linear-gradient(135deg, rgba(124,58,237,.15) 0%, rgba(45,31,80,.4) 50%, rgba(124,58,237,.08) 100%)",
            border: "1px solid rgba(124,58,237,.3)",
            borderRadius: 28, padding: "52px 40px",
            textAlign: "center",
            position: "relative", overflow: "hidden",
            animation: "glow-pulse 4s ease-in-out infinite",
          }}>
            {/* BG grid */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,58,237,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,.05) 1px, transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />

            <div style={{ position: "relative" }}>
              <div style={{ fontSize: "3rem", marginBottom: 16, animation: "badge-pulse 2.5s ease-in-out infinite" }}>🚀</div>
              <h2 style={{ margin: "0 0 14px", fontFamily: "'Unbounded', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 800, color: "#EDE9FE", lineHeight: 1.2 }}>
                {lang === "uz" ? "Bugundan boshla, birinchi bo'l!" : lang === "ru" ? "Начни сегодня — будь первым!" : "Start today, rank first!"}
              </h2>
              <p style={{ color: "#7C6E9E", fontSize: ".9rem", lineHeight: 1.7, marginBottom: 32, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
                {lang === "uz" ? "Ro'yxatdan o'ting va daqiqalar ichida birinchi reklamangizni joylang." : lang === "ru" ? "Зарегистрируйтесь и разместите первое объявление за несколько минут." : "Sign up and post your first ad in minutes."}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href={firebaseUser ? "/create" : "/auth"} className="hero-cta-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 13, background: "#7C3AED", color: "#fff", fontSize: ".9rem", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 20px rgba(124,58,237,.35)" }}>
                  {firebaseUser ? t.heroCta1 : t.navSignIn} →
                </Link>
                <Link href="/browse" className="hero-cta-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 13, background: "transparent", color: "#A78BFA", fontSize: ".9rem", fontWeight: 700, textDecoration: "none", border: "1px solid rgba(124,58,237,.3)" }}>
                  {t.heroCta2}
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
