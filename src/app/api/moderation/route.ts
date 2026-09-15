import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const XAI_API = "https://api.x.ai/v1/chat/completions";
const VISION_MODELS = ["grok-2-vision-1212"];
const MODEL_TEXT = "grok-3-mini";

const HF_EXPLICIT_MODEL = "https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection";
const HF_SEXY_MODEL     = "https://api-inference.huggingface.co/models/AdamCodd/vit-base-nsfw-detector";

// ══════════════════════════════════════════════════════════════════════════════
// BLOCKED KEYWORD PATTERNS  (EN + UZ + RU, case-insensitive)
// ══════════════════════════════════════════════════════════════════════════════
const BLOCKED_PATTERNS: RegExp[] = [
  // ── Sex / escort / adult ──────────────────────────────────────────────────
  /\bsex\b/i, /\bseks\b/i, /\bporn\b/i, /\bporno\b/i, /\bparno\b/i,
  /\bxxx\b/i, /\bnude\b/i, /\bnudity\b/i, /\berotic\b/i, /\berotik\b/i,
  /\bescort\b/i, /\bprostit/i, /\bfahisha\b/i, /\bintim\b/i,
  /\bonlyfans\b/i, /\badult.content\b/i, /\bstrippers?\b/i,
  /\blove.making\b/i, /\bkamera.yashirin\b/i,

  // ── Weapons & explosives (EN) ─────────────────────────────────────────────
  /\bweapon/i, /\bfirearm/i, /\bammunit/i, /\bballistic/i,
  /\bpistol\b/i, /\brevolver\b/i, /\bhandgun\b/i, /\brifle\b/i,
  /\bshotgun\b/i, /\bsniper\b/i, /\bmachine.?gun\b/i,
  /\bak[-\s]?47\b/i, /\bar[-\s]?15\b/i, /\bkalashnikov\b/i,
  /\bgrenade\b/i, /\blandmine\b/i, /\bmine\b.*\bexplo/i,
  /\bbomb\b/i, /\bexplosive/i, /\bdynamite\b/i, /\btnt\b/i,
  /\bc4\b/i, /\bied\b/i, /\brpg\b/i, /\brocket.?launcher\b/i,
  /\bknife.for.sale\b/i, /\bblade.for.sale\b/i, /\bsword\b/i,
  /\bsilencer\b/i, /\bsuppressor\b/i, /\bholster\b/i,
  /\bbullet(s)?\b/i, /\bcartridge\b/i, /\bmagazine.rounds?\b/i,

  // ── Weapons & explosives (UZ) ─────────────────────────────────────────────
  /\bqurol/i, /\bqurollar/i, /\bqurol-yarog/i,
  /\bto'pponcha\b/i, /\btopponcha\b/i, /\bmiltiq\b/i,
  /\bgranata\b/i, /\bbomba\b/i, /\bportlovchi\b/i,
  /\bspetsnaznaz\b/i, /\bpichoq.sotamiz\b/i,

  // ── Weapons & explosives (RU) ─────────────────────────────────────────────
  /\boruzhie\b/i, /\bpistol[ey]t\b/i, /\bavtomat\b.*\bprodazh/i,
  /\bvzryvchatok?a\b/i, /\bvzryvnoe\b/i, /\bpatrony\b/i,
  /\bpulemet\b/i, /\bgranat[ay]\b/i, /\bmin[ay]\b.*\bvzryv/i,

  // ── Murder / kidnapping / trafficking services (EN) ───────────────────────
  /\bhitman\b/i, /\bhit.man\b/i, /\bkill.for.hire\b/i,
  /\bmurder.for.hire\b/i, /\bcontract.kill/i, /\bcontract.murder/i,
  /\bassassin.for.hire\b/i, /\bhire.a.killer\b/i,
  /\bkidnapp/i, /\babduct/i, /\bhuman.traffick/i,
  /\bslave.trade\b/i, /\bchild.traffick/i, /\bsex.traffick/i,
  /\bforced.labor\b/i, /\bsnuff\b/i,

  // ── Murder / kidnapping / trafficking services (UZ) ───────────────────────
  /\bqotil.yolla/i, /\bqotil.topamiz\b/i,
  /\bodam.o['']g['']irla/i, /\bodam.o['']g['']irla/i,
  /\bkiller.yolla/i, /\bkiller.topamiz\b/i,
  /\bodam.sotish\b/i, /\bqul.bozori\b/i, /\bqul.savdosi\b/i,
  /\bbola.sotish\b/i, /\bol[iy]b.keting\b/i,
  /\bqorakori\b/i, /\bqotillik.xizmat/i,

  // ── Murder / kidnapping (RU) ──────────────────────────────────────────────
  /\bukillyu\b/i, /\bubiyca.naymit\b/i, /\bukillyu.za.dengi\b/i,
  /\bkiller.naem/i, /\bpohisch/i, /\btorgovlya.lyud/i,
  /\brabotorgovlya\b/i,

  // ── Terror / extremism ────────────────────────────────────────────────────
  /\bterror/i, /\bjihod\b/i, /\bjihad\b/i, /\bextremis/i,
  /\bmasjid.bomb/i, /\bkiller.squad\b/i,
  /\bnazi\b/i, /\bfascis/i, /\bwhite.suprem/i, /\bhatred\b/i,
  /\bgenocid/i, /\bethnic.cleansing\b/i,

  // ── Drugs & narcotics (EN) ────────────────────────────────────────────────
  /\bdrug(s)?\b/i, /\bweed\b/i, /\bheroin\b/i, /\bcocaine\b/i,
  /\bcrack.cocaine\b/i, /\bmeth\b/i, /\bmethamphetamin/i,
  /\bfentanyl\b/i, /\bopium\b/i, /\bopiat/i, /\bmorphin/i,
  /\bkodein\b/i, /\bcodeine\b/i, /\bkrokodil\b/i,
  /\bcannabis\b/i, /\bmarijuana\b/i, /\bblunt\b/i,
  /\bmdma\b/i, /\becstasy\b/i, /\bextasi\b/i,
  /\blsd\b/i, /\bacid.tabs\b/i, /\bketamine\b/i,
  /\bamphetamin/i, /\bspeed.drug\b/i,
  /\bmethadon\b/i, /\bmetadon\b/i, /\bsubstance.abuse\b/i,
  /\bsyringe(s)?\b/i, /\bneedle.drug\b/i, /\bshoot.up\b/i,
  /\bdrug.dealer\b/i, /\bdrug.sell\b/i, /\bbuy.drugs?\b/i,
  /\bspice.drug\b/i, /\bk2.drug\b/i, /\bsynthetic.drug\b/i,

  // ── Drugs & narcotics (UZ) ────────────────────────────────────────────────
  /\bnasha\b/i, /\bnarko/i, /\bgiyohvand/i,
  /\bgashish\b/i, /\bchilim.nasha\b/i, /\bnos\b.*\bsotamiz\b/i,
  /\bkokain\b/i, /\bopiy\b/i, /\bafyun\b/i,
  /\bheroin.sotamiz\b/i, /\bnarkotik.sotamiz\b/i,
  /\btramadol\b/i, /\bfenadol\b/i,
  /\bnarkoman\b/i, /\bnarkotik.kerak\b/i,

  // ── Drugs & narcotics (RU) ────────────────────────────────────────────────
  /\bkokain\b/i, /\bgashish\b/i, /\bganjubas\b/i,
  /\bmetadon\b/i, /\btramadol.kupit/i, /\bkupit.narkotik/i,
  /\bprodat.narkotik/i, /\bnarkotik.prodazha\b/i,

  // ── Violence & gore ───────────────────────────────────────────────────────
  /\bkill\b/i, /\bmurder\b/i, /\bviolence\b/i, /\bzoravonlik\b/i,
  /\bassassinat/i, /\bexecution\b/i, /\bbeheading\b/i,
  /\btorture\b/i, /\bgore\b/i, /\bbloodsh/i,

  // ── Offensive / profanity (EN) ────────────────────────────────────────────
  /\bfuck/i, /\bfucker\b/i, /\bfucking\b/i, /\bfucked\b/i,
  /\bshit\b/i, /\bbitch\b/i, /\bcunt\b/i, /\bass.?hole\b/i,
  /\bbasard\b/i, /\bbastard\b/i, /\bdick\b/i, /\bcock\b/i,
  /\bpussy\b/i, /\bwhore\b/i, /\bslut\b/i, /\bnigg/i,
  /\bfagg/i, /\bretard\b/i, /\bmotherf/i,

  // ── Offensive / profanity (UZ) ────────────────────────────────────────────
  /\bla['']nati\b/i, /\bla['']nat\b/i,
  /\bharom.zod\b/i, /\bharomzod/i,
  /\bit.bola\b/i, /\beshak.bola\b/i,
  /\bahmoq\b/i, /\bahmaq\b/i, /\btentak\b/i,
  /\bkaltakbosh\b/i, /\bkalvak\b/i,
  /\bqovoqbosh\b/i, /\bo['']ris.qorin\b/i,

  // ── Offensive / profanity (RU) ────────────────────────────────────────────
  /\bblya[dt]/i, /\bkhuy\b/i, /\bkhuja\b/i,
  /\bpizd/i, /\bpezdets\b/i,
  /\byob/i, /\byebat/i, /\bebany[iy]/i,
  /\bmudak\b/i, /\bsuka\b/i, /\bpadla\b/i,
  /\bsvoloch/i, /\bgavno\b/i, /\bpidor\b/i,
  /\bdolboyob\b/i, /\bzalupa\b/i,

  // ── Gambling ──────────────────────────────────────────────────────────────
  /\bcasino\b/i, /\bgambl/i, /\bbet(ting)?\b/i, /\bstavka\b/i,
  /\bpoker\b/i, /\bslot.machine\b/i, /\bbookmaker\b/i,
  /\bsports.betting\b/i, /\bfixed.match/i,

  // ── Fraud / hacking ───────────────────────────────────────────────────────
  /\bhack\b/i, /\bpirat/i, /\bphish/i, /\bscam\b/i,
  /\bfake.id\b/i, /\bcounterfeit\b/i, /\bcarding\b/i,
  /\bdumps.cvv\b/i, /\bblackmarket\b/i, /\bdark.web\b/i,

  // ── Prescription drug abuse ───────────────────────────────────────────────
  /\bviagra\b/i, /\bcialis\b/i, /\bsteroid\b/i,
  /\bprescription.drug.buy\b/i, /\bbuy.pills.online\b/i,
];

