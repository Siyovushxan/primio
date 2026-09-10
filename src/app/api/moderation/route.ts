import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, title, description, destinationURL } = await req.json();

    if (!title || !destinationURL) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await runModeration({ imageBase64, mimeType, title, description, destinationURL });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Moderation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function groqChat(model: string, messages: any[]): Promise<string> {
  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: 150 }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function runModeration(params: {
  imageBase64?: string;
  mimeType?: string;
  title: string;
  description?: string;
  destinationURL: string;
}): Promise<{ approved: boolean; reason?: string }> {
  const { imageBase64, mimeType, title, description, destinationURL } = params;
  const apiKey = process.env.GROQ_API_KEY;

  // 1. URL faolligini tekshirish
  try {
    const urlCheck = await fetch(destinationURL, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    if (!urlCheck.ok && urlCheck.status !== 405) {
      return { approved: false, reason: `Sayt ishlamayapti (${urlCheck.status})` };
    }
  } catch {
    return { approved: false, reason: "URL manzilga ulanib bo'lmadi. Saytni tekshiring." };
  }

  if (!apiKey) return { approved: true };

  // 2. Rasm tekshiruvi (base64 orqali — Firebase Storage shart emas)
  if (imageBase64 && mimeType) {
    try {
      const dataUrl = `data:${mimeType};base64,${imageBase64}`;
      const imageReply = await groqChat("meta-llama/llama-4-scout-17b-16e-instruct", [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl } },
            {
              type: "text",
              text: `You are an ad image moderator. Does this image contain: adult/sexual content (18+), graphic violence, nudity, drug use, or illegal content?

Reply EXACTLY:
SAFE
or
UNSAFE: [reason in Uzbek]`,
            },
          ],
        },
      ]);

      if (imageReply.startsWith("UNSAFE")) {
        const reason = imageReply.replace(/^UNSAFE:?/i, "").trim() || "Rasm moderatsiya talablariga javob bermadi";
        return { approved: false, reason };
      }
    } catch (e) {
      console.error("Image moderation failed:", e);
    }
  }

  // 3. Matn tekshiruvi
  try {
    const text = [title, description].filter(Boolean).join(". ");
    const textReply = await groqChat("llama-3.1-8b-instant", [
      {
        role: "system",
        content: `Sen reklama matn moderatorisan. Faqat APPROVE yoki REJECT: [sabab] deb javob ber.

Qoidalar:
- 18+ yoki jinsiy kontent → REJECT
- Zo'ravonlik, qo'rqitish → REJECT
- Firib, aldov, noto'g'ri va'dalar → REJECT
- Noqonuniy mahsulot/xizmat → REJECT
- Haqorat, kamsitish → REJECT
- Oddiy reklama → APPROVE`,
      },
      { role: "user", content: `Reklama matni: "${text}"` },
    ]);

    if (textReply.startsWith("REJECT")) {
      const reason = textReply.replace(/^REJECT:?/i, "").trim() || "Matn moderatsiya talablariga javob bermadi";
      return { approved: false, reason };
    }
  } catch (e) {
    console.error("Text moderation failed:", e);
  }

  return { approved: true };
}
