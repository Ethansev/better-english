import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tone, Verbosity, PersonalityPreset, PersonalitySettings, PersonaId, Persona } from "@/types/personality";

export type { Tone, Verbosity, PersonalityPreset, PersonalitySettings, PersonaId };
export type SortColumn = "user" | "count" | "lastActive";
export type SortDirection = "asc" | "desc";

interface PreferencesState {
  // Personality settings
  tone: Tone;
  verbosity: Verbosity;
  personalityPreset: PersonalityPreset | null;
  customInstructions: string | null;
  selectedPersona: PersonaId | null;
  previousSettings: PersonalitySettings | null;
  setTone: (tone: Tone) => void;
  setVerbosity: (verbosity: Verbosity) => void;
  setPersonalityPreset: (preset: PersonalityPreset | null) => void;
  setCustomInstructions: (instructions: string | null) => void;
  setAllPersonalitySettings: (settings: Partial<PersonalitySettings>) => void;
  setSelectedPersona: (id: PersonaId | null) => void;
  applyPersona: (persona: Persona) => void;
  clearPersona: () => void;
  // Admin preferences
  adminUsersSortColumn: SortColumn;
  adminUsersSortDirection: SortDirection;
  setAdminUsersSort: (column: SortColumn, direction: SortDirection) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      // Personality settings defaults
      tone: "casual",
      verbosity: "balanced",
      personalityPreset: null,
      customInstructions: null,
      selectedPersona: null,
      previousSettings: null,
      setTone: (tone) => set({ tone }),
      setVerbosity: (verbosity) => set({ verbosity }),
      setPersonalityPreset: (personalityPreset) => set({ personalityPreset }),
      setCustomInstructions: (customInstructions) => set({ customInstructions }),
      setAllPersonalitySettings: (settings) => set(settings),
      setSelectedPersona: (selectedPersona) => set({ selectedPersona }),
      applyPersona: (persona) =>
        set((state) => ({
          // Only save previous settings if not already in a persona
          previousSettings:
            state.selectedPersona === null
              ? {
                  tone: state.tone,
                  verbosity: state.verbosity,
                  personalityPreset: state.personalityPreset,
                  customInstructions: state.customInstructions,
                }
              : state.previousSettings,
          selectedPersona: persona.id,
          tone: persona.settings.tone,
          verbosity: persona.settings.verbosity,
          personalityPreset: persona.settings.personalityPreset,
          customInstructions: persona.settings.customInstructions,
        })),
      clearPersona: () =>
        set((state) => ({
          selectedPersona: null,
          // Restore previous settings if available
          ...(state.previousSettings ? state.previousSettings : {}),
          previousSettings: null,
        })),

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
