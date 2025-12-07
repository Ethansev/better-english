import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tone = "casual" | "formal";

interface PreferencesState {
  tone: Tone;
  setTone: (tone: Tone) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      tone: "casual",

      setTone: (tone) => set({ tone }),
    }),
    {
      name: "betterEnglish_preferences",
    }
  )
);
