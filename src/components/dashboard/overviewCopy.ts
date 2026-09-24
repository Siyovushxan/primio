// Copy for the dashboard "Overview" screen and the shared ad status/actions (uz / en / ru).

import type { UiLang } from "@/lib/categoryNames";

const uz = {
  label: "Umumiy holat",
  hello: (name: string) => `Salom, ${name}`,
  summary: (live: number, attention: number) =>
    `${live} ta reklama jonli · ${attention === 0 ? "hammasi joyida" : `${attention} ta holat e'tibor talab qiladi`}`,
  create: "Reklama berish",
  kpi: { views: "Ko'rilishlar", clicks: "Bosishlar", ctr: "CTR", paid: "To'langan summa" },
  kpiHint: { views: "Barcha vaqt", clicks: "Saytga o'tishlar", ctr: "Bosish ÷ ko'rilish", paid: "Barcha to'lovlar" },

  attentionTitle: "E'tibor talab qiladi",
  allGood: "Hammasi joyida — hozircha hech narsa kutmayapti.",
  att: {
    pay: { title: "To'lov kutilmoqda", body: (t: string, total: string) => `${t} · jami ${total}` },
    expiring: { title: "Muddati tugayapti", body: (t: string, d: number) => `${t} · ${d} kun qoldi` },
    outranked: {
      title: (pos: number) => `Toifada #${pos}`,
      body: (t: string, bid: string, extra: string) => `${t} · bir pog'ona yuqoriga: ${bid}/kun (+${extra})`,
    },
    expired: { title: "Muddati tugagan", body: (t: string) => `${t} · katalogda ko'rinmayapti` },
    rejected: { title: "Rad etilgan", body: (t: string) => `${t} · tahrirlab qayta yuboring` },
    review: { title: "Faollashtirilmoqda", body: (t: string) => `${t} · to'langan, tez orada jonli bo'ladi` },
    paymentReview: { title: "To'lov ko'rib chiqilmoqda", body: (amount: string) => `${amount} — jamoamiz siz bilan bog'lanadi` },
  },

  myAdsTitle: "Reklamalarim",
  seeAll: "Barchasi",
  noAds: "Hali reklama yo'q. Birinchi reklamangizni yarating — to'lov faqat AI tekshiruvidan keyin.",
  ends: "Tugaydi",
  perDay: "/kun",
  daysUnit: "kun",

  competitionTitle: "Raqobat",
  competitionEmpty: "Faol reklama yo'q. Reklama jonli bo'lgach, bu yerda toifadagi o'rningiz va yuqoriga chiqish narxi ko'rinadi.",
  rankOf: (pos: number, size: number, cat: string) => `${cat}: ${size} ta ichida #${pos}`,
  leading: (lead: string | null) => (lead ? `1-o'rindasiz, #2 dan ${lead}/kun oldinda` : "1-o'rindasiz — toifada raqib yo'q"),
  toNext: (bid: string) => `Bir pog'ona yuqoriga: ${bid}/kun`,
  extra: (amount: string, days: number) => `Qo'shimcha to'lov: ${amount} (${days} kun uchun)`,

  chartTitle: "Natijalar grafigi",
  chartEmpty: "Kunlik statistika yig'ilmoqda. Reklamangiz ko'rila boshlagach, grafik shu yerda paydo bo'ladi.",
  chartViews: "Ko'rilish",
  chartClicks: "Bosish",
  days7: "7 kun",
  days30: "30 kun",

  status: { active: "Faol", pending: "To'lov kutilmoqda", pending_verification: "Faollashtirilmoqda", expired: "Muddati tugagan", rejected: "Rad etilgan" },
  action: { pay: "To'lash", raise: "Taklifni oshirish", renew: "Uzaytirish", edit: "Tahrirlash", view: "Ko'rish" },
  nav: { overview: "Umumiy holat", myads: "Reklamalarim", ranking: "Reyting", wallet: "To'lovlar", profile: "Sozlamalar" },
  navShort: { overview: "Holat", myads: "Reklamalar", ranking: "Reyting", wallet: "To'lovlar", create: "Yangi" },
  rankingTabs: { list: "Reyting", cats: "Toifalar" },
};

type OverviewCopy = typeof uz;

