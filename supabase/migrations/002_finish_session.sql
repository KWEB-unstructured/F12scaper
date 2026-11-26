-- 담당: 김씨 · 2026-11-17 · /api/verify 용 변경. 이미 schema.sql 을 실행한 DB 에 한 번만 실행한다.
-- (새 프로젝트라면 schema.sql 하나만 실행하면 되고, 이 파일은 필요 없다)
-- Supabase SQL Editor 에 통째로 붙여 넣고 Run. 여러 번 실행해도 안전하다.

-- 1. 클리어 기록을 세션에도 저장한다.
--    랭킹에서 빠진 기록(기준 시간 미만)도 "이미 클리어한 세션"에 같은 결과를 돌려줘야 하기 때문이다.
alter table public.sessions add column if not exists final_time integer;  -- ms, 클리어 전에는 null

-- 2. 최종 정답 제출을 한 번에 처리하는 함수.
--    조회 → 판단 → 수정 → 랭킹 추가를 함수 하나(= 트랜잭션 하나)로 묶는다.
--    중간에 실패하면 전부 취소되고, 같은 세션의 동시 요청은 행 잠금(for update)에서 줄을 선다.
--    정답 비교와 감점 계산은 JS(api/verify.js)가 하고, 여기는 DB 상태만 다룬다.
create or replace function public.finish_session(
  p_session_id     uuid,
  p_correct        boolean,   -- 이번 입력이 정답인가
  p_hints_used     integer,   -- 힌트 사용 수 합계
  p_penalty_ms     integer,   -- 힌트 감점 (ms)
  p_stage_times    jsonb,     -- 단계별 소요 시간 (기록용)
  p_max_wrong      integer,   -- 오답 허용 횟수 (넘으면 too_many_attempts)
  p_min_ranked_ms  integer    -- 이보다 빨리 끝난 기록은 랭킹에 넣지 않는다
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  s          public.sessions%rowtype;
  v_elapsed  bigint;
  v_final    integer;
  v_rank     integer;
begin
  -- ① 세션 조회 + 잠금. 같은 세션으로 동시에 들어온 요청은 앞의 요청이 끝날 때까지 여기서 기다린다
  select * into s from public.sessions where id = p_session_id for update;
  if not found then
    return jsonb_build_object('status', 'invalid_session');
  end if;

  -- ② 이미 클리어한 세션: 정답을 다시 보지 않고 저장된 결과를 그대로 (멱등)
  if s.finished_at is not null then
    select (select count(*) from public.rankings o where o.final_time < r.final_time)::integer + 1
      into v_rank
      from public.rankings r
     where r.session_id = s.id;   -- 랭킹에서 빠진 기록이면 행이 없어 v_rank 는 null
    return jsonb_build_object('status', 'ok', 'final_time', s.final_time, 'rank', v_rank);
  end if;

  -- ③ 오답 제한: 정답 여부와 상관없이 막는다
  if s.wrong_attempts >= p_max_wrong then
    return jsonb_build_object('status', 'too_many_attempts');
  end if;

  -- ④ 오답: 횟수만 올린다
  if not p_correct then
    update public.sessions set wrong_attempts = wrong_attempts + 1 where id = s.id;
    return jsonb_build_object('status', 'wrong');
  end if;

  -- ⑤ 정답: 시작 시각은 DB 에 저장된 값 기준 (클라이언트 시계를 쓰지 않는다)
  v_elapsed := floor(extract(epoch from (now() - s.started_at)) * 1000);
  v_final := least(v_elapsed + p_penalty_ms, 2000000000);  -- integer 범위(약 24일)를 넘지 않게

  update public.sessions
     set finished_at = now(),
         hints_used  = p_hints_used,
         stage_times = p_stage_times,
         final_time  = v_final
   where id = s.id;

  -- ⑥ 너무 빠른 기록은 세션에만 남기고 랭킹에는 넣지 않는다
  if v_elapsed >= p_min_ranked_ms then
    insert into public.rankings (session_id, nickname, final_time, hints_used)
    values (s.id, s.nickname, v_final, p_hints_used);
    select count(*)::integer + 1 into v_rank from public.rankings where final_time < v_final;
  end if;

  return jsonb_build_object('status', 'ok', 'final_time', v_final, 'rank', v_rank);
end;
$$;

-- 3. 권한: Supabase 는 public 스키마 함수를 anon(브라우저 키)도 부를 수 있게 기본 허용한다.
--    이 함수는 서버(service_role)만 부르게 막는다. 브라우저에서 /rest/v1/rpc/finish_session 으로 부르는 길을 닫는 것.
revoke execute on function public.finish_session(uuid, boolean, integer, integer, jsonb, integer, integer) from public, anon, authenticated;
grant execute on function public.finish_session(uuid, boolean, integer, integer, jsonb, integer, integer) to service_role;
