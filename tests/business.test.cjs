const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ts=require("typescript");
function loadSource(file,dependencies={},environment={}){
 const source=fs.readFileSync(path.join(__dirname,"..",file),"utf8");
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};const context={exports,require:name=>{if(!(name in dependencies))throw new Error("Unexpected dependency: "+name);return dependencies[name];},process:{env:environment},URL,Date,Buffer,console,AbortSignal,fetch:()=>{throw new Error("Tests must not contact services");}};
 vm.runInNewContext(code,context,{filename:file});return exports;
}
const auction=loadSource("src/lib/auction.ts");
const {DAY_MS,quotePayment,rankAds,estimatedPosition,validBid,validDuration,publicWebsite}=auction;
const now=1_800_000_000_000;
test("a free trial is exactly seven days and cannot be extended by a later login",()=>{
 const {FREE_TRIAL_MS,isTrialActive,freeCampaignExpiry}=loadSource("src/lib/trial.ts",{"./auction":auction});
 const start=Date.now();const user={trialExpiresAt:start+FREE_TRIAL_MS};
 assert.equal(FREE_TRIAL_MS,7*DAY_MS);assert.equal(isTrialActive(user,start),true);assert.equal(isTrialActive(user,user.trialExpiresAt),false);
 assert.equal(freeCampaignExpiry(start,30,user.trialExpiresAt),user.trialExpiresAt);
 assert.equal(freeCampaignExpiry(start,3,user.trialExpiresAt),start+3*DAY_MS);
});
test("temporary free bid ranks first only until its free-week expiry",()=>{
 const {effectiveBidCents,rankAds}=auction;const start=Date.now();
 const boosted={id:"boosted",status:"active",dailyBidCents:300,trialBidCents:900,trialBidUntil:start+DAY_MS,startsAt:start,expiresAt:start+10*DAY_MS};
 const rival={id:"rival",status:"active",dailyBidCents:600,startsAt:start+1,expiresAt:start+10*DAY_MS};
 assert.equal(effectiveBidCents(boosted,start),900);assert.equal(rankAds([boosted,rival],start)[0].id,"boosted");
 assert.equal(effectiveBidCents(boosted,start+DAY_MS),300);assert.equal(rankAds([boosted,rival],start+DAY_MS)[0].id,"rival");
});
test("public feedback saves a private, structured Firebase message and rejects invalid input",async()=>{
 const {validateFeedback}=loadSource("src/lib/feedback.ts");
 const saved=[];
 const {POST}=loadSource("src/app/api/feedback/route.ts",{
  "next/server":{NextResponse:{json:(body,options={})=>({body,status:options.status||200})}},
  "firebase-admin/firestore":{FieldValue:{serverTimestamp:()=>"server-time"}},
  "@/lib/firebaseAdmin":{adminDb:{collection:name=>{assert.equal(name,"feedback");return {add:async value=>saved.push(value)};}}},
  "@/lib/feedback":{validateFeedback}
 });
 const request=body=>({headers:{get:key=>key==="content-type"?"application/json":key==="origin"?"https://primio.com.uz":null},nextUrl:{origin:"https://primio.com.uz"},text:async()=>JSON.stringify(body)});
 assert.equal((await POST(request({name:" Ali ",email:"a@example.com",message:"  Useful feedback  ",website:""}))).status,200);
 assert.equal(saved.length,1);
 assert.equal(saved[0].message,"Useful feedback");
 assert.equal(saved[0].createdAt,"server-time");
 await POST(request({name:"",email:"",message:"Useful feedback",website:"filled by bot"}));
 assert.equal(saved.length,1);
 assert.equal((await POST(request({name:"",email:"not-email",message:"Useful feedback",website:""}))).status,400);
 assert.equal(saved.length,1);
});

