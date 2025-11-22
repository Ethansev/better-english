import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional English writing assistant. Your task is to improve the given text to make it more professional, clear, and grammatically correct while maintaining the original meaning and intent.

Guidelines:
- Fix grammar and spelling errors
- Improve sentence structure for clarity
- Make the tone slightly more professional but still natural
- Keep the improved version concise
- Preserve the original meaning and intent
- Do not add unnecessary formality or jargon
- Only return the improved text, nothing else (no explanations, no quotes)`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
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

    return NextResponse.json({ improvedText });
  } catch (error) {
    console.error("Error improving text:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
