"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { LANGS } from "@/lib/i18n";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const { firebaseUser, userProfile, signOut, loading } = useAuth();
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/dashboard" || pathname === "/create" || pathname.startsWith("/ads/") || pathname.startsWith("/payment/")) return null;

  const initials = userProfile?.displayName
    ? userProfile.displayName.charAt(0).toUpperCase()
    : "?";

  const NAV_ITEMS = [
    { href: "/browse", label: t.navAds },
    { href: "/how-it-works", label: t.navHowItWorks },
  ];

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 80, background: "rgba(14,11,26,.92)", backdropFilter: "blur(18px)", borderBottom: "1px solid #2D1F50" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "12px 26px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="24" fill="#7C3AED"/>
            <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
            <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
          </svg>
          <span style={{ fontFamily: "'Unbounded', sans-serif", fontSize: ".9rem", fontWeight: 700, letterSpacing: ".01em", color: "#EDE9FE" }}>PRIMIO</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex" style={{ gap: 2 }}>
          {NAV_ITEMS.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              style={{ padding: "8px 13px", borderRadius: 9, background: "transparent", border: "none", color: "#6D5B8E", fontSize: ".85rem", fontWeight: 600, transition: "color .15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#EDE9FE")}
              onMouseLeave={e => (e.currentTarget.style.color = "#6D5B8E")}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9 }}>

          {/* Language switcher */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 2, padding: "4px 6px", borderRadius: 9, background: "#160F2A", border: "1px solid #2D1F50" }}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                style={{
                  padding: "4px 9px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: ".73rem", fontWeight: 700, letterSpacing: ".04em",
                  background: lang === l.code ? "#7C3AED" : "transparent",
                  color: lang === l.code ? "#fff" : "#6D5B8E",
                  transition: "all .15s",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {!loading && (
            <>
              {firebaseUser ? (
                <>
                  {/* Total spent (hidden on mobile) */}
                  <div className="hidden md:flex" style={{ alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 10, background: "#160F2A", border: "1px solid #2D1F50", color: "#EDE9FE" }}>
                    <span style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700 }}>{t.navSpent}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: ".86rem", fontWeight: 600, color: "#FCD34D" }}>
                      ${((userProfile?.totalSpentCents || 0) / 100).toFixed(0)}
                    </span>
                  </div>

                  {/* User avatar + name */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 11px 5px 5px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", color: "#EDE9FE" }}
                    >
                      <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, color: "#fff" }}>
                        {initials}
                      </span>
                      <span style={{ fontSize: ".78rem", fontWeight: 600, display: "none" }} className="hidden md:block">
                        {userProfile?.displayName || t.navDashboard}
                      </span>
                    </button>

                    {menuOpen && (
                      <div style={{ position: "absolute", right: 0, top: 44, width: 200, background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 14, boxShadow: "0 24px 60px rgba(0,0,0,.42)", zIndex: 99 }}>
                        <div style={{ padding: "13px 16px", borderBottom: "1px solid #2D1F50" }}>
                          <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#EDE9FE" }}>{userProfile?.displayName}</div>
                          <div style={{ fontSize: ".74rem", color: "#6D5B8E", marginTop: 2 }}>{firebaseUser.email}</div>
                        </div>
                        <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 16px", fontSize: ".82rem", color: "#A78BFA", textDecoration: "none" }}>📊 {t.navDashboard}</Link>
                        <Link href="/create" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 16px", fontSize: ".82rem", color: "#A78BFA", textDecoration: "none" }}>+ {t.navPlaceAd}</Link>
                        <button onClick={() => { signOut(); setMenuOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "11px 16px", fontSize: ".82rem", color: "#F87171", background: "none", border: "none", textAlign: "left" }}>↩ {t.navSignOut}</button>
                      </div>
                    )}
                  </div>

                  <Link href="/create" style={{ padding: "9px 16px", borderRadius: 10, background: "#7C3AED", color: "#fff", fontSize: ".82rem", fontWeight: 700, textDecoration: "none" }}>
                    + {t.navPlaceAd}
                  </Link>
                </>
              ) : (
                <Link href="/auth" style={{ padding: "9px 16px", borderRadius: 10, background: "#7C3AED", color: "#fff", fontSize: ".82rem", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                  <span className="hidden md:inline">{t.navSignIn}</span>
                  <span className="md:hidden">{t.navSignInShort}</span>
                </Link>
              )}
            </>
          )}

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ padding: 8, color: "#6D5B8E", background: "none", border: "none" }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden" style={{ borderTop: "1px solid #2D1F50", background: "#160F2A", padding: "10px 26px" }}>
          {NAV_ITEMS.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 0", fontSize: ".88rem", color: "#A78BFA", textDecoration: "none" }}>{n.label}</Link>
          ))}
          {/* Mobile language switcher */}
          <div style={{ display: "flex", gap: 6, padding: "10px 0", borderTop: "1px solid #2D1F50", marginTop: 4 }}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setMenuOpen(false); }}
                style={{
                  padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontSize: ".78rem", fontWeight: 700,
                  background: lang === l.code ? "#7C3AED" : "rgba(124,58,237,0.1)",
                  color: lang === l.code ? "#fff" : "#6D5B8E",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
          {firebaseUser ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 0", fontSize: ".88rem", color: "#A78BFA", textDecoration: "none" }}>{t.navDashboard}</Link>
              <button onClick={() => { signOut(); setMenuOpen(false); }} style={{ padding: "10px 0", fontSize: ".88rem", color: "#F87171", background: "none", border: "none", display: "block" }}>{t.navSignOut}</button>
            </>
          ) : (
            <Link href="/auth" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 0", fontSize: ".88rem", color: "#7C3AED", textDecoration: "none", fontWeight: 700 }}>{t.navSignInShort} →</Link>
          )}
        </div>
      )}

      {menuOpen && <div style={{ position: "fixed", inset: 0, zIndex: -1 }} onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
