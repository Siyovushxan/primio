"use client";
import {useEffect,useState} from "react";
import {estimatedPosition, validBid} from "@/lib/auction";
import type {Category} from "@/types";
import {categoryName,pick,usePublicAds} from "./shared";
import {useLang} from "@/contexts/LangContext";

export function PositionEstimate({category,bidCents,excludeId}:{category:Category;bidCents:number;excludeId?:string}){
 const {lang}=useLang();
 const {ads,loading,error}=usePublicAds();
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 const position=!loading&&!error&&validBid(bidCents)
  ?estimatedPosition(ads.filter(ad=>ad.category===category),bidCents,now,excludeId):null;
 return <div className="p-position-estimate" aria-live="polite">
  <strong>{pick(lang,"Taxminiy o‘rin","Estimated position","Примерное место")}: {position===null?"—":`#${position}`}</strong>
  <p>{loading?pick(lang,"Joriy o‘rinlar tekshirilmoqda…","Checking current positions…","Проверяем текущие места…")
   :error?pick(lang,"Hozir o‘rinni hisoblab bo‘lmadi. To‘lovdan oldin qayta tekshiring.","Position is unavailable right now. Check again before paying.","Сейчас место недоступно. Проверьте ещё раз перед оплатой.")
   :!validBid(bidCents)?pick(lang,"O‘rinni ko‘rish uchun kunlik narxni kiriting.","Enter a daily price to see your position.","Укажите цену за день, чтобы увидеть место.")
   :pick(lang,`${categoryName(category,lang)} toifasidagi hozirgi reklamalar asosida. Boshqalar ko‘proq taklif qilsa, o‘rningiz o‘zgaradi.`,
    `Based on current ads in ${categoryName(category,lang)}. Your position may change if others offer more.`,
    `По текущим объявлениям в категории «${categoryName(category,lang)}». Место может измениться, если другие предложат больше.`)}</p>
 </div>;
}
