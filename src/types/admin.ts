export type DateRange = "today" | "7d" | "14d" | "30d" | "90d" | "all";

export type AccountType = "free" | "unlimited" | "premium";

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetsAt: string;
}

export interface AdminStats {
  totalRequests: number;
  avgPerDay: number;
  uniqueUsers: number;
  anonymousRequests: number;
  uniqueIPs: number;
}

export interface DailyData {
  date: string;
  count: number;
}

export interface UserData {
  id: string;
  email: string | null;
  name: string | null;
  isAnonymous: boolean;
  ipAddress: string | null;
  count: number;
  lastActive: string;
  accountType?: AccountType;
  isAdmin?: boolean;
}

export interface RequestData {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  ipAddress: string | null;
  isAnonymous: boolean;
  originalText: string | null;
  improvedText: string | null;
  originalTextLength: number;
  improvedTextLength: number;
  createdAt: string;
}

// Raw database format (snake_case) - used for individual user request history
export interface UserRequestData {
  id: string;
  original_text: string | null;
  improved_text: string | null;
  original_text_length: number;
  improved_text_length: number;
  created_at: string;
}

export interface AdminData {
  stats: AdminStats;
  dailyRequests: DailyData[];
  users: UserData[];
}

export interface UserInfo {
  id: string;
  email: string | null;
  name: string | null;
  isAnonymous: boolean;
  ipAddress: string | null;
  accountType?: AccountType;
  isAdmin?: boolean;
}

export interface UserStats {
  totalRequests: number;
  avgPerDay: number;
}

export interface UserDetailData {
  user: UserInfo;
  stats: UserStats;
  chartData: DailyData[];
  requests: UserRequestData[];
}

export const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "14d", label: "14 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All Time" },
];
