import { getTranslations } from "@/lib/i18n/server";
import { formatDate } from "@/lib/date";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserAvatar, EmptyState, Pagination } from "@/components/ui";
import { NoteGrid } from "@/components/note-card";
import { getProfile, listNotes } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { parsePage } from "@/lib/validation";
import { avatarUrl } from "@/lib/avatar";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("Le coin d’un membre"),
    description: t("Découvrez les idées publiques d’un membre de Pastly."),
  };
}
export default async function PublicProfile({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const t = await getTranslations();
  const { username } = await params;
  if (!isSupabaseConfigured() || !/^[a-z0-9_]{3,40}$/.test(username))
    notFound();
  const profile = await getProfile(username);
  if (!profile) notFound();
  const page = parsePage((await searchParams).page);
  const { notes, count } = await listNotes({ owner: profile.id, page });
  return (
    <div className="container">
      <header className="public-profile">
        <UserAvatar
          name={profile.display_name}
          src={avatarUrl(profile.avatar_path)}
        />
        <div>
          <h1>{t("Le coin de {name}.", { name: profile.display_name })}</h1>
          <p>
            @{profile.username} {t("· Membre depuis le")}{" "}
            {formatDate(profile.created_at, true, t.locale)}
          </p>
        </div>
      </header>
      <div className="wall-caption section-divider" style={{ paddingTop: 24 }}>
        <span>
          {t.plural(
            "{count} contenu public",
            "{count} contenus publics",
            count,
          )}
        </span>
        <span>{t("Ses idées partagées avec le monde")}</span>
      </div>
      {notes.length ? (
        <NoteGrid notes={notes} />
      ) : (
        <EmptyState
          title={t("Les idées prennent leur temps.")}
          description={t(
            "Ce membre n’a pas encore de contenu public à partager.",
          )}
        />
      )}
      <Pagination page={page} count={count} base={`/u/${username}`} />
    </div>
  );
}
