import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Note: Admin check is handled by middleware - only admins can reach /admin/* routes

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "7d";

    // Calculate date filter
    const now = new Date();
    let startDate: Date | null = null;

    switch (range) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "14d":
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startDate = null;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build query with date filter
    let analyticsQuery = supabase.from("analytics").select("*");
    if (startDate) {
      analyticsQuery = analyticsQuery.gte("created_at", startDate.toISOString());
    }

    const { data: analytics, error: analyticsError } = await analyticsQuery.order(
      "created_at",
      { ascending: false }
    );

    if (analyticsError) {
      console.error("Analytics query error:", analyticsError);
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 }
      );
    }

    // Calculate stats
    const totalRequests = analytics?.length || 0;
    const anonymousRequests =
      analytics?.filter((a) => !a.user_id).length || 0;
    const uniqueUsers = new Set(
      analytics?.filter((a) => a.user_id).map((a) => a.user_id)
    ).size;
    const uniqueIPs = new Set(
      analytics?.filter((a) => !a.user_id).map((a) => a.ip_address)
    ).size;

    // Calculate days in range for average
    let daysInRange = 1;
    if (startDate) {
      daysInRange = Math.max(
        1,
        Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      );
    } else if (analytics && analytics.length > 0) {
      const oldestDate = new Date(analytics[analytics.length - 1].created_at);
      daysInRange = Math.max(
        1,
        Math.ceil((now.getTime() - oldestDate.getTime()) / (24 * 60 * 60 * 1000))
      );
    }
    const avgPerDay = Math.round(totalRequests / daysInRange);

    // Group by day for chart (using local date, not UTC)
    const dailyData: Record<string, number> = {};
    analytics?.forEach((a) => {
      const d = new Date(a.created_at);
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    // Convert to array sorted by date
    const dailyRequests = Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by user for table
    const userCounts: Record<
      string,
      {
        email: string | null;
        name: string | null;
        count: number;
        lastActive: string;
        accountType: string | null;
        isAdmin: boolean;
      }
    > = {};

    // Fetch user profiles for email/name lookup
    const userIds = [
      ...new Set(analytics?.filter((a) => a.user_id).map((a) => a.user_id)),
    ];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, name, account_type, is_admin")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    analytics?.forEach((a) => {
      const key = a.user_id || `ip:${a.ip_address}`;
      if (!userCounts[key]) {
        const profile = a.user_id ? profileMap.get(a.user_id) : null;
        userCounts[key] = {
          email: profile?.email || null,
          name: profile?.name || null,
          count: 0,
          lastActive: a.created_at,
          accountType: profile?.account_type || null,
          isAdmin: profile?.is_admin || false,
        };
      }
      userCounts[key].count++;
      if (new Date(a.created_at) > new Date(userCounts[key].lastActive)) {
        userCounts[key].lastActive = a.created_at;
      }
    });

    // Convert to array and sort by count
    const users = Object.entries(userCounts)
      .map(([id, data]) => ({
        id,
        email: data.email,
        name: data.name,
        isAnonymous: id.startsWith("ip:"),
        ipAddress: id.startsWith("ip:") ? id.slice(3) : null,
        count: data.count,
        lastActive: data.lastActive,
        accountType: data.accountType,
        isAdmin: data.isAdmin,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      stats: {
        totalRequests,
        avgPerDay,
        uniqueUsers,
        anonymousRequests,
        uniqueIPs,
      },
      dailyRequests,
      users,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