// ══════════════════════════════════════════════════════════════════════════════
// VISION SYSTEM PROMPT  (English for model accuracy, Uzbek reasons)
// ══════════════════════════════════════════════════════════════════════════════
const VISION_SYSTEM_PROMPT = `You are an EXTREMELY STRICT advertising content moderator.
Default answer: REJECTED. Only approve clean, professional business content.

REJECT IMMEDIATELY for ANY of these in the image:

═══ BODY / CLOTHING ════════════════════════════════════════
- Bikini, swimwear, underwear, lingerie, bra, corset, crop top, tank top
- Shorts, miniskirt, tight-fitting, revealing clothing of any kind
- Any bare skin below the neckline: chest, stomach, back, shoulders, legs, arms
- Cleavage, bare midriff, bare legs, bare shoulders
- Provocative, seductive, or suggestive poses or expressions
- Any sexualized imagery even if not fully nude

═══ WEAPONS & EXPLOSIVES ═══════════════════════════════════
- Any firearm: pistol, revolver, rifle, shotgun, machine gun, sniper, AK-47, AR-15
- Any edged weapon: knife, dagger, sword, blade, machete
- Explosive devices: bomb, grenade, landmine, TNT, C4, IED, RPG, dynamite
- Weapon accessories: ammunition, bullets, holster, silencer
- Military equipment meant for killing

═══ DRUGS & NARCOTICS ══════════════════════════════════════
- Drugs of any kind: heroin, cocaine, meth, weed, cannabis, LSD, MDMA, ecstasy
- Psychotropic substances: ketamine, methadone, tramadol, morphine, codeine, amphetamine
- Drug paraphernalia: syringes/needles, pipes, bongs, rolling papers in drug context
- Pill presses or suspicious pill/powder close-ups

═══ VIOLENCE & GORE ════════════════════════════════════════
- Blood, wounds, injuries, gore
- Fighting, hitting, threatening, torture
- Dead bodies or severe injuries

═══ ILLEGAL SERVICES ═══════════════════════════════════════
- Hitman / assassin / contract killing imagery
- Kidnapping, trafficking, slavery

═══ HATE & EXTREMISM ═══════════════════════════════════════
- Hate symbols, Nazi symbols, extremist logos
- Offensive gestures, racial slurs written on image

═══ GAMBLING / FRAUD ═══════════════════════════════════════
- Casino tables, slot machines, roulette
- Fake documents, counterfeit currency

APPROVE ONLY:
- Product on plain/neutral background
- Logo, icon, or graphic design
- Building, office, storefront
- App or website screenshot
- Food presented professionally
- Landscape, city, travel destination
- Text/infographic content
- Fully-clothed professional in suit/uniform (collar to wrist, no bare skin)

RULE: ANY doubt → REJECTED.

FORMAT (reply ONLY this):
APPROVED
or
REJECTED: [one sentence reason in Uzbek]`;

