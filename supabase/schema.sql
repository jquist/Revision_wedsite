-- Run this in Supabase SQL Editor.
-- It creates one row per saved subject, with the full subject stored as JSONB.

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null,
  subject_name text not null,
  subject jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_user_subject_unique unique (user_id, subject_id)
);

alter table public.subjects enable row level security;

-- Recreate policies safely if you rerun this file.
drop policy if exists "Users can read own subjects" on public.subjects;
drop policy if exists "Users can insert own subjects" on public.subjects;
drop policy if exists "Users can update own subjects" on public.subjects;
drop policy if exists "Users can delete own subjects" on public.subjects;

create policy "Users can read own subjects"
on public.subjects
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own subjects"
on public.subjects
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own subjects"
on public.subjects
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own subjects"
on public.subjects
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_subjects_updated_at on public.subjects;

create trigger set_subjects_updated_at
before update on public.subjects
for each row
execute function public.set_updated_at();
