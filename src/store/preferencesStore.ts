import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tone = "casual" | "formal";
export type SortColumn = "user" | "count" | "lastActive";
export type SortDirection = "asc" | "desc";

interface PreferencesState {
  tone: Tone;
  setTone: (tone: Tone) => void;
  // Admin preferences
  adminUsersSortColumn: SortColumn;
  adminUsersSortDirection: SortDirection;
  setAdminUsersSort: (column: SortColumn, direction: SortDirection) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      tone: "casual",
      setTone: (tone) => set({ tone }),

      // Admin preferences - default to lastActive descending
      adminUsersSortColumn: "lastActive",
      adminUsersSortDirection: "desc",
      setAdminUsersSort: (column, direction) =>
        set({ adminUsersSortColumn: column, adminUsersSortDirection: direction }),
    }),
    {
      name: "betterEnglish_preferences",
    }
  )
);
