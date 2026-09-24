import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { adminDb } from "@/lib/firebaseAdmin";
import { publicWebsite } from "@/lib/auction";
import { imageHash } from "@/lib/moderation-receipt";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await verifyFirebaseToken(req);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const apiKey = process.env.IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Rasm yuklash xizmati sozlanmagan" }, { status: 500 });
    }

    const { imageBase64 } = await req.json();
    if (typeof imageBase64 !== "string" || !imageBase64) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const form = new FormData();
    form.append("image", imageBase64);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();

    if (!data.success) {
      return NextResponse.json({ error: "Rasm yuklanmadi" }, { status: 500 });
    }

    // Record who uploaded which bytes, so moderation can bind its receipt to this exact image
    const url = publicWebsite(data.data.url);
    const upload = await adminDb.collection("uploads").add({ uid, url, imageHash: imageHash(imageBase64), createdAt: new Date() });
    return NextResponse.json({ url, uploadId: upload.id });
  } catch (err: any) {
    console.error("Image upload error:", err?.message);
    return NextResponse.json({ error: "Rasm yuklanmadi. Qayta urinib ko'ring." }, { status: 500 });
  }
}
