import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function hasValidToken(req: NextRequest): boolean {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return !!(payload.user_id || payload.sub);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!hasValidToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const apiKey = process.env.IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Rasm yuklash xizmati sozlanmagan" }, { status: 500 });
    }

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
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

    return NextResponse.json({ url: data.data.url });
  } catch (err: any) {
    console.error("Image upload error:", err?.message);
    return NextResponse.json({ error: "Rasm yuklanmadi. Qayta urinib ko'ring." }, { status: 500 });
  }
}
