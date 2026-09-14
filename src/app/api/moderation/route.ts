import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
// Vision modellar: birinchi ishlamasa keyingisi sinab ko'riladi
const VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "llama-3.2-11b-vision-preview",
];
const MODEL_TEXT = "llama-3.3-70b-versatile";

// ── Blocked keyword patterns (EN + UZ + RU) ──────────────────────────────────
const BLOCKED_PATTERNS = [
  // Jinsiy kontent
  /\bsex\b/i, /\bseks\b/i, /\bporn\b/i, /\bporno\b/i, /\bparno\b/i,
  /\bxxx\b/i, /\bnude\b/i, /\berotic\b/i, /\berotik\b/i,
  /\bescort\b/i, /\bprostit/i, /\bfahisha\b/i, /\bintim\b/i,
  // Zo'ravonlik / terror
  /\bterror/i, /\bjihod\b/i, /\bbomb\b/i, /\bqurol\b/i, /\boruzhie\b/i,
  // Narkotik
  /\bdrug\b/i, /\bnasha\b/i, /\bweed\b/i, /\bheroin\b/i, /\bkokain\b/i,
  /\bnarko/i, /\bgashish\b/i,
  // Kumor
  /\bcasino\b/i, /\bgambl/i, /\bbet(ting)?\b/i, /\bstavka\b/i,
  // Firibgarlik
  /\bcrack\b/i, /\bhack\b/i, /\bpirat/i, /\bfishing\b/i, /\bphish/i,
  // Sohta dori
  /\bpharma\b/i, /\bviagra\b/i,
];

function domainBlocked(url: string): string | null {
  try {
    const h = new URL(url).hostname.toLowerCase();
    for (const p of BLOCKED_PATTERNS) {
      if (p.test(h)) return `Sayt domeni taqiqlangan: ${h}`;
    }
  } catch {
    return "URL formati noto'g'ri";
  }
  return null;
}

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

async function groqChat(model: string, messages: any[], timeoutMs = 8000): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "";

  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: 128 }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content?.trim() || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

const SYSTEM_PROMPT = `Sen qat'iy reklama kontent moderatorisan. Har qanday shubha bo'lsa REJECTED de.

RASM BO'YICHA RAD ETISH — quyidagilardan BIRI bo'lsa ham REJECTED:
- Yalang'och yoki qisman yalang'och tana (bikini, ichki kiyim, korsaj, shunga o'xshash)
- Ko'krak, son, dumba yoki jinsiy a'zolar ochiq ko'rinsa
- Jinsiy jihatdan qo'zg'atuvchi, provokatsion yoki erotik kiyim va poza
- 18+ yoki kattalar uchun mo'ljallangan kontent
- Zo'ravonlik, qon, qurol ko'rsatilsa

MATN BO'YICHA RAD ETISH:
- Seks, porno, escort, fahisha, intim xizmatlar
- Narkotik, nasha, giyohvand moddalar
- Kumor, stavka, loteriya
- Firibgarlik: "kafolatlangan foyda", "100% daromad", "tez boyish"
- Haqorat, irqchilik, nafrat nutqi
- Fishing/aldash saytlari
- Sohta dori va'dalari

TASDIQLASH (faqat rasmda odatiy biznes tasviri bo'lsa):
- Mahsulot, do'kon, xizmat, logotip, interfeys
- Oziq-ovqat, restoran, ovqat tasviri
- Sayohat joylari, arxitektura
- Ta'lim, kurs, kitob
- Texnologiya, ilova

QOIDA: Rasmdagi odam qisman yoki to'liq yechingan bo'lsa — sarlavha yoki matn nima bo'lishidan qat'iy nazar REJECTED de.

JAVOB — faqat shu ikki formatdan biri:
APPROVED
yoki
REJECTED: [sabab 1 jumlada o'zbekcha]`;

export async function GET() {
  return NextResponse.json({ ok: true, groq: !!process.env.GROQ_API_KEY });
}

