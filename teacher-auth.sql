-- Apply after supabase-setup.sql. This migration does not change the teacher code.
begin;
alter table milky_private.teacher add column if not exists failures integer not null default 0;
alter table milky_private.teacher add column if not exists blocked_until timestamptz;
create table if not exists milky_private.teacher_sessions (
 token_hash bytea primary key,
 credential_hash bytea not null,
 expires_at timestamptz not null
);
alter table milky_private.teacher_sessions enable row level security;
revoke all on milky_private.teacher_sessions from public,anon,authenticated;

create or replace function public.milky_teacher_login(p_code text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t milky_private.teacher; session_token text; moment timestamptz := clock_timestamp();
begin
 select * into t from milky_private.teacher where singleton=true for update;
 if not found then return jsonb_build_object('ok',false,'retry_after',0); end if;
 if t.blocked_until > moment then
  return jsonb_build_object('ok',false,'retry_after',ceil(extract(epoch from t.blocked_until-moment)));
 end if;
 if t.blocked_until is not null then t.failures:=0; end if;
 if p_code is null or char_length(p_code)>64 or t.token_hash <> sha256(convert_to(p_code,'UTF8')) then
  update milky_private.teacher set failures=t.failures+1,
   blocked_until=case when t.failures+1>=5 then moment+interval '5 minutes' else null end where singleton=true;
  -- Do not raise: the failed-attempt update must commit.
  return jsonb_build_object('ok',false,'retry_after',case when t.failures+1>=5 then 300 else 0 end);
 end if;
 update milky_private.teacher set failures=0,blocked_until=null where singleton=true;
 delete from milky_private.teacher_sessions where expires_at<=moment;
 session_token:=replace(gen_random_uuid()::text || gen_random_uuid()::text,'-','');
 insert into milky_private.teacher_sessions(token_hash,credential_hash,expires_at)
 values(sha256(convert_to(session_token,'UTF8')),t.token_hash,moment+interval '8 hours');
 return jsonb_build_object('ok',true,'session_key',session_token);
end $$;

create or replace function public.milky_teacher(p_key text,p_day date)
returns table(id uuid,student_name text,clues integer[],stories integer[],finished boolean,started_at timestamptz,updated_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if p_key is null or char_length(p_key)<>64 or not exists(
  select 1 from milky_private.teacher_sessions s join milky_private.teacher t on t.token_hash=s.credential_hash
  where s.token_hash=sha256(convert_to(p_key,'UTF8')) and s.expires_at>clock_timestamp()
 ) then raise exception 'unauthorized' using errcode='42501'; end if;
 if p_day is null then raise exception 'day required' using errcode='22023'; end if;
 return query select r.id,r.student_name,r.clues,r.stories,r.finished,r.started_at,r.updated_at from milky_private.runs r
 where r.started_at >= (p_day::timestamp at time zone 'Asia/Seoul')
 and r.started_at < ((p_day+1)::timestamp at time zone 'Asia/Seoul') order by r.started_at desc;
end $$;

create or replace function public.milky_teacher_logout(p_session text)
returns void language plpgsql security definer set search_path='' as $$
begin
 update milky_private.teacher_sessions set expires_at=clock_timestamp()
 where token_hash=sha256(convert_to(p_session,'UTF8'));
end $$;
revoke all on function public.milky_teacher_login(text) from public,anon,authenticated;
revoke all on function public.milky_teacher_logout(text) from public,anon,authenticated;
revoke all on function public.milky_teacher(text,date) from public,anon,authenticated;
grant execute on function public.milky_teacher_login(text) to anon;
grant execute on function public.milky_teacher_logout(text) to anon;
grant execute on function public.milky_teacher(text,date) to anon;
commit;
