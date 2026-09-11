import Link from "next/link";

const RULE_POINTS = [
  "Kun oxirida eng yuqori taklif beruvchi birinchi o'rinda turadi",
  "Narx istalgan vaqt o'zgartirilishi mumkin — bozor jonli",
  "Muddati tugash, nofaol yoki rad etilgan reklamalar uchun to'lov olinmaydi",
];

const FLOW_CARDS = [
  { num: "01", icon: "✏️", title: "Brend va reklama ma'lumotlarini kiriting", body: "Nomi, tavsifi, rasmingizni qo'shing. 5 daqiqa — tayyor." },
  { num: "02", icon: "💰", title: "Kunlik taklifingizni belgilang", body: "Siz to'lagan kunlik miqdor — reyting formulangiz. Ko'proq → yuqoriroq." },
  { num: "03", icon: "🏆", title: "Reytingni kuzating va taklif bering", body: "Raqobatchilardan oshib o'ting. Taklif istalgan vaqt o'zgartirish mumkin." },
  { num: "04", icon: "📈", title: "Ko'proq ko'rish, ko'proq savdo", body: "Yuqori o'rinlar ko'proq klik va mijozlarni kafolatlaydi." },
  { num: "05", icon: "⚡", title: "Real vaqtda yangilanish", body: "Tizim har kechasi avtomatik reytingni yangilaydi." },
  { num: "06", icon: "🛡️", title: "Xavfsiz to'lov tizimi", body: "Stripe orqali xavfsiz to'lov. Pulni faqat faol kunlar uchun to'laysiz." },
];

const HOME_CATS = [
  { icon: "🛒", name: "E-commerce va onlayn do'konlar", top: "$12.00", count: "14", min: "$2.00" },
  { icon: "📱", name: "Ilovalar va SaaS", top: "$8.50", count: "9", min: "$1.00" },
  { icon: "🏫", name: "Ta'lim va kurslar", top: "$6.00", count: "11", min: "$1.00" },
  { icon: "🍽️", name: "Restoran va oziq-ovqat", top: "$4.50", count: "7", min: "$0.50" },
  { icon: "🏥", name: "Sog'liqni saqlash", top: "$7.00", count: "5", min: "$1.00" },
  { icon: "🏗️", name: "Qurilish va dizayn", top: "$5.00", count: "8", min: "$0.50" },
  { icon: "✈️", name: "Sayohat va turizm", top: "$9.00", count: "6", min: "$1.00" },
  { icon: "🎮", name: "O'yin va ko'ngilochar", top: "$3.50", count: "4", min: "$0.50" },
];

const WHO_CARDS = [
  {
    icon: "🛒",
    title: "E-commerce va onlayn do'konlar",
    body: "Ko'proq xaridor jalb qilishni xohlaysizmi? Kategoriya sahifasida birinchi o'rinda turing.",
    example: "Do'konim oyiga 3x ko'proq tashrif buyuruvchi oldi — faqat top o'rinda bo'lgani uchun.",
  },
  {
    icon: "📱",
    title: "Ilovalar va startaplar",
    body: "Foydalanuvchilar bazasini tezda o'stirmoqchimisiz? Ko'rinuvchanlikka sarmoya kiriting.",
    example: "Ilovamiz birinchi haftada 500+ yangi foydalanuvchi oldi.",
  },
  {
    icon: "🏪",
    title: "Mahalliy biznes va xizmatlar",
    body: "Shahar yoki mintaqangizdagi mijozlarni topishni xohlaysizmi? Kategoriyangizda birinchi bo'ling.",
    example: "Restoranimiz bronlari 40% ko'paydi.",
  },
];

const MATH_POINTS = [
  "Faqat faol kunlar uchun to'laysiz — ta'til, to'xtatish, vaqtinchalik pauza bepul",
  "Istalgan vaqt taklif miqdorini o'zgartirish mumkin — hatto bir zumda",
  "Kunlik minimal taklif — $0.50. Maksimal cheklov yo'q.",
];

const MATH_CARDS: { label: string; value: string; hint: string; labelColor: string; valColor: string; bg: string; borderColor: string }[] = [
  { label: "Kunlik taklif", value: "$5.00", hint: "Siz to'laydigan maksimal miqdor", labelColor: "#A855F7", valColor: "#EDE9FE", bg: "#1A1230", borderColor: "#2D1F50" },
  { label: "O'rningiz", value: "#2", hint: "Barcha raqobatchilar orasida", labelColor: "#FCD34D", valColor: "#FCD34D", bg: "rgba(245,158,11,.09)", borderColor: "#F59E0B" },
  { label: "Oylik to'lov", value: "$155", hint: "30 kun × $5.00 (agar to'liq faol)", labelColor: "#A855F7", valColor: "#EDE9FE", bg: "#1A1230", borderColor: "#2D1F50" },
  { label: "ROI taxmin", value: "8–15×", hint: "Ko'pchilik reklamachilar tajribasiga ko'ra", labelColor: "#34D399", valColor: "#34D399", bg: "rgba(52,211,153,.06)", borderColor: "#34D399" },
];