test("Google Analytics token encryption and bounded date filters behave safely",()=>{
 const key=require("node:crypto").randomBytes(32).toString("base64");
 const analytics=loadSource("src/lib/google-analytics.ts",{"node:crypto":require("node:crypto")},{ANALYTICS_TOKEN_ENCRYPTION_KEY:key});
 const token="google-refresh-secret";const encrypted=analytics.encryptRefreshToken(token);
 assert.notEqual(encrypted,token);assert.equal(analytics.decryptRefreshToken(encrypted),token);
 assert.throws(()=>analytics.decryptRefreshToken(encrypted.replace(/.$/,encrypted.endsWith("A")?"B":"A")));
 assert.equal(analytics.isPropertyId("123456"),true);assert.equal(analytics.isPropertyId("properties/123456"),false);
 const now=Date.parse("2026-09-28T12:00:00Z");
 assert.deepEqual(JSON.parse(JSON.stringify(analytics.parseAnalyticsRange(new URLSearchParams({range:"7d"}),now,"Asia/Tashkent"))),{startDate:"2026-09-22",endDate:"2026-09-28"});
 assert.deepEqual(JSON.parse(JSON.stringify(analytics.parseAnalyticsRange(new URLSearchParams({range:"custom",startDate:"2026-09-01",endDate:"2026-09-28"}),now,"UTC"))),{startDate:"2026-09-01",endDate:"2026-09-28"});
 for(const [startDate,endDate] of [["2026-06-30","2026-09-28"],["2026-02-31","2026-03-01"],["2026-09-29","2026-09-28"]])assert.throws(()=>analytics.parseAnalyticsRange(new URLSearchParams({range:"custom",startDate,endDate}),now,"UTC"));
});

