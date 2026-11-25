begin;

alter table public.notes drop constraint notes_content_length;
alter table public.notes add constraint notes_content_length check (
  char_length(content) between 1 and case when format = 'note' then 5000 else 200000 end
  and (case when format = 'note' then char_length(btrim(content)) else char_length(btrim(content, E' \t\r\n')) end) > 0
);

commit;
