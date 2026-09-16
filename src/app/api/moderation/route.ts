import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const XAI_API    = "https://api.x.ai/v1/chat/completions";
const VISION_MODEL = "grok-4.5";
const TEXT_MODEL   = "grok-3-mini";

const HF_EXPLICIT_MODEL = "https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection";
const HF_SEXY_MODEL     = "https://api-inference.huggingface.co/models/AdamCodd/vit-base-nsfw-detector";

// ══════════════════════════════════════════════════════════════════════════════
// BLOCKED KEYWORD PATTERNS  (EN + UZ + RU — instant pre-filter)
// ══════════════════════════════════════════════════════════════════════════════
const BLOCKED_PATTERNS: RegExp[] = [
  // Sex / escort / adult
  /\bsex\b/i, /\bseks\b/i, /\bporn/i, /\bparno/i,
  /\bxxx\b/i, /\bnude\b/i, /\bnudity\b/i, /\berotic/i, /\berotik/i,
  /\bescort\b/i, /\bprostit/i, /\bfahisha\b/i, /\bintim\b/i,
  /\bonlyfans\b/i, /\bstripper/i,
  // Weapons (EN)
  /\bfirearm/i, /\bammunit/i, /\bpistol\b/i, /\brevolver\b/i,
  /\brifle\b/i, /\bshotgun\b/i, /\bsniper\b/i, /\bmachine.?gun\b/i,
  /\bak.?47\b/i, /\bar.?15\b/i, /\bkalashnikov\b/i,
  /\bgrenade\b/i, /\bbomb\b/i, /\bexplosive/i, /\bdynamite\b/i,
  /\btnt\b/i, /\bc4.explo/i, /\bied\b/i, /\brpg\b/i, /\brocket.?launch/i,
  /\bsilencer\b/i, /\bbullets?.for.sale/i,
  // Weapons (UZ/RU)
  /\bqurol/i, /\bto'pponcha\b/i, /\btopponcha\b/i, /\bmiltiq\b/i,
  /\bgranata\b/i, /\bportlovchi\b/i,
  /\boruzhie\b/i, /\bvzryvchatok?\b/i, /\bpatrony\b/i,
  // Murder / kidnapping services (EN)
  /\bhitman\b/i, /\bkill.for.hire\b/i, /\bmurder.for.hire\b/i,
  /\bcontract.kill/i, /\bassassin.for.hire/i, /\bhire.a.killer\b/i,
  /\bkidnapp/i, /\babduct/i, /\bhuman.traffick/i,
  /\bslave.trade\b/i, /\bchild.traffick/i, /\bsex.traffick/i,
  // Murder / kidnapping (UZ/RU)
  /\bqotil.yolla/i, /\bkiller.yolla/i,
  /\bodam.o['']g['']irla/i, /\bodam.sotish\b/i, /\bqul.savdosi\b/i,
  /\bpohisch/i, /\btorgovlya.lyud/i,
  // Terror
  /\bterror/i, /\bjihod\b/i, /\bjihad\b/i,
  /\bnazi\b/i, /\bfascis/i, /\bgenocid/i,
  // Drugs (EN)
  /\bheroin\b/i, /\bcocaine\b/i, /\bcrack.cocaine\b/i,
  /\bmethamphetamin/i, /\bfentanyl\b/i, /\bopium\b/i, /\bopiat/i,
  /\bcannabis\b/i, /\bmarijuana\b/i, /\bmdma\b/i, /\becstasy\b/i,
  /\blsd\b/i, /\bketamine\b/i, /\bamphetamin/i,
  /\bmethadon\b/i, /\bdrug.dealer\b/i, /\bbuy.drugs?\b/i,
  // Drugs (UZ/RU)
  /\bnasha\b/i, /\bnarko/i, /\bgiyohvand/i, /\bgashish\b/i,
  /\bkokain\b/i, /\bopiy\b/i, /\bafyun\b/i, /\btramadol\b/i,
  // Violence
  /\bkill\b/i, /\bmurder\b/i, /\bviolence\b/i, /\bzoravonlik\b/i,
  /\bbeheading\b/i, /\btorture\b/i,
  // Gambling / fraud
  /\bcasino\b/i, /\bgambl/i, /\bstavka\b/i, /\bbookmaker\b/i,
  /\bhack\b/i, /\bphish/i, /\bscam\b/i, /\bcarding\b/i,
  /\bdark.web\b/i,
  // Offensive (EN)
  /\bfuck/i, /\bshit\b/i, /\bbitch\b/i, /\bcunt\b/i,
  /\bwhore\b/i, /\bslut\b/i, /\bnigg/i,
  // Offensive (UZ)
  /\bla['']nati\b/i, /\bahmoq\b/i, /\bit.bola\b/i,
  // Offensive (RU)
  /\bblya[dt]/i, /\bkhuy\b/i, /\bpizd/i, /\bmudak\b/i, /\bsuka\b/i,
];

