import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

const VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
];

const MODEL_TEXT = "llama-3.3-70b-versatile";

const HF_NSFW_MODEL = "https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection";

// ── Blocked keyword patterns (EN + UZ + RU) ──────────────────────────────────
const BLOCKED_PATTERNS = [
  /\bsex\b/i, /\bseks\b/i, /\bporn\b/i, /\bporno\b/i, /\bparno\b/i,
  /\bxxx\b/i, /\bnude\b/i, /\bnudity\b/i, /\berotic\b/i, /\berotik\b/i,
  /\bescort\b/i, /\bprostit/i, /\bfahisha\b/i, /\bintim\b/i,
  /\bonlyfans\b/i, /\badult.content\b/i,
  /\bterror/i, /\bjihod\b/i, /\bjihad\b/i, /\bbomb\b/i, /\bexplosive\b/i,
  /\bqurol\b/i, /\boruzhie\b/i, /\bweapon\b/i,
  /\bgun(s)?\b/i, /\brifle\b/i, /\bpistol\b/i, /\bfirearm\b/i,
  /\bknife\b/i, /\bblade\b/i, /\bsword\b/i,
  /\bkill\b/i, /\bmurder\b/i, /\bviolence\b/i, /\bzoravonlik\b/i,
  /\bassassinat/i, /\bexecution\b/i,
  /\bdrug\b/i, /\bnasha\b/i, /\bweed\b/i, /\bheroin\b/i, /\bkokain\b/i,
  /\bcocaine\b/i, /\bnarko/i, /\bgashish\b/i, /\bcannabis\b/i,
  /\bmarijuana\b/i, /\bmeth\b/i, /\bfentanyl\b/i, /\bopium\b/i,
  /\bcasino\b/i, /\bgambl/i, /\bbet(ting)?\b/i, /\bstavka\b/i,
  /\bpoker\b/i, /\bslot.machine\b/i,
  /\bhack\b/i, /\bpirat/i, /\bphish/i, /\bscam\b/i,
  /\bfake.id\b/i, /\bcounterfeit\b/i,
  /\bviagra\b/i, /\bcialis\b/i, /\bsteroid\b/i,
  /\bnazi\b/i, /\bfascis/i, /\bwhite.suprem/i, /\bhatred\b/i,
];

// Ultra-strict system prompt — err on the side of rejection
const SYSTEM_PROMPT = `You are an extremely strict advertising content moderator for a family-friendly platform.
Your default is REJECTED. Only approve clearly professional business content.

REJECT immediately if the image contains ANY of the following:

BODY / CLOTHING:
- Any person showing skin below the neckline (chest, stomach, back, shoulders, legs, arms if bare)
- Bikini, swimwear, underwear, lingerie, bra, corset, crop top, tank top, shorts, miniskirt
- Tight-fitting or revealing clothing of any kind
- Cleavage, bare midriff, bare legs, bare shoulders visible
- Provocative, seductive, or suggestive poses or facial expressions
- Models or influencer-style photos where physical appearance is the focus
- Any sexualized imagery even if not fully nude

VIOLENCE / WEAPONS:
- Blood, wounds, gore, injuries
- Guns, knives, swords, explosives, weapons of any kind
- Fighting, hitting, threatening gestures

DRUGS / SUBSTANCES:
- Drugs, pills, syringes, cigarettes, alcohol prominently featured

HATE / EXTREMISM:
- Hate symbols, extremist imagery, offensive gestures

GAMBLING:
- Casino imagery, cards, dice, betting

FRAUD:
- Fake products, deceptive imagery

APPROVE ONLY when the image clearly shows:
- A product on a plain or neutral background
- A logo, icon, or graphic design
- A building, office, or storefront (exterior/interior)
- A screenshot of an app or website
- Food presented professionally
- A landscape, city, or travel destination
- Text-only or infographic content
- Professional service illustration (no people, or fully-clothed professionals in formal/business attire only)

RULE: If there is ANY doubt — any skin showing, any suggestive element, any inappropriate content — respond REJECTED.
A business ad does NOT need to show a person's body. If a person is shown, they must be in full professional attire (suit, formal wear, uniform) with no skin visible below the collar.

RESPONSE: Reply with ONLY one of these two:
APPROVED
or
REJECTED: [one sentence reason in Uzbek]`;

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

async function groqChat(model: string, messages: any[], timeoutMs = 12000): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "";
  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0, max_tokens: 200 }),
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

// Returns: { approved, reason } | null (if all models failed)
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
    `Examine this image very carefully:\n${adInfo}\n\n` +
    `Look specifically for: any bare skin (chest, stomach, shoulders, legs), bikini, swimwear, underwear, ` +
    `revealing or tight clothing, suggestive poses, weapons, blood, drugs, hate symbols.\n` +
    `If ANY of these are present, respond REJECTED.\n` +
    `Only respond APPROVED if the image is clearly professional business content with no people, ` +
    `or only fully-clothed people in formal attire.`;

  for (const model of VISION_MODELS) {
    try {
      const reply = await groqChat(model, [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: [imgContent, { type: "text", text: userPrompt }] },
      ], 15000);

      if (!reply) continue;

      console.log(`Groq vision [${model}] response: ${reply.slice(0, 200)}`);

      if (reply.toUpperCase().startsWith("REJECTED")) {
        const reason = reply.replace(/^REJECTED:?\s*/i, "").trim()
          || "Rasm moderatsiya talablariga javob bermadi";
        return { approved: false, reason };
      }
      if (reply.toUpperCase().startsWith("APPROVED")) {
        return { approved: true };
      }
      // Ambiguous response — treat as rejection for safety
      console.warn(`Vision model ${model} gave ambiguous response — treating as REJECTED`);
      return { approved: false, reason: "Rasm tekshiruvidan noaniq natija — qayta urinib ko'ring" };
    } catch (e: any) {
      console.warn(`Groq vision ${model} failed: ${e?.message?.slice(0, 150)}`);
    }
  }
  return null; // all models failed/unavailable
}

