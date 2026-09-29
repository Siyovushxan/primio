"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BarChart3, CheckCircle2, ExternalLink, Globe2, Link2, LoaderCircle, LockKeyhole, RefreshCw, ShieldCheck, Sparkles, Unplug } from "lucide-react";
import type { User as FirebaseUser } from "firebase/auth";
import type { Ad } from "@/types";
import type { Lang } from "@/lib/i18n";
import { pick } from "./shared";

type Connection = { configured: boolean; connected: boolean; propertyId: string | null; propertyName: string | null; timezone: string | null };
type Property = { propertyId: string; displayName: string };
type Report = {
  source: string; propertyName: string; range: { startDate: string; endDate: string }; fetchedAt: string; timezone: string;
  metrics: { activeUsers: number | null; newUsers: number | null; pageViews: number | null; sessions: number | null; clickEvents: number | null };
  countries: Array<{ country: string; activeUsers: number }>;
  daily: Array<{ date: string; activeUsers: number; pageViews: number; sessions: number }>;
  notes: string[];
};
type DomainInfo = { available: boolean; domain?: string; registeredAt?: string; source?: string; checkedAt?: string; note?: string; reason?: string };

const SOCIAL_HOSTS = ["instagram.com", "tiktok.com", "youtube.com", "youtu.be", "facebook.com", "fb.com", "t.me", "telegram.me", "telegram.org", "linkedin.com", "x.com", "twitter.com", "wa.me"];

function websiteAd(ad: Ad) {
  if (!ad.destinationURL) return false;
  try {
    const host = new URL(ad.destinationURL).hostname.toLowerCase().replace(/^www\./, "");
    return !SOCIAL_HOSTS.some(social => host === social || host.endsWith(`.${social}`));
  } catch { return false; }
}

async function authorizedRequest(user: FirebaseUser, path: string, init: RequestInit = {}) {
  const token = await user.getIdToken();
  const response = await fetch(path, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "analytics_unavailable");
  return data;
}

function errorCopy(error: unknown, lang: Lang): string {
  const code = error instanceof Error ? error.message : "";
  const known: Record<string, [string, string, string]> = {
    google_analytics_not_configured: ["Google Analytics ulanishi hali sozlanmagan.", "Google Analytics connection is not configured yet.", "Подключение Google Analytics пока не настроено."],
    google_analytics_not_connected: ["Google Analytics ulanmagan.", "Google Analytics is not connected.", "Google Analytics не подключена."],
    analytics_property_required: ["Avval tahlil qilinadigan saytni tanlang.", "Choose a website to analyze first.", "Сначала выберите сайт для анализа."],
    analytics_property_not_authorized: ["Bu saytga Google hisobingizdan ruxsat yo‘q.", "Your Google account cannot access this property.", "У вашего аккаунта Google нет доступа к этому ресурсу."],
    google_analytics_reconnect_required: ["Ruxsat muddati tugagan. Google Analytics’ni qayta ulang.", "Access expired. Reconnect Google Analytics.", "Срок доступа истёк. Подключите Google Analytics заново."],
    google_analytics_permission_required: ["Google Analytics ruxsatini tekshiring yoki qayta ulang.", "Check your Google Analytics access or reconnect it.", "Проверьте доступ к Google Analytics или подключите её заново."],
    google_analytics_rate_limited: ["Google so‘rovlari vaqtincha cheklangan. Birozdan keyin urinib ko‘ring.", "Google temporarily limited requests. Try again shortly.", "Google временно ограничила запросы. Попробуйте позже."],
    analytics_unavailable: ["Ma’lumotni yuklab bo‘lmadi. Qayta urinib ko‘ring.", "Could not load the data. Please retry.", "Не удалось загрузить данные. Попробуйте ещё раз."],
    analytics_report_no_data: ["Bu davr uchun Google Analytics’da ko‘rsatkich topilmadi.", "Google Analytics has no reportable data for this period.", "В Google Analytics нет данных за этот период."],
    analytics_date_range_invalid: ["Sanalarni tekshiring. Oralig‘i 90 kundan oshmasin.", "Check the dates. The range must be 90 days or less.", "Проверьте даты. Период не должен превышать 90 дней."],
    analytics_insight_daily_limit: ["Bugungi AI tahlil limiti tugadi. Ertaga qayta urinib ko‘ring.", "Today's AI analysis limit is reached. Try again tomorrow.", "Дневной лимит AI-анализа исчерпан. Попробуйте завтра."],
    analytics_insight_unavailable: ["AI xulosasi hozircha ishlamayapti.", "AI summary is temporarily unavailable.", "AI-анализ временно недоступен."],
    analytics_insight_consent_required: ["AI tahlilidan oldin rozilikni belgilang.", "Please confirm before requesting AI analysis.", "Подтвердите согласие перед AI-анализом."],
  };
  return pick(lang, ...(known[code] || known.analytics_unavailable));
}

