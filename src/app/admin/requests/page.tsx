"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/auth/useAuth";
import { AllRequestsHistory } from "@/components/admin/AllRequestsHistory";
import {
  type DateRange,
  type RequestData,
  dateRangeOptions,
} from "@/types/admin";
import Link from "next/link";

const LIMIT = 25;

export default function RequestsPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchRequests = useCallback(
    async (offset: number = 0, append: boolean = false) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        const response = await fetch(
          `/api/admin/requests?range=${dateRange}&limit=${LIMIT}&offset=${offset}`
        );

        if (!response.ok) {
          if (response.status === 401) {
            setError("You must be logged in to view this page");
          } else if (response.status === 403) {
            setError("You do not have permission to view this page");
          } else {
            setError("Failed to load requests");
          }
          return;
        }

        const result = await response.json();

        if (append) {
          setRequests((prev) => [...prev, ...result.requests]);
        } else {
          setRequests(result.requests);
        }
        setHasMore(result.hasMore);
        setTotal(result.total);
        setError(null);
      } catch {
        setError("Failed to load requests");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [dateRange]
  );

  useEffect(() => {
    if (!authLoading && user) {
      fetchRequests(0, false);
    }
  }, [authLoading, user, dateRange, fetchRequests]);

  const handleLoadMore = () => {
    fetchRequests(requests.length, true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm max-w-md text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
          >
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              All Requests
            </h1>
          </div>
          <button
            onClick={signOut}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date range selector */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {dateRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  dateRange === option.value
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {!isLoading && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {total.toLocaleString()} total requests
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-gray-500 dark:text-gray-400">
              Loading requests...
            </div>
          </div>
        ) : (
          <AllRequestsHistory
            requests={requests}
            showLoadMore={hasMore}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore}
          />
        )}
      </main>
    </div>
  );
}
