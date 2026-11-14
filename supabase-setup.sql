-- Run once in the Supabase project's SQL Editor as its database owner.
-- No existing application tables or data are changed.
begin;
create schema if not exists milky_private;
revoke all on schema milky_private from public, anon, authenticated;

create table if not exists milky_private.runs (
  id uuid primary key,
  token_hash bytea not null,
  student_name text not null check (char_length(student_name) between 1 and 24),
  clues integer[] not null default '{}',
  stories integer[] not null default '{}',
  finished boolean not null default false,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists milky_runs_started on milky_private.runs(started_at);
create table if not exists milky_private.teacher (
  singleton boolean primary key default true check(singleton),
  token_hash bytea not null
);
alter table milky_private.runs enable row level security;
alter table milky_private.teacher enable row level security;
revoke all on all tables in schema milky_private from public, anon, authenticated;

create or replace function public.milky_start(p_id uuid, p_token text, p_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r milky_private.runs;
begin
  if p_id is null or p_token is null or p_token !~ '^[a-f0-9]{64}$'
     or p_name is null or char_length(btrim(p_name)) not between 1 and 24
     or p_name ~ '[[:cntrl:]]' then
    raise exception 'invalid input' using errcode = '22023';
  end if;
  insert into milky_private.runs(id, token_hash, student_name)
    values(p_id, sha256(convert_to(p_token, 'UTF8')), btrim(p_name))
    on conflict(id) do nothing;
  select * into r from milky_private.runs where id = p_id;
  if r.token_hash <> sha256(convert_to(p_token, 'UTF8')) or r.student_name <> btrim(p_name) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  return jsonb_build_object('id', r.id);
end $$;

create or replace function public.milky_update(p_id uuid, p_token text, p_clues integer[], p_stories integer[], p_finished boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r milky_private.runs; c integer[]; s integer[];
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  select * into r from milky_private.runs where id = p_id for update;
  if not found or r.token_hash <> sha256(convert_to(p_token, 'UTF8')) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_clues is null or p_stories is null or p_finished is null
    or cardinality(p_clues) > 9 or cardinality(p_stories) > 3
    or exists(select 1 from unnest(p_clues) n where n is null or n not between 0 and 8)
    or exists(select 1 from unnest(p_stories) n where n is null or n not between 0 and 2) then
    raise exception 'invalid progress' using errcode = '22023';
  end if;
  select coalesce(array_agg(distinct n order by n), '{}') into c from unnest(r.clues || p_clues) n;
  select coalesce(array_agg(distinct n order by n), '{}') into s from unnest(r.stories || p_stories) n;
  if exists(select 1 from unnest(s) n where not array[n*3,n*3+1,n*3+2] <@ c)
     or (p_finished and cardinality(s) <> 3) then
    raise exception 'incomplete prerequisites' using errcode = '22023';
  end if;
  update milky_private.runs set clues=c, stories=s,
    finished=r.finished or p_finished, updated_at=now() where id=p_id;
  return jsonb_build_object('saved',true);
end $$;

create or replace function public.milky_teacher(p_key text, p_day date)
returns table(id uuid, student_name text, clues integer[], stories integer[], finished boolean, started_at timestamptz, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if p_key is null or char_length(p_key) <> 64 or not exists(
    select 1 from milky_private.teacher where token_hash=sha256(convert_to(p_key, 'UTF8'))
  ) then raise exception 'unauthorized' using errcode = '42501'; end if;
  if p_day is null then raise exception 'day required' using errcode='22023'; end if;
  return query select r.id,r.student_name,r.clues,r.stories,r.finished,r.started_at,r.updated_at
    from milky_private.runs r
    where r.started_at >= (p_day::timestamp at time zone 'Asia/Seoul')
      and r.started_at < ((p_day+1)::timestamp at time zone 'Asia/Seoul')
    order by r.started_at desc;
end $$;

revoke all on function public.milky_start(uuid,text,text) from public, anon, authenticated;
revoke all on function public.milky_update(uuid,text,integer[],integer[],boolean) from public, anon, authenticated;
revoke all on function public.milky_teacher(text,date) from public, anon, authenticated;
grant execute on function public.milky_start(uuid,text,text) to anon;
grant execute on function public.milky_update(uuid,text,integer[],integer[],boolean) to anon;
grant execute on function public.milky_teacher(text,date) to anon;

-- This is shown ONLY the first time. Keep it privately for teacher.html.
-- The database stores only its hash. Re-running does not change the key.
with new_key as materialized (
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') as token
), inserted as (
  insert into milky_private.teacher(singleton,token_hash)
  select true,sha256(convert_to(token,'UTF8')) from new_key
  on conflict(singleton) do nothing returning token_hash
)
select token as teacher_access_key from new_key join inserted
  on inserted.token_hash=sha256(convert_to(new_key.token,'UTF8'));
commit;
