import { initializeApp, getApps, cert } from "firebase-admin/app";
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
    if (getApps().length) {
      _app = getApps()[0];
    } else {
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      if (!privateKey || privateKey.includes("...") || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.includes("@")) {
        _app = initializeApp({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "primio-e6f11" });
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
          _app = initializeApp({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "primio-e6f11" });
        }
      }
    }

    const { getFirestore } = require("firebase-admin/firestore");
    const { getAuth } = require("firebase-admin/auth");
    _db = getFirestore(_app);
    _auth = getAuth(_app);
  } catch (e: any) {
    _initError = e?.message || "unknown";
    console.error("Firebase Admin init error:", _initError);
  }
}

export function getAdminDb(): Firestore {
  initAdmin();
  if (!_db) throw new Error(`Firebase Admin DB unavailable: ${_initError}`);
  return _db;
}

export function getAdminAuth(): Auth {
  initAdmin();
  if (!_auth) throw new Error(`Firebase Admin Auth unavailable: ${_initError}`);
  return _auth;
}

// Lazy proxy exports — identical API to before, but init is deferred to first use
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop: string) {
    initAdmin();
    if (!_db) throw new Error(`Firebase Admin DB unavailable: ${_initError}`);
    const val = (_db as any)[prop];
    return typeof val === "function" ? val.bind(_db) : val;
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop: string) {
    initAdmin();
    if (!_auth) throw new Error(`Firebase Admin Auth unavailable: ${_initError}`);
    const val = (_auth as any)[prop];
    return typeof val === "function" ? val.bind(_auth) : val;
  },
});
