"use client";

import { HistoryItem } from "./HistoryItem";
import { HistoryEntry } from "@/store/historyStore";

interface HistoryListProps {
  entries: HistoryEntry[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryList({ entries, onDelete, onClearAll }: HistoryListProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span>📜</span> History
          <span className="text-sm font-normal text-foreground/50">({entries.length})</span>
        </h3>
        <button
          onClick={onClearAll}
          className="text-sm text-red-500 hover:text-red-600 transition-colors hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <HistoryItem key={entry.id} entry={entry} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
