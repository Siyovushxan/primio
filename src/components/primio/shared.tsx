"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import type { Category } from "@/types";
import { rankAds } from "@/lib/auction";

export const pick = (lang: Lang, uz: string, en: string, ru: string) => ({ uz, en, ru })[lang];
export const money = (cents: number) => "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="p-brand" aria-label="Primio">
    <Image src="/logo.svg" alt="" width={34} height={34} priority/>{!compact && <span>PRIMIO</span>}
  </Link>;
}
export const categoryNames: Record<Category, [string,string,string]> = {
  technology: ["Texnologiya","Technology","Технологии"], food: ["Taom va restoranlar","Food & restaurants","Еда и рестораны"],
  fashion: ["Moda va uslub","Fashion & lifestyle","Мода и стиль"], education: ["Ta’lim","Education","Образование"],
  health: ["Salomatlik","Health & wellness","Здоровье"], real_estate: ["Uy-joy va xizmatlar","Property & services","Жильё и услуги"],
  entertainment: ["Ko‘ngilochar","Entertainment","Развлечения"], other: ["Boshqa","Other","Другое"]
};
export function categoryName(category: string, lang: Lang) {
  const names = categoryNames[category as Category];
  return names ? pick(lang, ...names) : category;
}
export interface PublicAd {
  id: string; title: string; description: string; imageURL: string; destinationURL: string;
  category: Category; dailyBidCents: number; status: string; startsAt: number; expiresAt: number; createdAt: number;
}
export function usePublicAds(enabled = true) {
  const [ads, setAds] = useState<PublicAd[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/public/ads", { signal: controller.signal });
        if (!res.ok) throw new Error("Unavailable");
        const data = await res.json();
        if (active) { setAds(rankAds(data.ads)); setError(false); }
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    }
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 30000);
    return () => { active = false; controller.abort(); clearInterval(timer); };
  }, [enabled, revision]);
  return { ads, loading, error, retry: () => setRevision(value => value + 1) };
}
export function LoadingState({ label }: { label: string }) {
  return <div className="p-empty" role="status"><LoaderCircle className="p-spin" size={28}/><p>{label}</p></div>;
}
export function Footer({ lang }: { lang: Lang }) {
  return <footer className="p-footer p-container"><Brand/><span>© {new Date().getFullYear()} Primio</span>
    <div><Link href="/browse">{pick(lang,"Reklamalar","Explore ads","Объявления")}</Link><Link href="/terms">{pick(lang,"Foydalanish shartlari","Terms of service","Условия")}</Link>
    <a href="mailto:support@primio.com.uz">{pick(lang,"Bog‘lanish","Contact","Связаться")} <ArrowUpRight size={14}/></a></div>
  </footer>;
}
