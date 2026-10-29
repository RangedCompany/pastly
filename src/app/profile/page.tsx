import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ensureProfile } from "@/lib/data";
import { ProfileForm } from "@/components/profile-form";
import { UserAvatar, formatDate } from "@/components/ui";
export const metadata: Metadata = {
  title: "Mon profil",
  robots: { index: false, follow: false },
};
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await requireUser("/profile");
  const profile = await ensureProfile();
  const params = await searchParams;
  return (
    <div className="container narrow">
      <div className="page-heading">
        <span className="eyebrow">FAITES COMME CHEZ VOUS</span>
        <h1>Un visage derrière les idées.</h1>
        <p>Choisissez le nom qui accompagnera vos post-it publics.</p>
      </div>
      {params.welcome === "1" && (
        <p className="message message-success" role="status">
          Bienvenue dans Pastly ! Personnalisez votre nom d’utilisateur avant de
          partager votre premier post-it.
        </p>
      )}
      <div className="profile-layout">
        <aside className="profile-summary">
          <UserAvatar name={profile.display_name} />
          <h2>{profile.display_name}</h2>
          <p>Membre depuis le {formatDate(user.created_at, true)}</p>
          <Link
            className="button button-secondary"
            href={`/u/${profile.username}`}
          >
            Mon profil public
            <ArrowUpRight size={16} />
          </Link>
        </aside>
        <section>
          <ProfileForm key={profile.id} profile={profile} />
          <p className="form-hint" style={{ marginTop: 25 }}>
            Votre adresse email n’est jamais affichée sur votre profil public.
          </p>
        </section>
      </div>
    </div>
  );
}
