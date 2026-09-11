"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES, Category } from "@/types";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────
type Lang = "uz" | "en";

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  uz: {
    dashLabel: "Boshqaruv paneli",
    totalSpent: "Jami sarflangan",
    navAll: "Barcha reklamalar",
    navMyAds: "Reklamalarim",
    navCats: "Toifalar",
    navWallet: "Toʻlovlar",
    navProfile: "Profil",
    navGuide: "Qanday ishlaydi",
    logout: "Chiqish",
    sideMain: "Menyu",
    ctaCreate: "Reklama berish",
    createTitle: "Yangi reklama",
    createSub: "Barcha maydonlarni toʻldirib, moderatsiyaga yuboring.",
    titleLabel: "Sarlavha",
    titlePh: "Kompaniya yoki mahsulot nomi",
    imageLabel: "Rasm",
    imageNote: "PNG, JPG, WebP — max 5 MB",
    imageClick: "Rasm yuklash uchun bosing yoki tashlang",
    urlLabel: "Veb-sayt URL",
    urlPh: "https://sizningsayt.uz",
    urlNote: "HTTPS bilan boshlasin",
    catLabel: "Toifa",
    descLabel: "Qisqa tavsif (ixtiyoriy)",
    descPh: "Kompaniya yoki mahsulot haqida...",
    bidLabel: "Kunlik taklif (USD/kun)",
    bidNote: "Koʻroq toʻlagan — yuqoriroq oʻrin",
    durLabel: "Kampaniya davri",
    popular: "Ommabop",
    totalLabel: "Jami toʻlov",
    totalNote: "Tasdiqlangandan keyin toʻlov soʻraladirabi",
    submitBtn: "Moderatsiyaga yuborish →",
    submitting: "🤖 AI tekshiryapti...",
    previewTitle: "Reklama koʻrishi",
    previewNote: "Reklamangiz shunday koʻrinsiz",
    costTitle: "Narx hisobi",
    perDay: "Kunlik taklif",
    days: "Davr",
    total: "Jami",
    rulesTitle: "⚠️ Muhim qoidalar",
    rule1: "Reklama avval AI tomonidan tekshiriladi (30–90 soniya).",
    rule2: "Tasdiqlangandan keyingina toʻlov olinadi.",
    rule3: "Rad etilgan reklama uchun hech qanday toʻlov yoʻq.",
    rule4: "HTTPS boʻlmagan URL qabul qilinmaydi.",
    previewBrand: "Brend nomi",
    previewDesc: "Qisqa tavsif bu yerda chiqadi...",
    errTitle: "Sarlavha kiriting",
    errTitleLong: "Sarlavha 60 belgidan oshmasin",
    errUrl: "URL https:// bilan boshlanishi kerak",
    errImage: "Rasm yuklang",
    errBid: "Minimal kunlik narx $1",
    errDesc: "Tavsif 200 belgidan oshmasin",
    errSubmit: "Xato yuz berdi",
    noAdsTitle: "Reklama joylashtiring",
    noAdsBody: "Hamyon tayyor. Bitta formada reklama yaratasiz.",
    sideCta: "Reklama berish",
  },
  en: {
    dashLabel: "Dashboard",
    totalSpent: "Total spent",
    navAll: "All ads",
    navMyAds: "My ads",
    navCats: "Categories",
    navWallet: "Payments",
    navProfile: "Profile",
    navGuide: "How it works",
    logout: "Sign out",
    sideMain: "Menu",
    ctaCreate: "Place ad",
    createTitle: "New ad",
    createSub: "Fill in all fields and submit for moderation.",
    titleLabel: "Title",
    titlePh: "Company or product name",
    imageLabel: "Image",
    imageNote: "PNG, JPG, WebP — max 5 MB",
    imageClick: "Click or drag to upload image",
    urlLabel: "Website URL",
    urlPh: "https://yoursite.com",
    urlNote: "Must start with HTTPS",
    catLabel: "Category",
    descLabel: "Short description (optional)",
    descPh: "About your company or product...",
    bidLabel: "Daily bid (USD/day)",
    bidNote: "Higher bid = higher ranking",
    durLabel: "Campaign duration",
    popular: "Popular",
    totalLabel: "Total payment",
    totalNote: "Payment is charged only after approval",
    submitBtn: "Submit for moderation →",
    submitting: "🤖 AI checking...",
    previewTitle: "Ad preview",
    previewNote: "This is how your ad will look",
    costTitle: "Cost breakdown",
    perDay: "Daily bid",
    days: "Duration",
    total: "Total",
    rulesTitle: "⚠️ Important rules",
    rule1: "Ads are first checked by AI (30–90 seconds).",
    rule2: "Payment is charged only after approval.",
    rule3: "No charge for rejected ads.",
    rule4: "Non-HTTPS URLs are not accepted.",
    previewBrand: "Brand name",
    previewDesc: "Short description will appear here...",
    errTitle: "Enter a title",
    errTitleLong: "Title must be 60 chars or less",
    errUrl: "URL must start with https://",
    errImage: "Upload an image",
    errBid: "Minimum daily bid is $1",
    errDesc: "Description must be 200 chars or less",
    errSubmit: "Something went wrong",
    noAdsTitle: "Place an ad",
    noAdsBody: "Wallet ready. Create an ad in one form.",
    sideCta: "Place ad",
  },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 18,
};
const inp: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 11,
  background: "#160F2A", border: "1px solid #2D1F50",
  color: "#EDE9FE", fontSize: ".9rem", outline: "none", boxSizing: "border-box",
};
const label: React.CSSProperties = {
  display: "block", fontSize: ".77rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 8,
};

