import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: admin.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "7d";

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

    const where = startDate ? { createdAt: { gte: startDate } } : {};

    const analytics = await prisma.analytics.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const totalRequests = analytics.length;
    const anonymousRequests = analytics.filter((a) => !a.userId).length;
    const uniqueUsers = new Set(
      analytics.filter((a) => a.userId).map((a) => a.userId)
    ).size;
    const uniqueIPs = new Set(
      analytics.filter((a) => !a.userId).map((a) => a.ipAddress)
    ).size;

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
    const avgPerDay = Math.round(totalRequests / daysInRange);

    const dailyData: Record<string, number> = {};
    analytics.forEach((a) => {
      const d = a.createdAt;
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    const dailyRequests = Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const userIds = [
      ...new Set(
        analytics.filter((a) => a.userId).map((a) => a.userId as string)
      ),
    ];
    const profiles = userIds.length
      ? await prisma.profile.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            email: true,
            name: true,
            accountType: true,
            isAdmin: true,
          },
        })
      : [];

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

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

    analytics.forEach((a) => {
      const key = a.userId || `ip:${a.ipAddress}`;
      if (!userCounts[key]) {
        const profile = a.userId ? profileMap.get(a.userId) : null;
        userCounts[key] = {
          email: profile?.email || null,
          name: profile?.name || null,
          count: 0,
          lastActive: a.createdAt.toISOString(),
          accountType: profile?.accountType || null,
          isAdmin: profile?.isAdmin || false,
        };
      }
      userCounts[key].count++;
      if (a.createdAt > new Date(userCounts[key].lastActive)) {
        userCounts[key].lastActive = a.createdAt.toISOString();
      }
    });

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
