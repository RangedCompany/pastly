import { getTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { GoogleSignIn } from "@/components/google-sign-in";
import { isGoogleAuthEnabled } from "@/lib/env";
import Link from "next/link";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("Inscription"),
    robots: { index: false },
  };
}
export default async function Signup() {
  const t = await getTranslations();
  if (await getIdentity()) redirect("/dashboard");
  return (
    <AuthShell
      title={t("Votre prochaine idée commence ici.")}
      description={t("Créez votre compte gratuit et votre première note.")}
    >
      <p className="auth-legal-notice">
        {t(
          "En créant un compte, avec votre email ou Google, vous acceptez les",
        )}{" "}
        <Link href="/terms">{t("conditions d’utilisation")}</Link>
        {t(". Consultez notre")}{" "}
        <Link href="/privacy">{t("politique de confidentialité")}</Link>{" "}
        {t("pour savoir comment vos données sont utilisées.")}
      </p>
      {isGoogleAuthEnabled() && <GoogleSignIn next="/profile?welcome=1" />}
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
