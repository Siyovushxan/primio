import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { analyticsIdentity, newOAuthState } from "@/lib/analytics-auth";
import { GOOGLE_SCOPE, isGoogleAnalyticsConfigured } from "@/lib/google-analytics";

export async function POST(req: NextRequest) {
  const identity = await analyticsIdentity(req);
  if ("error" in identity) return NextResponse.json({ error: identity.error }, { status: 401 });
  if (!isGoogleAnalyticsConfigured()) return NextResponse.json({ error: "google_analytics_not_configured" }, { status: 503 });
  const state = newOAuthState();
  await adminDb.doc(`analyticsOAuthStates/${state}`).create({ uid: identity.uid, createdAt: Timestamp.now(), expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60_000) });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: process.env.GOOGLE_ANALYTICS_CLIENT_ID!, redirect_uri: process.env.GOOGLE_ANALYTICS_REDIRECT_URI!, response_type: "code", scope: GOOGLE_SCOPE, access_type: "offline", prompt: "consent", include_granted_scopes: "true", state }).toString();
  return NextResponse.json({ url: url.toString() });
}
