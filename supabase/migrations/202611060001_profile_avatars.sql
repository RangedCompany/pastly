begin;

alter table public.profiles add column avatar_path text;
alter table public.profiles add constraint profiles_avatar_path_format check (
  avatar_path is null or (
    split_part(avatar_path, '/', 1) = id::text
    and avatar_path ~ '^[a-f0-9-]{36}/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$'
  )
);
grant select (avatar_path) on public.profiles to anon, authenticated;
grant update (avatar_path) on public.profiles to authenticated;

-- These are public profile images; documents opened in the viewer stay local.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/webp']);

create policy pastly_avatars_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (select auth.uid())::text = split_part(name, '/', 1)
  and name ~ '^[a-f0-9-]{36}/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$'
);
create policy pastly_avatars_select on storage.objects for select to authenticated
using (bucket_id = 'avatars' and (select auth.uid())::text = split_part(name, '/', 1));
create policy pastly_avatars_delete on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (select auth.uid())::text = split_part(name, '/', 1));

-- No UPDATE policy: each replacement gets a new URL to avoid a stale cached photo.
-- Delete files through the Storage API, never by deleting storage.objects in SQL.
commit;
