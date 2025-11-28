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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async (userId: string): Promise<boolean> => {
      try {
        const profilePromise = supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", userId)
          .single();

        // Timeout to prevent hanging on slow/stuck queries
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Profile query timeout")), 3000)
        );

        const { data: profile } = await Promise.race([
          profilePromise,
          timeoutPromise,
        ]);
        return profile?.is_admin || false;
      } catch {
        return false;
      }
    };

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        const adminStatus = await fetchProfile(data.user.id);
        setIsAdmin(adminStatus);
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
          const adminStatus = await fetchProfile(session.user.id);
          setIsAdmin(adminStatus);
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
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    signInWithGoogle,
    signInWithGitHub,
    signUpWithEmail,
    signInWithEmail,
    signOut,
  };
}
