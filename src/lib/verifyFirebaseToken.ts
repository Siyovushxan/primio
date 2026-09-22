import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

const PROJECT_ID =
  process.env.FIREBASE_ADMIN_PROJECT_ID || "primio-e6f11";

export async function verifyFirebaseToken(
  req: NextRequest
): Promise<string | null> {
  const token = req.headers
    .get("Authorization")
    ?.replace("Bearer ", "")
    .trim();
  if (!token || token === "undefined" || token === "null") return null;
  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    return (payload.sub as string) || null;
  } catch {
    return null;
  }
}
