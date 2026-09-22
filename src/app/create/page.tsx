"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { LANGS } from "@/lib/i18n";
import { CATEGORIES, Category } from "@/types";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────
type Lang = "uz" | "en" | "ru";

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
    dayLabel: "kun",
    browseLabel: "Tanlash",
    removeLabel: "Oʻchirish",
    customLabel: "O'zim",
    customDurLabel: "belgilayman",
    loadingLabel: "Yuklanmoqda...",
    visitSiteLabel: "Saytga oʻting",
    newCampaignLabel: "Yangi kampaniya",
    termsAgree: "Men PRIMIO",
    termsLink: "Ommaviy Oferta Shartnomasini",
    termsAgree2: "o'qidim va qabul qilaman",
    errTerms: "Ommaviy oferta shartlariga rozilik bildiring",
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
    dayLabel: "days",
    browseLabel: "Browse",
    removeLabel: "Remove",
    customLabel: "Custom",
    customDurLabel: "duration",
    loadingLabel: "Loading...",
    visitSiteLabel: "Visit site",
    newCampaignLabel: "New campaign",
    termsAgree: "I have read and agree to the PRIMIO",
    termsLink: "Public Offer Agreement",
    termsAgree2: "",
    errTerms: "Please agree to the Public Offer Agreement",
  },
  ru: {
    dashLabel: "Панель",
    totalSpent: "Всего потрачено",
    navAll: "Все объявления",
    navMyAds: "Мои объявления",
    navCats: "Категории",
    navWallet: "Платежи",
    navProfile: "Профиль",
    navGuide: "Как это работает",
    logout: "Выйти",
    sideMain: "Меню",
    ctaCreate: "Разместить рекламу",
    createTitle: "Новое объявление",
    createSub: "Заполните все поля и отправьте на модерацию.",
    titleLabel: "Заголовок",
    titlePh: "Название компании или продукта",
    imageLabel: "Изображение",
    imageNote: "PNG, JPG, WebP — макс. 5 МБ",
    imageClick: "Нажмите или перетащите, чтобы загрузить",
    urlLabel: "URL сайта",
    urlPh: "https://вашсайт.com",
    urlNote: "Должен начинаться с HTTPS",
    catLabel: "Категория",
    descLabel: "Краткое описание (необязательно)",
    descPh: "О вашей компании или продукте...",
    bidLabel: "Ежедневная ставка (USD/день)",
    bidNote: "Больше ставка — выше позиция",
    durLabel: "Длительность кампании",
    popular: "Популярное",
    totalLabel: "Итого к оплате",
    totalNote: "Оплата снимается только после одобрения",
    submitBtn: "Отправить на модерацию →",
    submitting: "🤖 ИИ проверяет...",
    previewTitle: "Предпросмотр",
    previewNote: "Так будет выглядеть ваша реклама",
    costTitle: "Расчёт стоимости",
    perDay: "Ежедневная ставка",
    days: "Длительность",
    total: "Итого",
    rulesTitle: "⚠️ Важные правила",
    rule1: "Реклама сначала проверяется ИИ (30–90 сек.).",
    rule2: "Оплата снимается только после одобрения.",
    rule3: "За отклонённую рекламу плата не взимается.",
    rule4: "URL без HTTPS не принимаются.",
    previewBrand: "Название бренда",
    previewDesc: "Краткое описание появится здесь...",
    errTitle: "Введите заголовок",
    errTitleLong: "Заголовок не должен превышать 60 символов",
    errUrl: "URL должен начинаться с https://",
    errImage: "Загрузите изображение",
    errBid: "Минимальная ставка $1 в день",
    errDesc: "Описание не должно превышать 200 символов",
    errSubmit: "Что-то пошло не так",
    noAdsTitle: "Разместить рекламу",
    noAdsBody: "Кошелёк готов. Создайте рекламу в одной форме.",
    sideCta: "Разместить",
    dayLabel: "дней",
    browseLabel: "Выбрать",
    removeLabel: "Удалить",
    customLabel: "Своё",
    customDurLabel: "длительность",
    loadingLabel: "Загрузка...",
    visitSiteLabel: "Перейти на сайт",
    newCampaignLabel: "Новая кампания",
    termsAgree: "Я прочитал и принимаю",
    termsLink: "Публичную Оферту PRIMIO",
    termsAgree2: "",
    errTerms: "Пожалуйста, примите условия Публичной Оферты",
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
  lang, setLang, totalSpentCents, brandName, brandInitial, onGoCreate, onGoProfile, onGoWallet, onOpenDrawer,
}: {
  lang: Lang; setLang: (l: string) => void;
  totalSpentCents: number; brandName: string; brandInitial: string;
  onGoCreate: () => void; onGoProfile: () => void; onGoWallet: () => void; onOpenDrawer: () => void;
}) {
  const t = T[lang];
  const btnBase: React.CSSProperties = { padding: "4px 9px", borderRadius: 7, border: "none", fontSize: ".71rem", fontWeight: 700, cursor: "pointer" };
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 80, background: "rgba(14,11,26,.94)", backdropFilter: "blur(18px)", borderBottom: "1px solid #2D1F50" }}>
      <div className="create-hdr-outer" style={{ padding: "11px 26px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="24" fill="#7C3AED"/>
            <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
            <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
          </svg>
          <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".85rem", fontWeight: 700, color: "#EDE9FE" }}>PRIMIO</span>
          <span className="create-hdr-badge" style={{ padding: "2px 9px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", fontSize: ".66rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#6D5B8E" }}>{t.dashLabel}</span>
        </div>
        <div className="create-hdr-right" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <div style={{ display: "flex", padding: 2, borderRadius: 9, background: "#160F2A", border: "1px solid #2D1F50" }}>
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code as Lang)} style={{ ...btnBase, background: lang === l.code ? "#2D1F50" : "transparent", color: lang === l.code ? "#EDE9FE" : "#6D5B8E" }}>{l.label}</button>
            ))}
          </div>
          <button className="create-hdr-spent" onClick={onGoWallet} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 10, background: "#160F2A", border: "1px solid #2D1F50", color: "#EDE9FE", cursor: "pointer" }}>
            <span style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700 }}>{t.totalSpent}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".86rem", fontWeight: 600, color: "#FCD34D" }}>${(totalSpentCents / 100).toFixed(0)}</span>
          </button>
          <button onClick={onGoProfile} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 11px 5px 5px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", color: "#EDE9FE", cursor: "pointer" }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, color: "#fff" }}>{brandInitial}</span>
            <span className="create-hdr-name" style={{ fontSize: ".78rem", fontWeight: 600 }}>{brandName}</span>
          </button>
          <button className="create-hdr-cta" onClick={onGoCreate} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#7C3AED", color: "#fff", fontSize: ".82rem", fontWeight: 700, cursor: "pointer" }}>+ {t.ctaCreate}</button>
          <button
            className="dash-hamburger"
            onClick={onOpenDrawer}
            aria-label="Open menu"
            style={{ alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 9, border: "1px solid rgba(124,58,237,.35)", background: "rgba(124,58,237,.12)", color: "#A78BFA", cursor: "pointer", flexShrink: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4" width="14" height="1.5" rx=".75" fill="currentColor"/>
              <rect x="2" y="8.25" width="14" height="1.5" rx=".75" fill="currentColor"/>
              <rect x="2" y="12.5" width="14" height="1.5" rx=".75" fill="currentColor"/>
            </svg>
          </button>
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

// ─── Mobile Create Drawer ─────────────────────────────────────────────────────
function MobileCreateDrawer({
  open, onClose, lang, setLang, brandName, brandInitial,
  totalSpentCents, router, onSignOut,
}: {
  open: boolean; onClose: () => void;
  lang: Lang; setLang: (l: string) => void;
  brandName: string; brandInitial: string;
  totalSpentCents: number;
  router: ReturnType<typeof useRouter>;
  onSignOut: () => void;
}) {
  const t = T[lang];

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const NAV = [
    { k: "all",     icon: "🏆", label: t.navAll },
    { k: "myads",   icon: "📋", label: t.navMyAds },
    { k: "cats",    icon: "🏷",  label: t.navCats },
    { k: "wallet",  icon: "💳", label: t.navWallet },
    { k: "profile", icon: "👤", label: t.navProfile },
  ];

  const go = (screen: string) => { router.push(`/dashboard?screen=${screen}`); onClose(); };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 199,
          background: "rgba(0,0,0,.55)", backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .28s ease",
        }}
      />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 200,
        width: "min(300px, 88vw)",
        background: "#0E0B1A",
        borderLeft: "1px solid #2D1F50",
        display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform .3s cubic-bezier(.4,0,.2,1)",
        overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #2D1F50", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="24" fill="#7C3AED"/>
              <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
              <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
            </svg>
            <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".85rem", fontWeight: 700, color: "#EDE9FE" }}>PRIMIO</span>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #2D1F50", background: "rgba(109,91,142,.12)", color: "#6D5B8E", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: "14px 20px", borderBottom: "1px solid #2D1F50", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".88rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{brandInitial}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: ".84rem", fontWeight: 700, color: "#EDE9FE", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{brandName}</div>
            <div style={{ fontSize: ".71rem", color: "#6D5B8E", marginTop: 2 }}>
              {t.totalSpent}: <span style={{ color: "#FCD34D", fontFamily: "'JetBrains Mono',monospace" }}>${(totalSpentCents / 100).toFixed(0)}</span>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "10px 10px" }}>
          <div style={{ fontSize: ".6rem", letterSpacing: ".13em", textTransform: "uppercase", color: "#4A3C6E", fontWeight: 700, padding: "6px 10px 8px" }}>{t.sideMain}</div>
          {NAV.map((n) => (
            <button
              key={n.k}
              onClick={() => go(n.k)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "11px 12px", borderRadius: 10, border: "none", marginBottom: 2,
                background: "transparent", color: "#A78BFA",
                fontSize: ".88rem", fontWeight: 500, cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{ width: 20, textAlign: "center" }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
            </button>
          ))}
          <div style={{ height: 1, background: "#2D1F50", margin: "10px 2px" }} />
          <button
            onClick={() => { window.open("/how-it-works", "_blank"); onClose(); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 10, border: "none", background: "transparent", color: "#6D5B8E", fontSize: ".84rem", fontWeight: 500, cursor: "pointer" }}
          >
            <span style={{ width: 20, textAlign: "center" }}>📖</span>
            <span>{t.navGuide}</span>
          </button>
        </nav>

        <div style={{ padding: "12px 20px", borderTop: "1px solid #2D1F50", flexShrink: 0 }}>
          <div style={{ fontSize: ".6rem", letterSpacing: ".12em", textTransform: "uppercase", color: "#4A3C6E", fontWeight: 700, marginBottom: 9 }}>Til</div>
          <div style={{ display: "flex", gap: 6 }}>
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code as Lang)}
                style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: `1px solid ${lang === l.code ? "#7C3AED" : "#2D1F50"}`, cursor: "pointer", fontSize: ".8rem", fontWeight: 700, letterSpacing: ".05em", background: lang === l.code ? "rgba(124,58,237,.2)" : "transparent", color: lang === l.code ? "#A855F7" : "#6D5B8E", transition: "all .15s" }}
              >{l.label}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: "#7C3AED", color: "#fff", fontSize: ".84rem", fontWeight: 700, cursor: "pointer" }}
          >
            + {t.ctaCreate}
          </button>
          <button
            onClick={() => { onSignOut(); onClose(); }}
            style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "1px solid rgba(248,113,113,.3)", background: "rgba(248,113,113,.07)", color: "#F87171", fontSize: ".84rem", fontWeight: 700, cursor: "pointer" }}
          >
            ↩ {t.logout}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Create page bottom nav ───────────────────────────────────────────────────
