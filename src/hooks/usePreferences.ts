"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/supabase/client";
import { usePreferencesStore, type Tone } from "@/store/preferencesStore";

export function usePreferences() {
  const [tone, setToneState] = useState<Tone>("casual");
  const [isLoading, setIsLoading] = useState(true);

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
          .select("tone_preference")
          .eq("id", user.id)
          .single();

        if (data?.tone_preference) {
          setToneState(data.tone_preference as Tone);
        } else {
          setToneState(localStore.tone);
        }
      } else {
        setToneState(localStore.tone);
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
  }, [supabase, localStore.tone]);

  const setTone = useCallback(
    async (newTone: Tone) => {
      setToneState(newTone);

      localStore.setTone(newTone);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .update({ tone_preference: newTone })
          .eq("id", user.id);
      }
    },
    [supabase, localStore]
  );

  return {
    tone,
    setTone,
    isLoading,
  };
}
