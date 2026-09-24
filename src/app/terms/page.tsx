"use client";

import { useLang } from "@/contexts/LangContext";
import Link from "next/link";

const CONTENT = {
  en: {
    title: "Public Offer Agreement",
    subtitle: "Advertising Terms & Conditions — PRIMIO Platform",
    updated: "Last updated: June 2025",
    intro: "By placing an advertisement on the PRIMIO platform, you (the Advertiser) fully and unconditionally accept the terms of this Public Offer Agreement. If you do not agree with any provision, you may not use the advertising services.",
    sections: [
      {
        title: "1. Subject of Agreement",
        body: "PRIMIO provides an advertising auction marketplace where Advertisers bid for ad placement positions. This Agreement governs all advertising relationships between PRIMIO and the Advertiser.",
      },
      {
        title: "2. Prohibited Content",
        body: "The following types of advertisements are strictly prohibited on PRIMIO. Submitting such content — even if it passes AI moderation — constitutes a violation of this Agreement:",
        items: [
          "Violence, threats, or content promoting harm to individuals or groups",
          "Weapons advertising: firearms, ammunition, knives, explosives, or related accessories",
          "Adult content (18+): pornography, escort services, sexual content, nudity, or sexually suggestive imagery",
          "Content that humiliates, degrades, or discriminates against individuals or groups based on race, religion, gender, nationality, or other characteristics",
          "Inappropriate or indecent images, including bikini, underwear, or other revealing clothing",
          "Social media page promotions (Instagram, TikTok, YouTube, Facebook, Telegram channels, etc.)",
          "Gambling, casinos, betting, or lottery services",
          "Drugs, narcotics, or psychotropic substances",
          "Fraud, phishing, scam, or illegal services",
          "Terrorism, extremism, or hate speech",
          "Any content that violates applicable laws",
        ],
      },
      {
        title: "3. AI Moderation & No-Refund Policy",
        body: "PRIMIO uses automated AI moderation to review advertisements. However, AI systems may make errors. The following rules apply regardless of AI moderation outcome:",
        items: [
          "If your advertisement passes AI review but contains prohibited content (listed in Section 2), it will be removed without warning.",
          "No refund will be issued for advertisements removed due to policy violations, even if AI moderation approved them.",
          "PRIMIO reserves the right to manually review any advertisement at any time and remove it if it violates this Agreement.",
          "The Advertiser is solely responsible for ensuring their content complies with this Agreement before payment.",
        ],
      },
      {
        title: "4. Payment Terms",
        body: "Payment is collected only after AI moderation approval. By proceeding to payment, the Advertiser confirms that:",
        items: [
          "They have read and accept all terms of this Public Offer Agreement.",
          "The advertisement content does not violate any provisions listed in Section 2.",
          "They understand that payment is non-refundable if the ad is later found to violate these terms.",
        ],
      },
      {
        title: "5. Advertiser Obligations",
        body: "The Advertiser agrees to:",
        items: [
          "Submit only truthful and accurate advertising content.",
          "Ensure the advertised website is functional and does not contain prohibited content.",
          "Not attempt to circumvent AI moderation by disguising prohibited content.",
          "Accept full legal responsibility for the content of their advertisements.",
        ],
      },
      {
        title: "6. Liability",
        body: "PRIMIO is not liable for the content of Advertiser submissions. The Advertiser bears full responsibility for any legal, financial, or reputational consequences arising from their advertisement content.",
      },
      {
        title: "7. Agreement Acceptance",
        body: "By checking the agreement box and proceeding to payment, the Advertiser confirms full and unconditional acceptance of this Public Offer Agreement. This Agreement is considered concluded at the moment of clicking the agreement checkbox.",
      },
    ],
    back: "← Back",
  },
  uz: {
    title: "Ommaviy Oferta Shartnomasi",
    subtitle: "Reklama Shartlari va Qoidalari — PRIMIO Platformasi",
    updated: "So'nggi yangilanish: Iyun 2025",
    intro: "PRIMIO platformasida reklama joylashtirish orqali siz (Reklama beruvchi) ushbu Ommaviy Oferta Shartnomasining barcha shartlarini to'liq va so'zsiz qabul qilasiz. Agar biron-bir bandga rozi bo'lmasangiz, reklama xizmatlaridan foydalana olmaysiz.",
    sections: [
      {
        title: "1. Shartnoma Mavzusi",
        body: "PRIMIO — bu reklama beruvchilar o'z reklamalari uchun pozitsiya uchun taklif beruvchi reklama auktsion platformasidir. Ushbu Shartnoma PRIMIO va Reklama beruvchi o'rtasidagi barcha reklama munosabatlarini tartibga soladi.",
      },
      {
        title: "2. Taqiqlangan Kontentlar",
        body: "Quyidagi turdagi reklamalar PRIMIO da qat'iyan taqiqlanadi. Bunday kontentni yuborish — AI moderatsiyasidan o'tsa ham — ushbu Shartnomani buzganlik hisoblanadi:",
        items: [
          "Zo'ravonlik, tahdid yoki shaxslarga va guruhlarga zarar yetkazishga undaydigan kontent",
          "Qurollar reklamasi: o'qotar qurollar, o'q-dori, pichoqlar, portlovchi moddalar va tegishli aksessuarlar",
          "Kattalar kontenti (18+): pornografiya, eskort xizmatlari, jinsiy kontent, yalang'ochlik yoki jinsiy ishorali tasvirlar",
          "Irq, din, jins, millat yoki boshqa xususiyatlar asosida shaxslar yoki guruhlarni kamsituvchi, tahqirlovchi yoki kamsituvchi kontent",
          "Nomaqbul yoki uyatsiz rasmlar, jumladan bikini, ichki kiyim yoki boshqa ochiq kiyimlar",
          "Ijtimoiy tarmoq sahifalarining reklamasi (Instagram, TikTok, YouTube, Facebook, Telegram kanallari va boshqalar)",
          "Qimor, kazino, tikish yoki lotereya xizmatlari",
          "Giyohvand moddalar, narkotiklar yoki psixotrop moddalar",
          "Firibgarlik, fishing, scam yoki noqonuniy xizmatlar",
          "Terrorizm, ekstremizm yoki nafrat nutqi",
          "Amaldagi qonunlarga zid bo'lgan har qanday kontent",
        ],
      },
      {
        title: "3. AI Moderatsiya va Pul Qaytarmaslik Siyosati",
        body: "PRIMIO reklamalarni ko'rib chiqish uchun avtomatlashtirilgan AI moderatsiyasidan foydalanadi. Biroq, AI tizimlari xato qilishi mumkin. Quyidagi qoidalar AI moderatsiyasi natijasidan qat'i nazar qo'llaniladi:",
        items: [
          "Agar reklamangiz AI tekshiruvidan o'tsa ham taqiqlangan kontent (2-bo'limdagi ro'yxat) o'z ichiga olsa — ogohlantirmasdan o'chiriladi.",
          "Qoida buzilishi sababli o'chirilgan reklamalar uchun to'lov qaytarilmaydi, hatto AI moderatsiyasi tasdiqlagan bo'lsa ham.",
          "PRIMIO istalgan vaqtda har qanday reklamani qo'lda ko'rib chiqish va ushbu Shartnomani buzsа o'chirish huquqini o'zida saqlab qoladi.",
          "Reklama beruvchi to'lovdan oldin kontentning ushbu Shartnomaga muvofiqligini ta'minlash uchun yagona javobgarlikni o'z zimmasiga oladi.",
        ],
      },
      {
        title: "4. To'lov Shartlari",
        body: "To'lov faqat AI moderatsiyasi tasdiqlangandan so'ng olinadi. To'lovga o'tish orqali Reklama beruvchi quyidagilarni tasdiqlaydi:",
        items: [
          "Ular ushbu Ommaviy Oferta Shartnomasining barcha shartlarini o'qib chiqdilar va qabul qildilar.",
          "Reklama kontenti 2-bo'limdagi hech qanday qoidani buzmaydi.",
          "Ular reklama keyinchalik ushbu shartlarni buzganligi aniqlansa to'lov qaytarilmasligini tushunishadi.",
        ],
      },
      {
        title: "5. Reklama Beruvchining Majburiyatlari",
        body: "Reklama beruvchi quyidagilarga rozi bo'ladi:",
        items: [
          "Faqat to'g'ri va aniq reklama kontentini yuborish.",
          "Reklamalanayotgan veb-saytning ishlashini va taqiqlangan kontent o'z ichiga olmasligini ta'minlash.",
          "Taqiqlangan kontentni yashirish orqali AI moderatsiyasini chetlab o'tishga urinmaslik.",
          "Reklamalarining kontenti uchun to'liq huquqiy javobgarlikni qabul qilish.",
        ],
      },
      {
        title: "6. Javobgarlik",
        body: "PRIMIO Reklama beruvchi tomonidan yuborilgan kontentlar uchun javobgar emas. Reklama beruvchi o'z reklama kontentidan kelib chiqadigan har qanday huquqiy, moliyaviy yoki obro'ga oid oqibatlar uchun to'liq javobgarlikni o'z zimmasiga oladi.",
      },
      {
        title: "7. Shartnomani Qabul Qilish",
        body: "Rozilik katagiga belgi qo'yib to'lovga o'tish orqali Reklama beruvchi ushbu Ommaviy Oferta Shartnomasini to'liq va so'zsiz qabul qilishini tasdiqlaydi. Ushbu Shartnoma rozilik katagiga belgi qo'yilgan zahoti tuzilgan deb hisoblanadi.",
      },
    ],
    back: "← Orqaga",
  },
  ru: {
    title: "Договор Публичной Оферты",
    subtitle: "Условия размещения рекламы — Платформа PRIMIO",
    updated: "Последнее обновление: Июнь 2025",
    intro: "Размещая рекламу на платформе PRIMIO, вы (Рекламодатель) полностью и безоговорочно принимаете условия настоящего Договора публичной оферты. Если вы не согласны с каким-либо положением, вы не можете использовать рекламные услуги.",
    sections: [
      {
        title: "1. Предмет Договора",
        body: "PRIMIO предоставляет аукционную площадку для размещения рекламы, где Рекламодатели делают ставки за позиции размещения. Настоящий Договор регулирует все рекламные отношения между PRIMIO и Рекламодателем.",
      },
      {
        title: "2. Запрещённый Контент",
        body: "Следующие виды рекламы строго запрещены на PRIMIO. Подача такого контента — даже если он прошёл AI-модерацию — является нарушением настоящего Договора:",
        items: [
          "Насилие, угрозы или контент, пропагандирующий причинение вреда людям или группам",
          "Реклама оружия: огнестрельного оружия, боеприпасов, ножей, взрывчатых веществ и аксессуаров к ним",
          "Контент для взрослых (18+): порнография, эскорт-услуги, сексуальный контент, нагота или сексуально-провокационные изображения",
          "Контент, унижающий, оскорбляющий или дискриминирующий людей или группы по признаку расы, религии, пола, национальности или других характеристик",
          "Неприличные или непристойные изображения, включая бикини, нижнее бельё или другую открытую одежду",
          "Продвижение страниц в социальных сетях (Instagram, TikTok, YouTube, Facebook, Telegram-каналы и т.д.)",
          "Азартные игры, казино, ставки или лотерейные услуги",
          "Наркотики, наркотические или психотропные вещества",
          "Мошенничество, фишинг, скам или незаконные услуги",
          "Терроризм, экстремизм или разжигание ненависти",
          "Любой контент, нарушающий действующее законодательство",
        ],
      },
      {
        title: "3. AI-Модерация и Политика Невозврата",
        body: "PRIMIO использует автоматизированную AI-модерацию для проверки объявлений. Однако системы AI могут ошибаться. Следующие правила применяются независимо от результата AI-модерации:",
        items: [
          "Если ваше объявление прошло AI-проверку, но содержит запрещённый контент (список в Разделе 2) — оно будет удалено без предупреждения.",
          "Средства за объявления, удалённые из-за нарушения правил, не возвращаются, даже если AI-модерация их одобрила.",
          "PRIMIO оставляет за собой право в любое время вручную проверить любое объявление и удалить его при нарушении настоящего Договора.",
          "Рекламодатель несёт единоличную ответственность за соответствие контента настоящему Договору до совершения оплаты.",
        ],
      },
      {
        title: "4. Условия Оплаты",
        body: "Оплата взимается только после одобрения AI-модерацией. Переходя к оплате, Рекламодатель подтверждает, что:",
        items: [
          "Они прочитали и принимают все условия настоящего Договора публичной оферты.",
          "Содержание объявления не нарушает ни одного из положений Раздела 2.",
          "Они понимают, что оплата не возвращается, если впоследствии окажется, что объявление нарушает данные условия.",
        ],
      },
      {
        title: "5. Обязательства Рекламодателя",
        body: "Рекламодатель соглашается:",
        items: [
          "Представлять только правдивый и точный рекламный контент.",
          "Обеспечивать работоспособность рекламируемого сайта и отсутствие запрещённого контента.",
          "Не пытаться обойти AI-модерацию, маскируя запрещённый контент.",
          "Принять полную юридическую ответственность за содержание своих объявлений.",
        ],
      },
      {
        title: "6. Ответственность",
        body: "PRIMIO не несёт ответственности за содержание материалов, представленных Рекламодателем. Рекламодатель несёт полную ответственность за любые юридические, финансовые или репутационные последствия, вытекающие из содержания его рекламы.",
      },
      {
        title: "7. Принятие Договора",
        body: "Установив флажок согласия и перейдя к оплате, Рекламодатель подтверждает полное и безоговорочное принятие настоящего Договора публичной оферты. Настоящий Договор считается заключённым с момента установки флажка согласия.",
      },
    ],
    back: "← Назад",
  },
};

