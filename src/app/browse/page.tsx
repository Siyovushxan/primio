"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ad, Category, CATEGORIES } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { Translations } from "@/lib/i18n";
import Link from "next/link";
import { Eye, MousePointerClick, ExternalLink, Clock, Trophy } from "lucide-react";

const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

const MEDAL = ["🥇", "🥈", "🥉"];

function timeAgo(ts: any, t: Translations): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return t.browseJustNow;
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t.browseMinAgo}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t.browseHoursAgo}`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ${t.browseDaysAgo}`;
  return date.toLocaleDateString();
}

function formatPlacedAt(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const MONTHS = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];
  const d = date.getDate();
  const m = MONTHS[date.getMonth()];
  const y = date.getFullYear();
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `${d} ${m} ${y}, ${h}:${min}`;
}

function isFresh(ad: Ad): boolean {
  if (!ad.expiresAt) return false;
  return (ad.expiresAt as any).toMillis() > Date.now();
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function trackClick(adId: string) {
  fetch(`/api/ads/${adId}/click`, { method: "POST" }).catch(() => {});
}

function AdCard({ ad, position, t }: { ad: Ad; position: number; t: Translations; }) {
  const fresh = isFresh(ad);
  const cat = CATEGORIES[ad.category];
  const medal = MEDAL[position - 1];
  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
  const isTop3 = position <= 3;

  return (
    <div style={{
      background: `linear-gradient(160deg, rgba(45,31,80,.7) 0%, rgba(14,11,26,.97) 100%)`,
      border: `1px solid ${isTop3 ? "rgba(124,58,237,.4)" : "rgba(45,31,80,.6)"}`,
      borderRadius: 20,
      overflow: "hidden",
      transition: "transform .2s, border-color .2s, box-shadow .2s",
      boxShadow: isTop3 ? "0 0 30px rgba(124,58,237,.15), 0 4px 20px rgba(0,0,0,.3)" : "0 4px 16px rgba(0,0,0,.2)",
      cursor: "default",
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.transform = "translateY(-5px) scale(1.01)";
      (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 50px rgba(124,58,237,.2), 0 0 0 1px rgba(124,58,237,.3)";
      (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,.55)";
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.transform = "";
      (e.currentTarget as HTMLElement).style.boxShadow = isTop3 ? "0 0 30px rgba(124,58,237,.15), 0 4px 20px rgba(0,0,0,.3)" : "0 4px 16px rgba(0,0,0,.2)";
      (e.currentTarget as HTMLElement).style.borderColor = isTop3 ? "rgba(124,58,237,.4)" : "rgba(45,31,80,.6)";
    }}>
      {/* Image */}
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#160F2A", overflow: "hidden" }}>
        {ad.imageURL ? (
          <img src={ad.imageURL} alt={ad.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", opacity: .3 }}>📷</div>
        )}

        {/* Rank badge */}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ background: isTop3 ? "linear-gradient(135deg,#7C3AED,#F59E0B)" : "rgba(0,0,0,.7)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: medal ? "1rem" : ".75rem" }}>{medal || `#${position}`}</span>
            {!medal && null}
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".72rem", fontWeight: 700, color: "#fff" }}>{`$${(ad.dailyBidCents / 100).toFixed(0)}/${t.day}`}</span>
          </div>
        </div>

        {/* Category */}
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.65)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "3px 9px", fontSize: ".72rem", color: "rgba(255,255,255,.85)" }}>
          {cat?.emoji} {cat?.label}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* Title */}
        <div style={{ marginBottom: 8 }}>
          <h3 style={{ fontSize: ".95rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ad.title}
          </h3>
          <div style={{ fontSize: ".76rem", color: "#6D5B8E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ad.destinationURL}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          {/* Rank */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "#160F2A", border: "1px solid #2D1F50" }}>
            <Trophy size={12} color="#F59E0B" />
            <span style={{ fontSize: ".72rem", fontWeight: 700, color: "#FCD34D", fontFamily: "'JetBrains Mono',monospace" }}>#{position}</span>
          </div>

          {/* Views */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "#160F2A", border: "1px solid #2D1F50" }}>
            <Eye size={12} color="#A78BFA" />
            <span style={{ fontSize: ".72rem", color: "#A78BFA", fontFamily: "'JetBrains Mono',monospace" }}>{fmt(ad.impressions)}</span>
          </div>

          {/* Clicks */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "#160F2A", border: "1px solid #2D1F50" }}>
            <MousePointerClick size={12} color="#34D399" />
            <span style={{ fontSize: ".72rem", color: "#34D399", fontFamily: "'JetBrains Mono',monospace" }}>{fmt(ad.clicks)}</span>
          </div>

          {/* CTR */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: "#160F2A", border: "1px solid #2D1F50" }}>
            <span style={{ fontSize: ".66rem", color: "#6D5B8E" }}>CTR</span>
            <span style={{ fontSize: ".72rem", fontWeight: 700, color: "#FCD34D", fontFamily: "'JetBrains Mono',monospace" }}>{ctr}%</span>
          </div>
        </div>

        {/* Date + fresh/expired status */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={11} color="#4B3B6E" />
            <span style={{ fontSize: ".72rem", color: "#4B3B6E" }}>
              {formatPlacedAt(ad.startsAt || ad.createdAt)}
            </span>
          </div>
          <span style={{
            padding: "2px 7px", borderRadius: 100, fontSize: ".64rem", fontWeight: 700,
            background: fresh ? "rgba(52,211,153,.1)" : "rgba(107,114,128,.1)",
            border: `1px solid ${fresh ? "rgba(52,211,153,.3)" : "rgba(107,114,128,.25)"}`,
            color: fresh ? "#34D399" : "#6D5B8E",
          }}>
            {fresh ? "● Active" : "○ Expired"}
          </span>
        </div>

        {/* CTA */}
        <a
          href={ad.destinationURL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick(ad.id)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "10px 0", borderRadius: 11, background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", fontSize: ".84rem", fontWeight: 700, textDecoration: "none", transition: "opacity .15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".85"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
        >
          <ExternalLink size={14} />
          {t.browseVisitSite}
        </a>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<Category | null>(null);
  const { loading: authLoading } = useAuth();
  const { t } = useLang();

  useEffect(() => {
    if (authLoading) return; // wait for auth to resolve
    setLoading(true);
    const constraints: any[] = [where("status", "==", "active")];
    if (activeCat) constraints.push(where("category", "==", activeCat));
    const q = query(collection(db, "ads"), ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ad));
      const now = Date.now();
      list.sort((a, b) => {
        // 1. Higher daily bid wins
        const bidDiff = b.dailyBidCents - a.dailyBidCents;
        if (bidDiff !== 0) return bidDiff;

        // 2. Equal bids: FRESH (within paid period) beats EXPIRED-HOLDING
        const aFresh = a.expiresAt ? (a.expiresAt as any).toMillis() > now : false;
        const bFresh = b.expiresAt ? (b.expiresAt as any).toMillis() > now : false;
        if (aFresh !== bFresh) return aFresh ? -1 : 1;

        // 3. Both same state: older placement wins (seniority)
        const aStart = (a.startsAt as any)?.toMillis?.() ?? (a.createdAt as any)?.toMillis?.() ?? 0;
        const bStart = (b.startsAt as any)?.toMillis?.() ?? (b.createdAt as any)?.toMillis?.() ?? 0;
        return aStart - bStart; // older (smaller ms) = higher position
      });
      setAds(list);
      setLoading(false);
    }, (err) => {
      console.error("Browse Firestore error:", err.message);
      setLoading(false);
    });
    return unsub;
  }, [activeCat, authLoading]);

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "#0A0715", color: "#EDE9FE", fontFamily: "system-ui,sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}*{box-sizing:border-box}.browse-stat-card:hover{border-color:rgba(124,58,237,.4)!important;transform:translateY(-2px);}`}</style>

      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, right: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.09) 0%, transparent 70%)", animation: "orb-drift 22s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "20%", left: "0", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,.06) 0%, transparent 70%)", animation: "orb-drift2 28s ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,58,237,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,.025) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="browse-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 24, animation: "fade .3s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "clamp(1.35rem, 5vw, 2rem)", fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.15 }}>
              {activeCat ? `${CATEGORIES[activeCat].emoji} ${CATEGORIES[activeCat].label}` : t.browseAllAds}
            </h1>
            {!loading && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".75rem", color: "#22C55E", fontFamily: "'JetBrains Mono',monospace", background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 100, padding: "4px 12px", whiteSpace: "nowrap", animation: "badge-pulse 3s ease-in-out infinite" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 6px #22C55E", display: "inline-block", animation: "livedot 2s ease-in-out infinite" }} />
                {ads.length} {t.browseLive}
              </span>
            )}
          </div>
          <p style={{ fontSize: ".86rem", color: "#6D5B8E", lineHeight: 1.55 }}>{t.browseSub}</p>
        </div>

        {/* Category filters */}
        <div style={{ marginBottom: 28 }}>
          <div className="cats-list" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              onClick={() => setActiveCat(null)}
              style={{ padding: "8px 18px", borderRadius: 100, border: `1px solid ${!activeCat ? "#7C3AED" : "#2D1F50"}`, background: !activeCat ? "#7C3AED" : "#160F2A", color: !activeCat ? "#fff" : "#6D5B8E", fontSize: ".82rem", fontWeight: 700, cursor: "pointer" }}
            >
              {t.browseAll}
            </button>
            {CATEGORY_KEYS.map((cat) => {
              const active = activeCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 100, border: `1px solid ${active ? "#7C3AED" : "#2D1F50"}`, background: active ? "#7C3AED" : "#160F2A", color: active ? "#fff" : "#6D5B8E", fontSize: ".82rem", fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
                >
                  <span>{CATEGORIES[cat].emoji}</span>
                  <span>{CATEGORIES[cat].label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats bar */}
        {!loading && ads.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 24, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", paddingBottom: 2 }}>
            <style>{`.stats-scroll::-webkit-scrollbar{display:none}`}</style>
            {[
              { label: t.browseStats[0], value: ads.length, color: "#34D399" },
              { label: t.browseStats[1], value: ads.reduce((s, a) => s + (a.impressions || 0), 0), color: "#A78BFA" },
              { label: t.browseStats[2], value: ads.reduce((s, a) => s + (a.clicks || 0), 0), color: "#FCD34D" },
              { label: t.browseStats[3], value: (() => {
                const totalImp = ads.reduce((s, a) => s + (a.impressions || 0), 0);
                const totalClk = ads.reduce((s, a) => s + (a.clicks || 0), 0);
                return totalImp > 0 ? `${((totalClk / totalImp) * 100).toFixed(1)}%` : "0.0%";
              })(), color: "#F59E0B" },
            ].map((stat) => (
              <div key={stat.label} className="browse-stat-card" style={{ flexShrink: 0, minWidth: 130, background: "linear-gradient(135deg, rgba(45,31,80,.6) 0%, rgba(22,15,42,.9) 100%)", border: "1px solid rgba(45,31,80,.8)", borderRadius: 14, padding: "14px 18px", transition: "all .2s ease" }}>
                <div style={{ fontSize: ".6rem", letterSpacing: ".12em", textTransform: "uppercase", color: "#4A3C6E", fontWeight: 700, marginBottom: 7, whiteSpace: "nowrap" }}>{stat.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.2rem", fontWeight: 700, color: stat.color }}>
                  {typeof stat.value === "number" ? fmt(stat.value) : stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "linear-gradient(90deg,#1A1230 25%,#251840 50%,#1A1230 75%)", backgroundSize: "200% 100%", borderRadius: 20, height: 320, animation: `shimmer 1.6s ease infinite ${i * .1}s` }} />
            ))}
          </div>
        ) : ads.length === 0 ? (
          <div style={{ background: "linear-gradient(135deg, rgba(45,31,80,.5) 0%, rgba(22,15,42,.8) 100%)", border: "1px solid rgba(124,58,237,.2)", borderRadius: 24, padding: "64px 32px", textAlign: "center" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>
              {activeCat ? CATEGORIES[activeCat].emoji : "📢"}
            </div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 8 }}>{t.browseEmpty}</h2>
            <p style={{ color: "#6D5B8E", marginBottom: 24, fontSize: ".9rem" }}>{t.browseEmptySub}</p>
            <Link
              href={activeCat ? `/create?category=${activeCat}` : "/create"}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "#7C3AED", color: "#fff", fontWeight: 700, fontSize: ".9rem", textDecoration: "none" }}
            >
              {t.browsePlaceAd}
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 20 }}>
            {ads.map((ad, i) => (
              <div key={ad.id} style={{ animation: `fade .35s ease ${i * .05}s both` }}>
                <AdCard ad={ad} position={i + 1} t={t} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
