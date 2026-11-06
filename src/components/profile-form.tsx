"use client";
import { useTranslations } from "@/components/i18n";
import { useActionState } from "react";
import { Save } from "lucide-react";
import type { Profile } from "@/lib/database.types";
import { saveProfile } from "@/app/actions/profile";
import { FormMessage } from "./ui";
export function ProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(saveProfile, {});
  return (
    <form action={action} className="profile-form">
      <div className="field">
        <label htmlFor="display_name">{t("Nom affiché")}</label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={profile.display_name}
          required
          maxLength={80}
          autoComplete="nickname"
        />
        <small>{t("Le nom qui accompagne vos contenus publics.")}</small>
      </div>
      <div className="field">
        <label htmlFor="username">{t("Nom d’utilisateur")}</label>
        <div className="input-prefix">
          <span>@</span>
          <input
            id="username"
            name="username"
            defaultValue={profile.username}
            required
            minLength={3}
            maxLength={40}
            pattern="[a-z0-9_]+"
            autoComplete="username"
          />
        </div>
        <small>
          {t(
            "3 à 40 caractères : lettres minuscules, chiffres et tirets bas. Changer ce nom modifie l’adresse de votre profil.",
          )}
        </small>
      </div>
      <FormMessage state={state} />
      <button className="button button-primary" disabled={pending}>
        <Save size={17} />
        {pending ? t("Enregistrement…") : t("Enregistrer le profil")}
      </button>
    </form>
  );
}
