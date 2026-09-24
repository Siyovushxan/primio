"use client";
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { type Lang, getT, type Translations } from "@/lib/i18n";
const LangContext=createContext<{lang:Lang;setLang:(lang:Lang)=>void;t:Translations}>({lang:"uz",setLang:()=>{},t:getT("uz")});
let fallback:Lang="uz";
function getLanguage():Lang {
  try{const stored=localStorage.getItem("primio_lang");return stored==="en"||stored==="ru"||stored==="uz"?stored:fallback;}catch{return fallback;}
}
function subscribe(callback:()=>void){window.addEventListener("storage",callback);window.addEventListener("primio-language",callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener("primio-language",callback);};}
export function LangProvider({children}:{children:ReactNode}){
  const lang=useSyncExternalStore(subscribe,getLanguage,()=>"uz" as Lang);
  useEffect(()=>{document.documentElement.lang=lang;},[lang]);
  function setLang(value:Lang){fallback=value;try{localStorage.setItem("primio_lang",value);}catch{}window.dispatchEvent(new Event("primio-language"));}
  return <LangContext.Provider value={{lang,setLang,t:getT(lang)}}>{children}</LangContext.Provider>;
}
export const useLang=()=>useContext(LangContext);