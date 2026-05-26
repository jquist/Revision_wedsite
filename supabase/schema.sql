create extension if not exists "pgcrypto";

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null,
  subject_name text not null,
  subject jsonb not null,
  description text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, subject_id)
);

alter table public.subjects enable row level security;

drop policy if exists "Users can read own subjects" on public.subjects;
drop policy if exists "Users can insert own subjects" on public.subjects;
drop policy if exists "Users can update own subjects" on public.subjects;
drop policy if exists "Users can delete own subjects" on public.subjects;

create policy "Users can read own subjects"
on public.subjects
for select
using (auth.uid() = user_id);

create policy "Users can insert own subjects"
on public.subjects
for insert
with check (auth.uid() = user_id);

create policy "Users can update own subjects"
on public.subjects
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own subjects"
on public.subjects
for delete
using (auth.uid() = user_id);

create index if not exists subjects_user_id_idx on public.subjects(user_id);
create index if not exists subjects_user_subject_id_idx on public.subjects(user_id, subject_id);
