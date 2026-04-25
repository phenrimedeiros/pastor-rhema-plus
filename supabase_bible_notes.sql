-- Pastor Rhema PLUS — Bíblia Interativa: notas, marcações e estudos contextuais
-- Execute este arquivo no SQL Editor do Supabase antes de publicar a funcionalidade.

create extension if not exists "uuid-ossp";

create table if not exists public.bible_notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  lang text not null default 'pt' check (lang in ('pt', 'en', 'es')),
  book_idx integer not null check (book_idx between 0 and 65),
  book_name text not null,
  chapter integer not null check (chapter > 0),
  verse_start integer not null check (verse_start > 0),
  verse_end integer not null check (verse_end >= verse_start),
  selected_text text not null,
  note text default '',
  highlight_color text default 'gold' check (highlight_color in ('gold', 'blue', 'green', 'rose')),
  ai_context jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_bible_notes_user_chapter
  on public.bible_notes(user_id, lang, book_idx, chapter);

alter table public.bible_notes enable row level security;

drop policy if exists "Users can view their own bible notes" on public.bible_notes;
create policy "Users can view their own bible notes"
  on public.bible_notes
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own bible notes" on public.bible_notes;
create policy "Users can insert their own bible notes"
  on public.bible_notes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own bible notes" on public.bible_notes;
create policy "Users can update their own bible notes"
  on public.bible_notes
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own bible notes" on public.bible_notes;
create policy "Users can delete their own bible notes"
  on public.bible_notes
  for delete
  using (auth.uid() = user_id);

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_bible_notes_updated_at on public.bible_notes;
create trigger update_bible_notes_updated_at before update on public.bible_notes
  for each row execute procedure public.update_updated_at_column();

comment on table public.bible_notes is 'Marcações, destaques, notas e estudos contextuais criados na Bíblia Interativa';
