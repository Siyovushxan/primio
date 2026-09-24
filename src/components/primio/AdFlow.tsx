"use client";
import {useEffect,useState,type ReactNode} from "react";
import {useParams,usePathname,useRouter} from "next/navigation";
import {doc,onSnapshot} from "firebase/firestore";
import {ArrowLeft,ArrowUpRight,Clock,CheckCircle2} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {db} from "@/lib/firebase";
import {useAuth} from "@/contexts/AuthContext";
import {useLang} from "@/contexts/LangContext";
import {clientPost} from "@/lib/client-api";
import {quotePayment,type PaymentKind} from "@/lib/auction";
import type {Ad} from "@/types";
import {Brand,LoadingState,categoryName,money,pick} from "./shared";
import {statusText} from "./AdList";
export function FlowShell({title,description,children}:{title:string;description?:string;children:ReactNode}){
 const {lang}=useLang();
 return <div className="p-form-shell"><header className="p-simple-header"><Brand/><Link className="p-text-link" href="/dashboard"><ArrowLeft size={15}/>{pick(lang,"Kabinetga qaytish","Back to workspace","В кабинет")}</Link></header><div className="p-form-container"><div className="p-form-heading"><span className="p-eyebrow">PRIMIO / {pick(lang,"REKLAMA BOSHQARUVI","CAMPAIGN MANAGEMENT","УПРАВЛЕНИЕ РЕКЛАМОЙ")}</span><h1>{title}</h1>{description&&<p>{description}</p>}</div>{children}</div></div>;
}
export function useOwnedAd(){
 const {adId}=useParams<{adId:string}>();const {firebaseUser,loading:authLoading}=useAuth();const router=useRouter();const path=usePathname();
 const [ad,setAd]=useState<Ad|null>(null);const [error,setError]=useState("");
 useEffect(()=>{
  if(authLoading)return;
  if(!firebaseUser){router.replace("/auth?next="+encodeURIComponent(path));return;}
  return onSnapshot(doc(db,"ads",adId),snap=>{
   if(!snap.exists()||snap.data().advertiserUID!==firebaseUser.uid){setError("Reklama topilmadi / Ad not found");return;}
   setAd({id:snap.id,...snap.data()} as Ad);
  },()=>setError("Reklamani yuklab bo‘lmadi / Could not load the ad"));
 },[adId,firebaseUser,authLoading,router,path]);
 return {ad,error,adId};
}
export function AdPreview({ad}:{ad:Pick<Ad,"title"|"description"|"imageURL"|"category"|"dailyBidCents">}){
 const {lang}=useLang();
 return <article className="p-browse-card">{ad.imageURL&&<div className="p-browse-image"><Image src={ad.imageURL} alt={ad.title} fill unoptimized sizes="(max-width:639px) 100vw, 400px"/></div>}<div className="p-browse-card-body"><span>{categoryName(ad.category,lang)}</span><h2>{ad.title||pick(lang,"Reklama sarlavhasi","Ad title","Заголовок объявления")}</h2><p>{ad.description}</p><b>{money(ad.dailyBidCents)} / {pick(lang,"kun","day","день")}</b></div></article>;
}
function CheckoutForm({ad,type}:{ad:Ad;type:PaymentKind}){
 const {lang}=useLang();
 const [bid,setBid]=useState(((ad.dailyBidCents+100)/100).toFixed(2));const [days,setDays]=useState(ad.durationDays);const [agreed,setAgreed]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(id);},[]);
 let quote:ReturnType<typeof quotePayment>|undefined;let invalid="";
 try{quote=quotePayment(ad,type,Math.round(Number(bid)*100),days,now);}catch(e){invalid=e instanceof Error?e.message:"Invalid order";}
 async function checkout(){if(!agreed||!quote)return;setBusy(true);setError("");try{const result=await clientPost("/api/payment/create-session",{adId:ad.id,type,newDailyBidCents:quote.dailyBidCents,durationDays:quote.durationDays});window.location.assign(result.url);}catch(e){setError(e instanceof Error?e.message:"Please retry.");setBusy(false);}}
 async function cancel(){setBusy(true);setError("");try{await clientPost("/api/payment/cancel-session",{adId:ad.id});}catch(e){setError(e instanceof Error?e.message:"Please retry.");}finally{setBusy(false);}}
 return <div className="p-form-grid"><div><section className="p-form-card"><h2>{ad.title}</h2>{type==="bid_upgrade"?<label className="p-field">{pick(lang,"Yangi kunlik taklif · USD","New daily bid · USD","Новая дневная ставка · USD")}<input type="number" min={(ad.dailyBidCents+1)/100} max={10000} step=".01" value={bid} onChange={e=>setBid(e.target.value)}/><small>{pick(lang,"Joriy taklif","Current bid","Текущая ставка")}: {money(ad.dailyBidCents)}</small></label>:<div className="p-field"><span>{pick(lang,"Kunlik taklif","Daily bid","Дневная ставка")}</span><strong>{money(ad.dailyBidCents)}</strong></div>}
 {type==="renewal"&&<label className="p-field">{pick(lang,"Yangi muddat · kun","New duration · days","Новый срок · дни")}<input type="number" min={1} max={365} step={1} value={days} onChange={e=>setDays(Number(e.target.value))}/></label>}
 <div className="p-price-total"><div><span>{pick(lang,"Joylashuv narxi","Placement price","Стоимость размещения")}</span><small>{type==="bid_upgrade"?pick(lang,"Stavkalar farqi × qolgan kunlar; to‘liq bo‘lmagan kun yuqoriga yaxlitlanadi.","Bid difference × days remaining, rounded up to whole days.","Разница ставок × оставшиеся дни с округлением вверх."):pick(lang,"Kunlik taklif × muddat","Daily bid × duration","Дневная ставка × срок")}</small></div><strong>{quote?money(quote.amountCents):"—"}</strong></div>
 {quote&&<p className="p-flow-note">{type==="bid_upgrade"?money(quote.dailyBidCents-ad.dailyBidCents):money(quote.dailyBidCents)} × {quote.durationDays} {pick(lang,"kun","days","дней")}</p>}
 <p className="p-flow-note">{pick(lang,"Soliqlar va yakuniy summa to‘lov oynasida ko‘rsatiladi.","Taxes and the final charge are shown at checkout.","Налоги и итоговая сумма отображаются при оплате.")}</p>
 {(invalid||error)&&<div className="p-error" role="alert">{error||invalid}</div>}
 {ad.pendingOrderId&&<div className="p-flow-notice"><p>{pick(lang,"Oldingi to‘lov oynasi mavjud. Davom etish avvalgi buyurtmani ochadi. Parametrlarni o‘zgartirish uchun oldin uni bekor qiling.","An existing checkout will be resumed. Cancel it first to change your order.","Продолжение откроет предыдущий заказ. Отмените его, чтобы изменить параметры.")}</p><button type="button" className="p-text-link" disabled={busy} onClick={cancel}>{pick(lang,"Oldingi buyurtmani bekor qilish","Cancel previous checkout","Отменить предыдущий заказ")}</button><small>{pick(lang,"Bu amalga oshgan to‘lovni qaytarmaydi. Bekor qilingan oynada boshqa to‘lov qilmang.","This does not refund a completed payment. Do not pay through the cancelled checkout.","Это не возвращает совершённый платёж. Не оплачивайте отменённый заказ.")}</small></div>}
 <label className="p-consent"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/><span><Link href="/terms" target="_blank">{pick(lang,"Xizmat shartlari","Service terms","Условия сервиса")}</Link>{pick(lang,"ni o‘qidim va qabul qilaman.",": I have read and accept them.",": я прочитал и принимаю их.")}</span></label>
 <button className="p-btn p-btn-primary" disabled={busy||!agreed||!quote} onClick={checkout}>{busy?pick(lang,"Tayyorlanmoqda…","Preparing…","Подготовка…"):pick(lang,"To‘lovga o‘tish","Continue to checkout","Перейти к оплате")}<ArrowUpRight size={16}/></button></section></div><aside><AdPreview ad={ad}/></aside></div>;
}
export function Checkout({type}:{type:PaymentKind}){
 const {lang}=useLang();const {ad,error}=useOwnedAd();
 const title=type==="purchase"?pick(lang,"Reklamangizni ishga tushiring.","Launch your campaign.","Запустите рекламу."):type==="renewal"?pick(lang,"Yangi muddat. Yangi imkoniyat.","A new period. A new opportunity.","Новый срок. Новые возможности."):pick(lang,"Yuqoriroq o‘ringa chiqing.","Move up the ranking.","Поднимитесь в рейтинге.");
 return <FlowShell title={title}>{error?<div className="p-error" role="alert">{error}</div>:ad?<CheckoutForm key={ad.id} ad={ad} type={type}/>:<LoadingState label={pick(lang,"Yuklanmoqda…","Loading…","Загрузка…")}/>}</FlowShell>;
}
export function PendingAd(){
 const {lang}=useLang();const {ad,error}=useOwnedAd();
 return <FlowShell title={pick(lang,"Reklamangiz holati","Campaign status","Статус объявления")}>{error?<div className="p-error">{error}</div>:ad?<div className="p-form-grid"><section className="p-form-card"><span className={"p-status-badge "+ad.status}>{statusText(ad.status,lang)}</span><h2 style={{marginTop:24}}>{ad.title}</h2>{ad.status==="active"?<CheckCircle2 size={35} color="#cce8a1"/>:<Clock size={35} color="#b796ff"/>}<p className="p-flow-note">{ad.paymentReviewRequired?pick(lang,"To‘lov qayd etilgan, lekin buyurtma alohida ko‘rib chiqilishi kerak. Qayta to‘lamang.","Payment is recorded, but the order needs a manual review. Do not pay again.","Платёж зарегистрирован, но заказ требует проверки. Не платите повторно."):ad.status==="pending_verification"?pick(lang,"To‘lov qabul qilingan. Administrator tasdiqlagach, reklama va uning pullik muddati boshlanadi.","Payment received. Your campaign and its paid period start after administrator approval.","Платёж получен. Реклама и её оплаченный срок начнутся после одобрения администратора."):ad.rejectionReason||statusText(ad.status,lang)}</p>{ad.status==="pending"&&!ad.paymentReviewRequired&&<Link className="p-btn p-btn-primary" href={`/ads/${ad.id}/pay`}>{pick(lang,"To‘lovga o‘tish","Continue to payment","Перейти к оплате")}</Link>}<Link className="p-text-link" style={{marginTop:22}} href="/dashboard">{pick(lang,"Kabinetni ochish","Open workspace","Открыть кабинет")}<ArrowUpRight size={15}/></Link></section><aside><AdPreview ad={ad}/></aside></div>:<LoadingState label="Primio…"/>}</FlowShell>;
}
