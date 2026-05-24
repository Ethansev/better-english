"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { authClient, useSession } from "@/auth/client";

type AuthErrorLike = { message: string } | null;
type AuthResult = { error: AuthErrorLike };

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function useAuth() {
  const { data: session, isPending } = useSession();
  const hasMounted = useIsMounted();
  const [adminFromServer, setAdminFromServer] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setAdminFromServer(data.isAdmin === true);
      })
      .catch(() => {
        // Leave previous value; isAdmin gate below requires session anyway
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const isAdmin = !!session && adminFromServer;

  const signInWithGoogle = useCallback(async () => {
    await authClient.signIn.social({ provider: "google", callbackURL: "/" });
  }, []);

  const signInWithGitHub = useCallback(async () => {
    await authClient.signIn.social({ provider: "github", callbackURL: "/" });
  }, []);

  const signOut = useCallback(async () => {
    await authClient.signOut();
  }, []);

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      name: string
    ): Promise<AuthResult> => {
      const { error } = await authClient.signUp.email({ email, password, name });
      if (typeof window !== "undefined") {
        localStorage.removeItem("betterEnglish_rateLimitResetsAt");
      }
      return { error: error ? { message: error.message ?? "Sign up failed" } : null };
    },
    []
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await authClient.signIn.email({ email, password });
      if (typeof window !== "undefined") {
        localStorage.removeItem("betterEnglish_rateLimitResetsAt");
      }
      return { error: error ? { message: error.message ?? "Sign in failed" } : null };
    },
    []
  );

  const user = session?.user ?? null;

  return {
    user,
    isLoading: isPending || !hasMounted,
    isAuthenticated: !!user,
    isAdmin: hasMounted && isAdmin,
    signInWithGoogle,
    signInWithGitHub,
    signUpWithEmail,
    signInWithEmail,
    signOut,
  };
}
