"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ad, CATEGORIES } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import Link from "next/link";

const T = {
  en: {
    pageLabel: "Payment", totalSpent: "Total spent", placeAd: "Post Ad",
    loading: "Loading...", notFound: "Ad not found", back: "← My Ads",
    aiApproved: "AI approved", payTitle: "Payment",
    paySub: "Your ad has been approved by AI. It goes live immediately after payment.",
    orderDetails: "Order details", category: "Category", title: "Title",
    dailyPrice: "Daily bid", duration: "Duration", totalPayment: "Total payment",
    dayLabel: "days", redirecting: "Redirecting...", paying: "💳 Pay $",
    safePayment: "Secure payment via Dodo Payments.",
    yourAd: "Your ad", total: "Total",
    nextSteps: "Next steps", guarantee: "Guarantee",
    step1: "AI approved", step2: "Payment", step3: "Ad live", step4: "View stats",
    g1: "Full refund if moderation fails", g2: "Technical issues reviewed",
    g3: "Dodo Payments secure system",
    aiDisclaimer: "⚠️ AI review may make mistakes. Ads with violence, 18+ or other prohibited content will be removed without a refund — even if they passed AI review. Do not pay for such ads.",
    termsAgree: "I have read and agree to the PRIMIO",
    termsLink: "Public Offer Agreement",
    termsAgree2: "",
    errTerms: "Please agree to the Public Offer Agreement",
  },
  uz: {
    pageLabel: "To'lov", totalSpent: "Jami sarflangan", placeAd: "Reklama berish",
    loading: "Yuklanmoqda...", notFound: "Reklama topilmadi", back: "← Reklamalarim",
    aiApproved: "AI tasdiqladi", payTitle: "To'lov",
    paySub: "Reklamangiz AI tomonidan tasdiqlandi. To'lovdan so'ng darhol jonli bo'ladi.",
    orderDetails: "Buyurtma tafsilotlari", category: "Toifa", title: "Sarlavha",
    dailyPrice: "Kunlik narx", duration: "Davr", totalPayment: "Jami to'lov",
    dayLabel: "kun", redirecting: "Yo'naltirilmoqda...", paying: "💳 $",
    safePayment: "Dodo Payments orqali xavfsiz shifrlangan holda to'laysiz.",
    yourAd: "Reklamangiz", total: "Jami",
    nextSteps: "Keyingi qadamlar", guarantee: "Kafolat",
    step1: "AI tasdiqladi", step2: "To'lov", step3: "Reklama jonli", step4: "Statistikani ko'ring",
    g1: "Moderatsiyadan o'tmasa — to'liq qaytarish",
    g2: "Texnik xatolik bo'lsa — ko'rib chiqiladi",
    g3: "Dodo Payments xavfsiz to'lov tizimi",
    aiDisclaimer: "⚠️ AI tekshiruvi xato qilishi mumkin. Zo'ravonlik, 18+ yoki boshqa taqiqlangan kontent bo'lgan reklamalar AI tekshiruvidan o'tsa ham to'lovsiz o'chiriladi. Bunday reklamalarga to'lov qilmang.",
    termsAgree: "Men PRIMIO",
    termsLink: "Ommaviy Oferta Shartnomasini",
    termsAgree2: "o'qidim va qabul qilaman",
    errTerms: "Ommaviy oferta shartlariga rozilik bildiring",
  },
  ru: {
    pageLabel: "Оплата", totalSpent: "Всего потрачено", placeAd: "Разместить рекламу",
    loading: "Загрузка...", notFound: "Объявление не найдено", back: "← Мои объявления",
    aiApproved: "ИИ одобрил", payTitle: "Оплата",
    paySub: "Ваша реклама одобрена ИИ. После оплаты она сразу станет активной.",
    orderDetails: "Детали заказа", category: "Категория", title: "Заголовок",
    dailyPrice: "Ежедневная ставка", duration: "Длительность", totalPayment: "Итого к оплате",
    dayLabel: "дн.", redirecting: "Перенаправление...", paying: "💳 Оплатить $",
    safePayment: "Безопасная оплата через Dodo Payments.",
    yourAd: "Ваша реклама", total: "Итого",
    nextSteps: "Следующие шаги", guarantee: "Гарантия",
    step1: "ИИ одобрил", step2: "Оплата", step3: "Реклама активна", step4: "Смотреть статистику",
    g1: "Полный возврат при отказе модерации",
    g2: "Технические ошибки рассматриваются",
    g3: "Безопасная система Dodo Payments",
    aiDisclaimer: "⚠️ AI-проверка может ошибаться. Объявления с насилием, контентом 18+ или другим запрещённым материалом будут удалены без возврата средств — даже если прошли AI-проверку. Не оплачивайте такие объявления.",
    termsAgree: "Я прочитал и принимаю",
    termsLink: "Публичную Оферту PRIMIO",
    termsAgree2: "",
    errTerms: "Пожалуйста, примите условия Публичной Оферты",
  },
};

