# 운영 가이드 (출시 후)

담당: 김씨. 출시 뒤에 생길 일과 대응 방법. 배포 절차는 [deploy.md](deploy.md), 호환성은 [compat-checklist.md](compat-checklist.md).

> 키 값(Supabase secret key)과 최종 키(`FINAL_ANSWER`)는 채팅·이슈·커밋 어디에도 적지 않는다.

## 1. 증상별 대응

| 증상 | 먼저 볼 곳 | 원인과 대응 |
|---|---|---|
| 프롤로그 끝에서 "다시 시도"만 계속 뜬다 (게임 시작 불가) | Vercel → Logs 에서 `/api/start` 의 `[api/start]` 줄 | ① **Supabase 일시정지**: 로그에 521·`fetch failed`. Supabase 대시보드 → 프로젝트 → **Restore** (몇 분). ② 키 문제: `Invalid API key` → 2절 키 교체 확인 |
| 8단계에서 `500 final_answer_not_configured` | Vercel → Settings → Environment Variables | Production 에 `FINAL_ANSWER` 가 없다. 넣고 **Redeploy** |
| 8단계에서 `500 db_error` | Logs 의 `[api/verify]` 줄 | 함수 `finish_session` 이 없으면 `Could not find the function` → [migrations/002](../supabase/migrations/002_finish_session.sql) 실행. 그 밖은 일시정지와 같은 대응 |
| "정답을 넣었는데 오답이래요" | — | 최종 키가 바뀌었는데 Redeploy 를 안 했거나, 플레이어가 조합을 틀렸다. 대소문자·앞뒤 공백은 서버가 무시한다 |
| "입력이 차단됐어요" (429) | — | 그 세션에서 최종 키를 50번 넘게 틀렸다. 그 세션은 끝까지 막힌다. ☰ → 처음부터 다시 (기록도 처음부터) |
| 랭킹이 비어 있다 / 이상하다 | `/api/ranking` 직접 열기 | `mock: true` 가 보이면 Production 환경변수가 빠진 것. 500 이면 일시정지 |
| 수상하게 빠른 기록이 1위 | [analysis.sql](../supabase/queries/analysis.sql) ③ | 4절 이상 기록 처리 |

## 2. 정기 점검

| 언제 | 할 일 |
|---|---|
| 매주 | Vercel → Settings → **Cron Jobs** → `/api/ranking` 의 최근 실행이 성공인지. 실패가 이어지면 Supabase 가 7일 뒤 일시정지된다 |
| 매주 | Supabase → **Advisors → Security Advisor** 에 새 경고가 없는지 ("RLS Enabled No Policy" 는 정상) |
| 출시 후 2주 | [launch-stats.sql](../supabase/queries/launch-stats.sql) 로 플레이 수 집계 (목표 100판) |

## 3. 값 바꾸기

**최종 키(`FINAL_ANSWER`) 교체** — 형씨가 조합 규칙을 확정했을 때
1. Vercel → Environment Variables → `FINAL_ANSWER` → **Edit** → 새 값 (Production)
2. Deployments → 최신 Production → **Redeploy**
3. 직접 한 판으로 확인. 이미 클리어한 세션의 기록은 그대로 남는다

**Supabase secret key 교체** — 키가 노출됐을 때 (채팅·스크린샷·커밋 등)
1. Supabase → Project Settings → API Keys → **새 secret key 만들기**
2. Vercel 의 `SUPABASE_SERVICE_ROLE_KEY` (Production, `dev/gaudium1257` Preview 둘 다) 와 각자 `.env.local` 을 새 값으로 → Redeploy
3. 동작 확인 뒤 **옛 키 삭제** (이게 노출된 키를 실제로 무효로 만드는 단계)

## 4. 이상 기록 기준

지금 규칙: 서버가 잰 경과 시간이 **5분 미만**이면 기록은 남기되 랭킹에 넣지 않는다 (`api/verify.js` 의 `MIN_RANKED_MS`).

**조정 절차**
1. 팀 테스트가 쌓이면 [analysis.sql](../supabase/queries/analysis.sql) ② (분포)·③ (한 판씩)을 본다
2. "답을 다 아는 사람이 최대한 빨리 했을 때"보다 조금 짧게 잡는다. 저장소가 공개라 답을 미리 아는 건 막을 수 없고, 이 기준이 랭킹 공정성의 마지노선이다
3. `MIN_RANKED_MS` 를 바꾸는 PR → 머지
4. 이미 랭킹에 올라간 빠른 기록은 자동으로 빠지지 않는다. 필요하면 SQL Editor 에서 (기준 5분 예)
   ```sql
   delete from public.rankings r using public.sessions s
   where r.session_id = s.id and s.finished_at - s.started_at < interval '5 minutes';
   ```

결정 (2026-11-26): 1분 → **5분**. 김씨가 처음부터 직접 한 판에 45분(힌트 2개), 기획 목표는 30~60분. 답을 다 알아도 프롤로그·4단계 새로고침·7단계 중단점 등을 거치면 몇 분은 걸리므로, 답만 복사한 기록을 거르면서 진짜 빠른 사람은 살리는 선으로 잡았다. 팀원 테스트 기록을 보고 다시 조정할 수 있다.

**단계 시간 합과 실제 경과가 크게 다른 기록은 제외하지 않는다.**
- `stage_times` 는 클라이언트가 보내는 값이라, 속이려는 사람은 그럴듯한 값을 맞춰 보낼 수 있다. 걸러 내는 효과가 없다
- 정상 플레이어도 프롤로그·이야기 장면·새로고침 시간 때문에 단계 합이 경과보다 짧다. 오히려 정상 기록이 걸린다
- 그래서 단계 시간은 퍼즐 난이도 분석(③·④)에만 쓴다

## 5. 출시 직전

1. [compat-checklist.md](compat-checklist.md) 2절 수동 점검
2. 최종 키 교체 (3절), Production 한 판
3. 테스트 기록 정리: [cleanup-before-launch.sql](../supabase/queries/cleanup-before-launch.sql) — ① 로 대상 확인 → 팀에 알림 → ② 실행
4. `/api/ranking` 에 `mock` 없음, `/api/stage5` 403, `/system/terminate` GET 405 확인 ([deploy.md](deploy.md) 4절)
