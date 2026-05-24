import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/prisma/client";
import type { AccountType as AccountTypeApi } from "@/types/admin";
import { AccountType } from "@prisma/client";

const VALID_ACCOUNT_TYPES: AccountTypeApi[] = ["free", "unlimited", "premium"];

export async function PATCH(
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

    const body = await request.json();
    const { accountType } = body as { accountType: AccountTypeApi };

    if (!accountType || !VALID_ACCOUNT_TYPES.includes(accountType)) {
      return NextResponse.json(
        { error: "Invalid account type", validTypes: VALID_ACCOUNT_TYPES },
        { status: 400 }
      );
    }

    if (decodedUserId.startsWith("ip:")) {
      return NextResponse.json(
        { error: "Cannot set account type for anonymous users" },
        { status: 400 }
      );
    }

    try {
      await prisma.profile.update({
        where: { id: decodedUserId },
        data: { accountType: accountType as AccountType },
      });
    } catch (err) {
      console.error("Error updating account type:", err);
      return NextResponse.json(
        { error: "Failed to update account type" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, accountType });
  } catch (error) {
    console.error("Error updating account type:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
