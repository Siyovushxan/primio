"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Ad } from "@/types";
import Link from "next/link";

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const adId = searchParams.get("adId");
  const sessionId = searchParams.get("session_id");
  const { userProfile } = useAuth();

  const [ad, setAd] = useState<Ad | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [processing, setProcessing] = useState(true);
  const [paymentType, setPaymentType] = useState<string>("purchase");

  // Step 1: Verify Stripe session server-side (all Firestore writes happen on server)
  useEffect(() => {
    if (!sessionId || !adId) { setProcessing(false); return; }

    fetch("/api/payment/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setVerifyError(data.error); }
        else { setPaymentType(data.type || "purchase"); }
        setProcessing(false);
      })
      .catch(() => { setVerifyError("Server bilan ulanishda xato"); setProcessing(false); });
  }, [sessionId, adId]);

  // Step 2: Listen for Firestore status
  useEffect(() => {
    if (!adId) return;
    const unsub = onSnapshot(doc(db, "ads", adId), (snap) => {
      if (snap.exists()) setAd({ id: snap.id, ...snap.data() } as Ad);
    });
    return unsub;
  }, [adId]);

  const isBidUpgrade = paymentType === "bid_upgrade";
  const isActive = ad?.status === "active";
  const isVerifying = ad?.status === "pending_verification";
  const initials = userProfile?.displayName?.charAt(0).toUpperCase() || "?";
  const brandName = userProfile?.displayName || "Profil";
  const spent = userProfile?.totalSpentCents || 0;

  const card: React.CSSProperties = {
    background: "linear-gradient(135deg, #1A1230 0%, #120D24 100%)",
    border: "1px solid rgba(124,58,237,0.25)",
    borderRadius: 24, padding: "40px 36px", maxWidth: 440, width: "100%",
    boxShadow: "0 0 60px rgba(124,58,237,0.12), 0 24px 48px rgba(0,0,0,0.4)",
    textAlign: "center", position: "relative", overflow: "hidden",
  };
  const glow: React.CSSProperties = {
    position: "absolute", top: -60, right: -60, width: 200, height: 200,
    borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
    pointerEvents: "none",
  };
  const btnPrimary: React.CSSProperties = {
    display: "block", width: "100%", padding: "13px 0", borderRadius: 12,
    background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff",
    fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer",
    textDecoration: "none", marginBottom: 10,
  };
  const btnSecondary: React.CSSProperties = {
    display: "block", width: "100%", padding: "12px 0", borderRadius: 12,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    color: "#9CA3AF", fontWeight: 600, fontSize: 14, textDecoration: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0E0B1A", color: "#EDE9FE", fontFamily: "system-ui,sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Dashboard-style header */}
      <header style={{ position: "sticky", top: 0, zIndex: 80, background: "rgba(14,11,26,.94)", backdropFilter: "blur(18px)", borderBottom: "1px solid #2D1F50" }}>
        <div style={{ padding: "11px 26px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="24" fill="#7C3AED"/>
              <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
              <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
            </svg>
            <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".85rem", fontWeight: 700, color: "#EDE9FE" }}>PRIMIO</span>
            <span style={{ padding: "2px 9px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", fontSize: ".66rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#6D5B8E" }}>To'lov natijasi</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 10, background: "#160F2A", border: "1px solid #2D1F50" }}>
              <span style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700 }}>Jami sarflangan</span>
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

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", padding: "0 16px" }}>
        <div style={card}>
          <div style={glow} />
          <div style={{ position: "relative" }}>
            {verifyError ? (
              <>
                <div style={{ fontSize: 52, marginBottom: 20 }}>❌</div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Xato</h1>
                <p style={{ color: "#F87171", fontSize: 14, marginBottom: 24 }}>{verifyError}</p>
                <Link href="/dashboard" style={btnPrimary}>Dashboard</Link>
              </>
            ) : processing ? (
              <>
                <div style={{ width: 64, height: 64, borderRadius: "50%", border: "4px solid rgba(124,58,237,0.2)", borderTop: "4px solid #7C3AED", margin: "0 auto 24px", animation: "spin 1s linear infinite" }} />
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>To'lov qayta ishlanmoqda...</h1>
                <p style={{ color: "#9CA3AF", fontSize: 14 }}>Bir necha soniya kuting.</p>
              </>
            ) : isBidUpgrade ? (
              <>
                <div style={{ fontSize: 56, marginBottom: 20 }}>🏆</div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Bid muvaffaqiyatli oshirildi!</h1>
                <p style={{ color: "#9CA3AF", fontSize: 14, marginBottom: 6 }}>Reklamangiz yangi bid bilan reytingda yuqoriga ko'tarildi.</p>
                {ad && <p style={{ color: "#C4B5FD", fontWeight: 600, fontSize: 14, marginBottom: 24 }}>{ad.title}</p>}
                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 28 }}>
                  <p style={{ fontSize: 13, color: "#34D399" }}>✓ Yangi bid faollashtirildi</p>
                </div>
                <Link href="/dashboard" style={btnPrimary}>Dashboard →</Link>
                <Link href="/" style={btnSecondary}>Bosh sahifa</Link>
              </>
            ) : isActive ? (
              <>
                <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>To'lov muvaffaqiyatli!</h1>
                <p style={{ color: "#9CA3AF", fontSize: 14, marginBottom: 6 }}>Reklamangiz hozir jonli.</p>
                {ad && <p style={{ color: "#C4B5FD", fontWeight: 600, fontSize: 14, marginBottom: 24 }}>{ad.title}</p>}
                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 28 }}>
                  <p style={{ fontSize: 13, color: "#34D399" }}>✓ Reklama reytingda ko'rinmoqda</p>
                </div>
                <Link href="/dashboard" style={btnPrimary}>Dashboard →</Link>
                <Link href="/" style={btnSecondary}>Bosh sahifa</Link>
              </>
            ) : (
              <>
                <div style={{ fontSize: 52, marginBottom: 20 }}>⏳</div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>To'lov qabul qilindi</h1>
                <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>Reklamangiz 24 soat ichida tekshiriladi.</p>
                <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 28 }}>
                  <p style={{ fontSize: 13, color: "#FCD34D" }}>⏳ Tasdiqlangandan keyin reklama jonli bo'ladi.</p>
                </div>
                <Link href="/dashboard" style={btnPrimary}>Dashboard →</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0E0B1A" }} />}>
      <PaymentSuccessInner />
    </Suspense>
  );
}
