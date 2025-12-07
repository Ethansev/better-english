"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import type { DailyData } from "@/types/admin";

interface RequestsChartProps {
  data: DailyData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length || !label) {
    return null;
  }

  // Parse as local time by appending T00:00:00 to avoid UTC conversion
  const date = new Date(label + "T00:00:00");
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-lg">
      <p className="font-medium">{payload[0].value} requests</p>
      <p className="text-gray-300 text-xs">{formattedDate}</p>
    </div>
  );
}

function formatXAxisDate(dateStr: string): string {
  // Parse as local time by appending T00:00:00 to avoid UTC conversion
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function calculateInterval(dataLength: number): number {
  if (dataLength <= 7) return 0;
  if (dataLength <= 14) return 1;
  if (dataLength <= 30) return 4;
  return Math.floor(dataLength / 6);
}

// Hook to detect client-side hydration without setState in useEffect
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function RequestsChart({ data }: RequestsChartProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useHydrated();

  const isDark = resolvedTheme === "dark";

  const colors = useMemo(
    () => ({
      bar: isDark ? "#60a5fa" : "#3b82f6", // blue-400 / blue-500
      grid: isDark ? "#374151" : "#e5e7eb", // gray-700 / gray-200
      axis: isDark ? "#9ca3af" : "#6b7280", // gray-400 / gray-500
    }),
    [isDark]
  );

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Requests per Day
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No data available for this period
        </p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Requests per Day
        </h3>
        <div className="h-[250px] flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-full h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Requests per Day
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.grid}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxisDate}
            tick={{ fill: colors.axis, fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={calculateInterval(data.length)}
            axisLine={{ stroke: colors.grid }}
            tickLine={{ stroke: colors.grid }}
          />
          <YAxis
            tick={{ fill: colors.axis, fontSize: 12 }}
            allowDecimals={false}
            axisLine={{ stroke: colors.grid }}
            tickLine={{ stroke: colors.grid }}
            width={40}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "transparent" }}
          />
          <Bar dataKey="count" fill={colors.bar} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
