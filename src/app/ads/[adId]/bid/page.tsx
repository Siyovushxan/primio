"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ad, CATEGORIES } from "@/types";
import { MIN_BID_INCREMENT_CENTS } from "@/lib/adRules";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import Link from "next/link";
import { ArrowUp, Info, Trophy } from "lucide-react";

const T = {
  en: {
    pageLabel: "Raise Bid", totalSpent: "Total spent", placeAd: "Post Ad",
    loading: "Loading...", title: "Raise Bid",
    rankChange: "Ranking change", currently: "Current", newLabel: "New",
    dayLabel: "/day", currentStatus: "Current status", currentBid: "Current bid",
    daysLeft: "Days remaining", newBidLabel: "New daily bid (USD)",
    minLabel: "Min:", diffNote: "Pay only the difference for", remaining: "remaining days",
    diffLabel: "Difference", daysLabel: "days",
    payBtn: "Pay $ and reach #1", redirecting: "Redirecting...",
    cancelBtn: "← Cancel", toTop: "🏆 You'll reach #1",
    expiredTitle: "Ad period has ended",
    expiredMsg: "Bid upgrade only works for active ads. To compete at #1 again, renew or create a new ad.",
    renewBtn: "Renew ad",
    newAdBtn: "Create new ad",
    lowDaysWarn: (d: number) => `⚠️ Only ${d} days left — bid upgrade may not be worth it.`,
    zeroDaysNote: "0 days remaining — bid upgrade has no effect.",
  },
  uz: {
    pageLabel: "Bid oshirish", totalSpent: "Jami sarflangan", placeAd: "Reklama berish",
    loading: "Yuklanmoqda...", title: "Bidni oshirish",
    rankChange: "Reyting o'zgarishi", currently: "Hozirgi", newLabel: "Yangi",
    dayLabel: "/kun", currentStatus: "Joriy holat", currentBid: "Joriy bid",
    daysLeft: "Qolgan kunlar", newBidLabel: "Yangi kunlik bid (USD)",
    minLabel: "Minimal:", diffNote: "Faqat qolgan", remaining: "kun uchun farq to'lanadi",
    diffLabel: "Farq", daysLabel: "kun",
    payBtn: "to'lash va 1-o'ringa chiqish", redirecting: "Yo'naltirilmoqda...",
    cancelBtn: "← Bekor qilish", toTop: "🏆 1-o'ringa chiqasiz",
    expiredTitle: "Reklama davri tugagan",
    expiredMsg: "Bid oshirish faqat faol reklamalar uchun ishlaydi. 1-o'rinda yana ko'rinish uchun reklamani yangilang yoki yangi reklama bering.",
    renewBtn: "Reklamani yangilash",
    newAdBtn: "Yangi reklama berish",
    lowDaysWarn: (d: number) => `⚠️ Faqat ${d} kun qoldi — bid oshirish samarali bo'lmasligi mumkin.`,
    zeroDaysNote: "0 kun qoldi — bid oshirish hech qanday ta'sir qilmaydi.",
  },
  ru: {
    pageLabel: "Повысить ставку", totalSpent: "Всего потрачено", placeAd: "Разместить",
    loading: "Загрузка...", title: "Повысить ставку",
    rankChange: "Изменение рейтинга", currently: "Текущая", newLabel: "Новая",
    dayLabel: "/день", currentStatus: "Текущий статус", currentBid: "Текущая ставка",
    daysLeft: "Осталось дней", newBidLabel: "Новая ежедневная ставка (USD)",
    minLabel: "Мин.:", diffNote: "Оплачивается разница за", remaining: "оставшихся дней",
    diffLabel: "Разница", daysLabel: "дн.",
    payBtn: "Оплатить $ и выйти на #1", redirecting: "Перенаправление...",
    cancelBtn: "← Отмена", toTop: "🏆 Вы выйдете на #1",
    expiredTitle: "Период рекламы завершён",
    expiredMsg: "Повышение ставки работает только для активных объявлений. Чтобы снова быть на #1, обновите или создайте новое объявление.",
    renewBtn: "Обновить рекламу",
    newAdBtn: "Создать новое объявление",
    lowDaysWarn: (d: number) => `⚠️ Осталось всего ${d} дней — повышение ставки может быть нецелесообразным.`,
    zeroDaysNote: "0 дней осталось — повышение ставки не имеет эффекта.",
  },
};

