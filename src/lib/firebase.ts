import { initializeApp, getApps, getApp as getExistingApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "placeholder",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize in browser — during Next.js build (Node.js) this stays null
// to prevent auth/invalid-api-key errors when real env vars are not present.
const isBrowser = typeof window !== "undefined";

const app: FirebaseApp = isBrowser
  ? getApps().length ? getExistingApp() : initializeApp(firebaseConfig)
  : null as unknown as FirebaseApp;

export const auth: Auth = isBrowser ? getAuth(app) : null as unknown as Auth;
export const db: Firestore = isBrowser ? getFirestore(app) : null as unknown as Firestore;
export const storage: FirebaseStorage = isBrowser ? getStorage(app) : null as unknown as FirebaseStorage;
export default app;
