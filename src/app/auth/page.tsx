"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import Link from "next/link";

const inp = {
  width: "100%", padding: "13px 15px", borderRadius: 12,
  background: "rgba(21,21,27,.8)", border: "1px solid rgba(42,42,53,.8)",
  color: "var(--text)", fontSize: ".92rem", outline: "none",
  boxSizing: "border-box" as const,
} as const;

function AuthPageInner() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { t } = useLang();
  const [step, setStep] = useState<1 | 2>(1);
  const [brand, setBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (firebaseUser) router.replace("/dashboard");
  }, [firebaseUser, router]);

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        router.push("/dashboard");
      } else {
        setBrand(user.displayName || "");
        setStep(2);
        setLoading(false);
      }
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(t.authError);
      }
      setLoading(false);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!brand.trim()) return setError(t.authBrandError);
    setLoading(true);
    try {
      const user = auth.currentUser!;
      await setDoc(doc(db, "users", user.uid), {
        displayName: brand.trim(),
        email: user.email || "",
        photoURL: user.photoURL || "",
        totalSpentCents: 0,
        createdAt: serverTimestamp(),
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(t.authGenError + ": " + (err?.message || t.tryAgain));
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", position: "relative", overflow: "hidden" }}>

      {/* ── Background orbs ──────────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.13) 0%, transparent 70%)", animation: "orb-drift 18s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,.08) 0%, transparent 70%)", animation: "orb-drift2 24s ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,58,237,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,.03) 1px, transparent 1px)", backgroundSize: "55px 55px" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "56px 20px 60px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="rg-auth">

          {/* ── LEFT ─────────────────────────────────────────────────────── */}
          <div style={{ animation: "slideUp .6s both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 100, background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.3)", marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C3AED", boxShadow: "0 0 8px #7C3AED" }} />
              <span style={{ fontSize: ".67rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#A78BFA" }}>{t.authLabel}</span>
            </div>
            <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.12, marginBottom: 14, color: "var(--text)" }}>
              {t.authTitle}
            </h1>
            <p style={{ fontSize: ".95rem", color: "var(--muted)", lineHeight: 1.75, maxWidth: "50ch", marginBottom: 28 }}>
              {t.authSub}
            </p>

            {/* Perks */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: "52ch" }}>
              {t.authPerks.map((p, i) => (
                <div key={p.icon} style={{ display: "flex", gap: 13, alignItems: "flex-start", animation: `slideUp .5s both ${100 + i * 80}ms` }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, rgba(124,58,237,.2), rgba(42,42,53,.5))", border: "1px solid rgba(124,58,237,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".85rem", flexShrink: 0 }}>
                    {p.icon}
                  </span>
                  <div>
                    <div style={{ fontSize: ".87rem", fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{p.title}</div>
                    <div style={{ fontSize: ".81rem", color: "var(--muted)", lineHeight: 1.6 }}>{p.body}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Note card */}
            <div style={{ marginTop: 28, padding: "16px 20px", borderRadius: 16, background: "rgba(21,21,27,.7)", border: "1px solid rgba(42,42,53,.7)", maxWidth: "52ch" }}>
              <div style={{ fontSize: ".8rem", color: "var(--muted)", lineHeight: 1.65 }}>
                {t.authNoAccountNote}
              </div>
              <Link href="/browse" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "9px 15px", borderRadius: 10, background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.25)", color: "#A78BFA", fontSize: ".8rem", fontWeight: 600, textDecoration: "none", transition: "all .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,.18)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,.1)"; }}>
                {t.authViewRanking} →
              </Link>
            </div>
          </div>

          {/* ── RIGHT — card ─────────────────────────────────────────────── */}
          <div className="rg-auth-card" style={{ animation: "slideUp .7s both .1s" }}>
            <div style={{
              background: "linear-gradient(160deg, rgba(42,42,53,.8) 0%, rgba(11,11,15,.95) 100%)",
              border: "1px solid rgba(124,58,237,.3)",
              borderRadius: 24, padding: 28,
              boxShadow: "0 30px 80px rgba(0,0,0,.5), 0 0 40px rgba(124,58,237,.12)",
              position: "relative", overflow: "hidden",
              animation: "glow-pulse 4s ease-in-out infinite",
            }}>
              {/* Top accent line */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #7C3AED, #A855F7, transparent)" }} />

              {error && (
                <div style={{ marginBottom: 16, padding: "10px 13px", borderRadius: 10, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", color: "#F87171", fontSize: ".83rem" }}>
                  {error}
                </div>
              )}

              {/* Step 1 — Google button */}
              {step === 1 && (
                <>
                  <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                    {t.authWelcome}
                  </div>
                  <div style={{ fontSize: ".83rem", color: "var(--muted)", lineHeight: 1.65, marginBottom: 24 }}>
                    {t.authWelcomeSub.split("\n").map((line, i) => (
                      <span key={i}>{line}{i < t.authWelcomeSub.split("\n").length - 1 && <br />}</span>
                    ))}
                  </div>

                  <button
                    onClick={handleGoogle}
                    disabled={loading}
                    style={{
                      width: "100%", padding: "16px 0", borderRadius: 13,
                      background: loading ? "#1e1e2e" : "#ffffff",
                      border: "none", cursor: loading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      fontSize: ".95rem", fontWeight: 700, color: "#111",
                      transition: "opacity .15s, transform .15s", opacity: loading ? 0.6 : 1,
                      boxShadow: "0 4px 20px rgba(0,0,0,.4)",
                    }}
                    onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
                  >
                    {loading ? (
                      <span style={{ color: "#A78BFA" }}>{t.authLoading}</span>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {t.authGoogle}
                      </>
                    )}
                  </button>

                  <div style={{ marginTop: 14, padding: "11px 14px", borderRadius: 10, background: "rgba(11,11,15,.6)", border: "1px solid rgba(42,42,53,.6)" }}>
                    <div style={{ fontSize: ".77rem", color: "var(--dim)", lineHeight: 1.6 }}>
                      {t.authPrivacy}
                    </div>
                  </div>

                  <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(42,42,53,.6)" }}>
                    <div style={{ fontSize: ".78rem", color: "var(--dim)", lineHeight: 1.6, marginBottom: 12 }}>
                      {t.authDemoNote}
                    </div>
                    <Link href="/browse" style={{ display: "block", width: "100%", padding: "12px 0", borderRadius: 11, background: "rgba(124,58,237,.08)", border: "1px dashed rgba(124,58,237,.3)", color: "#A78BFA", fontSize: ".82rem", fontWeight: 600, textDecoration: "none", textAlign: "center", boxSizing: "border-box", transition: "background .2s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,.14)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,.08)"; }}>
                      {t.authBrowse}
                    </Link>
                  </div>
                </>
              )}

              {/* Step 2 — Brand name (new users only) */}
              {step === 2 && (
                <form onSubmit={handleFinish} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 100, background: "#7C3AED" }} />
                    <div style={{ flex: 1, height: 4, borderRadius: 100, background: "#7C3AED" }} />
                  </div>
                  <div style={{ fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>
                    {t.authLastStep}
                  </div>
                  <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
                    {t.authBrandTitle}
                  </div>
                  <div style={{ fontSize: ".83rem", color: "var(--muted)", lineHeight: 1.6, marginTop: -8 }}>
                    {t.authBrandSub}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: ".77rem", fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{t.authBrandLabel}</label>
                    <input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder={t.authBrandPlaceholder}
                      style={inp}
                      required autoFocus
                    />
                  </div>

                  <button
                    type="submit" disabled={loading}
                    style={{ padding: "14px 0", borderRadius: 12, background: loading ? "#4C1D95" : "#7C3AED", border: "none", color: "#fff", fontSize: ".9rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all .2s" }}
                    onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#6D28D9"; }}
                    onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#7C3AED"; }}
                  >
                    {loading ? t.authCreating : t.authCreate}
                  </button>

                  <div style={{ fontSize: ".75rem", color: "var(--dim)", textAlign: "center", lineHeight: 1.55 }}>
                    {t.authTerms}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <AuthPageInner />
    </Suspense>
  );
}
