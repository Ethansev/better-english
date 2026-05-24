import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { buildOpenAIRequestBody, type PersonalityConfig } from "@/lib/openai";
import type { Tone, Verbosity, PersonalityPreset } from "@/types/personality";
import { MAX_CUSTOM_INSTRUCTIONS_LENGTH } from "@/types/personality";
import { auth } from "@/auth/server";
import { prisma } from "@/prisma/client";
import { checkAnonymousRateLimit, extractClientIp } from "@/lib/rate-limit";
import {
  createOpenAIStreamProcessor,
  formatSSEMessage,
  type AIResponse,
} from "@/lib/streaming";

interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetsAt: string;
}

async function saveToDatabase(
  userId: string | null,
  ip: string,
  originalText: string,
  improvedText: string
): Promise<void> {
  const promises: Promise<unknown>[] = [];

  // Save to requests table for authenticated users only
  if (userId) {
    promises.push(
      prisma.request
        .create({
          data: {
            userId,
            originalText,
            improvedText,
          },
        })
        .catch((err) => console.error("Failed to save history:", err))
    );
  }

  // Log analytics for ALL requests (even anonymous)
  promises.push(
    prisma.analytics
      .create({
        data: {
          userId,
          ipAddress: ip,
          originalTextLength: originalText.length,
          improvedTextLength: improvedText.length,
          originalText: userId ? null : originalText,
          improvedText: userId ? null : improvedText,
        },
      })
      .catch((err) => console.error("Failed to log analytics:", err))
  );

  await Promise.all(promises);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user.id ?? null;

    const ip = extractClientIp(request.headers);

    // Rate limit check for anonymous users
    let rateLimitResult = null;
    if (!userId) {
      rateLimitResult = await checkAnonymousRateLimit(ip);
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: "Daily limit reached",
            code: "RATE_LIMIT_EXCEEDED",
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            resetsAt: rateLimitResult.resetsAt,
          },
          { status: 429 }
        );
      }
    }

    const {
      text,
      tone = "casual",
      verbosity = "balanced",
      personalityPreset = null,
      customInstructions = null,
    } = (await request.json()) as {
      text: string;
      tone?: Tone;
      verbosity?: Verbosity;
      personalityPreset?: PersonalityPreset | null;
      customInstructions?: string | null;
    };

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Please provide text to improve" },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Text is too long. Please keep it under 5000 characters." },
        { status: 400 }
      );
    }

    if (
      customInstructions &&
      customInstructions.length > MAX_CUSTOM_INSTRUCTIONS_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Custom instructions must be ${MAX_CUSTOM_INSTRUCTIONS_LENGTH} characters or less.`,
        },
        { status: 400 }
      );
    }

    const validTones: Tone[] = ["casual", "formal"];
    const validVerbosities: Verbosity[] = ["concise", "balanced", "detailed"];
    const validPresets: (PersonalityPreset | null)[] = [
      "friendly",
      "professional",
      "academic",
      "technical",
      null,
    ];

    if (!validTones.includes(tone)) {
      return NextResponse.json({ error: "Invalid tone value" }, { status: 400 });
    }
    if (!validVerbosities.includes(verbosity)) {
      return NextResponse.json(
        { error: "Invalid verbosity value" },
        { status: 400 }
      );
    }
    if (!validPresets.includes(personalityPreset)) {
      return NextResponse.json(
        { error: "Invalid personality preset value" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    const personalityConfig: PersonalityConfig = {
      tone,
      verbosity,
      personalityPreset,
      customInstructions,
    };

    const requestBody = {
      ...buildOpenAIRequestBody(text, personalityConfig),
      stream: true,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return NextResponse.json(
        { error: "Failed to improve text. Please try again." },
        { status: 500 }
      );
    }

    if (!response.body) {
      return NextResponse.json(
        { error: "No response from AI. Please try again." },
        { status: 500 }
      );
    }

    const rateLimitInfo: RateLimitInfo | null = rateLimitResult
      ? {
          remaining: Math.max(0, rateLimitResult.remaining - 1),
          limit: rateLimitResult.limit,
          resetsAt: rateLimitResult.resetsAt,
        }
      : null;

    const encoder = new TextEncoder();
    const stream = createOpenAIStreamProcessor(response, {
      onSuccess: (result: AIResponse, streamController) => {
        // Fire-and-forget DB writes for faster response
        saveToDatabase(userId, ip, text, result.text).catch((err) => {
          console.error("Database write error:", err);
        });

        if (rateLimitInfo) {
          streamController.enqueue(
            encoder.encode(formatSSEMessage({ type: "meta", rateLimitInfo }))
          );
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error improving text:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
