"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth/useAuth";
import { StatsCard } from "@/components/admin/StatsCard";
import { RequestsChart } from "@/components/admin/RequestsChart";
import { UserBreakdownChart } from "@/components/admin/UserBreakdownChart";
import { UsersTable } from "@/components/admin/UsersTable";
import { AllRequestsHistory } from "@/components/admin/AllRequestsHistory";
import { usePreferencesStore } from "@/store/preferencesStore";
import {
  type DateRange,
  type AdminData,
  type RequestData,
  dateRangeOptions,
} from "@/types/admin";
import Link from "next/link";

export default function AdminPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  const { adminUsersSortColumn, adminUsersSortDirection, setAdminUsersSort } =
    usePreferencesStore();

  const [recentRequests, setRecentRequests] = useState<RequestData[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/stats?range=${dateRange}`);

        if (!response.ok) {
          if (response.status === 401) {
            setError("You must be logged in to view this page");
          } else if (response.status === 403) {
            setError("You do not have permission to view this page");
          } else {
            setError("Failed to load analytics data");
          }
          return;
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch {
        setError("Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchStats();
    }
  }, [authLoading, user, dateRange]);

  // Fetch recent requests separately
  useEffect(() => {
    async function fetchRecentRequests() {
      try {
        const response = await fetch(
          `/api/admin/requests?range=${dateRange}&limit=10`
        );
        if (response.ok) {
          const result = await response.json();
          setRecentRequests(result.requests);
        }
      } catch {
        // Silently fail for recent requests
      }
    }

    if (!authLoading && user) {
      fetchRecentRequests();
    }
  }, [authLoading, user, dateRange]);

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
              href="/"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              &larr; Back
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Admin Dashboard
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
              Loading analytics...
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Requests"
                value={data.stats.totalRequests}
              />
              <StatsCard title="Avg per Day" value={data.stats.avgPerDay} />
              <StatsCard
                title="Unique Users"
                value={data.stats.uniqueUsers}
                subtitle={`+ ${data.stats.uniqueIPs} anonymous IPs`}
              />
              <StatsCard
                title="Anonymous Requests"
                value={data.stats.anonymousRequests}
              />
            </div>

            {/* Chart */}
            {dateRange === "today" ? (
              <UserBreakdownChart users={data.users} />
            ) : (
              <RequestsChart data={data.dailyRequests} />
            )}

            {/* Users table */}
            <UsersTable
              users={data.users}
              defaultSortColumn={adminUsersSortColumn}
              defaultSortDirection={adminUsersSortDirection}
              onSortChange={setAdminUsersSort}
            />

            {/* Recent requests */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Recent Requests
                </h3>
                <Link
                  href="/admin/requests"
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
                >
                  View All →
                </Link>
              </div>
              <div className="p-4">
                <AllRequestsHistory requests={recentRequests} />
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
