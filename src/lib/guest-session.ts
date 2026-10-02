import { signInAnonymously, signInWithCustomToken, type User } from "firebase/auth";
import { auth } from "./firebase";

let starting: Promise<User> | null = null;

async function startGuest() {
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  try {
    return (await signInAnonymously(auth)).user;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : "";
    if (code !== "auth/admin-restricted-operation" && code !== "auth/operation-not-allowed") throw error;
    const response = await fetch("/api/guest-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store" });
    const result = await response.json();
    if (!response.ok || typeof result.token !== "string") throw new Error(result.error || "Could not start your guest session.");
    return (await signInWithCustomToken(auth, result.token)).user;
  }
}

// Preserve this browser's ownership and collapse simultaneous requests into one identity.
export async function ensureGuestSession() {
  if (auth.currentUser) return auth.currentUser;
  if (!starting) starting = startGuest().finally(() => { starting = null; });
  return starting;
}