export default function PaymentPage() {
  const { adId } = useParams<{ adId: string }>();
  const router = useRouter();
  const { firebaseUser, userProfile } = useAuth();
  const { lang: globalLang } = useLang();
  const lang = (["en","uz","ru"].includes(globalLang) ? globalLang : "en") as keyof typeof T;
  const t = T[lang];

  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);

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
    if (!termsAgreed) { setError(t.errTerms); return; }
    setPaying(true);
    setError("");
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch("/api/payment/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ adId: ad.id, amount: ad.dailyBidCents * ad.durationDays }),
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

  const initials = userProfile?.displayName?.charAt(0).toUpperCase() || "?";
  const brandName = userProfile?.displayName || "Profile";
  const spent = userProfile?.totalSpentCents || 0;
  const totalUSD = ad ? (ad.dailyBidCents * ad.durationDays) / 100 : 0;
  const catMeta = ad ? CATEGORIES[ad.category] : null;

  const cardStyle: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18 };

  const DashHeader = () => (
    <header style={{ position: "sticky", top: 0, zIndex: 80, background: "rgba(11,11,15,.94)", backdropFilter: "blur(18px)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ padding: "11px 26px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="24" fill="#7C3AED"/>
              <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
              <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
            </svg>
            <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".85rem", fontWeight: 700, color: "var(--text)" }}>PRIMIO</span>
          </Link>
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
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
        <DashHeader />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <span style={{ color: "var(--muted)" }}>{t.loading}</span>
        </div>
      </div>
    );
  }

  if (!ad || !catMeta) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
        <DashHeader />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <span style={{ color: "#F87171" }}>{t.notFound}</span>
        </div>
      </div>
    );
  }

  const payRows = [
    { k: t.category,   v: `${catMeta.emoji} ${catMeta.label}`, color: "var(--text)" },
    { k: t.title,      v: ad.title,                             color: "var(--text)" },
    { k: t.dailyPrice, v: `$${(ad.dailyBidCents / 100).toFixed(2)}/${t.dayLabel}`, color: "#FCD34D" },
    { k: t.duration,   v: `${ad.durationDays} ${t.dayLabel}`,  color: "var(--text)" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "system-ui,sans-serif" }}>
      <style>{`@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}*{box-sizing:border-box}`}</style>
      <DashHeader />

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "38px 26px 60px", animation: "fade .35s ease both" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: ".82rem", textDecoration: "none", marginBottom: 16 }}>
          {t.back}
        </Link>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 100, background: "rgba(52,211,153,.12)", border: "1px solid #10B981", marginBottom: 14, marginLeft: 12 }}>
          <span style={{ fontSize: ".8rem" }}>✅</span>
          <span style={{ fontSize: ".76rem", fontWeight: 700, color: "#34D399" }}>{t.aiApproved}</span>
        </div>

        <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.03em", marginBottom: 8 }}>
          {t.payTitle}
        </h1>
        <p style={{ fontSize: ".92rem", color: "#A78BFA", maxWidth: "56ch", lineHeight: 1.7, marginBottom: 26 }}>
          {t.paySub}
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
              <div style={{ fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: 14 }}>{t.orderDetails}</div>
              {payRows.map((r) => (
                <div key={r.k} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "11px 0", borderBottom: "1px solid var(--border)", fontSize: ".85rem" }}>
                  <span style={{ color: "#A78BFA" }}>{r.k}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: r.color, textAlign: "right", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 14, paddingTop: 16 }}>
                <span style={{ fontSize: ".9rem", fontWeight: 700, color: "var(--text)" }}>{t.totalPayment}</span>
                <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.9rem", fontWeight: 700, color: "#34D399", lineHeight: 1 }}>${totalUSD.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: 6, textAlign: "right" }}>
                ${(ad.dailyBidCents / 100).toFixed(2)}/{t.dayLabel} x {ad.durationDays} {t.dayLabel}
              </div>
            </div>

            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "11px 13px", marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: "#FCD34D", lineHeight: 1.6, margin: 0 }}>{t.aiDisclaimer}</p>
            </div>

            {/* Terms agreement checkbox */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, accentColor: "#7C3AED", flexShrink: 0, cursor: "pointer" }}
              />
              <span style={{ fontSize: ".78rem", color: "#9CA3AF", lineHeight: 1.5 }}>
                {t.termsAgree}{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#A855F7", textDecoration: "underline" }}>
                  {t.termsLink}
                </a>
                {t.termsAgree2 ? " " + t.termsAgree2 : ""}
              </span>
            </label>

            <button
              onClick={handlePay}
              disabled={paying}
              style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: paying ? "#4C1D95" : "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", fontWeight: 800, fontSize: "1.05rem", cursor: paying ? "not-allowed" : "pointer", boxShadow: paying ? "none" : "0 8px 28px rgba(124,58,237,.4)", letterSpacing: -.2 }}
            >
              {paying ? t.redirecting : `${t.paying}${totalUSD.toFixed(2)}`}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(52,211,153,.06)", border: "1px solid rgba(52,211,153,.2)", fontSize: ".82rem", color: "#A78BFA" }}>
              <span>🔒</span>
              <span>{t.safePayment}</span>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: 12 }}>{t.yourAd}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".9rem", color: "#fff", flexShrink: 0 }}>
                  {catMeta.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: ".87rem", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.title}</div>
                  <div style={{ fontSize: ".74rem", color: "var(--muted)" }}>{catMeta.label} · {ad.durationDays} {t.dayLabel}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", fontSize: ".82rem" }}>
                <span style={{ color: "var(--muted)" }}>{t.dailyPrice}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#FCD34D" }}>${(ad.dailyBidCents / 100).toFixed(2)}/{t.dayLabel}</span>
              </div>
              <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 11, background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: ".82rem", color: "#34D399", fontWeight: 700 }}>{t.total}</span>
                <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#34D399" }}>${totalUSD.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: 13 }}>{t.nextSteps}</div>
              {[
                { icon: "✅", text: t.step1, done: true, active: false },
                { icon: "💳", text: t.step2, done: false, active: true },
                { icon: "🚀", text: t.step3, done: false, active: false },
                { icon: "📊", text: t.step4, done: false, active: false },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: i < 3 ? 12 : 0, marginBottom: i < 3 ? 12 : 0, borderBottom: i < 3 ? "1px dashed var(--border)" : "none" }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: step.done ? "rgba(52,211,153,.15)" : step.active ? "rgba(124,58,237,.2)" : "var(--surface)", border: `1px solid ${step.done ? "#10B981" : step.active ? "#7C3AED" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", flexShrink: 0 }}>{step.icon}</span>
                  <span style={{ fontSize: ".82rem", color: step.done ? "#34D399" : step.active ? "#A855F7" : "var(--muted)", fontWeight: step.active ? 700 : 400 }}>{step.text}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: 10 }}>{t.guarantee}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: ".79rem", color: "#A78BFA", lineHeight: 1.5 }}>
                <div style={{ display: "flex", gap: 8 }}><span style={{ color: "#34D399" }}>&#10003;</span> {t.g1}</div>
                <div style={{ display: "flex", gap: 8 }}><span style={{ color: "#34D399" }}>&#10003;</span> {t.g2}</div>
                <div style={{ display: "flex", gap: 8 }}><span style={{ color: "#34D399" }}>&#10003;</span> {t.g3}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
