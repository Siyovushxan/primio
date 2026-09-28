import Link from "next/link";

export const metadata = { title: "Maxfiylik siyosati — Primio" };

export default function PrivacyPage() {
  return <article style={{ maxWidth: 760, margin: "60px auto", padding: "0 24px 80px", lineHeight: 1.8 }}>
    <h1>Maxfiylik siyosati</h1>
    <p>Yangilangan: 2026-yil 28-sentabr</p>
    <p>Primio hisob ma’lumotlari, reklamalar, to‘lovlar va reklama samaradorligi ma’lumotlaridan xizmatni ko‘rsatish uchun foydalanadi. Kabinetdagi Primio ko‘rsatkichlari Primio ichidagi reklama harakatlariga tegishli.</p>
    <h2>Google Analytics ulanishi</h2>
    <p>Google Analytics ulanishi ixtiyoriy. Ulanganingizda Primio faqat <code>analytics.readonly</code> ruxsatini so‘raydi. Primio siz kira oladigan Google Analytics property ro‘yxatini va siz tanlagan property bo‘yicha yig‘ma hisobotlarni ko‘rsatadi. Primio Google Analytics ma’lumotlari yoki sozlamalarini o‘zgartirmaydi.</p>
    <p>Google bergan refresh token serverda AES-256-GCM bilan shifrlanib saqlanadi. Hisobotlar Google’dan so‘rov paytida olinadi va Primio ma’lumotlar bazasida alohida saqlanmaydi. Ulanishni kabinetingizdan uzsangiz, Primio saqlagan tokenni o‘chiradi va Google’dagi ruxsatni bekor qilishga so‘rov yuboradi. Google hisobingizda ham uchinchi tomon ruxsatini bekor qilishingiz mumkin.</p>
    <h2>Ma’lumotlardan foydalanish</h2>
    <p>Google Analytics ma’lumotlari sizga sayt hisobotini ko‘rsatish uchun ishlatiladi. Ular boshqa foydalanuvchilarga ko‘rsatilmaydi. AI xulosasi faqat o‘zingiz har safar rozilik bildirganingizda so‘raladi; bunda faqat yig‘ma ko‘rsatkichlar AI xizmatiga yuboriladi.</p>
    <h2>Savollar va o‘chirish</h2>
    <p>Ma’lumotlaringiz yoki ulanishni o‘chirish bo‘yicha savollar uchun OAuth oynasida ko‘rsatilgan Primio aloqa manziliga murojaat qiling.</p>
    <p><Link href="/">Bosh sahifaga qaytish</Link></p>
  </article>;
}
