"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "./client";
import type {
  User,
  AuthError,
  Session,
  AuthChangeEvent,
} from "@supabase/supabase-js";

type AuthResult = {
  error: AuthError | null;
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const supabase = createClient();

  // Read cookie immediately on mount for instant admin status
  useEffect(() => {
    setHasMounted(true);
    const cookieAdmin = getCookie("is_admin") === "true";
    setIsAdmin(cookieAdmin);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      // Admin status is set by middleware via cookie, just read it
      if (data.user) {
        const cookieAdmin = getCookie("is_admin") === "true";
        setIsAdmin(cookieAdmin);
      } else {
        setIsAdmin(false);
      }

      setIsLoading(false);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          // Cookie will be updated by middleware on next request
          // For now, read current cookie value
          const cookieAdmin = getCookie("is_admin") === "true";
          setIsAdmin(cookieAdmin);
        } else {
          setIsAdmin(false);
        }

        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }, [supabase.auth]);

  const signInWithGitHub = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    // Clear the is_admin cookie
    document.cookie = "is_admin=; path=/; max-age=0";
    await supabase.auth.signOut();
  }, [supabase.auth]);

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      name: string
    ): Promise<AuthResult> => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      return { error };
    },
    [supabase.auth]
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    [supabase.auth]
  );

  return {
    user,
    isLoading: isLoading || !hasMounted,
    isAuthenticated: !!user,
    isAdmin,
    signInWithGoogle,
    signInWithGitHub,
    signUpWithEmail,
    signInWithEmail,
    signOut,
  };
}
