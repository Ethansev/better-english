"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { SortColumn, SortDirection } from "@/store/preferencesStore";
import type { UserData } from "@/types/admin";

interface UsersTableProps {
  users: UserData[];
  defaultSortColumn?: SortColumn;
  defaultSortDirection?: SortDirection;
  onSortChange?: (column: SortColumn, direction: SortDirection) => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function maskIP(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  // For IPv6 or other formats, show first part
  return ip.slice(0, 12) + "...";
}

function SortIcon({
  column,
  currentColumn,
  direction,
}: {
  column: SortColumn;
  currentColumn: SortColumn;
  direction: SortDirection;
}) {
  if (column !== currentColumn) {
    return (
      <svg
        className="w-4 h-4 ml-1 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    );
  }
  return direction === "asc" ? (
    <svg
      className="w-4 h-4 ml-1 text-blue-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 15l7-7 7 7"
      />
    </svg>
  ) : (
    <svg
      className="w-4 h-4 ml-1 text-blue-500"
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
  );
}

export function UsersTable({
  users,
  defaultSortColumn = "lastActive",
  defaultSortDirection = "desc",
  onSortChange,
}: UsersTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>(defaultSortColumn);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultSortDirection);

  const handleSort = (column: SortColumn) => {
    let newDirection: SortDirection = "desc";
    if (column === sortColumn) {
      newDirection = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortColumn(column);
    setSortDirection(newDirection);
    onSortChange?.(column, newDirection);
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case "user":
          // Sort by name, fallback to email, anonymous users last
          const aName = a.name || a.email || "";
          const bName = b.name || b.email || "";
          if (a.isAnonymous && !b.isAnonymous) comparison = 1;
          else if (!a.isAnonymous && b.isAnonymous) comparison = -1;
          else comparison = aName.localeCompare(bName);
          break;
        case "count":
          comparison = a.count - b.count;
          break;
        case "lastActive":
          comparison =
            new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [users, sortColumn, sortDirection]);

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Users
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No users found for this period
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Users
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSort("user")}
              >
                <div className="flex items-center">
                  User
                  <SortIcon
                    column="user"
                    currentColumn={sortColumn}
                    direction={sortDirection}
                  />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSort("count")}
              >
                <div className="flex items-center">
                  Requests
                  <SortIcon
                    column="count"
                    currentColumn={sortColumn}
                    direction={sortDirection}
                  />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSort("lastActive")}
              >
                <div className="flex items-center">
                  Last Active
                  <SortIcon
                    column="lastActive"
                    currentColumn={sortColumn}
                    direction={sortDirection}
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/admin/users/${encodeURIComponent(user.id)}`}
                    className="block"
                  >
                    {user.isAnonymous ? (
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Anonymous
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          {user.ipAddress
                            ? maskIP(user.ipAddress)
                            : "Unknown IP"}
                        </span>
                      </div>
                    ) : (
                      <div>
                        {user.name && (
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    )}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/admin/users/${encodeURIComponent(user.id)}`}
                    className="block"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.count.toLocaleString()}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <Link
                    href={`/admin/users/${encodeURIComponent(user.id)}`}
                    className="block"
                  >
                    {formatRelativeTime(user.lastActive)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
