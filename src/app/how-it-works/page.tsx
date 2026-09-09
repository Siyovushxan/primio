import Link from "next/link";

const STEPS = [
  { num: "01", icon: "📱", title: "Ro'yxatdan o'tish", body: "Telefon (OTP) va email orqali. Bir kishi — bir akkaunt." },
  { num: "02", icon: "📊", title: "Toifa va narxlarni ko'rish", body: "Reklama yaratishdan OLDIN shu toifadagi joriy bidlar ko'rsatiladi. Bozor narxini bilib qaror qilasiz." },
  { num: "03", icon: "✏️", title: "Reklama yaratish", body: "Sarlavha + rasm + URL + toifa + kunlik narx + davr (7/14/30 kun) — bitta forma." },
  { num: "04", icon: "🤖", title: "Avtomatik moderatsiya", body: "AI 30–60 soniyada tekshiradi. Rad etilsa — sabab ko'rsatiladi, qayta yuborish mumkin. Hali hech qanday to'lov bo'lmagan." },
  { num: "05", icon: "💳", title: "Tasdiqlandi → To'lov", body: "Jami summa ko'rsatiladi: $X/kun × N kun = $Y. Google Pay / Apple Pay / PayPal / USDT / Karta." },
  { num: "06", icon: "🚀", title: "To'lov → Darhol jonli", body: "Reyting kiritiladi. Impressions va clicks kuzatiladi. N kundan keyin avtomatik to'xtatiladi." },
];

const FAQS = [
  { q: "Narx qanday belgilanadi?", a: "Kim ko'proq to'lasa — yuqorida turadi. Boshqa hech qanday algoritm yo'q. Teng summa bo'lsa — avval yaratilgan reklama yuqorida (FIFO)." },
  { q: "Rad etilgan reklama uchun pul qaytariladi?", a: "Ha — lekin to'lov hech qachon olinmagan! Moderatsiya to'lovdan OLDIN bo'ladi. Bu eng katta afzalligimiz." },
  { q: "Davr tugagandan keyin nima bo'ladi?", a: "Reklama avtomatik to'xtatiladi va reytingdan chiqariladi. Siz email va push bildirishnoma olasiz (3 kun va 1 kun oldin). Dashboard'dan bitta klik bilan yangilash mumkin." },
  { q: "Raqibim yuqori bid qo'ysa nima qilaman?", a: "Push bildirish keladi: 'Raqibingiz $15/kun to'layapti'. Dashboard'dan [Bidni oshir] tugmasi bilan faqat qolgan kunlar uchun farq to'lab 1-o'ringa qaytasiz." },
  { q: "Qaysi mamlakatlardan reklama berish mumkin?", a: "135+ mamlakat. Stripe, PayPal, USDT/USDC qabul qilinadi. Har tomonlama global." },
  { q: "Reklama bekor qilsam puling qaytadimi?", a: "Ha. Qolgan kunlar × kunlik narx Stripe/PayPal orqali 3–5 ish kunida qaytariladi." },
];

const W = 1180;
const pad = "0 26px";

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", animation: "fade .35s ease both" }}>

      {/* Hero */}
      <div style={{ padding: "64px 0 48px", borderBottom: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 14 }}>QANDAY ISHLAYDI</div>
          <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.1, marginBottom: 16, maxWidth: "18ch" }}>
            6 qadamda reklama jonli
          </h1>
          <p style={{ fontSize: "1rem", color: "#A78BFA", maxWidth: "52ch", lineHeight: 1.7, marginBottom: 28 }}>
            Ro&apos;yxatdan o&apos;tishdan birinchi reklamangiz jonlashguniga qadar — 10 daqiqa.
          </p>
          {/* Core rule card */}
          <div style={{ display: "inline-block", padding: "16px 22px", borderRadius: 16, background: "linear-gradient(135deg,rgba(124,58,237,.18),rgba(245,158,11,.08))", border: "1px solid #7C3AED" }}>
            <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#EDE9FE" }}>
              Kim ko&apos;proq to&apos;lasa — <span style={{ color: "#F59E0B" }}>yuqorida turadi</span>
            </span>
            <div style={{ fontSize: ".82rem", color: "#A78BFA", marginTop: 6 }}>Boshqa hech qanday algoritm yo&apos;q. Faqat shu bitta qoida.</div>
          </div>
        </div>
      </div>

      {/* Steps 3-col grid */}
      <div style={{ borderBottom: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ padding: "48px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
              {STEPS.map((s) => (
                <div key={s.num} style={{ background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 15, padding: 20, color: "#EDE9FE" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#6D5B8E" }}>{s.num}</span>
                    <span style={{ fontSize: "1.05rem" }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize: ".95rem", fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: ".83rem", color: "#A78BFA", lineHeight: 1.6 }}>{s.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ borderBottom: "1px solid #2D1F50" }}>
        <div style={{ maxWidth: W, margin: "0 auto", padding: pad }}>
          <div style={{ padding: "48px 0" }}>
            <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-.02em", marginBottom: 24 }}>
              Ko&apos;p so&apos;raladigan savollar
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
              {FAQS.map((f) => (
                <div key={f.q} style={{ background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 15, padding: 19 }}>
                  <div style={{ fontSize: ".9rem", fontWeight: 700, marginBottom: 7, lineHeight: 1.45 }}>{f.q}</div>
                  <div style={{ fontSize: ".84rem", color: "#A78BFA", lineHeight: 1.7 }}>{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: W, margin: "0 auto", padding: pad, paddingBottom: 60 }}>
        <div style={{ padding: "44px 34px", margin: "40px 0 0", borderRadius: 22, background: "linear-gradient(140deg,rgba(124,58,237,.25),#160F2A 62%)", border: "1px solid #2D1F50", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.7rem", fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.2, marginBottom: 10 }}>
            Boshlashga tayyormisiz?
          </h2>
          <p style={{ fontSize: ".95rem", color: "#A78BFA", maxWidth: "46ch", margin: "0 auto 22px", lineHeight: 1.7 }}>
            Birinchi reklamangizni yarating. Moderatsiya bepul. To&apos;lov faqat tasdiqlangandan keyin.
          </p>
          <div style={{ display: "flex", gap: 11, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/create" style={{ padding: "13px 22px", borderRadius: 12, background: "#7C3AED", color: "#fff", fontSize: ".9rem", fontWeight: 700, textDecoration: "none" }}>
              Reklama berish →
            </Link>
            <Link href="/browse" style={{ padding: "13px 22px", borderRadius: 12, background: "transparent", border: "1px solid #2D1F50", color: "#EDE9FE", fontSize: ".9rem", fontWeight: 600, textDecoration: "none" }}>
              Reklamalarni ko&apos;rish
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
