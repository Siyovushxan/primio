"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, BarChart3, Eye, Layers3, MousePointer2, Percent, Wallet } from "lucide-react";
import type { Ad, Transaction } from "@/types";
import type { Lang } from "@/lib/i18n";
import { milliseconds } from "@/lib/auction";
import { money, pick } from "./shared";
import { adStatus } from "./AdList";
import type { DailyStat } from "./dashboard-data";

type Period = "all" | "7" | "30";
type Counts = { impressions: number; profileViews: number; clicks: number };
const empty = (): Counts => ({ impressions: 0, profileViews: 0, clicks: 0 });
const add = (total: Counts, row: Partial<Counts>) => ({
  impressions: total.impressions + (row.impressions || 0),
  profileViews: total.profileViews + (row.profileViews || 0),
  clicks: total.clicks + (row.clicks || 0),
});
const rate = (part: number, whole: number) => whole > 0 ? `${(part / whole * 100).toFixed(1)}%` : "—";
const dateKey = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);

export default function BusinessIntelligence({ ads, stats, transactions, lang, now }: { ads: Ad[]; stats: DailyStat[]; transactions: Transaction[]; lang: Lang; now: number }) {
  const [period, setPeriod] = useState<Period>("all");
  const [adId, setAdId] = useState("all");
  const filteredAds = useMemo(() => ads.filter(ad => adId === "all" || ad.id === adId), [ads, adId]);
  const start = period === "all" ? "" : dateKey(now - (Number(period) - 1) * 86400000);
  const end = dateKey(now);
  const scopedStats = useMemo(() => stats.filter(row => filteredAds.some(ad => ad.id === row.adId) && row.date >= (period === "all" ? dateKey(now - 29 * 86400000) : start) && row.date <= end), [stats, filteredAds, period, start, end, now]);
  const periodHasData = period === "all" || scopedStats.length > 0;
  const counts = period === "all" ? filteredAds.reduce<Counts>((total, ad) => add(total, ad), empty()) : scopedStats.reduce<Counts>((total, row) => add(total, row), empty());
  const selectedIds = new Set(filteredAds.map(ad => ad.id));
  const spent = transactions.filter(tx => selectedIds.has(tx.adId) && (period === "all" || (dateKey(milliseconds(tx.createdAt)) >= start && dateKey(milliseconds(tx.createdAt)) <= end)))
    .reduce((total, tx) => total + (tx.type === "refund" ? -tx.amountCents : tx.amountCents), 0);
  const campaignRows = filteredAds.map(ad => {
    const values = period === "all" ? add(empty(), ad) : scopedStats.filter(row => row.adId === ad.id).reduce<Counts>((total, row) => add(total, row), empty());
    return { ad, ...values, hasData: period === "all" || scopedStats.some(row => row.adId === ad.id) };
  }).sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
  const days = period === "all" ? 30 : Number(period);
  const dates = Array.from({ length: days }, (_, index) => dateKey(now - (days - 1 - index) * 86400000));
  const daily = dates.map(date => ({ date, ...scopedStats.filter(row => row.date === date).reduce<Counts>((total, row) => add(total, row), empty()) }));
  const maximum = Math.max(1, ...daily.map(day => day.impressions), ...daily.map(day => day.profileViews), ...daily.map(day => day.clicks));
  const points = (metric: keyof Counts) => daily.map((day, index) => `${(index / Math.max(1, daily.length - 1) * 600).toFixed(1)},${(150 - day[metric] / maximum * 124).toFixed(1)}`).join(" ");
  const format = (value: number) => value.toLocaleString("en-US");
  const statusCopy: Record<Ad["status"], string> = {
    active: pick(lang, "Faol", "Active", "Активно"),
    pending: pick(lang, "To‘lov kutilmoqda", "Awaiting payment", "Ожидает оплаты"),
    pending_verification: pick(lang, "Tekshiruvda", "In review", "На проверке"),
    expired: pick(lang, "Tugagan", "Ended", "Завершено"),
    rejected: pick(lang, "Rad etilgan", "Rejected", "Отклонено"),
  };
  const metricCards = [
    { label: pick(lang, "Reklama ko‘rilishi", "Ad impressions", "Показы рекламы"), value: counts.impressions, icon: Eye },
    { label: pick(lang, "Loyiha sahifasi", "Project page views", "Просмотры проекта"), value: counts.profileViews, icon: Layers3 },
    { label: pick(lang, "Tashqi havola bosilishi", "Outbound clicks", "Переходы по ссылке"), value: counts.clicks, icon: MousePointer2 },
  ];

  return <section className="p-bi" aria-labelledby="p-bi-title">
    <div className="p-bi-heading"><div><span className="p-bi-kicker"><BarChart3 size={15}/>{pick(lang, "BIZNES TAHLIL", "BUSINESS INTELLIGENCE", "БИЗНЕС-АНАЛИТИКА")}</span><h2 id="p-bi-title">{pick(lang, "Reklama samaradorligi", "Campaign intelligence", "Эффективность рекламы")}</h2><p>{pick(lang, "Primio ichidagi ko‘rish va bosishlar. Bu raqamlar saytingizga tashriflar soni emas.", "Views and clicks inside Primio. These are not visits to your own website.", "Показы и клики внутри Primio. Это не посещения вашего сайта.")}</p></div><span className="p-bi-source">● {pick(lang, "Primio ma’lumotlari", "Primio data", "Данные Primio")}</span></div>
    <div className="p-bi-toolbar"><label>{pick(lang, "Davr", "Period", "Период")}<select value={period} onChange={event => setPeriod(event.target.value as Period)}><option value="all">{pick(lang, "Barcha vaqt", "All time", "Всё время")}</option><option value="7">{pick(lang, "Oxirgi 7 kun", "Last 7 days", "Последние 7 дней")}</option><option value="30">{pick(lang, "Oxirgi 30 kun", "Last 30 days", "Последние 30 дней")}</option></select></label><label>{pick(lang, "Reklama", "Campaign", "Объявление")}<select value={adId} onChange={event => setAdId(event.target.value)}><option value="all">{pick(lang, "Barcha reklamalar", "All campaigns", "Все объявления")}</option>{ads.map(ad => <option key={ad.id} value={ad.id}>{ad.title}</option>)}</select></label><span className="p-bi-period-note">{period === "all" ? pick(lang, "Jami hisoblagichlar · grafik oxirgi 30 kun", "Lifetime counters · chart shows last 30 days", "Общие счётчики · график за 30 дней") : `${start} — ${end} · UTC`}</span></div>
    {!periodHasData && <p className="p-bi-message" role="status">{pick(lang, "Bu davr uchun kunlik Primio statistikasi yozilmagan. Barcha vaqtni tanlab jami natijani ko‘ring.", "No daily Primio records for this period. Choose All time to see lifetime totals.", "За этот период нет ежедневных данных Primio. Выберите всё время для общих итогов.")}</p>}
    <div className="p-bi-metrics">{metricCards.map(({ label, value, icon: Icon }) => <article className="p-bi-metric" key={label}><span>{label}<Icon size={16}/></span><strong>{periodHasData ? format(value) : "—"}</strong><small>{pick(lang, "Manba: Primio", "Source: Primio", "Источник: Primio")}</small></article>)}<article className="p-bi-metric"><span>CTR<Percent size={16}/></span><strong>{periodHasData ? rate(counts.clicks, counts.impressions) : "—"}</strong><small>{pick(lang, "Tashqi bosishlar / ko‘rilishlar", "Outbound clicks / impressions", "Переходы / показы")}</small></article><article className="p-bi-metric"><span>{pick(lang, "Sof to‘lov", "Net paid", "Чистая оплата")}<Wallet size={16}/></span><strong>{money(spent)}</strong><small>{pick(lang, "To‘lovlar − qaytarishlar · USD", "Payments − refunds · USD", "Платежи − возвраты · USD")}</small></article></div>
    <div className="p-bi-panels"><section className="p-bi-card p-bi-trend"><div className="p-bi-card-heading"><div><h3>{pick(lang, "Kunlik harakat", "Daily activity", "Активность по дням")}</h3><p>{pick(lang, "Primio · UTC kunlari", "Primio · UTC dates", "Primio · дни UTC")}</p></div><BarChart3 size={17}/></div>{scopedStats.length ? <><div className="p-bi-legend"><span><i className="impressions"/>{pick(lang, "Ko‘rishlar", "Impressions", "Показы")}</span><span><i className="pages"/>{pick(lang, "Loyiha", "Project", "Проект")}</span><span><i className="clicks"/>{pick(lang, "Bosishlar", "Clicks", "Клики")}</span></div><svg viewBox="0 0 600 165" preserveAspectRatio="none" role="img" aria-label={pick(lang, "Kunlik ko‘rishlar, loyiha sahifalari va bosishlar grafigi", "Daily impressions, project views and clicks chart", "График показов, просмотров проекта и кликов")}><defs><linearGradient id="bi-fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#a98afa" stopOpacity=".25"/><stop offset="1" stopColor="#a98afa" stopOpacity="0"/></linearGradient></defs>{[26,67,108,150].map(y => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#ffffff18" strokeDasharray="4 6"/>)}<polygon points={`0,160 ${points("impressions")} 600,160`} fill="url(#bi-fill)"/><polyline points={points("impressions")} fill="none" stroke="#b99bff" strokeWidth="3" strokeLinejoin="round"/><polyline points={points("profileViews")} fill="none" stroke="#70d7c5" strokeWidth="2.5" strokeLinejoin="round"/><polyline points={points("clicks")} fill="none" stroke="#d7ea9e" strokeWidth="2.5" strokeLinejoin="round"/></svg><div className="p-bi-axis"><span>{dates[0].slice(5)}</span><span>{dates[Math.floor(dates.length / 2)].slice(5)}</span><span>{dates[dates.length - 1].slice(5)}</span></div><details className="p-bi-details"><summary>{pick(lang, "Kunlik ma’lumotlar jadvali", "Daily data table", "Таблица по дням")}</summary><div className="p-table-scroll"><table className="p-table"><thead><tr><th>{pick(lang, "Sana", "Date", "Дата")}</th><th>{pick(lang, "Ko‘rish", "Impressions", "Показы")}</th><th>{pick(lang, "Loyiha", "Project", "Проект")}</th><th>{pick(lang, "Bosish", "Clicks", "Клики")}</th></tr></thead><tbody>{daily.map(day => <tr key={day.date}><td>{day.date}</td><td>{format(day.impressions)}</td><td>{format(day.profileViews)}</td><td>{format(day.clicks)}</td></tr>)}</tbody></table></div></details></> : <p className="p-bi-empty">{pick(lang, "Kunlik yozuvlar paydo bo‘lgach grafik shu yerda ko‘rinadi.", "The chart will appear when daily records arrive.", "График появится после поступления ежедневных данных.")}</p>}</section>
    <section className="p-bi-card"><div className="p-bi-card-heading"><div><h3>{pick(lang, "Ko‘rish va harakatlar", "Views and actions", "Показы и действия")}</h3><p>{pick(lang, "Primio ichidagi mustaqil hisoblagichlar", "Independent counters inside Primio", "Независимые показатели внутри Primio")}</p></div><ArrowUpRight size={17}/></div><div className="p-bi-funnel">{metricCards.map(({ label, value }) => <div className="p-bi-funnel-row" key={label}><div><span>{label}</span><strong>{periodHasData ? format(value) : "—"}</strong></div><div className="p-bi-track"><span style={{ width: periodHasData && counts.impressions ? `${Math.max(value ? 3 : 0, Math.min(100, value / counts.impressions * 100))}%` : "0%" }}/></div></div>)}</div><p className="p-bi-funnel-note">{pick(lang, "Bosish ulushi", "Click-through rate", "Доля переходов")}: <b>{periodHasData ? rate(counts.clicks, counts.impressions) : "—"}</b> · {pick(lang, "loyiha sahifasi va tashqi bosish alohida hisoblanadi", "project views and outbound clicks are counted separately", "просмотры проекта и внешние клики считаются отдельно")}</p></section></div>
    <section className="p-bi-card p-bi-campaigns"><div className="p-bi-card-heading"><div><h3>{pick(lang, "Reklamalar kesimida", "Campaign breakdown", "По объявлениям")}</h3><p>{pick(lang, "Tanlangan davr va reklama bo‘yicha solishtiring", "Compare the selected period and campaign", "Сравнение за выбранный период")}</p></div><span>{campaignRows.length} {pick(lang, "ta reklama", "campaigns", "объявлений")}</span></div>{campaignRows.length ? <div className="p-table-scroll"><table className="p-table p-bi-table"><thead><tr><th>{pick(lang, "Reklama", "Campaign", "Объявление")}</th><th>{pick(lang, "Ko‘rish", "Impressions", "Показы")}</th><th>{pick(lang, "Loyiha", "Project", "Проект")}</th><th>{pick(lang, "Bosish", "Clicks", "Клики")}</th><th>CTR</th><th>{pick(lang, "Sof to‘lov", "Net paid", "Чистая оплата")}</th></tr></thead><tbody>{campaignRows.map(({ ad, impressions, profileViews, clicks, hasData }) => <tr key={ad.id}><td><strong>{ad.title}</strong><small>{statusCopy[adStatus(ad, now)]}</small></td><td>{hasData ? format(impressions) : "—"}</td><td>{hasData ? format(profileViews) : "—"}</td><td>{hasData ? format(clicks) : "—"}</td><td>{hasData ? rate(clicks, impressions) : "—"}</td><td>{money(transactions.filter(tx => tx.adId === ad.id && (period === "all" || (dateKey(milliseconds(tx.createdAt)) >= start && dateKey(milliseconds(tx.createdAt)) <= end))).reduce((total, tx) => total + (tx.type === "refund" ? -tx.amountCents : tx.amountCents), 0))}</td></tr>)}</tbody></table></div> : <p className="p-bi-empty">{pick(lang, "Hali reklama yo‘q. Birinchi reklamani yaratgach tahlil shu yerda boshlanadi.", "No campaigns yet. Your analysis starts here after you create one.", "Объявлений пока нет. Аналитика появится после создания первого.")}</p>}</section>
  </section>;
}
