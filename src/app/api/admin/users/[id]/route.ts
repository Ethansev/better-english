import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Note: Admin check is handled by middleware - only admins can reach /admin/* routes

    const { id: userId } = await params;
    const decodedUserId = decodeURIComponent(userId);
    const isAnonymous = decodedUserId.startsWith("ip:");
    const ipAddress = isAnonymous ? decodedUserId.slice(3) : null;

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "30d";

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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build analytics query with user/IP and date filter
    let analyticsQuery = supabase.from("analytics").select("*");

    if (isAnonymous) {
      analyticsQuery = analyticsQuery.eq("ip_address", ipAddress);
    } else {
      analyticsQuery = analyticsQuery.eq("user_id", decodedUserId);
    }

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
        { error: "Failed to fetch user analytics" },
        { status: 500 }
      );
    }

    if (!analytics || analytics.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user profile for authenticated users
    let userProfile: { email: string | null; name: string | null } | null = null;
    if (!isAnonymous) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("id", decodedUserId)
        .single();
      userProfile = profile;
    }

    // Fetch full text requests for authenticated users
    let fullTextRequests: Array<{
      id: string;
      original_text: string;
      improved_text: string;
      created_at: string;
    }> = [];

    if (!isAnonymous) {
      let requestsQuery = supabase
        .from("requests")
        .select("id, original_text, improved_text, created_at")
        .eq("user_id", decodedUserId);

      if (startDate) {
        requestsQuery = requestsQuery.gte("created_at", startDate.toISOString());
      }

      const { data: requests } = await requestsQuery.order("created_at", {
        ascending: false,
      });
      fullTextRequests = requests || [];
    }

    // Calculate stats
    const totalRequests = analytics.length;

    // Calculate days in range for average
    let daysInRange = 1;
    if (startDate) {
      daysInRange = Math.max(
        1,
        Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      );
    } else if (analytics.length > 0) {
      const oldestDate = new Date(analytics[analytics.length - 1].created_at);
      daysInRange = Math.max(
        1,
        Math.ceil((now.getTime() - oldestDate.getTime()) / (24 * 60 * 60 * 1000))
      );
    }
    const avgPerDay = Math.round((totalRequests / daysInRange) * 10) / 10;

    // Aggregate chart data with smart granularity
    const chartData: Record<string, number> = {};
    const useHourly = range === "today";

    analytics.forEach((a) => {
      const date = new Date(a.created_at);
      let key: string;

      if (useHourly) {
        // Hourly buckets: "2024-11-28 14:00"
        const hour = date.getHours().toString().padStart(2, "0");
        key = `${date.toISOString().split("T")[0]} ${hour}:00`;
      } else {
        // Daily buckets: "2024-11-28"
        key = date.toISOString().split("T")[0];
      }

      chartData[key] = (chartData[key] || 0) + 1;
    });

    // Convert to array sorted by date
    const chartDataArray = Object.entries(chartData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Merge analytics with full text requests
    const requests = analytics.map((a) => {
      // For anonymous users, text is stored directly in analytics table
      // For authenticated users, match with requests table by timestamp proximity
      if (isAnonymous) {
        return {
          id: a.id,
          original_text: a.original_text || null,
          improved_text: a.improved_text || null,
          original_text_length: a.original_text_length,
          improved_text_length: a.improved_text_length,
          created_at: a.created_at,
        };
      }

      // Find matching full text request within 2 seconds
      const matchingRequest = fullTextRequests.find((r) => {
        const timeDiff = Math.abs(
          new Date(r.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return timeDiff < 2000; // 2 second tolerance
      });

      return {
        id: a.id,
        original_text: matchingRequest?.original_text || null,
        improved_text: matchingRequest?.improved_text || null,
        original_text_length: a.original_text_length,
        improved_text_length: a.improved_text_length,
        created_at: a.created_at,
      };
    });

    return NextResponse.json({
      user: {
        id: decodedUserId,
        email: userProfile?.email || null,
        name: userProfile?.name || null,
        isAnonymous,
        ipAddress,
      },
      stats: {
        totalRequests,
        avgPerDay,
      },
      chartData: chartDataArray,
      requests,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
