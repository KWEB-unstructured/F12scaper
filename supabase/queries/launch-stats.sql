-- 담당: 김씨 · 출시 후 플레이 수 집계 (목표: 출시 후 첫 2주 100판). 읽기만 한다.
-- launch 를 실제 출시 시각으로 바꿔서 실행한다. 한국 시간(+09) 기준.

-- ① 2주 합계와 목표 대비
with p as (select timestamptz '2026-12-01 00:00+09' as launch)
select count(*)                                   as 시작한_판,
       count(finished_at)                         as 클리어한_판,
       count(distinct nickname)                   as 닉네임_수,
       round(100.0 * count(*) / 100, 0)           as 목표_달성_퍼센트
from public.sessions, p
where started_at >= p.launch and started_at < p.launch + interval '14 days';

-- ② 하루별
with p as (select timestamptz '2026-12-01 00:00+09' as launch)
select (started_at at time zone 'Asia/Seoul')::date as 날짜,
       count(*)                                     as 시작,
       count(finished_at)                           as 클리어
from public.sessions, p
where started_at >= p.launch and started_at < p.launch + interval '14 days'
group by 1
order by 1;
