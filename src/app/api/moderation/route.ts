import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const XAI_API = "https://api.x.ai/v1/chat/completions";

const VISION_MODELS = ["grok-2-vision-1212"];
const MODEL_TEXT = "grok-3-mini";

// HF model 1: explicit NSFW (porn)
const HF_EXPLICIT_MODEL = "https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection";
// HF model 2: 5-category classifier — catches "sexy" (bikini, revealing clothing)
const HF_SEXY_MODEL = "https://api-inference.huggingface.co/models/AdamCodd/vit-base-nsfw-detector";

// ── Blocked keyword patterns ──────────────────────────────────────────────────
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

GAMBLING / FRAUD:
- Casino imagery, betting, fake products, deceptive imagery

APPROVE ONLY when the image clearly shows:
- A product on a plain or neutral background
- A logo, icon, or graphic design
- A building, office, or storefront
- A screenshot of an app or website
- Food presented professionally
- A landscape, city, or travel destination
- Text-only or infographic content
- Fully-clothed professionals in formal business attire (suit/uniform, no skin below collar)

RULE: If there is ANY doubt — respond REJECTED.

RESPONSE: Reply with ONLY one of these two formats:
APPROVED
or
REJECTED: [one sentence reason in Uzbek]`;

function domainBlocked(url: string): string | null {
  try {
    const h = new URL(url).hostname.toLowerCase();
    for (const p of BLOCKED_PATTERNS) if (p.test(h)) return `Sayt domeni taqiqlangan: ${h}`;
  } catch { return "URL formati noto'g'ri"; }
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
  } catch { return false; }
}

async function xaiChat(model: string, messages: any[], timeoutMs = 12000): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return "";
  const res = await fetch(XAI_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0, max_tokens: 200 }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`xAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content?.trim() || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// ── Grok Vision check ─────────────────────────────────────────────────────────
async function checkVision(
  imageBase64: string, mimeType: string, imageURL: string | undefined, adInfo: string
): Promise<{ approved: boolean; reason?: string } | null> {
  if (!process.env.XAI_API_KEY) return null;

  // Always use base64 for reliability (don't rely on external URL fetch)
  const imgContent = {
    type: "image_url" as const,
    image_url: { url: `data:${mimeType};base64,${imageBase64}` },
  };

  const userPrompt =
    `Examine this image very carefully:\n${adInfo}\n\n` +
    `Step 1: Describe what you see in the image (person/object/scene, clothing details, pose).\n` +
    `Step 2: Check for: bare skin, bikini, swimwear, underwear, revealing clothing, suggestive pose, ` +
    `weapons, blood, drugs, hate symbols.\n` +
    `Step 3: Respond APPROVED or REJECTED based on the rules.\n\n` +
    `Remember: ANY bare skin below the collar = REJECTED. Bikini = REJECTED. Swimwear = REJECTED.`;

  for (const model of VISION_MODELS) {
    try {
      const reply = await xaiChat(model, [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: [imgContent, { type: "text", text: userPrompt }] },
      ], 15000);

      if (!reply) continue;
      console.log(`xAI vision [${model}]: ${reply.slice(0, 300)}`);

      // Check if REJECTED appears anywhere in the response (model might explain then conclude)
      if (/REJECTED/i.test(reply)) {
        const match = reply.match(/REJECTED:?\s*(.+)/i);
        const reason = match?.[1]?.trim() || "Rasm moderatsiya talablariga javob bermadi";
        return { approved: false, reason };
      }
      if (/APPROVED/i.test(reply)) return { approved: true };

      // Ambiguous — reject for safety
      console.warn(`Vision ambiguous response — REJECTED for safety`);
      return { approved: false, reason: "Rasm tekshiruvidan noaniq natija — boshqa rasm tanlang" };
    } catch (e: any) {
      console.warn(`xAI vision ${model} error: ${e?.message?.slice(0, 150)}`);
    }
  }
  return null;
}

// ── HF model 1: Falconsai explicit NSFW ──────────────────────────────────────
async function checkHfExplicit(
  imageBase64: string, mimeType: string
): Promise<{ flagged: boolean; score: number } | null> {
  try {
    const body = Buffer.from(imageBase64, "base64");
    const headers: Record<string, string> = { "Content-Type": mimeType };
    if (process.env.HF_TOKEN) headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;

    let res = await fetch(HF_EXPLICIT_MODEL, { method: "POST", headers, body, signal: AbortSignal.timeout(5000) });
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 12000));
      res = await fetch(HF_EXPLICIT_MODEL, { method: "POST", headers, body, signal: AbortSignal.timeout(7000) });
    }
    if (!res.ok) { console.warn("HF explicit failed:", res.status); return null; }
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    const score = data.find((d: any) => d.label === "nsfw")?.score ?? 0;
    console.log(`HF explicit NSFW score: ${score.toFixed(3)}`);
    return { flagged: score > 0.35, score };
  } catch (e: any) {
    console.warn("HF explicit error:", e?.message?.slice(0, 80));
    return null;
  }
}

