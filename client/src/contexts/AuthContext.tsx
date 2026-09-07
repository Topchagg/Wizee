"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";

// SUPERADMIN exists but is never offered as a choice anywhere in the UI —
// it's grantable only by an operator editing the DB directly (see the Role
// enum in schema.prisma). Treated as tutor-or-above wherever the app checks
// for TUTOR — see canCreate below.
export type Role = "TUTOR" | "LEARNER" | "SUPERADMIN";
export type AppUser = { id: string; email: string; displayName: string | null; role: Role | null };

// The single place every "can this user create paths/content" check goes
// through, so SUPERADMIN doesn't need special-casing at each call site.
export function canCreate(role: Role | null | undefined): boolean {
  return role === "TUTOR" || role === "SUPERADMIN";
}

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  appUser: AppUser | null;
  // True whenever appUser doesn't yet reflect the current sign-in state —
  // starts true (not false) specifically so there's no gap, right after
  // `user` becomes truthy, where a consumer could read appUserLoading=false
  // and appUser=null together and wrongly conclude "definitely no role yet".
  appUserLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [appUserLoading, setAppUserLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const refreshAppUser = async () => {
    const res = await apiFetch("/auth/me");
    setAppUser(res.ok ? ((await res.json()) as AppUser) : null);
  };

  useEffect(() => {
    // appUser is only ever read alongside `user` being truthy (Header,
    // RoleGate), so there's nothing to reset here when signed out — just
    // skip the fetch, matching the same pattern used on the home page.
    if (!user) return;
    void Promise.resolve()
      .then(() => {
        setAppUserLoading(true);
        return refreshAppUser();
      })
      .finally(() => setAppUserLoading(false));
  }, [user]);

  const signInWithGoogle = async () => {
    await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  };

  const signOut = async () => {
    await firebaseSignOut(getFirebaseAuth());
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, appUser, appUserLoading, signInWithGoogle, signOut, refreshAppUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
