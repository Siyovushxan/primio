"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { LANGS } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const { firebaseUser, userProfile, signOut, loading } = useAuth();
  const { lang, setLang, t } = useLang();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  if (pathname === "/dashboard" || pathname === "/create" || pathname.startsWith("/ads/") || pathname.startsWith("/payment/")) return null;

  const initials = userProfile?.displayName
    ? userProfile.displayName.charAt(0).toUpperCase()
    : "?";

  const NAV_ITEMS = [
    { href: "/browse", label: t.navAds },
    { href: "/how-it-works", label: t.navHowItWorks },
  ];

  const close = () => setDrawerOpen(false);

  return (
    <>
      <header style={{ position: "sticky", top: 0, zIndex: 80, background: "rgba(14,11,26,.92)", backdropFilter: "blur(18px)", borderBottom: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}>
            <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="24" fill="#7C3AED"/>
              <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
              <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
            </svg>
            <span style={{ fontFamily: "'Unbounded', sans-serif", fontSize: ".9rem", fontWeight: 700, letterSpacing: ".01em", color: "#EDE9FE" }}>PRIMIO</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex" style={{ gap: 2, marginLeft: 8 }}>
            {NAV_ITEMS.map((n) => (
              <Link key={n.href} href={n.href}
                style={{ padding: "8px 13px", borderRadius: 9, color: "#6D5B8E", fontSize: ".85rem", fontWeight: 600, textDecoration: "none", transition: "color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#EDE9FE")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6D5B8E")}
              >{n.label}</Link>
            ))}
          </nav>

          {/* Right side */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>

            {/* Language switcher — desktop only */}
            <div className="hidden md:flex" style={{ alignItems: "center", gap: 2, padding: "4px 6px", borderRadius: 9, background: "#160F2A", border: "1px solid #2D1F50" }}>
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)} style={{ padding: "4px 9px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: ".73rem", fontWeight: 700, letterSpacing: ".04em", background: lang === l.code ? "#7C3AED" : "transparent", color: lang === l.code ? "#fff" : "#6D5B8E", transition: "all .15s" }}>
                  {l.label}
                </button>
              ))}
            </div>

            {!loading && (
              <>
                {firebaseUser ? (
                  <>
                    {/* Total spent — desktop only */}
                    <div className="hidden md:flex" style={{ alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 10, background: "#160F2A", border: "1px solid #2D1F50" }}>
                      <span style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700 }}>{t.navSpent}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: ".86rem", fontWeight: 600, color: "#FCD34D" }}>
                        ${((userProfile?.totalSpentCents || 0) / 100).toFixed(0)}
                      </span>
                    </div>

                    {/* Avatar — desktop only */}
                    <Link href="/dashboard" className="hidden md:flex" style={{ alignItems: "center", gap: 8, padding: "5px 11px 5px 5px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", color: "#EDE9FE", textDecoration: "none" }}>
                      <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, color: "#fff" }}>{initials}</span>
                      <span style={{ fontSize: ".78rem", fontWeight: 600 }}>{userProfile?.displayName || t.navDashboard}</span>
                    </Link>

                    <Link href="/create" className="hidden md:inline-flex" style={{ padding: "9px 16px", borderRadius: 10, background: "#7C3AED", color: "#fff", fontSize: ".82rem", fontWeight: 700, textDecoration: "none" }}>
                      + {t.navPlaceAd}
                    </Link>
                  </>
                ) : (
                  <Link href="/auth" className="hidden md:inline-flex" style={{ padding: "9px 16px", borderRadius: 10, background: "#7C3AED", color: "#fff", fontSize: ".82rem", fontWeight: 700, textDecoration: "none" }}>
                    {t.navSignIn}
                  </Link>
                )}
              </>
            )}

            {/* Mobile: Kirish button (logged out only) */}
            {!loading && !firebaseUser && (
              <Link href="/auth" className="md:hidden" style={{ padding: "8px 14px", borderRadius: 10, background: "#7C3AED", color: "#fff", fontSize: ".8rem", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                {t.navSignInShort}
              </Link>
            )}

            {/* Mobile: Create button (logged in only) */}
            {!loading && firebaseUser && (
              <Link href="/create" className="md:hidden" style={{ padding: "8px 14px", borderRadius: 10, background: "#7C3AED", color: "#fff", fontSize: ".8rem", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                + {t.navPlaceAd}
              </Link>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden"
              onClick={() => setDrawerOpen(true)}
              style={{ padding: "8px", color: "#A78BFA", background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.25)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer Overlay ─────────────────────────────────────────────── */}
      <div
        onClick={close}
        style={{
          position: "fixed", inset: 0, zIndex: 199,
          background: "rgba(0,0,0,.55)", backdropFilter: "blur(3px)",
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "opacity .28s ease",
        }}
      />

      {/* ── Mobile Drawer Panel ───────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 200,
        width: "min(300px, 88vw)",
        background: "#0E0B1A",
        borderLeft: "1px solid #2D1F50",
        display: "flex", flexDirection: "column",
        transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform .3s cubic-bezier(.4,0,.2,1)",
        overflowY: "auto",
      }}>

        {/* Drawer header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #2D1F50", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="24" fill="#7C3AED"/>
              <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
              <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
            </svg>
            <span style={{ fontFamily: "'Unbounded', sans-serif", fontSize: ".85rem", fontWeight: 700, color: "#EDE9FE" }}>PRIMIO</span>
          </div>
          <button onClick={close} style={{ padding: 7, color: "#6D5B8E", background: "rgba(109,91,142,.12)", border: "1px solid #2D1F50", borderRadius: 8, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {/* User info (logged in) */}
        {!loading && firebaseUser && (
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #2D1F50", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".9rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: ".84rem", fontWeight: 700, color: "#EDE9FE", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userProfile?.displayName}</div>
              <div style={{ fontSize: ".72rem", color: "#6D5B8E", marginTop: 2 }}>
                {t.navSpent}: <span style={{ color: "#FCD34D", fontFamily: "'JetBrains Mono',monospace" }}>${((userProfile?.totalSpentCents || 0) / 100).toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "12px 12px" }}>
          <div style={{ fontSize: ".63rem", letterSpacing: ".12em", textTransform: "uppercase", color: "#4A3C6E", fontWeight: 700, padding: "8px 10px 6px" }}>Menyu</div>

          {NAV_ITEMS.map((n) => (
            <Link key={n.href} href={n.href} onClick={close} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 10, fontSize: ".88rem", fontWeight: 600, color: "#A78BFA", textDecoration: "none", marginBottom: 2 }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >{n.label}</Link>
          ))}

          {!loading && firebaseUser && (
            <>
              <div style={{ height: 1, background: "#2D1F50", margin: "8px 0" }} />
              <Link href="/dashboard" onClick={close} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 10, fontSize: ".88rem", fontWeight: 600, color: "#A78BFA", textDecoration: "none", marginBottom: 2 }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >📊 {t.navDashboard}</Link>
            </>
          )}
        </nav>

        {/* Language switcher */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #2D1F50" }}>
          <div style={{ fontSize: ".63rem", letterSpacing: ".12em", textTransform: "uppercase", color: "#4A3C6E", fontWeight: 700, marginBottom: 10 }}>Til</div>
          <div style={{ display: "flex", gap: 6 }}>
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => { setLang(l.code); close(); }}
                style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: `1px solid ${lang === l.code ? "#7C3AED" : "#2D1F50"}`, cursor: "pointer", fontSize: ".8rem", fontWeight: 700, letterSpacing: ".05em", background: lang === l.code ? "rgba(124,58,237,.2)" : "transparent", color: lang === l.code ? "#A855F7" : "#6D5B8E", transition: "all .15s" }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sign out / Sign in */}
        <div style={{ padding: "0 20px 28px", flexShrink: 0 }}>
          {!loading && (
            firebaseUser ? (
              <button onClick={() => { signOut(); close(); }}
                style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "1px solid rgba(248,113,113,.3)", background: "rgba(248,113,113,.07)", color: "#F87171", fontSize: ".84rem", fontWeight: 700, cursor: "pointer" }}>
                ↩ {t.navSignOut}
              </button>
            ) : (
              <Link href="/auth" onClick={close}
                style={{ display: "block", textAlign: "center", padding: "12px 0", borderRadius: 10, background: "#7C3AED", color: "#fff", fontSize: ".84rem", fontWeight: 700, textDecoration: "none" }}>
                {t.navSignIn} →
              </Link>
            )
          )}
        </div>
      </div>
    </>
  );
}
