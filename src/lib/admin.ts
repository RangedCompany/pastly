import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getUser, requireUser } from "./auth";
import { createClient } from "./supabase/server";
import type { AdminRoleFilter } from "./admin.types";

// Cache limité au rendu courant : une révocation est relue à la requête suivante.
export const getIsAdmin = cache(async () => {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  // Fermé par défaut, y compris avant l'application de la migration.
  return !error && data === true;
});

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!(await getIsAdmin())) notFound();
  return user;
}

export async function getAdminOverview(
  query: string,
  role: AdminRoleFilter,
  page: number,
) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_overview", {
    p_query: query,
    p_role: role,
    p_page: page,
  });
  if (error || !data)
    throw new Error(
      "Impossible de charger la supervision. Réessayez dans un instant.",
    );
  return data;
}
