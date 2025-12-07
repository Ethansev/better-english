"use client";

import Link from "next/link";
import type { RequestData } from "@/types/admin";

interface AllRequestsHistoryProps {
  requests: RequestData[];
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
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

function maskIP(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return ip.slice(0, 12) + "...";
}

function RequestCard({ request }: { request: RequestData }) {
  const hasFullText = request.originalText && request.improvedText;
  const charDiff = request.improvedTextLength - request.originalTextLength;
  const charDiffPercent =
    request.originalTextLength > 0
      ? Math.round((charDiff / request.originalTextLength) * 100)
      : 0;

  const userId = request.isAnonymous
    ? `ip:${request.ipAddress}`
    : request.userId;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header - compact metadata row */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3 text-xs">
          {/* User info */}
          <Link
            href={`/admin/users/${encodeURIComponent(userId || "")}`}
            className="flex items-center gap-1.5 hover:underline"
          >
            {request.isAnonymous ? (
              <>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                  Anon
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {request.ipAddress ? maskIP(request.ipAddress) : "Unknown"}
                </span>
              </>
            ) : (
              <span className="font-medium text-gray-900 dark:text-white">
                {request.userName || request.userEmail || "Unknown User"}
              </span>
            )}
          </Link>

          <span className="text-gray-400">•</span>

          {/* Time */}
          <span className="text-gray-500 dark:text-gray-400">
            {formatDateTime(request.createdAt)}
          </span>

          <span className="text-gray-400">•</span>

          {/* Character stats */}
          <span className="text-gray-600 dark:text-gray-400">
            {request.originalTextLength} → {request.improvedTextLength}
            <span
              className={`ml-1 ${
                charDiff < 0
                  ? "text-green-600 dark:text-green-400"
                  : charDiff > 0
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-gray-500"
              }`}
            >
              ({charDiff > 0 ? "+" : ""}{charDiffPercent}%)
            </span>
          </span>
        </div>
      </div>

      {/* Content - side by side layout */}
      {hasFullText && (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700">
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Original
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {request.originalText}
            </p>
          </div>
          <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                Improved
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {request.improvedText}
            </p>
          </div>
        </div>
      )}

      {/* Fallback for requests without full text */}
      {!hasFullText && (
        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 italic">
          Text content not available
        </div>
      )}
    </div>
  );
}

export function AllRequestsHistory({
  requests,
  showLoadMore = false,
  onLoadMore,
  isLoadingMore = false,
}: AllRequestsHistoryProps) {
  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent Requests
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No requests found for this period
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>

      {showLoadMore && onLoadMore && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
