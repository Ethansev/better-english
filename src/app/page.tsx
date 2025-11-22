"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TextInput } from "@/components/TextInput";
import { ResultCard } from "@/components/ResultCard";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to improve text");
      }

      setResult(data.improvedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-card-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">✨</span>
            BetterEnglish
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Transform Your Writing
          </h2>
          <p className="text-foreground/60 text-lg">
            Paste your text and let AI make it more professional and polished 🚀
          </p>
        </div>

        <div className="space-y-6">
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

        <footer className="mt-16 text-center text-sm text-foreground/40">
          <p>Made with ❤️ for better communication</p>
        </footer>
      </main>
    </div>
  );
}