// ─── App Header ───────────────────────────────────────────────────────────────
function AppHeader({
  lang, setLang, totalSpentCents, brandName, brandInitial, onGoCreate, onGoProfile, onGoWallet,
}: {
  lang: Lang; setLang: (l: Lang) => void;
  totalSpentCents: number; brandName: string; brandInitial: string;
  onGoCreate: () => void; onGoProfile: () => void; onGoWallet: () => void;
}) {
  const t = T[lang];
  const btnBase: React.CSSProperties = { padding: "4px 9px", borderRadius: 7, border: "none", fontSize: ".71rem", fontWeight: 700, cursor: "pointer" };
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 80, background: "rgba(14,11,26,.94)", backdropFilter: "blur(18px)", borderBottom: "1px solid #2D1F50" }}>
      <div style={{ padding: "11px 26px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="24" fill="#7C3AED"/>
            <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
            <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
          </svg>
          <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".85rem", fontWeight: 700, color: "#EDE9FE" }}>PRIMIO</span>
          <span style={{ padding: "2px 9px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", fontSize: ".66rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#6D5B8E" }}>{t.dashLabel}</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <div style={{ display: "flex", padding: 2, borderRadius: 9, background: "#160F2A", border: "1px solid #2D1F50" }}>
            <button onClick={() => setLang("uz")} style={{ ...btnBase, background: lang === "uz" ? "#2D1F50" : "transparent", color: lang === "uz" ? "#EDE9FE" : "#6D5B8E" }}>UZ</button>
            <button onClick={() => setLang("en")} style={{ ...btnBase, background: lang === "en" ? "#2D1F50" : "transparent", color: lang === "en" ? "#EDE9FE" : "#6D5B8E" }}>EN</button>
          </div>
          <button onClick={onGoWallet} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 10, background: "#160F2A", border: "1px solid #2D1F50", color: "#EDE9FE", cursor: "pointer" }}>
            <span style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700 }}>{t.totalSpent}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".86rem", fontWeight: 600, color: "#FCD34D" }}>${(totalSpentCents / 100).toFixed(0)}</span>
          </button>
          <button onClick={onGoProfile} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 11px 5px 5px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", color: "#EDE9FE", cursor: "pointer" }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, color: "#fff" }}>{brandInitial}</span>
            <span style={{ fontSize: ".78rem", fontWeight: 600 }}>{brandName}</span>
          </button>
          <button onClick={onGoCreate} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#7C3AED", color: "#fff", fontSize: ".82rem", fontWeight: 700, cursor: "pointer" }}>+ {t.ctaCreate}</button>
        </div>
      </div>
    </header>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ lang, myAdsCount, onSignOut, onDashNav }: {
  lang: Lang; myAdsCount: number; onSignOut: () => void; onDashNav: (screen?: string) => void;
}) {
  const t = T[lang];
  const NAV = [
    { k: "all",     icon: "🏆", label: t.navAll },
    { k: "myads",   icon: "📢", label: t.navMyAds, badge: myAdsCount || undefined },
    { k: "cats",    icon: "🗂",  label: t.navCats },
    { k: "wallet",  icon: "💳", label: t.navWallet },
    { k: "profile", icon: "👤", label: t.navProfile },
  ];
  const btnStyle = (active: boolean): React.CSSProperties => ({
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "10px 11px", borderRadius: 10, border: "none",
    fontSize: ".83rem", fontWeight: active ? 700 : 500, cursor: "pointer",
    background: active ? "rgba(124,58,237,.16)" : "transparent",
    color: active ? "#A855F7" : "#A78BFA",
  });
  return (
    <aside className="dash-sidebar">
      <div style={{ fontSize: ".62rem", letterSpacing: ".13em", textTransform: "uppercase", color: "#4A3C6E", fontWeight: 700, padding: "0 10px 9px" }}>{t.sideMain}</div>
      {NAV.map((n) => (
        <button key={n.k} onClick={() => onDashNav(n.k)} style={btnStyle(false)}>
          <span style={{ width: 20, textAlign: "center", fontSize: ".85rem" }}>{n.icon}</span>
          <span style={{ flex: 1, textAlign: "left" }}>{n.label}</span>
          {n.badge ? (
            <span style={{ padding: "1px 8px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", color: "#6D5B8E", fontSize: ".68rem", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{n.badge}</span>
          ) : null}
        </button>
      ))}

      {/* Create CTA in sidebar — highlighted since we're on create page */}
      <div style={{ marginTop: 20, padding: 14, borderRadius: 13, background: "rgba(124,58,237,.1)", border: "1px solid #7C3AED" }}>
        <div style={{ fontSize: ".74rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 5 }}>{t.navMyAds}</div>
        <div style={{ fontSize: ".75rem", color: "#6D5B8E", lineHeight: 1.55, marginBottom: 10 }}>{t.noAdsBody}</div>
        <button onClick={() => onDashNav("myads")} style={{ width: "100%", padding: 9, borderRadius: 10, background: "rgba(124,58,237,.14)", border: "1px solid #7C3AED", color: "#A855F7", fontSize: ".77rem", fontWeight: 700, cursor: "pointer" }}>
          {t.navMyAds}
        </button>
      </div>

      <button onClick={() => window.open("/how-it-works", "_blank")} style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 9, padding: 10, borderRadius: 10, background: "transparent", border: "none", color: "#6D5B8E", fontSize: ".78rem", fontWeight: 500, cursor: "pointer" }}>
        <span style={{ width: 20, textAlign: "center" }}>❔</span><span>{t.navGuide}</span>
      </button>
      <button onClick={onSignOut} style={{ display: "flex", alignItems: "center", gap: 9, padding: 10, borderRadius: 10, background: "transparent", border: "none", color: "#6D5B8E", fontSize: ".78rem", fontWeight: 500, cursor: "pointer" }}>
        <span style={{ width: 20, textAlign: "center" }}>↩</span><span>{t.logout}</span>
      </button>
    </aside>
  );
}

// ─── Create View ──────────────────────────────────────────────────────────────
function CreateView({ lang, userProfile, firebaseUser, router }: {
  lang: Lang;
  userProfile: any;
  firebaseUser: any;
  router: ReturnType<typeof useRouter>;
}) {
  const t = T[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  const defaultCat = (searchParams.get("cat") as Category) || null;
  const defaultBidCents = parseInt(searchParams.get("minBid") || "100");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [bidCents, setBidCents] = useState(Math.max(100, defaultBidCents));
  const [duration, setDuration] = useState<number>(7);
  const [isCustomDur, setIsCustomDur] = useState(false);
  const [customDays, setCustomDays] = useState("");
  const [category, setCategory] = useState<Category | null>(defaultCat);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const CAT_KEYS = Object.keys(CATEGORIES) as Category[];
  const bidDollars = (bidCents / 100).toFixed(2);
  const totalCents = bidCents * duration;
  const totalDollars = (totalCents / 100).toFixed(2);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError(t.errImage + " (5 MB max)"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setError("");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleImageChange(fakeEvent);
    }
  };

  // Moderatsiya uchun rasmni kichraytirish (Groq API limit uchun)
  const compressForModeration = (file: File): Promise<{ base64: string; mimeType: string }> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 512;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        URL.revokeObjectURL(img.src);
        resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setError("");
    if (!title.trim()) return setError(t.errTitle);
    if (title.length > 60) return setError(t.errTitleLong);
    if (!url.trim() || !url.startsWith("https://")) return setError(t.errUrl);
    if (!imageFile) return setError(t.errImage);
    if (!category) return setError(t.catLabel);
    if (bidCents < 100) return setError(t.errBid);
    if (description.length > 200) return setError(t.errDesc);

    setSubmitting(true);
    try {
      // 1. Original base64 (ImgBB uchun) + kichraytirilgan (Groq uchun)
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      const { base64: imageBase64Mod, mimeType: imageMimeTypeMod } = await compressForModeration(imageFile);

      // 2. AI moderatsiya — kichraytirilgan rasm bilan (512px, JPEG 0.75)
      const modRes = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageBase64Mod,
          mimeType: imageMimeTypeMod,
          title: title.trim(),
          description: description.trim(),
          destinationURL: url.trim(),
        }),
      });
      const modData = await modRes.json();

      if (!modData.approved) {
        setError("❌ " + (modData.reason || "Reklama moderatsiyadan o'tmadi"));
        return;
      }

      // 3. Tasdiqlangan rasm ImgBB ga yuklanadi — original sifat bilan
      const imgForm = new FormData();
      imgForm.append("image", imageBase64);
      const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
        method: "POST",
        body: imgForm,
      });
      const imgData = await imgRes.json();
      if (!imgData.success) throw new Error("Rasm yuklanmadi. Qayta urinib ko'ring.");
      const imageURL: string = imgData.data.url;

      const adRef = await addDoc(collection(db, "ads"), {
        advertiserUID: firebaseUser.uid,
        title: title.trim(),
        description: description.trim(),
        imageURL,
        destinationURL: url.trim(),
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

      router.push(`/ads/${adRef.id}/pending`);
    } catch (err: any) {
      setError(t.errSubmit + ": " + (err?.message || "Qayta urinib koʻring"));
    } finally {
      setSubmitting(false);
    }
  };

  const displayCat = category ? CATEGORIES[category] : null;
  const brandName = userProfile?.displayName || "Brend";
  const brandInitial = brandName.charAt(0).toUpperCase();

  return (
    <div style={{ padding: "38px 32px 60px", flex: 1, minWidth: 0 }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: ".7rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 8 }}>
          📢 {lang === "uz" ? "Yangi kampaniya" : "New campaign"}
        </div>
        <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-.03em", color: "#EDE9FE", lineHeight: 1.15, marginBottom: 8 }}>
          {t.createTitle}
        </h1>
        <p style={{ fontSize: ".88rem", color: "#6D5B8E", lineHeight: 1.55 }}>{t.createSub}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rg-form">

          {/* ── LEFT: Form ──────────────────────────────────────────── */}
          <div style={{ ...card, padding: 28, display: "flex", flexDirection: "column", gap: 22 }}>

            {error && (
              <div style={{ padding: "11px 14px", borderRadius: 11, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.28)", color: "#F87171", fontSize: ".84rem" }}>
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label style={label}>{t.titleLabel} <span style={{ color: "#F87171" }}>*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.titlePh}
                maxLength={60}
                style={inp}
                required
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5 }}>
                <span style={{ fontSize: ".73rem", color: title.length > 50 ? "#F59E0B" : "#6D5B8E" }}>{title.length}/60</span>
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label style={label}>{t.imageLabel} <span style={{ color: "#F87171" }}>*</span> <span style={{ color: "#6D5B8E", fontWeight: 400 }}>({t.imageNote})</span></label>
              {imagePreview ? (
                <div style={{ position: "relative", borderRadius: 13, overflow: "hidden", background: "#160F2A", aspectRatio: "16/9" }}>
                  <Image src={imagePreview} alt="preview" fill style={{ objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,.75)", border: "none", color: "#fff", fontSize: ".8rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >✕</button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ borderRadius: 13, border: "2px dashed #2D1F50", background: "#160F2A", aspectRatio: "16/9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "border-color .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#7C3AED")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#2D1F50")}
                >
                  <span style={{ fontSize: "2rem" }}>🖼</span>
                  <span style={{ fontSize: ".85rem", color: "#A78BFA", fontWeight: 600 }}>{t.imageClick}</span>
                  <span style={{ fontSize: ".75rem", color: "#6D5B8E" }}>{t.imageNote}</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            </div>

            {/* URL */}
            <div>
              <label style={label}>{t.urlLabel} <span style={{ color: "#F87171" }}>*</span></label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.urlPh}
                style={inp}
                required
              />
              <div style={{ marginTop: 5, fontSize: ".73rem", color: "#6D5B8E" }}>{t.urlNote}</div>
            </div>

            {/* Category */}
            <div>
              <label style={label}>{t.catLabel} <span style={{ color: "#F87171" }}>*</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {CAT_KEYS.map((cat) => {
                  const meta = CATEGORIES[cat];
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: "11px 14px", borderRadius: 11, border: `1px solid ${active ? "#7C3AED" : "#2D1F50"}`,
                        background: active ? "rgba(124,58,237,.14)" : "#160F2A",
                        color: active ? "#A855F7" : "#A78BFA",
                        cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 9,
                        fontSize: ".83rem", fontWeight: active ? 700 : 500, transition: "all .15s",
                      }}
                    >
                      <span style={{ fontSize: "1.1rem" }}>{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={label}>{t.descLabel}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descPh}
                maxLength={200}
                rows={3}
                style={{ ...inp, resize: "none" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5 }}>
                <span style={{ fontSize: ".73rem", color: description.length > 180 ? "#F59E0B" : "#6D5B8E" }}>{description.length}/200</span>
              </div>
            </div>

            {/* Bid slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <label style={{ ...label, marginBottom: 0 }}>{t.bidLabel}</label>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.05rem", fontWeight: 700, color: "#A855F7" }}>${bidDollars}/kun</span>
              </div>
              <input
                type="range"
                min={100}
                max={3000}
                step={50}
                value={bidCents}
                onChange={(e) => setBidCents(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "#7C3AED", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: ".73rem", color: "#6D5B8E" }}>
                <span>$1.00</span>
                <span style={{ color: "#A78BFA" }}>{t.bidNote}</span>
                <span>$30.00</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label style={label}>{t.durLabel} <span style={{ color: "#F87171" }}>*</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {([7, 14, 30] as const).map((d) => {
                  const active = !isCustomDur && duration === d;
                  const dayTotal = (bidCents * d / 100).toFixed(2);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => { setDuration(d); setIsCustomDur(false); setCustomDays(""); }}
                      style={{
                        padding: "14px 10px", borderRadius: 13,
                        border: `1px solid ${active ? "#7C3AED" : "#2D1F50"}`,
                        background: active ? "rgba(124,58,237,.12)" : "#160F2A",
                        color: active ? "#A855F7" : "#A78BFA",
                        cursor: "pointer", textAlign: "center", transition: "all .15s", position: "relative",
                      }}
                    >
                      {d === 14 && (
                        <span style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", padding: "2px 8px", borderRadius: 100, background: "#F59E0B", color: "#000", fontSize: ".6rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {t.popular}
                        </span>
                      )}
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "'Unbounded',sans-serif" }}>{d}</div>
                      <div style={{ fontSize: ".72rem", color: active ? "#A855F7" : "#6D5B8E", marginTop: 2 }}>
                        {lang === "uz" ? "kun" : "days"}
                      </div>
                      <div style={{ fontSize: ".8rem", fontWeight: 600, color: active ? "#EDE9FE" : "#6D5B8E", marginTop: 6, fontFamily: "'JetBrains Mono',monospace" }}>
                        ${dayTotal}
                      </div>
                    </button>
                  );
                })}
                {/* Custom duration button */}
                <button
                  type="button"
                  onClick={() => { setIsCustomDur(true); setCustomDays(""); }}
                  style={{
                    padding: "14px 10px", borderRadius: 13,
                    border: `1px solid ${isCustomDur ? "#7C3AED" : "#2D1F50"}`,
                    background: isCustomDur ? "rgba(124,58,237,.12)" : "#160F2A",
                    color: isCustomDur ? "#A855F7" : "#A78BFA",
                    cursor: "pointer", textAlign: "center", transition: "all .15s",
                  }}
                >
                  <div style={{ fontSize: ".9rem", fontWeight: 700 }}>
                    {lang === "uz" ? "O'zim" : "Custom"}
                  </div>
                  <div style={{ fontSize: ".72rem", color: isCustomDur ? "#A855F7" : "#6D5B8E", marginTop: 2 }}>
                    {lang === "uz" ? "belgilayman" : "duration"}
                  </div>
                  <div style={{ fontSize: ".8rem", fontWeight: 600, color: isCustomDur && customDays ? "#EDE9FE" : "#6D5B8E", marginTop: 6, fontFamily: "'JetBrains Mono',monospace" }}>
                    {isCustomDur && customDays ? `$${(bidCents * parseInt(customDays) / 100).toFixed(2)}` : "?"}
                  </div>
                </button>
              </div>
              {/* Custom days input */}
              {isCustomDur && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomDays(val);
                      const n = parseInt(val);
                      if (!isNaN(n) && n >= 1 && n <= 365) setDuration(n);
                    }}
                    placeholder={lang === "uz" ? "Kunlar sonini kiriting (1–365)" : "Enter number of days (1–365)"}
                    style={{ ...inp, flex: 1 }}
                  />
                  <span style={{ fontSize: ".84rem", color: "#6D5B8E", whiteSpace: "nowrap" }}>
                    {lang === "uz" ? "kun" : "days"}
                  </span>
                </div>
              )}
            </div>

            {/* Total summary */}
            <div style={{ padding: "18px 20px", borderRadius: 13, background: "rgba(124,58,237,.08)", border: "1px solid #7C3AED" }}>
              <div style={{ fontSize: ".73rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>{t.totalLabel}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".84rem", marginBottom: 7 }}>
                <span style={{ color: "#6D5B8E" }}>{displayCat ? `${displayCat.emoji} ${displayCat.label}` : t.catLabel}</span>
                <span style={{ color: "#EDE9FE" }}>${bidDollars} × {duration} {lang === "uz" ? "kun" : "days"}</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(124,58,237,.3)", paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: ".84rem", color: "#A78BFA" }}>{t.total}</span>
                <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#34D399" }}>${totalDollars}</span>
              </div>
              <div style={{ marginTop: 10, fontSize: ".73rem", color: "#6D5B8E" }}>{t.totalNote}</div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%", padding: "16px 0", borderRadius: 13, border: "none",
                background: submitting ? "#4C1D95" : "linear-gradient(135deg,#7C3AED,#A855F7)",
                color: "#fff", fontSize: ".95rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: submitting ? "none" : "0 4px 20px rgba(124,58,237,.4)",
                transition: "all .2s",
              }}
            >
              {submitting ? t.submitting : t.submitBtn}
            </button>
          </div>

          {/* ── RIGHT: Preview + Breakdown + Rules ─────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>

            {/* Ad preview card */}
            <div style={{ ...card, padding: 20 }}>
              <div style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 14 }}>{t.previewTitle}</div>

              {/* Image preview */}
              <div style={{ borderRadius: 11, overflow: "hidden", background: "#160F2A", aspectRatio: "16/9", marginBottom: 14, position: "relative" }}>
                {imagePreview ? (
                  <Image src={imagePreview} alt="preview" fill style={{ objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#4A3C6E", fontSize: ".8rem" }}>
                    {t.imageClick}
                  </div>
                )}
                {/* Position badge */}
                <div style={{ position: "absolute", top: 8, left: 8, padding: "3px 9px", borderRadius: 100, background: "rgba(245,158,11,.9)", color: "#000", fontSize: ".65rem", fontWeight: 700 }}>
                  🥇 #1
                </div>
              </div>

              {/* Ad meta */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".85rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {brandInitial}
                </div>
                <div>
                  <div style={{ fontSize: ".87rem", fontWeight: 700, color: "#EDE9FE" }}>
                    {title || t.titlePh}
                  </div>
                  <div style={{ fontSize: ".74rem", color: "#6D5B8E" }}>{brandName}</div>
                </div>
                {displayCat && (
                  <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", fontSize: ".67rem", color: "#6D5B8E" }}>
                    {displayCat.emoji} {displayCat.label}
                  </span>
                )}
              </div>

              {description && (
                <p style={{ fontSize: ".8rem", color: "#A78BFA", lineHeight: 1.55, marginTop: 8, marginBottom: 12 }}>{description}</p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".82rem", fontWeight: 700, color: "#FCD34D" }}>${bidDollars}/kun</span>
                <span style={{ padding: "7px 14px", borderRadius: 9, background: "#7C3AED", color: "#fff", fontSize: ".78rem", fontWeight: 700 }}>
                  {lang === "uz" ? "Saytga oʻting" : "Visit site"}
                </span>
              </div>

              <div style={{ marginTop: 12, fontSize: ".73rem", color: "#6D5B8E", textAlign: "center" }}>{t.previewNote}</div>
            </div>

            {/* Cost breakdown */}
            <div style={{ ...card, padding: 20 }}>
              <div style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 14 }}>{t.costTitle}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { k: t.perDay, v: `$${bidDollars}` },
                  { k: t.days, v: `${duration} ${lang === "uz" ? "kun" : "days"}` },
                  { k: t.total, v: `$${totalDollars}`, highlight: true },
                ].map((row) => (
                  <div key={row.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: row.highlight ? 0 : 10, borderBottom: row.highlight ? "none" : "1px solid #2D1F50" }}>
                    <span style={{ fontSize: ".82rem", color: "#6D5B8E" }}>{row.k}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: row.highlight ? "1.05rem" : ".88rem", fontWeight: row.highlight ? 700 : 600, color: row.highlight ? "#34D399" : "#EDE9FE" }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules card */}
            <div style={{ background: "#160F2A", border: "1px solid #2D1F50", borderRadius: 18, padding: 20 }}>
              <div style={{ fontSize: ".73rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 12 }}>{t.rulesTitle}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[t.rule1, t.rule2, t.rule3, t.rule4].map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(124,58,237,.16)", border: "1px solid #2D1F50", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".62rem", fontWeight: 700, color: "#6D5B8E", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <span style={{ fontSize: ".79rem", color: "#6D5B8E", lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Inner page (uses useSearchParams) ────────────────────────────────────────
function CreatePageInner() {
  const router = useRouter();
  const { firebaseUser, userProfile, signOut, loading } = useAuth();
  const [lang, setLang] = useState<Lang>("uz");

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/auth");
  }, [loading, firebaseUser, router]);

  const handleSignOut = () => { signOut(); router.push("/"); };
  const handleDashNav = (screen = "all") => { router.push(`/dashboard?screen=${screen}`); };
  const handleGoCreate = () => {}; // already here

  if (loading || !firebaseUser) {
    return (
      <div style={{ minHeight: "100vh", background: "#0E0B1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#6D5B8E", fontSize: ".9rem" }}>Yuklanmoqda...</span>
      </div>
    );
  }

  const brandName = userProfile?.displayName || "Brend";
  const brandInitial = brandName.charAt(0).toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: "#0E0B1A", color: "#EDE9FE", fontFamily: "system-ui,sans-serif" }}>
      <style>{`
        @keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
      `}</style>

      <AppHeader
        lang={lang}
        setLang={setLang}
        totalSpentCents={userProfile?.totalSpentCents || 0}
        brandName={brandName}
        brandInitial={brandInitial}
        onGoCreate={handleGoCreate}
        onGoProfile={() => handleDashNav("profile")}
        onGoWallet={() => handleDashNav("wallet")}
      />

      <div className="dash-layout">
        <Sidebar
          lang={lang}
          myAdsCount={0}
          onSignOut={handleSignOut}
          onDashNav={handleDashNav}
        />
        <main className="dash-main">
          <CreateView
            lang={lang}
            userProfile={userProfile}
            firebaseUser={firebaseUser}
            router={router}
          />
        </main>
      </div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function CreatePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0E0B1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#6D5B8E" }}>Yuklanmoqda...</span>
      </div>
    }>
      <CreatePageInner />
    </Suspense>
  );
}
