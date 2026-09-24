import { NextRequest,NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { DAY_MS,validDuration } from "@/lib/auction";
export async function GET(req:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret||req.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  let count=0;
  for(let page=0;page<20;page++){
   const snap=await adminDb.collection("ads").where("status","==","active").where("expiresAt","<=",new Date()).limit(400).get();
   if(snap.empty)break;
   const batch=adminDb.batch();snap.docs.forEach(doc=>batch.update(doc.ref,{status:"expired",expiredAt:new Date()},{lastUpdateTime:doc.updateTime}));await batch.commit();count+=snap.size;
  }
  // Manual verification is retired: paid, AI-approved ads still waiting in pending_verification go live
  const now=Date.now();
  const waiting=await adminDb.collection("ads").where("status","==","pending_verification").limit(400).get();
  const ready=waiting.docs.filter(doc=>{const ad=doc.data();return ad.moderationPassed===true&&ad.totalPaidCents>0&&!ad.paymentReviewRequired&&validDuration(ad.durationDays);});
  if(ready.length){const batch=adminDb.batch();ready.forEach(doc=>batch.update(doc.ref,{status:"active",startsAt:new Date(now),expiresAt:new Date(now+doc.data().durationDays*DAY_MS)},{lastUpdateTime:doc.updateTime}));await batch.commit();}
  return NextResponse.json({expired:count,activated:ready.length});
 }catch{return NextResponse.json({error:"Expiry processing failed."},{status:500});}
}
