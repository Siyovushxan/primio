import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { effectiveBidCents, rankingBidCents, type RankingBid, milliseconds, publicWebsite } from "@/lib/auction";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!/^[\w-]{1,128}$/.test(projectId)) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  try {
    const snap = await adminDb.doc(`ads/${projectId}`).get();
    const ad = snap.data();
    if (!ad || ad.status !== "active" || milliseconds(ad.expiresAt) <= Date.now()) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    try { publicWebsite(ad.destinationURL); publicWebsite(ad.imageURL); } catch { return NextResponse.json({ error: "Project not found." }, { status: 404 }); }
    return NextResponse.json({ project: {
      id: snap.id, title: ad.title, description: ad.description || "", imageURL: ad.imageURL,
      destinationURL: ad.destinationURL, category: ad.category, dailyBidCents: effectiveBidCents(ad as { dailyBidCents: number; trialBidCents?: number; trialBidUntil?: number }),
      rankingStrengthCents: rankingBidCents(ad as RankingBid),
      createdAt: milliseconds(ad.createdAt), expiresAt: milliseconds(ad.expiresAt)
    } }, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=15" } });
  } catch { return NextResponse.json({ error: "Project is temporarily unavailable." }, { status: 503 }); }
}