// ── HF model 2: AdamCodd sexy/porn detector ───────────────────────────────────
// Labels: drawings | hentai | neutral | porn | sexy
// "sexy" catches bikini, revealing clothing, suggestive poses
async function checkHfSexy(
  imageBase64: string, mimeType: string
): Promise<{ flagged: boolean; sexy: number; porn: number } | null> {
  try {
    const body = Buffer.from(imageBase64, "base64");
    const headers: Record<string, string> = { "Content-Type": mimeType };
    if (process.env.HF_TOKEN) headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;

    let res = await fetch(HF_SEXY_MODEL, { method: "POST", headers, body, signal: AbortSignal.timeout(5000) });
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 12000));
      res = await fetch(HF_SEXY_MODEL, { method: "POST", headers, body, signal: AbortSignal.timeout(7000) });
    }
    if (!res.ok) { console.warn("HF sexy failed:", res.status); return null; }
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    const sexy = data.find((d: any) => d.label === "sexy")?.score ?? 0;
    const porn = data.find((d: any) => d.label === "porn")?.score ?? 0;
    console.log(`HF sexy score: ${sexy.toFixed(3)}, porn: ${porn.toFixed(3)}`);

    // Reject if "sexy" > 0.30 OR "porn" > 0.25
    return { flagged: sexy > 0.30 || porn > 0.25, sexy, porn };
  } catch (e: any) {
    console.warn("HF sexy error:", e?.message?.slice(0, 80));
    return null;
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    strategy: "xAI Grok Vision + HF Falconsai (explicit) + HF AdamCodd (sexy) — all 3 in parallel",
    vision_models: VISION_MODELS,
    hf_models: [HF_EXPLICIT_MODEL, HF_SEXY_MODEL],
    xai_key: !!process.env.XAI_API_KEY,
    hf_token: !!process.env.HF_TOKEN,
  });
}

export async function POST(req: NextRequest) {
  if (!hasValidToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, destinationURL, imageBase64, mimeType, imageURL } = body as {
      title?: string; description?: string; destinationURL?: string;
      imageBase64?: string; mimeType?: string; imageURL?: string;
    };

    if (!title || !destinationURL) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // ── 1. Keyword / domain check ─────────────────────────────────────────────
    const domainErr = domainBlocked(destinationURL);
    if (domainErr) return NextResponse.json({ approved: false, reason: domainErr });

    const allText = [title, description, destinationURL].filter(Boolean).join(" ");
    for (const p of BLOCKED_PATTERNS) {
      if (p.test(allText)) return NextResponse.json({ approved: false, reason: "Sarlavha yoki tavsifda taqiqlangan so'z aniqlandi" });
    }

    // ── 2. URL availability check ─────────────────────────────────────────────
    try {
      const urlCheck = await fetch(destinationURL, { method: "HEAD", signal: AbortSignal.timeout(2000), redirect: "follow" });
      if (!urlCheck.ok && urlCheck.status !== 405 && urlCheck.status !== 403) {
        return NextResponse.json({ approved: false, reason: `Sayt ishlamayapti (${urlCheck.status}). To'g'ri URL kiriting.` });
      }
    } catch {
      return NextResponse.json({ approved: false, reason: "URL manzilga ulanib bo'lmadi. Saytni tekshiring." });
    }

    const hasImage = !!(imageBase64 && mimeType);
    const adInfo = `Title: "${title}"\nDescription: "${description || "(none)"}"\nURL: ${destinationURL}`;

    // ── 3. Image moderation — 3 checks in parallel ────────────────────────────
    if (hasImage) {
      const [visionResult, hfExplicit, hfSexy] = await Promise.all([
        checkVision(imageBase64, mimeType, imageURL, adInfo),
        checkHfExplicit(imageBase64, mimeType),
        checkHfSexy(imageBase64, mimeType),
      ]);

      console.log(`Image check results — vision: ${JSON.stringify(visionResult)}, explicit: ${JSON.stringify(hfExplicit)}, sexy: ${JSON.stringify(hfSexy)}`);

      // HF sexy model (bikini/revealing clothing) — highest priority
      if (hfSexy?.flagged) {
        return NextResponse.json({
          approved: false,
          reason: "Rasm uyatsiz, bikini yoki yarimochar kiyimli shaxsni aks ettirmoqda. Biznes reklamaga mos rasm tanlang.",
        });
      }

      // HF explicit model (pornographic)
      if (hfExplicit?.flagged) {
        return NextResponse.json({
          approved: false,
          reason: "Rasm 18+ yoki nomaqbul kontent sifatida aniqlandi. Iltimos mos rasm tanlang.",
        });
      }

      // xAI Grok Vision
      if (visionResult !== null && !visionResult.approved) {
        return NextResponse.json({ approved: false, reason: visionResult.reason });
      }

      // All 3 failed to respond → reject for safety
      if (visionResult === null && hfExplicit === null && hfSexy === null) {
        console.warn("⚠️ All 3 image checks failed — rejecting for safety");
        return NextResponse.json({ approved: false, reason: "Rasm tekshiruvida xatolik yuz berdi. Qayta urinib ko'ring." });
      }
    }

    // ── 4. Text moderation ────────────────────────────────────────────────────
    if (process.env.XAI_API_KEY) {
      try {
        const reply = await xaiChat(MODEL_TEXT, [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Check this ad text (no image):\n${adInfo}\n\nRespond APPROVED or REJECTED: [reason in Uzbek].` },
        ], 8000);

        if (/REJECTED/i.test(reply)) {
          const match = reply.match(/REJECTED:?\s*(.+)/i);
          const reason = match?.[1]?.trim() || "Moderatsiyadan o'tmadi";
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
