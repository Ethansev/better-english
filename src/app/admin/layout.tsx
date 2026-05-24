import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireAdmin();
  if (!result.ok) {
    if (result.status === 401) redirect("/login");
    redirect("/");
  }
  return <>{children}</>;
}
