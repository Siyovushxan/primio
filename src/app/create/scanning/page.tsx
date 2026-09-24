"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/contexts/LangContext";

type StepStatus = "waiting" | "running" | "done" | "failed";

interface Step {
  id: string;
  label: string;
  sublabel: string;
}

const STEPS: Record<string, Step[]> = {
  en: [
    { id: "keyword", label: "Keyword check",      sublabel: "Scanning for banned words and domains" },
    { id: "url",     label: "URL check",           sublabel: "Verifying site availability and safety" },
    { id: "upload",  label: "Uploading image",     sublabel: "Image is being uploaded to the server" },
    { id: "ai",      label: "AI analysis",         sublabel: "Image is being reviewed by AI" },
    { id: "save",    label: "Creating ad",         sublabel: "Saving data to the database" },
  ],
  uz: [
    { id: "keyword", label: "Kalit so'zlar tekshiruvi", sublabel: "Taqiqlangan so'zlar va domenlar skanlanmoqda" },
    { id: "url",     label: "URL manzil tekshiruvi",    sublabel: "Sayt mavjudligi va xavfsizligi aniqlanmoqda" },
    { id: "upload",  label: "Rasm yuklanmoqda",          sublabel: "Rasm serverga yuklanmoqda" },
    { id: "ai",      label: "AI tahlili",               sublabel: "Rasm sun'iy intellekt tomonidan ko'rilmoqda" },
    { id: "save",    label: "Reklama yaratilmoqda",      sublabel: "Ma'lumotlar bazaga saqlanmoqda" },
  ],
  ru: [
    { id: "keyword", label: "Проверка ключевых слов", sublabel: "Сканирование запрещённых слов и доменов" },
    { id: "url",     label: "Проверка URL",            sublabel: "Проверка доступности и безопасности сайта" },
    { id: "upload",  label: "Загрузка изображения",    sublabel: "Изображение загружается на сервер" },
    { id: "ai",      label: "AI анализ",               sublabel: "Изображение проверяется искусственным интеллектом" },
    { id: "save",    label: "Создание рекламы",         sublabel: "Данные сохраняются в базу данных" },
  ],
};

const T = {
  en: {
    checking: "in progress",
    headingRunning: "AI review in progress",
    headingDone: "Ad approved!",
    headingFailed: "Review failed",
    subRunning: "Getting ready...",
    subDone: "Success! Redirecting to payment...",
    subFailed: "The following issue was detected",
    backBtn: "← Go back",
    dontClose: "Don't close this page — review in progress",
    errModerationNoResponse: "Moderation service did not respond.",
    errTextReview: "Text review error",
    errTextFailed: "Did not pass text review",
    errImageUpload: "Image upload failed. Please try again.",
    errAiNoResponse: "AI review did not respond.",
    errAiFailed: "Image did not pass AI review",
    errSaveFailed: "Data could not be saved",
  },
  uz: {
    checking: "Tekshirmoqda",
    headingRunning: "AI tekshiruvi davom etmoqda",
    headingDone: "Reklama tasdiqlandi!",
    headingFailed: "Tekshiruvdan o'tmadi",
    subRunning: "Tayyorlanmoqda...",
    subDone: "Muvaffaqiyatli! To'lov sahifasiga yo'naltirilmoqda...",
    subFailed: "Quyidagi muammo aniqlandi",
    backBtn: "← Orqaga qaytish",
    dontClose: "Bu sahifani yopmang — tekshiruv davom etmoqda",
    errModerationNoResponse: "Moderatsiya xizmati javob bermadi.",
    errTextReview: "Matn tekshiruvi xatosi",
    errTextFailed: "Matn tekshiruvidan o'tmadi",
    errImageUpload: "Rasm yuklanmadi. Qayta urinib ko'ring.",
    errAiNoResponse: "AI tekshiruvi javob bermadi.",
    errAiFailed: "Rasm AI tekshiruvidan o'tmadi",
    errSaveFailed: "Ma'lumotlar saqlanmadi",
  },
  ru: {
    checking: "Проверяется",
    headingRunning: "AI проверка выполняется",
    headingDone: "Реклама одобрена!",
    headingFailed: "Проверка не пройдена",
    subRunning: "Подготовка...",
    subDone: "Успешно! Перенаправление на оплату...",
    subFailed: "Обнаружена следующая проблема",
    backBtn: "← Назад",
    dontClose: "Не закрывайте страницу — проверка продолжается",
    errModerationNoResponse: "Сервис модерации не ответил.",
    errTextReview: "Ошибка проверки текста",
    errTextFailed: "Не прошло проверку текста",
    errImageUpload: "Не удалось загрузить изображение. Попробуйте ещё раз.",
    errAiNoResponse: "AI проверка не ответила.",
    errAiFailed: "Изображение не прошло AI проверку",
    errSaveFailed: "Не удалось сохранить данные",
  },
};

