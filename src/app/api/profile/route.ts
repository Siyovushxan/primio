import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifiedIdentity } from "@/lib/verifyFirebaseToken";
import { adminDb } from "@/lib/firebaseAdmin";
export async function POST(req: NextRequest) {
  const user = await verifiedIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const ref = adminDb.doc(`users/${user.uid}`);
    await adminDb.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) tx.create(ref, { uid: user.uid, displayName: user.name ?? "", email: user.email ?? "", phone: "", totalSpentCents: 0, isNewAccount: true, createdAt: FieldValue.serverTimestamp() });
      else if (typeof body.displayName === "string") {
        const displayName = body.displayName.trim();
        if (!displayName || displayName.length > 80) throw new Error("Enter a name of 1–80 characters.");
        tx.update(ref, { displayName, email: user.email ?? "", updatedAt: FieldValue.serverTimestamp() });
      }
    });
    return NextResponse.json({ ok: true, admin: user.admin === true });
  } catch { return NextResponse.json({ error: "Could not save profile." }, { status: 500 }); }
}