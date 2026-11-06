import { getTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("Nouveau mot de passe"),
    robots: { index: false },
  };
}
export default async function ResetPassword() {
  const t = await getTranslations();
  await requireUser("/reset-password");
  return (
    <AuthShell
      title={t("Un nouveau départ.")}
      description={t("Choisissez un nouveau mot de passe pour votre compte.")}
    >
      <AuthForm mode="reset" />
    </AuthShell>
  );
}
