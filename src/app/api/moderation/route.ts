import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_VISION = "meta-llama/llama-4-scout-17b-16e-instruct";
const MODEL_TEXT   = "llama-3.3-70b-versatile";

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

const SYSTEM_PROMPT = `Sen reklama kontent moderatorisan. Qat'iy qoidalar:

RAD ETISH (REJECTED):
- Jinsiy/18+ kontent: yalang'och tana, seks, porno, escort, fahisha, intim xizmat
- Zo'ravonlik, qurol, terror, tahdid
- Narkotik, nasha, giyohvand moddalar
- Kumor, stavka, ruxsatsiz loteriya
- Firibgarlik: "kafolatlangan foyda", "100% daromad", "tez boyish"
- Haqorat, irqchilik, nafrat nutqi
- Fishing/aldash saytlari
- Sohta dori va'dalari

TASDIQLASH (APPROVED):
- Do'kon, xizmat, mahsulot
- Ta'lim, kurs, kitob
- Texnologiya, ilova, dastur
- Ovqat, restoran
- Sayohat, turizm
- Ko'chmas mulk

JAVOB — faqat shu ikki variantdan biri:
APPROVED
yoki
REJECTED: [o'zbek tilida aniq sabab 1 jumlada]`;

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

    // ── 4a. Rasm + matn tekshiruvi (vision model) ─────────────────────────────
    if (imageBase64 && mimeType) {
      try {
        const dataUrl = `data:${mimeType};base64,${imageBase64}`;
        const reply = await groqChat(MODEL_VISION, [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: `Rasmni va quyidagi ma'lumotlarni tekshir:\n${adInfo}` },
            ],
          },
        ], 10000);

        if (reply.toUpperCase().startsWith("REJECTED")) {
          const reason = reply.replace(/^REJECTED:?\s*/i, "").trim() || "Rasm yoki matn moderatsiya talablariga javob bermadi";
          return NextResponse.json({ approved: false, reason });
        }
        if (reply.toUpperCase().startsWith("APPROVED")) {
          return NextResponse.json({ approved: true });
        }
        // Vision javob bermadi → matn tekshiruviga o'tish
      } catch (e: any) {
        console.warn("Vision check failed, falling back to text:", e?.message);
      }
    }

    // ── 4b. Matn-only tekshiruvi (fallback) ──────────────────────────────────
    try {
      const reply = await groqChat(MODEL_TEXT, [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Tekshir:\n${adInfo}` },
      ], 8000);

      if (reply.toUpperCase().startsWith("REJECTED")) {
        const reason = reply.replace(/^REJECTED:?\s*/i, "").trim() || "Moderatsiyadan o'tmadi";
        return NextResponse.json({ approved: false, reason });
      }
    } catch (e: any) {
      console.warn("Text check failed:", e?.message);
      // Groq ishlamasa → keyword tekshiruvi o'tgan, tasdiqlash
    }

    return NextResponse.json({ approved: true });
  } catch (err: any) {
    console.error("Moderation error:", err?.message);
    return NextResponse.json({ approved: false, reason: "Moderatsiya xatosi. Qayta urinib ko'ring." });
  }
}
