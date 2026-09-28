import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { analyticsIdentity, getGoogleAccessToken, googleConnectionRef } from "@/lib/analytics-auth";
import { getGooglePropertyTimezone, isPropertyId, listGoogleProperties } from "@/lib/google-analytics";

export async function POST(req: NextRequest) {
  const identity = await analyticsIdentity(req);
  if ("error" in identity) return NextResponse.json({ error: identity.error }, { status: 401 });
  try {
    const body = await req.json();
    if (!isPropertyId(body.propertyId)) return NextResponse.json({ error: "analytics_property_invalid" }, { status: 400 });
    const { accessToken } = await getGoogleAccessToken(identity.uid);
    const property = (await listGoogleProperties(accessToken)).find(item => item.propertyId === body.propertyId);
    if (!property) return NextResponse.json({ error: "analytics_property_not_authorized" }, { status: 403 });
    const timezone = await getGooglePropertyTimezone(accessToken, property.propertyId);
    await googleConnectionRef(identity.uid).set({ propertyId: property.propertyId, propertyName: property.displayName, timezone, updatedAt: Timestamp.now() }, { merge: true });
    return NextResponse.json({ ok: true, propertyId: property.propertyId, propertyName: property.displayName, timezone });
  } catch (error) {
    const code = error instanceof Error ? error.message : "analytics_unavailable";
    return NextResponse.json({ error: code }, { status: 502 });
  }
}
