// Landing page copy (uz / en / ru). Numbers quoted here come from src/lib/adRules.ts.

export type LandingLang = "uz" | "en" | "ru";

const uz = {
  heroEyebrow: "Toifa ichidagi reklama reytingi",
  heroTitle: "Brendingizni kerakli toifada yuqoriga olib chiqing.",
  heroSub:
    "Primio — reklama katalogi. Har bir toifada reklamalar kunlik taklif bo'yicha tartiblanadi: taklif qancha yuqori bo'lsa, o'rin shuncha yuqori. Narxni o'zingiz belgilaysiz, natijani dashboardda ko'rasiz.",
  ctaPrimary: "Reklama joylashtirish",
  ctaSecondary: "Katalogni ko'rish",
  heroTrust: [
    "AI tekshiruvdan o'tmasa — to'lov so'ralmaydi",
    "Kuniga $1 dan",
    "Ko'rilish, bosish va CTR hisoblanadi",
  ],

  demoBadge: "Interaktiv namuna",
  demoCategory: "Ta'lim toifasi",
  demoNote: "Namuna ma'lumotlar — haqiqiy reklamalar emas",
  demoYou: "Sizning brendingiz",
  demoBidLabel: "Kunlik taklifingiz",
  demoDays: "Muddat",
  daysUnit: "kun",
  perDay: "/kun",
  demoDaily: "Kunlik narx",
  demoTotal: "Jami",
  demoPosition: "Toifadagi o'rningiz",
  demoToFirst: (usd: string) => `1-o'rin uchun: ${usd}/kun`,
  demoIsFirst: "Siz 1-o'rindasiz",

  benefitsLabel: "Nima beradi",
  benefitsTitle: "Mijoz izlayotgan joyda birinchi bo'ling",
  benefits: [
    { title: "Toifangizda ko'rinasiz", body: "Reklama umumiy oqimda yo'qolmaydi — mijoz aynan sizning yo'nalishingizni ko'rayotganda chiqadi." },
    { title: "Narxni o'zingiz boshqarasiz", body: "Kunlik taklifni o'zingiz qo'yasiz. Keyin oshirsangiz, faqat qolgan kunlar uchun farqni to'laysiz." },
    { title: "To'lovdan oldin tekshiruv", body: "Matn, havola va rasm AI tekshiruvidan o'tadi. O'tmasa — pul so'ralmaydi, tahrirlab qayta yuborasiz." },
    { title: "Natija o'lchanadi", body: "Ko'rilish, bosish, CTR va toifadagi o'rningiz dashboardda doim ko'rinib turadi." },
  ],

  howLabel: "Qanday ishlaydi",
  howTitle: "Yaratishdan natijagacha — 5 qadam",
  steps: [
    { title: "Reklama yaratasiz", body: "Sarlavha, sayt havolasi, rasm va toifa. Bir necha daqiqa." },
    { title: "AI tekshiruv", body: "Matn, havola va rasm tekshiriladi — odatda bir daqiqa ichida." },
    { title: "Taklif va muddat", body: "Kunlik taklif ($1 dan) va 1–365 kun. Jami = taklif × kunlar." },
    { title: "To'lov — va reklama jonli", body: "To'lov tasdiqlanishi bilan reklama chiqadi. Muddat shu paytdan hisoblanadi." },
    { title: "Kuzatasiz va boshqarasiz", body: "O'rningizni kuzatasiz, kerak bo'lsa taklifni oshirasiz yoki muddatni uzaytirasiz." },
  ],

  whereLabel: "Ochiq shartlar",
  whereTitle: "Reklamangiz qayerda chiqadi va nima sotib olasiz",
  where: [
    { title: "Qayerda chiqadi", body: "Primio katalogida — umumiy ro'yxatda va o'z toifangiz sahifasida. Kartochkada rasm, sarlavha, tavsif va saytingizga havola bo'ladi." },
    { title: "Nima sotib olasiz", body: "Tanlangan muddat davomida toifa reytingidagi o'rin. O'rin kunlik taklifingizga bog'liq: taklif teng bo'lsa, oldinroq faollashgan reklama yuqorida turadi." },
    { title: "Qanday o'lchanadi", body: "Ko'rilish — kartochkaning kamida yarmi ekranda 1 soniya tursa. Bosish — saytingizga o'tish. CTR = bosishlar ÷ ko'rilishlar." },
  ],
  whereNote: "Muhim: 1-o'rin ko'rinishda ustunlik beradi, lekin savdoni kafolatlamaydi. Savdo natijasi taklifingiz, narxingiz va saytingizga bog'liq — shuning uchun dashboardda o'rin va natijalar alohida ko'rsatiladi.",

  pricingLabel: "Toifalar va narx",
  pricingTitle: "Narxni hozir hisoblang",
  pricingSub: "Toifani tanlang — haqiqiy reytingga qarab qaysi o'ringa chiqishingizni ko'rasiz.",
  liveAds: "faol reklama",
  firstPlace: "1-o'rin",
  emptyCategory: "Bo'sh — $1 dan 1-o'rin",
  calcBid: "Kunlik taklif",
  calcDays: "Muddat",
  calcRank: "Kutilayotgan o'rin",
  calcTotal: "Jami to'lov",
  calcCta: "Shu shartlar bilan boshlash",
  calcHint: (usd: string) => `1-o'rin uchun kamida ${usd}/kun`,
  calcLoading: "Reyting yuklanmoqda…",

  dashLabel: "Dashboard",
  dashTitle: "Natijani tushunasiz va keyingi qarorni qabul qilasiz",
  dashPoints: [
    { title: "Umumiy holat", body: "Ko'rilish, bosish, CTR va to'langan summa bir joyda." },
    { title: "E'tibor talab qiladi", body: "Kimdir taklifingizdan oshsa, muddat tugayotgan bo'lsa yoki to'lov kutilsa — darhol ko'rasiz." },
    { title: "Raqobat", body: "Bir pog'ona yuqoriga chiqish uchun qancha taklif va qancha qo'shimcha to'lov kerakligi." },
    { title: "Kunlik grafik", body: "7 va 30 kunlik ko'rilish va bosishlar dinamikasi." },
  ],
  dashPreviewNote: "Dashboard ko'rinishi (namuna)",
  mockKpis: ["Ko'rilish", "Bosish", "CTR", "To'langan"],
  mockAttention: "Stavkangiz oshirib o'tildi — 1-o'rin uchun $6.50/kun",
  mockAction: "Taklifni oshirish",

  proofLabel: "Haqiqiy raqamlar",
  proofTitle: "Primio hozir",
  proofStats: { ads: "Faol reklama", cats: "Band toifalar", views: "Ko'rilish", clicks: "Bosish" },
  proofEmpty: "Platforma endi ishga tushmoqda — bo'sh toifada $1 dan 1-o'rinni egallang.",
  proofSource: "Katalogdagi faol reklamalar bo'yicha jonli hisob",

  faqLabel: "Savol-javob",
  faqTitle: "Ko'p beriladigan savollar",
  faq: [
    { q: "Reklamam qayerda ko'rinadi?", a: "Primio katalogida: umumiy ro'yxatda va tanlagan toifangiz sahifasida. Reklama faqat to'langan muddat davomida ko'rinadi." },
    { q: "Reyting qanday aniqlanadi?", a: "Kunlik taklif bo'yicha — kim ko'proq taklif qilsa, o'sha yuqorida. Taklif teng bo'lsa, oldinroq faollashgan reklama yuqorida turadi." },
    { q: "Taklifni keyin oshirsam bo'ladimi?", a: "Ha, istalgan vaqtda. Kamida $0.50 ga oshiriladi va faqat qolgan kunlar uchun farq to'lanadi." },
    { q: "AI tekshiruvdan o'tmasa nima bo'ladi?", a: "To'lov so'ralmaydi. Sababini ko'rasiz, reklamani tahrirlab qayta yuborasiz." },
    { q: "Muddat qachondan hisoblanadi?", a: "To'lov tasdiqlangan paytdan. Faol reklamani uzaytirsangiz, yangi kunlar joriy muddat oxiriga qo'shiladi." },
    { q: "Natijani qanday ko'raman?", a: "Dashboardda: ko'rilish, bosish, CTR, toifadagi o'rin va kunlik grafik." },
  ],

  finalTitle: "Toifangizda birinchi bo'lishni bugun boshlang",
  finalSub: "Reklama yaratish bepul. To'lov faqat AI tekshiruvidan keyin.",
};

