-- 담당: 김씨 · 출시 직전 테스트·개발 기록 정리. ⚠️ 지운 기록은 되돌릴 수 없다. 실행 전에 팀에 알리고 ①로 대상을 먼저 본다.
-- cutoff 를 "이 시각 전에 시작한 판은 전부 테스트"인 시각(보통 출시 시각)으로 바꾼다. 한국 시간(+09) 기준.
-- rankings 는 sessions 를 on delete cascade 로 참조하므로 sessions 만 지우면 같이 지워진다.

-- ① 먼저 실행: 지워질 판 수와 그 안의 랭킹 기록
with p as (select timestamptz '2026-12-01 00:00+09' as cutoff)
select count(*)                                                     as 지울_판,
       count(*) filter (where finished_at is not null)              as 그중_클리어,
       (select count(*) from public.rankings r join public.sessions s on s.id = r.session_id, p
         where s.started_at < p.cutoff)                             as 그중_랭킹,
       (select count(*) from public.sessions, p where started_at >= p.cutoff) as 남을_판
from public.sessions, p
where started_at < p.cutoff;

-- ② ①의 숫자가 맞으면 실행 (cutoff 를 ①과 똑같이)
delete from public.sessions where started_at < timestamptz '2026-12-01 00:00+09';

-- ③ 확인: 랭킹이 비었거나 출시 뒤 기록만 남았는지
select count(*) as 남은_판 from public.sessions;
select count(*) as 남은_랭킹 from public.rankings;
