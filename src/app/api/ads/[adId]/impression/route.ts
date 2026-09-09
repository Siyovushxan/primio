import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/ads/[adId]/impression">
) {
  const { adId } = await ctx.params;
  try {
    await updateDoc(doc(db, "ads", adId), {
      impressions: increment(1),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