type Copy = typeof uz;

const en: Copy = {
  heroEyebrow: "Category ad ranking",
  heroTitle: "Put your brand at the top of the right category.",
  heroSub:
    "Primio is an ad catalog. In every category, ads are ordered by daily bid: the higher your bid, the higher you rank. You set the price and see the results in your dashboard.",
  ctaPrimary: "Place an ad",
  ctaSecondary: "Browse the catalog",
  heroTrust: ["No payment unless AI review passes", "From $1 a day", "Views, clicks and CTR tracked"],

  demoBadge: "Interactive sample",
  demoCategory: "Education category",
  demoNote: "Sample data — not real ads",
  demoYou: "Your brand",
  demoBidLabel: "Your daily bid",
  demoDays: "Duration",
  daysUnit: "days",
  perDay: "/day",
  demoDaily: "Daily price",
  demoTotal: "Total",
  demoPosition: "Your rank in category",
  demoToFirst: (usd: string) => `For #1: ${usd}/day`,
  demoIsFirst: "You are #1",

  benefitsLabel: "What you get",
  benefitsTitle: "Be first where customers are looking",
  benefits: [
    { title: "Seen in your category", body: "Your ad doesn't get lost in a general feed — it shows when customers browse exactly your field." },
    { title: "You control the price", body: "You set the daily bid. Raise it later and you only pay the difference for the remaining days." },
    { title: "Reviewed before payment", body: "Text, link and image pass AI review. If not approved, you pay nothing — edit and resubmit." },
    { title: "Results are measured", body: "Views, clicks, CTR and your category rank are always visible in the dashboard." },
  ],

  howLabel: "How it works",
  howTitle: "From creation to results — 5 steps",
  steps: [
    { title: "Create your ad", body: "Title, website link, image and category. A few minutes." },
    { title: "AI review", body: "Text, link and image are checked — usually within a minute." },
    { title: "Bid and duration", body: "Daily bid (from $1) and 1–365 days. Total = bid × days." },
    { title: "Pay — and go live", body: "Your ad goes live once payment is confirmed. The period starts then." },
    { title: "Track and manage", body: "Watch your rank, raise your bid or extend the period when needed." },
  ],

  whereLabel: "Clear terms",
  whereTitle: "Where your ad appears and what you buy",
  where: [
    { title: "Where it appears", body: "In the Primio catalog — the main list and your category page. The card shows your image, title, description and a link to your site." },
    { title: "What you buy", body: "A position in the category ranking for the chosen period. Position depends on your daily bid; with equal bids, the ad activated earlier ranks higher." },
    { title: "How it's measured", body: "A view — at least half of the card on screen for 1 second. A click — a visit to your site. CTR = clicks ÷ views." },
  ],
  whereNote: "Important: #1 gives you a visibility advantage, not guaranteed sales. Sales depend on your offer, price and website — that's why the dashboard shows rank and results separately.",

  pricingLabel: "Categories & pricing",
  pricingTitle: "Calculate your price now",
  pricingSub: "Pick a category — see where you'd land in the real, live ranking.",
  liveAds: "live ads",
  firstPlace: "#1",
  emptyCategory: "Empty — #1 from $1",
  calcBid: "Daily bid",
  calcDays: "Duration",
  calcRank: "Expected rank",
  calcTotal: "Total payment",
  calcCta: "Start with these terms",
  calcHint: (usd: string) => `At least ${usd}/day for #1`,
  calcLoading: "Loading ranking…",

  dashLabel: "Dashboard",
  dashTitle: "Understand your results and decide what's next",
  dashPoints: [
    { title: "Overview", body: "Views, clicks, CTR and amount paid in one place." },
    { title: "Needs attention", body: "Outbid, expiring soon or awaiting payment — you see it right away." },
    { title: "Competition", body: "The bid and extra payment needed to move up one position." },
    { title: "Daily chart", body: "7- and 30-day trends for views and clicks." },
  ],
  dashPreviewNote: "Dashboard preview (sample)",
  mockKpis: ["Views", "Clicks", "CTR", "Paid"],
  mockAttention: "You were outbid — #1 needs $6.50/day",
  mockAction: "Raise bid",

  proofLabel: "Real numbers",
  proofTitle: "Primio right now",
  proofStats: { ads: "Live ads", cats: "Active categories", views: "Views", clicks: "Clicks" },
  proofEmpty: "The platform is just launching — take #1 in an empty category from $1.",
  proofSource: "Live count of active ads in the catalog",

  faqLabel: "FAQ",
  faqTitle: "Frequently asked questions",
  faq: [
    { q: "Where will my ad be shown?", a: "In the Primio catalog: the main list and your category page. It is shown only during the paid period." },
    { q: "How is the ranking decided?", a: "By daily bid — the highest bid ranks first. With equal bids, the ad activated earlier ranks higher." },
    { q: "Can I raise my bid later?", a: "Yes, any time. Raise by at least $0.50; you only pay the difference for the remaining days." },
    { q: "What if my ad fails AI review?", a: "You pay nothing. You see the reason, edit the ad and resubmit." },
    { q: "When does the period start?", a: "When payment is confirmed. Extending a live ad adds the new days to the end of the current period." },
    { q: "How do I see results?", a: "In the dashboard: views, clicks, CTR, category rank and a daily chart." },
  ],

  finalTitle: "Start ranking first in your category today",
  finalSub: "Creating an ad is free. Payment only after AI review.",
};