test("bids and durations reject fractional cents, NaN, negative and oversized values",()=>{
 for(const value of [NaN,Infinity,-1,0,99,100.5,1_000_001,"100"])assert.equal(validBid(value),false);
 for(const value of [0,-1,1.5,366,NaN,"7"])assert.equal(validDuration(value),false);
 assert.equal(validBid(100),true);assert.equal(validDuration(365),true);
});
test("renewal uses the selected duration, not the old duration",()=>{
 const q=quotePayment({status:"expired",dailyBidCents:650,durationDays:7,moderationPassed:true},"renewal",undefined,30,now);
 assert.equal(q.amountCents,19500);assert.equal(q.durationDays,30);
});
test("upgrade charges only bid difference times remaining rounded-up days",()=>{
 const q=quotePayment({status:"active",dailyBidCents:650,durationDays:30,expiresAt:now+2.1*DAY_MS,moderationPassed:true},"bid_upgrade",700,undefined,now);
 assert.equal(q.amountCents,150);assert.equal(q.durationDays,3);
});
test("expired, unmoderated and payment-review ads cannot purchase upgrades",()=>{
 for(const change of [{expiresAt:now},{moderationPassed:false},{paymentReviewRequired:true}]){
 assert.throws(()=>quotePayment({status:"active",dailyBidCents:650,durationDays:7,expiresAt:now+DAY_MS,moderationPassed:true,...change},"bid_upgrade",700,undefined,now));
 }
 assert.throws(()=>quotePayment({status:"active",dailyBidCents:650,durationDays:7,expiresAt:now+DAY_MS,moderationPassed:true},"bid_upgrade",650,undefined,now));
});
test("ranking excludes expired and non-active ads and resolves equal bids deterministically",()=>{
 const ads=[{id:"b",dailyBidCents:500,startsAt:50},{id:"a",dailyBidCents:500,startsAt:50},{id:"first",dailyBidCents:500,startsAt:20},{id:"highest",dailyBidCents:900,startsAt:90}].map(a=>({...a,status:"active",expiresAt:now+1}));
 ads.push({id:"expired",dailyBidCents:9999,status:"active",startsAt:1,expiresAt:now},{id:"pending",dailyBidCents:9999,status:"pending",startsAt:1,expiresAt:now+DAY_MS});
 assert.deepEqual(Array.from(rankAds(ads,now),a=>a.id),["highest","first","a","b"]);
 assert.equal(ads[0].id,"b");
});
test("placement preview follows active category rank, including ties and existing ads",()=>{
 const ads=[{id:"early",dailyBidCents:500,startsAt:now-200,expiresAt:now+DAY_MS},
  {id:"later",dailyBidCents:500,startsAt:now-100,expiresAt:now+DAY_MS},
  {id:"expired",dailyBidCents:900,startsAt:now-300,expiresAt:now}];
 assert.equal(estimatedPosition(ads,500,now),3);
 assert.equal(estimatedPosition(ads,501,now),1);
 assert.equal(estimatedPosition(ads,500,now,"early"),1);
 assert.equal(estimatedPosition(ads,600,now,"later"),1);
});
test("destination validation rejects local/IP, credentials and non-HTTPS addresses",()=>{
 for(const url of ["http://example.com","https://localhost","https://127.0.0.1","https://2130706433","https://[::1]","https://example.local","https://user:pass@example.com","https://example.com:8080"])assert.throws(()=>publicWebsite(url));
 assert.equal(publicWebsite("https://example.com/path"),"https://example.com/path");
});
const FieldValue={serverTimestamp:()=>({op:"timestamp"}),increment:value=>({op:"increment",value}),delete:()=>({op:"delete"})};
class MemoryDb{
 constructor(seed){this.data=new Map(Object.entries(seed));this.versions=new Map();this.retries=0;}
 doc(id){return {id:id.split("/").at(-1),path:id};}
 snapshot(ref){const value=this.data.get(ref.path);return {exists:value!==undefined,data:()=>value};}
 async runTransaction(work){
  for(let attempt=0;attempt<20;attempt++){
   const reads=new Map(),writes=[];
   const tx={get:async ref=>{reads.set(ref.path,this.versions.get(ref.path)||0);return this.snapshot(ref);},create:(ref,value)=>writes.push(["create",ref,value]),update:(ref,value)=>writes.push(["update",ref,value]),set:(ref,value)=>writes.push(["set",ref,value])};
   const result=await work(tx);
   if([...reads].some(([key,version])=>(this.versions.get(key)||0)!==version)){this.retries++;continue;}
   for(const [kind,ref,value] of writes){
    if(kind==="create"&&this.data.has(ref.path))throw new Error("Already exists");
    const target={...(this.data.get(ref.path)||{})};
    for(const [key,item] of Object.entries(value)){
     if(item?.op==="delete")delete target[key];
     else if(item?.op==="increment")target[key]=(target[key]||0)+item.value;
     else if(item?.op==="timestamp")target[key]=new Date();
     else target[key]=item;
    }
    this.data.set(ref.path,target);this.versions.set(ref.path,(this.versions.get(ref.path)||0)+1);
   }
   return result;
  }throw new Error("Transaction retry limit");
 }
}
function fixture({type="purchase",adChange={},orderChange={},newAccount=false}={}){
 const db=new MemoryDb({
 "ads/ad1":{advertiserUID:"u1",status:type==="renewal"?"expired":"pending",dailyBidCents:650,durationDays:7,contentVersion:1,totalPaidCents:0,...adChange},
 "users/u1":{isNewAccount:newAccount,totalSpentCents:0},
 "paymentOrders/order1":{uid:"u1",adId:"ad1",type,status:"pending",contentVersion:1,dailyBidCents:650,previousBidCents:650,durationDays:30,amountCents:19500,providerPaymentId:"pay1",providerTotal:19500,...orderChange}
 });
 const {applyPayment}=loadSource("src/lib/payments.ts",{"firebase-admin/firestore":{FieldValue},"./firebaseAdmin":{adminDb:db},"./auction":auction});
 const payment={payment_id:"pay1",status:"succeeded",currency:"USD",total_amount:19500,metadata:{orderId:"order1"}};
 return {db,applyPayment,payment};
}
test("webhook and verification racing apply a payment exactly once",async()=>{
 const {db,applyPayment,payment}=fixture();
 await Promise.all([applyPayment(payment),applyPayment(payment),applyPayment(payment)]);
 assert.equal(db.data.get("users/u1").totalSpentCents,19500);
 assert.equal(db.data.get("ads/ad1").totalPaidCents,19500);
 assert.equal([...db.data.keys()].filter(k=>k.startsWith("transactions/")).length,1);
 assert.ok(db.retries>0,"test exercised optimistic transaction retries");
});
test("paid renewal starts the full selected period",async()=>{
 const {db,applyPayment,payment}=fixture({type:"renewal"});await applyPayment(payment);const ad=db.data.get("ads/ad1");
 assert.equal(ad.durationDays,30);assert.equal(ad.status,"active");assert.equal(ad.expiresAt-ad.startsAt,30*DAY_MS);
});
test("new-account payment goes live immediately without manual verification",async()=>{
 const {db,applyPayment,payment}=fixture({newAccount:true});await applyPayment(payment);const ad=db.data.get("ads/ad1");
 assert.equal(ad.status,"active");assert.equal(ad.expiresAt.getTime()-ad.startsAt.getTime(),ad.durationDays*DAY_MS);
});
test("changed content and late cancelled-checkout payments are recorded for review",async()=>{
 for(const options of [{adChange:{contentVersion:2}},{orderChange:{status:"cancelled"}}]){
  const {db,applyPayment,payment}=fixture(options);const result=await applyPayment(payment);
  assert.equal(result.needsReview,true);assert.equal(db.data.get("ads/ad1").status,"pending");assert.equal(db.data.get("ads/ad1").paymentReviewRequired,true);
  assert.equal((await applyPayment(payment)).needsReview,true);
 }
});
test("foreign-ad conflict does not modify another owner's ad",async()=>{
 const {db,applyPayment,payment}=fixture({adChange:{advertiserUID:"other"}});
 assert.equal((await applyPayment(payment)).needsReview,true);assert.equal(db.data.get("ads/ad1").totalPaidCents,0);
});
test("insufficient amount, wrong currency and payment ID cannot activate",async()=>{
 for(const change of [{total_amount:1},{currency:"EUR"},{payment_id:"pay2"},{payment_id:"bad/id"}]){
  const {db,applyPayment,payment}=fixture();await assert.rejects(()=>applyPayment({...payment,...change}));assert.equal(db.data.get("ads/ad1").status,"pending");assert.equal(db.data.get("users/u1").totalSpentCents,0);
 }
});
test("non-successful payment produces no writes",async()=>{
 const {db,applyPayment,payment}=fixture();assert.equal((await applyPayment({...payment,status:"processing"})).paid,false);assert.equal(db.versions.size,0);
});
test("the trial profile grant is persisted once and repeat logins do not restart it",async()=>{
 const data=new Map([["users/u1",{uid:"u1",displayName:"A",totalSpentCents:0}]]);
 const ref=path=>({path,id:path.split("/").at(-1)});
 const db={doc:ref,runTransaction:async work=>work({get:async r=>({exists:data.has(r.path),data:()=>data.get(r.path)}),create:(r,v)=>data.set(r.path,v),update:(r,v)=>data.set(r.path,{...data.get(r.path),...v})})};
 const {POST}=loadSource("src/app/api/profile/route.ts",{
  "next/server":{NextResponse:{json:(body,options={})=>({body,status:options.status||200})}},
  "firebase-admin/firestore":{FieldValue:{serverTimestamp:()=>"server-time"}},
  "@/lib/verifyFirebaseToken":{verifiedIdentity:async()=>({uid:"u1",email:"a@example.com"})},
  "@/lib/firebaseAdmin":{adminDb:db},"@/lib/trial":loadSource("src/lib/trial.ts",{"./auction":auction}),"@/lib/auction":auction
 });
 const request=()=>({json:async()=>({})});
 const first=await POST(request());const expiry=data.get("users/u1").trialExpiresAt.getTime();
 assert.equal(first.status,200);assert.equal(first.body.trialActive,true);assert.equal(expiry-data.get("users/u1").trialStartedAt.getTime(),7*DAY_MS);
 await new Promise(resolve=>setTimeout(resolve,5));const second=await POST(request());
 assert.equal(second.body.trialEndsAt,expiry);assert.equal(data.get("users/u1").trialExpiresAt.getTime(),expiry);
});
test("trial activation skips checkout, costs zero, and ends within the account's remaining free week",async()=>{
 const trialEndsAt=new Date(Date.now()+2*DAY_MS);const data=new Map([
  ["ads/ad1",{advertiserUID:"u1",status:"pending",dailyBidCents:650,durationDays:14,contentVersion:1,totalPaidCents:0,moderationPassed:true,paymentReviewRequired:false}],
  ["users/u1",{trialStartedAt:new Date(Date.now()-5*DAY_MS),trialExpiresAt:trialEndsAt,totalSpentCents:0}]
 ]);const writes=[];const ref=path=>({path,id:path.split("/").at(-1)});
 const db={doc:ref,collection:name=>({doc:()=>ref(`${name}/new-order`)}),runTransaction:async work=>{
  const pending=[];const tx={get:async r=>({exists:data.has(r.path),data:()=>data.get(r.path)}),update:(r,v)=>pending.push([r,v]),create:(r,v)=>pending.push([r,v])};
  const result=await work(tx);for(const [r,v] of pending){writes.push([r.path,v]);data.set(r.path,{...data.get(r.path),...Object.fromEntries(Object.entries(v).filter(([,x])=>!(x&&x.op==="delete")))})}return result;
 }};let checkoutCalls=0;
 const {POST}=loadSource("src/app/api/payment/create-session/route.ts",{
  "next/server":{NextResponse:{json:(body,options={})=>({body,status:options.status||200})}},
  "firebase-admin/firestore":{FieldValue:{delete:()=>({op:"delete"}),serverTimestamp:()=>"server-time"}},
  "@/lib/firebaseAdmin":{adminDb:db},"@/lib/verifyFirebaseToken":{verifiedIdentity:async()=>({uid:"u1",email:"a@example.com"})},
  "@/lib/auction":auction,"@/lib/trial":loadSource("src/lib/trial.ts",{"./auction":auction}),
  "@/lib/payments":{dodoRequest:async()=>{checkoutCalls++;throw new Error("Must not charge during trial");}}
 });
 const response=await POST({json:async()=>({adId:"ad1",type:"purchase"})});const ad=data.get("ads/ad1");
 assert.equal(response.status,200);assert.equal(response.body.freeTrial,true);assert.equal(ad.status,"active");assert.equal(ad.expiresAt.getTime(),trialEndsAt.getTime());
 assert.equal(ad.totalPaidCents,0);assert.equal(data.get("users/u1").totalSpentCents,0);assert.equal(checkoutCalls,0);assert.equal(data.has("paymentOrders/new-order"),false);
});
test("duplicate partial and full refunds reduce totals exactly once and stop a fully refunded active ad",async()=>{
 const {db,applyPayment,payment}=fixture();await applyPayment(payment);
 const {applyRefund}=loadSource("src/lib/payments.ts",{"firebase-admin/firestore":{FieldValue},"./firebaseAdmin":{adminDb:db},"./auction":auction});
 const partial={refund_id:"ref1",payment_id:"pay1",status:"succeeded",amount:5000,currency:"USD",is_partial:true};
 await Promise.all([applyRefund(partial),applyRefund(partial)]);
 assert.equal(db.data.get("users/u1").totalSpentCents,14500);
 assert.equal(db.data.get("ads/ad1").status,"active");
 const full={...partial,refund_id:"ref2",amount:14500,is_partial:false};
 await applyRefund(full);
 assert.equal(db.data.get("users/u1").totalSpentCents,0);
 assert.equal(db.data.get("ads/ad1").totalPaidCents,0);
 assert.equal(db.data.get("ads/ad1").status,"expired");
 assert.equal(db.data.get("ads/ad1").paymentReviewRequired,true);
 await assert.rejects(()=>applyRefund({...partial,refund_id:"ref3",amount:1}));
});
test("moderation receipts bind only the inspected image and match the ad saved later",()=>{
 const {uploadMatches,ownedImageMatches,contentHash}=loadSource("src/lib/moderation-receipt.ts",{"node:crypto":require("node:crypto"),"./firebaseAdmin":{adminDb:{}},"./auction":auction});
 const url="https://i.ibb.co/abc/ad.jpg";const upload={uid:"u1",url,imageHash:"h1"};
 assert.equal(uploadMatches(upload,"u1",url,"h1"),true);
 for(const [uid,imageURL,hash] of [["u2",url,"h1"],["u1",url,"h2"],["u1","https://i.ibb.co/other.jpg","h1"]])assert.equal(uploadMatches(upload,uid,imageURL,hash),false);
 assert.equal(uploadMatches(undefined,"u1",url,"h1"),false);
 assert.equal(ownedImageMatches({advertiserUID:"u1",imageURL:url},"u1",url),true);
 assert.equal(ownedImageMatches({advertiserUID:"u2",imageURL:url},"u1",url),false);
 assert.equal(ownedImageMatches(undefined,"u1",url),false);
 const reviewed={title:"Primio",description:"Ad",destinationURL:"https://primio.com.uz/",imageURL:url};
 const saved=auction.validateAdInput({title:" Primio ",description:"Ad ",destinationURL:"https://primio.com.uz",imageURL:url,category:"technology",dailyBidCents:100,durationDays:1});
 assert.equal(contentHash(reviewed),contentHash(saved));
 assert.notEqual(contentHash(reviewed),contentHash({...saved,title:"Other"}));
});
test("moderation diagnostics require sign-in before contacting AI",async()=>{
 let checks=0;
 const {GET}=loadSource("src/app/api/moderation/route.ts",{
  "next/server":{NextResponse:{json:(body,{status=200}={})=>({body,status})}},
  "@/lib/verifyFirebaseToken":{verifyFirebaseToken:async req=>{checks++;return req.headers.get("authorization")==="Bearer valid-test-token"?"u1":null;}},
  "@/lib/firebaseAdmin":{adminDb:{}},
  "@/lib/auction":{publicWebsite:()=>{}},
  "@/lib/moderation-receipt":{imageHash:()=>{},issueReview:()=>{},ownedImageMatches:()=>{},uploadMatches:()=>{}}
 },{XAI_API_KEY:"test-api-key"});
 const anonymous=await GET({headers:{get:()=>null}});
 assert.equal(anonymous.status,401);
 assert.equal(anonymous.body.error,"Unauthorized");
 assert.equal(checks,1);
 const signedIn=await GET({headers:{get:()=>"Bearer valid-test-token"}});
 assert.equal(signedIn.status,200);
 assert.equal(signedIn.body.xai_key,true);
});
