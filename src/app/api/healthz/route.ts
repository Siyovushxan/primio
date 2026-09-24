import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let fbStatus = "not_tested";
  try {
    const { getApps } = await import("firebase-admin/app");
    fbStatus = `apps: ${getApps().length}`;
  } catch (e: unknown) {
    fbStatus = `error: ${e instanceof Error ? e.message.slice(0, 100) : "unknown"}`;
  }

  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    firebase_admin: fbStatus,
    env: {
      has_fb_key: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      has_fb_email: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      has_fb_project: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      has_xai_key: !!process.env.XAI_API_KEY,
    },
  });
}
