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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> receiver_id),
  unique (requester_id, receiver_id)
);

create table if not exists public.subject_collaborators (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  subject_id text not null,
  collaborator_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (owner_id <> collaborator_id),
  unique (owner_id, subject_id, collaborator_id),
  foreign key (owner_id, subject_id) references public.subjects(user_id, subject_id) on delete cascade
);

alter table public.subjects enable row level security;
alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.subject_collaborators enable row level security;

-- Profiles are readable to logged-in users so friends and shared subjects can show names/emails.
-- Users can only create/update their own profile row.
drop policy if exists "Profiles are readable by logged in users" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Profiles are readable by logged in users"
on public.profiles
for select
using (auth.role() = 'authenticated');

create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Friend requests: either side can see the request. Only the receiver can accept/decline.
drop policy if exists "Users can read their friend requests" on public.friend_requests;
drop policy if exists "Users can send friend requests" on public.friend_requests;
drop policy if exists "Receivers can respond to friend requests" on public.friend_requests;
drop policy if exists "Users can delete their friend requests" on public.friend_requests;

create policy "Users can read their friend requests"
on public.friend_requests
for select
using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy "Users can send friend requests"
on public.friend_requests
for insert
with check (auth.uid() = requester_id and status = 'pending');

create policy "Receivers can respond to friend requests"
on public.friend_requests
for update
using (auth.uid() = receiver_id)
with check (auth.uid() = receiver_id);

create policy "Users can delete their friend requests"
on public.friend_requests
for delete
using (auth.uid() = requester_id or auth.uid() = receiver_id);

-- Subject collaborators: owners can manage shares, collaborators can see/leave their shares.
drop policy if exists "Users can read subject shares" on public.subject_collaborators;
drop policy if exists "Owners can add subject shares" on public.subject_collaborators;
drop policy if exists "Owners can update subject shares" on public.subject_collaborators;
drop policy if exists "Owners and collaborators can delete subject shares" on public.subject_collaborators;

create policy "Users can read subject shares"
on public.subject_collaborators
for select
using (auth.uid() = owner_id or auth.uid() = collaborator_id);

create policy "Owners can add subject shares"
on public.subject_collaborators
for insert
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.subjects s
    where s.user_id = auth.uid()
      and s.subject_id = subject_collaborators.subject_id
  )
);

create policy "Owners can update subject shares"
on public.subject_collaborators
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Owners and collaborators can delete subject shares"
on public.subject_collaborators
for delete
using (auth.uid() = owner_id or auth.uid() = collaborator_id);

-- Subjects: owners have full control. Shared users can read. Editors can update shared content.
drop policy if exists "Users can read own subjects" on public.subjects;
drop policy if exists "Users can insert own subjects" on public.subjects;
drop policy if exists "Users can update own subjects" on public.subjects;
drop policy if exists "Users can delete own subjects" on public.subjects;
drop policy if exists "Users can read owned or shared subjects" on public.subjects;
drop policy if exists "Owners and editors can update subjects" on public.subjects;

create policy "Users can read owned or shared subjects"
on public.subjects
for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.subject_collaborators sc
    where sc.owner_id = subjects.user_id
      and sc.subject_id = subjects.subject_id
      and sc.collaborator_id = auth.uid()
  )
);

create policy "Users can insert own subjects"
on public.subjects
for insert
with check (auth.uid() = user_id);

create policy "Owners and editors can update subjects"
on public.subjects
for update
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.subject_collaborators sc
    where sc.owner_id = subjects.user_id
      and sc.subject_id = subjects.subject_id
      and sc.collaborator_id = auth.uid()
      and sc.role = 'editor'
  )
)
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.subject_collaborators sc
    where sc.owner_id = subjects.user_id
      and sc.subject_id = subjects.subject_id
      and sc.collaborator_id = auth.uid()
      and sc.role = 'editor'
  )
);

create policy "Users can delete own subjects"
on public.subjects
for delete
using (auth.uid() = user_id);

