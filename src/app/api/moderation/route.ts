import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

// Groq vision models — first available one is used
const VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
];

const MODEL_TEXT = "llama-3.3-70b-versatile";

// HuggingFace NSFW detection (sexual content)
const HF_NSFW_MODEL = "https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection";

// ── Blocked keyword patterns (EN + UZ + RU) ──────────────────────────────────
const BLOCKED_PATTERNS = [
  // Sexual content
  /\bsex\b/i, /\bseks\b/i, /\bporn\b/i, /\bporno\b/i, /\bparno\b/i,
  /\bxxx\b/i, /\bnude\b/i, /\bnudity\b/i, /\berotic\b/i, /\berotik\b/i,
  /\bescort\b/i, /\bprostit/i, /\bfahisha\b/i, /\bintim\b/i,
  /\bonlyfans\b/i, /\badult.content\b/i,
  // Violence / terror / weapons
  /\bterror/i, /\bjihod\b/i, /\bjihad\b/i, /\bbomb\b/i, /\bexplosive\b/i,
  /\bqurol\b/i, /\boruzhie\b/i, /\bweapon\b/i,
  /\bgun(s)?\b/i, /\brifle\b/i, /\bpistol\b/i, /\bfirearm\b/i,
  /\bknife\b/i, /\bblade\b/i, /\bsword\b/i,
  /\bkill\b/i, /\bmurder\b/i, /\bviolence\b/i, /\bzoravonlik\b/i,
  /\bassassinat/i, /\bexecution\b/i,
  // Drugs / narcotics
  /\bdrug\b/i, /\bnasha\b/i, /\bweed\b/i, /\bheroin\b/i, /\bkokain\b/i,
  /\bcocaine\b/i, /\bnarko/i, /\bgashish\b/i, /\bcannabis\b/i,
  /\bmarijuana\b/i, /\bmeth\b/i, /\bfentanyl\b/i, /\bopium\b/i,
  // Gambling
  /\bcasino\b/i, /\bgambl/i, /\bbet(ting)?\b/i, /\bstavka\b/i,
  /\bpoker\b/i, /\bslot.machine\b/i,
  // Fraud / hacking
  /\bhack\b/i, /\bpirat/i, /\bphish/i, /\bscam\b/i,
  /\bfake.id\b/i, /\bcounterfeit\b/i,
  // Fake medicine
  /\bviagra\b/i, /\bcialis\b/i, /\bsteroid\b/i,
  // Hate speech
  /\bnazi\b/i, /\bfascis/i, /\bwhite.suprem/i, /\bhatred\b/i,
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

async function groqChat(model: string, messages: any[], timeoutMs = 10000): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "";

  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: 200 }),
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

// System prompt in English for best model accuracy; reason returned in Uzbek
const SYSTEM_PROMPT = `You are a strict advertising content moderator. When in doubt, ALWAYS reject.

REJECT the ad if ANY of the following is present in the image OR text:

SEXUAL / ADULT CONTENT:
- Nudity or partial nudity (bikini, underwear, lingerie, corset, topless)
- Visible breasts, buttocks, genitals or intimate body parts
- Sexually suggestive, provocative or erotic poses, outfits, or expressions
- 18+ / adult services, escort, prostitution

VIOLENCE / WEAPONS / GORE:
- Blood, gore, wounds, injuries shown graphically
- Weapons: guns, pistols, rifles, knives, swords, explosives, grenades
- Acts of violence: fighting, beating, killing, execution
- Threatening imagery or gestures

DANGEROUS / ILLEGAL SUBSTANCES:
- Drugs, narcotics, cannabis, cocaine, heroin, pills, syringes
- Drug paraphernalia

HATE / EXTREMISM:
- Nazi symbols, swastikas, white supremacy
- Hate speech, racial slurs, symbols of terrorism
- Terrorist organizations or propaganda

GAMBLING:
- Casino, poker, slot machines, betting platforms

FRAUD / DECEPTION:
- Phishing, fake IDs, counterfeit products
- "Guaranteed profit", "100% income", "get rich fast" promises

FAKE / DANGEROUS MEDICINE:
- Unregulated pharmaceuticals, fake drugs, steroids

APPROVE only when the image/text shows:
- Normal business content: products, logos, storefronts, services
- Food, restaurants, travel destinations, architecture
- Education, courses, books, technology, apps
- Professional people fully clothed in business context

STRICT RULE: If a person in the image is partially or fully undressed — REJECT regardless of the title or description.

RESPONSE FORMAT — return ONLY one of these two formats:
APPROVED
or
REJECTED: [reason in Uzbek, 1 sentence]`;

async function checkNsfwHuggingFace(
  imageBase64: string,
  mimeType: string
): Promise<{ isNsfw: boolean; score: number } | null> {
  try {
    const binaryData = Buffer.from(imageBase64, "base64");
    const headers: Record<string, string> = { "Content-Type": mimeType };
    if (process.env.HF_TOKEN) headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;

    const res = await fetch(HF_NSFW_MODEL, {
      method: "POST",
      headers,
      body: binaryData,
      signal: AbortSignal.timeout(5000),
    });

    if (res.status === 503) {
      console.log("HF NSFW: model loading (503), waiting 16s...");
      await new Promise((r) => setTimeout(r, 16000));
      const res2 = await fetch(HF_NSFW_MODEL, {
        method: "POST",
        headers,
        body: binaryData,
        signal: AbortSignal.timeout(7000),
      });
      if (!res2.ok) { console.warn("HF NSFW 503 retry failed:", res2.status); return null; }
      const data2 = await res2.json();
      const score = data2.find?.((d: any) => d.label === "nsfw")?.score ?? 0;
      return { isNsfw: score > 0.55, score };
    }

    if (!res.ok) { console.warn("HF NSFW failed:", res.status, await res.text()); return null; }
    const data = await res.json();
    if (!Array.isArray(data)) { console.warn("HF NSFW unexpected response:", data); return null; }
    const score = data.find((d: any) => d.label === "nsfw")?.score ?? 0;
    return { isNsfw: score > 0.55, score };
  } catch (e: any) {
    console.warn("HF NSFW check error:", e?.message?.slice(0, 100));
    return null;
  }
}

