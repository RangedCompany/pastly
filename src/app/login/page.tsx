import { getTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/auth";
import { safeNext } from "@/lib/validation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { GoogleSignIn } from "@/components/google-sign-in";
import { isGoogleAuthEnabled } from "@/lib/env";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("Connexion"),
    robots: { index: false },
  };
}
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string; error?: string }>;
}) {
  const t = await getTranslations();
  const params = await searchParams,
    next = safeNext(params.next);
  if (await getIdentity()) redirect(next);
  return (
    <AuthShell
      title={t("Heureux de vous retrouver.")}
      description={t("Vos idées vous attendent. Retrouvez votre espace.")}
    >
      {params.message === "password-updated" && (
        <p className="message message-success" role="status">
          {t("Mot de passe mis à jour. Vous pouvez vous reconnecter.")}
        </p>
      )}
      {params.message === "confirmed" && (
        <p className="message message-success" role="status">
          {t("Votre email est confirmé. Connectez-vous pour commencer.")}
        </p>
      )}
      {params.error === "callback" && (
        <p className="message message-error" role="alert">
          {t(
            "Ce lien est invalide ou a expiré. Réessayez de vous inscrire ou demandez un nouveau lien de réinitialisation.",
          )}
        </p>
      )}
      {(params.error === "google" || params.error === "google-cancelled") && (
        <p className="message message-error" role="alert">
          {params.error === "google-cancelled"
            ? t("La connexion Google a été annulée. Vous pouvez réessayer.")
            : t(
                "La connexion Google n’a pas abouti ou le lien a expiré. Réessayez.",
              )}
        </p>
      )}
      {isGoogleAuthEnabled() && <GoogleSignIn next={next} />}
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
