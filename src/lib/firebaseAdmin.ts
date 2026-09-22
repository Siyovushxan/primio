import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";

let _app: App | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _initError: string | null = null;

function initAdmin() {
  if (_app || _initError) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const adminApp = require("firebase-admin/app");
    const { initializeApp, getApps, cert } = adminApp;

    if (getApps().length) {
      _app = getApps()[0];
    } else {
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      if (
        !privateKey ||
        privateKey.includes("...") ||
        !process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.includes("@")
      ) {
        _app = initializeApp({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "primio-e6f11",
        });
      } else {
        try {
          _app = initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
              clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
              privateKey: privateKey.replace(/\\n/g, "\n"),
            }),
          });
        } catch {
          _app = initializeApp({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "primio-e6f11",
          });
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getFirestore } = require("firebase-admin/firestore");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuth } = require("firebase-admin/auth");
    _db = getFirestore(_app);
    _auth = getAuth(_app);
  } catch (e: unknown) {
    _initError = (e as Error)?.message || "unknown";
    console.error("Firebase Admin init error:", _initError);
  }
}

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop: string) {
    initAdmin();
    if (!_db) throw new Error(`Firebase Admin DB unavailable: ${_initError}`);
    const val = (_db as unknown as Record<string, unknown>)[prop];
    return typeof val === "function" ? (val as Function).bind(_db) : val;
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop: string) {
    initAdmin();
    if (!_auth)
      throw new Error(`Firebase Admin Auth unavailable: ${_initError}`);
    const val = (_auth as unknown as Record<string, unknown>)[prop];
    return typeof val === "function" ? (val as Function).bind(_auth) : val;
  },
});