const FAQ = [
  { q: "To'lov qanday amalga oshiriladi?", a: "Stripe orqali xavfsiz to'lov. Kunlik taklif miqdori avtomatik hisobdan chiqariladi. Muddati tugasa yoki to'xtatilsa — to'lov olinmaydi." },
  { q: "Reklamam qachon ko'rinadi?", a: "Moderatsiyadan o'tganidan so'ng (odatda 1–4 soat ichida) reklamangiz darhol jonlashadi." },
  { q: "Raqobatchilarni ko'ra olamanmi?", a: "Ha, har bir kategoriyada joriy liderlarni ko'rasiz. Bu sizga raqobat tahlili qilishga yordam beradi." },
  { q: "Taklifni o'zgartirsa bo'ladimi?", a: "Albatta! Istalgan vaqt dashboard orqali kunlik taklifingizni o'zgartirishingiz mumkin." },
  { q: "Minimum qancha muddat to'lash kerak?", a: "Minimim kunlik taklif $0.50. Muddat cheklovi yo'q — bugun boshlang, ertaga to'xtating." },
  { q: "Reklama qanday ko'rinishda bo'ladi?", a: "Kompaniya nomi, tavsif, veb-sayt havolasi va logotip. Toza, professional dizayn." },
];

const DEMO_RANK = [
  { pos: "🥇 1", name: "TechStore.uz", bid: "$12.00/kun", highlight: true },
  { pos: "🥈 2", name: "SizningBrend", bid: "$8.50/kun", highlight: true, isYou: true },
  { pos: "🥉 3", name: "MobiShop", bid: "$6.00/kun", highlight: false },
  { pos: "4", name: "DigitalMall", bid: "$4.50/kun", highlight: false },
];

