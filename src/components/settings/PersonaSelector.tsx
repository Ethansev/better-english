"use client";

import Image from "next/image";
import { PERSONAS } from "@/data/personas";
import type { PersonaId, Persona } from "@/types/personality";

interface PersonaSelectorProps {
  selectedPersona: PersonaId | null;
  onSelectPersona: (persona: Persona) => void;
  onClearPersona: () => void;
  disabled?: boolean;
}

export function PersonaSelector({
  selectedPersona,
  onSelectPersona,
  onClearPersona,
  disabled,
}: PersonaSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PERSONAS.map((persona) => {
          const isSelected = selectedPersona === persona.id;
          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => onSelectPersona(persona)}
              disabled={disabled}
              className={`group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              } ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title={persona.description}
            >
              <div className={`relative w-20 h-20 rounded-full overflow-hidden mb-3 ring-2 transition-all ${
                isSelected ? "ring-blue-500" : "ring-gray-200 dark:ring-gray-700 group-hover:ring-gray-300 dark:group-hover:ring-gray-600"
              }`}>
                <Image
                  src={persona.avatarPath}
                  alt={persona.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <span className={`text-sm font-semibold text-center ${
                isSelected ? "text-blue-600 dark:text-blue-400" : "text-foreground"
              }`}>
                {persona.name}
              </span>
              <span className="text-xs text-foreground/60 text-center">
                {persona.title}
              </span>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}

        {/* Custom option */}
        <button
          type="button"
          onClick={onClearPersona}
          disabled={disabled}
          className={`group relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all min-h-[160px] ${
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          } ${
            selectedPersona === null
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title="Configure your own custom settings"
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 ${
            selectedPersona === null
              ? "bg-blue-100 dark:bg-blue-900/50"
              : "bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600"
          }`}>
            <svg
              className={`w-8 h-8 ${
                selectedPersona === null ? "text-blue-500" : "text-foreground/50"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <span className={`text-sm font-semibold text-center ${
            selectedPersona === null ? "text-blue-600 dark:text-blue-400" : "text-foreground"
          }`}>
            Custom
          </span>
          <span className="text-xs text-foreground/60 text-center">
            Your own settings
          </span>
          {selectedPersona === null && (
            <div className="absolute top-2 right-2">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </button>
      </div>

      {/* Description text */}
      {selectedPersona && (
        <p className="text-sm text-foreground/70 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          {PERSONAS.find((p) => p.id === selectedPersona)?.description}
        </p>
      )}
    </div>
  );
}