export default function BidUpgradePage() {
  const { adId } = useParams<{ adId: string }>();
  const router = useRouter();
  const { firebaseUser, userProfile, loading: authLoading } = useAuth();
  const { lang: globalLang } = useLang();
  const lang = (["en","uz","ru"].includes(globalLang) ? globalLang : "en") as keyof typeof T;
  const t = T[lang];
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
      // ?to=<cents> comes from the dashboard: the bid needed to move up one place
      const to = parseInt(new URLSearchParams(window.location.search).get("to") || "", 10);
      const minCents = data.dailyBidCents + MIN_BID_INCREMENT_CENTS;
      setNewBid(Number.isInteger(to) && to >= minCents ? to / 100 : Math.floor(data.dailyBidCents / 100) + 1);
      setLoading(false);
    });
  }, [adId, firebaseUser, authLoading, router]);

  const handlePay = async () => {
    if (!ad) return;
    const minBidUSD = (ad.dailyBidCents + MIN_BID_INCREMENT_CENTS) / 100;
    if (newBid < minBidUSD) {
      setError(`${t.newBidLabel}: ≥ $${minBidUSD.toFixed(2)}${t.dayLabel}`);
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
      setError("Error: " + err.message);
      setPaying(false);
    }
  };

  const initials = userProfile?.displayName?.charAt(0).toUpperCase() || "?";
  const brandName = userProfile?.displayName || "Profile";
  const spent = userProfile?.totalSpentCents || 0;

  const currentBidUSD = ad ? ad.dailyBidCents / 100 : 0;
  const daysRemaining = ad?.expiresAt
    ? Math.max(0, Math.ceil((ad.expiresAt.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const diffPerDay = newBid - currentBidUSD;
  const extraToPay = diffPerDay > 0 ? diffPerDay * daysRemaining : 0;
  const catMeta = ad ? CATEGORIES[ad.category] : null;

  const card: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 18,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "system-ui,sans-serif" }}>
      <style>{`@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}*{box-sizing:border-box}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{opacity:1}`}</style>

      {/* Dashboard header */}
      <header style={{ position: "sticky", top: 0, zIndex: 80, background: "rgba(11,11,15,.94)", backdropFilter: "blur(18px)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ padding: "11px 26px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="24" fill="#7C3AED"/>
              <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
              <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
            </svg>
            <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".85rem", fontWeight: 700, color: "var(--text)" }}>PRIMIO</span>
            <span style={{ padding: "2px 9px", borderRadius: 100, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: ".66rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
              {t.pageLabel}
            </span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase" as const, color: "var(--muted)", fontWeight: 700 }}>{t.totalSpent}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".86rem", fontWeight: 600, color: "#FCD34D" }}>${(spent / 100).toFixed(0)}</span>
            </div>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 11px 5px 5px", borderRadius: 100, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none" }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, color: "#fff" }}>{initials}</span>
              <span style={{ fontSize: ".78rem", fontWeight: 600 }}>{brandName}</span>
            </Link>
            <Link href="/create" style={{ padding: "9px 16px", borderRadius: 10, background: "#7C3AED", color: "#fff", fontSize: ".82rem", fontWeight: 700, textDecoration: "none" }}>+ {t.placeAd}</Link>
          </div>
        </div>
      </header>

      {loading || !ad || !catMeta ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <span style={{ color: "var(--muted)" }}>{t.loading}</span>
        </div>
      ) : daysRemaining === 0 ? (
        /* ── Expired state: redirect user to renew or create new ad ── */
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 24px", animation: "fade .35s ease both", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(245,158,11,.12)", border: "2px solid rgba(245,158,11,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 32 }}>
            ⏰
          </div>
          <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: 12 }}>
            {t.expiredTitle}
          </h2>
          <p style={{ color: "#9CA3AF", fontSize: ".88rem", lineHeight: 1.6, marginBottom: 32 }}>
            {t.expiredMsg}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => router.push(`/ads/${adId}/renew`)}
              style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}
            >
              🔄 {t.renewBtn}
            </button>
            <button
              onClick={() => router.push("/create")}
              style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: "1px solid var(--border)", background: "transparent", color: "#A78BFA", fontWeight: 600, fontSize: ".9rem", cursor: "pointer" }}
            >
              ✚ {t.newAdBtn}
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: "none", background: "transparent", color: "#4B5563", fontSize: ".84rem", cursor: "pointer" }}
            >
              {t.cancelBtn}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "38px 24px 60px", animation: "fade .35s ease both" }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: ".82rem", textDecoration: "none", marginBottom: 20 }}>
            ← Dashboard
          </Link>

          {/* Title */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trophy size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-.02em" }}>{t.title}</h1>
                <p style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: 2 }}>{catMeta.emoji} {catMeta.label} · {ad.title}</p>
              </div>
            </div>
          </div>

          {/* Low days warning */}
          {daysRemaining > 0 && daysRemaining <= 2 && (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.25)", color: "#FCD34D", fontSize: ".84rem" }}>
              {t.lowDaysWarn(daysRemaining)}
            </div>
          )}

          {error && (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", color: "#F87171", fontSize: ".84rem" }}>
              {error}
            </div>
          )}

          {/* Ranking preview */}
          <div style={{ ...card, padding: 20, marginBottom: 14 }}>
            <div style={{ fontSize: ".66rem", letterSpacing: ".12em", textTransform: "uppercase" as const, color: "var(--muted)", fontWeight: 700, marginBottom: 14 }}>{t.rankChange}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Before */}
              <div style={{ flex: 1, background: "var(--surface-2)", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--border)", textAlign: "center" }}>
                <div style={{ fontSize: ".68rem", color: "var(--muted)", marginBottom: 6 }}>{t.currently}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.4rem", fontWeight: 700, color: "#FCD34D" }}>${currentBidUSD.toFixed(0)}</div>
                <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>{t.dayLabel}</div>
              </div>
              <ArrowUp size={20} color="#7C3AED" style={{ flexShrink: 0 }} />
              {/* After */}
              <div style={{ flex: 1, background: "rgba(124,58,237,.12)", borderRadius: 12, padding: "14px 16px", border: "1px solid #7C3AED", textAlign: "center" }}>
                <div style={{ fontSize: ".68rem", color: "#A78BFA", marginBottom: 6 }}>{t.newLabel}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.4rem", fontWeight: 700, color: "#A855F7" }}>${newBid.toFixed(0)}</div>
                <div style={{ fontSize: ".72rem", color: "#A78BFA" }}>{t.dayLabel}</div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)", fontSize: ".8rem", color: "#34D399", textAlign: "center" }}>
              {t.toTop}
            </div>
          </div>

          {/* Current status */}
          <div style={{ ...card, padding: 20, marginBottom: 14 }}>
            <div style={{ fontSize: ".66rem", letterSpacing: ".12em", textTransform: "uppercase" as const, color: "var(--muted)", fontWeight: 700, marginBottom: 14 }}>{t.currentStatus}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", marginBottom: 10 }}>
              <span style={{ color: "#A78BFA" }}>{t.currentBid}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#FCD34D" }}>${currentBidUSD.toFixed(2)}{t.dayLabel}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem" }}>
              <span style={{ color: "#A78BFA" }}>{t.daysLeft}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "var(--text)" }}>{daysRemaining} {t.daysLabel}</span>
            </div>
          </div>

          {/* New bid input */}
          <div style={{ ...card, padding: 20, marginBottom: 14 }}>
            <label style={{ fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase" as const, color: "var(--muted)", fontWeight: 700, display: "block", marginBottom: 12 }}>
              {t.newBidLabel}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.4rem", color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace" }}>$</span>
              <input
                type="number"
                value={newBid}
                onChange={(e) => setNewBid(Math.max(currentBidUSD + MIN_BID_INCREMENT_CENTS / 100, parseFloat(e.target.value) || currentBidUSD + 1))}
                min={currentBidUSD + MIN_BID_INCREMENT_CENTS / 100}
                step={0.5}
                style={{ flex: 1, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", fontSize: "1.4rem", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "var(--text)", outline: "none" }}
              />
              <span style={{ fontSize: ".9rem", color: "var(--muted)" }}>{t.dayLabel}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: ".76rem", color: "var(--muted)" }}>
              {t.minLabel} ${(currentBidUSD + MIN_BID_INCREMENT_CENTS / 100).toFixed(2)}{t.dayLabel}
            </div>
          </div>

          {/* Calculation */}
          {diffPerDay > 0 && daysRemaining > 0 && (
            <div style={{ background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.25)", borderRadius: 16, padding: 20, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 14 }}>
                <Info size={14} color="#A78BFA" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: ".78rem", color: "#A78BFA" }}>{t.diffNote} {daysRemaining} {t.remaining}</p>
              </div>
              <div style={{ fontSize: ".85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "var(--muted)" }}>{t.diffLabel} (${newBid.toFixed(2)} − ${currentBidUSD.toFixed(2)}){t.dayLabel}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "var(--text)" }}>${diffPerDay.toFixed(2)}{t.dayLabel}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--muted)" }}>× {daysRemaining} {t.daysLabel}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.1rem", fontWeight: 700, color: "#34D399" }}>= ${extraToPay.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={paying || diffPerDay <= 0 || daysRemaining === 0}
            style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: (paying || diffPerDay <= 0 || daysRemaining === 0) ? "#4C1D95" : "linear-gradient(135deg,#F59E0B,#FBBF24)", color: "var(--surface)", fontSize: "1rem", fontWeight: 800, cursor: (paying || diffPerDay <= 0) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12, boxShadow: (diffPerDay > 0 && !paying) ? "0 4px 20px rgba(245,158,11,.35)" : "none" }}
          >
            <ArrowUp size={18} />
            {paying ? t.redirecting : `$${extraToPay.toFixed(2)} ${t.payBtn}`}
          </button>

          <button
            onClick={() => router.back()}
            style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: ".85rem", cursor: "pointer" }}
          >
            {t.cancelBtn}
          </button>
        </div>
      )}
    </div>
  );
}
