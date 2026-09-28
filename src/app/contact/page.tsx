"use client";
import {useState,type FormEvent} from "react";
import {ArrowUpRight,CheckCircle2} from "lucide-react";
import {useLang} from "@/contexts/LangContext";
import {Footer,pick} from "@/components/primio/shared";

export default function Contact(){
 const {lang}=useLang();
 const [name,setName]=useState("");const [email,setEmail]=useState("");const [message,setMessage]=useState("");
 const [website,setWebsite]=useState("");const [busy,setBusy]=useState(false);const [sent,setSent]=useState(false);const [error,setError]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");
  try{
   const response=await fetch("/api/feedback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,message,website})});
   if(!response.ok)throw new Error(pick(lang,"Xabar yuborilmadi. Maydonlarni tekshirib, qayta urinib ko‘ring.","Message not sent. Check the fields and try again.","Сообщение не отправлено. Проверьте поля и попробуйте снова."));
   setSent(true);setName("");setEmail("");setMessage("");setWebsite("");
  }catch(e){setError(e instanceof Error?e.message:pick(lang,"Qayta urinib ko‘ring.","Please try again.","Попробуйте ещё раз."));}
  finally{setBusy(false);}
 }
 return <div className="p-site"><section className="p-contact"><span className="p-eyebrow">PRIMIO / {pick(lang,"ALOQA","CONTACT","СВЯЗЬ")}</span>
  <h1>{pick(lang,"Fikringizni bizga yozing.","Tell us what you think.","Расскажите, что вы думаете.")}</h1>
  <p className="p-contact-intro">{pick(lang,"Savol, taklif yoki saytdagi muammo haqida yozing. Xabaringiz Primio jamoasiga yetib boradi.","Send a question, suggestion, or report a problem with the site. Your message goes to the Primio team.","Напишите вопрос, предложение или сообщите о проблеме на сайте. Сообщение поступит команде Primio.")}</p>
  {sent?<div className="p-contact-success" role="status"><CheckCircle2 size={29}/><h2>{pick(lang,"Xabaringiz qabul qilindi","Message received","Сообщение получено")}</h2><p>{pick(lang,"Fikringiz uchun rahmat. Yana yozmoqchi bo‘lsangiz, yangi xabar yuborishingiz mumkin.","Thanks for sharing your thoughts. You can send another message anytime.","Спасибо за отзыв. Вы можете отправить ещё одно сообщение.")}</p><button className="p-btn p-btn-secondary" type="button" onClick={()=>setSent(false)} style={{marginTop:20}}>{pick(lang,"Yana xabar yozish","Write another message","Написать ещё")}</button></div>
  :<form className="p-contact-card" onSubmit={submit}><div className="p-contact-row">
   <label className="p-contact-field">{pick(lang,"Ismingiz","Your name","Ваше имя")} <small>{pick(lang,"ixtiyoriy","optional","необязательно")}</small><input value={name} maxLength={80} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>
   <label className="p-contact-field">Email <small>{pick(lang,"ixtiyoriy, javob olish uchun","optional, for a reply","необязательно, для ответа")}</small><input type="email" value={email} maxLength={254} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label></div>
   <label className="p-contact-field">{pick(lang,"Xabaringiz","Your message","Ваше сообщение")}<textarea required minLength={10} maxLength={2000} rows={7} value={message} onChange={e=>setMessage(e.target.value)} placeholder={pick(lang,"Fikr yoki savolingizni shu yerga yozing…","Write your feedback or question here…","Напишите отзыв или вопрос здесь…")}/><small>{message.length}/2000</small></label>
   <div aria-hidden="true" style={{position:"absolute",left:"-10000px"}}><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>
   {error&&<div className="p-error" role="alert">{error}</div>}
   <button className="p-btn p-btn-primary" type="submit" disabled={busy}>{pick(lang,busy?"Yuborilmoqda…":"Xabarni yuborish",busy?"Sending…":"Send message",busy?"Отправляем…":"Отправить сообщение")}<ArrowUpRight size={16}/></button>
  </form>}</section><Footer lang={lang}/></div>;
}
