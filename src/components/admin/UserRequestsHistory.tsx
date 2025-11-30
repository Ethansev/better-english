"use client";

import { useState } from "react";

interface RequestData {
  id: string;
  original_text: string | null;
  improved_text: string | null;
  original_text_length: number;
  improved_text_length: number;
  created_at: string;
}

interface UserRequestsHistoryProps {
  requests: RequestData[];
  isAnonymous: boolean;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function RequestCard({
  request,
  isAnonymous,
}: {
  request: RequestData;
  isAnonymous: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasFullText = request.original_text && request.improved_text;
  const charDiff = request.improved_text_length - request.original_text_length;
  const charDiffPercent = Math.round(
    (charDiff / request.original_text_length) * 100
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between ${
          hasFullText ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750" : ""
        }`}
        onClick={() => hasFullText && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDateTime(request.created_at)}
          </span>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {request.original_text_length} chars → {request.improved_text_length} chars
            <span
              className={`ml-2 ${
                charDiff < 0
                  ? "text-green-600 dark:text-green-400"
                  : charDiff > 0
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-gray-500"
              }`}
            >
              ({charDiff > 0 ? "+" : ""}
              {charDiff}, {charDiffPercent > 0 ? "+" : ""}
              {charDiffPercent}%)
            </span>
          </span>
        </div>
        {hasFullText && (
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg
              className={`w-5 h-5 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && hasFullText && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
          <div className="pt-3">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
              Original
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded">
              {request.original_text}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
              Improved
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              {request.improved_text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function UserRequestsHistory({
  requests,
  isAnonymous,
}: UserRequestsHistoryProps) {
  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Request History
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No requests found for this period
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Request History ({requests.length})
        </h3>
      </div>

      {isAnonymous && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Text content is not stored for anonymous users. Only character counts and timestamps are available.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            isAnonymous={isAnonymous}
          />
        ))}
      </div>
    </div>
  );
}
