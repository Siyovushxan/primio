"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ad } from "@/types";
import { useLang } from "@/contexts/LangContext";

const T = {
  en: {
    rejected: "Rejected",
    reason: "Reason:",
    rejectionFallback: "Did not meet moderation requirements",
    noPayment: "✓ No payment was taken",
    resubmit: "Resubmit",
    approved: "AI check passed!",
    approvedMsg: "Your ad is approved. Complete payment\nto publish it.",
    step1: "AI moderation",
    step2: "Payment",
    step3: "Publish — go live",
    next: "Next",
    payBtn: "💳 Proceed to payment",
    payWarning: "Ad will be removed in 24 hours if payment is not made",
    aiDisclaimer: "⚠️ Important: AI review is automated and may make mistakes. Ads containing violence, adult (18+), or other prohibited content will be removed even after passing AI review — without a refund. Do not waste money on such ads.",
  },
  uz: {
    rejected: "Rad etildi",
    reason: "Sabab:",
    rejectionFallback: "Moderatsiya talablariga javob bermadi",
    noPayment: "✓ Hech qanday to'lov olinmadi",
    resubmit: "Qayta yuborish",
    approved: "AI tekshiruvi o'tdi!",
    approvedMsg: "Reklamangiz tasdiqlandi. Nashr qilish uchun\nto'lovni amalga oshiring.",
    step1: "AI moderatsiya",
    step2: "To'lov",
    step3: "Nashr — efirga chiqish",
    next: "Navbat",
    payBtn: "💳 To'lovga o'tish",
    payWarning: "To'lov qilmasangiz reklama 24 soatdan so'ng o'chadi",
    aiDisclaimer: "⚠️ Muhim: AI tekshiruvi avtomatik bo'lib, xato qilishi mumkin. Zo'ravonlik, 18+ yoki boshqa taqiqlangan kontent o'z ichiga olgan reklamalar AI tekshiruvidan o'tsa ham — to'lovsiz o'chiriladi. Bunday reklamalarga pul sarflamang.",
  },
  ru: {
    rejected: "Отклонено",
    reason: "Причина:",
    rejectionFallback: "Не соответствует требованиям модерации",
    noPayment: "✓ Оплата не была произведена",
    resubmit: "Отправить снова",
    approved: "AI-проверка пройдена!",
    approvedMsg: "Ваша реклама одобрена. Выполните оплату,\nчтобы опубликовать её.",
    step1: "AI модерация",
    step2: "Оплата",
    step3: "Публикация — запуск",
    next: "Далее",
    payBtn: "💳 Перейти к оплате",
    payWarning: "Реклама будет удалена через 24 часа, если оплата не будет произведена",
    aiDisclaimer: "⚠️ Важно: AI-проверка автоматическая и может ошибаться. Объявления с насилием, контентом 18+ или другим запрещённым материалом будут удалены даже после прохождения AI-проверки — без возврата средств. Не тратьте деньги на такие объявления.",
  },
};

