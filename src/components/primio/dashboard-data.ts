import { Timestamp } from "firebase/firestore";
import type { Ad, Transaction } from "@/types";
import type { PublicAd } from "./shared";
export interface DailyStat { id:string; date:string; adId:string; impressions?:number; clicks?:number }
export const DEMO_NOW = Date.parse("2026-09-24T12:00:00Z");
const at=(days:number)=>Timestamp.fromMillis(DEMO_NOW+days*86400000);
export const demoAds:Ad[]=[
 {id:"demo-nova",advertiserUID:"demo",title:"Nova Studio",description:"Independent design. Remarkable ideas.",category:"technology",imageURL:"",destinationURL:"https://example.com",dailyBidCents:650,durationDays:14,totalPaidCents:9100,status:"active",startsAt:at(-5),expiresAt:at(9),impressions:8240,clicks:328,externalTxId:"demo-1",paymentMethod:"card",createdAt:at(-6)},
 {id:"demo-orbit",advertiserUID:"demo",title:"Orbit Academy",description:"A new way to learn.",category:"education",imageURL:"",destinationURL:"https://example.com",dailyBidCents:350,durationDays:14,totalPaidCents:4900,status:"active",startsAt:at(-12),expiresAt:at(2),impressions:4240,clicks:158,externalTxId:"demo-2",paymentMethod:"card",createdAt:at(-13)},
 {id:"demo-atelier",advertiserUID:"demo",title:"Atelier Collection",category:"fashion",imageURL:"",destinationURL:"https://example.com",dailyBidCents:250,durationDays:7,totalPaidCents:0,status:"pending",startsAt:null,expiresAt:null,impressions:0,clicks:0,externalTxId:"",paymentMethod:"",createdAt:at(-1),moderationPassed:true}
];
export const demoTransactions:Transaction[]=[
 {id:"demo-1",uid:"demo",adId:"demo-nova",type:"purchase",amountCents:9100,externalTxId:"demo-1",paymentMethod:"card",createdAt:at(-5)},
 {id:"demo-2",uid:"demo",adId:"demo-orbit",type:"purchase",amountCents:4900,externalTxId:"demo-2",paymentMethod:"card",createdAt:at(-12)}
];
export const demoStats:DailyStat[]=[1250,1560,1420,1960,1710,2110,2470].map((impressions,index)=>({id:"sample-"+index,adId:"demo-nova",date:new Date(DEMO_NOW-(6-index)*86400000).toISOString().slice(0,10),impressions,clicks:[43,59,50,78,65,89,102][index]}));
export const demoPublic:PublicAd[]=[
 ...demoAds.filter(ad=>ad.status==="active").map(ad=>({id:ad.id,title:ad.title,description:ad.description??"",imageURL:ad.imageURL,destinationURL:ad.destinationURL,category:ad.category,dailyBidCents:ad.dailyBidCents,status:"active",startsAt:ad.startsAt!.toMillis(),expiresAt:ad.expiresAt!.toMillis(),createdAt:ad.createdAt.toMillis()})),
 {id:"sample-vertex",title:"Vertex Cloud",description:"",imageURL:"",destinationURL:"https://example.com",category:"technology",dailyBidCents:900,status:"active",startsAt:DEMO_NOW-86400000,expiresAt:DEMO_NOW+864000000,createdAt:DEMO_NOW-86400000},
 {id:"sample-learn",title:"Learnspace",description:"",imageURL:"",destinationURL:"https://example.com",category:"education",dailyBidCents:500,status:"active",startsAt:DEMO_NOW-86400000,expiresAt:DEMO_NOW+864000000,createdAt:DEMO_NOW-86400000},
 {id:"sample-form",title:"Form & Function",description:"",imageURL:"",destinationURL:"https://example.com",category:"technology",dailyBidCents:400,status:"active",startsAt:DEMO_NOW-86400000,expiresAt:DEMO_NOW+864000000,createdAt:DEMO_NOW-86400000}
];