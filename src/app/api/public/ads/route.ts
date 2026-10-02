import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { effectiveBidCents, rankAds, milliseconds, publicWebsite } from "@/lib/auction";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const now = Date.now();
    const snap = await adminDb.collection("ads").where("status", "==", "active").get();
    const ads = rankAds(snap.docs.map(doc => { const d = doc.data(); return {
      id: doc.id, title: d.title, description: d.description || "", imageURL: d.imageURL, destinationURL: d.destinationURL,
      category: d.category, dailyBidCents: effectiveBidCents(d as { dailyBidCents: number; trialBidCents?: number; trialBidUntil?: number }, now),
      rankingVersion: milliseconds(d.trialBidUntil) > now ? 1 : d.rankingVersion ?? 1, rankingBidAt: milliseconds(d.rankingBidAt),
      status: "active", startsAt: milliseconds(d.startsAt),
      expiresAt: milliseconds(d.expiresAt), createdAt: milliseconds(d.createdAt)
    }; }).filter(ad => { try { publicWebsite(ad.destinationURL); publicWebsite(ad.imageURL); return true; } catch { return false; } }), now);
    return NextResponse.json({ ads }, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=15" } });
  } catch { return NextResponse.json({ error: "Rankings are temporarily unavailable." }, { status: 503 }); }
}
