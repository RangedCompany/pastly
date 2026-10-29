-- SQL Editor Supabase, rôle postgres. Après la migration 202610290002_admin.sql.
-- Remplacer les deux valeurs. Ce script est réservé au PREMIER administrateur.
begin;
do $$
declare
  target_email text := 'REPLACE_WITH_EMAIL';
  target_username text := 'REPLACE_WITH_USERNAME';
  target_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(736284192);
  if exists (select 1 from public.admin_members) then
    raise exception 'Un administrateur existe déjà. Gérer les accès depuis /admin.';
  end if;
  select u.id into strict target_id
  from auth.users u join public.profiles p on p.id = u.id
  where lower(u.email) = lower(target_email) and p.username = target_username
    and u.email_confirmed_at is not null;
  insert into public.admin_members (user_id) values (target_id);
  insert into public.admin_role_events (actor_id, target_id, action)
  values (null, target_id, 'granted');
end;
$$;
commit;
