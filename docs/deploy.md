# 실제 배포 (Production) 체크리스트

담당: 김씨. 대시보드 작업이 섞여 있어서 위에서부터 순서대로 한다.

> 키 값(Supabase secret key, DB 비밀번호)과 최종 정답(`FINAL_ANSWER`)은 채팅·이슈·커밋 어디에도 적지 않는다.

## 1. DB 마이그레이션 (Supabase)

최종 키 검증(`/system/terminate` = `/api/verify`)은 DB 함수 `finish_session` 을 부른다. 이 함수가 없으면 `500 db_error` 를 돌려준다.

1. Supabase 대시보드 → SQL Editor → **Create a new snippet**
2. [supabase/migrations/002_finish_session.sql](../supabase/migrations/002_finish_session.sql) 을 통째로 붙여 넣고 **Run**
3. 확인
   ```sql
   -- final_time 칸이 생겼는지
   select column_name from information_schema.columns
   where table_schema = 'public' and table_name = 'sessions';

   -- 함수 실행 권한이 service_role 에만 있는지 (anon, authenticated 가 없어야 한다)
   select grantee from information_schema.routine_privileges where routine_name = 'finish_session';
   ```
4. **Advisors → Security Advisor** 에 새 경고가 없는지 본다. ("RLS Enabled No Policy" 는 일부러 그렇게 만든 것이라 정상)

DB 는 Production 과 Preview 가 같은 프로젝트를 쓴다. 한 번만 하면 된다.

## 2. 환경변수 (Vercel)

**Settings → Environment Variables** 에서 아래를 **Production** 에 추가한다. (Preview 에는 1주차에 `dev/gaudium1257` 브랜치에만 넣어 두었다)

| 이름 | 타입 | 값 |
|---|---|---|
| `SUPABASE_URL` | Config | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Supabase secret key (`.env.local` 과 같은 값) |
| `FINAL_ANSWER` | **Secret** | 최종 정답. 형씨가 조합 규칙을 확정하기 전에는 팀만 아는 임시 값을 넣는다 |

- `FINAL_ANSWER` 가 비어 있으면 Production 의 `/system/terminate` 는 `500 final_answer_not_configured` 다. 개발용 `test8` 로 넘어가지 않는다 (일부러).
- 환경변수는 **다음 배포부터** 적용된다.

## 3. 배포

1. `dev/gaudium1257` → `main` PR. 다른 한 명의 리뷰를 받고 머지한다 (CLAUDE.md Git 규칙).
2. 머지하면 Production 이 자동으로 다시 배포된다.
3. [vercel.json](../vercel.json) 이 같이 적용된다.
   - `regions: ["icn1"]`: 함수를 서울 리전에서 실행한다. 기본값(미국 동부)이면 Supabase(서울)까지 요청마다 태평양을 왕복한다.
   - `rewrites`: `/system/terminate` → `/api/verify`. 8단계에서 플레이어가 콘솔로 보내는 주소다. 브라우저 Network 탭에는 `/system/terminate` 로 보인다 (rewrite 는 서버 안에서 일어나서 주소가 안 바뀐다).
   - `crons`: 매일 18:00 UTC(한국 03:00)에 `/api/ranking` 을 부른다. Supabase 무료 프로젝트가 7일 동안 요청이 없어 일시정지되는 것을 막는다. Cron 은 Production 배포에서만 돈다.
   - 배포가 `regions` 때문에 실패하면(플랜 제한) `regions` 줄만 지우고 Settings → Functions → Function Region 에서 Seoul(icn1)을 고른다.

## 4. 배포 후 확인

