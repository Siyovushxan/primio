import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { validateAdInput } from "@/lib/adRules";
import { redeemModerationToken } from "@/lib/moderationToken";

export const dynamic = "force-dynamic";

// Only unpaid ads can be edited. A paid (active/expired) ad keeps the content
// and price it was paid for; bid changes go through the bid-upgrade payment.
const EDITABLE_STATUSES = ["pending", "rejected"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ adId: string }> },
) {
  const { adId } = await params;
  if (!adId || adId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(adId)) {
    return NextResponse.json({ error: "Invalid ad id" }, { status: 400 });
  }

  const callerUid = await verifyFirebaseToken(req);
  if (!callerUid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = validateAdInput(body);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
  const ad = input.value;

  try {
    const adRef = adminDb.doc(`ads/${adId}`);
    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(adRef);
      if (!snap.exists) return { status: 404, error: "Ad not found" };
      const current = snap.data()!;
      if (current.advertiserUID !== callerUid) return { status: 403, error: "Forbidden" };
      if (!EDITABLE_STATUSES.includes(current.status)) {
        return { status: 409, error: "Only unpaid ads can be edited" };
      }

      const modError = await redeemModerationToken(tx, body.moderationId, callerUid, ad);
      if (modError) return { status: 403, error: modError };

      tx.update(adRef, {
        title: ad.title,
        description: ad.description,
        destinationURL: ad.destinationURL,
        category: ad.category,
        dailyBidCents: ad.dailyBidCents,
        durationDays: ad.durationDays,
        imageURL: ad.imageURL,
        status: "pending",
        moderationPassed: true,
        moderationId: body.moderationId,
        moderatedAt: FieldValue.serverTimestamp(),
        rejectionReason: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return null;
    });

    if (result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Update ad error:", err);
    return NextResponse.json({ error: "Could not update the ad" }, { status: 500 });
  }
}
