import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { prisma } from "@/prisma/client";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.request.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      originalText: true,
      improvedText: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    entries: entries.map((r) => ({
      id: r.id,
      original: r.originalText,
      improved: r.improvedText,
      timestamp: r.createdAt.getTime(),
    })),
  });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = (await request.json().catch(() => ({}))) as { id?: string };

  if (id) {
    await prisma.request.deleteMany({
      where: { id, userId: session.user.id },
    });
  } else {
    await prisma.request.deleteMany({ where: { userId: session.user.id } });
  }

  return NextResponse.json({ ok: true });
}
