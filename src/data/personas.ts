import type { Persona, PersonaId } from "@/types/personality";

export const PERSONAS: Persona[] = [
  {
    id: "professor_maxwell",
    name: "Professor Maxwell",
    title: "Academic Scholar",
    description: "A distinguished academic who values precision and scholarly rigor. Perfect for research papers, formal reports, and academic writing.",
    avatarPath: "/personas/professor-maxwell.svg",
    settings: {
      tone: "formal",
      verbosity: "detailed",
      personalityPreset: "academic",
      customInstructions: null,
    },
  },
  {
    id: "creative_casey",
    name: "Creative Casey",
    title: "Storyteller & Writer",
    description: "An imaginative writer who brings warmth and creativity to every piece. Ideal for marketing copy, blog posts, and creative content.",
    avatarPath: "/personas/creative-casey.svg",
    settings: {
      tone: "casual",
      verbosity: "balanced",
      personalityPreset: "friendly",
      customInstructions: null,
    },
  },
  {
    id: "executive_elena",
    name: "Executive Elena",
    title: "Business Leader",
    description: "A seasoned executive who communicates with clarity and authority. Best for executive emails, proposals, and business communications.",
    avatarPath: "/personas/executive-elena.svg",
    settings: {
      tone: "formal",
      verbosity: "concise",
      personalityPreset: "professional",
      customInstructions: null,
    },
  },
  {
    id: "friendly_sam",
    name: "Friendly Sam",
    title: "Team Collaborator",
    description: "A supportive team player who keeps communication warm and approachable. Great for Slack messages, team updates, and casual emails.",
    avatarPath: "/personas/friendly-sam.svg",
    settings: {
      tone: "casual",
      verbosity: "balanced",
      personalityPreset: "friendly",
      customInstructions: null,
    },
  },
  {
    id: "tech_taylor",
    name: "Tech Taylor",
    title: "Engineering Lead",
    description: "A technical expert who excels at clear, detailed explanations. Perfect for documentation, code reviews, and technical writing.",
    avatarPath: "/personas/tech-taylor.svg",
    settings: {
      tone: "casual",
      verbosity: "detailed",
      personalityPreset: "technical",
      customInstructions: null,
    },
  },
];

export const PERSONAS_BY_ID: Record<PersonaId, Persona> = PERSONAS.reduce(
  (acc, persona) => {
    acc[persona.id] = persona;
    return acc;
  },
  {} as Record<PersonaId, Persona>
);

export function getPersonaById(id: PersonaId): Persona | undefined {
  return PERSONAS_BY_ID[id];
}