export default function HeroSection() {
  const W = 1180;
  const pad = "0 26px";

  return (
    <div style={{ animation: "fade .35s ease both" }}>
      {/* === HERO === */}
      <div style={{ padding: "70px 0 54px", borderBottom: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 13px", borderRadius: 100, background: "rgba(124,58,237,.12)", border: "1px solid #2D1F50", marginBottom: 26 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", animation: "livedot 1.8s infinite" }} />
            <span style={{ fontSize: ".74rem", fontWeight: 600, color: "#A855F7" }}>Global reklama auktion platformasi</span>
          </div>
          <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "clamp(2.2rem,5.4vw,4rem)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-.035em", maxWidth: "16ch", marginBottom: 20, textWrap: "balance" as "balance" }}>
            Kim ko&apos;proq to&apos;lasa — <span style={{ color: "#F59E0B" }}>yuqorida turadi</span>
          </h1>
          <p style={{ fontSize: "1.05rem", color: "#A78BFA", maxWidth: "52ch", lineHeight: 1.7, marginBottom: 30 }}>
            Oddiy qoida, shaffof auktion. Reklamangizni joylang, raqobatchilardan yuqori turing. Har kuni yangilanadigan real vaqt reytingi.
          </p>
          <div style={{ display: "flex", gap: 11, flexWrap: "wrap" }}>
            <Link href="/create" style={{ padding: "13px 22px", borderRadius: 12, background: "#7C3AED", color: "#fff", fontSize: ".9rem", fontWeight: 700, textDecoration: "none" }}>
              Reklama berish — Boshlayman
            </Link>
            <Link href="/browse" style={{ padding: "13px 22px", borderRadius: 12, background: "transparent", border: "1px solid #2D1F50", color: "#EDE9FE", fontSize: ".9rem", fontWeight: 600, textDecoration: "none" }}>
              Barcha reklamalar →
            </Link>
          </div>
        </div>
      </div>

      {/* === RULE (2-col) === */}
      <div style={{ borderBottom: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div className="rg-hero">
            <div>
              <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 14 }}>ASOSIY QOIDA</div>
              <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em", lineHeight: 1.2, marginBottom: 14 }}>
                Narx — o&apos;rningizni belgilaydi
              </h2>
              <p style={{ fontSize: ".95rem", color: "#A78BFA", lineHeight: 1.75, marginBottom: 20 }}>
                Har bir kategoriyada reklamalar kunlik taklif miqdoriga qarab tartiblangan. Ko&apos;proq to&apos;lang — yuqoriroq o&apos;rinda turing.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {RULE_POINTS.map((text, i) => (
                  <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(16,185,129,.14)", color: "#34D399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, flexShrink: 0, marginTop: 3 }}>✓</span>
                    <span style={{ fontSize: ".88rem", color: "#EDE9FE", lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo ranking card */}
            <div style={{ background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 18, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: ".72rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700 }}>JORIY REYTING</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".72rem", color: "#6D5B8E" }}>E-commerce</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DEMO_RANK.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, background: d.isYou ? "rgba(124,58,237,.14)" : i === 0 ? "rgba(245,158,11,.07)" : "rgba(255,255,255,.03)", border: d.isYou ? "1px solid #7C3AED" : "1px solid transparent" }}>
                    <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".75rem", fontWeight: 700, color: i === 0 ? "#F59E0B" : d.isYou ? "#A78BFA" : "#6D5B8E", minWidth: 24 }}>{d.pos}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: ".86rem", fontWeight: 600, color: d.isYou ? "#A78BFA" : "#EDE9FE", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.name}{d.isYou && <span style={{ marginLeft: 6, fontSize: ".68rem", background: "rgba(124,58,237,.2)", color: "#A855F7", padding: "2px 7px", borderRadius: 100 }}>Siz</span>}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".82rem", fontWeight: 600, color: i === 0 ? "#FCD34D" : d.isYou ? "#A78BFA" : "#6D5B8E" }}>{d.bid}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: "13px 15px", borderRadius: 12, background: "rgba(245,158,11,.09)", border: "1px solid #F59E0B", fontSize: ".82rem", color: "#FCD34D", lineHeight: 1.6 }}>
                💡 Kunlik $1.50 ko&apos;proq taklif berish bilan birinchi o&apos;ringa chiqasiz
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === FLOW (3-col step cards) === */}
      <div style={{ borderBottom: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ padding: "48px 0" }}>
            <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>QANDAY ISHLAYDI</div>
            <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em", marginBottom: 8 }}>6 qadamda boshlash</h2>
            <p style={{ fontSize: ".95rem", color: "#A78BFA", maxWidth: "56ch", marginBottom: 28 }}>Ro&apos;yxatdan o&apos;tishdan reklamangiz jonlashguniga qadar — 10 daqiqa.</p>
            <div className="rg-3">
              {FLOW_CARDS.map((f) => (
                <div key={f.num} style={{ textAlign: "left", background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 15, padding: 20, color: "#EDE9FE", transition: "border-color .15s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#6D5B8E" }}>{f.num}</span>
                    <span style={{ fontSize: "1.05rem" }}>{f.icon}</span>
                  </div>
                  <div style={{ fontSize: ".95rem", fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: ".83rem", color: "#A78BFA", lineHeight: 1.6 }}>{f.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === CATEGORIES (4-col) === */}
      <div style={{ borderBottom: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ padding: "48px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>TOIFALAR</div>
                <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em" }}>Kategoriyangizni tanlang</h2>
              </div>
              <Link href="/browse" style={{ padding: "11px 18px", borderRadius: 11, background: "transparent", border: "1px solid #2D1F50", color: "#EDE9FE", fontSize: ".84rem", fontWeight: 600, textDecoration: "none" }}>
                Barchasini ko&apos;rish →
              </Link>
            </div>
            <div className="rg-4">
              {HOME_CATS.map((c) => (
                <Link key={c.name} href={`/browse?category=${encodeURIComponent(c.name)}`} style={{ textAlign: "left", background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 14, padding: 17, color: "#EDE9FE", textDecoration: "none", display: "block" }}>
                  <div style={{ fontSize: "1.15rem", marginBottom: 11 }}>{c.icon}</div>
                  <div style={{ fontSize: ".86rem", fontWeight: 700, marginBottom: 9, lineHeight: 1.35 }}>{c.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".9rem", fontWeight: 600, color: "#FCD34D" }}>{c.top}</span>
                    <span style={{ fontSize: ".68rem", color: "#6D5B8E" }}>1-o&apos;rin uchun</span>
                  </div>
                  <div style={{ fontSize: ".72rem", color: "#6D5B8E", marginTop: 4 }}>{c.count} reklama · dan {c.min}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === WHO IS IT FOR (3-col) === */}
      <div style={{ borderTop: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ padding: "48px 0" }}>
            <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>KIM UCHUN</div>
            <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em", marginBottom: 8 }}>Bu platforma siz uchun</h2>
            <p style={{ fontSize: ".95rem", color: "#A78BFA", maxWidth: "58ch", marginBottom: 26 }}>Har qanday hajmdagi biznes uchun — mahalliy restorandan global startapgacha.</p>
            <div className="rg-3">
              {WHO_CARDS.map((w) => (
                <div key={w.title} style={{ background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 16, padding: 22 }}>
                  <div style={{ fontSize: "1.3rem", marginBottom: 14 }}>{w.icon}</div>
                  <div style={{ fontSize: ".98rem", fontWeight: 700, marginBottom: 7 }}>{w.title}</div>
                  <div style={{ fontSize: ".85rem", color: "#A78BFA", lineHeight: 1.65, marginBottom: 16 }}>{w.body}</div>
                  <div style={{ padding: "12px 14px", borderRadius: 11, background: "#160F2A", border: "1px solid #2D1F50" }}>
                    <div style={{ fontSize: ".68rem", letterSpacing: ".08em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 5 }}>Misol</div>
                    <div style={{ fontSize: ".82rem", color: "#EDE9FE", lineHeight: 1.55 }}>&ldquo;{w.example}&rdquo;</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === MATH/PRICING (2-col) === */}
      <div style={{ borderTop: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div className="rg-pricing" style={{ padding: "48px 0" }}>
            <div>
              <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>NARXLASH</div>
              <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em", lineHeight: 1.2, marginBottom: 14 }}>
                Adolatli va shaffof narxlash
              </h2>
              <p style={{ fontSize: ".95rem", color: "#A78BFA", lineHeight: 1.75, marginBottom: 20 }}>
                Yashirin to&apos;lovlar yo&apos;q. Faqat faol kunlar uchun to&apos;laysiz. Kunlik minimal $0.50 — boshlash uchun katta byudjet kerak emas.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {MATH_POINTS.map((text, i) => (
                  <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(245,158,11,.14)", color: "#FCD34D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, flexShrink: 0, marginTop: 3 }}>✓</span>
                    <span style={{ fontSize: ".88rem", color: "#EDE9FE", lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 11 }}>
              {MATH_CARDS.map((m) => (
                <div key={m.label} style={{ background: m.bg, border: `1px solid ${m.borderColor}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: ".7rem", letterSpacing: ".09em", textTransform: "uppercase", fontWeight: 700, color: m.labelColor, marginBottom: 9 }}>{m.label}</div>
                  <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.5rem", fontWeight: 700, lineHeight: 1, color: m.valColor, marginBottom: 7 }}>{m.value}</div>
                  <div style={{ fontSize: ".78rem", color: "#6D5B8E", lineHeight: 1.5 }}>{m.hint}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === FAQ (2-col grid) === */}
      <div style={{ borderTop: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ padding: "48px 0" }}>
            <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em", marginBottom: 24 }}>Ko&apos;p so&apos;raladigan savollar</h2>
            <div className="rg-2">
              {FAQ.map((f) => (
                <div key={f.q} style={{ background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 15, padding: 19 }}>
                  <div style={{ fontSize: ".9rem", fontWeight: 700, marginBottom: 7, lineHeight: 1.45 }}>{f.q}</div>
                  <div style={{ fontSize: ".84rem", color: "#A78BFA", lineHeight: 1.7 }}>{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === CTA gradient card === */}
      <div style={{ maxWidth: W, margin: "0 auto", padding: pad, paddingBottom: 60 }}>
        <div style={{ padding: "44px 34px", margin: "20px 0 0", borderRadius: 22, background: "linear-gradient(140deg,rgba(124,58,237,.25),#160F2A 62%)", border: "1px solid #2D1F50", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.9rem", fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.15, marginBottom: 12, textWrap: "balance" as "balance" }}>
            Bugun birinchi reklamangizni joylashtiring
          </h2>
          <p style={{ fontSize: ".95rem", color: "#A78BFA", maxWidth: "52ch", margin: "0 auto 24px", lineHeight: 1.7 }}>
            5 daqiqada ro&apos;yxatdan o&apos;ting, 10 daqiqada reklamangiz jonlashsin. Bugun boshlang — raqobat o&apos;sib boradi.
          </p>
          <div style={{ display: "flex", gap: 11, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth" style={{ padding: "14px 24px", borderRadius: 12, background: "#7C3AED", color: "#fff", fontSize: ".92rem", fontWeight: 700, textDecoration: "none" }}>
              Ro&apos;yxatdan o&apos;tish
            </Link>
            <Link href="/browse" style={{ padding: "14px 24px", borderRadius: 12, background: "transparent", border: "1px solid #2D1F50", color: "#EDE9FE", fontSize: ".92rem", fontWeight: 600, textDecoration: "none" }}>
              Barcha reklamalar
            </Link>
          </div>
          <div style={{ fontSize: ".79rem", color: "#6D5B8E", marginTop: 18 }}>
            Kredit kartangizni bog&apos;lash shart emas — avval ko&apos;ring, keyin to&apos;lang
          </div>
        </div>
      </div>
    </div>
  );
}
