"use client";

import { useState, useEffect } from "react";
import { MAX_CUSTOM_INSTRUCTIONS_LENGTH } from "@/types/personality";

interface CustomInstructionsEditorProps {
  value: string | null;
  onChange: (instructions: string | null) => void;
  disabled?: boolean;
}

export function CustomInstructionsEditor({ value, onChange, disabled }: CustomInstructionsEditorProps) {
  const [localValue, setLocalValue] = useState(value || "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalValue(value || "");
    setHasChanges(false);
  }, [value]);

  const handleChange = (newValue: string) => {
    if (newValue.length <= MAX_CUSTOM_INSTRUCTIONS_LENGTH) {
      setLocalValue(newValue);
      setHasChanges(newValue !== (value || ""));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onChange(localValue.trim() || null);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const charCount = localValue.length;
  const isNearLimit = charCount > MAX_CUSTOM_INSTRUCTIONS_LENGTH * 0.8;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Custom Instructions
      </label>
      <textarea
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Add any specific preferences for how the AI should rewrite your text. For example: 'Avoid using exclamation marks' or 'Always use Oxford commas'"
        className={`w-full h-32 px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-foreground placeholder-foreground/40 border border-transparent focus:border-blue-500 focus:outline-none resize-none ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        maxLength={MAX_CUSTOM_INSTRUCTIONS_LENGTH}
        disabled={disabled}
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            isNearLimit ? "text-amber-500" : "text-foreground/50"
          }`}
        >
          {charCount}/{MAX_CUSTOM_INSTRUCTIONS_LENGTH}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving || disabled}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            hasChanges && !isSaving && !disabled
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 dark:bg-gray-700 text-foreground/50 cursor-not-allowed"
          }`}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
      <p className="text-xs text-foreground/50">
        These instructions are added to every request to personalize your results.
      </p>
    </div>
  );
}
