// Binds a moderation approval to the exact content that was checked.
// The moderation route issues a one-time token; the create/update routes redeem it
// inside the same Firestore transaction that writes the ad.

import { createHash } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import type { AdContent } from "@/lib/adRules";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function contentHash(uid: string, c: AdContent): string {
  return createHash("sha256")
    .update(JSON.stringify([uid, c.title, c.description, c.destinationURL, c.imageURL]))
    .digest("hex");
}

export async function issueModerationToken(uid: string, content: AdContent): Promise<string> {
  const ref = adminDb.collection("moderations").doc();
  await ref.set({
    uid,
    contentHash: contentHash(uid, content),
    imageURL: content.imageURL,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + TOKEN_TTL_MS),
    usedAt: null,
  });
  return ref.id;
}

/**
 * Validates and consumes a moderation token within a transaction.
 * Returns an error message, or null when the token is valid for this uid + content.
 * It reads and then writes, so call it after every other tx.get() in the transaction.
 */
export async function redeemModerationToken(
  tx: Transaction,
  moderationId: unknown,
  uid: string,
  content: AdContent,
): Promise<string | null> {
  if (typeof moderationId !== "string" || !/^[A-Za-z0-9]{1,64}$/.test(moderationId)) {
    return "Moderation approval is missing";
  }
  const ref = adminDb.doc(`moderations/${moderationId}`);
  const snap = await tx.get(ref);
  if (!snap.exists) return "Moderation approval not found";
  const m = snap.data()!;
  if (m.uid !== uid) return "Moderation approval belongs to another user";
  if (m.usedAt) return "Moderation approval was already used";
  if ((m.expiresAt as Timestamp).toMillis() < Date.now()) return "Moderation approval expired — please submit again";
  if (m.contentHash !== contentHash(uid, content)) return "Content changed after moderation — please submit again";

  tx.update(ref, { usedAt: FieldValue.serverTimestamp() });
  return null;
}
