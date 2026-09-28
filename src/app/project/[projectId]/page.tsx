"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, LoaderCircle } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { categoryName, Footer, money, pick } from "@/components/primio/shared";

type Project = { id:string; title:string; description:string; imageURL:string; destinationURL:string; category:string; dailyBidCents:number; createdAt:number };
export default function ProjectPage() {
  const { projectId } = useParams<{projectId:string}>();
  const { lang } = useLang();
  const [project,setProject] = useState<Project|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(false);
  useEffect(()=>{
    let active=true;
    fetch(`/api/public/projects/${encodeURIComponent(projectId)}`).then(async response=>{
      if(!response.ok)throw new Error("Project unavailable");
      return response.json();
    }).then(data=>{if(active)setProject(data.project);}).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[projectId]);
  useEffect(()=>{
    if(!project)return;
    let timer:ReturnType<typeof setTimeout>|undefined;
    let sent=false;
    const track=()=>{
      if(timer)clearTimeout(timer);
      if(!sent&&!document.hidden)timer=setTimeout(()=>{sent=true;void fetch(`/api/ads/${project.id}/view`,{method:"POST",keepalive:true}).catch(()=>{});},1000);
    };
    track();document.addEventListener("visibilitychange",track);
    return()=>{if(timer)clearTimeout(timer);document.removeEventListener("visibilitychange",track);};
  },[project]);
  const hostname=project?new URL(project.destinationURL).hostname.replace(/^www\./," ").trim():"";
  const destinationLabel=/instagram\.com$/i.test(hostname)?"Instagram":/t\.me$|telegram\.me$/i.test(hostname)?"Telegram":pick(lang,"sayt","website","сайт");
  return <div className="p-site"><main className="p-container" style={{maxWidth:920,minHeight:"72vh",paddingTop:44,paddingBottom:64}}>
    <Link href="/browse" className="p-text-link" style={{marginBottom:28}}><ArrowLeft size={15}/>{pick(lang,"Loyihalarga qaytish","Back to projects","К проектам")}</Link>
    {loading?<div className="p-empty" role="status"><LoaderCircle className="p-spin" size={28}/><p>{pick(lang,"Loyiha yuklanmoqda…","Loading project…","Загрузка проекта…")}</p></div>:error||!project?<div className="p-empty"><h1>{pick(lang,"Loyiha hozir mavjud emas","This project is unavailable","Проект сейчас недоступен")}</h1><p>{pick(lang,"Reklama muddati tugagan yoki havola eskirgan bo‘lishi mumkin.","The promotion may have ended or the link may be outdated.","Продвижение могло завершиться или ссылка устарела.")}</p><Link className="p-btn p-btn-primary" href="/browse">{pick(lang,"Boshqa loyihalarni ko‘rish","Explore other projects","Другие проекты")}</Link></div>:<article className="p-form-card" style={{padding:0,overflow:"hidden"}}>
      <div style={{position:"relative",height:"clamp(220px,42vw,420px)",background:"#1b1422"}}><Image src={project.imageURL} alt={project.title} fill unoptimized sizes="(max-width: 920px) 100vw, 920px" style={{objectFit:"cover"}}/></div>
      <div style={{padding:"clamp(22px,5vw,48px)"}}><span className="p-eyebrow">PRIMIO / {categoryName(project.category,lang)}</span><h1 style={{fontSize:"clamp(32px,6vw,56px)",margin:"14px 0"}}>{project.title}</h1><p style={{fontSize:16,lineHeight:1.7,color:"#c4b7cc",whiteSpace:"pre-wrap"}}>{project.description}</p>
        <p className="p-flow-note" style={{display:"flex",alignItems:"center",gap:8,marginTop:24}}><CalendarDays size={15}/>{pick(lang,"Primio’da joylangan:","Listed on Primio:","Добавлено в Primio:")} {new Date(project.createdAt).toLocaleDateString(lang==="uz"?"uz-UZ":lang==="ru"?"ru-RU":"en-US",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Tashkent"})}</p>
        <p className="p-flow-note">{pick(lang,"Bu sana loyiha Primio’da joylashtirilgan vaqtni bildiradi.","This is when the project was listed on Primio.","Эта дата показывает, когда проект появился в Primio.")}</p>
        <a className="p-btn p-btn-primary" href={project.destinationURL} target="_blank" rel="noopener noreferrer sponsored" onClick={()=>void fetch(`/api/ads/${project.id}/click`,{method:"POST",keepalive:true}).catch(()=>{})}>{pick(lang,"Loyiha sahifasini ochish","Visit project page","Открыть страницу проекта")} · {destinationLabel}<ArrowUpRight size={16}/></a>
        <p className="p-flow-note" style={{marginTop:16}}>{money(project.dailyBidCents)} / {pick(lang,"kunlik taklif","daily offer","в день")}</p>
      </div>
    </article>}
  </main><Footer lang={lang}/></div>;
}
