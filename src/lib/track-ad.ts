import { createHash } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import { milliseconds } from "./auction";
export async function trackAd(req:NextRequest,adId:string,event:"clicks"|"impressions"){
 if(!/^[\w-]{1,128}$/.test(adId))return NextResponse.json({ok:false},{status:400});
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin&&origin!==process.env.NEXT_PUBLIC_BASE_URL)return NextResponse.json({ok:false},{status:403});
 const ip=req.headers.get("x-forwarded-for")?.split(",")[0].trim()||"unknown";
 // Hashes are retained only for deduplication. Firestore TTL should be enabled on expiresAt.
 const identity=createHash("sha256").update((process.env.CRON_SECRET||"primio")+":"+ip+":"+adId+":"+event).digest("hex");
 const now=Date.now();const date=new Date(now).toISOString().slice(0,10);
 try{
  await adminDb.runTransaction(async tx=>{
   const ref=adminDb.doc(`ads/${adId}`);const rateRef=adminDb.doc(`trackingLimits/${identity}`);
   const [adSnap,rateSnap]=await Promise.all([tx.get(ref),tx.get(rateRef)]);
   const ad=adSnap.data();
   if(!ad||ad.status!=="active"||milliseconds(ad.expiresAt)<=now)return;
   if(rateSnap.exists&&now-(rateSnap.data()!.lastAt||0)<60000)return;
   tx.set(rateRef,{lastAt:now,expiresAt:new Date(now+86400000)});
   tx.update(ref,{[event]:FieldValue.increment(1),...(!ad.analyticsStartedAt?{analyticsStartedAt:new Date(now)}:{})});
   tx.set(adminDb.doc(`dailyStats/${adId}_${date}`),{uid:ad.advertiserUID,adId,date,[event]:FieldValue.increment(1),updatedAt:new Date(now)},{merge:true});
  });
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({ok:false},{status:503});}
}