// ══════════════════════════════════════════════════════════════════════════════
// TEXT SYSTEM PROMPT
// ══════════════════════════════════════════════════════════════════════════════
const TEXT_SYSTEM_PROMPT = `You are a STRICT advertising text moderator for a family-friendly platform.
Default answer: REJECTED. Only approve clean, professional business advertisements.

REJECT if the ad title, description, or URL contains or implies:
1. Sexual content, escort, prostitution, adult entertainment
2. Weapons, firearms, explosives, ammunition for sale
3. Drugs, narcotics, psychotropic substances, drug paraphernalia
4. Murder-for-hire, hitman, kidnapping, human trafficking services
5. Gambling, betting, casino services
6. Hacking, carding, fraud, dark web services
7. Hate speech, racism, extremism, terrorism
8. Profanity or offensive language in any language (English, Uzbek, Russian)
9. Fake/counterfeit products or deceptive scams

APPROVE if it is a genuine product, service, app, business, event, or information ad.

FORMAT (reply ONLY this):
APPROVED
or
REJECTED: [one sentence reason in Uzbek]`;

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function domainBlocked(url: string): string | null {
  try {
    const h = new URL(url).hostname.toLowerCase();
    for (const p of BLOCKED_PATTERNS) if (p.test(h)) return `Sayt domeni taqiqlangan: ${h}`;
  } catch { return "URL formati noto'g'ri"; }
  return null;
}

