"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/supabase/client";
import { usePreferencesStore } from "@/store/preferencesStore";
import type { Tone, Verbosity, PersonalityPreset, PersonalitySettings, PersonaId, Persona } from "@/types/personality";
import { getPersonaById } from "@/data/personas";

export function usePreferences() {
  const [tone, setToneState] = useState<Tone>("casual");
  const [verbosity, setVerbosityState] = useState<Verbosity>("balanced");
  const [personalityPreset, setPersonalityPresetState] = useState<PersonalityPreset | null>(null);
  const [customInstructions, setCustomInstructionsState] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersonaState] = useState<PersonaId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const localStore = usePreferencesStore();
  const supabase = createClient();

  useEffect(() => {
    const loadPreferences = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("tone_preference, verbosity_preference, personality_preset, custom_instructions, selected_persona")
          .eq("id", user.id)
          .single();

        if (data) {
          setToneState((data.tone_preference as Tone) || localStore.tone);
          setVerbosityState((data.verbosity_preference as Verbosity) || localStore.verbosity);
          setPersonalityPresetState((data.personality_preset as PersonalityPreset) || localStore.personalityPreset);
          setCustomInstructionsState(data.custom_instructions || localStore.customInstructions);
          setSelectedPersonaState((data.selected_persona as PersonaId) || localStore.selectedPersona);
        } else {
          // Fall back to local store
          setToneState(localStore.tone);
          setVerbosityState(localStore.verbosity);
          setPersonalityPresetState(localStore.personalityPreset);
          setCustomInstructionsState(localStore.customInstructions);
          setSelectedPersonaState(localStore.selectedPersona);
        }
      } else {
        // Anonymous user - use local store
        setToneState(localStore.tone);
        setVerbosityState(localStore.verbosity);
        setPersonalityPresetState(localStore.personalityPreset);
        setCustomInstructionsState(localStore.customInstructions);
        setSelectedPersonaState(localStore.selectedPersona);
      }
      setIsLoading(false);
    };

    loadPreferences();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadPreferences();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const setTone = useCallback(
    async (newTone: Tone) => {
      setToneState(newTone);
      localStore.setTone(newTone);

      setIsSaving(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase
            .from("profiles")
            .update({ tone_preference: newTone })
            .eq("id", user.id);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, localStore]
  );

  const setVerbosity = useCallback(
    async (newVerbosity: Verbosity) => {
      setVerbosityState(newVerbosity);
      localStore.setVerbosity(newVerbosity);

      setIsSaving(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase
            .from("profiles")
            .update({ verbosity_preference: newVerbosity })
            .eq("id", user.id);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, localStore]
  );

  const setPersonalityPreset = useCallback(
    async (newPreset: PersonalityPreset | null) => {
      setPersonalityPresetState(newPreset);
      localStore.setPersonalityPreset(newPreset);

      setIsSaving(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase
            .from("profiles")
            .update({ personality_preset: newPreset })
            .eq("id", user.id);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, localStore]
  );

  const setCustomInstructions = useCallback(
    async (newInstructions: string | null) => {
      setCustomInstructionsState(newInstructions);
      localStore.setCustomInstructions(newInstructions);

      setIsSaving(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase
            .from("profiles")
            .update({ custom_instructions: newInstructions })
            .eq("id", user.id);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, localStore]
  );

  const updateSettings = useCallback(
    async (settings: Partial<PersonalitySettings>) => {
      // Update local state
      if (settings.tone !== undefined) setToneState(settings.tone);
      if (settings.verbosity !== undefined) setVerbosityState(settings.verbosity);
      if (settings.personalityPreset !== undefined) setPersonalityPresetState(settings.personalityPreset);
      if (settings.customInstructions !== undefined) setCustomInstructionsState(settings.customInstructions);

      // Update local store
      localStore.setAllPersonalitySettings(settings);

      setIsSaving(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Map to database column names
          const dbUpdate: Record<string, unknown> = {};
          if (settings.tone !== undefined) dbUpdate.tone_preference = settings.tone;
          if (settings.verbosity !== undefined) dbUpdate.verbosity_preference = settings.verbosity;
          if (settings.personalityPreset !== undefined) dbUpdate.personality_preset = settings.personalityPreset;
          if (settings.customInstructions !== undefined) dbUpdate.custom_instructions = settings.customInstructions;

          await supabase
            .from("profiles")
            .update(dbUpdate)
            .eq("id", user.id);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, localStore]
  );

  const applyPersona = useCallback(
    async (persona: Persona) => {
      // Update all local states
      setSelectedPersonaState(persona.id);
      setToneState(persona.settings.tone);
      setVerbosityState(persona.settings.verbosity);
      setPersonalityPresetState(persona.settings.personalityPreset);
      setCustomInstructionsState(persona.settings.customInstructions);

      // Update local store
      localStore.applyPersona(persona);

      setIsSaving(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase
            .from("profiles")
            .update({
              selected_persona: persona.id,
              tone_preference: persona.settings.tone,
              verbosity_preference: persona.settings.verbosity,
              personality_preset: persona.settings.personalityPreset,
              custom_instructions: persona.settings.customInstructions,
            })
            .eq("id", user.id);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, localStore]
  );

  const clearPersona = useCallback(
    async () => {
      // Get previous settings before clearing
      const previousSettings = localStore.previousSettings;

      // Restore previous settings if available
      if (previousSettings) {
        setToneState(previousSettings.tone);
        setVerbosityState(previousSettings.verbosity);
        setPersonalityPresetState(previousSettings.personalityPreset);
        setCustomInstructionsState(previousSettings.customInstructions);
      }

      setSelectedPersonaState(null);
      localStore.clearPersona();

      setIsSaving(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Persist restored settings along with clearing persona
          const updateData: Record<string, unknown> = { selected_persona: null };
          if (previousSettings) {
            updateData.tone_preference = previousSettings.tone;
            updateData.verbosity_preference = previousSettings.verbosity;
            updateData.personality_preset = previousSettings.personalityPreset;
            updateData.custom_instructions = previousSettings.customInstructions;
          }
          await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", user.id);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, localStore]
  );

  return {
    tone,
    setTone,
    verbosity,
    setVerbosity,
    personalityPreset,
    setPersonalityPreset,
    customInstructions,
    setCustomInstructions,
    updateSettings,
    selectedPersona,
    applyPersona,
    clearPersona,
    isLoading,
    isSaving,
  };
}
