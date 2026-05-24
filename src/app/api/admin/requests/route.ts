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
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

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

    const [analytics, total] = await Promise.all([
      prisma.analytics.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.analytics.count({ where }),
    ]);

    const userIds = [
      ...new Set(
        analytics.filter((a) => a.userId).map((a) => a.userId as string)
      ),
    ];
    const profiles = userIds.length
      ? await prisma.profile.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, name: true },
        })
      : [];

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const requests = analytics.map((a) => {
      const profile = a.userId ? profileMap.get(a.userId) : null;
      return {
        id: a.id,
        userId: a.userId,
        userEmail: profile?.email || null,
        userName: profile?.name || null,
        ipAddress: a.ipAddress,
        isAnonymous: !a.userId,
        originalText: a.originalText,
        improvedText: a.improvedText,
        originalTextLength: a.originalTextLength,
        improvedTextLength: a.improvedTextLength,
        createdAt: a.createdAt.toISOString(),
      };
    });

    const hasMore = offset + requests.length < total;

    return NextResponse.json({ requests, total, hasMore });
  } catch (error) {
    console.error("Error fetching admin requests:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
