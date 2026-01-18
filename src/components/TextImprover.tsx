"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TextInput } from "@/components/TextInput";
import { ResultCard } from "@/components/ResultCard";
import { PersonaBar } from "@/components/PersonaBar";
import { usePreferences } from "@/hooks/usePreferences";
import { processSSEResponse } from "@/lib/streaming";

const RATE_LIMIT_STORAGE_KEY = "betterEnglish_rateLimitResetsAt";

interface TextImproverProps {
  onImproveComplete?: (original: string, improved: string) => void;
}

interface SSEMessage {
  type: "delta" | "done" | "meta" | "error";
  content?: string;
  status?: "success" | "error";
  improvedText?: string;
  message?: string;
  rateLimitInfo?: {
    remaining: number;
    limit: number;
    resetsAt: string;
  };
}

export function TextImprover({ onImproveComplete }: TextImproverProps) {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [rateLimitError, setRateLimitError] = useState<{
    resetsAt: string;
  } | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);

  const { tone, setTone, verbosity, personalityPreset, customInstructions, selectedPersona, applyPersona, clearPersona } = usePreferences();

  // Check localStorage on mount for existing rate limit
  useEffect(() => {
    const storedResetsAt = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (storedResetsAt) {
      const resetDate = new Date(storedResetsAt);
      if (resetDate > new Date()) {
        setRateLimitError({ resetsAt: storedResetsAt });
      } else {
        localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
      }
    }
  }, []);

  // Live countdown effect
  useEffect(() => {
    if (!rateLimitError) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const resetDate = new Date(rateLimitError.resetsAt);
      const now = new Date();
      const diffMs = resetDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        // Reset time has passed
        setRateLimitError(null);
        setCountdown(null);
        localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${mins}m ${secs}s`);
      } else {
        setCountdown(`${mins}m ${secs}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [rateLimitError]);

  const handleImprove = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setIsStreaming(false);
    setError("");
    setRateLimitError(null);
    setResult("");

    try {
      const response = await fetch("/api/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          tone,
          verbosity,
          personalityPreset,
          customInstructions,
        }),
      });

      // Handle rate limit errors (returned as JSON, not stream)
      if (response.status === 429) {
        const data = await response.json();
        if (data.code === "RATE_LIMIT_EXCEEDED") {
          localStorage.setItem(RATE_LIMIT_STORAGE_KEY, data.resetsAt);
          setRateLimitError({ resetsAt: data.resetsAt });
          return;
        }
        throw new Error(data.error || "Rate limit exceeded");
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to improve text");
      }

      // Handle streaming response
      let accumulatedText = "";
      let finalImprovedText = "";

      setIsStreaming(true);

      await processSSEResponse<SSEMessage>(response, {
        onMessage: (message) => {
          switch (message.type) {
            case "delta":
              if (message.content) {
                accumulatedText += message.content;
                setResult(accumulatedText);
              }
              break;

            case "done":
              setIsStreaming(false);
              if (message.status === "error") {
                setResult("");
                setError(message.message || "Couldn't improve this text. Try entering a sentence or phrase.");
              } else if (message.improvedText) {
                finalImprovedText = message.improvedText;
                setResult(message.improvedText);
              }
              break;

            case "meta":
              // Handle rate limit info updates for anonymous users
              // No need to update UI, just acknowledge receipt
              break;

            case "error":
              setIsStreaming(false);
              setResult("");
              setError(message.message || "Something went wrong");
              break;
          }
        },
      });

      // Call completion callback with final text
      if (finalImprovedText) {
        onImproveComplete?.(inputText, finalImprovedText);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PersonaBar stays interactive even when rate limited */}
      <PersonaBar
        selectedPersona={selectedPersona}
        tone={tone}
        verbosity={verbosity}
        personalityPreset={personalityPreset}
        onSelectPersona={applyPersona}
        onClearPersona={clearPersona}
      />

      {/* TextInput - disabled when rate limited */}
      <div className="relative">
        <div className={rateLimitError ? "opacity-50 pointer-events-none" : ""}>
          <TextInput
            value={inputText}
            onChange={setInputText}
            onSubmit={handleImprove}
            isLoading={isLoading}
          />
        </div>

        {/* Overlay - only covers TextInput */}
        {rateLimitError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 backdrop-blur-sm shadow-lg max-w-md text-center">
              <p className="text-lg font-medium">Daily limit reached</p>
              <p className="mt-2">
                You&apos;ve used all 20 free requests for today.
                {countdown && (
                  <>
                    {" "}
                    Resets in <span className="font-mono font-medium">{countdown}</span>.
                  </>
                )}
              </p>
              <p className="mt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Sign in for unlimited access
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
          <span className="font-medium">Oops!</span> {error}
        </div>
      )}

      <ResultCard result={result} isLoading={isLoading} isStreaming={isStreaming} />
    </div>
  );
}
