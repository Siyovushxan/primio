import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifiedIdentity } from "@/lib/verifyFirebaseToken";
import { decryptRefreshToken, isGoogleAnalyticsConfigured, refreshGoogleAccessToken } from "@/lib/google-analytics";

export async function analyticsIdentity(req: NextRequest) {
  const identity = await verifiedIdentity(req);
  if (!identity?.uid) return { error: "unauthorized" as const };
  return { uid: identity.uid };
}

export function googleConnectionRef(uid: string) {
  return adminDb.doc(`googleAnalyticsConnections/${uid}`);
}

export async function getGoogleConnection(uid: string) {
  const snap = await googleConnectionRef(uid).get();
  return snap.exists ? snap.data() as { encryptedRefreshToken: string; propertyId?: string; propertyName?: string; timezone?: string } : null;
}

export async function getGoogleAccessToken(uid: string): Promise<{ accessToken: string; connection: NonNullable<Awaited<ReturnType<typeof getGoogleConnection>>> }> {
  if (!isGoogleAnalyticsConfigured()) throw new Error("google_analytics_not_configured");
  const connection = await getGoogleConnection(uid);
  if (!connection?.encryptedRefreshToken) throw new Error("google_analytics_not_connected");
  return { accessToken: await refreshGoogleAccessToken(decryptRefreshToken(connection.encryptedRefreshToken)), connection };
}

export async function consumeAnalyticsOAuthState(state: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(state)) return null;
  const ref = adminDb.doc(`analyticsOAuthStates/${state}`);
  return adminDb.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const data = snap.data()!;
    tx.delete(ref);
    if (typeof data.uid !== "string" || typeof data.expiresAt?.toMillis !== "function" || data.expiresAt.toMillis() < Date.now()) return null;
    return data.uid as string;
  });
}

export function newOAuthState() {
  return randomBytes(32).toString("base64url");
}
