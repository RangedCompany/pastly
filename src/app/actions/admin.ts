"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { idSchema, type ActionState } from "@/lib/validation";

export async function setAdminRole(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const actor = await requireAdmin();
  const target = idSchema.safeParse(form.get("user_id"));
  const role = form.get("is_admin");
  if (!target.success || (role !== "true" && role !== "false")) {
    return { error: "Le compte ou le rôle demandé est invalide." };
  }
  if (target.data === actor.id && role === "false") {
    return { error: "Vous ne pouvez pas retirer vos propres droits." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", {
    p_user_id: target.data,
    p_is_admin: role === "true",
  });
  if (error?.code === "22023")
    return {
      error:
        "Le compte doit être confirmé et au moins un administrateur doit être conservé.",
    };
  if (error?.code === "42501")
    return {
      error: "Vos droits ne permettent plus cette action. Rechargez la page.",
    };
  if (error)
    return {
      error:
        "Les droits n’ont pas pu être modifiés. Rechargez la page et réessayez.",
    };
  revalidatePath("/", "layout");
  return {
    success:
      role === "true"
        ? "Accès administrateur accordé."
        : "Accès administrateur retiré.",
  };
}
