import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  UserAvatar,
  formatDate,
  EmptyState,
  Pagination,
} from "@/components/ui";
import { NoteGrid } from "@/components/note-card";
import { getProfile, listNotes } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { parsePage } from "@/lib/validation";
export const metadata: Metadata = {
  title: "Le coin d’un membre",
  description: "Découvrez les idées publiques d’un membre de Pastly.",
};
export default async function PublicProfile({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
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
        <UserAvatar name={profile.display_name} />
        <div>
          <h1>Le coin de {profile.display_name}.</h1>
          <p>
            @{profile.username} · Membre depuis le{" "}
            {formatDate(profile.created_at, true)}
          </p>
        </div>
      </header>
      <div className="wall-caption section-divider" style={{ paddingTop: 24 }}>
        <span>
          {count} post-it public{count > 1 ? "s" : ""}
        </span>
        <span>Ses idées partagées avec le monde</span>
      </div>
      {notes.length ? (
        <NoteGrid notes={notes} />
      ) : (
        <EmptyState
          title="Les idées prennent leur temps."
          description="Ce membre n’a pas encore de post-it public à partager."
        />
      )}
      <Pagination page={page} count={count} base={`/u/${username}`} />
    </div>
  );
}
