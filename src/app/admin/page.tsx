import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getAdminOverview, requireAdmin } from "@/lib/admin";
import { adminRoleFilter } from "@/lib/admin.types";
import { parsePage, searchTerm } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const user = await requireAdmin();
  const params = await searchParams;
  const query = searchTerm(params.q);
  const role = adminRoleFilter(params.role);
  const page = parsePage(params.page);
  const data = await getAdminOverview(query, role, page);
  return (
    <AdminDashboard
      data={data}
      currentUserId={user.id}
      query={query}
      role={role}
      page={page}
    />
  );
}
