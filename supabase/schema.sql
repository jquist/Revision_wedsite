-- Run this in Supabase SQL Editor.
-- Updated structure:
--   subjects = one row per subject
--   topics   = one row per topic linked to a subject
--
-- This keeps the old `subject` JSONB column only as a small legacy metadata/fallback field.
-- The large topic content is moved into public.topics so Supabase is easier to manage.

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null,
  subject_name text not null,
  description text,
  summary text,
  subject jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_user_subject_unique unique (user_id, subject_id)
);

-- If you already had the older subjects table, these make it match the newer structure safely.
alter table public.subjects add column if not exists description text;
alter table public.subjects add column if not exists summary text;
alter table public.subjects add column if not exists subject jsonb;
alter table public.subjects alter column subject drop not null;
alter table public.subjects alter column subject set default '{}'::jsonb;

-- Helpful if the old table existed without the exact named constraint.
create unique index if not exists subjects_user_subject_unique_idx
on public.subjects (user_id, subject_id);

-- Backfill new plain columns from the old JSON where possible.
update public.subjects
set
  description = coalesce(description, subject->>'description', subject->>'summary'),
  summary = coalesce(summary, subject->>'summary')
where subject is not null;

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  topic_id text not null,
  topic_name text not null,
  summary text,
  source_files jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  flashcards jsonb not null default '[]'::jsonb,
  quiz_questions jsonb not null default '[]'::jsonb,
  glossary jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topics_subject_topic_unique unique (subject_id, topic_id)
);

create index if not exists topics_user_id_idx on public.topics (user_id);
create index if not exists topics_subject_id_idx on public.topics (subject_id);
create unique index if not exists topics_subject_topic_unique_idx
on public.topics (subject_id, topic_id);

-- One-time migration: if old subject.subject->topics exists, split those topics into rows.
-- It only runs for subjects that do not already have topic rows.
insert into public.topics (
  user_id,
  subject_id,
  topic_id,
  topic_name,
  summary,
  source_files,
  notes,
  flashcards,
  quiz_questions,
  glossary,
  position
)
select
  s.user_id,
  s.id,
  coalesce(topic_item.value->>'topicId', topic_item.value->>'id', 'topic-' || topic_item.ordinality::text),
  coalesce(topic_item.value->>'topicName', topic_item.value->>'title', 'Topic ' || topic_item.ordinality::text),
  coalesce(topic_item.value->>'summary', topic_item.value->>'description', ''),
  coalesce(topic_item.value->'sourceFiles', '[]'::jsonb),
  coalesce(topic_item.value->'notes', topic_item.value->'revision_notes', '[]'::jsonb),
  coalesce(topic_item.value->'flashcards', '[]'::jsonb),
  coalesce(topic_item.value->'quizQuestions', topic_item.value->'quiz_questions', '[]'::jsonb),
  coalesce(topic_item.value->'glossary', '[]'::jsonb),
  (topic_item.ordinality - 1)::integer
from public.subjects s
cross join lateral jsonb_array_elements(coalesce(s.subject->'topics', '[]'::jsonb)) with ordinality as topic_item(value, ordinality)
where s.subject is not null
  and not exists (
    select 1
    from public.topics t
    where t.subject_id = s.id
  )
on conflict (subject_id, topic_id) do nothing;

alter table public.subjects enable row level security;
alter table public.topics enable row level security;

-- Recreate policies safely if you rerun this file.
drop policy if exists "Users can read own subjects" on public.subjects;
drop policy if exists "Users can insert own subjects" on public.subjects;
drop policy if exists "Users can update own subjects" on public.subjects;
drop policy if exists "Users can delete own subjects" on public.subjects;

drop policy if exists "Users can read own topics" on public.topics;
drop policy if exists "Users can insert own topics" on public.topics;
drop policy if exists "Users can update own topics" on public.topics;
drop policy if exists "Users can delete own topics" on public.topics;

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

create policy "Users can read own topics"
on public.topics
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own topics"
on public.topics
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own topics"
on public.topics
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own topics"
on public.topics
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

drop trigger if exists set_topics_updated_at on public.topics;
create trigger set_topics_updated_at
before update on public.topics
for each row
execute function public.set_updated_at();
