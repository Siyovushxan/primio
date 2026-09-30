import { signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";

// Keep ownership attached to this browser without interrupting the ad flow.
export async function ensureGuestSession() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}
