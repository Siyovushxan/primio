"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/types";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const profileUnsubRef = useRef<(() => void) | null>(null);

  // no-op — profile updates come via onSnapshot automatically
  const refreshProfile = () => {};

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      // Cancel previous profile listener
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      if (user) {
        const ref = doc(db, "users", user.uid);

        // Subscribe to real-time profile updates
        const unsubProfile = onSnapshot(ref, async (snap) => {
          if (snap.exists()) {
            setUserProfile({ uid: user.uid, ...snap.data() } as User);
          } else {
            // First-time sign in — create the doc
            const newProfile: User = {
              uid: user.uid,
              displayName: user.displayName || "",
              email: user.email || "",
              totalSpentCents: 0,
              phone: "",
              isNewAccount: true,
              createdAt: serverTimestamp() as any,
            };
            await setDoc(ref, newProfile);
            // onSnapshot will fire again after setDoc
          }
          setLoading(false);
        });

        profileUnsubRef.current = unsubProfile;
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (profileUnsubRef.current) profileUnsubRef.current();
    };
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