// ══════════════════════════════════════════════════════════════════════════════
// GROK PROMPTS
// ══════════════════════════════════════════════════════════════════════════════

const TEXT_PROMPT = `You are a STRICT advertising text moderator. Default = REJECTED.

Reject if title, description, or URL text contains or implies:
- Pornography, escort, prostitution, sexual services, adult content
- Weapons (guns, knives, bombs, explosives, ammunition) for sale
- Drugs, narcotics, psychotropic substances
- Murder-for-hire, hitman, kidnapping, human trafficking services
- Terrorism, extremism, hate speech
- Profanity or offensive language
- Fraud, hacking, dark web services

Approve ONLY if it is a genuine product, business, app, or service advertisement.

Reply ONLY:
APPROVED
or
REJECTED: [reason in Uzbek, one sentence]`;

const URL_PROMPT = `You are a STRICT website URL safety checker. Default = REJECTED.

Analyze this website URL/domain. Reject if the domain or URL path strongly suggests:
- Adult/pornography site (e.g. xxx, porn, sex, nude, escort, onlyfans in domain)
- Weapons or explosives marketplace
- Drug or narcotics marketplace
- Dark web or illegal marketplace
- Scam, phishing, or malware site
- Terrorist or extremist content

Approve if it looks like a legitimate business website, app, social media, news, e-commerce, or service.

Reply ONLY:
APPROVED
or
REJECTED: [reason in Uzbek, one sentence]`;

const VISION_PROMPT = `You are an EXTREMELY STRICT image moderator for a family-friendly ad platform.
Default = REJECTED. Only approve clean professional business images.

REJECT if image contains ANY of:

NUDITY / SEXUAL:
- Bikini, swimwear, underwear, lingerie, bra, corset
- Bare skin below neckline: chest, stomach, back, shoulders, legs
- Cleavage, bare midriff, bare legs
- Revealing, tight-fitting clothing
- Suggestive or seductive pose
- Any sexualized content even if not fully nude

WEAPONS & EXPLOSIVES:
- Any gun: pistol, rifle, shotgun, machine gun, AK-47, sniper
- Any knife, dagger, sword, blade
- Bomb, grenade, landmine, TNT, C4, IED, RPG, dynamite
- Ammunition, bullets, weapon accessories

DRUGS:
- Drugs: heroin, cocaine, meth, weed, pills (drug context), syringes
- Bongs, pipes, rolling papers in drug context
- Suspicious powder or pills close-up

VIOLENCE / GORE:
- Blood, wounds, gore, injuries
- Fighting, torture, dead bodies

ILLEGAL SERVICES:
- Hitman / murder-for-hire imagery
- Kidnapping, trafficking, slavery imagery

HATE / EXTREMISM:
- Nazi symbols, hate symbols, extremist logos

APPROVE ONLY:
- Product on clean background
- Logo / icon / graphic design
- Building / office / storefront
- App or website screenshot
- Food (professional)
- Landscape / city / travel
- Text/infographic
- Fully-clothed professional (suit/uniform, no bare skin)

RULE: ANY doubt → REJECTED.

Reply ONLY:
APPROVED
or
REJECTED: [reason in Uzbek, one sentence]`;

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

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

