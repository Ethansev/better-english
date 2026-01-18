import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import type { AccountType } from "@/types/admin";

const VALID_ACCOUNT_TYPES: AccountType[] = ["free", "unlimited", "premium"];

export async function PATCH(
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

    // Parse request body
    const body = await request.json();
    const { accountType } = body as { accountType: AccountType };

    // Validate account type
    if (!accountType || !VALID_ACCOUNT_TYPES.includes(accountType)) {
      return NextResponse.json(
        {
          error: "Invalid account type",
          validTypes: VALID_ACCOUNT_TYPES,
        },
        { status: 400 }
      );
    }

    // Check if this is an anonymous user (can't have account type)
    if (decodedUserId.startsWith("ip:")) {
      return NextResponse.json(
        { error: "Cannot set account type for anonymous users" },
        { status: 400 }
      );
    }

    // Update the user's account type
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ account_type: accountType })
      .eq("id", decodedUserId);

    if (updateError) {
      console.error("Error updating account type:", updateError);
      return NextResponse.json(
        { error: "Failed to update account type" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      accountType,
    });
  } catch (error) {
    console.error("Error updating account type:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
