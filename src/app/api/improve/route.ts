import { NextRequest, NextResponse } from "next/server";
import { buildOpenAIRequestBody, type Tone } from "@/lib/openai";
import { createClient } from "@/supabase/server";
import { checkAnonymousRateLimit } from "@/lib/rate-limit";

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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildOpenAIRequestBody(text, tone)),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return NextResponse.json(
        { error: "Failed to improve text. Please try again." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const improvedText = data.choices[0]?.message?.content?.trim();

    if (!improvedText) {
      return NextResponse.json(
        { error: "No response from AI. Please try again." },
        { status: 500 }
      );
    }

    if (user) {
      const { error: dbError } = await supabase.from("requests").insert({
        user_id: user.id,
        original_text: text,
        improved_text: improvedText,
      });

      if (dbError) {
        console.error("Failed to save history:", dbError);
      }
    }

    // Log analytics for ALL requests (even anonymous)
    const { error: analyticsError } = await supabase.from("analytics").insert({
      user_id: user?.id || null,
      ip_address: ip,
      original_text_length: text.length,
      improved_text_length: improvedText.length,
      // Store full text only for anonymous users (authenticated users have it in requests table)
      original_text: user ? null : text,
      improved_text: user ? null : improvedText,
    });

    if (analyticsError) {
      console.error("Failed to log analytics:", analyticsError);
    }

    // For anonymous users, return updated rate limit info
    // The remaining count is decremented by 1 since we just used a request
    const rateLimitInfo = rateLimitResult
      ? {
          remaining: Math.max(0, rateLimitResult.remaining - 1),
          limit: rateLimitResult.limit,
          resetsAt: rateLimitResult.resetsAt,
        }
      : null;

    return NextResponse.json({ improvedText, rateLimitInfo });
  } catch (error) {
    console.error("Error improving text:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
