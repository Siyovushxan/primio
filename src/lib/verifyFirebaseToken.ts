import type { NextRequest } from "next/server";
import { adminAuth } from "./firebaseAdmin";
export async function verifiedIdentity(req: NextRequest) {
  const match = req.headers.get("authorization")?.match(/^Bearer (\S+)$/);
  if (!match) return null;
  try { return await adminAuth.verifyIdToken(match[1], true); } catch { return null; }
}
export async function verifyFirebaseToken(req: NextRequest): Promise<string | null> {
  return (await verifiedIdentity(req))?.uid ?? null;
}