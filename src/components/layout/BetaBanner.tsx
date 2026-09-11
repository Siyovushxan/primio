"use client";

import { useState, useEffect } from "react";

const LAUNCH_DATE = "15 sentabr, 2026";

export default function BetaBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("betaBannerDismissed")) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem("betaBannerDismissed", "1"); } catch {}
  };

  if (!visible) return null;

  return (
    <div style={{
      background: "linear-gradient(90deg,#92400E,#78350F)",
      borderBottom: "1px solid #F59E0B",
      padding: "9px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      flexWrap: "wrap",
      position: "relative",
    }}>
      <span style={{ fontSize: "1rem" }}>🚀</span>
      <span style={{ fontSize: ".82rem", color: "#FDE68A", fontWeight: 600, textAlign: "center" }}>
        <strong style={{ color: "#FCD34D" }}>Beta rejim</strong> — To&apos;lov tizimi{" "}
        <strong style={{ color: "#FCD34D" }}>{LAUNCH_DATE}</strong> kuni to&apos;liq ishga tushadi.
        Hozircha reklamangizni yarating va tayorlang!
      </span>
      <button
        onClick={dismiss}
        aria-label="Yopish"
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", color: "#FCD34D",
          fontSize: "1.1rem", cursor: "pointer", lineHeight: 1, padding: "4px 6px",
        }}
      >
        ×
      </button>
    </div>
  );
}
