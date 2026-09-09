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
import Link from "next/link";

const PERKS = [
  { icon: "📱", title: "Google akkaunt bilan", body: "Bir klik — akkaunt tayyor. Parol yodlash shart emas, SMS kutish ham." },
  { icon: "💳", title: "Karta ham, hamyon ham kerak emas", body: "Google Pay, Apple Pay, PayPal yoki USDT. To'lov faqat reklama tasdiqlangandan keyin so'raladi." },
  { icon: "🚀", title: "1 daqiqada birinchi reklama", body: "Ro'yxatdan o'tgach forma bir ekranda. AI tekshiruvi 30–90 soniya." },
  { icon: "🚪", title: "Shartnoma yo'q", body: "Davrni o'zingiz tanlaysiz: 7, 14 yoki 30 kun. Avtomatik uzaytirish yo'q." },
];

const inp = {
  width: "100%", padding: "13px 15px", borderRadius: 12,
  background: "#160F2A", border: "1px solid #2D1F50",
  color: "#EDE9FE", fontSize: ".92rem", outline: "none",
  boxSizing: "border-box" as const,
} as const;

function AuthPageInner() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
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
        setError("Google bilan kirishda xato. Qayta urinib ko'ring.");
      }
      setLoading(false);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!brand.trim()) return setError("Brend nomini kiriting");
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
      setError("Xato yuz berdi: " + (err?.message || "Qayta urinib ko'ring"));
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", padding: "44px 26px 60px", maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 430px", gap: 40, alignItems: "start" }}>

        {/* LEFT */}
        <div>
          <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>
            Akkaunt
          </div>
          <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "2.1rem", fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.12, marginBottom: 14, color: "#EDE9FE" }}>
            Ro&apos;yxatdan o&apos;tish —<br />1 klik, 1 daqiqa
          </h1>
          <p style={{ fontSize: ".96rem", color: "#A78BFA", lineHeight: 1.75, maxWidth: "50ch", marginBottom: 26 }}>
            Google akkauntingiz bilan kiring. Bank kartasi, hujjat yoki shartnoma so&apos;ralmaydi — to&apos;lov esa faqat reklama tasdiqlangandan keyin so&apos;raladi.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: "52ch" }}>
            {PERKS.map((p) => (
              <div key={p.icon} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(124,58,237,.14)", border: "1px solid #2D1F50", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".82rem", flexShrink: 0 }}>
                  {p.icon}
                </span>
                <div>
                  <div style={{ fontSize: ".87rem", fontWeight: 700, color: "#EDE9FE" }}>{p.title}</div>
                  <div style={{ fontSize: ".82rem", color: "#A78BFA", lineHeight: 1.6 }}>{p.body}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 26, padding: "16px 18px", borderRadius: 14, background: "#160F2A", border: "1px solid #2D1F50", maxWidth: "52ch" }}>
            <div style={{ fontSize: ".8rem", color: "#A78BFA", lineHeight: 1.65 }}>
              Reytinglarni ko&apos;rish uchun akkaunt shart emas. Ro&apos;yxatdan o&apos;tish faqat o&apos;z reklamangizni joylashtirish uchun kerak.
            </div>
            <Link href="/browse" style={{ display: "inline-block", marginTop: 11, padding: "9px 15px", borderRadius: 10, background: "transparent", border: "1px solid #2D1F50", color: "#EDE9FE", fontSize: ".8rem", fontWeight: 600, textDecoration: "none" }}>
              Jonli reyting →
            </Link>
          </div>
        </div>

        {/* RIGHT — card */}
        <div style={{ background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 20, padding: 26, boxShadow: "0 24px 60px rgba(0,0,0,.42)" }}>

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 13px", borderRadius: 10, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", color: "#F87171", fontSize: ".83rem" }}>
              {error}
            </div>
          )}

          {/* Step 1 — Google button */}
          {step === 1 && (
            <>
              <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 6 }}>
                Xush kelibsiz
              </div>
              <div style={{ fontSize: ".83rem", color: "#A78BFA", lineHeight: 1.6, marginBottom: 22 }}>
                Ro&apos;yxatdan o&apos;tish yoki kirish — ikkalasi ham bitta tugma orqali.<br />
                Birinchi marta kirsangiz — akkaunt avtomatik yaratiladi.
              </div>

              <button
                onClick={handleGoogle}
                disabled={loading}
                style={{
                  width: "100%", padding: "15px 0", borderRadius: 12,
                  background: loading ? "#1e1e2e" : "#ffffff",
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  fontSize: ".95rem", fontWeight: 700, color: "#111",
                  transition: "opacity .15s", opacity: loading ? 0.6 : 1,
                  boxShadow: "0 2px 12px rgba(0,0,0,.3)",
                }}
              >
                {loading ? (
                  <span style={{ color: "#A78BFA" }}>Yuklanmoqda...</span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google bilan kirish
                  </>
                )}
              </button>

              <div style={{ marginTop: 14, padding: "11px 14px", borderRadius: 10, background: "#160F2A", border: "1px solid #2D1F50" }}>
                <div style={{ fontSize: ".77rem", color: "#6D5B8E", lineHeight: 1.6 }}>
                  🔒 Parolingiz bizga ko&apos;rinmaydi. Google o&apos;zi tasdiqlaydi.
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid #2D1F50" }}>
                <div style={{ fontSize: ".78rem", color: "#6D5B8E", lineHeight: 1.6, marginBottom: 11 }}>
                  Sinab ko&apos;rish uchun: to&apos;ldirilgan hamyon, 4 ta reklama va statistika bilan tayyor akkaunt.
                </div>
                <Link href="/browse" style={{ display: "block", width: "100%", padding: "12px 0", borderRadius: 11, background: "transparent", border: "1px dashed #2D1F50", color: "#A78BFA", fontSize: ".82rem", fontWeight: 600, textDecoration: "none", textAlign: "center", boxSizing: "border-box" }}>
                  Reklamalarni ko&apos;rish →
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
              <div style={{ fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700 }}>
                Oxirgi qadam
              </div>
              <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "#EDE9FE" }}>
                Brend nomi
              </div>
              <div style={{ fontSize: ".83rem", color: "#A78BFA", lineHeight: 1.6, marginTop: -8 }}>
                Reklamada ko&apos;rinadigan nom. Keyinchalik o&apos;zgartirish mumkin.
              </div>

              <div>
                <label style={{ display: "block", fontSize: ".77rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 8 }}>Brend nomi</label>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Masalan: Akmal Studio"
                  style={inp}
                  required autoFocus
                />
              </div>

              <button
                type="submit" disabled={loading}
                style={{ padding: "14px 0", borderRadius: 12, background: loading ? "#4C1D95" : "#7C3AED", border: "none", color: "#fff", fontSize: ".9rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Yaratilmoqda..." : "Akkauntni yaratish →"}
              </button>

              <div style={{ fontSize: ".75rem", color: "#6D5B8E", textAlign: "center", lineHeight: 1.55 }}>
                Davom etish bilan foydalanish shartlari va reklama siyosatiga rozilik bildirasiz.
              </div>
            </form>
          )}
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
