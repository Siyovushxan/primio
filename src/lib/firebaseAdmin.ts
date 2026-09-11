import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  // During build (no real credentials) — return a dummy app that won't be used
  if (!privateKey || privateKey.includes("...") || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.includes("@")) {
    return initializeApp({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "primio-e6f11" });
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminDb   = getFirestore(getAdminApp());
export const adminAuth = getAuth(getAdminApp());
