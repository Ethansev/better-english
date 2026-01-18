export type Tone = "casual" | "formal";

export type Verbosity = "concise" | "balanced" | "detailed";

export type PersonalityPreset = "friendly" | "professional" | "academic" | "technical";

export type PersonaId = "professor_maxwell" | "creative_casey" | "executive_elena" | "friendly_sam" | "tech_taylor";

export interface PersonalitySettings {
  tone: Tone;
  verbosity: Verbosity;
  personalityPreset: PersonalityPreset | null;
  customInstructions: string | null;
}

export interface Persona {
  id: PersonaId;
  name: string;
  title: string;
  description: string;
  avatarPath: string;
  settings: PersonalitySettings;
}

export const VERBOSITY_OPTIONS: { value: Verbosity; label: string; description: string }[] = [
  { value: "concise", label: "Concise", description: "Brief and to the point" },
  { value: "balanced", label: "Balanced", description: "Standard length" },
  { value: "detailed", label: "Detailed", description: "More thorough explanations" },
];

export const PERSONALITY_PRESETS: { value: PersonalityPreset; label: string; description: string }[] = [
  { value: "friendly", label: "Friendly", description: "Warm and approachable tone" },
  { value: "professional", label: "Professional", description: "Business-appropriate communication" },
  { value: "academic", label: "Academic", description: "Scholarly and precise language" },
  { value: "technical", label: "Technical", description: "Developer-focused clarity" },
];

export const MAX_CUSTOM_INSTRUCTIONS_LENGTH = 500;