const ru: Copy = {
  heroEyebrow: "Рейтинг рекламы внутри категории",
  heroTitle: "Поднимите свой бренд наверх нужной категории.",
  heroSub:
    "Primio — каталог рекламы. В каждой категории объявления упорядочены по дневной ставке: чем выше ставка, тем выше место. Цену задаёте вы, результаты видите в панели.",
  ctaPrimary: "Разместить рекламу",
  ctaSecondary: "Смотреть каталог",
  heroTrust: ["Не прошло AI-проверку — оплата не нужна", "От $1 в день", "Учитываются показы, клики и CTR"],

  demoBadge: "Интерактивный пример",
  demoCategory: "Категория «Образование»",
  demoNote: "Пример — не реальные объявления",
  demoYou: "Ваш бренд",
  demoBidLabel: "Ваша дневная ставка",
  demoDays: "Срок",
  daysUnit: "дн.",
  perDay: "/день",
  demoDaily: "Цена в день",
  demoTotal: "Итого",
  demoPosition: "Ваше место в категории",
  demoToFirst: (usd: string) => `Для 1-го места: ${usd}/день`,
  demoIsFirst: "Вы на 1-м месте",

  benefitsLabel: "Что это даёт",
  benefitsTitle: "Будьте первыми там, где ищут клиенты",
  benefits: [
    { title: "Вас видят в вашей категории", body: "Реклама не теряется в общей ленте — она показывается, когда клиент смотрит именно ваше направление." },
    { title: "Цену контролируете вы", body: "Дневную ставку задаёте сами. Повысите позже — доплатите только разницу за оставшиеся дни." },
    { title: "Проверка до оплаты", body: "Текст, ссылка и изображение проходят AI-проверку. Не прошло — оплата не нужна, исправьте и отправьте снова." },
    { title: "Результат измеряется", body: "Показы, клики, CTR и место в категории всегда видны в панели." },
  ],

  howLabel: "Как это работает",
  howTitle: "От создания до результата — 5 шагов",
  steps: [
    { title: "Создаёте объявление", body: "Заголовок, ссылка на сайт, изображение и категория. Несколько минут." },
    { title: "AI-проверка", body: "Проверяются текст, ссылка и изображение — обычно в течение минуты." },
    { title: "Ставка и срок", body: "Дневная ставка (от $1) и 1–365 дней. Итого = ставка × дни." },
    { title: "Оплата — и реклама в эфире", body: "Реклама выходит сразу после подтверждения оплаты. Срок считается с этого момента." },
    { title: "Следите и управляйте", body: "Следите за местом, при необходимости повышайте ставку или продлевайте срок." },
  ],

  whereLabel: "Прозрачные условия",
  whereTitle: "Где показывается реклама и что вы покупаете",
  where: [
    { title: "Где показывается", body: "В каталоге Primio — в общем списке и на странице вашей категории. В карточке — изображение, заголовок, описание и ссылка на сайт." },
    { title: "Что вы покупаете", body: "Место в рейтинге категории на выбранный срок. Место зависит от дневной ставки; при равных ставках выше то объявление, что активировано раньше." },
    { title: "Как измеряется", body: "Показ — не меньше половины карточки на экране 1 секунду. Клик — переход на ваш сайт. CTR = клики ÷ показы." },
  ],
  whereNote: "Важно: 1-е место даёт преимущество в видимости, но не гарантирует продажи. Продажи зависят от предложения, цены и сайта — поэтому в панели место и результаты показаны отдельно.",

  pricingLabel: "Категории и цены",
  pricingTitle: "Рассчитайте цену сейчас",
  pricingSub: "Выберите категорию — увидите, на какое место попадёте в реальном рейтинге.",
  liveAds: "активных",
  firstPlace: "1-е место",
  emptyCategory: "Пусто — 1-е место от $1",
  calcBid: "Дневная ставка",
  calcDays: "Срок",
  calcRank: "Ожидаемое место",
  calcTotal: "Итого к оплате",
  calcCta: "Начать с этими условиями",
  calcHint: (usd: string) => `Для 1-го места — от ${usd}/день`,
  calcLoading: "Загружаем рейтинг…",

  dashLabel: "Панель",
  dashTitle: "Понимайте результаты и принимайте следующее решение",
  dashPoints: [
    { title: "Общее состояние", body: "Показы, клики, CTR и оплаченная сумма в одном месте." },
    { title: "Требует внимания", body: "Ставку перебили, срок заканчивается или ждёт оплата — видно сразу." },
    { title: "Конкуренция", body: "Какая ставка и доплата нужны, чтобы подняться на одну позицию." },
    { title: "Дневной график", body: "Динамика показов и кликов за 7 и 30 дней." },
  ],
  dashPreviewNote: "Вид панели (пример)",
  mockKpis: ["Показы", "Клики", "CTR", "Оплачено"],
  mockAttention: "Вашу ставку перебили — для 1-го места $6.50/день",
  mockAction: "Повысить ставку",

  proofLabel: "Реальные цифры",
  proofTitle: "Primio сейчас",
  proofStats: { ads: "Активных объявлений", cats: "Занятых категорий", views: "Показов", clicks: "Кликов" },
  proofEmpty: "Платформа только запускается — займите 1-е место в пустой категории от $1.",
  proofSource: "Живой подсчёт активных объявлений каталога",

  faqLabel: "Вопросы",
  faqTitle: "Частые вопросы",
  faq: [
    { q: "Где будет показана реклама?", a: "В каталоге Primio: в общем списке и на странице вашей категории. Только в течение оплаченного срока." },
    { q: "Как определяется рейтинг?", a: "По дневной ставке — кто предложил больше, тот выше. При равных ставках выше объявление, активированное раньше." },
    { q: "Можно повысить ставку позже?", a: "Да, в любое время. Минимум на $0.50; оплачивается только разница за оставшиеся дни." },
    { q: "Что если реклама не прошла AI-проверку?", a: "Оплата не нужна. Вы увидите причину, исправите объявление и отправите снова." },
    { q: "С какого момента считается срок?", a: "С момента подтверждения оплаты. При продлении активной рекламы новые дни добавляются к концу текущего срока." },
    { q: "Как увидеть результаты?", a: "В панели: показы, клики, CTR, место в категории и дневной график." },
  ],

  finalTitle: "Начните быть первым в своей категории сегодня",
  finalSub: "Создание объявления бесплатно. Оплата — только после AI-проверки.",
};

export const LANDING_COPY: Record<LandingLang, Copy> = { uz, en, ru };
export type LandingCopy = Copy;
