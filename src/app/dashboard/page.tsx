"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  collection, query, where, onSnapshot,
  doc, setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Ad, CATEGORIES, Category } from "@/types";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen = "all" | "myads" | "cats" | "wallet" | "profile";
type Lang = "uz" | "en";

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  uz: {
    dashLabel: "Boshqaruv paneli", totalSpent: "Jami sarflangan",
    navAll: "Barcha reklamalar", navMyAds: "Reklamalarim",
    navCats: "Toifalar", navWallet: "Toʻlovlar", navProfile: "Profil",
    navGuide: "Qanday ishlaydi", logout: "Chiqish", sideMain: "Menyu",
    ctaCreate: "Reklama berish",
    liveAuction: "Jonli auksion",
    allLabel: "Jonli reyting",
    allTitle: "Reyting — barcha reklamalar",
    allSub: "Eng koʻp toʻlagan yuqorida. Tartib faqat kunlik taklif bilan aniqlanadi.",
    reklama: "Reklama", firstPos: "1-OʻRN", minBid: "Minimal taklif",
    tierTop3: "TOP 3", tierTop3Note: "eng koʻp toʻlagan uchtalik",
    tierTop10: "TOP 10", tierTop20: "TOP 20", tierTop50: "TOP 50",
    tierRest: "Keyingi oʻrinlar",
    yourAd: "Sizning", raise: "Taklifni oshirish", outbid: "Oshirib oʻtish",
    catAll: "Barchasi", perDay: "kunlik",
    myAdsTitle: "Reklamalarim", myAdsSub: "Hali reklama yoʻq", myAdsActive: "Faol reklama",
    faol: "Faol", sarflangan: "Sarflangan", korilish: "Koʻrilish", bosish: "Bosish",
    newAccountBadge: "Yangi akkaunt",
    emptyAdsTitle: "Birinchi reklamangizni yarating",
    emptyAdsBody: "Reklama yaratish bepul. Toʻlov faqat AI tasdiqlash va toʻlov bosqichida soʻraladi",
    emptyAdsCta1: "Reklama yaratish →",
    catLabel: "Toifalar", catsTitle: "8 ta mega-toifa",
    catsSub: "Har bir toifada mustaqil reyting. Boʻsh toifada minimal summa bilan ham birinchi oʻrin.",
    firstPlace: "1-oʻrin", minEntry: "Minimal", adsWord: "reklama",
    walletLabel: "Hamyon", walletTitle: "Hamyon va toʻlovlar",
    walletSub: "Toʻlov tarixi va toʻlov usullari. Stripe orqali xavfsiz toʻlov.",
    profileTitle: "Profil va sozlamalar", verified: "Tasdiqlangan",
    statsTitle: "Hisob statistikasi", save: "Saqlash", saving: "Saqlanmoqda...", saved: "✅ Saqlandi",
    notifTitle: "Bildirishnomalar",
    notifSub: "Qaysi hodisalar haqida xabar berishimizni tanlang.",
    dangerTitle: "Akkauntdan chiqish",
    dangerBody: "Chiqqandan keyin reklamalar ishlashda davom etadi — faqat siz tizimdan chiqasiz.",
    rulesTitle: "Muhim",
    sideNoAdsTitle: "Reklama joylashtiring",
    sideNoAdsBody: "Hamyon tayyor. Bitta formada reklama yaratasiz.",
    sideOkTitle: "Hamyon holati",
    sideOkBody: "Reklamalaringiz jonli. Taklifni istalgan vaqt oshirish mumkin.",
    sideCta: "Reklama berish",
    catNames: {
      technology: "Texnologiya", food: "Ovqat", fashion: "Moda",
      education: "Taʼlim", health: "Salomatlik", real_estate: "Uy-joy",
      entertainment: "Koʻngilochar", other: "Boshqa",
    } as Record<Category, string>,
    txTitle: "Toʻlov tarixi", txEmpty: "Hali toʻlovlar yoʻq. Reklama joylashtirsangiz — bu yerda koʻrinadi.",
    payMethod: "Toʻlov usullari", topUpNote: "Toʻlov maʼlumotlari PRIMIO serverida saqlanmaydi. Stripe shifrlaydi.",
    warnTitle: "Muhim", refundTitle: "Qaytarish siyosati",
    dueTitle: "Toʻlov kutilmoqda", payNow: "Toʻlash →",
    kpiSpent: "Jami sarflangan", kpiActive: "Faol reklamalar", kpiImpr: "Jami koʻrilish",
    kpiSpentHint: "Hammasi Stripe orqali", kpiActiveHint: "Hozir jonli", kpiImprHint: "Barcha vaqt",
    payOpts: [
      { icon: "💳", label: "Visa / Mastercard", hint: "Stripe orqali xavfsiz" },
      { icon: "🔵", label: "Google Pay", hint: "Tez va xavfsiz" },
      { icon: "🍎", label: "Apple Pay", hint: "Face ID / Touch ID" },
      { icon: "🟡", label: "PayPal", hint: "200M+ foydalanuvchi" },
      { icon: "🪙", label: "USDT / USDC", hint: "Bank kerak emas" },
    ],
    warnRows: [
      { color: "#F59E0B", title: "Oldindan toʻlov", body: "Reklama faqat toʻlovdan keyin boshlanadi." },
      { color: "#34D399", title: "Qaytarish yoʻq", body: "Tasdiqlangan va ishga tushgan reklama uchun pul qaytarilmaydi." },
      { color: "#A855F7", title: "Yangi akkaunt", body: "Birinchi toʻlovdan keyin 24 soatlik tekshiruv boʻlishi mumkin." },
    ],
    refundRows: [
      { k: "Moderatsiyadan oʻtmagan", v: "Toʻliq qaytarish", color: "#34D399" },
      { k: "24 soat ichida bekor", v: "Toʻliq qaytarish", color: "#34D399" },
      { k: "Tasdiqlangan, boshlangan", v: "Qaytarish yoʻq", color: "#F87171" },
      { k: "Texnik xatolik", v: "Koʻrib chiqiladi", color: "#F59E0B" },
    ],
  },
  en: {
    dashLabel: "Dashboard", totalSpent: "Total spent",
    navAll: "All ads", navMyAds: "My ads",
    navCats: "Categories", navWallet: "Payments", navProfile: "Profile",
    navGuide: "How it works", logout: "Sign out", sideMain: "Menu",
    ctaCreate: "Place ad",
    liveAuction: "Live auction",
    allLabel: "Live ranking",
    allTitle: "Ranking — all ads",
    allSub: "Highest bidder ranks first. Only daily bid determines the order.",
    reklama: "Ads", firstPos: "1ST", minBid: "Min bid",
    tierTop3: "TOP 3", tierTop3Note: "top 3 by daily bid",
    tierTop10: "TOP 10", tierTop20: "TOP 20", tierTop50: "TOP 50",
    tierRest: "Remaining",
    yourAd: "Yours", raise: "Raise bid", outbid: "Outbid",
    catAll: "All", perDay: "per day",
    myAdsTitle: "My ads", myAdsSub: "No ads yet", myAdsActive: "Active ad",
    faol: "Active", sarflangan: "Spent", korilish: "Views", bosish: "Clicks",
    newAccountBadge: "New account",
    emptyAdsTitle: "Create your first ad",
    emptyAdsBody: "Creating an ad is free. Payment is only requested after AI approval.",
    emptyAdsCta1: "Create ad →",
    catLabel: "Categories", catsTitle: "8 mega-categories",
    catsSub: "Each category has its own ranking. Win first place with a minimal bid in an empty category.",
    firstPlace: "1st place", minEntry: "Minimum", adsWord: "ads",
    walletLabel: "Wallet", walletTitle: "Wallet & payments",
    walletSub: "Payment history and payment methods. Secure payments via Stripe.",
    profileTitle: "Profile & settings", verified: "Verified",
    statsTitle: "Account stats", save: "Save", saving: "Saving...", saved: "✅ Saved",
    notifTitle: "Notifications",
    notifSub: "Choose which events you want to be notified about.",
    dangerTitle: "Sign out",
    dangerBody: "Your ads continue running after sign-out — you just leave the session.",
    rulesTitle: "Important",
    sideNoAdsTitle: "Place an ad",
    sideNoAdsBody: "Wallet ready. Create an ad in one form.",
    sideOkTitle: "Wallet status",
    sideOkBody: "Your ads are live. You can raise bids any time.",
    sideCta: "Place ad",
    catNames: {
      technology: "Technology", food: "Food", fashion: "Fashion",
      education: "Education", health: "Health", real_estate: "Real estate",
      entertainment: "Entertainment", other: "Other",
    } as Record<Category, string>,
    txTitle: "Payment history", txEmpty: "No payments yet. Once you place an ad, transactions appear here.",
    payMethod: "Payment methods", topUpNote: "Payment details are never stored on PRIMIO servers. Encrypted by Stripe.",
    warnTitle: "Important", refundTitle: "Refund policy",
    dueTitle: "Payment pending", payNow: "Pay now →",
    kpiSpent: "Total spent", kpiActive: "Active ads", kpiImpr: "Total impressions",
    kpiSpentHint: "All via Stripe", kpiActiveHint: "Currently live", kpiImprHint: "All time",
    payOpts: [
      { icon: "💳", label: "Visa / Mastercard", hint: "Secure via Stripe" },
      { icon: "🔵", label: "Google Pay", hint: "Fast and secure" },
      { icon: "🍎", label: "Apple Pay", hint: "Face ID / Touch ID" },
      { icon: "🟡", label: "PayPal", hint: "200M+ users" },
      { icon: "🪙", label: "USDT / USDC", hint: "No bank needed" },
    ],
    warnRows: [
      { color: "#F59E0B", title: "Prepayment required", body: "Ads only start after payment is confirmed." },
      { color: "#34D399", title: "No refunds", body: "Approved and running ads are non-refundable." },
      { color: "#A855F7", title: "New accounts", body: "First payment may go through a 24h review period." },
    ],
    refundRows: [
      { k: "Failed moderation", v: "Full refund", color: "#34D399" },
      { k: "Cancelled within 24h", v: "Full refund", color: "#34D399" },
      { k: "Approved and live", v: "No refund", color: "#F87171" },
      { k: "Technical error", v: "Case-by-case", color: "#F59E0B" },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name ? name.charAt(0).toUpperCase() : "?";
}
function fmtBid(cents: number) {
  const d = cents / 100;
  return d % 1 === 0 ? `$${d}` : `$${d.toFixed(2)}`;
}
const CAT_KEYS = Object.keys(CATEGORIES) as Category[];
const MEDAL = ["🥇", "🥈", "🥉"];

// ─── Shared styles ────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 18,
};
const inp: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 11,
  background: "#160F2A", border: "1px solid #2D1F50",
  color: "#EDE9FE", fontSize: ".9rem", outline: "none", boxSizing: "border-box",
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
function Sidebar({
  screen, setScreen, lang, myAdsCount, onSignOut, onGoCreate,
}: {
  screen: Screen; setScreen: (s: Screen) => void; lang: Lang;
  myAdsCount: number; onSignOut: () => void; onGoCreate: () => void;
}) {
  const t = T[lang];
  const NAV: { k: Screen; icon: string; label: string; badge?: number | string }[] = [
    { k: "all",     icon: "🏆", label: t.navAll },
    { k: "myads",  icon: "📋", label: t.navMyAds, badge: myAdsCount || undefined },
    { k: "cats",   icon: "🏷",  label: t.navCats },
    { k: "wallet", icon: "💳", label: t.navWallet },
    { k: "profile",icon: "👤", label: t.navProfile },
  ];
  const btnStyle = (on: boolean): React.CSSProperties => ({
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "10px 11px", borderRadius: 10, border: "none",
    fontSize: ".83rem", fontWeight: on ? 700 : 500, cursor: "pointer",
    background: on ? "rgba(124,58,237,.16)" : "transparent",
    color: on ? "#A855F7" : "#A78BFA",
  });
  return (
    <aside style={{ width: 236, flexShrink: 0, borderRight: "1px solid #2D1F50", background: "#0B0916", padding: "20px 12px 30px", display: "flex", flexDirection: "column", gap: 3, minHeight: "calc(100vh - 47px)" }}>
      <div style={{ fontSize: ".62rem", letterSpacing: ".13em", textTransform: "uppercase", color: "#4A3C6E", fontWeight: 700, padding: "0 10px 9px" }}>{t.sideMain}</div>
      {NAV.map((n) => (
        <button key={n.k} onClick={() => setScreen(n.k)} style={btnStyle(screen === n.k)}>
          <span style={{ width: 20, textAlign: "center", fontSize: ".85rem" }}>{n.icon}</span>
          <span style={{ flex: 1, textAlign: "left" }}>{n.label}</span>
          {n.badge ? (
            <span style={{ padding: "1px 8px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", color: "#6D5B8E", fontSize: ".68rem", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{n.badge}</span>
          ) : null}
        </button>
      ))}

      <div style={{ marginTop: 20, padding: 14, borderRadius: 13, background: "#160F2A", border: "1px solid #2D1F50" }}>
        <div style={{ fontSize: ".74rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 5 }}>
          {myAdsCount === 0 ? t.sideNoAdsTitle : t.sideOkTitle}
        </div>
        <div style={{ fontSize: ".75rem", color: "#6D5B8E", lineHeight: 1.55, marginBottom: 10 }}>
          {myAdsCount === 0 ? t.sideNoAdsBody : t.sideOkBody}
        </div>
        <button onClick={myAdsCount === 0 ? onGoCreate : () => setScreen("all")} style={{ width: "100%", padding: 9, borderRadius: 10, background: "rgba(124,58,237,.14)", border: "1px solid #7C3AED", color: "#A855F7", fontSize: ".77rem", fontWeight: 700, cursor: "pointer" }}>
          {myAdsCount === 0 ? t.sideCta : t.navAll}
        </button>
      </div>

      <button onClick={() => window.open("/how-it-works", "_blank")} style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 9, padding: 10, borderRadius: 10, background: "transparent", border: "none", color: "#6D5B8E", fontSize: ".78rem", fontWeight: 500, cursor: "pointer" }}>
        <span style={{ width: 20, textAlign: "center" }}>📖</span><span>{t.navGuide}</span>
      </button>
      <button onClick={onSignOut} style={{ display: "flex", alignItems: "center", gap: 9, padding: 10, borderRadius: 10, background: "transparent", border: "none", color: "#6D5B8E", fontSize: ".78rem", fontWeight: 500, cursor: "pointer" }}>
        <span style={{ width: 20, textAlign: "center" }}>🚪</span><span>{t.logout}</span>
      </button>
    </aside>
  );
}

function timeAgo(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Hozirgina";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  return `${Math.floor(diff / 86400)} kun oldin`;
}
function fmtN(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

// ─── All (Leaderboard) view ───────────────────────────────────────────────────
function AllView({ allAds, myUID, lang, onRaise }: { allAds: Ad[]; myUID: string | null; lang: Lang; onRaise: (id: string, bid: number) => void }) {
  const t = T[lang];
  const [catFilter, setCatFilter] = useState<Category | "any">("any");

  const active = allAds.filter((a) => a.status === "active");
  const scoped = (catFilter === "any" ? active : active.filter((a) => a.category === catFilter))
    .slice().sort((a, b) => b.dailyBidCents - a.dailyBidCents || (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));

  const topBid = scoped[0]?.dailyBidCents || 0;
  const podium = scoped.slice(0, 3);
  const rest = scoped.slice(3);

  const tierGroups = [
    { label: t.tierTop10, range: "#4 — #10", rows: rest.slice(0, 7), start: 4 },
    { label: t.tierTop20, range: "#11 — #20", rows: rest.slice(7, 17), start: 11 },
    { label: t.tierTop50, range: "#21 — #50", rows: rest.slice(17, 47), start: 21 },
    { label: t.tierRest,  range: "#51+",       rows: rest.slice(47),    start: 51 },
  ].filter((g) => g.rows.length > 0);

  const podiumCardStyle = (pos: number, isMine: boolean): React.CSSProperties => ({
    background: isMine ? "rgba(124,58,237,.12)" : "#1A1230",
    border: `1px solid ${isMine ? "#7C3AED" : pos === 0 ? "#F59E0B" : "#2D1F50"}`,
    borderRadius: 16, padding: 18,
  });
  const bidColor = (pos: number) => pos === 0 ? "#FCD34D" : pos === 1 ? "#EDE9FE" : "#A78BFA";
  const thumbColor = (i: string) => `hsl(${i.charCodeAt(0) * 37 % 360},55%,38%)`;

  const rowStyle = (isMine: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 12,
    padding: "13px 16px", borderRadius: 12,
    background: isMine ? "rgba(124,58,237,.09)" : "#1A1230",
    border: `1px solid ${isMine ? "#7C3AED" : "#2D1F50"}`,
  });

  return (
    <div style={{ animation: "fade .35s ease both", padding: "38px 0 0" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
            <span style={{ fontSize: ".7rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700 }}>{t.allLabel}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".68rem", fontWeight: 700, color: "#34D399", background: "rgba(16,185,129,.1)", border: "1px solid #10B981", borderRadius: 100, padding: "2px 9px" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", display: "inline-block" }}/>
              {t.liveAuction}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.1 }}>{t.allTitle}</h1>
          <p style={{ fontSize: ".87rem", color: "#6D5B8E", marginTop: 6, maxWidth: "52ch", lineHeight: 1.55 }}>{t.allSub}</p>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { k: t.reklama, v: String(active.length), color: "#EDE9FE" },
            { k: t.firstPos, v: topBid ? fmtBid(topBid) : "$—", color: "#FCD34D" },
            { k: t.minBid,  v: "$1.00", color: "#34D399" },
          ].map((x) => (
            <div key={x.k}>
              <div style={{ fontSize: ".65rem", letterSpacing: ".09em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 4 }}>{x.k}</div>
              <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.2rem", fontWeight: 700, color: x.color, lineHeight: 1 }}>{x.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 24 }}>
        {([{ k: "any" as const, label: t.catAll }] as { k: Category | "any"; label: string }[])
          .concat(CAT_KEYS.map((k) => ({ k, label: `${CATEGORIES[k].emoji} ${T[lang].catNames[k]}` })))
          .map((c) => (
            <button key={c.k} onClick={() => setCatFilter(c.k)} style={{
              padding: "6px 13px", borderRadius: 100, border: `1px solid ${catFilter === c.k ? "#7C3AED" : "#2D1F50"}`,
              background: catFilter === c.k ? "rgba(124,58,237,.16)" : "transparent",
              color: catFilter === c.k ? "#A855F7" : "#6D5B8E", fontSize: ".79rem", fontWeight: catFilter === c.k ? 700 : 500, cursor: "pointer",
            }}>{c.label}</button>
          ))}
      </div>

      {scoped.length === 0 && (
        <div style={{ padding: 44, textAlign: "center", borderRadius: 16, border: "1px dashed #2D1F50", background: "#160F2A", color: "#6D5B8E", fontSize: ".88rem" }}>
          Bu toifada hozircha reklama yo&apos;q.
        </div>
      )}

      {/* TOP 3 podium */}
      {podium.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 13 }}>
            <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".85rem", fontWeight: 700, letterSpacing: ".02em" }}>🏆 {t.tierTop3}</span>
            <span style={{ flex: 1, height: 1, background: "#2D1F50" }}/>
            <span style={{ fontSize: ".73rem", color: "#6D5B8E" }}>{t.tierTop3Note}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 20 }}>
            {podium.map((ad, i) => {
              const isMine = ad.advertiserUID === myUID;
              const cat = CATEGORIES[ad.category];
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
              const medal = ["🥇","🥈","🥉"][i];
              return (
                <div key={ad.id} style={{
                  background: "#1A1230",
                  border: `1px solid ${isMine ? "#7C3AED" : i === 0 ? "rgba(124,58,237,.4)" : "#2D1F50"}`,
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: i === 0 ? "0 0 24px rgba(124,58,237,.1)" : "none",
                  transition: "transform .2s, box-shadow .2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(0,0,0,.4)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = i === 0 ? "0 0 24px rgba(124,58,237,.1)" : "none";
                }}>
                  {/* Image 16:9 */}
                  <div style={{ position: "relative", aspectRatio: "16/9", background: "#160F2A", overflow: "hidden" }}>
                    {ad.imageURL ? (
                      <img src={ad.imageURL} alt={ad.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", opacity: .3 }}>📷</div>
                    )}
                    {/* Rank + bid badge */}
                    <div style={{ position: "absolute", top: 10, left: 10, background: "linear-gradient(135deg,#7C3AED,#F59E0B)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: "1rem" }}>{medal}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".72rem", fontWeight: 700, color: "#fff" }}>${(ad.dailyBidCents/100).toFixed(0)}/kun</span>
                    </div>
                    {/* Category */}
                    <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.65)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "3px 9px", fontSize: ".72rem", color: "rgba(255,255,255,.85)" }}>
                      {cat?.emoji} {cat?.label}
                    </div>
                    {/* Mine badge */}
                    {isMine && (
                      <div style={{ position: "absolute", bottom: 10, left: 10, padding: "3px 10px", borderRadius: 100, background: "rgba(124,58,237,.9)", border: "1px solid #A855F7", color: "#EDE9FE", fontSize: ".68rem", fontWeight: 700 }}>{t.yourAd}</div>
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ padding: 16 }}>
                    {/* Title & URL */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: ".95rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.title}</div>
                      <div style={{ fontSize: ".76rem", color: "#6D5B8E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.destinationURL}</div>
                    </div>
                    {/* Stats row — single line */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "nowrap", overflow: "hidden" }}>
                      {[
                        { icon: "🏆", val: `#${i+1}`, color: "#FCD34D" },
                        { icon: "👁", val: fmtN(ad.impressions||0), color: "#A78BFA" },
                        { icon: "🖱", val: fmtN(ad.clicks||0), color: "#34D399" },
                        { icon: "📊", val: `${ctr}%`, color: "#F59E0B" },
                      ].map((s) => (
                        <div key={s.icon} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 7, background: "#160F2A", border: "1px solid #2D1F50", flexShrink: 0 }}>
                          <span style={{ fontSize: ".66rem" }}>{s.icon}</span>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".68rem", fontWeight: 700, color: s.color }}>{s.val}</span>
                        </div>
                      ))}
                    </div>
                    {/* Time */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
                      <span style={{ fontSize: ".7rem", color: "#4B3B6E" }}>🕐</span>
                      <span style={{ fontSize: ".72rem", color: "#4B3B6E" }}>{timeAgo(ad.startsAt || ad.createdAt)}</span>
                    </div>
                    {/* Buttons */}
                    <a href={ad.destinationURL} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "10px 0", borderRadius: 11, background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", fontSize: ".84rem", fontWeight: 700, textDecoration: "none", marginBottom: 8 }}>
                      🔗 Saytga o&apos;tish
                    </a>
                    {isMine ? (
                      <Link href={`/ads/${ad.id}/bid`} style={{ display: "block", textAlign: "center", padding: "10px 0", borderRadius: 11, background: "rgba(124,58,237,.14)", border: "1px solid #7C3AED", color: "#A855F7", fontSize: ".82rem", fontWeight: 700, textDecoration: "none" }}>{t.raise}</Link>
                    ) : (
                      <Link href={`/create?cat=${ad.category}&minBid=${Math.ceil(ad.dailyBidCents/100)+1}`} style={{ display: "block", textAlign: "center", padding: "10px 0", borderRadius: 11, background: "transparent", border: "1px solid #2D1F50", color: "#6D5B8E", fontSize: ".82rem", fontWeight: 600, textDecoration: "none" }}>{t.outbid}</Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {tierGroups.map((g) => (
          <div key={g.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
              <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".82rem", fontWeight: 700, color: "#A78BFA" }}>{g.label}</span>
              <span style={{ flex: 1, height: 1, background: "#2D1F50" }}/>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".72rem", color: "#6D5B8E" }}>{g.range}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {g.rows.map((ad, i) => {
                const pos = g.start + i;
                const isMine = ad.advertiserUID === myUID;
                return (
                  <div key={ad.id} style={rowStyle(isMine)}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".78rem", fontWeight: 700, color: "#6D5B8E", width: 26, flexShrink: 0 }}>#{pos}</span>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: thumbColor(ad.title), display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(ad.title)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: ".87rem", fontWeight: 600, color: "#EDE9FE", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.title}</span>
                        {isMine && <span style={{ padding: "1px 7px", borderRadius: 100, background: "rgba(124,58,237,.2)", border: "1px solid #7C3AED", color: "#A855F7", fontSize: ".66rem", fontWeight: 700, flexShrink: 0 }}>{t.yourAd}</span>}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".71rem", color: "#6D5B8E" }}>{T[lang].catNames[ad.category]}</div>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".9rem", fontWeight: 600, color: "#FCD34D", flexShrink: 0 }}>{fmtBid(ad.dailyBidCents)}</span>
                    {isMine ? (
                      <Link href={`/ads/${ad.id}/bid`} style={{ padding: "7px 12px", borderRadius: 9, background: "rgba(124,58,237,.14)", border: "1px solid #7C3AED", color: "#A855F7", fontSize: ".77rem", fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>{t.raise}</Link>
                    ) : (
                      <Link href={`/create?cat=${ad.category}&minBid=${Math.ceil(ad.dailyBidCents / 100) + 1}`} style={{ padding: "7px 12px", borderRadius: 9, background: "transparent", border: "1px solid #2D1F50", color: "#6D5B8E", fontSize: ".77rem", fontWeight: 500, textDecoration: "none", flexShrink: 0 }}>{t.outbid}</Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── My Ads view ──────────────────────────────────────────────────────────────
function MyAdsView({ ads, loading, lang, onGoCreate }: { ads: Ad[]; loading: boolean; lang: Lang; onGoCreate: () => void }) {
  const t = T[lang];
  const active = ads.filter((a) => a.status === "active").length;
  const spent = ads.reduce((s, a) => s + (a.totalPaidCents || 0), 0);
  const imp = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const clicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);

  const statusColor: Record<string, string> = {
    active: "#34D399", pending: "#FCD34D", pending_verification: "#FCD34D",
    rejected: "#F87171", expired: "#6D5B8E",
  };
  const statusLabel: Record<string, string> = {
    active: "Faol", pending: "Kutmoqda", pending_verification: "Tekshiruvda",
    rejected: "Rad etildi", expired: "Muddati oʻtdi",
  };

  return (
    <div style={{ animation: "fade .35s ease both" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 9 }}>DASHBOARD</div>
          <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-.03em" }}>{t.myAdsTitle}</h1>
          <p style={{ fontSize: ".88rem", color: "#6D5B8E", marginTop: 5 }}>
            {ads.length === 0 ? t.myAdsSub : `${active} ${t.myAdsActive}`}
          </p>
        </div>
        <button onClick={onGoCreate} style={{ padding: "12px 19px", borderRadius: 11, border: "none", background: "#7C3AED", color: "#fff", fontSize: ".85rem", fontWeight: 700, cursor: "pointer" }}>+ {t.ctaCreate}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 11, marginBottom: 18 }}>
        {[
          { k: t.faol,      v: String(active),               color: active > 0 ? "#34D399" : "#EDE9FE", hint: "Jonli reklamalar" },
          { k: t.sarflangan,v: `$${(spent / 100).toFixed(0)}`, color: "#FCD34D", hint: "Jami toʻlov" },
          { k: t.korilish,  v: imp.toLocaleString(),          color: "#EDE9FE", hint: "Jami koʻrilish" },
          { k: t.bosish,    v: clicks.toLocaleString(),       color: "#EDE9FE", hint: "Jami klik" },
        ].map((k) => (
          <div key={k.k} style={{ padding: "15px 17px", borderRadius: 14, background: "#1A1230", border: "1px solid #2D1F50" }}>
            <div style={{ fontSize: ".67rem", letterSpacing: ".09em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 7 }}>{k.k}</div>
            <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.45rem", fontWeight: 700, lineHeight: 1, color: k.color }}>{k.v}</div>
            <div style={{ fontSize: ".74rem", color: "#6D5B8E", marginTop: 6 }}>{k.hint}</div>
          </div>
        ))}
      </div>

      {loading && <div style={{ color: "#6D5B8E", fontSize: ".88rem" }}>Yuklanmoqda...</div>}

      {!loading && ads.length === 0 && (
        <div style={{ padding: "46px 32px", textAlign: "center", borderRadius: 18, border: "1px dashed #2D1F50", background: "#160F2A" }}>
          <div style={{ display: "inline-block", padding: "3px 11px", borderRadius: 100, background: "rgba(124,58,237,.14)", border: "1px solid #7C3AED", color: "#A855F7", fontSize: ".68rem", fontWeight: 700, marginBottom: 14 }}>{t.newAccountBadge}</div>
          <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.15rem", fontWeight: 700, marginBottom: 8 }}>{t.emptyAdsTitle}</div>
          <div style={{ fontSize: ".86rem", color: "#A78BFA", lineHeight: 1.7, maxWidth: "46ch", margin: "0 auto 20px" }}>{t.emptyAdsBody}</div>
          <button onClick={onGoCreate} style={{ padding: "12px 20px", borderRadius: 11, border: "none", background: "#7C3AED", color: "#fff", fontSize: ".85rem", fontWeight: 700, cursor: "pointer" }}>{t.emptyAdsCta1}</button>
        </div>
      )}

      {!loading && ads.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ads.map((ad) => (
            <div key={ad.id} style={{ ...card, borderRadius: 16, padding: "18px 20px", borderLeft: `3px solid ${statusColor[ad.status] || "#2D1F50"}` }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 5 }}>
                    <span style={{ fontSize: ".98rem", fontWeight: 700, color: "#EDE9FE" }}>{ad.title}</span>
                    <span style={{ padding: "2px 9px", borderRadius: 100, background: `${statusColor[ad.status]}18`, border: `1px solid ${statusColor[ad.status]}`, color: statusColor[ad.status], fontSize: ".68rem", fontWeight: 700 }}>
                      {statusLabel[ad.status] || ad.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".77rem", color: "#6D5B8E" }}>
                    {CATEGORIES[ad.category]?.emoji} {T[lang].catNames[ad.category]} · {fmtBid(ad.dailyBidCents)}/kun · {ad.durationDays} kun
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  {ad.status === "active" && (
                    <Link href={`/ads/${ad.id}/bid`} style={{ padding: "8px 14px", borderRadius: 9, background: "rgba(124,58,237,.14)", border: "1px solid #7C3AED", color: "#A855F7", fontSize: ".79rem", fontWeight: 700, textDecoration: "none" }}>Taklifni oshirish</Link>
                  )}
                  {(ad.status === "pending" || ad.status === "pending_verification") && (
                    <Link href={`/ads/${ad.id}/pending`} style={{ padding: "8px 14px", borderRadius: 9, background: "rgba(245,158,11,.1)", border: "1px solid #F59E0B", color: "#FCD34D", fontSize: ".79rem", fontWeight: 700, textDecoration: "none" }}>Ko&apos;rish</Link>
                  )}
                  {ad.status === "pending" && (
                    <Link href={`/ads/${ad.id}/pay`} style={{ padding: "8px 14px", borderRadius: 9, background: "#F59E0B", border: "none", color: "#1A1230", fontSize: ".79rem", fontWeight: 700, textDecoration: "none" }}>To&apos;lash</Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Categories view ──────────────────────────────────────────────────────────
function CatsView({ allAds, lang, onSelectCat }: { allAds: Ad[]; lang: Lang; onSelectCat: (cat: Category) => void }) {
  const t = T[lang];
  return (
    <div style={{ animation: "fade .35s ease both", padding: "44px 0 0" }}>
      <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>{t.catLabel}</div>
      <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "2.1rem", fontWeight: 700, letterSpacing: "-.03em", marginBottom: 12 }}>{t.catsTitle}</h1>
      <p style={{ fontSize: ".96rem", color: "#A78BFA", maxWidth: "60ch", lineHeight: 1.75, marginBottom: 26 }}>{t.catsSub}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
        {CAT_KEYS.map((k) => {
          const catAds = allAds.filter((a) => a.status === "active" && a.category === k);
          const topBid = catAds.length ? Math.max(...catAds.map((a) => a.dailyBidCents)) : 0;
          return (
            <button key={k} onClick={() => onSelectCat(k)} style={{ textAlign: "left", background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 16, padding: 20, color: "#EDE9FE", display: "flex", gap: 16, alignItems: "flex-start", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#7C3AED")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#2D1F50")}
            >
              <span style={{ width: 44, height: 44, borderRadius: 13, background: "#160F2A", border: "1px solid #2D1F50", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>{CATEGORIES[k].emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: ".98rem", fontWeight: 700, marginBottom: 3 }}>{t.catNames[k]}</div>
                <div style={{ fontSize: ".8rem", color: "#6D5B8E", marginBottom: 13, lineHeight: 1.5 }}>{CATEGORIES[k].description}</div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {[
                    { k: t.firstPlace, v: topBid ? fmtBid(topBid) : "$—", color: "#FCD34D" },
                    { k: t.minEntry,   v: "$1.00",                         color: "#34D399" },
                    { k: t.adsWord,    v: String(catAds.length),            color: "#EDE9FE" },
                  ].map((x) => (
                    <div key={x.k}>
                      <div style={{ fontSize: ".68rem", letterSpacing: ".08em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700 }}>{x.k}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".94rem", fontWeight: 600, color: x.color }}>{x.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Wallet view ──────────────────────────────────────────────────────────────
function WalletView({ lang, myAds, userProfile, uid }: {
  lang: Lang; myAds: Ad[]; userProfile: any; uid: string;
}) {
  const t = T[lang];
  const router = useRouter();
  const [txs, setTxs] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "transactions"), where("uid", "==", uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setTxs(list);
      setTxLoading(false);
    });
  }, [uid]);

  const totalSpentCents = userProfile?.totalSpentCents || 0;
  const activeAds = myAds.filter((a) => a.status === "active").length;
  const totalImpr = myAds.reduce((s, a) => s + (a.impressions || 0), 0);
  const pendingAds = myAds.filter((a) => a.status === "pending");

  const KPIS = [
    { k: (t as any).kpiSpent,  v: `$${(totalSpentCents / 100).toFixed(2)}`, color: "#FCD34D", hint: (t as any).kpiSpentHint },
    { k: (t as any).kpiActive, v: String(activeAds),                         color: "#34D399", hint: (t as any).kpiActiveHint },
    { k: (t as any).kpiImpr,   v: totalImpr >= 1000 ? `${(totalImpr/1000).toFixed(1)}K` : String(totalImpr), color: "#A855F7", hint: (t as any).kpiImprHint },
  ];

  const fmtDate = (ts: any) => {
    if (!ts?.toDate) return "-";
    const d = ts.toDate();
    return `${d.getDate().toString().padStart(2,"0")}.${(d.getMonth()+1).toString().padStart(2,"0")}.${d.getFullYear()}`;
  };

  const txIcon = (type: string) => type === "purchase" ? "💰" : type === "refund" ? "↩" : "❓";
  const txColor = (type: string) => type === "refund" ? "#34D399" : "#F87171";
  const txSign  = (type: string) => type === "refund" ? "+" : "-";

  return (
    <div style={{ animation: "fade .35s ease both", padding: "44px 0 0" }}>
      <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>{t.walletLabel}</div>
      <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "2.1rem", fontWeight: 700, letterSpacing: "-.03em", marginBottom: 10 }}>{t.walletTitle}</h1>
      <p style={{ fontSize: ".96rem", color: "#A78BFA", maxWidth: "58ch", lineHeight: 1.75, marginBottom: 26 }}>{t.walletSub}</p>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 330px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 11 }}>
            {KPIS.map((k) => (
              <div key={k.k} style={{ padding: "17px 18px", borderRadius: 15, background: "#1A1230", border: "1px solid #2D1F50" }}>
                <div style={{ fontSize: ".68rem", letterSpacing: ".09em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 8 }}>{k.k}</div>
                <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.5rem", fontWeight: 700, lineHeight: 1, color: k.color }}>{k.v}</div>
                <div style={{ fontSize: ".74rem", color: "#6D5B8E", marginTop: 6 }}>{k.hint}</div>
              </div>
            ))}
          </div>

          {pendingAds.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "18px 20px", borderRadius: 16, background: "rgba(245,158,11,.1)", border: "1px solid #F59E0B" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: ".93rem", fontWeight: 700, color: "#FCD34D", marginBottom: 4 }}>{(t as any).dueTitle}</div>
                <div style={{ fontSize: ".83rem", color: "#A78BFA", lineHeight: 1.55 }}>
                  {pendingAds.length} {lang === "uz" ? "ta reklama AI tomonidan tasdiqlangan, toʻlov kutmoqda" : "ad(s) approved by AI, awaiting payment"}
                </div>
              </div>
              <button onClick={() => router.push(`/ads/${pendingAds[0].id}/pay`)} style={{ padding: "12px 19px", borderRadius: 11, border: "none", background: "#F59E0B", color: "#1A1230", fontSize: ".85rem", fontWeight: 700, cursor: "pointer" }}>{(t as any).payNow}</button>
            </div>
          )}

          <div style={{ background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 18, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #2D1F50", fontFamily: "'Unbounded',sans-serif", fontSize: "1rem", fontWeight: 700 }}>{(t as any).txTitle}</div>
            {txLoading ? (
              <div style={{ padding: "26px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[1,2,3].map((i) => <div key={i} style={{ height: 48, borderRadius: 10, background: "#160F2A" }} />)}
              </div>
            ) : txs.length === 0 ? (
              <div style={{ padding: "26px 20px", fontSize: ".83rem", color: "#6D5B8E", lineHeight: 1.6 }}>{(t as any).txEmpty}</div>
            ) : (
              txs.map((x: any) => (
                <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 20px", borderBottom: "1px solid #2D1F50" }}>
                  <span style={{ width: 32, height: 32, borderRadius: 10, background: "#160F2A", border: "1px solid #2D1F50", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".85rem" }}>{txIcon(x.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".85rem", fontWeight: 600, color: "#EDE9FE" }}>
                      {x.type === "refund" ? (lang === "uz" ? "Qaytarish" : "Refund") : (lang === "uz" ? "Toʻlov" : "Payment")}
                    </div>
                    <div style={{ fontSize: ".73rem", color: "#6D5B8E", fontFamily: "'JetBrains Mono',monospace" }}>{fmtDate(x.createdAt)} · {x.paymentMethod || "card"}</div>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: txColor(x.type), fontSize: ".9rem" }}>
                    {txSign(x.type)}${((x.amountCents || 0) / 100).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 12 }}>{(t as any).payMethod}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(t as any).payOpts.map((p: any) => (
                <div key={p.label} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                  <span style={{ width: 24, textAlign: "center", fontSize: ".9rem" }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: ".82rem", fontWeight: 600, color: "#EDE9FE" }}>{p.label}</div>
                    <div style={{ fontSize: ".75rem", color: "#6D5B8E", lineHeight: 1.5 }}>{p.hint}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: ".75rem", color: "#6D5B8E", lineHeight: 1.6 }}>{(t as any).topUpNote}</div>
          </div>

          <div style={{ background: "#160F2A", border: "1px solid #2D1F50", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 13 }}>{(t as any).warnTitle}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {(t as any).warnRows.map((w: any) => (
                <div key={w.title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 7, flexShrink: 0, background: w.color }}/>
                  <div>
                    <div style={{ fontSize: ".82rem", fontWeight: 600, color: "#EDE9FE" }}>{w.title}</div>
                    <div style={{ fontSize: ".77rem", color: "#6D5B8E", lineHeight: 1.5 }}>{w.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#160F2A", border: "1px solid #2D1F50", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 13 }}>{(t as any).refundTitle}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {(t as any).refundRows.map((r: any) => (
                <div key={r.k} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: ".79rem", lineHeight: 1.5 }}>
                  <span style={{ color: "#A78BFA" }}>{r.k}</span>
                  <span style={{ color: r.color, fontWeight: 600, textAlign: "right", flexShrink: 0 }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{ position: "relative", width: 42, height: 24, borderRadius: 100, background: on ? "#7C3AED" : "#160F2A", border: on ? "none" : "1px solid #2D1F50", cursor: "pointer", flexShrink: 0, transition: "all .2s" }}>
      <span style={{ position: "absolute", top: on ? 4 : 3, left: on ? undefined : 4, right: on ? 4 : undefined, width: 16, height: 16, borderRadius: "50%", background: "#fff", display: "block", transition: "all .2s" }} />
    </button>
  );
}

// ─── Profile view ─────────────────────────────────────────────────────────────
const NOTIF_PREFS = [
  { id: "approved", label: "Reklama tasdiqlandi",    hint: "Moderatsiya natijasi emailga keladi" },
  { id: "rejected", label: "Reklama rad etildi",     hint: "Sabab va qayta yuborish imkoniyati" },
  { id: "expiry",   label: "Kun tugashi",             hint: "3 kun va 1 kun qolganida eslatma" },
  { id: "outbid",   label: "Raqib oshirdi",           hint: "Kimdir sizni oʻtib ketganda ogohlantirilasiz" },
];
const FORM_RULES = [
  "Reklama narxi oshganda siz ogohlantirilasiz — reklama oʻz-oʻzidan toʻlanmaydi.",
  "Toʻlov faqat moderatsiya oʻtganidan keyin soʻraladi.",
  "Davr tugagach reklama avtomatik toʻxtatiladi va reytingdan chiqariladi.",
];

function ProfileView({ ads, lang, onSignOut }: { ads: Ad[]; lang: Lang; onSignOut: () => void }) {
  const { firebaseUser, userProfile, refreshProfile } = useAuth();
  const [brandName, setBrandName] = useState(userProfile?.displayName || "");
  const [email, setEmail]         = useState(userProfile?.email || firebaseUser?.email || "");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [notifs, setNotifs]       = useState({ approved: true, rejected: true, expiry: true, outbid: true });
  const t = T[lang];

  const handleSave = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", firebaseUser.uid), { displayName: brandName.trim(), email: email.trim() }, { merge: true });
      await refreshProfile();
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  const brand     = userProfile?.displayName || firebaseUser?.displayName || "?";
  const initial   = initials(brand);
  const photoURL  = firebaseUser?.photoURL;
  const googleEmail = firebaseUser?.email || "—";
  const spent = ads.reduce((s, a) => s + (a.totalPaidCents || 0), 0);
  const active = ads.filter((a) => a.status === "active").length;
  const STATS = [
    { k: "Jami reklamalar",  v: String(ads.length),                        color: "#EDE9FE" },
    { k: "Faol reklamalar",  v: String(active),                            color: "#34D399" },
    { k: "Jami sarflangan",  v: `$${(spent / 100).toFixed(2)}`,            color: "#FCD34D" },
    { k: "Koʻrilish",        v: ads.reduce((s, a) => s + (a.impressions || 0), 0).toLocaleString(), color: "#EDE9FE" },
    { k: "Bosish",           v: ads.reduce((s, a) => s + (a.clicks || 0), 0).toLocaleString(),      color: "#EDE9FE" },
  ];

  return (
    <div style={{ animation: "fade .35s ease both" }}>
      <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 9 }}>AKKAUNT</div>
      <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-.03em", marginBottom: 20, color: "#EDE9FE" }}>{t.profileTitle}</h1>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: 16, alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...card, padding: 22, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            {photoURL ? (
              <Image src={photoURL} alt={brand} width={58} height={58} style={{ borderRadius: 17, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <span style={{ width: 58, height: 58, borderRadius: 17, background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Unbounded',sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initial}</span>
            )}
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-.02em", marginBottom: 4, color: "#EDE9FE" }}>{brand}</div>
              <div style={{ fontSize: ".83rem", color: "#6D5B8E", fontFamily: "'JetBrains Mono',monospace" }}>Google · {googleEmail}</div>
            </div>
            <span style={{ padding: "3px 11px", borderRadius: 100, background: "rgba(16,185,129,.12)", border: "1px solid #10B981", color: "#34D399", fontSize: ".68rem", fontWeight: 700 }}>✅ {t.verified}</span>
          </div>

          <div style={{ ...card, padding: 22 }}>
            <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: 16, color: "#EDE9FE" }}>Akkaunt ma&apos;lumotlari</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: ".77rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 7 }}>Brend nomi</label>
                <input value={brandName} onChange={(e) => setBrandName(e.target.value)} style={inp} placeholder="Brend nomingiz" />
                <div style={{ fontSize: ".75rem", color: "#6D5B8E", marginTop: 6, lineHeight: 1.55 }}>Reklamada ko&apos;rinadigan nom. Istalgan vaqt o&apos;zgartirish mumkin.</div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: ".77rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 7 }}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={{ ...inp, fontFamily: "'JetBrains Mono',monospace" }} placeholder="siz@misol.uz" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: ".77rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 7 }}>Google akkaunt</label>
                <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", borderRadius: 11, background: "#160F2A", border: "1px solid #2D1F50" }}>
                  <span style={{ flex: 1, fontFamily: "'JetBrains Mono',monospace", fontSize: ".88rem", color: "#A78BFA" }}>{googleEmail}</span>
                  <span style={{ fontSize: ".72rem", color: "#34D399", fontWeight: 700 }}>✅ {t.verified}</span>
                </div>
                <div style={{ fontSize: ".75rem", color: "#6D5B8E", marginTop: 6, lineHeight: 1.55 }}>Google orqali tasdiqlangan. O&apos;zgartirib bo&apos;lmaydi.</div>
              </div>
              <button onClick={handleSave} disabled={saving} style={{ alignSelf: "flex-start", padding: "11px 19px", borderRadius: 11, border: "none", background: saved ? "#10B981" : saving ? "#4C1D95" : "#7C3AED", color: "#fff", fontSize: ".84rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                {saved ? t.saved : saving ? t.saving : t.save}
              </button>
            </div>
          </div>

          <div style={{ ...card, padding: 22 }}>
            <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: 6, color: "#EDE9FE" }}>{t.notifTitle}</div>
            <div style={{ fontSize: ".82rem", color: "#6D5B8E", lineHeight: 1.6, marginBottom: 14 }}>{t.notifSub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {NOTIF_PREFS.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderTop: "1px solid #2D1F50" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: ".85rem", fontWeight: 600, color: "#EDE9FE" }}>{p.label}</div>
                    <div style={{ fontSize: ".76rem", color: "#6D5B8E", lineHeight: 1.5 }}>{p.hint}</div>
                  </div>
                  <Toggle on={notifs[p.id as keyof typeof notifs]} onToggle={() => setNotifs((n) => ({ ...n, [p.id]: !n[p.id as keyof typeof n] }))} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...card, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 13 }}>{t.statsTitle}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: ".84rem" }}>
              {STATS.map((x) => (
                <div key={x.k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#A78BFA" }}>{x.k}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: x.color }}>{x.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#160F2A", border: "1px solid #2D1F50", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 12 }}>{t.rulesTitle}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {FORM_RULES.map((r) => (
                <div key={r} style={{ display: "flex", gap: 9, fontSize: ".79rem", color: "#A78BFA", lineHeight: 1.55 }}>
                  <span style={{ color: "#6D5B8E" }}>·</span><span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(248,113,113,.06)", border: "1px solid #2D1F50", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: ".84rem", fontWeight: 700, marginBottom: 6, color: "#EDE9FE" }}>{t.dangerTitle}</div>
            <div style={{ fontSize: ".78rem", color: "#6D5B8E", lineHeight: 1.6, marginBottom: 13 }}>{t.dangerBody}</div>
            <button onClick={onSignOut} style={{ width: "100%", padding: 11, borderRadius: 11, background: "transparent", border: "1px solid #F87171", color: "#F87171", fontSize: ".81rem", fontWeight: 700, cursor: "pointer" }}>🚪 {t.logout}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { firebaseUser, userProfile, loading, signOut } = useAuth();
  const [screen, setScreen] = useState<Screen>("all");
  const [lang, setLang]     = useState<Lang>("uz");
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [myAds, setMyAds]   = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/auth");
  }, [loading, firebaseUser, router]);

  // All active ads (leaderboard)
  useEffect(() => {
    const q = query(collection(db, "ads"), where("status", "==", "active"));
    return onSnapshot(q, (snap) => {
      setAllAds(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ad)));
    });
  }, []);

  // User's own ads
  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(collection(db, "ads"), where("advertiserUID", "==", firebaseUser.uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ad));
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setMyAds(list);
      setAdsLoading(false);
    });
  }, [firebaseUser]);

  const handleSignOut = useCallback(() => { signOut(); router.push("/"); }, [signOut, router]);
  const handleGoCreate = useCallback(() => router.push("/create"), [router]);

  if (loading || !firebaseUser) return <div style={{ minHeight: "100vh", background: "#0E0B1A" }} />;

  const brand   = userProfile?.displayName || firebaseUser.displayName || "?";
  const initial = initials(brand);
  const spent   = userProfile?.totalSpentCents || 0;

  return (
    <>
      <style>{`
        @keyframes fade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes livedot { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
      <div style={{ minHeight: "100vh", background: "#0E0B1A", color: "#EDE9FE" }}>
        <AppHeader
          lang={lang} setLang={setLang}
          totalSpentCents={spent}
          brandName={brand} brandInitial={initial}
          onGoCreate={handleGoCreate}
          onGoProfile={() => setScreen("profile")}
          onGoWallet={() => setScreen("wallet")}
        />
        <div style={{ display: "flex", alignItems: "stretch" }}>
          <Sidebar
            screen={screen} setScreen={setScreen} lang={lang}
            myAdsCount={myAds.length}
            onSignOut={handleSignOut} onGoCreate={handleGoCreate}
          />
          <main style={{ flex: 1, padding: "0 32px 60px", minWidth: 0 }}>
            {screen === "all"     && <AllView allAds={allAds} myUID={firebaseUser.uid} lang={lang} onRaise={() => {}} />}
            {screen === "myads"  && <MyAdsView ads={myAds} loading={adsLoading} lang={lang} onGoCreate={handleGoCreate} />}
            {screen === "cats"   && <CatsView allAds={allAds} lang={lang} onSelectCat={() => { setScreen("all"); }} />}
            {screen === "wallet" && <WalletView lang={lang} myAds={myAds} userProfile={userProfile} uid={firebaseUser.uid} />}
            {screen === "profile"&& <ProfileView ads={myAds} lang={lang} onSignOut={handleSignOut} />}
          </main>
        </div>
      </div>
    </>
  );
}
