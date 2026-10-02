"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { CATEGORY_IDS, rankAds, rankingBidCents, topBidCents } from "@/lib/auction";
import { categoryName, money, pick, usePublicAds } from "./shared";
import HorizontalSections from "./HorizontalSections";

export default function Landing() {
  const { lang } = useLang();
  const router = useRouter();
  const [url, setURL] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_IDS)[number]>("technology");
  const [placement, setPlacement] = useState<"top" | "standard">("top");
  const [now, setNow] = useState(() => Date.now());
  const publicAds = usePublicAds();
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const scopedAds = publicAds.ads.filter(ad => ad.category === category);
  const topAds = rankAds(scopedAds, now).slice(0, 3);
  const topPrice = publicAds.loading || publicAds.error ? null : topBidCents(scopedAds, now);
  const labels = [pick(lang, "Joylash", "Place an ad", "Разместить"), pick(lang, "Reklamalar", "Discover", "Объявления"), pick(lang, "Qanday ishlaydi", "How it works", "Как работает")];

  function start(event: FormEvent) {
    event.preventDefault();
    const bid = placement === "top" ? topPrice : 100;
    if (bid === null) return;
    router.push("/create?" + new URLSearchParams({ url: url.trim(), category, minBid: String(bid), days: "1" }));
  }

  return <HorizontalSections labels={labels}>
    <section id="start" className="p-home-slide" aria-labelledby="home-title">
      <div className="p-home-content p-home-intro">
        <div className="p-home-copy">
          <span className="p-eyebrow"><span className="p-status-dot"/>{pick(lang, "SODDA REKLAMA. ANIQ NARX.", "SIMPLE ADS. CLEAR PRICING.", "ПРОСТАЯ РЕКЛАМА. ЯСНАЯ ЦЕНА.")}</span>
          <h1 id="home-title">{pick(lang, "Brendingiz", "Your brand,", "Ваш бренд —")}<br/><span className="p-gradient-text">{pick(lang, "ko‘rinsin.", "seen.", "на виду.")}</span></h1>
          <p>{pick(lang, "Havolani kiriting. AI tekshiradi. To‘lovdan so‘ng reklamangiz ko‘rinadi.", "Add your link. AI reviews it. Pay, and your ad goes live.", "Добавьте ссылку. AI проверит. После оплаты объявление появится.")}</p>
          <form className="p-home-form" onSubmit={start}>
            <div className="p-home-price" aria-live="polite"><span>{pick(lang, "Hozir TOP-1 uchun", "TOP-1 right now", "Сейчас для TOP-1")} · {categoryName(category, lang)}</span><strong>{topPrice === null ? "—" : money(topPrice)}<small> / {pick(lang, "kun", "day", "день")}</small></strong></div>
            <div className="p-home-placement" role="group" aria-label={pick(lang, "Joylashuv", "Placement", "Размещение")}>
              <button type="button" aria-pressed={placement === "top"} onClick={() => setPlacement("top")}>TOP-1</button>
              <button type="button" aria-pressed={placement === "standard"} onClick={() => setPlacement("standard")}>{pick(lang, "$1/kun dan", "From $1/day", "От $1/день")}</button>
            </div>
            <label>{pick(lang, "Sayt yoki ijtimoiy sahifa", "Website or social page", "Сайт или соцсеть")}<input required inputMode="url" autoComplete="url" placeholder="example.com" value={url} onChange={event => setURL(event.target.value)}/></label>
            <label>{pick(lang, "Toifa", "Category", "Категория")}<select value={category} onChange={event => setCategory(event.target.value as typeof category)}>{CATEGORY_IDS.map(id => <option key={id} value={id}>{categoryName(id, lang)}</option>)}</select></label>
            <button className="p-btn p-btn-primary" disabled={placement === "top" && topPrice === null}>{pick(lang, "Reklama joylash", "Place an ad", "Разместить рекламу")}<ArrowUpRight size={17}/></button>
          </form>
          {publicAds.error ? <p className="p-home-note" role="status">{pick(lang, "TOP narxi yuklanmadi.", "TOP price is unavailable.", "Цена TOP недоступна.")} <button type="button" onClick={publicAds.retry}>{pick(lang, "Qayta tekshirish", "Retry", "Повторить")}</button></p> : <p className="p-home-note">{pick(lang, "Profil kerak emas · 1 kunlik narx · O‘rin to‘lovgacha o‘zgarishi mumkin", "No profile needed · Daily pricing · Position can change before payment", "Без профиля · Цена за день · Место может измениться до оплаты")}</p>}
        </div>
        <aside className="p-home-live" aria-label={pick(lang, "Toifadagi jonli reyting", "Live category ranking", "Рейтинг категории")}>
          <div className="p-home-live-heading"><span className="p-eyebrow"><span className="p-status-dot"/>PRIMIO / LIVE</span><span>{categoryName(category, lang)}</span></div>
          <h2>{pick(lang, "Yuqoriga yo‘l ochiq.", "Room at the top.", "Путь наверх открыт.")}</h2>
          <div className="p-home-ranks">{publicAds.loading ? <p role="status">{pick(lang, "Reklamalar yuklanmoqda…", "Loading ads…", "Загрузка объявлений…")}</p> : publicAds.error ? <p>{pick(lang, "Jonli reyting hozir ochilmadi.", "Live ranking is unavailable.", "Рейтинг сейчас недоступен.")}</p> : topAds.length ? topAds.map((ad, index) => <Link key={ad.id} href={`/project/${ad.id}`} className="p-home-rank"><span className="p-home-rank-number">0{index + 1}</span><div><strong>{ad.title}</strong><small>{money(rankingBidCents(ad, now))} · {pick(lang, "reyting taklifi", "ranking offer", "рейтинговая ставка")}</small></div><ArrowUpRight size={20}/></Link>) : <div className="p-home-empty"><Sparkles size={30}/><strong>{pick(lang, "Birinchi bo‘ling.", "Be the first.", "Станьте первым.")}</strong><span>{pick(lang, "Bu toifada joy $1/kun dan boshlanadi.", "This category starts at $1/day.", "В этой категории — от $1/день.")}</span></div>}</div>
          <Link className="p-text-link" href={`/browse?category=${category}`}>{pick(lang, "Barcha reklamalar", "Explore all ads", "Все объявления")}<ArrowUpRight size={16}/></Link>
        </aside>
      </div>
    </section>

    <section id="ads" className="p-home-slide" aria-labelledby="discover-title">
      <div className="p-home-content p-home-discover">
        <div className="p-home-section-heading"><span className="p-eyebrow">02 / {pick(lang, "KASHF ETING", "DISCOVER", "ОТКРОЙТЕ")}</span><h2 id="discover-title">{pick(lang, "Reklamalar bir joyda.", "One place to discover.", "Объявления в одном месте.")}</h2><p>{pick(lang, "Kerakli toifani tanlang va yangi loyihalarni toping.", "Choose a category and find your next discovery.", "Выберите категорию и найдите новые проекты.")}</p></div>
        <div className="p-home-categories">{CATEGORY_IDS.map((id, index) => <Link key={id} href={`/browse?category=${id}`}><span>0{index + 1}</span><strong>{categoryName(id, lang)}</strong><ArrowUpRight size={20}/></Link>)}</div>
        <Link className="p-btn p-btn-secondary" href="/browse">{pick(lang, "Barcha reklamalarni ko‘rish", "Browse all ads", "Посмотреть все объявления")}<ArrowUpRight size={18}/></Link>
      </div>
    </section>

    <section id="how" className="p-home-slide" aria-labelledby="how-title">
      <div className="p-home-content p-home-how">
        <div className="p-home-section-heading"><span className="p-eyebrow">03 / {pick(lang, "UCHTA QADAM", "THREE STEPS", "ТРИ ШАГА")}</span><h2 id="how-title">{pick(lang, "Joylang. Tekshirtiring. Ko‘rining.", "Add it. Review it. Go live.", "Добавьте. Проверьте. Запустите.")}</h2></div>
        <div className="p-home-steps">{[
          [Globe2, pick(lang, "Havolani kiriting", "Add your link", "Добавьте ссылку"), pick(lang, "Toifa, narx va muddatni tanlang.", "Choose a category, price and duration.", "Выберите категорию, цену и срок.")],
          [ShieldCheck, pick(lang, "AI tekshiradi", "AI reviews it", "AI проверит"), pick(lang, "Tekshiruvdan o‘tsa, to‘lovga o‘tasiz.", "After approval, continue to payment.", "После одобрения переходите к оплате.")],
          [CheckCircle2, pick(lang, "To‘lang va ko‘rining", "Pay and go live", "Оплатите и появитесь"), pick(lang, "To‘lov tasdiqlangach, reklama avtomatik faollashadi.", "Your ad activates automatically after payment confirmation.", "После подтверждения оплаты объявление активируется автоматически.")]
        ].map(([Icon, title, text], index) => { const Glyph = Icon as typeof Globe2; return <article key={index}><span>0{index + 1}</span><Glyph size={26}/><h3>{title as string}</h3><p>{text as string}</p></article>; })}</div>
        <div id="pricing" className="p-home-rule"><strong>{pick(lang, "$1/kun dan. Jami narx oldindan.", "From $1/day. Know the total upfront.", "От $1/день. Итоговая цена заранее.")}</strong><p>{pick(lang, "Yuqori reyting taklifi oldinda turadi. Yangi pulli taklif 168 soat saqlanadi, keyin 24 soat ichida bosqichma-bosqich $1 ga tushadi. Reklama to‘langan muddatgacha ko‘rinadi.", "Higher ranking offers appear first. New paid offers hold for 168 hours, then gradually fall to $1 over 24 hours. Ads display until their paid expiry.", "Более высокая рейтинговая ставка выше. Новая оплаченная ставка сохраняется 168 часов, затем за 24 часа постепенно снижается до $1. Показ длится до конца оплаченного срока.")}</p></div>
        <Link className="p-btn p-btn-primary" href="/create">{pick(lang, "Reklama joylash", "Place an ad", "Разместить рекламу")}<ArrowUpRight size={18}/></Link>
        <footer className="p-home-legal"><span>© {new Date().getFullYear()} PRIMIO</span><Link href="/terms">{pick(lang, "Shartlar", "Terms", "Условия")}</Link><Link href="/privacy">{pick(lang, "Maxfiylik", "Privacy", "Конфиденциальность")}</Link><Link href="/contact">{pick(lang, "Bog‘lanish", "Contact", "Связаться")}</Link></footer>
      </div>
    </section>
  </HorizontalSections>;
}
