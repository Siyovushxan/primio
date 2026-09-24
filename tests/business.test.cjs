const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ts=require("typescript");
function loadSource(file,dependencies={}){
 const source=fs.readFileSync(path.join(__dirname,"..",file),"utf8");
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};const context={exports,require:name=>{if(!(name in dependencies))throw new Error("Unexpected dependency: "+name);return dependencies[name];},process:{env:{}},URL,Date,console,AbortSignal,fetch:()=>{throw new Error("Tests must not contact services");}};
 vm.runInNewContext(code,context,{filename:file});return exports;
}
const auction=loadSource("src/lib/auction.ts");
const {DAY_MS,quotePayment,rankAds,validBid,validDuration,publicWebsite}=auction;
const now=1_800_000_000_000;
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
test("new-account payment waits for admin; paid clock has not started",async()=>{
 const {db,applyPayment,payment}=fixture({newAccount:true});await applyPayment(payment);const ad=db.data.get("ads/ad1");
 assert.equal(ad.status,"pending_verification");assert.equal(ad.startsAt,null);assert.equal(ad.expiresAt,null);assert.equal(db.data.get("users/u1").isNewAccount,true);
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
