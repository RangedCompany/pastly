-- Migration additive : échoue sur un schéma incompatible, sans supprimer de données.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,40}$'),
  display_name text not null constraint profiles_display_name_length check (char_length(display_name) between 1 and 80 and char_length(btrim(display_name)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  title text not null constraint notes_title_length check (char_length(title) between 1 and 120 and char_length(btrim(title)) > 0),
  content text not null constraint notes_content_length check (char_length(content) between 1 and 5000 and char_length(btrim(content)) > 0),
  color text not null default 'yellow' constraint notes_color check (color in ('yellow', 'pink', 'blue', 'green', 'purple', 'orange')),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_owner_auth_fkey foreign key (owner_id) references auth.users(id) on delete cascade,
  constraint notes_owner_profile_fkey foreign key (owner_id) references public.profiles(id) on delete cascade
);

create index if not exists notes_public_recent_idx on public.notes (created_at desc, id desc) where is_public;
create index if not exists notes_owner_recent_idx on public.notes (owner_id, created_at desc, id desc);

-- Les trigrammes accélèrent les recherches partielles sans moteur de recherche externe.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
create index if not exists notes_title_search_idx on public.notes using gin (title extensions.gin_trgm_ops);
create index if not exists notes_content_search_idx on public.notes using gin (content extensions.gin_trgm_ops);

create or replace function public.prepare_note_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.owner_id is distinct from old.owner_id or new.id is distinct from old.id
     or new.created_at is distinct from old.created_at then
    raise exception 'Identité de la note immuable' using errcode = '42501';
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
create trigger postly_note_updated before update on public.notes
for each row execute function public.prepare_note_update();

-- Ne dépend pas de métadonnées fournies par le navigateur ni d'un email public.
create or replace function public.create_postly_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, 'membre_' || replace(new.id::text, '-', ''), 'Nouveau membre')
  on conflict (id) do nothing;
  return new;
exception when others then
  -- L'inscription reste possible ; ensure_my_profile retente après connexion.
  raise warning 'Postly: profil différé, SQLSTATE %', SQLSTATE;
  return new;
end;
$$;
create trigger postly_user_created after insert on auth.users
for each row execute function public.create_postly_profile();

create or replace function public.ensure_my_profile()
returns public.profiles language plpgsql security definer set search_path = '' as $$
declare result public.profiles;
begin
  if auth.uid() is null then raise exception 'Authentification requise' using errcode = '42501'; end if;
  insert into public.profiles (id, username, display_name)
  values (auth.uid(), 'membre_' || replace(auth.uid()::text, '-', ''), 'Nouveau membre')
  on conflict (id) do nothing;
  select * into result from public.profiles where id = auth.uid();
  return result;
end;
$$;

-- Couvre les comptes créés avant cette migration sans modifier les profils existants.
insert into public.profiles (id, username, display_name)
select id, 'membre_' || replace(id::text, '-', ''), 'Nouveau membre' from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.notes enable row level security;

create policy postly_profiles_read on public.profiles for select to anon, authenticated using (true);
create policy postly_profiles_update on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy postly_notes_read on public.notes for select to anon, authenticated
using (is_public or (select auth.uid()) = owner_id);
create policy postly_notes_insert on public.notes for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy postly_notes_update on public.notes for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy postly_notes_delete on public.notes for delete to authenticated
using ((select auth.uid()) = owner_id);

-- Les privilèges de colonne interdisent également de modifier propriétaire et dates.
revoke all on public.profiles, public.notes from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select (id, username, display_name, created_at) on public.profiles to anon, authenticated;
grant update (username, display_name) on public.profiles to authenticated;
grant select on public.notes to anon, authenticated;
grant insert (owner_id, title, content, color, is_public) on public.notes to authenticated;
grant update (title, content, color, is_public) on public.notes to authenticated;
grant delete on public.notes to authenticated;

revoke all on function public.create_postly_profile() from public, anon, authenticated;
revoke all on function public.prepare_note_update() from public, anon, authenticated;
revoke all on function public.ensure_my_profile() from public, anon;
grant execute on function public.ensure_my_profile() to authenticated;

commit;