export async function POST(req: NextRequest) {
  if (!hasValidToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, destinationURL, imageBase64, mimeType } = body as {
      title?: string; description?: string; destinationURL?: string;
      imageBase64?: string; mimeType?: string;
    };

    if (!title || !destinationURL) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ── 1. Tez keyword/domain tekshiruvi ─────────────────────────────────────
    const domainErr = domainBlocked(destinationURL);
    if (domainErr) return NextResponse.json({ approved: false, reason: domainErr });

    const allText = [title, description, destinationURL].filter(Boolean).join(" ");
    for (const p of BLOCKED_PATTERNS) {
      if (p.test(allText)) {
        return NextResponse.json({
          approved: false,
          reason: "Sarlavha yoki tavsifda taqiqlangan so'z aniqlandi",
        });
      }
    }

    // ── 2. URL mavjudligi tekshiruvi ──────────────────────────────────────────
    try {
      const urlCheck = await fetch(destinationURL, {
        method: "HEAD",
        signal: AbortSignal.timeout(2000),
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

    // ── 3. Groq API yo'q → keyword tekshiruvi yetarli ────────────────────────
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ approved: true });
    }

    const adInfo = `Sarlavha: "${title}"\nTavsif: "${description || "(yo'q)"}"\nURL: ${destinationURL}`;

    const userPrompt =
      `RASMNI DIQQAT BILAN KO'R:\n` +
      `1. Rasmdagi odam yoki shaxs bor-yo'qligini aniqlang\n` +
      `2. Agar odam bo'lsa — kiyimi to'liq, qisman yechingganmi yoki yalang'ochmi?\n` +
      `3. Rasm jinsiy jihatdan qo'zg'atuvchi yoki provokatsionmi?\n` +
      `4. Reklama ma'lumotlari:\n${adInfo}\n\n` +
      `Yuqoridagi qoidalarga asosan APPROVED yoki REJECTED de.`;

    // ── 4a. Rasm tekshiruvi — bir nechta vision model bilan sinab ko'riladi ───
    if (imageBase64 && mimeType) {
      const dataUrl = `data:${mimeType};base64,${imageBase64}`;
      let visionDone = false;

      for (const vModel of VISION_MODELS) {
        try {
          const reply = await groqChat(vModel, [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: dataUrl } },
                { type: "text", text: userPrompt },
              ],
            },
          ], 12000);

          if (reply.toUpperCase().startsWith("REJECTED")) {
            const reason = reply.replace(/^REJECTED:?\s*/i, "").trim() || "Rasm moderatsiya talablariga javob bermadi";
            return NextResponse.json({ approved: false, reason });
          }
          if (reply.toUpperCase().startsWith("APPROVED")) {
            return NextResponse.json({ approved: true });
          }
          // Noaniq javob — keyingi modelni sinab ko'r
          console.warn(`Vision model ${vModel} gave unclear response:`, reply.slice(0, 80));
        } catch (e: any) {
          console.warn(`Vision model ${vModel} failed:`, e?.message?.slice(0, 120));
        }
      }

      // Barcha vision modellari ishlamadi → rasm bo'lsa xavfsiz rad etish
      console.warn("All vision models failed — rejecting image submission");
      return NextResponse.json({
        approved: false,
        reason: "Rasm tekshirib bo'lmadi. Bir ozdan keyin qayta urinib ko'ring.",
      });
    }

    // ── 4b. Matn tekshiruvi (rasm yo'q holat) ────────────────────────────────
    try {
      const reply = await groqChat(MODEL_TEXT, [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Reklama ma'lumotlarini tekshir (faqat matn):\n${adInfo}` },
      ], 8000);

      if (reply.toUpperCase().startsWith("REJECTED")) {
        const reason = reply.replace(/^REJECTED:?\s*/i, "").trim() || "Moderatsiyadan o'tmadi";
        return NextResponse.json({ approved: false, reason });
      }
    } catch (e: any) {
      console.warn("Text check failed:", e?.message);
    }

    return NextResponse.json({ approved: true });
  } catch (err: any) {
    console.error("Moderation error:", err?.message);
    return NextResponse.json({ approved: false, reason: "Moderatsiya xatosi. Qayta urinib ko'ring." });
  }
}
