"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type StepStatus = "waiting" | "running" | "done" | "failed";

interface Step {
  id: string;
  label: string;
  sublabel: string;
}

const STEPS_UZ: Step[] = [
  { id: "keyword", label: "Kalit so'zlar tekshiruvi", sublabel: "Taqiqlangan so'zlar va domenlar skanlanmoqda" },
  { id: "url",     label: "URL manzil tekshiruvi",    sublabel: "Sayt mavjudligi va xavfsizligi aniqlanmoqda" },
  { id: "upload",  label: "Rasm yuklanmoqda",          sublabel: "Rasm serverga yuklanmoqda" },
  { id: "ai",      label: "AI tahlili",               sublabel: "Rasm sun'iy intellekt tomonidan ko'rilmoqda" },
  { id: "save",    label: "Reklama yaratilmoqda",      sublabel: "Ma'lumotlar bazaga saqlanmoqda" },
];

export default function ScanningPage() {
  const router = useRouter();
  const hasRun = useRef(false);

  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({
    keyword: "waiting", url: "waiting", ai: "waiting", upload: "waiting", save: "waiting",
  });
  const [error, setError] = useState<string | null>(null);
  const [dots, setDots] = useState(".");

  // Animated dots
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
              imageBase64, imageBase64Mod, imageMimeTypeMod, idToken, uid } = data;

      // ── Step 1+2: Matn tekshiruvi (keyword + URL, rasmsiz) ───────────────
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
        catch { throw new Error("Moderatsiya xizmati javob bermadi."); }
      } catch (err: any) {
        setStep("keyword", "failed");
        setStep("url", "waiting");
        setError(err?.message || "Matn tekshiruvi xatosi");
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
        setError("❌ " + (reason || "Matn tekshiruvidan o'tmadi"));
        return;
      }

      setStep("keyword", "done");
      setStep("url", "done");
      await new Promise((r) => setTimeout(r, 200));

      // ── Step 3: Image upload ──────────────────────────────────────────────
      setStep("upload", "running");
      let imageURL: string;
      try {
        const imgRes = await fetch("/api/upload/image", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ imageBase64 }),
        });
        const imgData = await imgRes.json();
        if (!imgRes.ok || !imgData.url) throw new Error(imgData.error || "Rasm yuklanmadi.");
        imageURL = imgData.url;
        setStep("upload", "done");
      } catch (err: any) {
        setStep("upload", "failed");
        setError(err?.message || "Rasm yuklanmadi. Qayta urinib ko'ring.");
        return;
      }
      await new Promise((r) => setTimeout(r, 200));

      // ── Step 4: AI vision tekshiruvi (URL orqali — ishonchli) ────────────
      setStep("ai", "running");

      let aiData: any;
      try {
        const aiRes = await fetch("/api/moderation", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            title, description, destinationURL: url,
            imageURL,
            imageBase64: imageBase64Mod,
            mimeType: imageMimeTypeMod,
          }),
        });
        try { aiData = await aiRes.json(); }
        catch { throw new Error("AI tekshiruvi javob bermadi."); }
      } catch (err: any) {
        setStep("ai", "failed");
        setError(err?.message || "AI tekshiruvi xatosi");
        return;
      }

      if (!aiData.approved) {
        setStep("ai", "failed");
        setError("❌ " + (aiData.reason || "Rasm AI tekshiruvidan o'tmadi"));
        return;
      }

      setStep("ai", "done");
      await new Promise((r) => setTimeout(r, 200));

      // ── Step 5: Firestore save ────────────────────────────────────────────
      setStep("save", "running");
      try {
        const adRef = await addDoc(collection(db, "ads"), {
          advertiserUID: uid,
          title,
          description,
          imageURL,
          destinationURL: url,
          category,
          dailyBidCents: bidCents,
          durationDays: duration,
          totalPaidCents: 0,
          status: "pending",
          moderationPassed: true,
          startsAt: null,
          expiresAt: null,
          impressions: 0,
          clicks: 0,
          externalTxId: "",
          paymentMethod: "",
          createdAt: serverTimestamp(),
        });
        setStep("save", "done");
        sessionStorage.removeItem("primio_scan");
        await new Promise((r) => setTimeout(r, 700));
        router.replace(`/ads/${adRef.id}/pending`);
      } catch (err: any) {
        setStep("save", "failed");
        setError("Ma'lumotlar saqlanmadi: " + (err?.message || "Qayta urinib ko'ring."));
      }
    };

    run();
  }, [router]);

  const statusIcon = (s: StepStatus, running: boolean) => {
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
    return <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #2D1F50" }} />;
  };

  const allDone = Object.values(stepStatuses).every((s) => s === "done");
  const anyFailed = Object.values(stepStatuses).some((s) => s === "failed");
  const currentStep = STEPS_UZ.find((s) => stepStatuses[s.id] === "running");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0E0B1A",
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
        <span style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#EDE9FE", letterSpacing: ".05em" }}>PRIMIO</span>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 480,
        background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 24,
        padding: "36px 32px",
        animation: "fadeUp .5s ease .1s both",
        ...(anyFailed ? {} : { animation: "fadeUp .5s ease .1s both, glow 2.5s ease infinite" }),
      }}>
        {/* Scanning visual */}
        {!anyFailed && !allDone && (
          <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 28px", borderRadius: "50%", background: "rgba(124,58,237,.12)", border: "2px solid #7C3AED", overflow: "hidden", animation: "glow 2.5s ease infinite" }}>
            {/* AI brain icon */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: .85 }}>
              <circle cx="24" cy="24" r="22" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="4 3" style={{ animation: "spin 8s linear infinite" }}/>
              <path d="M16 24a8 8 0 0116 0" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round"/>
              <path d="M18 28a6 6 0 0012 0" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="3" fill="#7C3AED"/>
              <circle cx="16" cy="24" r="2.5" fill="#7C3AED" opacity=".6"/>
              <circle cx="32" cy="24" r="2.5" fill="#7C3AED" opacity=".6"/>
            </svg>
            {/* Scan line */}
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
        <h1 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 700, color: "#EDE9FE", textAlign: "center" }}>
          {allDone ? "Reklama tasdiqlandi!" : anyFailed ? "Tekshiruvdan o'tmadi" : "AI tekshiruvi davom etmoqda"}
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: ".83rem", color: "#6D5B8E", textAlign: "center", minHeight: 18 }}>
          {allDone
            ? "Muvaffaqiyatli! To'lov sahifasiga yo'naltirilmoqda..."
            : anyFailed
            ? "Quyidagi muammo aniqlandi"
            : currentStep
            ? currentStep.sublabel + dots
            : "Tayyorlanmoqda..."}
        </p>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STEPS_UZ.map((step) => {
            const s = stepStatuses[step.id];
            return (
              <div key={step.id} style={{
                display: "flex", alignItems: "center", gap: 13,
                padding: "12px 14px", borderRadius: 12,
                background: s === "running" ? "rgba(124,58,237,.1)" : s === "done" ? "rgba(16,185,129,.07)" : s === "failed" ? "rgba(239,68,68,.07)" : "rgba(255,255,255,.02)",
                border: `1px solid ${s === "running" ? "#7C3AED" : s === "done" ? "#10B98130" : s === "failed" ? "#EF444430" : "#2D1F50"}`,
                transition: "all .3s ease",
              }}>
                {statusIcon(s, s === "running")}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".83rem", fontWeight: 600, color: s === "failed" ? "#F87171" : s === "done" ? "#6EE7B7" : s === "running" ? "#EDE9FE" : "#6D5B8E" }}>
                    {step.label}
                  </div>
                  {s === "running" && (
                    <div style={{ fontSize: ".72rem", color: "#A78BFA", marginTop: 2 }}>{step.sublabel}</div>
                  )}
                </div>
                {s === "running" && (
                  <span style={{ fontSize: ".75rem", color: "#7C3AED", fontWeight: 700, animation: "pulse 1.2s ease infinite" }}>Tekshirmoqda</span>
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
              border: "1px solid #2D1F50", background: "rgba(124,58,237,.12)",
              color: "#A855F7", fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
            }}
          >
            ← Orqaga qaytish
          </button>
        )}
      </div>

      {/* Bottom note */}
      {!anyFailed && !allDone && (
        <p style={{ marginTop: 20, fontSize: ".75rem", color: "#4A3C6E", textAlign: "center", animation: "fadeUp .5s ease .3s both" }}>
          Bu sahifani yopmang — tekshiruv davom etmoqda
        </p>
      )}
    </div>
  );
}
