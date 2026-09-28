import {NextRequest,NextResponse} from "next/server";
import {FieldValue} from "firebase-admin/firestore";
import {adminDb} from "@/lib/firebaseAdmin";
import {validateFeedback} from "@/lib/feedback";

export async function POST(req:NextRequest){
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({error:"Invalid request."},{status:415});
  }
  const origin=req.headers.get("origin");
  if (origin && origin!==req.nextUrl.origin) return NextResponse.json({error:"Invalid origin."},{status:403});
  let feedback:ReturnType<typeof validateFeedback>;
  try {
    const raw=await req.text();
    if (raw.length>10000) return NextResponse.json({error:"Message is too long."},{status:413});
    feedback=validateFeedback(JSON.parse(raw));
  } catch {
    return NextResponse.json({error:"Enter a message of 10–2000 characters and a valid email address, if provided."},{status:400});
  }
  try {
    if (!feedback.isBot) {
      await adminDb.collection("feedback").add({name:feedback.name,email:feedback.email,message:feedback.message,
        status:"new",source:"contact",createdAt:FieldValue.serverTimestamp()});
    }
    return NextResponse.json({ok:true});
  } catch(error) {
    console.error("Feedback save failed:",error);
    return NextResponse.json({error:"Could not save your message. Please try again."},{status:503});
  }
}
