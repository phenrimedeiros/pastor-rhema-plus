-- Pastor Rhema PLUS — Schema SQL para Supabase
-- Execute este arquivo todo no SQL Editor do Supabase

-- ============================================
-- 1. ENABLE EXTENSIONS
-- ============================================
create extension if not exists "uuid-ossp";
create extension if not exists "moddatetime";

-- ============================================
-- 2. PROFILES TABLE
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text unique,
  avatar_url text,
  plan text default 'simple' check (plan in ('simple', 'plus')),
  weekly_streak integer default 0,
  sermons_this_month integer default 0,
  total_sermons_generated integer default 0,
  last_sermon_date timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- 3. SERIES TABLE
-- ============================================
create table if not exists public.series (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  series_name text not null,
  overview text,
  current_week integer default 1,
  completed_steps text[] default '{}',
  is_active boolean default true,
  is_archived boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- 4. SERIES WEEKS TABLE
-- ============================================
create table if not exists public.series_weeks (
  id uuid default uuid_generate_v4() primary key,
  series_id uuid not null references public.series(id) on delete cascade,
  week_number integer not null,
  title text not null,
  passage text,
  focus text,
  big_idea text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- 5. SERMON CONTENT TABLE
-- ============================================
create table if not exists public.sermon_content (
  id uuid default uuid_generate_v4() primary key,
  week_id uuid not null references public.series_weeks(id) on delete cascade,
  step text not null, -- 'study', 'builder', 'illustrations', 'application', 'planner', 'final'
  content jsonb not null, -- armazena resposta JSON da IA
  version integer default 1,
  is_active boolean default true,
  generated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- 6. SERMON HISTORY TABLE
-- ============================================
create table if not exists public.sermon_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  series_id uuid references public.series(id) on delete set null,
  week_id uuid references public.series_weeks(id) on delete set null,
  full_content jsonb not null, -- conteúdo completo do sermão
  notes text,
  preached_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- ============================================
-- 7. PODCAST EXPORTS TABLE (OPCIONAL)
-- ============================================
create table if not exists public.podcast_exports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_id uuid references public.series_weeks(id) on delete set null,
  podcast_url text,
  title text,
  duration integer, -- em segundos
  created_at timestamp with time zone default now()
);

-- ============================================
-- 8. INDEXES (Performance)
-- ============================================
create index idx_series_user_id on public.series(user_id);
create index idx_series_weeks_series_id on public.series_weeks(series_id);
create index idx_sermon_content_week_id on public.sermon_content(week_id);
create index idx_sermon_content_step on public.sermon_content(step);
create index idx_sermon_history_user_id on public.sermon_history(user_id);
create index idx_sermon_history_series_id on public.sermon_history(series_id);
create index idx_podcast_exports_user_id on public.podcast_exports(user_id);

-- ============================================
-- 9. ROW LEVEL SECURITY (Segurança)
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.series enable row level security;
alter table public.series_weeks enable row level security;
alter table public.sermon_content enable row level security;
alter table public.sermon_history enable row level security;
alter table public.podcast_exports enable row level security;

-- PROFILES: Usuários só conseguem ver/editar seu próprio profile
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- SERIES: Usuários só conseguem ver/editar suas próprias séries
create policy "Users can view their own series"
  on public.series
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own series"
  on public.series
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own series"
  on public.series
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own series"
  on public.series
  for delete
  using (auth.uid() = user_id);

-- SERIES_WEEKS: Ligar aos seus dados
create policy "Users can view series weeks they own"
  on public.series_weeks
  for select
  using (
    exists (
      select 1 from public.series
      where series.id = series_weeks.series_id
      and series.user_id = auth.uid()
    )
  );

create policy "Users can insert series weeks in their series"
  on public.series_weeks
  for insert
  with check (
    exists (
      select 1 from public.series
      where series.id = series_weeks.series_id
      and series.user_id = auth.uid()
    )
  );

create policy "Users can update series weeks in their series"
  on public.series_weeks
  for update
  using (
    exists (
      select 1 from public.series
      where series.id = series_weeks.series_id
      and series.user_id = auth.uid()
    )
  );

create policy "Users can delete series weeks in their series"
  on public.series_weeks
  for delete
  using (
    exists (
      select 1 from public.series
      where series.id = series_weeks.series_id
      and series.user_id = auth.uid()
    )
  );

-- SERMON_CONTENT: Ligar aos sermons weeks
create policy "Users can view sermon content they own"
  on public.sermon_content
  for select
  using (
    exists (
      select 1 from public.series_weeks sw
      inner join public.series s on s.id = sw.series_id
      where sw.id = sermon_content.week_id
      and s.user_id = auth.uid()
    )
  );

create policy "Users can insert sermon content in their weeks"
  on public.sermon_content
  for insert
  with check (
    exists (
      select 1 from public.series_weeks sw
      inner join public.series s on s.id = sw.series_id
      where sw.id = sermon_content.week_id
      and s.user_id = auth.uid()
    )
  );

create policy "Users can update sermon content they own"
  on public.sermon_content
  for update
  using (
    exists (
      select 1 from public.series_weeks sw
      inner join public.series s on s.id = sw.series_id
      where sw.id = sermon_content.week_id
      and s.user_id = auth.uid()
    )
  );

-- SERMON_HISTORY: Usuários só conseguem ver/editar sua história
create policy "Users can view their own sermon history"
  on public.sermon_history
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sermon history"
  on public.sermon_history
  for insert
  with check (auth.uid() = user_id);

-- PODCAST_EXPORTS: Usuários só conseguem ver/editar seus exports
create policy "Users can view their own podcast exports"
  on public.podcast_exports
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own podcast exports"
  on public.podcast_exports
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own podcast exports"
  on public.podcast_exports
  for delete
  using (auth.uid() = user_id);

-- ============================================
-- 10. TRIGGERS (Automatizar criação de profile)
-- ============================================

-- Função para criar profile ao novo signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, plan)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'simple');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger que dispara ao inserir novo user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 11. UPDATED_AT TRIGGERS
-- ============================================

-- Function para atualizar updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para atualizar updated_at
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_series_updated_at before update on public.series
  for each row execute procedure public.update_updated_at_column();

create trigger update_series_weeks_updated_at before update on public.series_weeks
  for each row execute procedure public.update_updated_at_column();

create trigger update_sermon_content_updated_at before update on public.sermon_content
  for each row execute procedure public.update_updated_at_column();

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

comment on table public.profiles is 'Dados dos pastores';
comment on table public.series is 'Séries de sermões';
comment on table public.series_weeks is 'Semanas dentro de cada série';
comment on table public.sermon_content is 'Conteúdo gerado pela IA para cada etapa (study, builder, illustrations, application, planner, final) com versionamento';
comment on table public.sermon_history is 'Histórico de sermões completados/pregados';
comment on table public.podcast_exports is 'Exportações em formato podcast';

-- ============================================
-- ✅ SCHEMA COMPLETO!
-- Execute tudo acima no SQL Editor do Supabase
-- ============================================