export default function ScanningPage() {
  const router = useRouter();
  const hasRun = useRef(false);
  const { lang: globalLang } = useLang();
  const lang = (["en","uz","ru"].includes(globalLang) ? globalLang : "en") as keyof typeof T;
  const t = T[lang];
  const steps = STEPS[lang];

  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({
    keyword: "waiting", url: "waiting", ai: "waiting", upload: "waiting", save: "waiting",
  });
  const [error, setError] = useState<string | null>(null);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const iv = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 500);
    return () => clearInterval(iv);
  }, []);

  const setStep = (id: string, status: StepStatus) =>
    setStepStatuses((prev) => ({ ...prev, [id]: status }));

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      let data: any;
      try {
        const raw = sessionStorage.getItem("primio_scan");
        if (!raw) { router.replace("/create"); return; }
        data = JSON.parse(raw);
      } catch {
        router.replace("/create");
        return;
      }

      const { title, description, url, category, bidCents, duration,
              imageBase64, idToken, uid } = data;

      setStep("keyword", "running");
      await new Promise((r) => setTimeout(r, 400));
      setStep("url", "running");

      let textData: any;
      try {
        const textRes = await fetch("/api/moderation", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ title, description, destinationURL: url }),
        });
        try { textData = await textRes.json(); }
        catch { throw new Error(t.errModerationNoResponse); }
      } catch (err: any) {
        setStep("keyword", "failed");
        setStep("url", "waiting");
        setError(err?.message || t.errTextReview);
        return;
      }

      if (!textData.approved) {
        const reason: string = textData.reason || "";
        const isUrl = /sayt|URL|ulanib|ishlamayapti/i.test(reason);
        if (isUrl) {
          setStep("keyword", "done");
          setStep("url", "failed");
        } else {
          setStep("keyword", "failed");
          setStep("url", "waiting");
        }
        setError("❌ " + (reason || t.errTextFailed));
        return;
      }

      setStep("keyword", "done");
      setStep("url", "done");
      await new Promise((r) => setTimeout(r, 200));

      setStep("upload", "running");
      let imageURL: string;
      try {
        const imgRes = await fetch("/api/upload/image", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ imageBase64 }),
        });
        const imgData = await imgRes.json();
        if (!imgRes.ok || !imgData.url) throw new Error(imgData.error || t.errImageUpload);
        imageURL = imgData.url;
        setStep("upload", "done");
      } catch (err: any) {
        setStep("upload", "failed");
        setError(err?.message || t.errImageUpload);
        return;
      }
      await new Promise((r) => setTimeout(r, 200));

      setStep("ai", "running");

      let aiData: any;
      try {
        const aiRes = await fetch("/api/moderation", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          // The server reviews the uploaded image at imageURL itself
          body: JSON.stringify({ title, description, destinationURL: url, imageURL }),
        });
        try { aiData = await aiRes.json(); }
        catch { throw new Error(t.errAiNoResponse); }
      } catch (err: any) {
        setStep("ai", "failed");
        setError(err?.message || t.errAiNoResponse);
        return;
      }

      if (!aiData.approved) {
        setStep("ai", "failed");
        setError("❌ " + (aiData.reason || t.errAiFailed));
        return;
      }

      setStep("ai", "done");
      await new Promise((r) => setTimeout(r, 200));

      setStep("save", "running");
      try {
        const saveRes = await fetch("/api/ads/create", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            advertiserUID: uid,
            title,
            description,
            imageURL,
            destinationURL: url,
            category,
            dailyBidCents: bidCents,
            durationDays: duration,
            moderationId: aiData.moderationId,
          }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveData.error || t.errSaveFailed);
        setStep("save", "done");
        sessionStorage.removeItem("primio_scan");
        await new Promise((r) => setTimeout(r, 700));
        router.replace(`/ads/${saveData.adId}/pending`);
      } catch (err: any) {
        setStep("save", "failed");
        setError(t.errSaveFailed + ": " + (err?.message || ""));
      }
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const statusIcon = (s: StepStatus) => {
    if (s === "done") return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="#10B981"/>
        <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
    if (s === "failed") return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="#EF4444"/>
        <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
    if (s === "running") return (
      <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid #7C3AED", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
    );
    return <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--border)" }} />;
  };

  const allDone = Object.values(stepStatuses).every((s) => s === "done");
  const anyFailed = Object.values(stepStatuses).some((s) => s === "failed");
  const currentStep = steps.find((s) => stepStatuses[s.id] === "running");

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(124,58,237,.35); } 50% { box-shadow: 0 0 42px rgba(124,58,237,.7); } }
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
      `}</style>

      {/* Logo */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 10, animation: "fadeUp .5s ease" }}>
        <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
          <rect width="100" height="100" rx="24" fill="#7C3AED"/>
          <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
          <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
        </svg>
        <span style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--text)", letterSpacing: ".05em" }}>PRIMIO</span>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 480,
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24,
        padding: "36px 32px",
        animation: "fadeUp .5s ease .1s both",
        ...(anyFailed ? {} : { animation: "fadeUp .5s ease .1s both, glow 2.5s ease infinite" }),
      }}>
        {/* Scanning visual */}
        {!anyFailed && !allDone && (
          <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 28px", borderRadius: "50%", background: "rgba(124,58,237,.12)", border: "2px solid #7C3AED", overflow: "hidden", animation: "glow 2.5s ease infinite" }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: .85 }}>
              <circle cx="24" cy="24" r="22" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="4 3" style={{ animation: "spin 8s linear infinite" }}/>
              <path d="M16 24a8 8 0 0116 0" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round"/>
              <path d="M18 28a6 6 0 0012 0" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="3" fill="#7C3AED"/>
              <circle cx="16" cy="24" r="2.5" fill="#7C3AED" opacity=".6"/>
              <circle cx="32" cy="24" r="2.5" fill="#7C3AED" opacity=".6"/>
            </svg>
            <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #A855F7, transparent)", animation: "scan 1.5s ease-in-out infinite alternate", opacity: .7 }} />
          </div>
        )}

        {allDone && (
          <div style={{ width: 96, height: 96, margin: "0 auto 28px", borderRadius: "50%", background: "rgba(16,185,129,.12)", border: "2px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path d="M10 22l9 9 15-15" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {anyFailed && (
          <div style={{ width: 96, height: 96, margin: "0 auto 28px", borderRadius: "50%", background: "rgba(239,68,68,.1)", border: "2px solid #EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path d="M12 12l20 20M32 12L12 32" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}

        {/* Heading */}
        <h1 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", textAlign: "center" }}>
          {allDone ? t.headingDone : anyFailed ? t.headingFailed : t.headingRunning}
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: ".83rem", color: "var(--muted)", textAlign: "center", minHeight: 18 }}>
          {allDone
            ? t.subDone
            : anyFailed
            ? t.subFailed
            : currentStep
            ? currentStep.sublabel + dots
            : t.subRunning}
        </p>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {steps.map((step) => {
            const s = stepStatuses[step.id];
            return (
              <div key={step.id} style={{
                display: "flex", alignItems: "center", gap: 13,
                padding: "12px 14px", borderRadius: 12,
                background: s === "running" ? "rgba(124,58,237,.1)" : s === "done" ? "rgba(16,185,129,.07)" : s === "failed" ? "rgba(239,68,68,.07)" : "rgba(255,255,255,.02)",
                border: `1px solid ${s === "running" ? "#7C3AED" : s === "done" ? "#10B98130" : s === "failed" ? "#EF444430" : "var(--border)"}`,
                transition: "all .3s ease",
              }}>
                {statusIcon(s)}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".83rem", fontWeight: 600, color: s === "failed" ? "#F87171" : s === "done" ? "#6EE7B7" : s === "running" ? "var(--text)" : "var(--muted)" }}>
                    {step.label}
                  </div>
                  {s === "running" && (
                    <div style={{ fontSize: ".72rem", color: "#A78BFA", marginTop: 2 }}>{step.sublabel}</div>
                  )}
                </div>
                {s === "running" && (
                  <span style={{ fontSize: ".75rem", color: "#7C3AED", fontWeight: 700, animation: "pulse 1.2s ease infinite" }}>{t.checking}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 12, background: "rgba(239,68,68,.1)", border: "1px solid #EF4444", color: "#F87171", fontSize: ".83rem", lineHeight: 1.55 }}>
            {error}
          </div>
        )}

        {/* Back button on failure */}
        {anyFailed && (
          <button
            onClick={() => router.push("/create?restore=1")}
            style={{
              marginTop: 20, width: "100%", padding: "13px 0", borderRadius: 12,
              border: "1px solid var(--border)", background: "rgba(124,58,237,.12)",
              color: "#A855F7", fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
            }}
          >
            {t.backBtn}
          </button>
        )}
      </div>

      {/* Bottom note */}
      {!anyFailed && !allDone && (
        <p style={{ marginTop: 20, fontSize: ".75rem", color: "var(--dim)", textAlign: "center", animation: "fadeUp .5s ease .3s both" }}>
          {t.dontClose}
        </p>
      )}
    </div>
  );
}
