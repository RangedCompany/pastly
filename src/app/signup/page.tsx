import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { GoogleSignIn } from "@/components/google-sign-in";
import { isGoogleAuthEnabled } from "@/lib/env";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Inscription",
  robots: { index: false },
};
export default async function Signup() {
  if (await getUser()) redirect("/dashboard");
  return (
    <AuthShell
      title="Votre prochaine idée commence ici."
      description="Créez votre compte gratuit et votre premier post-it."
    >
      <p className="auth-legal-notice">
        En créant un compte, avec votre email ou Google, vous acceptez les{" "}
        <Link href="/terms">conditions d’utilisation</Link>. Consultez notre{" "}
        <Link href="/privacy">politique de confidentialité</Link> pour savoir
        comment vos données sont utilisées.
      </p>
      {isGoogleAuthEnabled() && <GoogleSignIn next="/profile?welcome=1" />}
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
