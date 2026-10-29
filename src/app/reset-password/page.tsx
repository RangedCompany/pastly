import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  robots: { index: false },
};
export default async function ResetPassword() {
  await requireUser("/reset-password");
  return (
    <AuthShell
      title="Un nouveau départ."
      description="Choisissez un nouveau mot de passe pour votre compte."
    >
      <AuthForm mode="reset" />
    </AuthShell>
  );
}
