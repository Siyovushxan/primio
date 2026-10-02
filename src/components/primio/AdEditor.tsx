"use client";
import {Suspense,useEffect,useState,type FormEvent} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {ArrowUpRight,ImagePlus,CheckCircle2} from "lucide-react";
import {useAuth} from "@/contexts/AuthContext";
import {useLang} from "@/contexts/LangContext";
import {CATEGORY_IDS,DAY_MS,milliseconds,validBid,validDuration,publicWebsite} from "@/lib/auction";
import {clientPost} from "@/lib/client-api";
import {ensureGuestSession} from "@/lib/guest-session";
import type {Ad,Category} from "@/types";
import {AdPreview,FlowShell,useOwnedAd} from "./AdFlow";
import {PositionEstimate} from "./PositionEstimate";
import {categoryName,LoadingState,money,pick} from "./shared";
function websiteAddress(value:string){return publicWebsite(value.includes("://")?value:"https://"+value);}
function websiteTitle(value:string){try{return new URL(websiteAddress(value)).hostname.replace(/^www\./,"").slice(0,60);}catch{return "";}}
function defaultCover(title:string):string{
 const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=630;
 const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Could not prepare the cover.");
 ctx.fillStyle="#251540";ctx.fillRect(0,0,1200,630);ctx.fillStyle="#b796ff";
 ctx.font="bold 160px sans-serif";ctx.textAlign="center";ctx.fillText(title.slice(0,1).toUpperCase(),600,295);
 ctx.fillStyle="#ffffff";ctx.font="40px sans-serif";ctx.fillText(title,600,410,1080);
 return canvas.toDataURL("image/jpeg",.85).split(",")[1];
}
async function compress(file:File):Promise<string>{
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5*1024*1024)throw new Error("JPG, PNG yoki WebP · 5 MB gacha / Up to 5 MB");
 const bitmap=await createImageBitmap(file);
 try{const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Image processing unavailable");ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
 let data="";for(const quality of [.88,.72,.55,.4]){data=canvas.toDataURL("image/jpeg",quality).split(",")[1];if(data.length<1_800_000)return data;}throw new Error("Rasm juda katta / Image is too large");
 }finally{bitmap.close();}
}
function Form({ad}:{ad?:Ad}){
 const {lang}=useLang();const {firebaseUser,userProfile,loading}=useAuth();const router=useRouter();const params=useSearchParams();
 const [title,setTitle]=useState(ad?.title||websiteTitle(params.get("url")||""));const [description,setDescription]=useState(ad?.description||"");const [url,setUrl]=useState(ad?.destinationURL||params.get("url")||"");
 const [category,setCategory]=useState<Category>(ad?.category||(CATEGORY_IDS.includes(params.get("category") as Category)?params.get("category") as Category:"technology"));
 const initBid=Number(params.get("minBid"));const initDays=Number(params.get("days"));
 const [bid,setBid]=useState(((ad?.dailyBidCents||(validBid(initBid)?initBid:100))/100).toFixed(2));const [days,setDays]=useState(ad?.durationDays||(validDuration(initDays)?initDays:1));
 const [image,setImage]=useState("");const [imageBusy,setImageBusy]=useState(false);const [step,setStep]=useState(0);const [error,setError]=useState("");const [review,setReview]=useState<{id:string;url:string}|null>(null);
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 const cents=Math.round(Number(bid)*100);const busy=step>0;const imageURL=image?"data:image/jpeg;base64,"+image:ad?.imageURL||"";
 const trialEndsAt=milliseconds(userProfile?.trialExpiresAt);const trialActive=trialEndsAt>now;const trialDaysLeft=Math.max(1,Math.ceil((trialEndsAt-now)/DAY_MS));
 const trialEndText=trialActive?new Date(trialEndsAt).toLocaleString(lang==="uz"?"uz-UZ":lang==="ru"?"ru-RU":"en-US",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Tashkent"}):"";
 async function choose(file?:File){if(!file)return;setImageBusy(true);setError("");setReview(null);try{setImage(await compress(file));}catch(e){setError(e instanceof Error?e.message:"Image error");}finally{setImageBusy(false);}}
 async function submit(e:FormEvent){
  e.preventDefault();setError("");
  if(!validBid(cents)||!validDuration(days)){setError(pick(lang,"Taklif yoki muddat noto‘g‘ri.","Invalid bid or duration.","Некорректная ставка или срок."));return;}
  try{websiteAddress(url);}catch{setError(pick(lang,"https:// bilan boshlanadigan ochiq sayt manzilini kiriting.","Enter a public HTTPS website.","Введите публичный HTTPS-адрес."));return;}
  try{
   if(!firebaseUser) { setStep(1); await ensureGuestSession(); }
   let receipt=review;
   if(!receipt){
    let uploadedURL=ad?.imageURL||"";let uploadId:string|undefined;
    const imageBytes=image||(!ad?defaultCover(title||websiteTitle(url)):"");
    if(imageBytes){setStep(1);const uploaded=await clientPost("/api/upload/image",{imageBase64:imageBytes});uploadedURL=uploaded.url;uploadId=uploaded.uploadId;}
    setStep(2);const result=await clientPost("/api/moderation",{title:title.trim(),description:description.trim(),destinationURL:websiteAddress(url),imageURL:uploadedURL,uploadId,existingAdId:ad?.id,...(imageBytes?{imageBase64:imageBytes,mimeType:"image/jpeg"}:{})});
    if(!result.approved)throw new Error(result.reason||pick(lang,"Reklama tekshiruvdan o‘tmadi.","Ad review did not pass.","Проверка не пройдена."));
    if(!result.reviewId)throw new Error(pick(lang,"Moderatsiya tasdig‘i olinmadi. Xizmatni sozlash yakunlanishi kerak.","Could not obtain a moderation receipt. Service configuration must be completed.","Не получено подтверждение модерации. Необходимо завершить настройку сервиса."));
    receipt={id:result.reviewId,url:uploadedURL};setReview(receipt);
   }
   setStep(3);const saved=await clientPost(ad?`/api/ads/${ad.id}/update`:"/api/ads/create",{title,description,destinationURL:websiteAddress(url),imageURL:receipt.url,category,dailyBidCents:cents,durationDays:days,reviewId:receipt.id});
   router.push(`/ads/${ad?.id||saved.adId}/pay`);
  }catch(e){setError(e instanceof Error?e.message:"Please retry.");setStep(0);}
 }
 if(loading)return <LoadingState label="Primio…"/>;
 if(ad&&(ad.totalPaidCents>0||!["pending","rejected"].includes(ad.status)||ad.pendingOrderId))return <div className="p-error">{pick(lang,"Faqat to‘lanmagan va ochiq to‘lov oynasi bo‘lmagan reklamani tahrirlash mumkin.","Only unpaid ads with no open checkout can be edited.","Можно изменить только неоплаченное объявление без открытого заказа.")}</div>;
 return <form className="p-form-grid" onSubmit={submit}><div><fieldset className="p-form-card p-editor-fields" disabled={busy||imageBusy} onChange={()=>setReview(null)}><h2>01 · {pick(lang,"Brendingiz haqida","About your brand","О вашем бренде")}</h2><label className="p-field">{pick(lang,"Sayt yoki ijtimoiy sahifa manzili","Website or social page","Сайт или страница в соцсети")}<input required type="text" inputMode="url" autoComplete="url" value={url} onChange={e=>{if(!title||title===websiteTitle(url))setTitle(websiteTitle(e.target.value));setUrl(e.target.value);}} placeholder="https://example.com"/></label><label className="p-field">{pick(lang,"Toifa","Category","Категория")}<select value={category} onChange={e=>setCategory(e.target.value as Category)}>{CATEGORY_IDS.map(id=><option key={id} value={id}>{categoryName(id,lang)}</option>)}</select></label><details className="p-ad-customize"><summary>{pick(lang,"Sarlavha, izoh va rasmni o‘zgartirish","Customize title, description and image","Изменить заголовок, описание и изображение")}</summary><label className="p-field">{pick(lang,"Reklama sarlavhasi","Ad title","Заголовок")}<input autoComplete="off" required maxLength={60} value={title} onChange={e=>setTitle(e.target.value)} placeholder={pick(lang,"Brendingizni tanishtiring","Introduce your brand","Представьте ваш бренд")}/><small>{title.length}/60</small></label><label className="p-field">{pick(lang,"Loyiha haqida","About the project","О проекте")}<textarea maxLength={500} rows={4} value={description} onChange={e=>setDescription(e.target.value)}/><small>{description.length}/500</small></label><label className="p-upload"><ImagePlus size={25}/><strong>{imageBusy?pick(lang,"Tayyorlanmoqda…","Preparing…","Подготовка…"):pick(lang,imageURL?"Rasmni almashtirish":"Rasm tanlash",imageURL?"Replace image":"Choose image",imageURL?"Заменить изображение":"Выбрать изображение")}</strong><span>JPG, PNG, WebP · 5 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>void choose(e.target.files?.[0])}/></label><p className="p-flow-note">{pick(lang,"Rasm tanlamasangiz, sayt nomi bilan sodda muqova tayyorlanadi.","Without an uploaded image, a simple cover uses your website name.","Без загруженного изображения создаётся простая обложка с названием сайта.")}</p></details></fieldset>
 <fieldset className="p-form-card p-editor-fields" disabled={busy} onChange={()=>setReview(null)}><h2>02 · {pick(lang,"Narx va ko‘rinish muddati","Price and display time","Цена и срок показа")}</h2><p className="p-flow-note">{pick(lang,"Ko‘proq ko‘rinishni xohlaysizmi? Yuqori joy uchun taklif bering. Eng yuqori taklif yuqorida ko‘rinadi.","Want more visibility? Offer more for a higher spot. The highest offer appears first.","Хотите больше просмотров? Предложите больше за место выше. Самое высокое предложение показывается первым.")}</p><div className="p-field-row"><label className="p-field">{pick(lang,"Bir kun uchun taklif · USD","Your offer per day · USD","Ваше предложение за день · USD")}<input type="number" min={1} max={10000} step=".01" required value={bid} onChange={e=>setBid(e.target.value)}/></label>{!trialActive&&<label className="p-field">{pick(lang,"Necha kun ko‘rinsin?","How many days?","Сколько дней показывать?")}<input type="number" min={1} max={365} step={1} required value={days} onChange={e=>setDays(Number(e.target.value))}/></label>}</div>{trialActive&&<p className="p-flow-note">{pick(lang,`Bepul reklama yana ${trialDaysLeft} kun, ${trialEndText} gacha ko‘rinadi.`, `Your free campaign will display for ${trialDaysLeft} more day(s), until ${trialEndText}.`,`Бесплатное продвижение продлится ещё ${trialDaysLeft} дн., до ${trialEndText}.`)}</p>}<p className="p-flow-note">{pick(lang,"Yangi pulli taklifning reyting kuchi 168 soat saqlanadi, keyin har soatda pasayadi va keyingi 24 soatda $1 ga yetadi. Reklama to‘langan muddatgacha ko‘rinadi. Teng kuchda oldin ishga tushgan reklama yuqorida turadi.","New paid bids hold their ranking strength for 168 hours, then decrease hourly to $1 over the next 24 hours. Ads stay visible for their paid duration. Equal strength favors earlier activation.","Сила новой оплаченной ставки сохраняется 168 часов, затем снижается каждый час до $1 за следующие 24 часа. Реклама показывается весь оплаченный срок. При равной силе приоритет у раннего объявления.")}</p></fieldset>
 {error&&<div className="p-error" role="alert" style={{marginTop:20}}>{error}</div>}
 {busy&&<div className="p-flow-progress" role="status">{[pick(lang,"Rasm yuklanmoqda","Uploading image","Загрузка изображения"),pick(lang,"Reklama tekshirilmoqda","Reviewing your ad","Проверка объявления"),pick(lang,"Saqlanmoqda","Saving","Сохранение")].map((label,i)=><div key={label} className={step===i+1?"is-active":""}>{step>i+1?<CheckCircle2 size={17}/>:<span>{i+1}</span>}{label}</div>)}</div>}
 </div><aside><AdPreview ad={{title,description,imageURL,category,dailyBidCents:validBid(cents)?cents:0}}/><section className="p-form-card" style={{marginTop:20}}><div className="p-price-total"><span>{pick(lang,"Jami to‘lov","Total to pay","Итого к оплате")}</span><strong>{trialActive?pick(lang,"BEPUL","FREE","БЕСПЛАТНО"):validBid(cents)&&validDuration(days)?money(cents*days):"—"}</strong></div><p className="p-flow-note">{trialActive?pick(lang,`Hisobingizdagi barcha imkoniyatlar ${trialEndText} gacha bepul. Reklama ham shu vaqtda yakunlanadi.`,`All features are free until ${trialEndText}. Your free promotion ends then.`,`Все функции бесплатны до ${trialEndText}. В это время бесплатное продвижение завершится.`):validBid(cents)&&validDuration(days)?`${money(cents)} × ${days} ${pick(lang,"kun","days","дней")}`:"—"}</p><PositionEstimate category={category} bidCents={cents} excludeId={ad?.id} onSelectTop={value=>{setBid((value/100).toFixed(2));setReview(null);}}/><p className="p-flow-note">{trialActive?pick(lang,"Taklifingiz o‘rinni belgilaydi; bepul hafta davomida pul yechilmaydi.","Your offer determines your position. No payment is taken during the free week.","Ваше предложение определяет позицию. В течение бесплатной недели оплата не взимается."):pick(lang,"Reklama tasdiqlangach to‘laysiz. To‘langan muddat reklama faollashganda boshlanadi.","Pay after approval. Your paid display time starts when the ad becomes active.","Оплатите после проверки. Оплаченный срок начнётся после активации объявления.")}</p><button className="p-btn p-btn-primary" disabled={busy||imageBusy} type="submit">{busy?pick(lang,"Tekshirilmoqda…","Reviewing…","Проверка…"):pick(lang,"Tekshiruvga yuborish","Submit for review","Отправить на проверку")}<ArrowUpRight size={16}/></button></section></aside></form>;
}
function CreateContent(){const {lang}=useLang();return <FlowShell title={pick(lang,"Brendingiz uchun yangi o‘rin.","A new spot for your brand.","Новое место для вашего бренда.")} description={pick(lang,"Reklamani yarating. Ko‘rinishini tekshiring. Keyingi qadam — moderatsiya.","Create your ad and preview it. Moderation is the next step.","Создайте объявление и оцените его вид. Следующий шаг — модерация.")}><Form/></FlowShell>;}
export function CreateAd(){return <Suspense fallback={<LoadingState label="Primio…"/>}><CreateContent/></Suspense>;}
function EditContent(){const {lang}=useLang();const {ad,error}=useOwnedAd();return <FlowShell title={pick(lang,"Reklamani tahrirlash","Edit your ad","Изменить объявление")}>{error?<div className="p-error">{error}</div>:ad?<Form key={ad.id} ad={ad}/>:<LoadingState label="Primio…"/>}</FlowShell>;}
export function EditAd(){return <Suspense fallback={<LoadingState label="Primio…"/>}><EditContent/></Suspense>;}
