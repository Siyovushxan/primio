"use client";
import {useEffect,useState} from "react";
import {estimatedPosition, rankingBidCents, topBidCents, validBid} from "@/lib/auction";
import type {Category} from "@/types";
import {categoryName,pick,usePublicAds} from "./shared";
import {useLang} from "@/contexts/LangContext";

export function PositionEstimate({category,bidCents,excludeId,onSelectTop,minimumBidCents=100}:{category:Category;bidCents:number;excludeId?:string;onSelectTop?:(cents:number)=>void;minimumBidCents?:number}){
 const {lang}=useLang();
 const {ads,loading,error}=usePublicAds();
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 const scoped=ads.filter(ad=>ad.category===category);
 const topPrice=loading||error?null:topBidCents(scoped,now,excludeId);
 const selectablePrice=topPrice===null?null:Math.max(topPrice,minimumBidCents);
 const top= !loading&&!error ? scoped.filter(ad=>ad.id!==excludeId).sort((a,b)=>rankingBidCents(b,now)-rankingBidCents(a,now))[0] : undefined;
 const nextHourPrice=loading||error?null:topBidCents(scoped,now+3600000,excludeId);
 const position=!loading&&!error&&validBid(bidCents)
  ?estimatedPosition(ads.filter(ad=>ad.category===category),bidCents,now,excludeId):null;
 return <div className="p-position-estimate" aria-live="polite">
  <div className="p-top-price"><span>{pick(lang,"Hozir TOP-1 uchun","For TOP-1 now","Сейчас для TOP-1")}</span><strong>{topPrice===null?"—":"$"+(topPrice/100).toFixed(2)} / {pick(lang,"kun","day","день")}</strong></div>
  {onSelectTop&&selectablePrice!==null&&<button type="button" className="p-text-link" onClick={()=>onSelectTop(selectablePrice)}>{pick(lang,"TOP-1 narxini tanlash","Use the TOP-1 price","Выбрать цену TOP-1")}</button>}
  {top&&nextHourPrice!==null&&topPrice!==null&&nextHourPrice<topPrice&&<p>{pick(lang,`Yangi taklif bo‘lmasa, bir soatdan keyin TOP-1: $${(nextHourPrice/100).toFixed(2)}/kun.`,`If no new bids arrive, TOP-1 in one hour: $${(nextHourPrice/100).toFixed(2)}/day.`,`Без новых ставок TOP-1 через час: $${(nextHourPrice/100).toFixed(2)}/день.`)}</p>}
  <strong>{pick(lang,"Taxminiy o‘rin","Estimated position","Примерное место")}: {position===null?"—":`#${position}`}</strong>
  <p>{loading?pick(lang,"Joriy o‘rinlar tekshirilmoqda…","Checking current positions…","Проверяем текущие места…")
   :error?pick(lang,"Hozir o‘rinni hisoblab bo‘lmadi. To‘lovdan oldin qayta tekshiring.","Position is unavailable right now. Check again before paying.","Сейчас место недоступно. Проверьте ещё раз перед оплатой.")
   :!validBid(bidCents)?pick(lang,"O‘rinni ko‘rish uchun kunlik narxni kiriting.","Enter a daily price to see your position.","Укажите цену за день, чтобы увидеть место.")
   :pick(lang,`${categoryName(category,lang)} toifasidagi hozirgi reklamalar asosida. Boshqalar ko‘proq taklif qilsa, o‘rningiz o‘zgaradi.`,
    `Based on current ads in ${categoryName(category,lang)}. Your position may change if others offer more.`,
    `По текущим объявлениям в категории «${categoryName(category,lang)}». Место может измениться, если другие предложат больше.`)}</p>
 </div>;
}