| 확인 | 기대 |
|---|---|
| `https://f12scaper.vercel.app/api/ranking` | 200, **`mock` 필드가 없음** |
| `https://f12scaper.vercel.app/api/stage5` | 403, 본문에 `maintenance` |
| `https://f12scaper.vercel.app/system/terminate` (브라우저 주소창 = GET) | 405 `method_not_allowed` (rewrite 가 동작한다는 뜻. 404 면 vercel.json 이 적용 안 된 것) |
| Vercel → Settings → Cron Jobs | `/api/ranking` 이 보임 |
| 실제로 한 판 (시작 → 8단계 → 클리어 → 랭킹) | Supabase 의 `sessions`·`rankings` 에 줄이 생기고 랭킹 화면에 보인다. 1분 안에 깨면 `rankings` 에는 없다 |

## 5. 위조 요청 테스트

Git Bash 에서 실행한다. 모든 요청이 랭킹을 오염시키지 않아야 한다.
curl 의 `-d` 는 기본 Content-Type 이 form 이라서 `-H 'Content-Type: application/json'` 을 꼭 붙인다.

``bash
BASE=https://f12scaper.vercel.app   # 로컬은 http://localhost:5173
T=$BASE/system/terminate
J='Content-Type: application/json'

# 세션 하나 만들기
SID=$(curl -s -X POST $BASE/api/start -H "$J" -d '{"nickname":"테스트"}' | sed 's/.*"sessionId":"\([^"]*\)".*/\1/')
echo $SID

# 400 invalid_session + message: 세션 정보 없이 key 만 (5단계에서 주소만 알아낸 플레이어)
curl -s -X POST $T -H "$J" -d '{"key":"x"}'

# 400 invalid_body + message: JSON 이 아닌 본문 (JSON.stringify 를 빠뜨린 경우와 같다)
curl -s -X POST $T -H 'Content-Type: text/plain' -d '[object Object]'

# 400 invalid_body: 힌트 음수 / 범위 초과 / 단계 번호 밖 / 소수
curl -s -X POST $T -H "$J" -d "{\"sessionId\":\"$SID\",\"key\":\"x\",\"hints\":{\"1\":-100}}"
curl -s -X POST $T -H "$J" -d "{\"sessionId\":\"$SID\",\"key\":\"x\",\"hints\":{\"1\":99}}"
curl -s -X POST $T -H "$J" -d "{\"sessionId\":\"$SID\",\"key\":\"x\",\"hints\":{\"9\":1}}"
curl -s -X POST $T -H "$J" -d "{\"sessionId\":\"$SID\",\"key\":\"x\",\"hints\":{\"1\":1.5}}"

# 400 invalid_session: 없는 세션 / uuid 가 아닌 값
curl -s -X POST $T -H "$J" -d '{"sessionId":"00000000-0000-0000-0000-000000000000","key":"x"}'
curl -s -X POST $T -H "$J" -d '{"sessionId":"hello","key":"x"}'

# 429: 오답 51번 (50번까지는 {"ok":false,...}, 51번째부터 too_many_attempts)
for i in $(seq 1 51); do curl -s -X POST $T -H "$J" -d "{\"sessionId\":\"$SID\",\"key\":\"wrong$i\"}"; echo; done | sort | uniq -c

# 멱등: 새 세션으로 정답을 두 번 → 두 번 다 같은 finalTime, rankings 에는 한 줄
#   (정답은 FINAL_ANSWER. 명령 기록에 남지 않게 직접 입력: read -s KEY)
``

### 테스트 데이터 정리
테스트는 닉네임 `테스트` 로 한다. 끝나면 SQL Editor 에서 지운다 (`rankings` 는 `on delete cascade` 라 같이 지워진다).
``sql
delete from public.sessions where nickname = '테스트';
``
## 6. 출시 직전

- Production 에서 `mock: true` 가 나오는 API 가 없는지
- 테스트 중 쌓인 `sessions`·`rankings` 정리 (4주차, 실행 전 팀 확인)
- 소스맵(`*.js.map`)에는 원본 코드가 그대로 들어간다. 비밀값이 코드에 없는지 한 번 더 확인 (`FINAL_ANSWER`·키는 환경변수에만)
