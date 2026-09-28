import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { consumeAnalyticsOAuthState } from "@/lib/analytics-auth";
import { encryptRefreshToken, isGoogleAnalyticsConfigured } from "@/lib/google-analytics";

function dashboardRedirect(result: string) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL || "https://www.primio.com.uz";
  const base = new URL(configured);
  return NextResponse.redirect(new URL(`/dashboard?view=analytics&google=${result}`, base));
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const state = searchParams.get("state") || "";
  const uid = await consumeAnalyticsOAuthState(state);
  if (!uid) return dashboardRedirect("state_error");
  const code = searchParams.get("code");
  if (!code || searchParams.has("error") || !isGoogleAnalyticsConfigured()) return dashboardRedirect("connection_error");
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_ANALYTICS_CLIENT_ID!, client_secret: process.env.GOOGLE_ANALYTICS_CLIENT_SECRET!, redirect_uri: process.env.GOOGLE_ANALYTICS_REDIRECT_URI!, grant_type: "authorization_code" }),
    });
    const tokens = await response.json() as { refresh_token?: string; access_token?: string };
    if (!response.ok || !tokens.refresh_token || !tokens.access_token) return dashboardRedirect("connection_error");
    await adminDb.doc(`googleAnalyticsConnections/${uid}`).set({ encryptedRefreshToken: encryptRefreshToken(tokens.refresh_token), connectedAt: Timestamp.now(), updatedAt: Timestamp.now() }, { merge: true });
    return dashboardRedirect("connected");
  } catch {
    return dashboardRedirect("connection_error");
  }
}
