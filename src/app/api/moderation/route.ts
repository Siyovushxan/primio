import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Domains/keywords that are clearly adult/illegal — fast pre-check
const BLOCKED_PATTERNS = [
  /\bsex\b/i, /\bporn\b/i, /\bxxx\b/i, /\bnude\b/i, /\berotic\b/i,
  /\bcasino\b/i, /\bgambl/i, /\bdrug\b/i, /\bnasha\b/i, /\bweed\b/i,
  /\bescort\b/i, /\bprostit/i, /\bsindr\b/i,
];

function domainBlocked(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (const p of BLOCKED_PATTERNS) {
      if (p.test(hostname)) return `Sayt domeni ruxsat etilmagan kontent bilan bog'liq: ${hostname}`;
    }
  } catch {
    return "URL formati noto'g'ri";
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, title, description, destinationURL } = await req.json();

    if (!title || !destinationURL) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Fast domain/keyword check — no AI needed
    const domainErr = domainBlocked(destinationURL);
    if (domainErr) {
      return NextResponse.json({ approved: false, reason: domainErr });
    }

    // 2. Text/domain keyword check on title+description
    const allText = [title, description, destinationURL].filter(Boolean).join(" ");
    for (const p of BLOCKED_PATTERNS) {
      if (p.test(allText)) {
        return NextResponse.json({ approved: false, reason: "Matn yoki URL taqiqlangan kalit so'z o'z ichiga olmoqda" });
      }
    }

    // 3. URL reachability check
    try {
      const urlCheck = await fetch(destinationURL, {
        method: "HEAD",
        signal: AbortSignal.timeout(6000),
        redirect: "follow",
      });
      if (!urlCheck.ok && urlCheck.status !== 405 && urlCheck.status !== 403) {
        return NextResponse.json({ approved: false, reason: `Sayt ishlamayapti (${urlCheck.status}). To'g'ri URL kiriting.` });
      }
    } catch {
      return NextResponse.json({ approved: false, reason: "URL manzilga ulanib bo'lmadi. Saytni tekshiring." });
    }

    // 4. Claude AI deep moderation (image + text together)
    if (!process.env.ANTHROPIC_API_KEY) {
      // Fail closed: if no API key, reject rather than auto-approve
      return NextResponse.json({ approved: false, reason: "Moderatsiya xizmati hozirda mavjud emas. Keyinroq urinib ko'ring." });
    }

    const textPrompt = `Sen reklama moderatorisan. Quyidagi reklamani tekshir va FAQAT quyidagi formatda javob ber:

APPROVED
yoki
REJECTED: [o'zbek tilida sabab]

Reklama ma'lumotlari:
- Sarlavha: "${title}"
- Tavsif: "${description || "(yo'q)"}"
- Veb-sayt: ${destinationURL}

Rad etish shartlari:
- 18+ yoki jinsiy kontent
- Zo'ravonlik yoki tahdid
- Noqonuniy tovar/xizmat (nasha, qurol, aldov)
- Kumor, loteriya
- Firib, noto'g'ri va'dalar ("100% daromad", "tez boyish")
- Haqorat yoki kamsituvchi mazmun
- Shaxsiy ma'lumot o'g'irlash niyati
- Escort, prostitusiya

Oddiy tovar/xizmat reklamalari, do'konlar, ta'lim, texnologiya — APPROVED.`;

    const contentParts: Anthropic.MessageParam["content"] = [];

    // Add image if provided
    if (imageBase64 && mimeType) {
      const validMimes: Anthropic.Base64ImageSource["media_type"][] = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
      ];
      const mediaType = validMimes.includes(mimeType as any)
        ? (mimeType as Anthropic.Base64ImageSource["media_type"])
        : "image/jpeg";

      contentParts.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: imageBase64 },
      });
    }

    contentParts.push({ type: "text", text: textPrompt });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: contentParts }],
    });

    const reply = (response.content[0] as any).text?.trim() || "";

    if (reply.startsWith("REJECTED")) {
      const reason = reply.replace(/^REJECTED:?\s*/i, "").trim() || "Reklama moderatsiya talablariga javob bermadi";
      return NextResponse.json({ approved: false, reason });
    }

    return NextResponse.json({ approved: true });
  } catch (err: any) {
    console.error("Moderation error:", err);
    // On unexpected error, fail closed
    return NextResponse.json({ approved: false, reason: "Moderatsiya tekshiruvida xato yuz berdi. Qayta urinib ko'ring." });
  }
}
