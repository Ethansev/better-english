"use client";

import Link from "next/link";
import { useAuth } from "@/supabase/useAuth";

export function AuthButton() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="h-9 w-20 bg-foreground/10 rounded-lg animate-pulse" />
    );
  }

  if (user) {
    return (
      <button
        onClick={() => signOut()}
        className="text-sm text-foreground/60 hover:text-foreground transition-colors px-3 py-1.5"
      >
        Sign out
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="text-sm bg-foreground text-background px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
    >
      Sign in
    </Link>
  );
}
