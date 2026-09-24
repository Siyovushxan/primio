import { NextRequest,NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
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
  return NextResponse.json({expired:count});
 }catch{return NextResponse.json({error:"Expiry processing failed."},{status:500});}
}
