"use client";

import { useState } from "react";

interface ResultCardProps {
  result: string;
  isLoading: boolean;
}

export function ResultCard({ result, isLoading }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 rounded-xl border border-card-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-foreground/70">Improved version</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary animate-pulse">
            AI is thinking...
          </span>
        </div>
        <div className="space-y-3">
          <div className="h-4 rounded loading-shimmer" />
          <div className="h-4 rounded loading-shimmer w-4/5" />
          <div className="h-4 rounded loading-shimmer w-3/5" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="w-full p-6 rounded-xl border border-dashed border-card-border bg-card/50">
        <div className="text-center text-foreground/40">
          <span className="text-3xl mb-2 block">📝</span>
          <p>Your improved text will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 rounded-xl border border-card-border bg-card relative group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground/70">Improved version</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
            ✓ Ready
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 text-sm rounded-lg bg-card-border/50 hover:bg-card-border transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer"
        >
          {copied ? (
            <>
              <span className="text-green-500">✓</span> Copied!
            </>
          ) : (
            <>
              <span>📋</span> Copy
            </>
          )}
        </button>
      </div>
      <p className="text-foreground leading-relaxed whitespace-pre-wrap">{result}</p>
    </div>
  );
}
