import { getTranslations } from "@/lib/i18n/server";
import { formatDate } from "@/lib/date";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ensureProfile } from "@/lib/data";
import { ProfileForm } from "@/components/profile-form";
import { ProfileAvatar } from "@/components/profile-avatar";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("Mon profil"),
    robots: { index: false, follow: false },
  };
}
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const t = await getTranslations();
  const user = await requireUser("/profile");
  const profile = await ensureProfile();
  const params = await searchParams;
  return (
    <div className="container">
      <div className="page-heading">
        <span className="eyebrow">{t("FAITES COMME CHEZ VOUS")}</span>
        <h1>{t("Un visage derrière les idées.")}</h1>
        <p>{t("Choisissez le nom qui accompagnera vos contenus publics.")}</p>
      </div>
      {params.welcome === "1" && (
        <p className="message message-success" role="status">
          {t(
            "Bienvenue dans Pastly ! Personnalisez votre nom d’utilisateur avant de partager votre première note.",
          )}
        </p>
      )}
      <div className="profile-layout">
        <aside className="profile-summary">
          <ProfileAvatar
            name={profile.display_name}
            avatarPath={profile.avatar_path}
          />
          <h2>{profile.display_name}</h2>
          <p>
            {t("Membre depuis le")}{" "}
            {formatDate(user.created_at, true, t.locale)}
          </p>
          <Link
            className="button button-secondary"
            href={`/u/${profile.username}`}
          >
            {t("Mon profil public")}
            <ArrowUpRight size={16} />
          </Link>
        </aside>
        <section>
          <ProfileForm key={profile.id} profile={profile} />
          <p className="form-hint" style={{ marginTop: 25 }}>
            {t(
              "Votre adresse email n’est jamais affichée sur votre profil public.",
            )}
          </p>
        </section>
      </div>
    </div>
  );
}