function CreateBottomNav({ lang, router }: { lang: Lang; router: ReturnType<typeof useRouter> }) {
  const t = T[lang];
  const tabs: { k: string | null; icon: React.ReactNode; label: Record<Lang, string>; cls?: string }[] = [
    {
      k: "all", cls: "",
      label: { uz: "Reyting", en: "Ranking", ru: "Рейтинг" },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
    },
    {
      k: "myads", cls: "",
      label: { uz: "Reklamam", en: "My Ads", ru: "Мои" },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
    },
    {
      k: null, cls: "dbnav-create dbnav-active",
      label: { uz: "Yangi", en: "New", ru: "Создать" },
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      ),
    },
    {
      k: "wallet", cls: "",
      label: { uz: "To'lov", en: "Wallet", ru: "Оплата" },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      ),
    },
    {
      k: "profile", cls: "",
      label: { uz: "Profil", en: "Profile", ru: "Профиль" },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ];

  return (
    <nav className="dash-bnav">
      {tabs.map((tab, i) => (
        <button
          key={i}
          className={tab.cls || ""}
          onClick={() => tab.k !== null ? router.push(`/dashboard?screen=${tab.k}`) : undefined}
        >
          <span className="dbnav-icon">{tab.icon}</span>
          <span>{tab.label[lang]}</span>
        </button>
      ))}
    </nav>
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
  const [url, setUrl] = useState("");
  const [bidCents, setBidCents] = useState(Math.max(100, defaultBidCents));
  const [duration, setDuration] = useState<number>(7);
  const [isCustomDur, setIsCustomDur] = useState(false);
  const [customDays, setCustomDays] = useState("");
  const [category, setCategory] = useState<Category>(defaultCat || "technology");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [restoredBase64, setRestoredBase64] = useState<{full: string; mod: string; mime: string} | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Scanning sahifasidan ?restore=1 bilan qaytganda formni tiklash
  // Boshqa holatlarda (yangi reklama) sessionStorage tozalanadi
  useEffect(() => {
    const isRestore = searchParams.get("restore") === "1";
    if (!isRestore) {
      sessionStorage.removeItem("primio_scan");
      return;
    }
    try {
      const raw = sessionStorage.getItem("primio_scan");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.title) setTitle(d.title);
      if (d.url) setUrl(d.url);
      if (d.category) setCategory(d.category);
      if (d.bidCents) setBidCents(d.bidCents);
      if (d.duration) setDuration(d.duration);
      if (d.imageBase64 && d.imageBase64Mod && d.imageMimeTypeMod) {
        setImagePreview(`data:${d.imageMimeTypeMod};base64,${d.imageBase64Mod}`);
        setRestoredBase64({ full: d.imageBase64, mod: d.imageBase64Mod, mime: d.imageMimeTypeMod });
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
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
    if (!imageFile && !restoredBase64) return setError(t.errImage);
    if (!category) return setError(t.catLabel);
    if (bidCents < 100) return setError(t.errBid);
    if (!termsAgreed) return setError(t.errTerms);

    setSubmitting(true);
    try {
      let imageBase64: string;
      let imageBase64Mod: string;
      let imageMimeTypeMod: string;

      if (imageFile) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        const comp = await compressForModeration(imageFile);
        imageBase64Mod = comp.base64;
        imageMimeTypeMod = comp.mimeType;
      } else {
        // Oldingi urinishdan saqlangan base64 ishlatiladi
        imageBase64 = restoredBase64!.full;
        imageBase64Mod = restoredBase64!.mod;
        imageMimeTypeMod = restoredBase64!.mime;
      }

      const idToken = await firebaseUser.getIdToken();

      // Ma'lumotlarni sessionStorage ga saqlash
      sessionStorage.setItem("primio_scan", JSON.stringify({
        title: title.trim(),
        url: url.trim(),
        category,
        bidCents,
        duration,
        imageBase64,
        imageBase64Mod,
        imageMimeTypeMod,
        idToken,
        uid: firebaseUser.uid,
      }));

      // Darhol scanning sahifasiga o'tish
      router.push("/create/scanning");
    } catch (err: any) {
      setError(t.errSubmit + ": " + (err?.message || "Qayta urinib koʻring"));
      setSubmitting(false);
    }
  };

  const displayCat = category ? CATEGORIES[category] : null;
  const brandName = userProfile?.displayName || "Brend";
  const brandInitial = brandName.charAt(0).toUpperCase();

  return (
    <div className="create-inner" style={{ padding: "28px 32px 60px", flex: 1, minWidth: 0 }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: ".7rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 6 }}>
          📢 {t.newCampaignLabel}
        </div>
        <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-.03em", color: "#EDE9FE", lineHeight: 1.15 }}>
          {t.createTitle}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rg-form">

          {/* ── LEFT: Form — single column, clean sections ──────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 11, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.28)", color: "#F87171", fontSize: ".84rem" }}>
                {error}
              </div>
            )}

            {/* ── 1. Sarlavha + URL yan-yon ─────────────────────────── */}
            <div style={{ ...card, padding: 20 }}>
              <div className="create-title-url-grid">
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
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                    <span style={{ fontSize: ".71rem", color: title.length > 50 ? "#F59E0B" : "#6D5B8E" }}>{title.length}/60</span>
                  </div>
                </div>
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
                  <div style={{ marginTop: 4, fontSize: ".71rem", color: "#6D5B8E" }}>{t.urlNote}</div>
                </div>
              </div>
            </div>

            {/* ── 2. Rasm + Toifa yonma-yon ─────────────────────────── */}
            <div className="create-inner-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>

              {/* Rasm */}
              <div style={{ ...card, padding: 16 }}>
                <label style={{ ...label, marginBottom: 10 }}>{t.imageLabel} <span style={{ color: "#F87171" }}>*</span></label>

                {imagePreview ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 10, overflow: "hidden" }}>
                      <Image src={imagePreview} alt="preview" fill style={{ objectFit: "cover" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: ".78rem", color: "#EDE9FE", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {imageFile?.name || "rasm.jpg"}
                        </div>
                        <div style={{ fontSize: ".68rem", color: "#6D5B8E" }}>
                          {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        style={{ padding: "5px 10px", borderRadius: 8, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", color: "#F87171", fontSize: ".72rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                      >
                        {t.removeLabel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "24px 12px", borderRadius: 12, border: "1.5px dashed #2D1F50", background: "#160F2A", cursor: "pointer", transition: "border-color .15s", minHeight: 120 }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#7C3AED")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#2D1F50")}
                  >
                    <span style={{ fontSize: "1.8rem" }}>🖼</span>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: ".78rem", color: "#A78BFA", fontWeight: 600 }}>{t.imageClick}</div>
                      <div style={{ fontSize: ".67rem", color: "#6D5B8E", marginTop: 2 }}>{t.imageNote}</div>
                    </div>
                    <span style={{ padding: "6px 14px", borderRadius: 9, background: "rgba(124,58,237,.15)", border: "1px solid #7C3AED", color: "#A855F7", fontSize: ".75rem", fontWeight: 700 }}>
                      {t.browseLabel}
                    </span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </div>

              {/* Toifa */}
              <div style={{ ...card, padding: 16 }}>
                <label style={{ ...label, marginBottom: 8 }}>{t.catLabel} <span style={{ color: "#F87171" }}>*</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {CAT_KEYS.map((cat) => {
                    const meta = CATEGORIES[cat];
                    const active = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        style={{
                          padding: "8px 7px", borderRadius: 9, border: `1px solid ${active ? "#7C3AED" : "#2D1F50"}`,
                          background: active ? "rgba(124,58,237,.18)" : "#160F2A",
                          color: active ? "#A855F7" : "#A78BFA",
                          cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 6,
                          fontSize: ".72rem", fontWeight: active ? 700 : 500, transition: "all .15s",
                          outline: active ? "1px solid rgba(124,58,237,.4)" : "none",
                        }}
                      >
                        <span style={{ fontSize: ".85rem", flexShrink: 0 }}>{meta.emoji}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── 3. Kunlik taklif + Kampaniya davri (bitta karta) ──── */}
            <div style={{ ...card, padding: 18 }}>

              {/* Bid slider */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <label style={{ ...label, marginBottom: 0 }}>{t.bidLabel}</label>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.1rem", fontWeight: 700, color: "#A855F7" }}>${bidDollars}/{t.dayLabel}</span>
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
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: ".7rem", color: "#6D5B8E" }}>
                  <span>$1.00</span>
                  <span style={{ color: "#A78BFA" }}>{t.bidNote}</span>
                  <span>$30.00</span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid #2D1F50", marginBottom: 14 }} />

              {/* Duration */}
              <label style={{ ...label, marginBottom: 10 }}>{t.durLabel} <span style={{ color: "#F87171" }}>*</span></label>
              <div className="create-dur-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {([7, 14, 30] as const).map((d) => {
                  const active = !isCustomDur && duration === d;
                  const dayTotal = (bidCents * d / 100).toFixed(2);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => { setDuration(d); setIsCustomDur(false); setCustomDays(""); }}
                      style={{
                        padding: "11px 6px", borderRadius: 10,
                        border: `1px solid ${active ? "#7C3AED" : "#2D1F50"}`,
                        background: active ? "rgba(124,58,237,.12)" : "#160F2A",
                        color: active ? "#A855F7" : "#A78BFA",
                        cursor: "pointer", textAlign: "center", transition: "all .15s", position: "relative",
                      }}
                    >
                      {d === 14 && (
                        <span style={{ position: "absolute", top: -7, left: "50%", transform: "translateX(-50%)", padding: "2px 6px", borderRadius: 100, background: "#F59E0B", color: "#000", fontSize: ".56rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {t.popular}
                        </span>
                      )}
                      <div style={{ fontSize: "1rem", fontWeight: 700, fontFamily: "'Unbounded',sans-serif" }}>{d}</div>
                      <div style={{ fontSize: ".65rem", color: active ? "#A855F7" : "#6D5B8E", marginTop: 1 }}>{t.dayLabel}</div>
                      <div style={{ fontSize: ".72rem", fontWeight: 600, color: active ? "#EDE9FE" : "#6D5B8E", marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>
                        ${dayTotal}
                      </div>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => { setIsCustomDur(true); setCustomDays(""); }}
                  style={{
                    padding: "11px 6px", borderRadius: 10,
                    border: `1px solid ${isCustomDur ? "#7C3AED" : "#2D1F50"}`,
                    background: isCustomDur ? "rgba(124,58,237,.12)" : "#160F2A",
                    color: isCustomDur ? "#A855F7" : "#A78BFA",
                    cursor: "pointer", textAlign: "center", transition: "all .15s",
                  }}
                >
                  <div style={{ fontSize: ".85rem", fontWeight: 700 }}>{t.customLabel}</div>
                  <div style={{ fontSize: ".65rem", color: isCustomDur ? "#A855F7" : "#6D5B8E", marginTop: 1 }}>{t.customDurLabel}</div>
                  <div style={{ fontSize: ".72rem", fontWeight: 600, color: isCustomDur && customDays ? "#EDE9FE" : "#6D5B8E", marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>
                    {isCustomDur && customDays ? `$${(bidCents * parseInt(customDays) / 100).toFixed(2)}` : "?"}
                  </div>
                </button>
              </div>
              {isCustomDur && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
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
                    placeholder={`${t.dayLabel} (1–365)`}
                    style={{ ...inp, flex: 1 }}
                  />
                  <span style={{ fontSize: ".83rem", color: "#6D5B8E", whiteSpace: "nowrap" }}>
                    {t.dayLabel}
                  </span>
                </div>
              )}
            </div>

            {/* ── 6. Jami to'lov + Submit ───────────────────────────── */}
            <div style={{ ...card, padding: "16px 22px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 auto" }}>
                <div style={{ fontSize: ".67rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 2 }}>{t.totalLabel}</div>
                <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#34D399", lineHeight: 1 }}>${totalDollars}</div>
                <div style={{ fontSize: ".71rem", color: "#6D5B8E", marginTop: 3 }}>
                  ${bidDollars} × {duration} {t.dayLabel}
                  {displayCat ? ` · ${displayCat.emoji} ${displayCat.label}` : ""}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: ".7rem", color: "#6D5B8E", marginBottom: 8 }}>{t.totalNote}</div>
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
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
                    background: submitting ? "#4C1D95" : "linear-gradient(135deg,#7C3AED,#A855F7)",
                    color: "#fff", fontSize: ".92rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: submitting ? "none" : "0 4px 20px rgba(124,58,237,.4)",
                    transition: "all .2s",
                  }}
                >
                  {submitting ? t.submitting : t.submitBtn}
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Preview + Breakdown + Rules ─────────────────── */}
          <div className="create-right-col" style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>

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
                  <div style={{ fontSize: ".87rem", fontWeight: 700, color: "#EDE9FE" }}>{title || t.titlePh}</div>
                  <div style={{ fontSize: ".74rem", color: "#6D5B8E" }}>{brandName}</div>
                </div>
                {displayCat && (
                  <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", fontSize: ".67rem", color: "#6D5B8E" }}>
                    {displayCat.emoji} {displayCat.label}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".82rem", fontWeight: 700, color: "#FCD34D" }}>${bidDollars}/{t.dayLabel}</span>
                <span style={{ padding: "7px 14px", borderRadius: 9, background: "#7C3AED", color: "#fff", fontSize: ".78rem", fontWeight: 700 }}>
                  {t.visitSiteLabel}
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
                  { k: t.days, v: `${duration} ${t.dayLabel}` },
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
  const { lang: globalLang, setLang: setGlobalLang } = useLang();
  const lang = (["uz","en","ru"].includes(globalLang) ? globalLang : "en") as Lang;
  const setLang = (l: string) => setGlobalLang(l as Lang);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/auth");
  }, [loading, firebaseUser, router]);

  const handleSignOut = () => { signOut(); router.push("/"); };
  const handleDashNav = (screen = "all") => { router.push(`/dashboard?screen=${screen}`); };
  const handleGoCreate = () => {};

  if (loading || !firebaseUser) {
    return (
      <div style={{ minHeight: "100vh", background: "#0E0B1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#6D5B8E", fontSize: ".9rem" }}>{T[lang].loadingLabel}</span>
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
        onOpenDrawer={() => setDrawerOpen(true)}
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

      <MobileCreateDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lang={lang}
        setLang={setLang}
        brandName={brandName}
        brandInitial={brandInitial}
        totalSpentCents={userProfile?.totalSpentCents || 0}
        router={router}
        onSignOut={handleSignOut}
      />
      <CreateBottomNav lang={lang} router={router} />
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function CreatePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0E0B1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#6D5B8E" }}>Loading...</span>
      </div>
    }>
      <CreatePageInner />
    </Suspense>
  );
}
