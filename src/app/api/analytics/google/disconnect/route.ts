import { NextRequest, NextResponse } from "next/server";
import { analyticsIdentity, getGoogleConnection, googleConnectionRef } from "@/lib/analytics-auth";
import { decryptRefreshToken } from "@/lib/google-analytics";

export async function DELETE(req: NextRequest) {
  const identity = await analyticsIdentity(req);
  if ("error" in identity) return NextResponse.json({ error: identity.error }, { status: 401 });
  try {
    const connection = await getGoogleConnection(identity.uid);
    await googleConnectionRef(identity.uid).delete();
    if (connection?.encryptedRefreshToken) {
      const token = decryptRefreshToken(connection.encryptedRefreshToken);
      void fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "" }).catch(() => undefined);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "analytics_unavailable" }, { status: 503 });
  }
}
