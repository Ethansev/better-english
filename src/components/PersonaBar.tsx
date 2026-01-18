"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { PERSONAS } from "@/data/personas";
import type { Tone, Verbosity, PersonalityPreset, PersonaId, Persona } from "@/types/personality";

interface PersonaBarProps {
  selectedPersona: PersonaId | null;
  tone: Tone;
  verbosity: Verbosity;
  personalityPreset: PersonalityPreset | null;
  onSelectPersona: (persona: Persona) => void;
  onClearPersona: () => void;
}

// Helper to capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function PersonaBar({
  selectedPersona,
  tone,
  verbosity,
  personalityPreset,
  onSelectPersona,
  onClearPersona,
}: PersonaBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = selectedPersona
    ? PERSONAS.find((p) => p.id === selectedPersona)
    : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-card border border-card-border">
      {/* Persona selector dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {selected ? (
            <>
              <div className="w-8 h-8 rounded-full overflow-hidden relative ring-2 ring-blue-500">
                <Image
                  src={selected.avatarPath}
                  alt={selected.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
              <span className="font-medium text-foreground">{selected.name}</span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-blue-500">
                <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <span className="font-medium text-foreground">Custom</span>
            </>
          )}
          <svg
            className={`w-4 h-4 text-foreground/60 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-card-border rounded-xl shadow-xl z-20 p-2">
            {/* Custom option */}
            <button
              onClick={() => {
                onClearPersona();
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                selectedPersona === null
                  ? "bg-blue-50 dark:bg-blue-900/30"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedPersona === null
                  ? "bg-blue-100 dark:bg-blue-900/50"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}>
                <svg className={`w-5 h-5 ${selectedPersona === null ? "text-blue-500" : "text-foreground/50"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <span className={`font-medium ${selectedPersona === null ? "text-blue-600 dark:text-blue-400" : "text-foreground"}`}>
                  Custom
                </span>
                <p className="text-xs text-foreground/60">Your own settings</p>
              </div>
              {selectedPersona === null && (
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

            {/* Personas */}
            {PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => {
                  onSelectPersona(persona);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  selectedPersona === persona.id
                    ? "bg-blue-50 dark:bg-blue-900/30"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden relative">
                  <Image
                    src={persona.avatarPath}
                    alt={persona.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="flex-1 text-left">
                  <span className={`font-medium ${selectedPersona === persona.id ? "text-blue-600 dark:text-blue-400" : "text-foreground"}`}>
                    {persona.name}
                  </span>
                  <p className="text-xs text-foreground/60">{persona.title}</p>
                </div>
                {selectedPersona === persona.id && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Read-only settings display */}
      <div className="flex-1 flex items-center gap-2">
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-foreground/70">
          {capitalize(tone)}
        </span>
        <span className="text-foreground/30">·</span>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-foreground/70">
          {capitalize(verbosity)}
        </span>
        {personalityPreset && (
          <>
            <span className="text-foreground/30">·</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-foreground/70">
              {capitalize(personalityPreset)}
            </span>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Settings link */}
      <Link
        href="/settings"
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-foreground/70 hover:text-foreground"
        title="Open settings"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm font-medium">Settings</span>
      </Link>
    </div>
  );
}