function keywordCheck(text: string): boolean {
  for (const p of BLOCKED_PATTERNS) if (p.test(text)) return true;
  return false;
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

async function xaiChat(model: string, messages: unknown[], timeoutMs = 12000): Promise<string> {
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

function parseAIVerdict(reply: string): { approved: boolean; reason?: string } | null {
  if (!reply) return null;
  if (/REJECTED/i.test(reply)) {
    const match = reply.match(/REJECTED:?\s*(.+)/i);
    return { approved: false, reason: match?.[1]?.trim() || "Moderatsiya talablariga javob bermadi" };
  }
  if (/APPROVED/i.test(reply)) return { approved: true };
  // Ambiguous — reject for safety
  return { approved: false, reason: "Noaniq javob — qayta urinib ko'ring" };
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

async function checkVision(
  imageBase64: string, mimeType: string, adInfo: string
): Promise<{ approved: boolean; reason?: string } | null> {
  if (!process.env.XAI_API_KEY) return null;
  const imgContent = {
    type: "image_url" as const,
    image_url: { url: `data:${mimeType};base64,${imageBase64}` },
  };
  const userPrompt =
    `Examine this ad image carefully:\n${adInfo}\n\n` +
    `Step 1: Describe exactly what you see — people, objects, clothing, pose, any text visible.\n` +
    `Step 2: Look specifically for:\n` +
    `  • Bare skin / revealing clothing / bikini / swimwear\n` +
    `  • ANY weapon (gun, knife, grenade, explosive, bomb)\n` +
    `  • Drugs (pills, powder, syringes, bongs, cannabis)\n` +
    `  • Violence (blood, fighting, torture, dead bodies)\n` +
    `  • Hate symbols / extremist imagery\n` +
    `Step 3: Give verdict — APPROVED or REJECTED.\n\n` +
    `RULES: Bare skin below collar = REJECTED. Any weapon = REJECTED. Any drug = REJECTED. Doubt = REJECTED.`;

  for (const model of VISION_MODELS) {
    try {
      const reply = await xaiChat(model, [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        { role: "user", content: [imgContent, { type: "text", text: userPrompt }] },
      ], 15000);
      if (!reply) continue;
      console.log(`xAI vision [${model}]: ${reply.slice(0, 300)}`);
      const verdict = parseAIVerdict(reply);
      if (verdict) return verdict;
    } catch (e: any) {
      console.warn(`xAI vision ${model} error: ${e?.message?.slice(0, 150)}`);
    }
  }
  return null;
}

async function hfPost(
  modelUrl: string, imageBase64: string, mimeType: string, label: string
): Promise<number | null> {
  try {
    const body = Buffer.from(imageBase64, "base64");
    const headers: Record<string, string> = { "Content-Type": mimeType };
    if (process.env.HF_TOKEN) headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
    let res = await fetch(modelUrl, { method: "POST", headers, body, signal: AbortSignal.timeout(5000) });
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 12000));
      res = await fetch(modelUrl, { method: "POST", headers, body, signal: AbortSignal.timeout(7000) });
    }
    if (!res.ok) { console.warn(`HF ${modelUrl} failed: ${res.status}`); return null; }
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data.find((d: { label: string; score: number }) => d.label === label)?.score ?? null;
  } catch (e: any) {
    console.warn(`HF error (${label}): ${e?.message?.slice(0, 80)}`);
    return null;
  }
}

