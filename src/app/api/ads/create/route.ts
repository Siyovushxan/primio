import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await verifyFirebaseToken(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      advertiserUID, title, description, imageURL,
      destinationURL, category, dailyBidCents, durationDays,
    } = await req.json();

    if (uid !== advertiserUID) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!title || !destinationURL || !category || !dailyBidCents || !durationDays) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { FieldValue } = require("firebase-admin/firestore");

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
  } catch (err: unknown) {
    console.error("Create ad error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
