import { getTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("Mot de passe oublié"),
    robots: { index: false },
  };
}
export default async function ForgotPassword() {
  const t = await getTranslations();
  return (
    <AuthShell
      title={t("On retrouve le fil ?")}
      description={t(
        "Indiquez votre adresse email pour recevoir un lien de réinitialisation.",
      )}
    >
      <AuthForm mode="forgot" />
    </AuthShell>
  );
}
