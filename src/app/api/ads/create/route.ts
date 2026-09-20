import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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
    const {
      advertiserUID, title, description, imageURL,
      destinationURL, category, dailyBidCents, durationDays,
    } = await req.json();

    if (callerUid !== advertiserUID) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!title || !destinationURL || !category || !dailyBidCents || !durationDays) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adRef = await adminDb.collection("ads").add({
      advertiserUID,
      title,
      description: description || "",
      imageURL: imageURL || "",
      destinationURL,
      category,
      dailyBidCents: Number(dailyBidCents),
      durationDays: Number(durationDays),
      totalPaidCents: 0,
      status: "pending",
      moderationPassed: true,
      startsAt: null,
      expiresAt: null,
      impressions: 0,
      clicks: 0,
      externalTxId: "",
      paymentMethod: "",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ adId: adRef.id });
  } catch (err: any) {
    console.error("Create ad error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
