import { createHash } from "node:crypto";
import { adminDb } from "./firebaseAdmin";
import { publicWebsite } from "./auction";
export function contentHash(content: { title: string; description?: string; destinationURL: string; imageURL: string }) {
  return createHash("sha256").update(JSON.stringify([content.title.trim(), (content.description ?? "").trim(), publicWebsite(content.destinationURL), publicWebsite(content.imageURL)])).digest("hex");
}
export function imageHash(base64: string) { return createHash("sha256").update(Buffer.from(base64, "base64")).digest("hex"); }
function sameURL(value: unknown, url: string) { try { return publicWebsite(value) === url; } catch { return false; } }
// A receipt may only name an image the review actually saw: a fresh upload with the same bytes,
// or the unchanged image of the reviewer's own ad.
export function uploadMatches(upload: { uid?: unknown; url?: unknown; imageHash?: unknown } | undefined, uid: string, imageURL: string, hash: string) {
  return !!upload && upload.uid === uid && sameURL(upload.url, imageURL) && upload.imageHash === hash;
}
export function ownedImageMatches(ad: { advertiserUID?: unknown; imageURL?: unknown } | undefined, uid: string, imageURL: string) {
  return !!ad && ad.advertiserUID === uid && sameURL(ad.imageURL, imageURL);
}
export async function issueReview(uid: string, content: Parameters<typeof contentHash>[0]) {
  const ref = await adminDb.collection("moderationReviews").add({ uid, hash: contentHash(content), expiresAt: new Date(Date.now() + 3_600_000), used: false });
  return ref.id;
}