async function xaiCall(
  model: string,
  messages: unknown[],
  timeoutMs = 15000
): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(XAI_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, temperature: 0, max_tokens: 150 }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      console.error(`xAI ${res.status}:`, (await res.text()).slice(0, 200));
      return null;
    }
    const data = await res.json();
    return (data.choices?.[0]?.message?.content || "")
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .trim() || null;
  } catch (e: any) {
    console.warn("xAI call error:", e?.message?.slice(0, 100));
    return null;
  }
}

// Parse APPROVED / REJECTED from Grok response
function parseVerdict(
  reply: string | null,
  fallbackReason: string
): { approved: boolean; reason?: string } | null {
  if (!reply) return null;
  if (/REJECTED/i.test(reply)) {
    const m = reply.match(/REJECTED:?\s*(.+)/i);
    return { approved: false, reason: m?.[1]?.trim() || fallbackReason };
  }
  if (/APPROVED/i.test(reply)) return { approved: true };
  // Ambiguous response → safe default = reject
  console.warn("Ambiguous Grok response:", reply.slice(0, 100));
  return { approved: false, reason: fallbackReason };
}

async function hfScore(
  modelUrl: string,
  imageBase64: string,
  mimeType: string,
  label: string
): Promise<number | null> {
  try {
    const body = Buffer.from(imageBase64, "base64");
    const headers: Record<string, string> = { "Content-Type": mimeType };
    if (process.env.HF_TOKEN) headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
    let res = await fetch(modelUrl, { method: "POST", headers, body, signal: AbortSignal.timeout(8000) });
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 8000));
      res = await fetch(modelUrl, { method: "POST", headers, body, signal: AbortSignal.timeout(10000) });
    }
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data.find((d: { label: string; score: number }) => d.label === label)?.score ?? null;
  } catch { return null; }
}

// ══════════════════════════════════════════════════════════════════════════════
// THREE SEPARATE GROK CHECKS
// ══════════════════════════════════════════════════════════════════════════════

/** CHECK 1 — Text: title + description */
async function grokCheckText(title: string, description: string): Promise<{ approved: boolean; reason?: string } | null> {
  const reply = await xaiCall(TEXT_MODEL, [
    { role: "system", content: TEXT_PROMPT },
    {
      role: "user",
      content:
        `Ad Title: "${title}"\n` +
        `Ad Description: "${description || "(none)"}"\n\n` +
        `Does this text contain or advertise anything inappropriate (porn, weapons, drugs, murder, kidnapping, profanity)?`,
    },
  ], 10000);
  return parseVerdict(reply, "Sarlavha yoki tavsif noqonuniy yoki nomaqbul kontent o'z ichiga oladi");
}

/** CHECK 2 — URL domain & path analysis */
async function grokCheckUrl(url: string): Promise<{ approved: boolean; reason?: string } | null> {
  const reply = await xaiCall(TEXT_MODEL, [
    { role: "system", content: URL_PROMPT },
    {
      role: "user",
      content:
        `Website URL to analyze: ${url}\n\n` +
        `Does this URL/domain look like it hosts pornography, weapons sales, drugs, illegal services, or scam content?`,
    },
  ], 10000);
  return parseVerdict(reply, "Veb-sayt URL manzili shubhali yoki nomaqbul kontent bilan bog'liq ko'rinmoqda");
}

