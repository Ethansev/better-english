import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { getRateLimitStatus } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    const status = await getRateLimitStatus(supabase, ip, user?.id ?? null);

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
