import { NextRequest, NextResponse } from "next/server";
import { analyticsIdentity, getGoogleAccessToken } from "@/lib/analytics-auth";
import { listGoogleProperties } from "@/lib/google-analytics";

export async function GET(req: NextRequest) {
  const identity = await analyticsIdentity(req);
  if ("error" in identity) return NextResponse.json({ error: identity.error }, { status: 401 });
  try {
    const { accessToken } = await getGoogleAccessToken(identity.uid);
    return NextResponse.json({ properties: await listGoogleProperties(accessToken) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "analytics_unavailable";
    return NextResponse.json({ error: code }, { status: code === "google_analytics_not_connected" ? 409 : code === "google_analytics_not_configured" ? 503 : 502 });
  }
}
