"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { AuthButton } from "@/components/AuthButton";
import { ToneSlider } from "@/components/ToneSlider";
import { VerbositySelector } from "@/components/settings/VerbositySelector";
import { PersonalityPresetSelector } from "@/components/settings/PersonalityPresetSelector";
import { CustomInstructionsEditor } from "@/components/settings/CustomInstructionsEditor";
import { PersonaSelector } from "@/components/settings/PersonaSelector";
import { usePreferences } from "@/hooks/usePreferences";

export default function SettingsPage() {
  const {
    tone,
    setTone,
    verbosity,
    setVerbosity,
    personalityPreset,
    setPersonalityPreset,
    customInstructions,
    setCustomInstructions,
    selectedPersona,
    applyPersona,
    clearPersona,
    isLoading,
    isSaving,
  } = usePreferences();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-card-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo size={28} />
            BetterEnglish
          </Link>
          <div className="flex items-center gap-3">
            <AuthButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-foreground/60 mb-8">
          Customize how the AI rewrites your text.
        </p>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-card border border-card-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Writing Persona</h2>
              <p className="text-sm text-foreground/60 mb-4">
                Choose a persona to instantly apply their writing style, or use custom settings.
              </p>
              <PersonaSelector
                selectedPersona={selectedPersona}
                onSelectPersona={applyPersona}
                onClearPersona={clearPersona}
                disabled={isSaving}
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-background text-sm text-foreground/50">
                  {selectedPersona ? "Persona settings (read-only)" : "Or configure your own settings manually"}
                </span>
              </div>
            </div>

            {selectedPersona && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-8.364l-1.414 1.414M21 12h-2m0 0h-2m2 0v2m0-2v-2M3 12h2m0 0h2m-2 0v2m0-2v-2m3.636-4.364l1.414 1.414M12 3v2m0 0v2m0-2h2m-2 0H10" />
                  </svg>
                  <span className="text-sm font-medium">Settings are locked while using a persona. Select &ldquo;Custom&rdquo; above to edit.</span>
                </div>
              </div>
            )}

            <div className={`p-6 rounded-xl bg-card border border-card-border ${selectedPersona ? "opacity-60" : ""}`}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Tone</h2>
              <ToneSlider value={tone} onChange={setTone} disabled={isSaving || selectedPersona !== null} />
              <p className="mt-3 text-xs text-foreground/50">
                Casual is great for everyday communication. Formal is better for professional emails and documents.
              </p>
            </div>

            <div className={`p-6 rounded-xl bg-card border border-card-border ${selectedPersona ? "opacity-60" : ""}`}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Output Length</h2>
              <VerbositySelector value={verbosity} onChange={setVerbosity} disabled={isSaving || selectedPersona !== null} />
            </div>

            <div className={`p-6 rounded-xl bg-card border border-card-border ${selectedPersona ? "opacity-60" : ""}`}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Style Preset</h2>
              <PersonalityPresetSelector value={personalityPreset} onChange={setPersonalityPreset} disabled={isSaving || selectedPersona !== null} />
            </div>

            <div className={`p-6 rounded-xl bg-card border border-card-border ${selectedPersona ? "opacity-60" : ""}`}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Custom Instructions</h2>
              <CustomInstructionsEditor value={customInstructions} onChange={setCustomInstructions} disabled={isSaving || selectedPersona !== null} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
