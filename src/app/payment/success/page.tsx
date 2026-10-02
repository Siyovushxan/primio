"use client";
import {Suspense,useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {CheckCircle2,Clock,ArrowUpRight} from "lucide-react";
import {useAuth} from "@/contexts/AuthContext";
import {useLang} from "@/contexts/LangContext";
import {clientPost} from "@/lib/client-api";
import {FlowShell} from "@/components/primio/AdFlow";
import {LoadingState,pick} from "@/components/primio/shared";
function Content(){
 const params=useSearchParams();const {lang}=useLang();const {firebaseUser,loading}=useAuth();const adId=params.get("adId");const orderId=params.get("orderId");
 const [state,setState]=useState<"checking"|"waiting"|"paid"|"review"|"error">("checking");const [revision,setRevision]=useState(0);
 useEffect(()=>{
  if(loading)return;
  if(!firebaseUser)return;
  if(!adId)return;
  let active=true;let timer:ReturnType<typeof setTimeout>;let attempts=0;
  async function verify(){
   try{const result=await clientPost("/api/payment/verify-session",{adId,orderId});if(!active)return;
    if(result.paid){setState(result.needsReview?"review":"paid");return;}
    setState("waiting");if(++attempts<4)timer=setTimeout(()=>void verify(),4000);
   }catch{if(active)setState("error");}
  }
  void verify();return()=>{active=false;clearTimeout(timer);};
 },[firebaseUser,loading,adId,orderId,revision]);
 const confirmed=state==="paid"||state==="review";
 return <FlowShell title={pick(lang,"To‘lov holati","Payment status","Статус платежа")}><section className="p-form-card" style={{maxWidth:650,margin:"auto"}}>{!adId?<div className="p-error">{pick(lang,"Buyurtma topilmadi.","Order not found.","Заказ не найден.")}</div>:!loading&&!firebaseUser?<p className="p-flow-note">{pick(lang,"To‘lovni boshlagan brauzeringizdan oching. Kirish yo‘qolgan bo‘lsa, support@primio.com.uz manziliga to‘lov cheki bilan murojaat qiling. Qayta to‘lamang.","Open this in the browser where checkout started. If access was lost, contact support@primio.com.uz with your receipt. Do not pay again.","Откройте в браузере, где началась оплата. Если доступ потерян, отправьте чек на support@primio.com.uz. Не платите повторно.")}</p>:state==="checking"?<LoadingState label={pick(lang,"To‘lov tekshirilmoqda…","Confirming payment…","Подтверждение платежа…")}/>:<><div style={{marginBottom:22}}>{confirmed?<CheckCircle2 size={40} color="#c9e8a6"/>:<Clock size={40} color="#bd9aea"/>}</div><h2>{confirmed?pick(lang,"To‘lov qayd etildi.","Payment recorded.","Платёж зарегистрирован."):pick(lang,"Tasdiq kutilmoqda.","Awaiting confirmation.","Ожидается подтверждение.")}</h2><p className="p-flow-note">{state==="review"?pick(lang,"Buyurtma alohida ko‘rib chiqilishi kerak. To‘lovingiz qayd etilgan — qayta to‘lamang.","The order needs a manual review. Your payment is recorded; do not pay again.","Заказ требует проверки. Платёж зарегистрирован — не платите повторно."):state==="paid"?pick(lang,"AI tekshiruvidan o‘tgan reklama tasdiqlangan to‘lovdan so‘ng avtomatik faollashadi. Holatini quyidagi havoladan ko‘ring.","AI-approved ads activate automatically after confirmed payment. View the status using the link below.","После проверки AI и подтверждения оплаты объявление активируется автоматически. Статус доступен по ссылке ниже."):pick(lang,"To‘lov hali tasdiqlanmadi. Bankdan pul yechilgan bo‘lsa, qayta to‘lamang; birozdan keyin yana tekshiring.","Payment is not confirmed yet. If you were charged, do not pay again; check again shortly.","Платёж пока не подтверждён. Если деньги списаны, не платите повторно; проверьте позже.")}</p>{!confirmed&&<button className="p-btn p-btn-primary" onClick={()=>{setState("checking");setRevision(value=>value+1);}}>{pick(lang,"Qayta tekshirish","Check again","Проверить снова")}</button>}</>}<Link style={{marginTop:22}} className="p-text-link" href={adId?`/ads/${encodeURIComponent(adId)}/pending`:"/create"}>{pick(lang,"Reklama holatini ko‘rish","View campaign status","Посмотреть статус объявления")}<ArrowUpRight size={15}/></Link></section></FlowShell>;
}
export default function Page(){return <Suspense fallback={<LoadingState label="Primio…"/>}><Content/></Suspense>;}
