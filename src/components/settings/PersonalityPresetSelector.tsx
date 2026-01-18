"use client";

import { PERSONALITY_PRESETS, type PersonalityPreset } from "@/types/personality";

interface PersonalityPresetSelectorProps {
  value: PersonalityPreset | null;
  onChange: (preset: PersonalityPreset | null) => void;
  disabled?: boolean;
}

export function PersonalityPresetSelector({ value, onChange, disabled }: PersonalityPresetSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Style Preset
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled || value === null}
          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            disabled ? "cursor-not-allowed opacity-60" : value === null ? "cursor-default" : "cursor-pointer"
          } ${
            value === null
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          None
        </button>
        {PERSONALITY_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            disabled={disabled || value === preset.value}
            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              disabled ? "cursor-not-allowed opacity-60" : value === preset.value ? "cursor-default" : "cursor-pointer"
            } ${
              value === preset.value
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
            title={preset.description}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-foreground/50">
        {value
          ? PERSONALITY_PRESETS.find((p) => p.value === value)?.description
          : "No additional style modifications applied"}
      </p>
    </div>
  );
}