export default function TermsPage() {
  const { lang: globalLang } = useLang();
  const lang = (["en", "uz", "ru"].includes(globalLang) ? globalLang : "en") as keyof typeof CONTENT;
  const c = CONTENT[lang];

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      color: "#E9D5FF",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "40px 16px 80px",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link href="/create" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#7C3AED", fontSize: 14, textDecoration: "none", marginBottom: 32 }}>
          {c.back}
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>📋</div>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: 0 }}>{c.title}</h1>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{c.subtitle}</p>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--dim)" }}>{c.updated}</p>
        </div>

        {/* Intro */}
        <div style={{
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: 14, padding: "18px 20px", marginBottom: 32,
        }}>
          <p style={{ fontSize: 14, color: "#C4B5FD", lineHeight: 1.7, margin: 0 }}>{c.intro}</p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {c.sections.map((section, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(124,58,237,0.12)",
              borderRadius: 16, padding: "24px 24px",
            }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#A78BFA", marginBottom: 12, marginTop: 0 }}>
                {section.title}
              </h2>
              <p style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.7, margin: 0, marginBottom: section.items ? 12 : 0 }}>
                {section.body}
              </p>
              {section.items && (
                <ul style={{ margin: "12px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {section.items.map((item, j) => (
                    <li key={j} style={{ fontSize: 13.5, color: "#D1D5DB", lineHeight: 1.6 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 40, padding: "20px 24px",
          background: "rgba(245,158,11,0.06)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 14, textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "#FCD34D", margin: 0, lineHeight: 1.6 }}>
            ⚠️ {lang === "uz"
              ? "Reklama berishdan oldin ushbu shartlarni diqqat bilan o'qing. Reklama berish — bu shartlarga roziligingizni bildiradi."
              : lang === "ru"
              ? "Внимательно прочитайте эти условия перед размещением рекламы. Размещение рекламы означает ваше согласие с этими условиями."
              : "Please read these terms carefully before placing an advertisement. Placing an ad means you agree to these terms."}
          </p>
        </div>
      </div>
    </div>
  );
}