/** CHECK 3 — Image vision (with 1 retry) */
async function grokCheckImage(
  imageBase64: string,
  mimeType: string,
  title: string
): Promise<{ approved: boolean; reason?: string } | null> {
  const imgContent = {
    type: "image_url" as const,
    image_url: { url: `data:${mimeType};base64,${imageBase64}` },
  };
  const userMsg = [
    imgContent,
    {
      type: "text" as const,
      text:
        `Ad title: "${title}"\n\n` +
        `Examine this image step by step:\n` +
        `Step 1: Describe what you see — people, clothing, objects, text, setting.\n` +
        `Step 2: Check for: bare skin/bikini/swimwear, any weapon (gun/knife/bomb), drugs/syringes, blood/violence, hate symbols.\n` +
        `Step 3: Give your verdict.\n\n` +
        `Remember: bare skin below collar = REJECTED. Any weapon = REJECTED. Any drug = REJECTED. Doubt = REJECTED.`,
    },
  ];
  const messages = [
    { role: "system", content: VISION_PROMPT },
    { role: "user", content: userMsg },
  ];

  // First attempt
  let reply = await xaiCall(VISION_MODEL, messages, 18000);
  if (reply) {
    console.log("Grok vision reply:", reply.slice(0, 250));
    return parseVerdict(reply, "Rasm moderatsiya talablariga javob bermadi");
  }

  // Retry once after 3 seconds
  console.warn("Grok vision failed — retrying in 3s...");
  await new Promise((r) => setTimeout(r, 3000));
  reply = await xaiCall(VISION_MODEL, messages, 18000);
  if (reply) {
    console.log("Grok vision retry reply:", reply.slice(0, 250));
    return parseVerdict(reply, "Rasm moderatsiya talablariga javob bermadi");
  }

  // Both attempts failed → null (caller will reject for safety)
  console.error("Grok vision: both attempts failed");
  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  let xaiTextStatus = "not_tested";
  let xaiVisionStatus = "not_tested";
  let xaiError = "";
  const availableModels: string[] = [];

  if (process.env.XAI_API_KEY) {
    // Test text model
    try {
      const textRes = await fetch(XAI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.XAI_API_KEY}` },
        body: JSON.stringify({ model: TEXT_MODEL, messages: [{ role: "user", content: "Reply: OK" }], max_tokens: 5 }),
        signal: AbortSignal.timeout(8000),
      });
      xaiTextStatus = textRes.ok ? "ok" : `error_${textRes.status}`;
      if (!textRes.ok) xaiError = (await textRes.text()).slice(0, 200);
    } catch (e: any) { xaiTextStatus = `timeout_or_error: ${e?.message?.slice(0, 80)}`; }

    // List available models
    try {
      const modelsRes = await fetch("https://api.x.ai/v1/models", {
        headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
        signal: AbortSignal.timeout(8000),
      });
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        availableModels.push(...(modelsData.data || []).map((m: { id: string }) => m.id));
      }
    } catch {}

    // Test vision model
    try {
      const pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";
      const visionRes = await fetch(XAI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.XAI_API_KEY}` },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [{ role: "user", content: [
            { type: "image_url", image_url: { url: `data:image/png;base64,${pixel}` } },
            { type: "text", text: "What color? One word." },
          ]}],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(12000),
      });
      xaiVisionStatus = visionRes.ok ? "ok" : `error_${visionRes.status}`;
      if (!visionRes.ok) xaiError = (await visionRes.text()).slice(0, 200);
    } catch (e: any) { xaiVisionStatus = `timeout_or_error: ${e?.message?.slice(0, 80)}`; }
  }

  return NextResponse.json({
    ok: true,
    models: { text: TEXT_MODEL, vision: VISION_MODEL },
    xai_key: !!process.env.XAI_API_KEY,
    xai_text: xaiTextStatus,
    xai_vision: xaiVisionStatus,
    xai_error: xaiError || undefined,
    hf_token: !!process.env.HF_TOKEN,
    available_models: availableModels.length > 0 ? availableModels : undefined,
  });
}

