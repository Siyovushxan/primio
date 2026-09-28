"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Ad } from "@/types";
import type { Lang } from "@/lib/i18n";
import { milliseconds,rankAds } from "@/lib/auction";
import { money,pick,categoryName,type PublicAd } from "./shared";
export function adStatus(ad:Ad,now:number){return ad.status==="active"&&milliseconds(ad.expiresAt)<=now?"expired":ad.status;}
export function statusText(status:string,lang:Lang){
 const labels:Record<string,[string,string,string]>={active:["Faol","Active","Активно"],pending:["To‘lov kutilmoqda","Awaiting payment","Ожидает оплаты"],pending_verification:["Tekshiruvda","In review","На проверке"],expired:["Muddati tugagan","Expired","Завершено"],rejected:["Rad etilgan","Rejected","Отклонено"]};
 return labels[status]?pick(lang,...labels[status]):status;
}
export function AdAction({ad,now,lang,demo=false}:{ad:Ad;now:number;lang:Lang;demo?:boolean}){
 const status=adStatus(ad,now);
 const action=ad.paymentReviewRequired?"pending":status==="active"?"bid":status==="expired"?"renew":status==="pending"?"pay":status==="rejected"&&ad.totalPaidCents===0?"edit":"pending";
 const label=action==="bid"?pick(lang,"Taklifni oshirish","Raise bid","Повысить"):action==="renew"?pick(lang,"Uzaytirish","Renew","Продлить"):action==="pay"?pick(lang,"To‘lash","Pay now","Оплатить"):action==="edit"?pick(lang,"Tahrirlash","Edit","Изменить"):pick(lang,"Holatini ko‘rish","View status","Статус");
 return <Link className="p-table-action" href={demo?"/auth":`/ads/${ad.id}/${action}`}>{label}<ArrowUpRight size={12}/></Link>;
}
export default function AdList({ads,publicAds,lang,now,demo=false}:{ads:Ad[];publicAds:PublicAd[];lang:Lang;now:number;demo?:boolean}){
 function position(ad:Ad){const index=rankAds(publicAds.filter(item=>item.category===ad.category),now).findIndex(item=>item.id===ad.id);return index<0?"—":"#"+(index+1);}
 function name(ad:Ad){return <div className="p-ad-name">{ad.imageURL?<Image src={ad.imageURL} alt="" width={37} height={37} unoptimized/>:<span className="p-ad-thumbnail">{ad.title[0]}</span>}<div><strong>{ad.title}</strong><small>{categoryName(ad.category,lang)}</small></div></div>;}
 function badge(ad:Ad){return <span className={`p-status-badge ${adStatus(ad,now)}`}>{statusText(adStatus(ad,now),lang)}</span>;}
 return <><div className="p-table-scroll p-desktop-table"><table className="p-table"><thead><tr><th>{pick(lang,"Reklama","Campaign","Объявление")}</th><th>{pick(lang,"Holat","Status","Статус")}</th><th>{pick(lang,"O‘rin","Position","Позиция")}</th><th>{pick(lang,"Kunlik taklif","Daily bid","В день")}</th><th>{pick(lang,"Loyiha sahifasi","Project page","Страница проекта")}</th><th>{pick(lang,"Reklama kartasi","Ad card","Карточка")}</th><th>{pick(lang,"Tashqi bosish","Outbound clicks","Переходы")}</th><th><span className="sr-only">{pick(lang,"Amal","Action","Действие")}</span></th></tr></thead><tbody>{ads.map(ad=><tr key={ad.id}><td>{name(ad)}</td><td>{badge(ad)}</td><td><span className="p-position">{position(ad)}</span></td><td>{money(ad.dailyBidCents)}</td><td>{(ad.profileViews||0).toLocaleString()}</td><td>{(ad.impressions||0).toLocaleString()}</td><td>{ad.clicks||0}</td><td><AdAction ad={ad} now={now} lang={lang} demo={demo}/></td></tr>)}</tbody></table></div>
 <div className="p-mobile-ad-list">{ads.map(ad=><article key={ad.id} className="p-mobile-ad"><div className="p-mobile-ad-top">{name(ad)}<span className="p-position">{position(ad)}</span></div><div className="p-mobile-ad-stats"><span><small>{pick(lang,"Kunlik taklif","Daily bid","В день")}</small>{money(ad.dailyBidCents)}</span><span><small>{pick(lang,"Loyiha sahifasi","Project page","Страница проекта")}</small>{(ad.profileViews||0).toLocaleString()}</span><span><small>{pick(lang,"Kartani ko‘rish","Card impressions","Показы карточки")}</small>{(ad.impressions||0).toLocaleString()}</span><span><small>{pick(lang,"Tashqi bosish","Outbound clicks","Переходы")}</small>{ad.clicks||0}</span></div><div className="p-mobile-ad-actions">{badge(ad)}<AdAction ad={ad} now={now} lang={lang} demo={demo}/></div></article>)}</div></>;
}
