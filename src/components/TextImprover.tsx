"use client";

import { useState } from "react";
import { TextInput } from "@/components/TextInput";
import { ResultCard } from "@/components/ResultCard";
import { ToneSlider } from "@/components/ToneSlider";
import { usePreferences } from "@/hooks/usePreferences";

interface TextImproverProps {
  onImproveComplete?: (original: string, improved: string) => void;
}

export function TextImprover({ onImproveComplete }: TextImproverProps) {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { tone, setTone } = usePreferences();

  const handleImprove = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch("/api/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText, tone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to improve text");
      }

      setResult(data.improvedText);
      onImproveComplete?.(inputText, data.improvedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ToneSlider value={tone} onChange={setTone} />
      </div>

      <TextInput
        value={inputText}
        onChange={setInputText}
        onSubmit={handleImprove}
        isLoading={isLoading}
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
          <span className="font-medium">Oops!</span> {error}
        </div>
      )}

      <ResultCard result={result} isLoading={isLoading} />
    </div>
  );
}
