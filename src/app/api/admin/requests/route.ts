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

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "7d";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

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
    let analyticsQuery = supabase
      .from("analytics")
      .select("*", { count: "exact" });

    if (startDate) {
      analyticsQuery = analyticsQuery.gte(
        "created_at",
        startDate.toISOString()
      );
    }

    const {
      data: analytics,
      error: analyticsError,
      count,
    } = await analyticsQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (analyticsError) {
      console.error("Analytics query error:", analyticsError);
      return NextResponse.json(
        { error: "Failed to fetch requests" },
        { status: 500 }
      );
    }

    // Fetch user profiles for email/name lookup
    const userIds = [
      ...new Set(analytics?.filter((a) => a.user_id).map((a) => a.user_id)),
    ];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, name")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Transform analytics to request format
    const requests =
      analytics?.map((a) => {
        const profile = a.user_id ? profileMap.get(a.user_id) : null;
        return {
          id: a.id,
          userId: a.user_id,
          userEmail: profile?.email || null,
          userName: profile?.name || null,
          ipAddress: a.ip_address,
          isAnonymous: !a.user_id,
          originalText: a.original_text,
          improvedText: a.improved_text,
          originalTextLength: a.original_text_length,
          improvedTextLength: a.improved_text_length,
          createdAt: a.created_at,
        };
      }) || [];

    const total = count || 0;
    const hasMore = offset + requests.length < total;

    return NextResponse.json({
      requests,
      total,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching admin requests:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