const en: OverviewCopy = {
  label: "Overview",
  hello: (name: string) => `Hello, ${name}`,
  summary: (live: number, attention: number) =>
    `${live} ad${live === 1 ? "" : "s"} live · ${attention === 0 ? "all good" : `${attention} item${attention === 1 ? "" : "s"} need attention`}`,
  create: "Place ad",
  kpi: { views: "Views", clicks: "Clicks", ctr: "CTR", paid: "Amount paid" },
  kpiHint: { views: "All time", clicks: "Visits to your site", ctr: "Clicks ÷ views", paid: "All payments" },

  attentionTitle: "Needs attention",
  allGood: "All good — nothing is waiting on you right now.",
  att: {
    pay: { title: "Awaiting payment", body: (t: string, total: string) => `${t} · total ${total}` },
    expiring: { title: "Ending soon", body: (t: string, d: number) => `${t} · ${d} day${d === 1 ? "" : "s"} left` },
    outranked: {
      title: (pos: number) => `#${pos} in category`,
      body: (t: string, bid: string, extra: string) => `${t} · one place up: ${bid}/day (+${extra})`,
    },
    expired: { title: "Period ended", body: (t: string) => `${t} · not shown in the catalog` },
    rejected: { title: "Rejected", body: (t: string) => `${t} · edit and resubmit` },
    review: { title: "Activating", body: (t: string) => `${t} · paid, going live shortly` },
    paymentReview: { title: "Payment under review", body: (amount: string) => `${amount} — our team will contact you` },
  },

  myAdsTitle: "My ads",
  seeAll: "See all",
  noAds: "No ads yet. Create your first one — payment only after AI review.",
  ends: "Ends",
  perDay: "/day",
  daysUnit: "days",

  competitionTitle: "Competition",
  competitionEmpty: "No live ads. Once an ad is live, its category rank and the price of moving up show here.",
  rankOf: (pos: number, size: number, cat: string) => `${cat}: #${pos} of ${size}`,
  leading: (lead: string | null) => (lead ? `You're #1, ${lead}/day ahead of #2` : "You're #1 — no competitors yet"),
  toNext: (bid: string) => `One place up: ${bid}/day`,
  extra: (amount: string, days: number) => `Extra payment: ${amount} (for ${days} days)`,

  chartTitle: "Results chart",
  chartEmpty: "Daily stats are being collected. The chart appears here once your ad starts getting views.",
  chartViews: "Views",
  chartClicks: "Clicks",
  days7: "7 days",
  days30: "30 days",

  status: { active: "Active", pending: "Awaiting payment", pending_verification: "Activating", expired: "Ended", rejected: "Rejected" },
  action: { pay: "Pay", raise: "Raise bid", renew: "Extend", edit: "Edit", view: "View" },
  nav: { overview: "Overview", myads: "My ads", ranking: "Ranking", wallet: "Payments", profile: "Settings" },
  navShort: { overview: "Overview", myads: "Ads", ranking: "Ranking", wallet: "Payments", create: "New" },
  rankingTabs: { list: "Ranking", cats: "Categories" },
};

const ru: OverviewCopy = {
  label: "Общее состояние",
  hello: (name: string) => `Здравствуйте, ${name}`,
  summary: (live: number, attention: number) =>
    `В эфире: ${live} · ${attention === 0 ? "всё в порядке" : `требуют внимания: ${attention}`}`,
  create: "Разместить",
  kpi: { views: "Показы", clicks: "Клики", ctr: "CTR", paid: "Оплачено" },
  kpiHint: { views: "За всё время", clicks: "Переходы на сайт", ctr: "Клики ÷ показы", paid: "Все платежи" },

  attentionTitle: "Требует внимания",
  allGood: "Всё в порядке — сейчас ничего не ждёт вашего действия.",
  att: {
    pay: { title: "Ожидает оплаты", body: (t: string, total: string) => `${t} · итого ${total}` },
    expiring: { title: "Срок заканчивается", body: (t: string, d: number) => `${t} · осталось дней: ${d}` },
    outranked: {
      title: (pos: number) => `#${pos} в категории`,
      body: (t: string, bid: string, extra: string) => `${t} · на место выше: ${bid}/день (+${extra})`,
    },
    expired: { title: "Срок истёк", body: (t: string) => `${t} · не показывается в каталоге` },
    rejected: { title: "Отклонено", body: (t: string) => `${t} · исправьте и отправьте снова` },
    review: { title: "Активируется", body: (t: string) => `${t} · оплачено, скоро в эфире` },
    paymentReview: { title: "Платёж на проверке", body: (amount: string) => `${amount} — наша команда свяжется с вами` },
  },

  myAdsTitle: "Мои объявления",
  seeAll: "Все",
  noAds: "Объявлений пока нет. Создайте первое — оплата только после AI-проверки.",
  ends: "До",
  perDay: "/день",
  daysUnit: "дн.",

  competitionTitle: "Конкуренция",
  competitionEmpty: "Нет активных объявлений. Когда реклама выйдет в эфир, здесь появятся место в категории и цена подъёма.",
  rankOf: (pos: number, size: number, cat: string) => `${cat}: #${pos} из ${size}`,
  leading: (lead: string | null) => (lead ? `Вы на 1-м месте, опережаете #2 на ${lead}/день` : "Вы на 1-м месте — конкурентов пока нет"),
  toNext: (bid: string) => `На место выше: ${bid}/день`,
  extra: (amount: string, days: number) => `Доплата: ${amount} (за ${days} дн.)`,

  chartTitle: "График результатов",
  chartEmpty: "Дневная статистика собирается. График появится, когда объявление начнут просматривать.",
  chartViews: "Показы",
  chartClicks: "Клики",
  days7: "7 дней",
  days30: "30 дней",

  status: { active: "Активно", pending: "Ожидает оплаты", pending_verification: "Активируется", expired: "Срок истёк", rejected: "Отклонено" },
  action: { pay: "Оплатить", raise: "Повысить ставку", renew: "Продлить", edit: "Изменить", view: "Открыть" },
  nav: { overview: "Общее состояние", myads: "Мои объявления", ranking: "Рейтинг", wallet: "Платежи", profile: "Настройки" },
  navShort: { overview: "Обзор", myads: "Объявления", ranking: "Рейтинг", wallet: "Платежи", create: "Создать" },
  rankingTabs: { list: "Рейтинг", cats: "Категории" },
};

export const OVERVIEW_COPY: Record<UiLang, OverviewCopy> = { uz, en, ru };
export type { OverviewCopy };
