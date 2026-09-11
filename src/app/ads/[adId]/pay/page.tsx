"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ad, CATEGORIES } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const BETA_LAUNCH = "15 sentabr, 2026";

const METHODS = [
  { id: "card",       icon: "💳", label: "Visa / Mastercard", hint: "Stripe orqali shifrlangan" },
  { id: "google_pay", icon: "🔵", label: "Google Pay",        hint: "Tez va xavfsiz" },
  { id: "apple_pay",  icon: "🍎", label: "Apple Pay",         hint: "Face ID / Touch ID" },
  { id: "paypal",     icon: "🔶", label: "PayPal",            hint: "200M+ foydalanuvchi" },
  { id: "crypto",     icon: "₿",  label: "USDT / USDC",       hint: "Bank kerak emas" },
];

export default function PaymentPage() {
  const { adId } = useParams<{ adId: string }>();
  const router = useRouter();
  const { firebaseUser, userProfile } = useAuth();

  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState("card");
  const [error, setError] = useState("");
  const [waitEmail, setWaitEmail] = useState("");
  const [waitSent, setWaitSent] = useState(false);
  const [waitLoading, setWaitLoading] = useState(false);

  useEffect(() => {
    if (!adId) return;
    getDoc(doc(db, "ads", adId)).then((snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Ad;
        if (data.status !== "pending") { router.push("/dashboard"); return; }
        setAd(data);
      }
      setLoading(false);
    });
  }, [adId, router]);

  const handlePay = async () => {
    if (!ad || !firebaseUser) return;
    setPaying(true);
    setError("");
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch("/api/payment/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ adId: ad.id, amount: ad.dailyBidCents * ad.durationDays, method }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "To'lov yaratishda xato");
      }
    } catch (err: any) {
      setError(err.message);
      setPaying(false);
    }
  };

  const handleWaitlist = async () => {
    if (!waitEmail.includes("@") || waitLoading) return;
    setWaitLoading(true);
    try {
      await setDoc(doc(db, "waitlist", waitEmail.toLowerCase().trim()), {
        email: waitEmail.toLowerCase().trim(),
        adId: ad?.id || null,
        uid: firebaseUser?.uid || null,
        createdAt: serverTimestamp(),
      }, { merge: true });
      setWaitSent(true);
    } catch {
      // silent fail — user still sees success (don't block UX on Firestore error)
      setWaitSent(true);
    } finally {
      setWaitLoading(false);
    }
  };

  const initials = userProfile?.displayName?.charAt(0).toUpperCase() || "?";
  const brandName = userProfile?.displayName || "Profil";
  const spent = userProfile?.totalSpentCents || 0;
  const totalUSD = ad ? (ad.dailyBidCents * ad.durationDays) / 100 : 0;
  const catMeta = ad ? CATEGORIES[ad.category] : null;

  const cardStyle: React.CSSProperties = { background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 18 };

  const DashHeader = () => (
    <header style={{ position: "sticky", top: 0, zIndex: 80, background: "rgba(14,11,26,.94)", backdropFilter: "blur(18px)", borderBottom: "1px solid #2D1F50" }}>
      <div style={{ padding: "11px 26px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="24" fill="#7C3AED"/>
              <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
              <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
            </svg>
            <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".85rem", fontWeight: 700, color: "#EDE9FE" }}>PRIMIO</span>
          </Link>
          <span style={{ padding: "2px 9px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", fontSize: ".66rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "#6D5B8E" }}>
            To&apos;lov
          </span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 10, background: "#160F2A", border: "1px solid #2D1F50" }}>
            <span style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#6D5B8E", fontWeight: 700 }}>Jami sarflangan</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".86rem", fontWeight: 600, color: "#FCD34D" }}>${(spent / 100).toFixed(0)}</span>
          </div>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 11px 5px 5px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", color: "#EDE9FE", textDecoration: "none" }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, color: "#fff" }}>{initials}</span>
            <span style={{ fontSize: ".78rem", fontWeight: 600 }}>{brandName}</span>
          </Link>
          <Link href="/create" style={{ padding: "9px 16px", borderRadius: 10, background: "#7C3AED", color: "#fff", fontSize: ".82rem", fontWeight: 700, textDecoration: "none" }}>+ Reklama berish</Link>
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0E0B1A", color: "#EDE9FE" }}>
        <DashHeader />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <span style={{ color: "#6D5B8E" }}>Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!ad || !catMeta) {
    return (
      <div style={{ minHeight: "100vh", background: "#0E0B1A", color: "#EDE9FE" }}>
        <DashHeader />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <span style={{ color: "#F87171" }}>Reklama topilmadi</span>
        </div>
      </div>
    );
  }

  const payRows = [
    { k: "Toifa",       v: `${catMeta.emoji} ${catMeta.label}`, color: "#EDE9FE" },
    { k: "Sarlavha",    v: ad.title,                             color: "#EDE9FE" },
    { k: "Kunlik narx", v: `$${(ad.dailyBidCents / 100).toFixed(2)}/kun`, color: "#FCD34D" },
    { k: "Davr",        v: `${ad.durationDays} kun`,             color: "#EDE9FE" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0E0B1A", color: "#EDE9FE", fontFamily: "system-ui,sans-serif" }}>
      <style>{`@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}*{box-sizing:border-box}`}</style>
      <DashHeader />

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "38px 26px 60px", animation: "fade .35s ease both" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6D5B8E", fontSize: ".82rem", textDecoration: "none", marginBottom: 16 }}>
          ← Reklamalarim
        </Link>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 100, background: "rgba(52,211,153,.12)", border: "1px solid #10B981", marginBottom: 14, marginLeft: 12 }}>
          <span style={{ fontSize: ".8rem" }}>✅</span>
          <span style={{ fontSize: ".76rem", fontWeight: 700, color: "#34D399" }}>AI tasdiqladi</span>
        </div>

        <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.03em", marginBottom: 8 }}>
          To&apos;lov
        </h1>
        <p style={{ fontSize: ".92rem", color: "#A78BFA", maxWidth: "56ch", lineHeight: 1.7, marginBottom: 26 }}>
          Reklamangiz AI tomonidan tasdiqlandi. To&apos;lovdan so&apos;ng darhol jonli bo&apos;ladi.
        </p>

        {error && (
          <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 12, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.28)", color: "#F87171", fontSize: ".84rem" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 330px", gap: 16, alignItems: "start" }}>
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Order */}
            <div style={{ ...cardStyle, padding: 22 }}>
              <div style={{ fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 14 }}>Buyurtma tafsilotlari</div>
              {payRows.map((r) => (
                <div key={r.k} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "11px 0", borderBottom: "1px solid #2D1F50", fontSize: ".85rem" }}>
                  <span style={{ color: "#A78BFA" }}>{r.k}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: r.color, textAlign: "right", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 14, paddingTop: 16 }}>
                <span style={{ fontSize: ".9rem", fontWeight: 700, color: "#EDE9FE" }}>Jami to&apos;lov</span>
                <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.9rem", fontWeight: 700, color: "#34D399", lineHeight: 1 }}>${totalUSD.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: ".78rem", color: "#6D5B8E", marginTop: 6, textAlign: "right" }}>
                ${(ad.dailyBidCents / 100).toFixed(2)}/kun x {ad.durationDays} kun
              </div>
            </div>

            {/* Beta notice */}
            <div style={{ borderRadius: 16, border: "1px solid #F59E0B", background: "linear-gradient(135deg,rgba(120,53,15,.45),rgba(146,64,14,.3))", padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: "1.4rem" }}>🚀</span>
                <div>
                  <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#FCD34D" }}>To'lov tizimi {BETA_LAUNCH} kuni ochiladi</div>
                  <div style={{ fontSize: ".77rem", color: "#D97706", marginTop: 2 }}>Reklamangiz saqlandi — to'lov ochilgach darhol faollashtirasiz</div>
                </div>
              </div>
              <div style={{ height: 1, background: "rgba(245,158,11,.25)", marginBottom: 16 }} />
              {waitSent ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 12, background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.3)" }}>
                  <span style={{ fontSize: "1.1rem" }}>✅</span>
                  <div>
                    <div style={{ fontSize: ".86rem", fontWeight: 700, color: "#34D399" }}>Qabul qilindi!</div>
                    <div style={{ fontSize: ".76rem", color: "#6D5B8E", marginTop: 2 }}>To'lov ochilganda sizga xabar beramiz.</div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: ".78rem", color: "#FDE68A", marginBottom: 10 }}>
                    📧 Bildirishnoma olish uchun email qoldiring:
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={waitEmail}
                      onChange={(e) => setWaitEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleWaitlist()}
                      style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(245,158,11,.4)", background: "rgba(0,0,0,.3)", color: "#FDE68A", fontSize: ".85rem", outline: "none" }}
                    />
                    <button
                      onClick={handleWaitlist}
                      disabled={waitLoading || !waitEmail.includes("@")}
                      style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: waitLoading ? "#92400E" : "#F59E0B", color: "#1A1230", fontWeight: 700, fontSize: ".84rem", cursor: waitLoading || !waitEmail.includes("@") ? "not-allowed" : "pointer", opacity: !waitEmail.includes("@") ? .6 : 1, whiteSpace: "nowrap" }}
                    >
                      {waitLoading ? "..." : "Xabar ber"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(52,211,153,.06)", border: "1px solid rgba(52,211,153,.2)", fontSize: ".82rem", color: "#A78BFA" }}>
              <span>🔒</span>
              <span>To'lov tizimi ishga tushgach Dodo Payments orqali xavfsiz shifrlangan holda to'laysiz.</span>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 12 }}>Reklamangiz</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".9rem", color: "#fff", flexShrink: 0 }}>
                  {catMeta.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: ".87rem", fontWeight: 700, color: "#EDE9FE", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.title}</div>
                  <div style={{ fontSize: ".74rem", color: "#6D5B8E" }}>{catMeta.label} · {ad.durationDays} kun</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #2D1F50", borderBottom: "1px solid #2D1F50", fontSize: ".82rem" }}>
                <span style={{ color: "#6D5B8E" }}>Kunlik narx</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#FCD34D" }}>${(ad.dailyBidCents / 100).toFixed(2)}/kun</span>
              </div>
              <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 11, background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: ".82rem", color: "#34D399", fontWeight: 700 }}>Jami</span>
                <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#34D399" }}>${totalUSD.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ background: "#160F2A", border: "1px solid #2D1F50", borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 13 }}>Keyingi qadamlar</div>
              {[
                { icon: "✅", text: "AI tasdiqladi", done: true, active: false },
                { icon: "💳", text: "To'lov", done: false, active: true },
                { icon: "🚀", text: "Reklama jonli", done: false, active: false },
                { icon: "📊", text: "Statistikani ko'ring", done: false, active: false },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: i < 3 ? 12 : 0, marginBottom: i < 3 ? 12 : 0, borderBottom: i < 3 ? "1px dashed #2D1F50" : "none" }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: step.done ? "rgba(52,211,153,.15)" : step.active ? "rgba(124,58,237,.2)" : "#1A1230", border: `1px solid ${step.done ? "#10B981" : step.active ? "#7C3AED" : "#2D1F50"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", flexShrink: 0 }}>{step.icon}</span>
                  <span style={{ fontSize: ".82rem", color: step.done ? "#34D399" : step.active ? "#A855F7" : "#6D5B8E", fontWeight: step.active ? 700 : 400 }}>{step.text}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#160F2A", border: "1px solid #2D1F50", borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 10 }}>Kafolat</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: ".79rem", color: "#A78BFA", lineHeight: 1.5 }}>
                <div style={{ display: "flex", gap: 8 }}><span style={{ color: "#34D399" }}>&#10003;</span> Moderatsiyadan o&apos;tmasa — to&apos;liq qaytarish</div>
                <div style={{ display: "flex", gap: 8 }}><span style={{ color: "#34D399" }}>&#10003;</span> Texnik xatolik bo&apos;lsa — ko&apos;rib chiqiladi</div>
                <div style={{ display: "flex", gap: 8 }}><span style={{ color: "#34D399" }}>&#10003;</span> Dodo Payments xavfsiz to'lov tizimi</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
