import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { safeNext } from "@/lib/validation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false },
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams,
    next = safeNext(params.next);
  if (await getUser()) redirect(next);
  return (
    <AuthShell
      title="Heureux de vous retrouver."
      description="Vos idées vous attendent. Retrouvez votre espace."
    >
      {params.message === "password-updated" && (
        <p className="message message-success" role="status">
          Mot de passe mis à jour. Vous pouvez vous reconnecter.
        </p>
      )}
      {params.message === "confirmed" && (
        <p className="message message-success" role="status">
          Votre email est confirmé. Connectez-vous pour commencer.
        </p>
      )}
      {params.error === "callback" && (
        <p className="message message-error" role="alert">
          Ce lien est invalide ou a expiré. Réessayez de vous inscrire ou
          demandez un nouveau lien de réinitialisation.
        </p>
      )}
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
