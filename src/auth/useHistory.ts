"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/auth/client";
import { useHistoryStore, type HistoryEntry } from "@/store/historyStore";

interface HistoryResponse {
  entries: HistoryEntry[];
}

export function useHistory() {
  const { data: session, isPending } = useSession();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const localStore = useHistoryStore();
  const isAuthenticated = !!session;

  const refetch = useCallback(async () => {
    if (!session) {
      setEntries(localStore.entries);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = (await res.json()) as HistoryResponse;
        setEntries(data.entries);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setIsLoading(false);
    }
  }, [session, localStore.entries]);

  useEffect(() => {
    if (isPending) return;
    refetch();
  }, [isPending, refetch]);

  const addEntry = useCallback(
    async (original: string, improved: string) => {
      if (session) {
        // Authenticated: server side wrote the row via /api/improve.
        // Just refetch to pick up the new entry.
        await refetch();
      } else {
        localStore.addEntry(original, improved);
        setEntries(localStore.entries);
      }
    },
    [session, localStore, refetch]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (session) {
        await fetch("/api/history", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id }),
        });
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        localStore.deleteEntry(id);
        setEntries(localStore.entries);
      }
    },
    [session, localStore]
  );

  const clearAll = useCallback(async () => {
    if (session) {
      await fetch("/api/history", { method: "DELETE" });
      setEntries([]);
    } else {
      localStore.clearAll();
      setEntries([]);
    }
  }, [session, localStore]);

  return {
    entries,
    addEntry,
    deleteEntry,
    clearAll,
    isAuthenticated,
    isLoading: isLoading || isPending,
  };
}
