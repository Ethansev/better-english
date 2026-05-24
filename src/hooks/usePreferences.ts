"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/auth/client";
import { usePreferencesStore } from "@/store/preferencesStore";
import type {
  Tone,
  Verbosity,
  PersonalityPreset,
  PersonalitySettings,
  PersonaId,
  Persona,
} from "@/types/personality";

interface ServerProfile {
  tonePreference: Tone | null;
  verbosityPreference: Verbosity | null;
  personalityPreset: PersonalityPreset | null;
  customInstructions: string | null;
  selectedPersona: PersonaId | null;
}

async function patchPreferences(
  patch: Partial<{
    tonePreference: Tone;
    verbosityPreference: Verbosity;
    personalityPreset: PersonalityPreset | null;
    customInstructions: string | null;
    selectedPersona: PersonaId | null;
  }>
) {
  await fetch("/api/preferences", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export function usePreferences() {
  const { data: session, isPending } = useSession();
  const [tone, setToneState] = useState<Tone>("casual");
  const [verbosity, setVerbosityState] = useState<Verbosity>("balanced");
  const [personalityPreset, setPersonalityPresetState] =
    useState<PersonalityPreset | null>(null);
  const [customInstructions, setCustomInstructionsState] = useState<
    string | null
  >(null);
  const [selectedPersona, setSelectedPersonaState] = useState<PersonaId | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const localStore = usePreferencesStore();

  useEffect(() => {
    if (isPending) return;

    const loadPreferences = async () => {
      if (!session) {
        // Anonymous user - use local store
        setToneState(localStore.tone);
        setVerbosityState(localStore.verbosity);
        setPersonalityPresetState(localStore.personalityPreset);
        setCustomInstructionsState(localStore.customInstructions);
        setSelectedPersonaState(localStore.selectedPersona);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const { profile } = (await res.json()) as { profile: ServerProfile | null };
          if (profile) {
            setToneState((profile.tonePreference as Tone) || localStore.tone);
            setVerbosityState(
              (profile.verbosityPreference as Verbosity) || localStore.verbosity
            );
            setPersonalityPresetState(
              profile.personalityPreset ?? localStore.personalityPreset
            );
            setCustomInstructionsState(
              profile.customInstructions ?? localStore.customInstructions
            );
            setSelectedPersonaState(
              profile.selectedPersona ?? localStore.selectedPersona
            );
          } else {
            setToneState(localStore.tone);
            setVerbosityState(localStore.verbosity);
            setPersonalityPresetState(localStore.personalityPreset);
            setCustomInstructionsState(localStore.customInstructions);
            setSelectedPersonaState(localStore.selectedPersona);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [session, isPending, localStore]);

  const setTone = useCallback(
    async (newTone: Tone) => {
      setToneState(newTone);
      localStore.setTone(newTone);

      if (!session) return;

      setIsSaving(true);
      try {
        await patchPreferences({ tonePreference: newTone });
      } finally {
        setIsSaving(false);
      }
    },
    [session, localStore]
  );

  const setVerbosity = useCallback(
    async (newVerbosity: Verbosity) => {
      setVerbosityState(newVerbosity);
      localStore.setVerbosity(newVerbosity);

      if (!session) return;

      setIsSaving(true);
      try {
        await patchPreferences({ verbosityPreference: newVerbosity });
      } finally {
        setIsSaving(false);
      }
    },
    [session, localStore]
  );

  const setPersonalityPreset = useCallback(
    async (newPreset: PersonalityPreset | null) => {
      setPersonalityPresetState(newPreset);
      localStore.setPersonalityPreset(newPreset);

      if (!session) return;

      setIsSaving(true);
      try {
        await patchPreferences({ personalityPreset: newPreset });
      } finally {
        setIsSaving(false);
      }
    },
    [session, localStore]
  );

  const setCustomInstructions = useCallback(
    async (newInstructions: string | null) => {
      setCustomInstructionsState(newInstructions);
      localStore.setCustomInstructions(newInstructions);

      if (!session) return;

      setIsSaving(true);
      try {
        await patchPreferences({ customInstructions: newInstructions });
      } finally {
        setIsSaving(false);
      }
    },
    [session, localStore]
  );

  const updateSettings = useCallback(
    async (settings: Partial<PersonalitySettings>) => {
      if (settings.tone !== undefined) setToneState(settings.tone);
      if (settings.verbosity !== undefined) setVerbosityState(settings.verbosity);
      if (settings.personalityPreset !== undefined)
        setPersonalityPresetState(settings.personalityPreset);
      if (settings.customInstructions !== undefined)
        setCustomInstructionsState(settings.customInstructions);

      localStore.setAllPersonalitySettings(settings);

      if (!session) return;

      setIsSaving(true);
      try {
        const patch: Parameters<typeof patchPreferences>[0] = {};
        if (settings.tone !== undefined) patch.tonePreference = settings.tone;
        if (settings.verbosity !== undefined)
          patch.verbosityPreference = settings.verbosity;
        if (settings.personalityPreset !== undefined)
          patch.personalityPreset = settings.personalityPreset;
        if (settings.customInstructions !== undefined)
          patch.customInstructions = settings.customInstructions;
        await patchPreferences(patch);
      } finally {
        setIsSaving(false);
      }
    },
    [session, localStore]
  );

  const applyPersona = useCallback(
    async (persona: Persona) => {
      setSelectedPersonaState(persona.id);
      setToneState(persona.settings.tone);
      setVerbosityState(persona.settings.verbosity);
      setPersonalityPresetState(persona.settings.personalityPreset);
      setCustomInstructionsState(persona.settings.customInstructions);

      localStore.applyPersona(persona);

      if (!session) return;

      setIsSaving(true);
      try {
        await patchPreferences({
          selectedPersona: persona.id,
          tonePreference: persona.settings.tone,
          verbosityPreference: persona.settings.verbosity,
          personalityPreset: persona.settings.personalityPreset,
          customInstructions: persona.settings.customInstructions,
        });
      } finally {
        setIsSaving(false);
      }
    },
    [session, localStore]
  );

  const clearPersona = useCallback(async () => {
    const previousSettings = localStore.previousSettings;

    if (previousSettings) {
      setToneState(previousSettings.tone);
      setVerbosityState(previousSettings.verbosity);
      setPersonalityPresetState(previousSettings.personalityPreset);
      setCustomInstructionsState(previousSettings.customInstructions);
    }

    setSelectedPersonaState(null);
    localStore.clearPersona();

    if (!session) return;

    setIsSaving(true);
    try {
      const patch: Parameters<typeof patchPreferences>[0] = {
        selectedPersona: null,
      };
      if (previousSettings) {
        patch.tonePreference = previousSettings.tone;
        patch.verbosityPreference = previousSettings.verbosity;
        patch.personalityPreset = previousSettings.personalityPreset;
        patch.customInstructions = previousSettings.customInstructions;
      }
      await patchPreferences(patch);
    } finally {
      setIsSaving(false);
    }
  }, [session, localStore]);

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
