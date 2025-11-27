"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "./client";
import { useHistoryStore, type HistoryEntry } from "@/store/historyStore";

interface SupabaseRequest {
  id: string;
  original_text: string;
  improved_text: string;
  created_at: string;
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const localStore = useHistoryStore();
  const supabase = createClient();

  // Load entries based on auth state
  useEffect(() => {
    const loadEntries = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        const { data } = await supabase
          .from("requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (data) {
          setEntries(
            data.map((r: SupabaseRequest) => ({
              id: r.id,
              original: r.original_text,
              improved: r.improved_text,
              timestamp: new Date(r.created_at).getTime(),
            }))
          );
        }
      } else {
        setIsAuthenticated(false);
        setEntries(localStore.entries);
      }
      setIsLoading(false);
    };

    loadEntries();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadEntries();
    });

    return () => subscription.unsubscribe();
  }, [supabase, localStore.entries]);

  const addEntry = useCallback(
    async (original: string, improved: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("requests")
          .insert({
            user_id: user.id,
            original_text: original,
            improved_text: improved,
          })
          .select()
          .single();

        if (data && !error) {
          setEntries((prev) => [
            {
              id: data.id,
              original: data.original_text,
              improved: data.improved_text,
              timestamp: new Date(data.created_at).getTime(),
            },
            ...prev,
          ]);
        }
      } else {
        localStore.addEntry(original, improved);
        setEntries(localStore.entries);
      }
    },
    [supabase, localStore]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("requests").delete().eq("id", id);
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        localStore.deleteEntry(id);
        setEntries(localStore.entries);
      }
    },
    [supabase, localStore]
  );

  const clearAll = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("requests").delete().eq("user_id", user.id);
      setEntries([]);
    } else {
      localStore.clearAll();
      setEntries([]);
    }
  }, [supabase, localStore]);

  return {
    entries,
    addEntry,
    deleteEntry,
    clearAll,
    isAuthenticated,
    isLoading,
  };
}
