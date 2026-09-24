"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User } from "@/types";
interface AuthContextType {
  firebaseUser: FirebaseUser | null; userProfile: User | null; loading: boolean; profileError: string; isAdmin: boolean;
  signOut: () => Promise<void>; refreshProfile: () => void;
}
const AuthContext = createContext<AuthContextType>({ firebaseUser:null,userProfile:null,loading:true,profileError:"",isAdmin:false,signOut:async()=>{},refreshProfile:()=>{} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser,setFirebaseUser]=useState<FirebaseUser|null>(null);
  const [userProfile,setUserProfile]=useState<User|null>(null);
  const [loading,setLoading]=useState(true);
  const [profileError,setProfileError]=useState("");
  const [isAdmin,setIsAdmin]=useState(false);
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    let generation=0;
    let unsubscribeProfile: (()=>void)|undefined;
    const unsubscribeAuth=onAuthStateChanged(auth,async user=>{
      const current=++generation;
      unsubscribeProfile?.();
      setFirebaseUser(user);setUserProfile(null);setProfileError("");setIsAdmin(false);
      if(!user){setLoading(false);return;}
      setLoading(true);
      try {
        const token=await user.getIdToken();
        const response=await fetch("/api/profile",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:"{}"});
        if(!response.ok) throw new Error("Profile could not be loaded.");
        const result=await response.json();
        if(current!==generation)return;
        setIsAdmin(result.admin===true);
        unsubscribeProfile=onSnapshot(doc(db,"users",user.uid),snap=>{
          if(current!==generation)return;
          if(snap.exists())setUserProfile({uid:user.uid,...snap.data()} as User);
          setLoading(false);
        },()=>{if(current===generation){setProfileError("Profile could not be loaded.");setLoading(false);}});
      }catch {if(current===generation){setProfileError("Profile could not be loaded.");setLoading(false);}}
    });
    return ()=>{generation++;unsubscribeAuth();unsubscribeProfile?.();};
  },[revision]);
  return <AuthContext.Provider value={{firebaseUser,userProfile,loading,profileError,isAdmin,signOut:()=>firebaseSignOut(auth),refreshProfile:()=>setRevision(value=>value+1)}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);