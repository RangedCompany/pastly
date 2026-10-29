import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
export const metadata: Metadata = {
  title: "Mot de passe oublié",
  robots: { index: false },
};
export default function ForgotPassword() {
  return (
    <AuthShell
      title="On retrouve le fil ?"
      description="Indiquez votre adresse email pour recevoir un lien de réinitialisation."
    >
      <AuthForm mode="forgot" />
    </AuthShell>
  );
}