export async function POST(req: NextRequest) {
  if (!hasValidToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string; description?: string; destinationURL?: string;
    imageBase64?: string; mimeType?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, destinationURL, imageBase64, mimeType } = body;
  if (!title || !destinationURL) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ── STEP 1: Keyword pre-filter ────────────────────────────────────────────
  const allText = [title, description, destinationURL].filter(Boolean).join(" ");
  for (const p of BLOCKED_PATTERNS) {
    if (p.test(allText)) {
      return NextResponse.json({
        approved: false,
        reason: "Sarlavha, tavsif yoki URL taqiqlangan so'z yoki xizmat turini o'z ichiga oladi.",
      });
    }
  }

  // ── STEPS 2+3: Grok text + URL (parallel) ────────────────────────────────
  const [textResult, urlResult] = await Promise.all([
    grokCheckText(title, description || ""),
    grokCheckUrl(destinationURL),
  ]);
  if (textResult !== null && !textResult.approved) {
    return NextResponse.json({ approved: false, reason: textResult.reason });
  }
  if (urlResult !== null && !urlResult.approved) {
    return NextResponse.json({ approved: false, reason: urlResult.reason });
  }
  // Track whether AI text checks ran (for image fallback decision)
  const textAiRan = textResult !== null || urlResult !== null;

  // ── STEP 4: URL availability ──────────────────────────────────────────────
  try {
    const urlCheck = await fetch(destinationURL, {
      method: "HEAD",
      signal: AbortSignal.timeout(2500),
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

  // ── STEP 5: Image moderation ──────────────────────────────────────────────
  if (imageBase64 && mimeType) {
    // Run all 3 image checks in parallel
    const [visionResult, hfExplicitScore, hfSexyData] = await Promise.all([
      grokCheckImage(imageBase64, mimeType, title),
      hfScore(HF_EXPLICIT_MODEL, imageBase64, mimeType, "nsfw"),
      (async () => {
        const body = Buffer.from(imageBase64, "base64");
        const headers: Record<string, string> = { "Content-Type": mimeType };
        if (process.env.HF_TOKEN) headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
        try {
          let res = await fetch(HF_SEXY_MODEL, { method: "POST", headers, body, signal: AbortSignal.timeout(8000) });
          if (res.status === 503) {
            await new Promise((r) => setTimeout(r, 8000));
            res = await fetch(HF_SEXY_MODEL, { method: "POST", headers, body, signal: AbortSignal.timeout(10000) });
          }
          if (!res.ok) return null;
          const data = await res.json();
          if (!Array.isArray(data)) return null;
          const sexy = data.find((d: { label: string; score: number }) => d.label === "sexy")?.score ?? 0;
          const porn = data.find((d: { label: string; score: number }) => d.label === "porn")?.score ?? 0;
          console.log(`HF sexy: ${sexy.toFixed(3)}, porn: ${porn.toFixed(3)}`);
          return { sexy, porn, flagged: sexy > 0.20 || porn > 0.15 };
        } catch { return null; }
      })(),
    ]);

    console.log(
      `Image checks — vision: ${JSON.stringify(visionResult)}, ` +
      `hfExplicit: ${hfExplicitScore?.toFixed(3) ?? "null"}, ` +
      `hfSexy: ${JSON.stringify(hfSexyData)}`
    );

    // 5b. HF sexy detector — always check (bikini / revealing clothing)
    if (hfSexyData?.flagged) {
      return NextResponse.json({
        approved: false,
        reason: "Rasm yarimochar kiyimli yoki uyatsiz kontent sifatida aniqlandi. Biznes reklamaga mos rasm tanlang.",
      });
    }

    // 5c. HF explicit NSFW — always check
    if (hfExplicitScore !== null && hfExplicitScore > 0.20) {
      return NextResponse.json({
        approved: false,
        reason: "Rasm 18+ yoki pornografik kontent sifatida aniqlandi. Mos rasm tanlang.",
      });
    }

    // 5a. Grok vision result
    if (visionResult === null) {
      // Grok Vision API unavailable.
      const hfRan = hfSexyData !== null || hfExplicitScore !== null;
      if (hfRan) {
        // HF ran and didn't flag anything → approve via HF fallback only
        console.warn("Grok vision unavailable — approved via HF fallback");
      } else {
        // All image checks failed — cannot validate image content via text checks alone.
        // Reject for safety regardless of text/URL results.
        console.error("All image checks failed — rejecting for safety");
        return NextResponse.json({
          approved: false,
          reason: "Rasm tekshiruvi vaqtincha ishlamayapti. Bir necha daqiqadan keyin qayta urinib ko'ring.",
        });
      }
    } else if (!visionResult.approved) {
      return NextResponse.json({ approved: false, reason: visionResult.reason });
    }
  }

  // All checks passed
  return NextResponse.json({ approved: true });
}
