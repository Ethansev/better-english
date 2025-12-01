"use client";

import { useState, useEffect, useCallback } from "react";
import { HistoryItem } from "./HistoryItem";
import { HistoryEntry } from "@/store/historyStore";

interface HistoryListProps {
  entries: HistoryEntry[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryList({ entries, onDelete, onClearAll }: HistoryListProps) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleExitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  // Handle Escape key to exit select mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSelectMode) {
        handleExitSelectMode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSelectMode, handleExitSelectMode]);

  if (entries.length === 0) {
    return null;
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleEnterSelectMode = () => {
    setIsSelectMode(true);
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach((id) => onDelete(id));
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const someSelected = selectedIds.size > 0;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span>📜</span> History
          <span className="text-sm font-normal text-foreground/50">({entries.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          {isSelectMode ? (
            <>
              <button
                onClick={handleExitSelectMode}
                className="px-3 py-1.5 text-sm rounded-lg bg-card border border-card-border hover:bg-card-border/50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={!someSelected}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
                  someSelected
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-card-border/50 text-foreground/40 cursor-not-allowed'
                }`}
              >
                Delete{someSelected ? ` (${selectedIds.size})` : ''}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEnterSelectMode}
                className="px-3 py-1.5 text-sm rounded-lg bg-card border border-card-border hover:bg-card-border/50 transition-colors cursor-pointer"
              >
                Select
              </button>
              <button
                onClick={onClearAll}
                className="px-3 py-1.5 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer"
              >
                Delete All
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry) => (
          <HistoryItem
            key={entry.id}
            entry={entry}
            onDelete={onDelete}
            isSelectMode={isSelectMode}
            isSelected={selectedIds.has(entry.id)}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
