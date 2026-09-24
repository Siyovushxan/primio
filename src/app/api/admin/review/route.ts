import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifiedIdentity } from "@/lib/verifyFirebaseToken";
import { DAY_MS, validDuration } from "@/lib/auction";
export async function GET(req:NextRequest){
 const user=await verifiedIdentity(req);
 if(user?.admin!==true)return NextResponse.json({error:"Forbidden"},{status:403});
 const [snap,issues]=await Promise.all([
  adminDb.collection("ads").where("status","==","pending_verification").get(),
  adminDb.collection("ads").where("paymentReviewRequired","==",true).get()
 ]);
 return NextResponse.json({ads:snap.docs.map(doc=>({id:doc.id,...doc.data()})),
  paymentIssues:issues.docs.map(doc=>({id:doc.id,title:doc.data().title,advertiserUID:doc.data().advertiserUID,
   externalTxId:doc.data().externalTxId,status:doc.data().status,totalPaidCents:doc.data().totalPaidCents}))});
}
export async function POST(req:NextRequest){
 const user=await verifiedIdentity(req);
 if(user?.admin!==true)return NextResponse.json({error:"Forbidden"},{status:403});
 try{
  const {adId,decision,reason}=await req.json();
  if(typeof adId!=="string"||!/^[\w-]{1,128}$/.test(adId)||!["approve","reject"].includes(decision))throw new Error("Invalid review.");
  if(decision==="reject"&&(typeof reason!=="string"||reason.trim().length<5||reason.length>500))throw new Error("Give a rejection reason (5–500 characters).");
  await adminDb.runTransaction(async tx=>{
    const adRef=adminDb.doc(`ads/${adId}`);
    const snap=await tx.get(adRef);const ad=snap.data();
    if(!ad||ad.status!=="pending_verification"||!ad.moderationPassed||!validDuration(ad.durationDays))throw new Error("This ad is not ready for review.");
    if(ad.paymentReviewRequired)throw new Error("Resolve the payment issue before activation.");
    const now=new Date();
    tx.update(adRef,decision==="approve"?{status:"active",startsAt:now,expiresAt:new Date(now.getTime()+ad.durationDays*DAY_MS),reviewedBy:user.uid,reviewedAt:now}:{status:"rejected",rejectionReason:reason.trim(),reviewedBy:user.uid,reviewedAt:now});
    if(decision==="approve")tx.set(adminDb.doc(`users/${ad.advertiserUID}`),{isNewAccount:false},{merge:true});
    tx.create(adminDb.collection("auditLogs").doc(),{action:decision,adId,actor:user.uid,reason:decision==="reject"?reason.trim():"",createdAt:FieldValue.serverTimestamp()});
  });
  return NextResponse.json({ok:true});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Review failed."},{status:400});}
}
