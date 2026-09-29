"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/contexts/LangContext";

// This public GA4 stream ID is not an OAuth client ID or secret.
const MEASUREMENT_ID = "G-61JD7SK9EH";
const STORAGE_KEY = "primio_analytics_consent";
const SCRIPT_ID = "primio-ga4-tag";
type Choice = "accepted" | "rejected" | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function isPublicPage(pathname: string) {
  return ["/", "/browse", "/contact", "/how-it-works", "/privacy", "/terms"].includes(pathname);
}

function copy(lang: string, uz: string, en: string, ru: string) {
  return lang === "en" ? en : lang === "ru" ? ru : uz;
}

export function AnalyticsPreferencesButton() {
  const { lang } = useLang();
  return <button type="button" className="p-analytics-preferences" onClick={() => window.dispatchEvent(new Event("primio-analytics-preferences"))}>
    {copy(lang, "Analitika roziligini o‘zgartirish", "Change analytics consent", "Изменить согласие на аналитику")}
  </button>;
}

export default function AnalyticsConsent() {
  const { lang } = useLang();
  const pathname = usePathname();
  const [choice, setChoice] = useState<Choice | undefined>();
  const [showPreferences, setShowPreferences] = useState(false);
  const [tagReady, setTagReady] = useState(false);
  const lastTrackedPath = useRef<string | null>(null);
  const publicPage = isPublicPage(pathname);

  useEffect(() => {
    let active = true;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {}
    queueMicrotask(() => {
      if (active) setChoice(stored === "accepted" || stored === "rejected" ? stored : null);
    });
    const reopen = () => setShowPreferences(true);
    window.addEventListener("primio-analytics-preferences", reopen);
    return () => {
      active = false;
      window.removeEventListener("primio-analytics-preferences", reopen);
    };
  }, []);

  useEffect(() => {
    if (choice !== "accepted" || !tagReady || !publicPage) {
      if (!publicPage) lastTrackedPath.current = null;
      return;
    }
    if (lastTrackedPath.current === pathname) return;
    window.gtag?.("event", "page_view", {
      send_to: MEASUREMENT_ID,
      page_path: pathname,
      page_location: `${window.location.origin}${pathname}`,
      page_referrer: "",
      page_title: "Primio",
    });
    lastTrackedPath.current = pathname;
  }, [choice, tagReady, pathname, publicPage]);

  useEffect(() => {
    if (choice !== "accepted" || !publicPage) return;

    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
      window.gtag("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      window.gtag("js", new Date());
      lastTrackedPath.current = pathname;
      window.gtag("config", MEASUREMENT_ID, {
        page_path: pathname,
        page_location: `${window.location.origin}${pathname}`,
        page_referrer: "",
        page_title: "Primio",
      });
    } else {
      window.gtag("consent", "update", { analytics_storage: "granted" });
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const ready = () => {
      if (script) script.dataset.loaded = "true";
      setTagReady(true);
    };
    if (script?.dataset.loaded === "true") {
      ready();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", ready);
    }
    return () => script?.removeEventListener("load", ready);
  }, [choice, publicPage, pathname]);

  function choose(next: Exclude<Choice, null>) {
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    window.gtag?.("consent", "update", { analytics_storage: next === "accepted" ? "granted" : "denied" });
    if (next === "accepted" && choice === "rejected") lastTrackedPath.current = null;
    setChoice(next);
    setShowPreferences(false);
  }

  return <>
    {publicPage && choice !== undefined && (choice === null || showPreferences) && <section className="p-analytics-consent" aria-label={copy(lang, "Sayt analitikasi roziligi", "Website analytics consent", "Согласие на аналитику сайта")}>
      <div>
        <strong>{copy(lang, "Sayt tashriflarini o‘lchash", "Measure website visits", "Измерение посещений сайта")}</strong>
        <p>{copy(lang,
          "Rozilik bersangiz, Primio ommaviy sahifalarga tashrifni Google Analytics orqali o‘lchaydi. Kabinet va to‘lov sahifalari o‘lchanmaydi.",
          "If you agree, Primio measures visits to public pages with Google Analytics. Dashboard and payment pages are excluded.",
          "С вашего согласия Primio измеряет посещения открытых страниц через Google Analytics. Кабинет и платежные страницы исключены.")} <Link href="/privacy">{copy(lang, "Maxfiylik siyosati", "Privacy policy", "Политика конфиденциальности")}</Link></p>
      </div>
      <div className="p-analytics-consent-actions">
        <button type="button" onClick={() => choose("rejected")}>{copy(lang, "Rad etish", "Decline", "Отклонить")}</button>
        <button type="button" onClick={() => choose("accepted")}>{copy(lang, "Ruxsat berish", "Allow", "Разрешить")}</button>
      </div>
    </section>}
  </>;
}
