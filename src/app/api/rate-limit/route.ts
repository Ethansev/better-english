import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { getRateLimitStatus, extractClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user.id ?? null;
    const ip = extractClientIp(request.headers);

    const status = await getRateLimitStatus(ip, userId);

    if (status.isAuthenticated) {
      return NextResponse.json({
        isAuthenticated: true,
        hasUnlimitedAccess: status.userAccess?.hasUnlimitedAccess ?? true,
        accountType: status.userAccess?.accountType ?? "free",
        isAdmin: status.userAccess?.isAdmin ?? false,
      });
    }

    return NextResponse.json({
      isAuthenticated: false,
      ...status.rateLimitInfo,
    });
  } catch (error) {
    console.error("Error checking rate limit:", error);
    return NextResponse.json(
      { error: "Failed to check rate limit" },
      { status: 500 }
    );
  }
}