create or replace function public.find_profile_for_sharing(search_term text)
returns table (
  id uuid,
  email text,
  username text,
  display_name text
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.email, p.username, p.display_name
  from public.profiles p
  where p.id <> auth.uid()
    and (
      lower(coalesce(p.email, '')) = lower(trim(search_term))
      or lower(coalesce(p.username, '')) = lower(trim(search_term))
    )
  limit 1;
$$;

grant execute on function public.find_profile_for_sharing(text) to authenticated;


-- Username helpers. Usernames are public handles for finding friends/shares.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_username_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_username_format
    check (username is null or username ~ '^[a-z0-9_]{3,24}$');
  end if;
end $$;

create unique index if not exists profiles_username_lower_unique_idx
on public.profiles (lower(username))
where username is not null;

create or replace function public.is_username_available(search_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select case
    when trim(coalesce(search_username, '')) !~ '^[A-Za-z0-9_]{3,24}$' then false
    else not exists (
      select 1
      from public.profiles p
      where lower(p.username) = lower(trim(search_username))
    )
  end;
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

create or replace function public.update_my_profile(
  profile_username text,
  profile_display_name text default null
)
returns table (
  id uuid,
  email text,
  username text,
  display_name text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_username text := lower(trim(coalesce(profile_username, '')));
  clean_display text := nullif(trim(coalesce(profile_display_name, '')), '');
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if clean_username = '' then
    raise exception 'Choose a username.';
  end if;

  if clean_username !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'Usernames must be 3-24 characters and can only use lowercase letters, numbers, and underscores.';
  end if;

  if exists (
    select 1 from public.profiles p
    where lower(p.username) = clean_username
      and p.id <> auth.uid()
  ) then
    raise exception 'That username is already taken.';
  end if;

  select lower(u.email) into current_email
  from auth.users u
  where u.id = auth.uid();

  insert into public.profiles (id, email, username, display_name, updated_at)
  values (auth.uid(), current_email, clean_username, coalesce(clean_display, clean_username), now())
  on conflict (id) do update set
    email = excluded.email,
    username = excluded.username,
    display_name = excluded.display_name,
    updated_at = now();

  return query
  select p.id, p.email, p.username, p.display_name, p.created_at, p.updated_at
  from public.profiles p
  where p.id = auth.uid();
end;
$$;

grant execute on function public.update_my_profile(text, text) to authenticated;

-- Share as copy: the recipient gets their own independent subject row.
-- This does not create a collaborator link, so future edits do not affect either user.
create or replace function public.copy_subject_to_user(
  source_subject_id text,
  target_user_id uuid
)
returns table (
  id uuid,
  user_id uuid,
  subject_id text,
  subject_name text,
  subject jsonb,
  description text,
  summary text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  source_row public.subjects%rowtype;
  new_subject_id text;
  new_subject_name text;
  new_subject_json jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if target_user_id is null then
    raise exception 'Missing target user.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You already own this subject.';
  end if;

  select * into source_row
  from public.subjects s
  where s.user_id = auth.uid()
    and s.subject_id = source_subject_id
  limit 1;

  if not found then
    raise exception 'Only the subject owner can send an independent copy.';
  end if;

  if not exists (select 1 from public.profiles p where p.id = target_user_id) then
    raise exception 'The recipient needs to log in once before they can receive a copy.';
  end if;

  new_subject_id := source_row.subject_id || '-copy-' || extract(epoch from now())::bigint || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  new_subject_name := source_row.subject_name || ' (Copy)';

  new_subject_json := coalesce(source_row.subject, '{}'::jsonb)
    || jsonb_build_object(
      'subjectId', new_subject_id,
      'subjectName', new_subject_name,
      'description', coalesce(source_row.description, source_row.subject->>'description', ''),
      'copiedFrom', jsonb_build_object(
        'ownerId', auth.uid(),
        'subjectId', source_row.subject_id,
        'subjectName', source_row.subject_name,
        'copiedAt', now()
      )
    );

  insert into public.subjects (
    user_id,
    subject_id,
    subject_name,
    subject,
    description,
    summary,
    created_at,
    updated_at
  )
  values (
    target_user_id,
    new_subject_id,
    new_subject_name,
    new_subject_json,
    coalesce(source_row.description, ''),
    coalesce(source_row.summary, ''),
    now(),
    now()
  );

  return query
  select s.id, s.user_id, s.subject_id, s.subject_name, s.subject, s.description, s.summary, s.created_at, s.updated_at
  from public.subjects s
  where s.user_id = target_user_id
    and s.subject_id = new_subject_id;
end;
$$;

grant execute on function public.copy_subject_to_user(text, uuid) to authenticated;

create index if not exists subjects_user_id_idx on public.subjects(user_id);
create index if not exists subjects_user_subject_id_idx on public.subjects(user_id, subject_id);
create index if not exists profiles_email_idx on public.profiles(lower(email));
create index if not exists profiles_username_idx on public.profiles(lower(username));
create index if not exists friend_requests_requester_idx on public.friend_requests(requester_id);
create index if not exists friend_requests_receiver_idx on public.friend_requests(receiver_id);
create index if not exists subject_collaborators_owner_subject_idx on public.subject_collaborators(owner_id, subject_id);
create index if not exists subject_collaborators_collaborator_idx on public.subject_collaborators(collaborator_id);
