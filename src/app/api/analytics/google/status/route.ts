import { NextRequest, NextResponse } from "next/server";
import { analyticsIdentity, getGoogleConnection } from "@/lib/analytics-auth";
import { isGoogleAnalyticsConfigured } from "@/lib/google-analytics";

export async function GET(req: NextRequest) {
  const identity = await analyticsIdentity(req);
  if ("error" in identity) return NextResponse.json({ error: identity.error }, { status: 401 });
  try {
    const connection = await getGoogleConnection(identity.uid);
    return NextResponse.json({ configured: isGoogleAnalyticsConfigured(), connected: Boolean(connection?.encryptedRefreshToken), propertyId: connection?.propertyId || null, propertyName: connection?.propertyName || null, timezone: connection?.timezone || null });
  } catch {
    return NextResponse.json({ error: "analytics_unavailable" }, { status: 503 });
  }
}