// Try each vision model in order, return first successful result
async function checkImageWithGroqVision(
  imageBase64: string,
  mimeType: string,
  imageURL: string | undefined,
  adInfo: string
): Promise<{ approved: boolean; reason?: string } | null> {
  if (!process.env.GROQ_API_KEY) return null;

  const imgContent = imageURL
    ? { type: "image_url" as const, image_url: { url: imageURL } }
    : { type: "image_url" as const, image_url: { url: `data:${mimeType};base64,${imageBase64}` } };

  const userPrompt =
    `Carefully examine this image and ad details:\n${adInfo}\n\n` +
    `Check for: nudity, sexual content, weapons, violence, blood, drugs, hate symbols, extremism.\n` +
    `Apply the system rules strictly and respond APPROVED or REJECTED: [reason in Uzbek].`;

  for (const model of VISION_MODELS) {
    try {
      const reply = await groqChat(model, [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: [imgContent, { type: "text", text: userPrompt }] },
      ], 15000);

      if (!reply) continue;

      if (reply.toUpperCase().startsWith("REJECTED")) {
        const reason = reply.replace(/^REJECTED:?\s*/i, "").trim()
          || "Rasm moderatsiya talablariga javob bermadi";
        return { approved: false, reason };
      }
      if (reply.toUpperCase().startsWith("APPROVED")) {
        return { approved: true };
      }
      // Unclear response — try next model
      console.warn(`Vision model ${model} gave unclear response: ${reply.slice(0, 100)}`);
    } catch (e: any) {
      console.warn(`Groq vision ${model} failed: ${e?.message?.slice(0, 150)}`);
    }
  }
  return null; // all models failed
}

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, error: "GROQ_API_KEY yo'q" });

  try {
    const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    const modelsData = await modelsRes.json();
    const allIds: string[] = modelsData.data?.map((m: any) => m.id) ?? [];

    return NextResponse.json({
      ok: true,
      strategy: "Groq vision (primary) + HuggingFace NSFW (fallback) + keyword filter",
      vision_models_configured: VISION_MODELS,
      hf_token: !!process.env.HF_TOKEN,
      all_groq_model_ids: allIds,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, groq_key: true, error: e.message });
  }
}

export async function POST(req: NextRequest) {
  if (!hasValidToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, destinationURL, imageBase64, mimeType, imageURL } = body as {
      title?: string; description?: string; destinationURL?: string;
      imageBase64?: string; mimeType?: string; imageURL?: string;
    };

    if (!title || !destinationURL) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ── 1. Fast keyword / domain check ───────────────────────────────────────
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

    // ── 2. URL availability check ─────────────────────────────────────────────
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

    // ── 3. No Groq API key → keyword check only ───────────────────────────────
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ approved: true });
    }

    const adInfo = `Title: "${title}"\nDescription: "${description || "(none)"}"\nURL: ${destinationURL}`;
    const hasImage = !!(imageBase64 && mimeType);

    // ── 4. Image moderation ───────────────────────────────────────────────────
    if (hasImage) {
      // 4a. Groq vision (comprehensive: sexual, violence, weapons, drugs, hate)
      const visionResult = await checkImageWithGroqVision(imageBase64, mimeType, imageURL, adInfo);
      if (visionResult !== null) {
        if (!visionResult.approved) {
          return NextResponse.json({ approved: false, reason: visionResult.reason });
        }
        // Vision approved — also run text check below
      } else {
        // 4b. Groq vision unavailable → fallback to HuggingFace NSFW (sexual content only)
        console.warn("All Groq vision models failed — falling back to HuggingFace NSFW");
        const hfResult = await checkNsfwHuggingFace(imageBase64, mimeType);
        if (hfResult !== null) {
          console.log(`HF NSFW score: ${hfResult.score.toFixed(3)}, isNsfw: ${hfResult.isNsfw}`);
          if (hfResult.isNsfw) {
            return NextResponse.json({
              approved: false,
              reason: "Rasm 18+ yoki nomaqbul kontent sifatida aniqlandi. Iltimos mos rasm tanlang.",
            });
          }
        } else {
          // Both vision and HF failed — reject for safety
          console.warn("⚠️ All image checks failed — rejecting for safety");
          return NextResponse.json({
            approved: false,
            reason: "Rasm tekshiruvida xatolik yuz berdi. Iltimos qayta urinib ko'ring.",
          });
        }
      }
    }

    // ── 5. Text moderation via Groq ───────────────────────────────────────────
    try {
      const reply = await groqChat(MODEL_TEXT, [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Check this ad text only (no image):\n${adInfo}\n\nRespond APPROVED or REJECTED: [reason in Uzbek].`,
        },
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
