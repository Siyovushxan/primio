import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

// Vision model — Llama 4 Maverick (stronger than Scout, supports images)
const MODEL_VISION = "meta-llama/llama-4-maverick-17b-128e-instruct";
// Text-only model — 70B, strongest reasoning on Groq
const MODEL_TEXT = "llama-3.3-70b-versatile";

// Fast pre-check: blocked domain/keyword patterns (no AI needed)
const BLOCKED_PATTERNS = [
  /\bsex\b/i, /\bporn\b/i, /\bxxx\b/i, /\bnude\b/i, /\berotic\b/i,
  /\bcasino\b/i, /\bgambl/i, /\bdrug\b/i, /\bnasha\b/i, /\bweed\b/i,
  /\bescort\b/i, /\bprostit/i, /\bsindr\b/i, /\bbet(ting)?\b/i,
  /\bcrack\b/i, /\bhack\b/i, /\bpirat/i, /\bpharma\b/i,
];

function domainBlocked(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (const p of BLOCKED_PATTERNS) {
      if (p.test(hostname)) {
        return `Sayt domeni taqiqlangan kontent bilan bog'liq: ${hostname}`;
      }
    }
  } catch {
    return "URL formati noto'g'ri";
  }
  return null;
}

async function groqChat(
  model: string,
  messages: any[],
  maxTokens = 256,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "";

  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

const SYSTEM_PROMPT = `Sen professional reklama kontent moderatorisan. Reklamani quyidagi qoidalarga ko'ra tekshir.

RAD ETISH SHARTLARI:
- 18+ yoki jinsiy kontent (rasm yoki matnda)
- Zo'ravonlik, tahdid, terrorizm
- Noqonuniy tovar/xizmat: nasha, qurol, kontrafakt, pirat dastur
- Kumor, stavka, loteriya (ruxsatsiz)
- Firibgarlik: "100% daromad", "tez boyish", "kafolatlangan foyda"
- Haqorat, irqchilik, millatchililik
- Shaxsiy ma'lumot o'g'irlash (fishing)
- Escort, prostitusiya
- Sohta dori-darmon va'dalari

TASDIQLASH SHARTLARI:
- Oddiy do'kon, xizmat, mahsulot reklamasi
- Ta'lim, kurs, kitob
- Texnologiya, dastur, ilova
- Ovqat, restoran, yetkazib berish
- Ko'ngilochar kontent (halol)
- Sayohat, turizm
- Uy-joy, ko'chmas mulk

JAVOB FORMATI (faqat shu ikki variantdan biri):
APPROVED
yoki
REJECTED: [o'zbek tilida aniq sabab, 1 jumla]`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, title, description, destinationURL } = await req.json();

    if (!title || !destinationURL) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ── 1. Fast keyword/domain pre-check (no API) ────────────────────────────
    const domainErr = domainBlocked(destinationURL);
    if (domainErr) {
      return NextResponse.json({ approved: false, reason: domainErr });
    }

    const allText = [title, description, destinationURL].filter(Boolean).join(" ");
    for (const p of BLOCKED_PATTERNS) {
      if (p.test(allText)) {
        return NextResponse.json({
          approved: false,
          reason: "Matn yoki URL taqiqlangan kalit so'z o'z ichiga olmoqda",
        });
      }
    }

    // ── 2. URL reachability check ─────────────────────────────────────────────
    try {
      const urlCheck = await fetch(destinationURL, {
        method: "HEAD",
        signal: AbortSignal.timeout(6000),
        redirect: "follow",
      });
      if (!urlCheck.ok && urlCheck.status !== 405 && urlCheck.status !== 403) {
        return NextResponse.json({
          approved: false,
          reason: `Sayt ishlamayapti (${urlCheck.status}). To'g'ri URL kiriting.`,
        });
      }
    } catch {
      return NextResponse.json({
        approved: false,
        reason: "URL manzilga ulanib bo'lmadi. Saytni tekshiring.",
      });
    }

    // ── 3. No API key → fail closed ───────────────────────────────────────────
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        approved: false,
        reason: "Moderatsiya xizmati hozirda mavjud emas. Keyinroq urinib ko'ring.",
      });
    }

    const adInfo = `Sarlavha: "${title}"
Tavsif: "${description || "(yo'q)"}"
Veb-sayt: ${destinationURL}`;

    // ── 4a. Image + text check via Llama 4 Maverick (vision) ─────────────────
    if (imageBase64 && mimeType) {
      const dataUrl = `data:${mimeType};base64,${imageBase64}`;
      const reply = await groqChat(MODEL_VISION, [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
            {
              type: "text",
              text: `Rasmni va quyidagi ma'lumotlarni tekshir:\n\n${adInfo}`,
            },
          ],
        },
      ]);

      if (reply.toUpperCase().startsWith("REJECTED")) {
        const reason =
          reply.replace(/^REJECTED:?\s*/i, "").trim() ||
          "Reklama moderatsiya talablariga javob bermadi";
        return NextResponse.json({ approved: false, reason });
      }

      if (!reply.toUpperCase().startsWith("APPROVED")) {
        // Unexpected reply — fail closed
        return NextResponse.json({
          approved: false,
          reason: "Moderatsiya natijasini aniqlab bo'lmadi. Qayta urinib ko'ring.",
        });
      }

      return NextResponse.json({ approved: true });
    }

    // ── 4b. Text-only check via Llama 3.3 70B ────────────────────────────────
    const reply = await groqChat(MODEL_TEXT, [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Quyidagi reklamani tekshir:\n\n${adInfo}`,
      },
    ]);

    if (reply.toUpperCase().startsWith("REJECTED")) {
      const reason =
        reply.replace(/^REJECTED:?\s*/i, "").trim() ||
        "Reklama moderatsiya talablariga javob bermadi";
      return NextResponse.json({ approved: false, reason });
    }

    if (!reply.toUpperCase().startsWith("APPROVED")) {
      return NextResponse.json({
        approved: false,
        reason: "Moderatsiya natijasini aniqlab bo'lmadi. Qayta urinib ko'ring.",
      });
    }

    return NextResponse.json({ approved: true });
  } catch (err: any) {
    console.error("Moderation error:", err);
    return NextResponse.json({
      approved: false,
      reason: "Moderatsiya tekshiruvida xato yuz berdi. Qayta urinib ko'ring.",
    });
  }
}
