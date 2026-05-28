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

create index if not exists subjects_user_id_idx on public.subjects(user_id);
create index if not exists subjects_user_subject_id_idx on public.subjects(user_id, subject_id);
create index if not exists profiles_email_idx on public.profiles(lower(email));
create index if not exists profiles_username_idx on public.profiles(lower(username));
create index if not exists friend_requests_requester_idx on public.friend_requests(requester_id);
create index if not exists friend_requests_receiver_idx on public.friend_requests(receiver_id);
create index if not exists subject_collaborators_owner_subject_idx on public.subject_collaborators(owner_id, subject_id);
create index if not exists subject_collaborators_collaborator_idx on public.subject_collaborators(collaborator_id);
