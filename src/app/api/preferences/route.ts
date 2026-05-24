import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { prisma } from "@/prisma/client";
import {
  MAX_CUSTOM_INSTRUCTIONS_LENGTH,
  type Tone,
  type Verbosity,
  type PersonalityPreset,
  type PersonaId,
} from "@/types/personality";

const VALID_TONES: Tone[] = ["casual", "formal"];
const VALID_VERBOSITIES: Verbosity[] = ["concise", "balanced", "detailed"];
const VALID_PRESETS: (PersonalityPreset | null)[] = [
  "friendly",
  "professional",
  "academic",
  "technical",
  null,
];

interface PreferencesPatch {
  tonePreference?: Tone;
  verbosityPreference?: Verbosity;
  personalityPreset?: PersonalityPreset | null;
  customInstructions?: string | null;
  selectedPersona?: PersonaId | null;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: {
      tonePreference: true,
      verbosityPreference: true,
      personalityPreset: true,
      customInstructions: true,
      selectedPersona: true,
    },
  });

  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as PreferencesPatch;

  const data: Record<string, unknown> = {};

  if (body.tonePreference !== undefined) {
    if (!VALID_TONES.includes(body.tonePreference)) {
      return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
    }
    data.tonePreference = body.tonePreference;
  }

  if (body.verbosityPreference !== undefined) {
    if (!VALID_VERBOSITIES.includes(body.verbosityPreference)) {
      return NextResponse.json({ error: "Invalid verbosity" }, { status: 400 });
    }
    data.verbosityPreference = body.verbosityPreference;
  }

  if (body.personalityPreset !== undefined) {
    if (!VALID_PRESETS.includes(body.personalityPreset)) {
      return NextResponse.json({ error: "Invalid preset" }, { status: 400 });
    }
    data.personalityPreset = body.personalityPreset;
  }

  if (body.customInstructions !== undefined) {
    if (
      body.customInstructions !== null &&
      body.customInstructions.length > MAX_CUSTOM_INSTRUCTIONS_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Custom instructions must be ${MAX_CUSTOM_INSTRUCTIONS_LENGTH} characters or less`,
        },
        { status: 400 }
      );
    }
    data.customInstructions = body.customInstructions;
  }

  if (body.selectedPersona !== undefined) {
    data.selectedPersona = body.selectedPersona;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const profile = await prisma.profile.update({
    where: { id: session.user.id },
    data,
    select: {
      tonePreference: true,
      verbosityPreference: true,
      personalityPreset: true,
      customInstructions: true,
      selectedPersona: true,
    },
  });

  return NextResponse.json({ profile });
}
