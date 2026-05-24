import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { prisma } from "@/prisma/client";

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 };

export async function requireAdmin(): Promise<AdminCheck> {
  const user = await getSessionUser();
  if (!user) return { ok: false, status: 401 };
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });
  if (!profile?.isAdmin) return { ok: false, status: 403 };
  return { ok: true, userId: user.id };
}
