-- Pastor Rhema PLUS — Chat Persistence Schema
-- Execute este arquivo no SQL Editor do Supabase

create extension if not exists "uuid-ossp";

-- ============================================
-- 1. CHAT THREADS TABLE
-- ============================================
create table if not exists public.chat_threads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- 2. CHAT MESSAGES TABLE
-- ============================================
create table if not exists public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- ============================================
-- 3. INDEXES
-- ============================================
create index if not exists idx_chat_threads_user_id on public.chat_threads(user_id);
create index if not exists idx_chat_threads_updated_at on public.chat_threads(updated_at desc);
create index if not exists idx_chat_messages_thread_id on public.chat_messages(thread_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(thread_id, created_at asc);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Users can view their own chat threads" on public.chat_threads;
create policy "Users can view their own chat threads"
  on public.chat_threads for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own chat threads" on public.chat_threads;
create policy "Users can insert their own chat threads"
  on public.chat_threads for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own chat threads" on public.chat_threads;
create policy "Users can update their own chat threads"
  on public.chat_threads for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own chat threads" on public.chat_threads;
create policy "Users can delete their own chat threads"
  on public.chat_threads for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view messages in their own threads" on public.chat_messages;
create policy "Users can view messages in their own threads"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_threads
      where chat_threads.id = chat_messages.thread_id
      and chat_threads.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert messages in their own threads" on public.chat_messages;
create policy "Users can insert messages in their own threads"
  on public.chat_messages for insert
  with check (
    exists (
      select 1 from public.chat_threads
      where chat_threads.id = chat_messages.thread_id
      and chat_threads.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete messages in their own threads" on public.chat_messages;
create policy "Users can delete messages in their own threads"
  on public.chat_messages for delete
  using (
    exists (
      select 1 from public.chat_threads
      where chat_threads.id = chat_messages.thread_id
      and chat_threads.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. TRIGGERS
-- ============================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.touch_chat_thread_updated_at()
returns trigger as $$
begin
  update public.chat_threads
    set updated_at = now()
    where id = new.thread_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists update_chat_threads_updated_at on public.chat_threads;
create trigger update_chat_threads_updated_at
  before update on public.chat_threads
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists touch_chat_threads_on_message_insert on public.chat_messages;
create trigger touch_chat_threads_on_message_insert
  after insert on public.chat_messages
  for each row execute procedure public.touch_chat_thread_updated_at();
