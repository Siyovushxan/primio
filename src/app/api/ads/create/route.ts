import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { validateAdInput } from "@/lib/adRules";
import { redeemModerationToken } from "@/lib/moderationToken";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await verifyFirebaseToken(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.advertiserUID !== undefined && body.advertiserUID !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const input = validateAdInput(body);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
  const ad = input.value;

  try {
    const adRef = adminDb.collection("ads").doc();
    const modError = await adminDb.runTransaction(async (tx) => {
      const err = await redeemModerationToken(tx, body.moderationId, uid, ad);
      if (err) return err;

      tx.create(adRef, {
        advertiserUID: uid,
        title: ad.title,
        description: ad.description,
        imageURL: ad.imageURL,
        destinationURL: ad.destinationURL,
        category: ad.category,
        dailyBidCents: ad.dailyBidCents,
        durationDays: ad.durationDays,
        totalPaidCents: 0,
        status: "pending",
        moderationPassed: true,
        moderationId: body.moderationId,
        moderatedAt: FieldValue.serverTimestamp(),
        startsAt: null,
        expiresAt: null,
        impressions: 0,
        clicks: 0,
        externalTxId: "",
        paymentMethod: "",
        createdAt: FieldValue.serverTimestamp(),
      });
      return null;
    });

    if (modError) return NextResponse.json({ error: modError }, { status: 403 });
    return NextResponse.json({ adId: adRef.id });
  } catch (err: unknown) {
    console.error("Create ad error:", err);
    return NextResponse.json({ error: "Could not save the ad" }, { status: 500 });
  }
}
