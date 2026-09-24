"use client";
import {Suspense,useEffect,useRef,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {ArrowUpRight,Search,Layers3} from "lucide-react";
import {useLang} from "@/contexts/LangContext";
import {CATEGORY_IDS,rankAds} from "@/lib/auction";
import {categoryName,Footer,LoadingState,money,pick,usePublicAds,type PublicAd} from "@/components/primio/shared";
function Card({ad,position}:{ad:PublicAd;position:number}){
 const {lang}=useLang();const ref=useRef<HTMLElement>(null);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined;let sent=false;let visible=false;
  const stop=()=>{if(timer)clearTimeout(timer);timer=undefined;};
  const start=()=>{stop();if(!sent&&visible&&!document.hidden)timer=setTimeout(()=>{sent=true;void fetch(`/api/ads/${ad.id}/impression`,{method:"POST",keepalive:true}).catch(()=>{});},1000);};
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting&&entry.intersectionRatio>=.5;start();},{threshold:.5});
  if(ref.current)observer.observe(ref.current);
  document.addEventListener("visibilitychange",start);
  return()=>{stop();observer.disconnect();document.removeEventListener("visibilitychange",start);};
 },[ad.id]);
 return <article className="p-browse-card" ref={ref}><div className="p-browse-image">{ad.imageURL&&<Image src={ad.imageURL} alt={ad.title} fill unoptimized sizes="(max-width:639px) 100vw, (max-width:850px) 50vw, 33vw"/>}<span className="p-browse-rank">#{position} · {categoryName(ad.category,lang)}</span></div><div className="p-browse-card-body"><span>{categoryName(ad.category,lang)}</span><h2>{ad.title}</h2><p>{ad.description||new URL(ad.destinationURL).hostname}</p><div className="p-browse-card-bottom"><b>{money(ad.dailyBidCents)} <small>/ {pick(lang,"kun","day","день")}</small></b><a href={ad.destinationURL} target="_blank" rel="noopener noreferrer sponsored" onClick={()=>void fetch(`/api/ads/${ad.id}/click`,{method:"POST",keepalive:true}).catch(()=>{})}>{pick(lang,"Saytga o‘tish","Visit website","На сайт")}<ArrowUpRight size={16}/></a></div></div></article>;
}
function Content(){
 const {lang}=useLang();const params=useSearchParams();const router=useRouter();const category=params.get("category")||"all";const [search,setSearch]=useState("");const data=usePublicAds();
 const categoryAds=data.ads.filter(ad=>category==="all"||ad.category===category);const shown=categoryAds.filter(ad=>(ad.title+" "+ad.description).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 return <div className="p-site"><div className="p-container"><header className="p-browse-heading"><span className="p-eyebrow">PRIMIO / {pick(lang,"KATALOG","DISCOVER","КАТАЛОГ")}</span><h1>{pick(lang,"Yangi brendlarni kashf eting.","Discover your next favourite.","Откройте новые бренды.")}</h1><p>{pick(lang,"Faol reklamalar kunlik taklif bo‘yicha saralanadi. O‘rin har bir toifa ichida hisoblanadi.","Active ads are ordered by daily bid. Positions are calculated within each category.","Активные объявления упорядочены по дневной ставке. Место рассчитывается внутри категории.")}</p></header><label className="p-search"><Search size={17}/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} aria-label={pick(lang,"Reklama qidirish","Search ads","Поиск объявлений")} placeholder={pick(lang,"Brend yoki xizmat qidiring…","Search a brand or service…","Найти бренд или услугу…")}/></label><div className="p-filters">{["all",...CATEGORY_IDS].map(id=><button key={id} aria-pressed={category===id} className={category===id?"is-active":""} onClick={()=>router.replace(id==="all"?"/browse":`/browse?category=${id}`,{scroll:false})}>{id==="all"?pick(lang,"Barchasi","All","Все"):categoryName(id,lang)}</button>)}</div>
 {data.loading?<LoadingState label={pick(lang,"Yuklanmoqda…","Loading…","Загрузка…")}/>:data.error?<div className="p-error" role="alert">{pick(lang,"Reklamalarni yuklab bo‘lmadi.","Could not load ads.","Не удалось загрузить объявления.")}<button onClick={data.retry}>{pick(lang,"Qayta urinish","Retry","Повторить")}</button></div>:shown.length?<div className="p-browse-grid">{shown.map(ad=><Card key={ad.id} ad={ad} position={rankAds(data.ads.filter(item=>item.category===ad.category)).findIndex(item=>item.id===ad.id)+1}/>)}</div>:<div className="p-empty"><Layers3/><h2>{pick(lang,"Reklama topilmadi","No ads found","Объявлений не найдено")}</h2><p>{pick(lang,"Boshqa toifani tanlang yoki o‘z reklamangizni joylashtiring.","Try another category or place your own ad.","Выберите другую категорию или разместите своё объявление.")}</p><Link className="p-btn p-btn-primary" href={category==="all"?"/create":`/create?category=${category}`}>{pick(lang,"Reklama yaratish","Create an ad","Создать объявление")}<ArrowUpRight size={15}/></Link></div>}</div><Footer lang={lang}/></div>;
}
export default function Browse(){return <Suspense fallback={<LoadingState label="Primio…"/>}><Content/></Suspense>;}
