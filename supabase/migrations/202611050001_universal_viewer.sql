-- Pastly V2 : évolution additive. Aucune réécriture des notes historiques.
begin;

alter table public.notes
  add column content_kind text not null default 'note',
  add column format text not null default 'note',
  add column original_filename text,
  add column metadata jsonb not null default '{}'::jsonb;

alter table public.notes alter column is_public set default false;
alter table public.notes drop constraint notes_content_length;
alter table public.notes add constraint notes_content_length check (
  char_length(content) between 1 and case when format = 'note' then 5000 else 100000 end
  and (case when format = 'note' then char_length(btrim(content)) else char_length(btrim(content, E' \t\r\n')) end) > 0
);
alter table public.notes add constraint notes_format_kind check (
  (content_kind = 'note' and format = 'note') or
  (content_kind = 'text' and format = 'text') or
  (content_kind = 'markdown' and format = 'markdown') or
  (content_kind = 'diagram' and format = 'mermaid') or
  (content_kind = 'data' and format in ('json','yaml','toml','xml','csv','tsv')) or
  (content_kind = 'code' and format in ('code','typescript','javascript','python','rust','go','java','c','cpp','html','css','sql','bash'))
);
alter table public.notes add constraint notes_filename check (
  original_filename is null or (
    char_length(original_filename) between 1 and 255
    and original_filename !~ E'[/\\\\\x01-\x1f\x7f]'
  )
);
-- Métadonnées volontairement fermées. Ajouter les clés autorisées dans une future migration.
alter table public.notes add constraint notes_metadata check (metadata = '{}'::jsonb);

grant insert (content_kind, format, original_filename, metadata) on public.notes to authenticated;
grant update (content_kind, format, original_filename, metadata) on public.notes to authenticated;
-- SELECT sur la table est déjà accordé ; les nouvelles colonnes restent soumises aux RLS existantes.
create index notes_owner_format_idx on public.notes (owner_id, format, updated_at desc, id desc);
create index notes_public_format_idx on public.notes (format, created_at desc, id desc) where is_public;

comment on column public.notes.format is 'note pour les anciens post-it ; le changement de format ne transforme jamais la source';
comment on column public.notes.original_filename is 'Nom seul, sans chemin ; aucun fichier binaire stocké en base';
commit;
