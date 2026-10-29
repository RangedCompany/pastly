"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { authenticate } from "@/app/actions/auth";
import { FormMessage } from "./ui";

export function AuthForm({
  mode,
  next = "/dashboard",
}: {
  mode: "login" | "signup" | "forgot" | "reset";
  next?: string;
}) {
  const [state, action, pending] = useActionState(
    authenticate.bind(null, mode),
    {},
  );
  const label = {
    login: "Se connecter",
    signup: "Créer mon compte",
    forgot: "Recevoir le lien",
    reset: "Enregistrer le mot de passe",
  }[mode];
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      {mode !== "reset" && (
        <div className="field">
          <label htmlFor="email">Adresse email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.fr"
            required
            maxLength={254}
          />
        </div>
      )}
      {mode !== "forgot" && (
        <div className="field">
          <div className="label-row">
            <label htmlFor="password">
              {mode === "reset" ? "Nouveau mot de passe" : "Mot de passe"}
            </label>
            {mode === "login" && <Link href="/forgot-password">Oublié ?</Link>}
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={mode === "login" ? 1 : 12}
            maxLength={128}
            placeholder={
              mode === "login" ? "Votre mot de passe" : "12 caractères minimum"
            }
          />
          {mode !== "login" && (
            <small>
              Au moins 12 caractères. Une phrase fonctionne très bien.
            </small>
          )}
        </div>
      )}
      {mode === "reset" && (
        <div className="field">
          <label htmlFor="password_confirmation">
            Confirmer le mot de passe
          </label>
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
          />
        </div>
      )}
      <FormMessage state={state} />
      <button
        className="button button-primary full-width"
        type="submit"
        disabled={pending}
      >
        {pending ? "Un instant…" : label}
        {mode === "forgot" ? <Mail size={17} /> : <ArrowRight size={17} />}
      </button>
      {mode === "signup" && (
        <p className="form-hint">
          Un email vous permettra de confirmer votre inscription. Vous pourrez
          personnaliser votre profil ensuite.
        </p>
      )}
      {mode === "login" && (
        <p className="auth-switch">
          Pas encore de compte ? <Link href="/signup">Rejoignez Pastly</Link>
        </p>
      )}
      {mode === "signup" && (
        <p className="auth-switch">
          Déjà un compte ? <Link href="/login">Connectez-vous</Link>
        </p>
      )}
      {(mode === "forgot" || mode === "reset") && (
        <Link href="/login" className="auth-switch">
          Retour à la connexion
        </Link>
      )}
    </form>
  );
}
