import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { analyticsIdentity } from "@/lib/analytics-auth";

const RDAP_UZ = "https://rdap.cctld.uz/domain/";
const RDAP_OTHER = "https://rdap.org/domain/";
const SOCIAL_HOSTS = new Set(["instagram.com", "tiktok.com", "youtube.com", "youtu.be", "facebook.com", "fb.com", "t.me", "telegram.me", "telegram.org", "linkedin.com", "x.com", "twitter.com", "wa.me"]);

function publicDomain(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if ([...SOCIAL_HOSTS].some(host => hostname === host || hostname.endsWith(`.${host}`))) return null;
    if (!hostname.includes(".") || hostname.length > 253 || hostname === "localhost" || /^\d+(?:\.\d+){3}$/.test(hostname) || hostname.startsWith("[") || hostname.endsWith(".local")) return null;
    if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname)) return null;
    return hostname;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const identity = await analyticsIdentity(req);
  if ("error" in identity) return NextResponse.json({ error: identity.error }, { status: 401 });
  const adId = req.nextUrl.searchParams.get("adId") || "";
  if (!/^[\w-]{1,128}$/.test(adId)) return NextResponse.json({ error: "project_not_found" }, { status: 400 });
  try {
    const snap = await adminDb.doc(`ads/${adId}`).get();
    if (!snap.exists || snap.data()?.advertiserUID !== identity.uid) return NextResponse.json({ error: "project_not_found" }, { status: 404 });
    const destination = snap.data()?.destinationURL;
    if (typeof destination !== "string") return NextResponse.json({ available: false, reason: "no_website_domain" });
    const domain = publicDomain(destination);
    if (!domain) return NextResponse.json({ available: false, reason: "no_website_domain" });
    const url = `${domain.endsWith(".uz") ? RDAP_UZ : RDAP_OTHER}${encodeURIComponent(domain)}`;
    const response = await fetch(url, { headers: { Accept: "application/rdap+json, application/json" }, signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (response.status === 404) return NextResponse.json({ available: false, domain, reason: "registration_not_found", source: domain.endsWith(".uz") ? ".UZ RDAP registry" : "RDAP registry" });
    if (!response.ok) return NextResponse.json({ available: false, domain, reason: "registry_unavailable" });
    const data = await response.json() as { events?: Array<{ eventAction?: string; eventDate?: string }> };
    const event = data.events?.find(item => ["registration", "registered", "creation"].includes((item.eventAction || "").toLowerCase()) && typeof item.eventDate === "string");
    if (!event?.eventDate || !Number.isFinite(Date.parse(event.eventDate))) return NextResponse.json({ available: false, domain, reason: "registration_date_unavailable", source: domain.endsWith(".uz") ? ".UZ RDAP registry" : "RDAP registry" });
    return NextResponse.json({ available: true, domain, registeredAt: event.eventDate, source: domain.endsWith(".uz") ? ".UZ RDAP registry" : "RDAP registry", checkedAt: new Date().toISOString(), note: "Domen ro‘yxatdan o‘tgan sana; sayt yoki biznes ish boshlagan sana emas." });
  } catch {
    return NextResponse.json({ available: false, reason: "registry_unavailable" });
  }
}
