"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/supabase/useAuth";
import { StatsCard } from "@/components/admin/StatsCard";
import { RequestsChart } from "@/components/admin/RequestsChart";
import { UserRequestsHistory } from "@/components/admin/UserRequestsHistory";
import {
  type DateRange,
  type UserDetailData,
  dateRangeOptions,
} from "@/types/admin";
import Link from "next/link";

function maskIP(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return ip.slice(0, 12) + "...";
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/admin/users/${encodeURIComponent(userId)}?range=${dateRange}`
        );

        if (!response.ok) {
          if (response.status === 401) {
            setError("You must be logged in to view this page");
          } else if (response.status === 403) {
            setError("You do not have permission to view this page");
          } else if (response.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load user data");
          }
          return;
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch {
        setError("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && user && userId) {
      fetchUserDetails();
    }
  }, [authLoading, user, userId, dateRange]);

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
            href="/admin"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
          >
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              &larr; Back to Dashboard
            </Link>
          </div>
          {data && (
            <div className="mt-2">
              {data.user.isAnonymous ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Anonymous
                  </span>
                  <span className="text-lg text-gray-600 dark:text-gray-300">
                    {data.user.ipAddress
                      ? maskIP(data.user.ipAddress)
                      : "Unknown IP"}
                  </span>
                </div>
              ) : (
                <div>
                  {data.user.name && (
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {data.user.name}
                    </h1>
                  )}
                  <p className="text-gray-500 dark:text-gray-400">
                    {data.user.email}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date range selector */}
        <div className="mb-6">
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
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-gray-500 dark:text-gray-400">
              Loading user data...
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatsCard
                title="Total Requests"
                value={data.stats.totalRequests}
              />
              <StatsCard title="Avg per Day" value={data.stats.avgPerDay} />
            </div>

            {/* Chart */}
            <RequestsChart data={data.chartData} />

            {/* Request history */}
            <UserRequestsHistory requests={data.requests} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
