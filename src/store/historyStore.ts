import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HistoryEntry {
  id: string;
  original: string;
  improved: string;
  timestamp: number;
}

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (original: string, improved: string) => void;
  deleteEntry: (id: string) => void;
  clearAll: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (original, improved) =>
        set((state) => ({
          entries: [
            {
              id: crypto.randomUUID(),
              original,
              improved,
              timestamp: Date.now(),
            },
            ...state.entries,
          ],
        })),

      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        })),

      clearAll: () => set({ entries: [] }),
    }),
    {
      name: "betterEnglish_history",
    }
  )
);
