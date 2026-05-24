import { prisma } from "@/prisma/client";

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

function getUtcDayStart(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

function getUtcDayEnd(): Date {
  const dayStart = getUtcDayStart();
  return new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
}

export function extractClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

export async function checkAnonymousRateLimit(
  ip: string
): Promise<RateLimitResult> {
  const dayStart = getUtcDayStart();
  const resetsAt = getUtcDayEnd().toISOString();

  try {
    const used = await prisma.analytics.count({
      where: {
        userId: null,
        ipAddress: ip,
        createdAt: { gte: dayStart },
      },
    });

    const remaining = Math.max(0, ANONYMOUS_DAILY_LIMIT - used);
    return {
      allowed: remaining > 0,
      remaining,
      limit: ANONYMOUS_DAILY_LIMIT,
      resetsAt,
    };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    // On DB error, fail open with full quota (mirrors prior behavior)
    return {
      allowed: true,
      remaining: ANONYMOUS_DAILY_LIMIT,
      limit: ANONYMOUS_DAILY_LIMIT,
      resetsAt,
    };
  }
}

export async function checkUserAccess(
  userId: string
): Promise<UserAccessResult> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { isAdmin: true, accountType: true },
    });

    if (!profile) {
      return { hasUnlimitedAccess: true, accountType: "free", isAdmin: false };
    }

    return {
      hasUnlimitedAccess: true, // all authed users currently unlimited
      accountType: profile.accountType,
      isAdmin: profile.isAdmin === true,
    };
  } catch (error) {
    console.error("Error checking user access:", error);
    return { hasUnlimitedAccess: true, accountType: "free", isAdmin: false };
  }
}

export async function getRateLimitStatus(
  ip: string | null,
  userId: string | null
): Promise<{
  isAuthenticated: boolean;
  rateLimitInfo: RateLimitResult | null;
  userAccess: UserAccessResult | null;
}> {
  if (userId) {
    const userAccess = await checkUserAccess(userId);
    return { isAuthenticated: true, rateLimitInfo: null, userAccess };
  }

  if (ip) {
    const rateLimitInfo = await checkAnonymousRateLimit(ip);
    return { isAuthenticated: false, rateLimitInfo, userAccess: null };
  }

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
