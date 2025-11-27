"use client";

interface DailyData {
  date: string;
  count: number;
}

interface RequestsChartProps {
  data: DailyData[];
}

export function RequestsChart({ data }: RequestsChartProps) {
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

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Requests per Day
      </h3>
      <div className="flex items-end gap-1 h-40">
        {data.map((item) => {
          const height = (item.count / maxCount) * 100;
          const date = new Date(item.date);
          const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={item.date}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              <div className="relative w-full flex justify-center">
                <div
                  className="w-full max-w-8 bg-blue-500 dark:bg-blue-400 rounded-t transition-all group-hover:bg-blue-600 dark:group-hover:bg-blue-300"
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${item.count} requests on ${formattedDate}`}
                />
                <div className="absolute -top-6 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {item.count} requests
                </div>
              </div>
              {data.length <= 14 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 transform -rotate-45 origin-top-left w-10 truncate">
                  {formattedDate}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {data.length > 14 && (
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {new Date(data[0].date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span>
            {new Date(data[data.length - 1].date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
}
