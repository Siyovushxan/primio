import { NextRequest, NextResponse } from "next/server";
import { analyticsIdentity, getGoogleAccessToken } from "@/lib/analytics-auth";
import { getGoogleAnalyticsReport, parseAnalyticsRange } from "@/lib/google-analytics";

export async function GET(req: NextRequest) {
  const identity = await analyticsIdentity(req);
  if ("error" in identity) return NextResponse.json({ error: identity.error }, { status: 401 });
  try {
    const { accessToken, connection } = await getGoogleAccessToken(identity.uid);
    if (!connection.propertyId || !connection.propertyName) return NextResponse.json({ error: "analytics_property_required" }, { status: 409 });
    const timezone = connection.timezone || "UTC";
    const range = parseAnalyticsRange(req.nextUrl.searchParams, Date.now(), timezone);
    return NextResponse.json(await getGoogleAnalyticsReport(accessToken, connection.propertyId, connection.propertyName, range, timezone));
  } catch (error) {
    const code = error instanceof Error ? error.message : "analytics_unavailable";
    const status = code === "analytics_date_range_invalid" ? 400 : code === "google_analytics_not_connected" || code === "analytics_property_required" ? 409 : code.includes("not_configured") ? 503 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}
