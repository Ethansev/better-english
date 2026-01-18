"use client";

import { VERBOSITY_OPTIONS, type Verbosity } from "@/types/personality";

interface VerbositySelectorProps {
  value: Verbosity;
  onChange: (verbosity: Verbosity) => void;
  disabled?: boolean;
}

export function VerbositySelector({ value, onChange, disabled }: VerbositySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Output Length
      </label>
      <div className="flex gap-2">
        {VERBOSITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled || value === option.value}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              disabled ? "cursor-not-allowed opacity-60" : value === option.value ? "cursor-default" : "cursor-pointer"
            } ${
              value === option.value
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-foreground/50">
        {VERBOSITY_OPTIONS.find((o) => o.value === value)?.description}
      </p>
    </div>
  );
}
