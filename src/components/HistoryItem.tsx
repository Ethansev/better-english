"use client";

import { useState } from "react";
import { HistoryEntry } from "@/store/historyStore";

interface HistoryItemProps {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
}

export function HistoryItem({ entry, onDelete }: HistoryItemProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(entry.improved);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-4 rounded-xl border border-card-border bg-card hover:border-primary/30 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-foreground/40">{formatTime(entry.timestamp)}</span>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium text-foreground/50 block mb-1">Original:</span>
              <p className="text-sm text-foreground/60 leading-relaxed">
                {expanded ? entry.original : truncate(entry.original, 100)}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium text-primary block mb-1">Improved:</span>
              <p className="text-sm text-foreground leading-relaxed">
                {expanded ? entry.improved : truncate(entry.improved, 100)}
              </p>
            </div>
          </div>

          {(entry.original.length > 100 || entry.improved.length > 100) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary hover:text-primary-hover mt-2 transition-colors"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs rounded-lg bg-card-border/50 hover:bg-card-border transition-all duration-200 hover:scale-105 active:scale-95"
            title="Copy improved text"
          >
            {copied ? "✓" : "📋"}
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all duration-200 hover:scale-105 active:scale-95"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
