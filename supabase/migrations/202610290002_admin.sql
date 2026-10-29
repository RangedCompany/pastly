-- À appliquer après 202610290001_postly.sql. Aucun rôle n'est attribué automatiquement.
begin;

create table public.admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.admin_role_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  target_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('granted', 'revoked')),
  created_at timestamptz not null default now()
);
alter table public.admin_members enable row level security;
alter table public.admin_role_events enable row level security;
revoke all on public.admin_members, public.admin_role_events from public, anon, authenticated;
revoke all on sequence public.admin_role_events_id_seq from public, anon, authenticated;

-- Ne fait confiance ni aux métadonnées modifiables par le compte, ni au navigateur.
create function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_members where user_id = auth.uid());
$$;

create function public.admin_set_role(p_user_id uuid, p_is_admin boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  changed integer;
begin
  -- Sérialise les changements de droits, puis revérifie l'acteur après l'attente.
  perform pg_catalog.pg_advisory_xact_lock(736284192);
  if not public.is_admin() then
    raise exception 'Accès administrateur requis' using errcode = '42501';
  end if;
  if p_is_admin is null or p_user_id is null then
    raise exception 'Paramètres invalides' using errcode = '22023';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Compte introuvable' using errcode = 'P0002';
  end if;
  if p_is_admin then
    if not exists (select 1 from auth.users where id = p_user_id and email_confirmed_at is not null) then
      raise exception 'Le compte doit confirmer son email' using errcode = '22023';
    end if;
    insert into public.admin_members (user_id, granted_by)
    values (p_user_id, auth.uid()) on conflict (user_id) do nothing;
  else
    if p_user_id = auth.uid() then
      raise exception 'Vous ne pouvez pas retirer vos propres droits' using errcode = '22023';
    end if;
    if (select count(*) from public.admin_members) <= 1
       and exists (select 1 from public.admin_members where user_id = p_user_id) then
      raise exception 'Le dernier administrateur doit être conservé' using errcode = '22023';
    end if;
    delete from public.admin_members where user_id = p_user_id;
  end if;
  get diagnostics changed = row_count;
  if changed > 0 then
    insert into public.admin_role_events (actor_id, target_id, action)
    values (auth.uid(), p_user_id, case when p_is_admin then 'granted' else 'revoked' end);
  end if;
end;
$$;

create function public.admin_overview(p_query text default '', p_role text default 'all', p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Accès administrateur requis' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('all', 'admin', 'member', 'pending')
     or p_page is null or p_page < 1 or p_page > 10000
     or p_query is null or char_length(p_query) > 100 then
    raise exception 'Filtres invalides' using errcode = '22023';
  end if;
  with note_counts as (
    select owner_id, count(*) as total,
      count(*) filter (where is_public) as public_count,
      count(*) filter (where not is_public) as private_count,
      max(created_at) as last_note_at
    from public.notes group by owner_id
  ), accounts as (
    select u.id, u.email, u.created_at, u.email_confirmed_at, u.last_sign_in_at,
      p.username, p.display_name,
      a.user_id is not null as is_admin,
      coalesce(n.total, 0) as note_count,
      coalesce(n.public_count, 0) as public_note_count,
      coalesce(n.private_count, 0) as private_note_count,
      n.last_note_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.admin_members a on a.user_id = u.id
    left join note_counts n on n.owner_id = u.id
  ), filtered as (
    select * from accounts
    where (p_role = 'all' or (p_role = 'admin' and is_admin)
      or (p_role = 'member' and not is_admin)
      or (p_role = 'pending' and email_confirmed_at is null))
    -- Recherche littérale : %, _ et virgules ne sont pas interprétés comme un filtre.
    and (p_query = '' or strpos(lower(coalesce(email, '')), lower(p_query)) > 0
      or strpos(lower(coalesce(username, '')), lower(p_query)) > 0
      or strpos(lower(coalesce(display_name, '')), lower(p_query)) > 0
      or id::text = p_query)
  ), paged as (
    select * from filtered order by created_at desc, id
    limit 20 offset ((p_page - 1) * 20)
  ), events as (
    select e.id, e.action, e.created_at, e.actor_id, e.target_id,
      actor.email as actor_email, target.email as target_email
    from public.admin_role_events e
    left join auth.users actor on actor.id = e.actor_id
    left join auth.users target on target.id = e.target_id
    order by e.id desc limit 30
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'accounts', (select count(*) from accounts),
      'admins', (select count(*) from accounts where is_admin),
      'pending', (select count(*) from accounts where email_confirmed_at is null),
      'new_accounts_7d', (select count(*) from accounts where created_at >= now() - interval '7 days'),
      'sign_ins_7d', (select count(*) from accounts where last_sign_in_at >= now() - interval '7 days'),
      'without_notes', (select count(*) from accounts where note_count = 0),
      'missing_profiles', (select count(*) from accounts where username is null),
      'notes', (select count(*) from public.notes),
      'public_notes', (select count(*) from public.notes where is_public),
      'private_notes', (select count(*) from public.notes where not is_public),
      'new_notes_7d', (select count(*) from public.notes where created_at >= now() - interval '7 days')
    ),
    'accounts', coalesce((select jsonb_agg(to_jsonb(paged) order by created_at desc, id) from paged), '[]'::jsonb),
    'total', (select count(*) from filtered),
    'events', coalesce((select jsonb_agg(to_jsonb(events) order by id desc) from events), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.admin_set_role(uuid, boolean) from public, anon, authenticated;
revoke all on function public.admin_overview(text, text, integer) from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_set_role(uuid, boolean) to authenticated;
grant execute on function public.admin_overview(text, text, integer) to authenticated;

commit;
