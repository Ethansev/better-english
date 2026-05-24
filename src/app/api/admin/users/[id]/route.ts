import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: admin.status }
      );
    }

    const { id: userId } = await params;
    const decodedUserId = decodeURIComponent(userId);
    const isAnonymous = decodedUserId.startsWith("ip:");
    const ipAddress = isAnonymous ? decodedUserId.slice(3) : null;

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "30d";

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

    const dateFilter = startDate ? { createdAt: { gte: startDate } } : {};
    const analyticsWhere = isAnonymous
      ? { ipAddress, ...dateFilter }
      : { userId: decodedUserId, ...dateFilter };

    const analytics = await prisma.analytics.findMany({
      where: analyticsWhere,
      orderBy: { createdAt: "desc" },
    });

    if (analytics.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let userProfile: {
      email: string | null;
      name: string | null;
      isAdmin: boolean;
      accountType: string;
    } | null = null;
    let fullTextRequests: Array<{
      id: string;
      originalText: string;
      improvedText: string;
      createdAt: Date;
    }> = [];

    if (!isAnonymous) {
      const profile = await prisma.profile.findUnique({
        where: { id: decodedUserId },
        select: { email: true, name: true, isAdmin: true, accountType: true },
      });
      userProfile = profile
        ? {
            email: profile.email,
            name: profile.name,
            isAdmin: profile.isAdmin,
            accountType: profile.accountType,
          }
        : null;

      fullTextRequests = await prisma.request.findMany({
        where: { userId: decodedUserId, ...dateFilter },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          originalText: true,
          improvedText: true,
          createdAt: true,
        },
      });
    }

    const totalRequests = analytics.length;

    let daysInRange = 1;
    if (startDate) {
      daysInRange = Math.max(
        1,
        Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      );
    } else if (analytics.length > 0) {
      const oldestDate = analytics[analytics.length - 1]!.createdAt;
      daysInRange = Math.max(
        1,
        Math.ceil((now.getTime() - oldestDate.getTime()) / (24 * 60 * 60 * 1000))
      );
    }
    const avgPerDay = Math.round((totalRequests / daysInRange) * 10) / 10;

    const chartData: Record<string, number> = {};
    const useHourly = range === "today";

    analytics.forEach((a) => {
      const date = a.createdAt;
      const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const key = useHourly
        ? `${localDate} ${date.getHours().toString().padStart(2, "0")}:00`
        : localDate;
      chartData[key] = (chartData[key] || 0) + 1;
    });

    const chartDataArray = Object.entries(chartData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const requests = analytics.map((a) => {
      if (isAnonymous) {
        return {
          id: a.id,
          original_text: a.originalText,
          improved_text: a.improvedText,
          original_text_length: a.originalTextLength,
          improved_text_length: a.improvedTextLength,
          created_at: a.createdAt.toISOString(),
        };
      }

      const matchingRequest = fullTextRequests.find((r) => {
        const timeDiff = Math.abs(r.createdAt.getTime() - a.createdAt.getTime());
        return timeDiff < 2000;
      });

      return {
        id: a.id,
        original_text: matchingRequest?.originalText ?? null,
        improved_text: matchingRequest?.improvedText ?? null,
        original_text_length: a.originalTextLength,
        improved_text_length: a.improvedTextLength,
        created_at: a.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      user: {
        id: decodedUserId,
        email: userProfile?.email || null,
        name: userProfile?.name || null,
        isAnonymous,
        ipAddress,
        accountType: userProfile?.accountType || null,
        isAdmin: userProfile?.isAdmin || false,
      },
      stats: { totalRequests, avgPerDay },
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