// Returns: { isNsfw, score } | null (if check failed)
async function checkNsfwHuggingFace(
  imageBase64: string,
  mimeType: string
): Promise<{ isNsfw: boolean; score: number } | null> {
  try {
    const binaryData = Buffer.from(imageBase64, "base64");
    const headers: Record<string, string> = { "Content-Type": mimeType };
    if (process.env.HF_TOKEN) headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;

    const tryFetch = async (timeoutMs: number) => {
      const res = await fetch(HF_NSFW_MODEL, {
        method: "POST", headers, body: binaryData,
        signal: AbortSignal.timeout(timeoutMs),
      });
      return res;
    };

    let res = await tryFetch(5000);
    if (res.status === 503) {
      console.log("HF NSFW: model loading, waiting 16s...");
      await new Promise((r) => setTimeout(r, 16000));
      res = await tryFetch(7000);
    }

    if (!res.ok) { console.warn("HF NSFW failed:", res.status); return null; }
    const data = await res.json();
    if (!Array.isArray(data)) { console.warn("HF NSFW unexpected:", data); return null; }

    const score = data.find((d: any) => d.label === "nsfw")?.score ?? 0;
    console.log(`HF NSFW score: ${score.toFixed(3)}`);
    // Threshold 0.40 — stricter than before (was 0.65)
    return { isNsfw: score > 0.40, score };
  } catch (e: any) {
    console.warn("HF NSFW error:", e?.message?.slice(0, 100));
    return null;
  }
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
      strategy: "Groq vision + HF NSFW in parallel (both must pass)",
      vision_models_configured: VISION_MODELS,
      hf_token: !!process.env.HF_TOKEN,
      groq_models_available: allIds.filter((id) =>
        id.includes("vision") || id.includes("llama-4") || id.includes("scout") || id.includes("maverick")
      ),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
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

    // ── 1. Keyword / domain check ─────────────────────────────────────────────
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

    const hasImage = !!(imageBase64 && mimeType);
    const adInfo = `Title: "${title}"\nDescription: "${description || "(none)"}"\nURL: ${destinationURL}`;

    // ── 3. Image moderation — Groq vision AND HF NSFW run in parallel ─────────
    if (hasImage && process.env.GROQ_API_KEY) {
      const [visionResult, hfResult] = await Promise.all([
        checkImageWithGroqVision(imageBase64, mimeType, imageURL, adInfo),
        checkNsfwHuggingFace(imageBase64, mimeType),
      ]);

      // HF NSFW — if it says NSFW, reject immediately regardless of vision
      if (hfResult !== null && hfResult.isNsfw) {
        return NextResponse.json({
          approved: false,
          reason: "Rasm uyatsiz yoki 18+ kontent sifatida aniqlandi. Iltimos mos rasm tanlang.",
        });
      }

      // Groq vision — if it rejected, reject immediately
      if (visionResult !== null && !visionResult.approved) {
        return NextResponse.json({ approved: false, reason: visionResult.reason });
      }

      // If BOTH checks succeeded and approved → continue to text check
      // If vision failed (returned null) AND HF didn't catch it → reject for safety
      if (visionResult === null && hfResult === null) {
        console.warn("⚠️ All image checks failed — rejecting for safety");
        return NextResponse.json({
          approved: false,
          reason: "Rasm tekshiruvida xatolik yuz berdi. Iltimos qayta urinib ko'ring.",
        });
      }

      // If only HF ran (vision null) and HF approved (score low) — still proceed
      // If only vision ran (HF null) and vision approved — still proceed
    } else if (hasImage && !process.env.GROQ_API_KEY) {
      // No Groq — use HF only
      const hfResult = await checkNsfwHuggingFace(imageBase64, mimeType);
      if (hfResult === null) {
        return NextResponse.json({
          approved: false,
          reason: "Rasm tekshiruvida xatolik yuz berdi. Qayta urinib ko'ring.",
        });
      }
      if (hfResult.isNsfw) {
        return NextResponse.json({
          approved: false,
          reason: "Rasm uyatsiz yoki 18+ kontent sifatida aniqlandi. Iltimos mos rasm tanlang.",
        });
      }
    }

    // ── 4. Text moderation via Groq ───────────────────────────────────────────
    if (process.env.GROQ_API_KEY) {
      try {
        const reply = await groqChat(MODEL_TEXT, [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Check this ad text (no image):\n${adInfo}\n\nRespond APPROVED or REJECTED: [reason in Uzbek].`,
          },
        ], 8000);

        if (reply.toUpperCase().startsWith("REJECTED")) {
          const reason = reply.replace(/^REJECTED:?\s*/i, "").trim() || "Moderatsiyadan o'tmadi";
          return NextResponse.json({ approved: false, reason });
        }
      } catch (e: any) {
        console.warn("Text check failed:", e?.message);
      }
    }

    return NextResponse.json({ approved: true });
  } catch (err: any) {
    console.error("Moderation error:", err?.message);
    return NextResponse.json({ approved: false, reason: "Moderatsiya xatosi. Qayta urinib ko'ring." });
  }
}
