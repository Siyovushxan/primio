"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ad, CATEGORIES } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { ArrowUp, Info, Trophy } from "lucide-react";

export default function BidUpgradePage() {
  const { adId } = useParams<{ adId: string }>();
  const router = useRouter();
  const { firebaseUser, userProfile, loading: authLoading } = useAuth();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [newBid, setNewBid] = useState(1);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !adId) return;
    if (!firebaseUser) { router.push("/dashboard"); return; }
    getDoc(doc(db, "ads", adId)).then((snap) => {
      if (!snap.exists()) { router.push("/dashboard"); return; }
      const data = { id: snap.id, ...snap.data() } as Ad;
      if (data.status !== "active" || data.advertiserUID !== firebaseUser.uid) {
        router.push("/dashboard"); return;
      }
      setAd(data);
      setNewBid(Math.floor(data.dailyBidCents / 100) + 1);
      setLoading(false);
    });
  }, [adId, firebaseUser, authLoading, router]);

  const handlePay = async () => {
    if (!ad) return;
    const currentBidUSD = ad.dailyBidCents / 100;
    if (newBid <= currentBidUSD) {
      setError(`Yangi bid joriy biddan ($${currentBidUSD}/kun) yuqori bo'lishi kerak`);
      return;
    }
    setError("");
    setPaying(true);
    try {
      const idToken = await firebaseUser!.getIdToken();
      const res = await fetch("/api/payment/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          adId: ad.id,
          amount: Math.round(extraToPay * 100),
          type: "bid_upgrade",
          newDailyBidCents: Math.round(newBid * 100),
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error);
    } catch (err: any) {
      setError("Xato: " + err.message);
      setPaying(false);
    }
  };

  const initials = userProfile?.displayName?.charAt(0).toUpperCase() || "?";
  const brandName = userProfile?.displayName || "Profil";
  const spent = userProfile?.totalSpentCents || 0;

  const currentBidUSD = ad ? ad.dailyBidCents / 100 : 0;
  const daysRemaining = ad?.expiresAt
    ? Math.max(0, Math.ceil((ad.expiresAt.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const diffPerDay = newBid - currentBidUSD;
  const extraToPay = diffPerDay > 0 ? diffPerDay * daysRemaining : 0;
  const catMeta = ad ? CATEGORIES[ad.category] : null;

  const card: React.CSSProperties = {
    background: "#1A1230",
    border: "1px solid #2D1F50",
    borderRadius: 18,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0E0B1A", color: "#EDE9FE", fontFamily: "system-ui,sans-serif" }}>
      <style>{`@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}*{box-sizing:border-box}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{opacity:1}`}</style>

      {/* Dashboard header */}
      <header style={{ position: "sticky", top: 0, zIndex: 80, background: "rgba(14,11,26,.94)", backdropFilter: "blur(18px)", borderBottom: "1px solid #2D1F50" }}>
        <div style={{ padding: "11px 26px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="24" fill="#7C3AED"/>
              <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
              <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
            </svg>
            <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".85rem", fontWeight: 700, color: "#EDE9FE" }}>PRIMIO</span>
            <span style={{ padding: "2px 9px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", fontSize: ".66rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "#6D5B8E" }}>
              Bid oshirish
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

      {loading || !ad || !catMeta ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <span style={{ color: "#6D5B8E" }}>Yuklanmoqda...</span>
        </div>
      ) : (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "38px 24px 60px", animation: "fade .35s ease both" }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6D5B8E", fontSize: ".82rem", textDecoration: "none", marginBottom: 20 }}>
            ← Dashboard
          </Link>

          {/* Title */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trophy size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-.02em" }}>Bidni oshirish</h1>
                <p style={{ fontSize: ".8rem", color: "#6D5B8E", marginTop: 2 }}>{catMeta.emoji} {catMeta.label} · {ad.title}</p>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", color: "#F87171", fontSize: ".84rem" }}>
              {error}
            </div>
          )}

          {/* Ranking preview */}
          <div style={{ ...card, padding: 20, marginBottom: 14 }}>
            <div style={{ fontSize: ".66rem", letterSpacing: ".12em", textTransform: "uppercase" as const, color: "#6D5B8E", fontWeight: 700, marginBottom: 14 }}>Reyting o&apos;zgarishi</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Before */}
              <div style={{ flex: 1, background: "#160F2A", borderRadius: 12, padding: "14px 16px", border: "1px solid #2D1F50", textAlign: "center" }}>
                <div style={{ fontSize: ".68rem", color: "#6D5B8E", marginBottom: 6 }}>Hozirgi</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.4rem", fontWeight: 700, color: "#FCD34D" }}>${currentBidUSD.toFixed(0)}</div>
                <div style={{ fontSize: ".72rem", color: "#6D5B8E" }}>/kun</div>
              </div>
              <ArrowUp size={20} color="#7C3AED" style={{ flexShrink: 0 }} />
              {/* After */}
              <div style={{ flex: 1, background: "rgba(124,58,237,.12)", borderRadius: 12, padding: "14px 16px", border: "1px solid #7C3AED", textAlign: "center" }}>
                <div style={{ fontSize: ".68rem", color: "#A78BFA", marginBottom: 6 }}>Yangi</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.4rem", fontWeight: 700, color: "#A855F7" }}>${newBid.toFixed(0)}</div>
                <div style={{ fontSize: ".72rem", color: "#A78BFA" }}>/kun</div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)", fontSize: ".8rem", color: "#34D399", textAlign: "center" }}>
              🏆 1-o&apos;ringa chiqasiz
            </div>
          </div>

          {/* Current status */}
          <div style={{ ...card, padding: 20, marginBottom: 14 }}>
            <div style={{ fontSize: ".66rem", letterSpacing: ".12em", textTransform: "uppercase" as const, color: "#6D5B8E", fontWeight: 700, marginBottom: 14 }}>Joriy holat</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", marginBottom: 10 }}>
              <span style={{ color: "#A78BFA" }}>Joriy bid</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#FCD34D" }}>${currentBidUSD.toFixed(2)}/kun</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem" }}>
              <span style={{ color: "#A78BFA" }}>Qolgan kunlar</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#EDE9FE" }}>{daysRemaining} kun</span>
            </div>
          </div>

          {/* New bid input */}
          <div style={{ ...card, padding: 20, marginBottom: 14 }}>
            <label style={{ fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#6D5B8E", fontWeight: 700, display: "block", marginBottom: 12 }}>
              Yangi kunlik bid (USD)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.4rem", color: "#6D5B8E", fontFamily: "'JetBrains Mono',monospace" }}>$</span>
              <input
                type="number"
                value={newBid}
                onChange={(e) => setNewBid(Math.max(currentBidUSD + 0.5, parseFloat(e.target.value) || currentBidUSD + 1))}
                min={currentBidUSD + 0.5}
                step={0.5}
                style={{ flex: 1, background: "#160F2A", border: "1px solid #2D1F50", borderRadius: 10, padding: "12px 14px", fontSize: "1.4rem", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#EDE9FE", outline: "none" }}
              />
              <span style={{ fontSize: ".9rem", color: "#6D5B8E" }}>/kun</span>
            </div>
            <div style={{ marginTop: 8, fontSize: ".76rem", color: "#6D5B8E" }}>
              Minimal: ${(currentBidUSD + 0.5).toFixed(2)}/kun
            </div>
          </div>

          {/* Calculation */}
          {diffPerDay > 0 && daysRemaining > 0 && (
            <div style={{ background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.25)", borderRadius: 16, padding: 20, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 14 }}>
                <Info size={14} color="#A78BFA" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: ".78rem", color: "#A78BFA" }}>Faqat qolgan {daysRemaining} kun uchun farq to&apos;lanadi</p>
              </div>
              <div style={{ fontSize: ".85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#6D5B8E" }}>Farq (${newBid.toFixed(2)} − ${currentBidUSD.toFixed(2)})/kun</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#EDE9FE" }}>${diffPerDay.toFixed(2)}/kun</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #2D1F50" }}>
                  <span style={{ color: "#6D5B8E" }}>× {daysRemaining} kun</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.1rem", fontWeight: 700, color: "#34D399" }}>= ${extraToPay.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={paying || diffPerDay <= 0 || daysRemaining === 0}
            style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: (paying || diffPerDay <= 0 || daysRemaining === 0) ? "#4C1D95" : "linear-gradient(135deg,#F59E0B,#FBBF24)", color: "#1A1230", fontSize: "1rem", fontWeight: 800, cursor: (paying || diffPerDay <= 0) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12, boxShadow: (diffPerDay > 0 && !paying) ? "0 4px 20px rgba(245,158,11,.35)" : "none" }}
          >
            <ArrowUp size={18} />
            {paying ? "Yo'naltirilmoqda..." : `$${extraToPay.toFixed(2)} to'lash va 1-o'ringa chiqish`}
          </button>

          <button
            onClick={() => router.back()}
            style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1px solid #2D1F50", background: "transparent", color: "#6D5B8E", fontSize: ".85rem", cursor: "pointer" }}
          >
            ← Bekor qilish
          </button>
        </div>
      )}
    </div>
  );
}
