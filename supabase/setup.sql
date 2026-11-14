-- HearMind AI Phase 2: execute once in Supabase SQL Editor.
-- Enable Authentication > Providers > Anonymous Sign-ins in dashboard first.
create extension if not exists pgcrypto;
create table if not exists public.classrooms (
 id uuid primary key default gen_random_uuid(),
 code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
 title text not null check (char_length(title) between 1 and 100),
 teacher_id uuid not null references auth.users(id) on delete cascade,
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.classroom_members (
 room_id uuid not null references public.classrooms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(room_id,user_id)
);
create table if not exists public.captions (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.classrooms(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 text text not null check (char_length(text) between 1 and 4000),
 created_at timestamptz not null default now()
);
create index if not exists captions_room_created_idx on public.captions(room_id,created_at);
create index if not exists classroom_members_user_idx on public.classroom_members(user_id);
alter table public.classrooms enable row level security;
alter table public.classroom_members enable row level security;
alter table public.captions enable row level security;
-- Membership checks use a SECURITY DEFINER function to avoid recursive RLS.
create or replace function public.is_room_member(p_room uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.classroom_members where room_id=p_room and user_id=(select auth.uid()));
$$;
revoke all on function public.is_room_member(uuid) from public;
grant execute on function public.is_room_member(uuid) to authenticated;
create policy "members read rooms" on public.classrooms for select to authenticated using (public.is_room_member(id));
create policy "teachers close rooms" on public.classrooms for update to authenticated using (teacher_id=(select auth.uid())) with check (teacher_id=(select auth.uid()));
create policy "members read membership" on public.classroom_members for select to authenticated using (public.is_room_member(room_id));
create policy "members read captions" on public.captions for select to authenticated using (public.is_room_member(room_id));
create policy "teacher writes captions" on public.captions for insert to authenticated with check (
 author_id=(select auth.uid()) and exists (
 select 1 from public.classrooms where id=room_id and teacher_id=(select auth.uid()) and is_active=true
 ));
-- Random room code is generated server-side; teacher is always the caller.
create or replace function public.create_classroom(p_title text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare rid uuid; roomcode text; attempt int;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if length(trim(coalesce(p_title,''))) not between 1 and 100 then raise exception 'Invalid title'; end if;
 for attempt in 1..12 loop
   roomcode := upper(substr(encode(gen_random_bytes(6),'hex'),1,6));
   begin
     insert into public.classrooms(code,title,teacher_id) values(roomcode,trim(p_title),auth.uid()) returning id into rid;
     exit;
   exception when unique_violation then continue;
   end;
 end loop;
 if rid is null then raise exception 'Could not allocate room code'; end if;
 insert into public.classroom_members(room_id,user_id) values(rid,auth.uid());
 return rid;
end $$;
create or replace function public.join_classroom(p_code text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare rid uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_code is null or p_code !~ '^[A-Z0-9]{6}$' then raise exception 'Invalid room code'; end if;
 select id into rid from public.classrooms where code=p_code and is_active=true;
 if rid is null then raise exception 'Room not found or closed'; end if;
 insert into public.classroom_members(room_id,user_id) values(rid,auth.uid()) on conflict do nothing;
 return rid;
end $$;
revoke all on function public.create_classroom(text) from public;
revoke all on function public.join_classroom(text) from public;
grant execute on function public.create_classroom(text) to authenticated;
grant execute on function public.join_classroom(text) to authenticated;
-- Supabase Realtime: add table to publication for Postgres Changes.
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='captions') then
   alter publication supabase_realtime add table public.captions;
 end if;
end $$;