function fmt(value: number | null, lang: Lang) {
  return value === null ? pick(lang, "Ma’lumot yo‘q", "No data", "Нет данных") : value.toLocaleString(lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US");
}

export default function ProjectInsights({ lang, firebaseUser, ads, demo = false, showPrimioSource = true }: { lang: Lang; firebaseUser: FirebaseUser | null; ads: Ad[]; demo?: boolean; showPrimioSource?: boolean }) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [period, setPeriod] = useState("7d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [consent, setConsent] = useState(false);
  const [insight, setInsight] = useState("");
  const [domain, setDomain] = useState<DomainInfo | null>(null);
  const [selectedDomainAdId, setSelectedDomainAdId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const locale = lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US";
  const totals = useMemo(() => ads.reduce((result, ad) => ({
    impressions: result.impressions + (ad.impressions || 0),
    profileViews: result.profileViews + (ad.profileViews || 0),
    clicks: result.clicks + (ad.clicks || 0),
  }), { impressions: 0, profileViews: 0, clicks: 0 }), [ads]);
  const domainAds = useMemo(() => ads.filter(websiteAd), [ads]);
  const selectedDomainAd = domainAds.find(ad => ad.id === selectedDomainAdId) || domainAds[0];

  useEffect(() => {
    if (demo || !firebaseUser) return;
    let active = true;
    authorizedRequest(firebaseUser, "/api/analytics/google/status").then(data => { if (active) setConnection(data as Connection); })
      .catch(cause => { if (active) setError(errorCopy(cause, lang)); });
    return () => { active = false; };
  }, [demo, firebaseUser, lang, refreshKey]);

  useEffect(() => {
    if (!firebaseUser || demo || !connection?.connected) return;
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setLoading(true);
      authorizedRequest(firebaseUser, "/api/analytics/google/properties").then(data => { if (active) setProperties(data.properties || []); })
        .catch(cause => { if (active) setError(errorCopy(cause, lang)); })
        .finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [connection?.connected, demo, firebaseUser, lang, refreshKey]);

  useEffect(() => {
    if (!firebaseUser || demo || !connection?.connected || !connection.propertyId) return;
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setLoading(true); setError("");
      const query = new URLSearchParams({ range: period });
      if (period === "custom") { query.set("startDate", startDate); query.set("endDate", endDate); }
      authorizedRequest(firebaseUser, `/api/analytics/google/report?${query.toString()}`).then(data => { if (active) setReport(data as Report); })
        .catch(cause => { if (active) { setReport(null); setError(errorCopy(cause, lang)); } })
        .finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [connection, demo, endDate, firebaseUser, lang, period, refreshKey, startDate]);

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("google");
    if (!result) return;
    const timer = window.setTimeout(() => {
      setNotice(result === "connected" ? pick(lang, "Google Analytics ulandi. Endi saytni tanlang.", "Google Analytics connected. Choose a website.", "Google Analytics подключена. Выберите сайт.") : pick(lang, "Google Analytics ulanmadi. Qayta urinib ko‘ring.", "Google Analytics was not connected. Please retry.", "Не удалось подключить Google Analytics. Попробуйте ещё раз."));
      window.history.replaceState({}, "", "/dashboard?view=overview");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [lang]);

  async function connect() {
    if (!firebaseUser) return;
    setBusy(true); setError(""); setReport(null);
    try { const data = await authorizedRequest(firebaseUser, "/api/analytics/google/connect", { method: "POST", body: "{}" }); window.location.assign(data.url); }
    catch (cause) { setError(errorCopy(cause, lang)); setBusy(false); }
  }

  async function selectProperty(propertyId: string) {
    if (!firebaseUser || !propertyId) return;
    setBusy(true); setError("");
    try {
      await authorizedRequest(firebaseUser, "/api/analytics/google/property", { method: "POST", body: JSON.stringify({ propertyId }) });
      const data = await authorizedRequest(firebaseUser, "/api/analytics/google/status"); setConnection(data as Connection); setNotice(pick(lang, "Sayt tanlandi.", "Website selected.", "Сайт выбран."));
    } catch (cause) { setError(errorCopy(cause, lang)); }
    finally { setBusy(false); }
  }

  async function disconnect() {
    if (!firebaseUser) return;
    setBusy(true); setError("");
    try { await authorizedRequest(firebaseUser, "/api/analytics/google/disconnect", { method: "DELETE" }); setConnection(value => value ? { ...value, connected: false, propertyId: null, propertyName: null, timezone: null } : value); setProperties([]); setReport(null); setNotice(pick(lang, "Google Analytics uzildi.", "Google Analytics disconnected.", "Google Analytics отключена.")); }
    catch (cause) { setError(errorCopy(cause, lang)); }
    finally { setBusy(false); }
  }

  async function checkDomain() {
    const ad = selectedDomainAd;
    if (!ad || !firebaseUser) return;
    setBusy(true); setError(""); setDomain(null);
    try { setDomain(await authorizedRequest(firebaseUser, `/api/analytics/domain?adId=${encodeURIComponent(ad.id)}`) as DomainInfo); }
    catch (cause) { setError(errorCopy(cause, lang)); }
    finally { setBusy(false); }
  }

  async function generateInsight() {
    if (!firebaseUser || !consent) return;
    setBusy(true); setError(""); setInsight("");
    try {
      const body: Record<string, unknown> = { consent: true, range: period };
      if (period === "custom") { body.startDate = startDate; body.endDate = endDate; }
      const data = await authorizedRequest(firebaseUser, "/api/analytics/insights", { method: "POST", body: JSON.stringify(body) }); setInsight(data.text);
    }
    catch (cause) { setError(errorCopy(cause, lang)); }
    finally { setBusy(false); }
  }

  const metricCards = report ? [
    [pick(lang, "Faol foydalanuvchilar", "Active users", "Активные пользователи"), report.metrics.activeUsers],
    [pick(lang, "Yangi foydalanuvchilar", "New users", "Новые пользователи"), report.metrics.newUsers],
    [pick(lang, "Sahifa ko‘rilishlari", "Page views", "Просмотры страниц"), report.metrics.pageViews],
    [pick(lang, "Sessiyalar", "Sessions", "Сеансы"), report.metrics.sessions],
    [pick(lang, "Click hodisalari", "Click events", "События клика"), report.metrics.clickEvents],
  ] as const : [];

  return <div className="p-project-insights">
    {showPrimioSource && <section className="p-panel p-insights-source"><div className="p-panel-heading"><div><h2>{pick(lang, "Primio’dagi reklama natijalari", "Results inside Primio", "Результаты в Primio")}</h2><p>{pick(lang, "Faqat Primio ichidagi ko‘rish va bosishlar · jami", "Views and clicks inside Primio only · all time", "Просмотры и клики только внутри Primio · всего")}</p></div><BarChart3 size={19}/></div><div className="p-metric-grid p-insights-metrics">{[
      [pick(lang, "Reklama kartasi ko‘rilishi", "Ad card impressions", "Показы карточки"), totals.impressions],
      [pick(lang, "Loyiha sahifasi ochilishi", "Project page views", "Просмотры страницы проекта"), totals.profileViews],
      [pick(lang, "Tashqi havolaga bosish", "Clicks to your link", "Переходы по ссылке"), totals.clicks],
    ].map(([label, value]) => <article className="p-metric-card" key={label}><div className="p-metric-top"><span>{label}</span><ExternalLink/></div><strong className="p-metric-value">{Number(value).toLocaleString(locale)}</strong><small>{pick(lang, "Manba: Primio · biznes saytidagi tashrif emas", "Source: Primio · not visits on your own website", "Источник: Primio · это не посещения вашего сайта")}</small></article>)}</div></section>}

    <section className="p-panel"><div className="p-panel-heading"><div><h2>{pick(lang, "Saytingiz tahlili", "Your website analytics", "Аналитика вашего сайта")}</h2><p>{pick(lang, "Manba: Google Analytics 4 · faqat o‘qish ruxsati", "Source: Google Analytics 4 · read-only access", "Источник: Google Analytics 4 · доступ только для чтения")}</p></div><ShieldCheck size={19}/></div>
      {demo ? <div className="p-insights-empty"><LockKeyhole size={25}/><b>{pick(lang, "Haqiqiy sayt statistikasi demo hisobda ulanmaydi.", "Real website data is not connected in the demo.", "Статистика реального сайта в демо не подключена.")}</b><p>{pick(lang, "Hisob yarating va o‘zingiz kira oladigan Google Analytics saytini ulang.", "Create an account and connect a Google Analytics property you can access.", "Создайте аккаунт и подключите Google Analytics, к которой у вас есть доступ.")}</p><a className="p-btn p-btn-primary" href="/auth">{pick(lang, "Boshlash", "Get started", "Начать")}<ArrowUpRight size={15}/></a></div>
      : !connection ? <div className="p-insights-empty"><LoaderCircle className="p-spin" size={22}/>{pick(lang, "Ulanish holati yuklanmoqda…", "Checking connection…", "Проверяем подключение…")}</div>
      : !connection.configured ? <div className="p-insights-empty"><Link2 size={25}/><b>{pick(lang, "Google Analytics hali ulanmagan.", "Google Analytics is not connected yet.", "Google Analytics пока не подключена.")}</b><p>{pick(lang, "Hozir Primio ichidagi ko‘rish va bosishlar ishlaydi. Saytingiz statistikasi uchun avval Primio egasi Google ulanishini sozlashi kerak. Sozlangach, bu yerda “Google Analytics’ni ulash” tugmasi chiqadi.", "Views and clicks inside Primio are available now. To show your website statistics, the Primio owner must first configure the Google connection. After that, a “Connect Google Analytics” button will appear here.", "Просмотры и клики внутри Primio доступны. Чтобы видеть статистику сайта, владелец Primio должен настроить подключение Google. После этого здесь появится кнопка подключения Google Analytics.")}</p></div>
      : !connection.connected ? <div className="p-insights-empty"><Globe2 size={25}/><b>{pick(lang, "Saytingizdagi tashriflarni ko‘rish uchun Google Analytics’ni ulang.", "Connect Google Analytics to view visits on your website.", "Подключите Google Analytics, чтобы видеть посещения сайта.")}</b><p>{pick(lang, "Google parolingiz Primio’ga berilmaydi. Ruxsatni istalgan payt uzishingiz mumkin.", "Primio never receives your Google password. You can disconnect access at any time.", "Primio не получает пароль Google. Вы можете отключить доступ в любой момент.")}</p><button className="p-btn p-btn-primary" disabled={busy} onClick={connect}>{busy?pick(lang,"Ulanmoqda…","Connecting…","Подключение…"):pick(lang,"Google Analytics’ni ulash","Connect Google Analytics","Подключить Google Analytics")}<ArrowUpRight size={15}/></button></div>
      : <>
        <div className="p-insights-controls"><label className="p-field">{pick(lang, "Google Analytics sayti", "Google Analytics property", "Ресурс Google Analytics")}<select value={connection.propertyId || ""} onChange={event => selectProperty(event.target.value)} disabled={busy || loading}><option value="">{pick(lang, "Saytni tanlang…", "Choose a website…", "Выберите сайт…")}</option>{properties.map(property => <option key={property.propertyId} value={property.propertyId}>{property.displayName}</option>)}</select><small>{pick(lang, "Siz kira oladigan saytlar ro‘yxati", "Properties your Google account can access", "Ресурсы, доступные вашему аккаунту Google")}</small></label><button className="p-text-link" disabled={busy} onClick={disconnect}><Unplug size={15}/>{pick(lang, "Ulanishni uzish", "Disconnect", "Отключить")}</button></div>
        {connection.propertyId && <>
          <div className="p-insights-period"><label className="p-field">{pick(lang, "Ko‘rsatish davri", "Reporting period", "Период отчёта")}<select value={period} onChange={event => { setReport(null); setPeriod(event.target.value); }}><option value="today">{pick(lang, "Bugun", "Today", "Сегодня")}</option><option value="yesterday">{pick(lang, "Kecha", "Yesterday", "Вчера")}</option><option value="7d">{pick(lang, "Oxirgi 7 kun", "Last 7 days", "Последние 7 дней")}</option><option value="30d">{pick(lang, "Oxirgi 30 kun", "Last 30 days", "Последние 30 дней")}</option><option value="custom">{pick(lang, "Sanalarni tanlash", "Choose dates", "Выбрать даты")}</option></select></label>{period==="custom"&&<><label className="p-field">{pick(lang, "Dan", "From", "С") }<input type="date" value={startDate} onChange={event=>{setReport(null);setStartDate(event.target.value);}}/></label><label className="p-field">{pick(lang, "Gacha", "To", "По") }<input type="date" value={endDate} onChange={event=>{setReport(null);setEndDate(event.target.value);}}/></label></>}</div>
          {loading&&!report?<div className="p-insights-empty"><LoaderCircle className="p-spin" size={22}/>{pick(lang, "Sayt statistikasi yuklanmoqda…", "Loading website metrics…", "Загружаем аналитику сайта…")}</div>:error?<div className="p-insights-empty"><p role="alert">{error}</p><button className="p-btn p-btn-secondary" onClick={()=>{setError("");setRefreshKey(value=>value+1);}}><RefreshCw size={15}/>{pick(lang, "Qayta yuklash", "Retry", "Повторить")}</button></div>:report&&<>
            <div className="p-insights-meta"><span><CheckCircle2 size={14}/>{report.source} · {report.propertyName}</span><span>{report.range.startDate} — {report.range.endDate} · {report.timezone}</span><span>{pick(lang, "Yangilandi", "Updated", "Обновлено")}: {new Date(report.fetchedAt).toLocaleString(locale)}</span></div>
            <div className="p-metric-grid p-insights-metrics">{metricCards.map(([label,value])=><article className="p-metric-card" key={label}><div className="p-metric-top"><span>{label}</span><Globe2/></div><strong className="p-metric-value">{fmt(value,lang)}</strong><small>{report.range.startDate} — {report.range.endDate} · {report.source}</small></article>)}</div>
            <div className="p-insights-columns"><section className="p-insights-subpanel"><h3>{pick(lang,"Qaysi davlatlardan?", "Visitors by country", "Посетители по странам")}</h3>{report.countries.length?<ul className="p-country-list">{report.countries.map((item,index)=><li key={item.country}><span>{index+1}. {item.country}</span><strong>{item.activeUsers.toLocaleString(locale)}</strong></li>)}</ul>:<p className="p-muted">{pick(lang,"Bu davr uchun davlat ma’lumoti yo‘q.","No country data for this period.","Нет данных о странах за этот период.")}</p>}</section><section className="p-insights-subpanel"><h3>{pick(lang,"Kunlar bo‘yicha", "By day", "По дням")}</h3>{report.daily.length?<div className="p-table-scroll"><table className="p-table"><thead><tr><th>{pick(lang,"Sana","Date","Дата")}</th><th>{pick(lang,"Faol","Active","Активные")}</th><th>{pick(lang,"Sahifa ko‘rish","Page views","Просмотры")}</th><th>{pick(lang,"Sessiya","Sessions","Сеансы")}</th></tr></thead><tbody>{report.daily.slice(-14).map(day=><tr key={day.date}><td>{day.date}</td><td>{day.activeUsers.toLocaleString(locale)}</td><td>{day.pageViews.toLocaleString(locale)}</td><td>{day.sessions.toLocaleString(locale)}</td></tr>)}</tbody></table></div>:<p className="p-muted">{pick(lang,"Bu davr uchun kunlik ma’lumot yo‘q.","No daily data for this period.","Нет ежедневных данных за этот период.")}</p>}</section></div>
            <details className="p-insights-notes"><summary>{pick(lang,"Bu raqamlar nimani anglatadi?", "About these numbers", "Что означают эти показатели?")}</summary><ul>{report.notes.map(note=><li key={note}>{note}</li>)}</ul><p>{pick(lang, "Yosh guruhlari va ro‘yxatdan o‘tgan hisoblar Google Analytics’dan olinmadi.", "Age groups and registered accounts are not provided by this Google Analytics report.", "Возраст и количество регистраций этот отчёт Google Analytics не показывает.")}</p></details>
            <div className="p-ai-insight"><div className="p-panel-heading"><div><h3>{pick(lang,"Amaliy tahlil", "Practical summary", "Практический анализ")}</h3><p>{pick(lang,"Faqat raqamlar asosida · natija kafolatlanmaydi", "Based on the numbers only · no guaranteed outcomes", "Только по данным · без гарантии результата")}</p></div><Sparkles size={17}/></div><label className="p-ai-consent"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)}/><span>{pick(lang,"Ushbu davrning umumiy sonlari va davlatlar bo‘yicha yig‘ma ko‘rsatkichlari xAI xizmatiga tahlil uchun yuborilishiga roziman. Sayt manzili va shaxsiy ma’lumotlar yuborilmaydi.","I agree to send this period’s aggregate counts and country totals to xAI for analysis. The website address and personal data are not sent.","Я согласен отправить в xAI только общие показатели за период и сводку по странам. Адрес сайта и личные данные не отправляются.")}</span></label><button className="p-btn p-btn-secondary" disabled={busy||!consent} onClick={generateInsight}>{busy?pick(lang,"Tahlil qilinmoqda…","Analyzing…","Анализируем…"):pick(lang,"AI xulosasini olish","Get AI summary","Получить AI-анализ")}<Sparkles size={15}/></button>{insight&&<p className="p-ai-insight-text" role="status">{insight}</p>}</div>
          </>}
        </>}
      </>}
    </section>

    <section className="p-panel"><div className="p-panel-heading"><div><h2>{pick(lang, "Domen qachon ro‘yxatdan o‘tgan?", "When was this domain registered?", "Когда зарегистрирован домен?")}</h2><p>{pick(lang, "Rasmiy domen qaydi · loyiha ishga tushgan sana bilan bir xil emas", "Registry record · not the date the business launched", "Запись реестра · не дата запуска проекта")}</p></div><Globe2 size={19}/></div>{domainAds.length?<div className="p-domain-action"><p>{pick(lang,"Sayt havolasini tanlang — Primio rasmiy domen qayd sanasini tekshiradi. Ijtimoiy tarmoq havolalari bu yerda tekshirilmaydi.","Choose a website link and Primio will check its public domain registration date. Social links cannot be checked here.","Выберите ссылку на сайт — Primio проверит открытую дату регистрации домена. Ссылки на соцсети здесь не проверяются.")}</p>{domainAds.length>1&&<label className="p-field">{pick(lang,"Sayt yoki loyiha","Website or project","Сайт или проект")}<select aria-label={pick(lang,"Sayt yoki loyiha","Website or project","Сайт или проект")} value={selectedDomainAd?.id||""} onChange={event=>{setSelectedDomainAdId(event.target.value);setDomain(null);}}>{domainAds.map(ad=><option key={ad.id} value={ad.id}>{ad.title} — {new URL(ad.destinationURL).hostname}</option>)}</select></label>}<button className="p-btn p-btn-secondary" disabled={busy||!selectedDomainAd} onClick={checkDomain}>{busy?pick(lang,"Tekshirilmoqda…","Checking…","Проверяем…"):pick(lang,"Domen sanasini tekshirish","Check domain date","Проверить дату домена")}<Globe2 size={15}/></button>{domain&&(domain.available?<div className="p-domain-result"><b>{domain.domain}</b><strong>{new Date(domain.registeredAt!).toLocaleDateString(locale,{year:"numeric",month:"long",day:"numeric",timeZone:"UTC"})}</strong><small>{domain.source} · {domain.note}</small></div>:<p className="p-muted" role="status">{domain.reason==="no_website_domain"?pick(lang,"Bu havolada alohida sayt domeni yo‘q.","This link has no separate website domain.","В этой ссылке нет отдельного домена сайта."):domain.reason==="registration_not_found"?pick(lang,"Domen qaydi topilmadi.","No domain registration record was found.","Запись о регистрации домена не найдена."):pick(lang,"Ro‘yxat sanasini hozir aniqlab bo‘lmadi.","The registration date could not be determined.","Не удалось определить дату регистрации.")}</p>)}</div>:<div className="p-insights-empty"><Globe2 size={22}/><div><b>{ads.some(ad=>ad.destinationURL)?pick(lang,"Sayt manzili topilmadi.","No website link found.","Ссылка на сайт не найдена."):pick(lang,"Sayt havolasi qo‘shilmagan.","No website link added yet.","Ссылка на сайт пока не добавлена.")}</b><p>{pick(lang,"Ijtimoiy tarmoq havolasi domen ro‘yxatdan o‘tgan sanani ko‘rsatmaydi. Reklamangizga o‘z saytingiz havolasini qo‘shing.","A social profile does not show a domain registration date. Add your website link to an ad.","Профиль соцсети не показывает дату регистрации домена. Добавьте ссылку на свой сайт в рекламу.")}</p></div></div>}</section>
    {notice&&<p className="p-insights-notice" role="status"><CheckCircle2 size={15}/>{notice}</p>}{error&&<div className="p-error" role="alert">{error}</div>}
  </div>;
}
