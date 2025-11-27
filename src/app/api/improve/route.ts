import { NextRequest, NextResponse } from "next/server";
import { buildOpenAIRequestBody } from "@/lib/openai";
import { createClient } from "@/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { text } = await request.json();

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
      body: JSON.stringify(buildOpenAIRequestBody(text)),
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
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { error: analyticsError } = await supabase.from("analytics").insert({
      user_id: user?.id || null,
      ip_address: ip,
      original_text_length: text.length,
      improved_text_length: improvedText.length,
    });

    if (analyticsError) {
      console.error("Failed to log analytics:", analyticsError);
    }

    return NextResponse.json({ improvedText });
  } catch (error) {
    console.error("Error improving text:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
