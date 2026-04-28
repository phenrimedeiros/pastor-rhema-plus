-- Pastor Rhema PLUS — Pesquisa de satisfação dentro do app
-- Execute este arquivo no SQL Editor do Supabase para habilitar a coleta das respostas.

create extension if not exists "uuid-ossp";

create table if not exists public.satisfaction_surveys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text default 'simple' check (plan in ('simple', 'plus')),
  role text not null,
  nps_score integer not null check (nps_score between 0 and 10),
  primary_tool text not null,
  time_saved text,
  ai_quality text,
  flow_clarity text,
  personalization text,
  difficulty text,
  frequency_driver text,
  liked_most text,
  improve_first text,
  source_page text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id)
);

create index if not exists idx_satisfaction_surveys_user_id
  on public.satisfaction_surveys(user_id);

alter table public.satisfaction_surveys enable row level security;

drop policy if exists "Users can view their own satisfaction survey" on public.satisfaction_surveys;
create policy "Users can view their own satisfaction survey"
  on public.satisfaction_surveys
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own satisfaction survey" on public.satisfaction_surveys;
create policy "Users can insert their own satisfaction survey"
  on public.satisfaction_surveys
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own satisfaction survey" on public.satisfaction_surveys;
create policy "Users can update their own satisfaction survey"
  on public.satisfaction_surveys
  for update
  using (auth.uid() = user_id);

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_satisfaction_surveys_updated_at on public.satisfaction_surveys;
create trigger update_satisfaction_surveys_updated_at before update on public.satisfaction_surveys
  for each row execute procedure public.update_updated_at_column();

comment on table public.satisfaction_surveys is 'Respostas da pesquisa de satisfação exibida dentro do aplicativo';
