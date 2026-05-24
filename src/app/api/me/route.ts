import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { prisma } from "@/prisma/client";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ user: null, isAdmin: false });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, accountType: true },
  });

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
    isAdmin: profile?.isAdmin === true,
    accountType: profile?.accountType ?? "free",
  });
}
