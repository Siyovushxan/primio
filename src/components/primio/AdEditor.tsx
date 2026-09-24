"use client";
import {Suspense,useEffect,useState,type FormEvent} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {ArrowUpRight,ImagePlus,CheckCircle2} from "lucide-react";
import {useAuth} from "@/contexts/AuthContext";
import {useLang} from "@/contexts/LangContext";
import {CATEGORY_IDS,validBid,validDuration,publicWebsite} from "@/lib/auction";
import {clientPost} from "@/lib/client-api";
import type {Ad,Category} from "@/types";
import {AdPreview,FlowShell,useOwnedAd} from "./AdFlow";
import {categoryName,LoadingState,money,pick} from "./shared";
async function compress(file:File):Promise<string>{
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5*1024*1024)throw new Error("JPG, PNG yoki WebP · 5 MB gacha / Up to 5 MB");
 const bitmap=await createImageBitmap(file);
 try{const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Image processing unavailable");ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
 let data="";for(const quality of [.88,.72,.55,.4]){data=canvas.toDataURL("image/jpeg",quality).split(",")[1];if(data.length<1_800_000)return data;}throw new Error("Rasm juda katta / Image is too large");
 }finally{bitmap.close();}
}
function Form({ad}:{ad?:Ad}){
 const {lang}=useLang();const {firebaseUser,loading}=useAuth();const router=useRouter();const params=useSearchParams();
 const [title,setTitle]=useState(ad?.title||"");const [description,setDescription]=useState(ad?.description||"");const [url,setUrl]=useState(ad?.destinationURL||"");
 const [category,setCategory]=useState<Category>(ad?.category||(CATEGORY_IDS.includes(params.get("category") as Category)?params.get("category") as Category:"technology"));
 const initBid=Number(params.get("minBid"));const initDays=Number(params.get("days"));
 const [bid,setBid]=useState(((ad?.dailyBidCents||(validBid(initBid)?initBid:100))/100).toFixed(2));const [days,setDays]=useState(ad?.durationDays||(validDuration(initDays)?initDays:7));
 const [image,setImage]=useState("");const [imageBusy,setImageBusy]=useState(false);const [step,setStep]=useState(0);const [error,setError]=useState("");const [review,setReview]=useState<{id:string;url:string}|null>(null);
 useEffect(()=>{if(!loading&&!firebaseUser)router.replace("/auth?next="+encodeURIComponent("/create"+(params.size?"?"+params.toString():"")));},[loading,firebaseUser,router,params]);
 const cents=Math.round(Number(bid)*100);const busy=step>0;const imageURL=image?"data:image/jpeg;base64,"+image:ad?.imageURL||"";
 async function choose(file?:File){if(!file)return;setImageBusy(true);setError("");setReview(null);try{setImage(await compress(file));}catch(e){setError(e instanceof Error?e.message:"Image error");}finally{setImageBusy(false);}}
 async function submit(e:FormEvent){
  e.preventDefault();setError("");
  if(!validBid(cents)||!validDuration(days)){setError(pick(lang,"Taklif yoki muddat noto‘g‘ri.","Invalid bid or duration.","Некорректная ставка или срок."));return;}
  try{publicWebsite(url);}catch{setError(pick(lang,"https:// bilan boshlanadigan ochiq sayt manzilini kiriting.","Enter a public HTTPS website.","Введите публичный HTTPS-адрес."));return;}
  if(!imageURL){setError(pick(lang,"Rasm tanlang.","Choose an image.","Выберите изображение."));return;}
  try{
   let receipt=review;
   if(!receipt){
    let uploadedURL=ad?.imageURL||"";let uploadId:string|undefined;
    if(image){setStep(1);const uploaded=await clientPost("/api/upload/image",{imageBase64:image});uploadedURL=uploaded.url;uploadId=uploaded.uploadId;}
    setStep(2);const result=await clientPost("/api/moderation",{title:title.trim(),description:description.trim(),destinationURL:publicWebsite(url),imageURL:uploadedURL,uploadId,existingAdId:ad?.id,...(image?{imageBase64:image,mimeType:"image/jpeg"}:{})});
    if(!result.approved)throw new Error(result.reason||pick(lang,"Reklama tekshiruvdan o‘tmadi.","Ad review did not pass.","Проверка не пройдена."));
    if(!result.reviewId)throw new Error(pick(lang,"Moderatsiya tasdig‘i olinmadi. Xizmatni sozlash yakunlanishi kerak.","Could not obtain a moderation receipt. Service configuration must be completed.","Не получено подтверждение модерации. Необходимо завершить настройку сервиса."));
    receipt={id:result.reviewId,url:uploadedURL};setReview(receipt);
   }
   setStep(3);const saved=await clientPost(ad?`/api/ads/${ad.id}/update`:"/api/ads/create",{title,description,destinationURL:url,imageURL:receipt.url,category,dailyBidCents:cents,durationDays:days,reviewId:receipt.id});
   router.push(`/ads/${ad?.id||saved.adId}/pay`);
  }catch(e){setError(e instanceof Error?e.message:"Please retry.");setStep(0);}
 }
 if(loading||!firebaseUser)return <LoadingState label="Primio…"/>;
 if(ad&&(ad.totalPaidCents>0||!["pending","rejected"].includes(ad.status)||ad.pendingOrderId))return <div className="p-error">{pick(lang,"Faqat to‘lanmagan va ochiq to‘lov oynasi bo‘lmagan reklamani tahrirlash mumkin.","Only unpaid ads with no open checkout can be edited.","Можно изменить только неоплаченное объявление без открытого заказа.")}</div>;
 return <form className="p-form-grid" onSubmit={submit}><div><fieldset className="p-form-card p-editor-fields" disabled={busy||imageBusy} onChange={()=>setReview(null)}><h2>01 · {pick(lang,"Brendingiz haqida","About your brand","О вашем бренде")}</h2><label className="p-field">{pick(lang,"Reklama sarlavhasi","Ad title","Заголовок")}<input autoComplete="off" required maxLength={60} value={title} onChange={e=>setTitle(e.target.value)} placeholder={pick(lang,"Brendingizni tanishtiring","Introduce your brand","Представьте ваш бренд")}/><small>{title.length}/60</small></label><label className="p-field">{pick(lang,"Qisqa tavsif","Short description","Краткое описание")}<textarea maxLength={200} rows={3} value={description} onChange={e=>setDescription(e.target.value)}/><small>{description.length}/200</small></label><label className="p-field">{pick(lang,"Sayt manzili","Website address","Адрес сайта")}<input required type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com"/></label><label className="p-field">{pick(lang,"Toifa","Category","Категория")}<select value={category} onChange={e=>setCategory(e.target.value as Category)}>{CATEGORY_IDS.map(id=><option key={id} value={id}>{categoryName(id,lang)}</option>)}</select></label><label className="p-upload"><ImagePlus size={25}/><strong>{imageBusy?pick(lang,"Tayyorlanmoqda…","Preparing…","Подготовка…"):pick(lang,imageURL?"Rasmni almashtirish":"Rasm tanlash",imageURL?"Replace image":"Choose image",imageURL?"Заменить изображение":"Выбрать изображение")}</strong><span>JPG, PNG, WebP · 5 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>void choose(e.target.files?.[0])}/></label></fieldset>
 <fieldset className="p-form-card p-editor-fields" disabled={busy} onChange={()=>setReview(null)}><h2>02 · {pick(lang,"Taklif va muddat","Bid and duration","Ставка и срок")}</h2><div className="p-field-row"><label className="p-field">{pick(lang,"Kunlik taklif · USD","Daily bid · USD","В день · USD")}<input type="number" min={1} max={10000} step=".01" required value={bid} onChange={e=>setBid(e.target.value)}/></label><label className="p-field">{pick(lang,"Muddat · kun","Duration · days","Срок · дни")}<input type="number" min={1} max={365} step={1} required value={days} onChange={e=>setDays(Number(e.target.value))}/></label></div><p className="p-flow-note">{pick(lang,"Yuqori taklif toifa reytingida ustunlik beradi. Teng taklifda avval faollashgan reklama oldinda.","Higher bids rank first within a category. Equal bids favor the earlier activation.","Высокая ставка повышает место в категории. При равенстве выше более ранняя активация.")}</p></fieldset>
 {error&&<div className="p-error" role="alert" style={{marginTop:20}}>{error}</div>}
 {busy&&<div className="p-flow-progress" role="status">{[pick(lang,"Rasm yuklanmoqda","Uploading image","Загрузка изображения"),pick(lang,"Reklama tekshirilmoqda","Reviewing your ad","Проверка объявления"),pick(lang,"Saqlanmoqda","Saving","Сохранение")].map((label,i)=><div key={label} className={step===i+1?"is-active":""}>{step>i+1?<CheckCircle2 size={17}/>:<span>{i+1}</span>}{label}</div>)}</div>}
 </div><aside><AdPreview ad={{title,description,imageURL,category,dailyBidCents:validBid(cents)?cents:0}}/><section className="p-form-card" style={{marginTop:20}}><div className="p-price-total"><span>{pick(lang,"Joylashuv narxi","Placement price","Стоимость размещения")}</span><strong>{validBid(cents)&&validDuration(days)?money(cents*days):"—"}</strong></div><p className="p-flow-note">{pick(lang,"To‘lov faqat moderatsiyadan keyin. Yakuniy summa to‘lov oynasida ko‘rsatiladi.","Payment follows moderation. The final charge is shown at checkout.","Оплата после модерации. Итоговая сумма будет показана при оплате.")}</p><button className="p-btn p-btn-primary" disabled={busy||imageBusy} type="submit">{busy?pick(lang,"Tekshirilmoqda…","Reviewing…","Проверка…"):pick(lang,"Tekshiruvga yuborish","Submit for review","Отправить на проверку")}<ArrowUpRight size={16}/></button></section></aside></form>;
}
function CreateContent(){const {lang}=useLang();return <FlowShell title={pick(lang,"Brendingiz uchun yangi o‘rin.","A new spot for your brand.","Новое место для вашего бренда.")} description={pick(lang,"Reklamani yarating. Ko‘rinishini tekshiring. Keyingi qadam — moderatsiya.","Create your ad and preview it. Moderation is the next step.","Создайте объявление и оцените его вид. Следующий шаг — модерация.")}><Form/></FlowShell>;}
export function CreateAd(){return <Suspense fallback={<LoadingState label="Primio…"/>}><CreateContent/></Suspense>;}
function EditContent(){const {lang}=useLang();const {ad,error}=useOwnedAd();return <FlowShell title={pick(lang,"Reklamani tahrirlash","Edit your ad","Изменить объявление")}>{error?<div className="p-error">{error}</div>:ad?<Form key={ad.id} ad={ad}/>:<LoadingState label="Primio…"/>}</FlowShell>;}
export function EditAd(){return <Suspense fallback={<LoadingState label="Primio…"/>}><EditContent/></Suspense>;}
