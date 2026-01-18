import { NextRequest, NextResponse } from "next/server";
import { buildOpenAIRequestBody, type Tone } from "@/lib/openai";
import { createClient } from "@/supabase/server";
import { checkAnonymousRateLimit } from "@/lib/rate-limit";
import {
  createOpenAIStreamProcessor,
  formatSSEMessage,
  type AIResponse,
} from "@/lib/streaming";
import { SupabaseClient, User } from "@supabase/supabase-js";

interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetsAt: string;
}

// Parallel DB writes for improved performance
async function saveToDatabase(
  supabase: SupabaseClient,
  user: User | null,
  ip: string,
  originalText: string,
  improvedText: string
): Promise<void> {
  const promises: Promise<void>[] = [];

  // Save to requests table for authenticated users
  if (user) {
    promises.push(
      (async () => {
        const { error } = await supabase.from("requests").insert({
          user_id: user.id,
          original_text: originalText,
          improved_text: improvedText,
        });
        if (error) console.error("Failed to save history:", error);
      })()
    );
  }

  // Log analytics for ALL requests (even anonymous)
  promises.push(
    (async () => {
      const { error } = await supabase.from("analytics").insert({
        user_id: user?.id || null,
        ip_address: ip,
        original_text_length: originalText.length,
        improved_text_length: improvedText.length,
        original_text: user ? null : originalText,
        improved_text: user ? null : improvedText,
      });
      if (error) console.error("Failed to log analytics:", error);
    })()
  );

  await Promise.all(promises);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get IP address for rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limit check for anonymous users
    let rateLimitResult = null;
    if (!user) {
      rateLimitResult = await checkAnonymousRateLimit(supabase, ip);
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

    const { text, tone = "casual" } = await request.json() as { text: string; tone?: Tone };

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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    // Build request body and add streaming
    const requestBody = {
      ...buildOpenAIRequestBody(text, tone),
      stream: true,
    };

    // Add 30-second timeout
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

    // Prepare rate limit info for anonymous users
    const rateLimitInfo: RateLimitInfo | null = rateLimitResult
      ? {
          remaining: Math.max(0, rateLimitResult.remaining - 1),
          limit: rateLimitResult.limit,
          resetsAt: rateLimitResult.resetsAt,
        }
      : null;

    // Create a streaming response using the stream processor
    const encoder = new TextEncoder();
    const stream = createOpenAIStreamProcessor(response, {
      onSuccess: (result: AIResponse, streamController) => {
        // Run DB writes in parallel (don't await - fire and forget for faster response)
        saveToDatabase(supabase, user, ip, text, result.text).catch((err) => {
          console.error("Database write error:", err);
        });

        // Send rate limit info for anonymous users
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
