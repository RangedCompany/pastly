export type AdminAccount = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  is_admin: boolean;
  note_count: number;
  public_note_count: number;
  private_note_count: number;
  last_note_at: string | null;
};

export type AdminRoleEvent = {
  id: number;
  action: "granted" | "revoked";
  created_at: string;
  actor_id: string | null;
  target_id: string | null;
  actor_email: string | null;
  target_email: string | null;
};

export type AdminOverview = {
  summary: {
    accounts: number;
    admins: number;
    pending: number;
    new_accounts_7d: number;
    sign_ins_7d: number;
    without_notes: number;
    missing_profiles: number;
    notes: number;
    public_notes: number;
    private_notes: number;
    new_notes_7d: number;
  };
  accounts: AdminAccount[];
  total: number;
  events: AdminRoleEvent[];
};

export const ADMIN_PAGE_SIZE = 20;
export const ADMIN_ROLES = ["all", "admin", "member", "pending"] as const;
export type AdminRoleFilter = (typeof ADMIN_ROLES)[number];

export function adminRoleFilter(value: unknown): AdminRoleFilter {
  return ADMIN_ROLES.find((role) => role === value) ?? "all";
}