export default function AdPendingPage() {
  const { adId } = useParams<{ adId: string }>();
  const router = useRouter();
  const [ad, setAd] = useState<Ad | null>(null);
  const { lang: globalLang } = useLang();
  const lang = (["en","uz","ru"].includes(globalLang) ? globalLang : "en") as keyof typeof T;
  const t = T[lang];

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "ads", adId), (snap) => {
      if (!snap.exists()) return;
      const data = { id: snap.id, ...snap.data() } as Ad;
      setAd(data);
      if (data.status === "active") {
        router.push("/dashboard");
      }
    });
    return unsub;
  }, [adId, router]);

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, var(--surface) 0%, var(--surface) 100%)",
    border: "1px solid rgba(124,58,237,0.25)",
    borderRadius: 24,
    padding: "40px 36px",
    maxWidth: 460,
    width: "100%",
    boxShadow: "0 0 60px rgba(124,58,237,0.12), 0 24px 48px rgba(0,0,0,0.4)",
    position: "relative",
    overflow: "hidden",
  };

  const glow: React.CSSProperties = {
    position: "absolute", top: -60, right: -60,
    width: 200, height: 200, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
    pointerEvents: "none",
  };

  if (ad?.status === "rejected") {
    return (
      <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
        <div style={cardStyle}>
          <div style={glow} />
          <div style={{ textAlign: "center", position: "relative" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px", fontSize: 36,
            }}>❌</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{t.rejected}</h1>
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 12, padding: "14px 16px", marginBottom: 16, textAlign: "left",
            }}>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>{t.reason}</p>
              <p style={{ fontSize: 14, color: "#F87171", fontWeight: 500 }}>
                {ad.rejectionReason || t.rejectionFallback}
              </p>
            </div>
            <div style={{
              background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 24,
            }}>
              <p style={{ fontSize: 13, color: "#34D399" }}>{t.noPayment}</p>
            </div>
            <button
              onClick={() => router.push("/create")}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 12,
                background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                color: "#fff", fontWeight: 600, fontSize: 15,
                border: "none", cursor: "pointer",
              }}
            >
              {t.resubmit}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div style={cardStyle}>
        <div style={glow} />
        <div style={{ position: "relative" }}>

          {/* Approved badge */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))",
              border: "2px solid rgba(16,185,129,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: 36,
            }}>✅</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8, letterSpacing: -0.3 }}>
              {t.approved}
            </h1>
            <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.6 }}>
              {t.approvedMsg.split("\n").map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </p>
          </div>

          {/* Ad summary */}
          {ad?.imageURL && (
            <div style={{
              display: "flex", gap: 14, alignItems: "center",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "14px 16px", marginBottom: 24,
            }}>
              <img
                src={ad.imageURL}
                alt={ad.title}
                style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
              />
              <div style={{ overflow: "hidden" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#E9D5FF", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ad.title}
                </p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{ad.destinationURL}</p>
              </div>
            </div>
          )}

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
            {[
              { label: t.step1, done: true },
              { label: t.step2, done: false, active: true },
              { label: t.step3, done: false },
            ].map((step, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: step.done ? "rgba(16,185,129,0.07)" : step.active ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${step.done ? "rgba(16,185,129,0.2)" : step.active ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)"}`,
                borderRadius: 10, padding: "10px 14px",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: step.done ? "rgba(16,185,129,0.2)" : step.active ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${step.done ? "rgba(16,185,129,0.4)" : step.active ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.06)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  color: step.done ? "#34D399" : step.active ? "#C4B5FD" : "#4B5563",
                }}>
                  {step.done ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: step.active ? 600 : 400,
                  color: step.done ? "#34D399" : step.active ? "#E9D5FF" : "#4B5563",
                  flex: 1,
                }}>
                  {step.label}
                </span>
                {step.active && (
                  <span style={{
                    fontSize: 11, color: "#7C3AED", fontWeight: 600,
                    background: "rgba(124,58,237,0.15)", borderRadius: 6, padding: "2px 8px",
                  }}>{t.next}</span>
                )}
              </div>
            ))}
          </div>

          {/* AI disclaimer */}
          <div style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 12, padding: "12px 14px", marginBottom: 16,
          }}>
            <p style={{ fontSize: 12, color: "#FCD34D", lineHeight: 1.6, margin: 0 }}>
              {t.aiDisclaimer}
            </p>
          </div>

          {/* Pay button */}
          <button
            onClick={() => router.push(`/ads/${adId}/pay`)}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 14,
              background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
              color: "#fff", fontWeight: 700, fontSize: 16,
              border: "none", cursor: "pointer",
              boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
              letterSpacing: -0.2,
            }}
          >
            {t.payBtn}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "#4B5563", marginTop: 14 }}>
            {t.payWarning}
          </p>
        </div>
      </div>
    </div>
  );
}
