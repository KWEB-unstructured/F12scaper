-- 담당: 김씨 · 플레이 기록 분석 (읽기만 한다. 아무것도 바꾸지 않는다)
-- Supabase SQL Editor 에서 블록 하나씩 실행한다. 여러 개를 한 번에 실행하면 마지막 결과만 보인다.
-- 기간은 각 블록 첫 줄의 since 날짜를 바꾼다. 시각은 한국 시간(+09) 기준.

-- ① 전체 현황: 시작한 판, 클리어한 판, 클리어율, 랭킹에 오른 판
with p as (select timestamptz '2026-11-01 00:00+09' as since)
select count(*)                                                       as 시작,
       count(s.finished_at)                                           as 클리어,
       round(100.0 * count(s.finished_at) / nullif(count(*), 0), 1)   as 클리어율_퍼센트,
       count(r.session_id)                                            as 랭킹_등록
from public.sessions s
left join public.rankings r on r.session_id = s.id, p
where s.started_at >= p.since;

-- ② 클리어 시간 분포 (분). 이상 기록 기준(api/verify.js 의 MIN_RANKED_MS)을 정할 때 본다
--    경과 = 서버가 잰 실제 시간, 기록 = 경과 + 힌트 감점
with p as (select timestamptz '2026-11-01 00:00+09' as since)
select count(*)                                                                                        as 클리어,
       round(min(extract(epoch from finished_at - started_at)) / 60, 1)                                as 최소_분,
       round((percentile_cont(0.1) within group (order by extract(epoch from finished_at - started_at)) / 60)::numeric, 1) as 하위10퍼센트_분,
       round((percentile_cont(0.5) within group (order by extract(epoch from finished_at - started_at)) / 60)::numeric, 1) as 중간값_분,
       round((percentile_cont(0.9) within group (order by extract(epoch from finished_at - started_at)) / 60)::numeric, 1) as 상위10퍼센트_분,
       round(max(extract(epoch from finished_at - started_at)) / 60, 1)                                as 최대_분
from public.sessions, p
where finished_at is not null and started_at >= p.since;

-- ③ 클리어한 판 하나하나 (빠른 순). 수상하게 빠른 기록, 단계 시간 합과 실제 경과가 크게 다른 기록을 눈으로 본다
--    단계 합은 클라이언트가 보낸 값이라 참고만 한다 (프롤로그·이야기 장면 시간은 단계 합에 안 들어갈 수 있다)
with p as (select timestamptz '2026-11-01 00:00+09' as since)
select s.nickname                                                         as 닉네임,
       round(extract(epoch from s.finished_at - s.started_at) / 60, 1)    as 경과_분,
       round(s.final_time / 60000.0, 1)                                   as 기록_분,
       round((select coalesce(sum(v::bigint), 0) from jsonb_each_text(s.stage_times) as t(k, v)) / 60000.0, 1) as 단계합_분,
       s.hints_used                                                       as 힌트,
       s.wrong_attempts                                                   as 최종키_오답,
       r.session_id is not null                                           as 랭킹_등록,
       s.started_at at time zone 'Asia/Seoul'                             as 시작_한국시간
from public.sessions s
left join public.rankings r on r.session_id = s.id, p
where s.finished_at is not null and s.started_at >= p.since
order by 경과_분;

-- ④ 단계별로 얼마나 걸리나 (기획서 기준: 10분 넘게 막히면 힌트 수정, 1분 안에 풀리면 퍼즐 강화)
with p as (select timestamptz '2026-11-01 00:00+09' as since)
select t.k::int                                                                       as 단계,
       count(*)                                                                       as 판수,
       round((percentile_cont(0.5) within group (order by t.v::numeric) / 60000)::numeric, 1) as 중간값_분,
       round(max(t.v::numeric) / 60000, 1)                                            as 최대_분,
       count(*) filter (where t.v::numeric > 600000)                                  as 십분넘음,
       count(*) filter (where t.v::numeric < 60000)                                   as 일분안됨
from public.sessions s, jsonb_each_text(s.stage_times) as t(k, v), p
where s.finished_at is not null and s.started_at >= p.since
group by t.k
order by 단계;

-- ⑤ 어디서 그만두나: 시작만 하고 안 끝난 판이 마지막으로 기록을 남긴 단계는 서버가 모른다 (1~7단계는 브라우저 안에서만 진행)
--    서버가 아는 것은 "8단계에서 최종 키를 시도했는지"뿐이다
with p as (select timestamptz '2026-11-01 00:00+09' as since)
select count(*) filter (where finished_at is null and wrong_attempts = 0) as 최종키_시도_없이_그만둠,
       count(*) filter (where finished_at is null and wrong_attempts > 0) as 최종키_틀리고_그만둠,
       count(*) filter (where wrong_attempts >= 50)                       as 오답제한_걸림
from public.sessions, p
where started_at >= p.since;
