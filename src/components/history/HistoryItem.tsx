"use client";

import { useState } from "react";
import { HistoryEntry } from "@/store/historyStore";

interface HistoryItemProps {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export function HistoryItem({ entry, onDelete, isSelectMode, isSelected, onToggleSelect }: HistoryItemProps) {
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

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const needsExpand = entry.original.length > 80 || entry.improved.length > 80;

  const handleCardClick = () => {
    if (isSelectMode) {
      onToggleSelect(entry.id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`p-4 rounded-xl border-2 bg-card transition-all duration-200 flex flex-col h-full group hover:shadow-md ${
        isSelectMode ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-card-border hover:border-primary/30'
      }`}
    >
      {/* Header with timestamp and actions */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-foreground/40">{formatTime(entry.timestamp)}</span>
        {/* Action buttons - hidden in select mode */}
        {!isSelectMode && (
          <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="px-2 py-1 text-xs rounded bg-card-border/50 hover:bg-card-border transition-colors cursor-pointer"
              title="Copy improved text"
            >
              {copied ? "✓" : "📋"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
              className="px-2 py-1 text-xs rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
        {/* Selection indicator in select mode */}
        {isSelectMode && (
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-primary border-primary text-white'
              : 'border-card-border'
          }`}>
            {isSelected && <span className="text-xs">✓</span>}
          </div>
        )}
      </div>

      {/* Content - grows to fill available space */}
      <div className="flex-1 space-y-3">
        <div>
          <span className="text-xs font-medium text-foreground/50 block mb-1">Original:</span>
          <p className={`text-sm text-foreground/60 leading-relaxed break-words ${expanded ? '' : 'line-clamp-3'}`}>
            {entry.original}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-primary block mb-1">Improved:</span>
          <p className={`text-sm text-foreground leading-relaxed break-words ${expanded ? '' : 'line-clamp-3'}`}>
            {entry.improved}
          </p>
        </div>
      </div>

      {/* Footer with expand button */}
      {needsExpand && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="mt-3 text-xs text-primary hover:text-primary-hover transition-colors cursor-pointer text-left"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
