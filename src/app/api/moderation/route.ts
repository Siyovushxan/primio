import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_TEXT = "llama-3.3-70b-versatile";

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
      if (p.test(hostname)) return `Sayt domeni taqiqlangan: ${hostname}`;
    }
  } catch {
    return "URL formati noto'g'ri";
  }
  return null;
}

// Lightweight JWT audience check — avoids firebase-admin module load crash
function extractUid(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.user_id === "string" ? payload.user_id :
           typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

async function groqChat(messages: any[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "";

  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL_TEXT, messages, temperature: 0.1, max_tokens: 128 }),
    signal: AbortSignal.timeout(7000),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content?.trim() || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

const SYSTEM_PROMPT = `Sen reklama kontent moderatorisan. Qoidalar:
RAD: 18+/jinsiy, zo'ravonlik, nasha/qurol, kumor, firibgarlik ("100% daromad"), haqorat, fishing, escort, sohta dori.
TASDIQLASH: do'kon, xizmat, ta'lim, texnologiya, ovqat, sayohat, uy-joy.
JAVOB (faqat biri): APPROVED yoki REJECTED: [sabab]`;

export async function GET() {
  return NextResponse.json({ ok: true, groq: !!process.env.GROQ_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    // Basic token presence check (no firebase-admin needed)
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token || !extractUid(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, destinationURL } = body as {
      title?: string; description?: string; destinationURL?: string;
    };

    if (!title || !destinationURL) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Domain/keyword pre-check
    const domainErr = domainBlocked(destinationURL);
    if (domainErr) return NextResponse.json({ approved: false, reason: domainErr });

    const allText = [title, description, destinationURL].filter(Boolean).join(" ");
    for (const p of BLOCKED_PATTERNS) {
      if (p.test(allText)) {
        return NextResponse.json({ approved: false, reason: "Taqiqlangan so'z aniqlandi" });
      }
    }

    // 2. URL reachability
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

    // 3. No Groq key → approve (keyword checks passed)
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ approved: true });
    }

    // 4. AI text check — failure is non-fatal (keyword checks are the main gate)
    try {
      const adInfo = `Sarlavha: "${title}"\nTavsif: "${description || "(yo'q)"}"\nURL: ${destinationURL}`;
      const reply = await groqChat([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Tekshir:\n${adInfo}` },
      ]);
      if (reply.toUpperCase().startsWith("REJECTED")) {
        const reason = reply.replace(/^REJECTED:?\s*/i, "").trim() || "Moderatsiyadan o'tmadi";
        return NextResponse.json({ approved: false, reason });
      }
    } catch (aiErr: any) {
      // Groq unavailable → approve since keyword/URL checks passed
      console.warn("Groq AI check skipped:", aiErr?.message);
    }

    return NextResponse.json({ approved: true });
  } catch (err: any) {
    console.error("Moderation error:", err?.message || err);
    return NextResponse.json({ approved: false, reason: "Moderatsiya xatosi. Qayta urinib ko'ring." });
  }
}
