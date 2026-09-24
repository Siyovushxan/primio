"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { Brand, pick } from "@/components/primio/shared";
import { LANGS } from "@/lib/i18n";

export default function Header() {
  const pathname = usePathname();
  const { firebaseUser } = useAuth();
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/create") || pathname.startsWith("/ads/") || pathname.startsWith("/payment/")) return null;
  const close = () => setOpen(false);
  return <header className="p-header">
    <div className="p-container p-header-inner">
      <Brand/>
      <nav className="p-desktop-nav" aria-label={pick(lang,"Asosiy menyu","Main navigation","Главное меню")}>
        <Link href="/#how">{pick(lang,"Qanday ishlaydi","How it works","Как это работает")}</Link>
        <Link href="/browse">{pick(lang,"Reklamalar","Explore ads","Объявления")}</Link>
        <Link href="/#pricing">{pick(lang,"Narxlar","Pricing","Стоимость")}</Link>
      </nav>
      <div className="p-header-actions">
        <select className="p-lang" aria-label={pick(lang,"Til","Language","Язык")} value={lang} onChange={event => setLang(event.target.value as typeof lang)}>
          {LANGS.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
        </select>
        <Link className="p-btn p-btn-small p-btn-light" href={firebaseUser ? "/dashboard" : "/auth"}>
          {firebaseUser ? pick(lang,"Kabinet","Dashboard","Кабинет") : pick(lang,"Boshlash","Get started","Начать")}<ArrowUpRight size={16}/>
        </Link>
        <button className="p-icon-btn p-menu-toggle" aria-label={pick(lang,"Menyu","Menu","Меню")} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button>
      </div>
    </div>
    {open && <nav id="mobile-nav" className="p-mobile-nav" onKeyDown={event => { if (event.key === "Escape") close(); }}>
      <Link onClick={close} href="/#how">{pick(lang,"Qanday ishlaydi","How it works","Как это работает")}</Link>
      <Link onClick={close} href="/browse">{pick(lang,"Reklamalar","Explore ads","Объявления")}</Link>
      <Link onClick={close} href="/#pricing">{pick(lang,"Narxlar","Pricing","Стоимость")}</Link>
    </nav>}
  </header>;
}