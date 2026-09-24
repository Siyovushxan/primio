import { createHash } from "node:crypto";
import { adminDb } from "./firebaseAdmin";
import { publicWebsite } from "./auction";
export function contentHash(content: { title: string; description?: string; destinationURL: string; imageURL: string }) {
  return createHash("sha256").update(JSON.stringify([content.title.trim(), (content.description ?? "").trim(), publicWebsite(content.destinationURL), publicWebsite(content.imageURL)])).digest("hex");
}
export function imageHash(base64: string) { return createHash("sha256").update(Buffer.from(base64, "base64")).digest("hex"); }
export async function issueReview(uid: string, content: Parameters<typeof contentHash>[0]) {
  const ref = await adminDb.collection("moderationReviews").add({ uid, hash: contentHash(content), expiresAt: new Date(Date.now() + 3_600_000), used: false });
  return ref.id;
}