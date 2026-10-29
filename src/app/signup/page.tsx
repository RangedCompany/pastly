import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
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
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
