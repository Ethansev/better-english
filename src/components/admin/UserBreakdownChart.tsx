"use client";

import { useMemo, useSyncExternalStore } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "next-themes";

interface UserData {
  id: string;
  email: string | null;
  name: string | null;
  isAnonymous: boolean;
  ipAddress: string | null;
  count: number;
}

interface UserBreakdownChartProps {
  users: UserData[];
}

// Color palette for pie chart slices
const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { name: string; value: number; percent: number };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0];
  return (
    <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-lg">
      <p className="font-medium">{data.name}</p>
      <p className="text-gray-300">
        {data.value} requests ({Math.round(data.payload.percent)}%)
      </p>
    </div>
  );
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function UserBreakdownChart({ users }: UserBreakdownChartProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useHydrated();
  const isDark = resolvedTheme === "dark";

  const chartData = useMemo(() => {
    const total = users.reduce((sum, user) => sum + user.count, 0);

    return users.map((user) => ({
      name: user.isAnonymous
        ? `Anonymous (${user.ipAddress?.slice(0, 12)}...)`
        : user.name || user.email || "Unknown User",
      value: user.count,
      percent: total > 0 ? (user.count / total) * 100 : 0,
    }));
  }, [users]);

  const total = useMemo(
    () => users.reduce((sum, user) => sum + user.count, 0),
    [users]
  );

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Requests by User
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No data available for today
        </p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Requests by User
        </h3>
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full w-48 h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Requests by User
      </h3>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Pie chart */}
        <div className="relative w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {total}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                total
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full lg:w-1/2">
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {chartData.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span
                    className={`text-sm truncate ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-sm font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {entry.value}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({Math.round(entry.percent)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
