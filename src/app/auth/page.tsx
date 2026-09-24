"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter,useSearchParams } from "next/navigation";
import { GoogleAuthProvider,signInWithPopup } from "firebase/auth";
import { ArrowUpRight, ShieldCheck, ChartNoAxesCombined, Layers3 } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { pick,LoadingState } from "@/components/primio/shared";
function AuthContent(){
 const {lang}=useLang();const router=useRouter();const params=useSearchParams();
 const {firebaseUser,userProfile,loading,profileError,refreshProfile}=useAuth();
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const requested=params.get("next")||"";
 const redirect=/^\/(?:create|ads|payment|dashboard)(?:[/?]|$)/.test(requested)&&!requested.includes("\\")?requested:"/dashboard";
 useEffect(()=>{if(!loading&&firebaseUser&&userProfile)router.replace(redirect);},[loading,firebaseUser,userProfile,router,redirect]);
 async function login(){setBusy(true);setError("");try{await signInWithPopup(auth,new GoogleAuthProvider());}catch{setError(pick(lang,"Kirish amalga oshmadi. Qayta urinib ko‘ring.","Sign-in failed. Please try again.","Не удалось войти. Попробуйте снова."));}finally{setBusy(false);}}
 return <div className="p-site"><div className="p-auth-container"><div><span className="p-eyebrow">PRIMIO / {pick(lang,"YANGI BOSHLANISH","YOUR NEXT CHAPTER","НОВОЕ НАЧАЛО")}</span><h1>{pick(lang,"Keyingi o‘rin","The next spot","Следующее место")}<br/><span className="p-gradient-text">{pick(lang,"sizni kutmoqda.","is waiting for you.","ждёт вас.")}</span></h1><p>{pick(lang,"Brendingiz uchun yangi imkoniyat. Reklama, reyting va natijalar — barchasi bitta kabinetda.","A new opportunity for your brand. Ads, rankings and results, together in one workspace.","Новая возможность для вашего бренда. Объявления, рейтинг и результаты — в одном кабинете.")}</p><ul className="p-check-list"><li><Layers3/>{pick(lang,"8 ta toifada reklama","Advertise across 8 categories","Реклама в 8 категориях")}</li><li><ChartNoAxesCombined/>{pick(lang,"Aniq reyting va statistika","Clear rankings and analytics","Понятный рейтинг и статистика")}</li><li><ShieldCheck/>{pick(lang,"To‘lovdan oldin moderatsiya","Moderation before payment","Модерация до оплаты")}</li></ul></div>
 <div className="p-auth-card"><h2>{pick(lang,"Primio’ga xush kelibsiz","Welcome to Primio","Добро пожаловать в Primio")}</h2><p>{pick(lang,"Hisobingizga kiring yoki yangisini yarating.","Sign in or create your account.","Войдите или создайте аккаунт.")}</p>{(error||profileError)&&<div className="p-error" role="alert">{error||pick(lang,"Profil yuklanmadi. Qayta urinib ko‘ring.","Could not load your profile. Please retry.","Не удалось загрузить профиль.")}{profileError&&<button onClick={refreshProfile}>{pick(lang,"Qayta urinish","Retry","Повторить")}</button>}</div>}
 <button className="p-btn p-btn-light" onClick={login} disabled={busy||(!!firebaseUser&&loading)}><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.6a4.8 4.8 0 0 1-2.1 3.2v2.7H19c2-1.8 3-4.4 3-7.8Z"/><path fill="#34A853" d="M12 22c2.8 0 5.2-.9 7-2.5l-3.5-2.7c-.9.6-2.1 1-3.5 1-2.7 0-5-1.9-5.8-4.4H2.6v2.8A10.6 10.6 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.2 13.4a6.4 6.4 0 0 1 0-3.8V6.8H2.6a10.2 10.2 0 0 0 0 9.4l3.6-2.8Z"/><path fill="#EA4335" d="M12 5.2c1.5 0 2.9.5 3.9 1.5l3-3A10 10 0 0 0 12 1.9a10.6 10.6 0 0 0-9.4 5l3.6 2.7c.8-2.5 3.1-4.4 5.8-4.4Z"/></svg>{busy?pick(lang,"Kirilmoqda…","Signing in…","Вход…"):pick(lang,"Google orqali davom etish","Continue with Google","Продолжить с Google")}</button>
 <p className="p-auth-note">{pick(lang,"Reklama joylashtirishdan oldin xizmat shartlarini o‘qib chiqing.","Read the service terms before placing an ad.","Перед размещением рекламы ознакомьтесь с условиями.")} <Link href="/terms">{pick(lang,"Shartlar","Terms","Условия")} ↗</Link></p><Link className="p-text-link" style={{marginTop:24}} href="/dashboard/demo">{pick(lang,"Avval demo kabinetni ko‘rish","Explore the demo first","Сначала посмотреть демо")}<ArrowUpRight size={15}/></Link></div></div></div>;
}
export default function AuthPage(){return <Suspense fallback={<LoadingState label="Primio…"/>}><AuthContent/></Suspense>;}
