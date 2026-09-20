import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ adId: string }> },
) {
  const { adId } = await params;

  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let callerUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const adSnap = await adminDb.doc(`ads/${adId}`).get();
    if (!adSnap.exists) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }
    if (adSnap.data()!.advertiserUID !== callerUid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description, destinationURL, category, dailyBidCents, durationDays, imageURL } =
      await req.json();

    await adminDb.doc(`ads/${adId}`).update({
      title,
      description,
      destinationURL,
      category,
      dailyBidCents: Number(dailyBidCents),
      durationDays: Number(durationDays),
      imageURL,
      status: "pending",
      moderationPassed: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Update ad error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
