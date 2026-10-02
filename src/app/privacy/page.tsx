import Link from "next/link";
import { AnalyticsPreferencesButton } from "@/components/primio/AnalyticsConsent";
import "./privacy.css";

export const metadata = { title: "Maxfiylik siyosati — Primio" };

export default function PrivacyPage() {
  return <article className="primio-privacy" style={{ maxWidth: 760, margin: "60px auto", padding: "0 24px 80px", lineHeight: 1.8 }}>
    <h1>Maxfiylik siyosati</h1>
    <p>Yangilangan: 2026-yil 2-oktabr</p>
    <p>Primio reklama mazmuni, vaqtinchalik brauzer identifikatori va to‘lov ma’lumotlaridan reklama xizmatini ko‘rsatish uchun foydalanadi. Reklama joylash uchun profil yaratish yoki Google orqali kirish talab qilinmaydi.</p>
    <h2>Reklama va AI tekshiruvi</h2>
    <p>Reklama havolasi, sarlavhasi, izohi va rasmi AI tekshiruviga yuboriladi. Tekshiruvdan o‘tgan reklama to‘lov tasdiqlangach ommaviy katalogda ko‘rinadi.</p>
    <h2>Brauzer va to‘lov</h2>
    <p>To‘lovga tayyorlangan reklama shu brauzerdagi vaqtinchalik identifikatorga bog‘lanadi. Brauzer ma’lumotlari o‘chirilsa yoki boshqa qurilmaga o‘tilsa, shu reklamaga kirish yo‘qolishi mumkin. To‘lov uchun ko‘rsatilgan elektron pochta to‘lov xizmatiga chek yuborish maqsadida beriladi.</p>
    <h2>Avvalgi ulanishlar</h2>
    <p>Ilgari Google Analytics ulangan bo‘lsa, bu ruxsatni Google hisobingizdagi uchinchi tomon ulanishlaridan bekor qilishingiz mumkin. Primio’da saqlangan ulanish yoki boshqa ma’lumotlarni o‘chirish uchun support@primio.com.uz manziliga murojaat qiling.</p>
    <h2>Primio saytidagi tashriflarni o‘lchash</h2>
    <p>Rozilik bersangiz, Primio ommaviy sahifalarga tashrifni Google Analytics orqali o‘lchaydi. Sahifa yo‘li va brauzerga oid texnik ma’lumotlar Google’ga yuboriladi. Reklama yaratish va to‘lov sahifalari o‘lchanmaydi. Dastlab rad etsangiz, Google Analytics tegi yuklanmaydi; keyin rad etsangiz, keyingi tashriflar o‘lchanmaydi. Tanlovni keyin o‘zgartirishingiz mumkin.</p>
    <AnalyticsPreferencesButton />
    <h2>Savollar va o‘chirish</h2>
    <p>Ma’lumotlaringiz yoki ulanishni o‘chirish bo‘yicha savollar uchun support@primio.com.uz manziliga murojaat qiling.</p>
    <p><Link href="/">Bosh sahifaga qaytish</Link></p>
  </article>;
}
