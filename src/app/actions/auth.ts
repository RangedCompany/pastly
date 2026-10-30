"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  emailSchema,
  passwordSchema,
  safeNext,
  type ActionState,
} from "@/lib/validation";
import { isGoogleAuthEnabled, isSupabaseConfigured, siteUrl } from "@/lib/env";

export async function signInWithGoogle(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!isGoogleAuthEnabled())
    return { error: "La connexion Google n’est pas encore disponible." };

  let destination: string;
  try {
    const callback = new URL("/auth/callback", siteUrl());
    callback.searchParams.set("flow", "google");
    callback.searchParams.set("next", safeNext(form.get("next")));
    const supabase = await createClient();
    // The SSR client stores the PKCE verifier in the browser's cookies.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        scopes: "openid email profile",
        queryParams: { prompt: "select_account" },
      },
    });
    if (error || !data.url)
      return {
        error: "Connexion Google indisponible. Réessayez dans un instant.",
      };
    destination = data.url;
  } catch {
    return {
      error: "Connexion Google indisponible. Réessayez dans un instant.",
    };
  }
  // Next.js redirects throw; keep this outside the error handler.
  redirect(destination);
}

export async function authenticate(
  mode: "login" | "signup" | "forgot" | "reset",
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured())
    return {
      error:
        "Pastly attend sa connexion à Supabase. Suivez le README pour activer les comptes.",
    };
  const email = emailSchema.safeParse(form.get("email"));
  const password = passwordSchema.safeParse(form.get("password"));
  if (mode !== "reset" && !email.success)
    return { error: "Saisissez une adresse email valide." };
  if (mode !== "forgot" && mode !== "login" && !password.success)
    return { error: password.error.issues[0].message };
  if (
    mode === "login" &&
    (typeof form.get("password") !== "string" ||
      String(form.get("password")).length > 128 ||
      !form.get("password"))
  )
    return { error: "Saisissez votre mot de passe." };
  const supabase = await createClient();
  if (mode === "forgot") {
    // Réponse identique pour les comptes existants et inexistants.
    const { error } = await supabase.auth.resetPasswordForEmail(email.data!, {
      redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
    });
    if (error)
      return {
        error: "L’envoi n’a pas abouti. Réessayez dans quelques instants.",
      };
    return {
      success:
        "Si un compte correspond à cette adresse, un lien de réinitialisation vous a été envoyé.",
    };
  }
  if (mode === "reset") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return {
        error:
          "Le lien a expiré. Demandez un nouveau lien de réinitialisation.",
      };
    if (form.get("password_confirmation") !== password.data)
      return { error: "Les mots de passe ne correspondent pas." };
    const { error } = await supabase.auth.updateUser({
      password: password.data!,
    });
    if (error)
      return {
        error:
          "Ce mot de passe n’a pas pu être enregistré. Choisissez-en un autre ou demandez un nouveau lien.",
      };
    await supabase.auth.signOut();
    redirect("/login?message=password-updated");
  }
  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email: email.data!,
      password: password.data!,
      options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
    });
    if (error)
      return {
        error:
          "Inscription impossible. Vérifiez les informations ou réessayez plus tard.",
      };
    if (!data.session)
      return {
        success:
          "Consultez votre boîte email pour confirmer votre inscription. Si vous avez déjà un compte, connectez-vous.",
      };
    revalidatePath("/", "layout");
    redirect("/profile?welcome=1");
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data!,
    password: String(form.get("password")),
  });
  if (error)
    return {
      error: "Adresse email ou mot de passe incorrect, ou email non confirmé.",
    };
  revalidatePath("/", "layout");
  redirect(safeNext(form.get("next")));
}
export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) redirect("/dashboard?error=signout");
  }
  revalidatePath("/", "layout");
  redirect("/");
}
