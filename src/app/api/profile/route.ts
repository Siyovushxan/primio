import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifiedIdentity } from "@/lib/verifyFirebaseToken";
import { adminDb } from "@/lib/firebaseAdmin";
import { FREE_TRIAL_MS, isTrialActive, trialExpiry } from "@/lib/trial";
import { milliseconds } from "@/lib/auction";
export async function POST(req: NextRequest) {
  const user = await verifiedIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const ref = adminDb.doc(`users/${user.uid}`);
    const trial = await adminDb.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const existing = snap.data();
      const trialStartedAt = existing?.trialStartedAt ?? new Date(now);
      const trialExpiresAt = existing?.trialExpiresAt ?? new Date((milliseconds(trialStartedAt) || now) + FREE_TRIAL_MS);
      if (!snap.exists) tx.create(ref, { uid: user.uid, displayName: user.name ?? "", email: user.email ?? "", phone: "", totalSpentCents: 0, isNewAccount: true, createdAt: FieldValue.serverTimestamp(), trialStartedAt, trialExpiresAt });
      else if (!existing?.trialStartedAt || !existing?.trialExpiresAt) tx.update(ref, { trialStartedAt, trialExpiresAt });
      if (snap.exists && typeof body.displayName === "string") {
        const displayName = body.displayName.trim();
        if (!displayName || displayName.length > 80) throw new Error("Enter a name of 1–80 characters.");
        tx.update(ref, { displayName, email: user.email ?? "", updatedAt: FieldValue.serverTimestamp() });
      }
      return { trialExpiresAt };
    });
    const endsAt = trialExpiry(trial);
    return NextResponse.json({ ok: true, admin: user.admin === true, trialEndsAt: endsAt, trialActive: isTrialActive(trial) });
  } catch { return NextResponse.json({ error: "Could not save profile." }, { status: 500 }); }
}
