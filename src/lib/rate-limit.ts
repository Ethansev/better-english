import { SupabaseClient } from "@supabase/supabase-js";

const ANONYMOUS_DAILY_LIMIT = 20;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetsAt: string;
}

export interface UserAccessResult {
  hasUnlimitedAccess: boolean;
  accountType: string | null;
  isAdmin: boolean;
}

/**
 * Get the start of the current UTC day
 */
function getUtcDayStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Get the start of the next UTC day (reset time)
 */
function getUtcDayEnd(): Date {
  const dayStart = getUtcDayStart();
  return new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Check rate limit for anonymous users based on IP address
 */
export async function checkAnonymousRateLimit(
  supabase: SupabaseClient,
  ip: string
): Promise<RateLimitResult> {
  const dayStart = getUtcDayStart();
  const resetsAt = getUtcDayEnd().toISOString();

  // Use database function that bypasses RLS
  const { data, error } = await supabase.rpc("count_anonymous_requests", {
    p_ip_address: ip,
    p_since: dayStart.toISOString(),
  });

  if (error) {
    console.error("Error checking rate limit:", error);
    // On error, allow the request but log it
    return {
      allowed: true,
      remaining: ANONYMOUS_DAILY_LIMIT,
      limit: ANONYMOUS_DAILY_LIMIT,
      resetsAt,
    };
  }

  const used = data ?? 0;
  const remaining = Math.max(0, ANONYMOUS_DAILY_LIMIT - used);

  return {
    allowed: remaining > 0,
    remaining,
    limit: ANONYMOUS_DAILY_LIMIT,
    resetsAt,
  };
}

/**
 * Check if a user has unlimited access (admin OR unlimited/premium account type)
 */
export async function checkUserAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<UserAccessResult> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin, account_type")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    console.error("Error checking user access:", error);
    // Default to free user with unlimited access (as per plan)
    return {
      hasUnlimitedAccess: true,
      accountType: "free",
      isAdmin: false,
    };
  }

  const isAdmin = profile.is_admin === true;
  const accountType = profile.account_type ?? "free";

  // All authenticated users currently have unlimited access
  // The account type system is set up for future flexibility
  const hasUnlimitedAccess = true;

  return {
    hasUnlimitedAccess,
    accountType,
    isAdmin,
  };
}

/**
 * Get rate limit status for display purposes
 */
export async function getRateLimitStatus(
  supabase: SupabaseClient,
  ip: string | null,
  userId: string | null
): Promise<{
  isAuthenticated: boolean;
  rateLimitInfo: RateLimitResult | null;
  userAccess: UserAccessResult | null;
}> {
  if (userId) {
    const userAccess = await checkUserAccess(supabase, userId);
    return {
      isAuthenticated: true,
      rateLimitInfo: null,
      userAccess,
    };
  }

  if (ip) {
    const rateLimitInfo = await checkAnonymousRateLimit(supabase, ip);
    return {
      isAuthenticated: false,
      rateLimitInfo,
      userAccess: null,
    };
  }

  // Fallback for unknown state
  return {
    isAuthenticated: false,
    rateLimitInfo: {
      allowed: true,
      remaining: ANONYMOUS_DAILY_LIMIT,
      limit: ANONYMOUS_DAILY_LIMIT,
      resetsAt: getUtcDayEnd().toISOString(),
    },
    userAccess: null,
  };
}