async function checkHfExplicit(imageBase64: string, mimeType: string) {
  const score = await hfPost(HF_EXPLICIT_MODEL, imageBase64, mimeType, "nsfw");
  if (score === null) return null;
  console.log(`HF explicit NSFW: ${score.toFixed(3)}`);
  return { flagged: score > 0.35, score };
}

async function checkHfSexy(imageBase64: string, mimeType: string) {
  const body = Buffer.from(imageBase64, "base64");
  const headers: Record<string, string> = { "Content-Type": mimeType };
  if (process.env.HF_TOKEN) headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
  try {
    let res = await fetch(HF_SEXY_MODEL, { method: "POST", headers, body, signal: AbortSignal.timeout(5000) });
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 12000));
      res = await fetch(HF_SEXY_MODEL, { method: "POST", headers, body, signal: AbortSignal.timeout(7000) });
    }
    if (!res.ok) { console.warn(`HF sexy failed: ${res.status}`); return null; }
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    const sexy = data.find((d: { label: string; score: number }) => d.label === "sexy")?.score ?? 0;
    const porn = data.find((d: { label: string; score: number }) => d.label === "porn")?.score ?? 0;
    console.log(`HF sexy: ${sexy.toFixed(3)}, porn: ${porn.toFixed(3)}`);
    return { flagged: sexy > 0.30 || porn > 0.25, sexy, porn };
  } catch (e: any) {
    console.warn(`HF sexy error: ${e?.message?.slice(0, 80)}`);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  return NextResponse.json({
    ok: true,
    strategy: "keyword → text-AI → image[Grok Vision + HF Falconsai + HF AdamCodd]",
    vision_models: VISION_MODELS,
    hf_models: [HF_EXPLICIT_MODEL, HF_SEXY_MODEL],
    xai_key: !!process.env.XAI_API_KEY,
    hf_token: !!process.env.HF_TOKEN,
    blocked_patterns_count: BLOCKED_PATTERNS.length,
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

    // ── 1. Domain check ───────────────────────────────────────────────────────
    const domainErr = domainBlocked(destinationURL);
    if (domainErr) return NextResponse.json({ approved: false, reason: domainErr });

    // ── 2. Keyword check on all text fields ───────────────────────────────────
    const allText = [title, description, destinationURL].filter(Boolean).join(" ");
    if (keywordCheck(allText)) {
      return NextResponse.json({
        approved: false,
        reason: "Sarlavha, tavsif yoki URL taqiqlangan so'z yoki xizmat turini o'z ichiga oladi.",
      });
    }

    // ── 3. URL availability check ─────────────────────────────────────────────
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
      return NextResponse.json({ approved: false, reason: "URL manzilga ulanib bo'lmadi. Saytni tekshiring." });
    }

    const adInfo = `Title: "${title}"\nDescription: "${description || "(none)"}"\nURL: ${destinationURL}`;
    const hasImage = !!(imageBase64 && mimeType);

    // ── 4. Text AI moderation ─────────────────────────────────────────────────
    if (process.env.XAI_API_KEY) {
      try {
        const reply = await xaiChat(MODEL_TEXT, [
          { role: "system", content: TEXT_SYSTEM_PROMPT },
          {
            role: "user",
            content:
              `Check this advertisement:\n\n${adInfo}\n\n` +
              `Does it advertise weapons, drugs, murder/kidnapping services, offensive content, or illegal services? ` +
              `Respond APPROVED or REJECTED: [reason in Uzbek].`,
          },
        ], 8000);
        const verdict = parseAIVerdict(reply);
        if (verdict && !verdict.approved) {
          return NextResponse.json({ approved: false, reason: verdict.reason });
        }
      } catch (e: any) {
        console.warn("Text AI check failed:", e?.message);
      }
    }

    // ── 5. Image moderation — 3 checks in parallel ────────────────────────────
    if (hasImage) {
      const [visionResult, hfExplicit, hfSexy] = await Promise.all([
        checkVision(imageBase64, mimeType, adInfo),
        checkHfExplicit(imageBase64, mimeType),
        checkHfSexy(imageBase64, mimeType),
      ]);

      console.log(
        `Image results — vision:${JSON.stringify(visionResult)}, ` +
        `explicit:${JSON.stringify(hfExplicit)}, sexy:${JSON.stringify(hfSexy)}`
      );

      // HF AdamCodd: bikini / revealing clothing — highest priority
      if (hfSexy?.flagged) {
        return NextResponse.json({
          approved: false,
          reason: "Rasm uyatsiz yoki yarimochar kiyimli shaxsni aks ettirmoqda. Biznes reklamaga mos rasm tanlang.",
        });
      }

      // HF Falconsai: explicit pornographic
      if (hfExplicit?.flagged) {
        return NextResponse.json({
          approved: false,
          reason: "Rasm 18+ yoki nomaqbul kontent sifatida aniqlandi. Iltimos mos rasm tanlang.",
        });
      }

      // xAI Grok Vision: weapons, drugs, violence, remaining content
      if (visionResult !== null && !visionResult.approved) {
        return NextResponse.json({ approved: false, reason: visionResult.reason });
      }

      // All 3 failed → reject for safety
      if (visionResult === null && hfExplicit === null && hfSexy === null) {
        console.warn("⚠️ All 3 image checks unresponsive — rejecting for safety");
        return NextResponse.json({
          approved: false,
          reason: "Rasm tekshiruvida xatolik. Qayta urinib ko'ring.",
        });
      }
    }

    return NextResponse.json({ approved: true });
  } catch (err: any) {
    console.error("Moderation error:", err?.message);
    return NextResponse.json({ approved: false, reason: "Moderatsiya xatosi. Qayta urinib ko'ring." });
  }
}
