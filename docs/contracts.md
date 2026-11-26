# 팀 계약 (1주차에 확정, 바꿀 때는 셋이 합의)

이 두 가지만 고정되면 세 명이 동시에 작업할 수 있다.
- 단계 모듈 형식: 형씨 확정
- API 요청·응답 형식: 김씨 확정

## 1. 단계 모듈 형식

`src/stages/stageN.js` 는 아래 객체를 default export 한다. 타입 정의는 [src/stages/types.js](../src/stages/types.js).

```js
/** @type {import('./types.js').Stage} */
export default {
  id: 1,
  title: '개발자의 흔적',
  tool: 'Elements — HTML 주석',          // 클리어 카드 제목
  toolUsage: '실무에서는 ...',             // 클리어 카드 설명 한 줄
  guide: ['...', { speaker: 'developer', text: '...' }], // 단계 시작 대사. 문자열이면 주인공 독백
  answerHash: '<npm run hash -- "정답">',  // 8단계는 null
  input: true,                             // false 면 입력창 숨김 (3단계)
  verify: 'local',                         // 'terminate' 면 입력창 없이 콘솔 fetch('/system/terminate') (8단계)
  hints: ['방향', '탭과 위치', '거의 정답'],
  taunts: ['오답일 때 보안 시스템 경고'],   // 선택
  mount(el, ctx) {
    el.innerHTML = `...퍼즐 마크업...`;
    return () => { /* 정리: 전역 함수 삭제, 타이머 해제, title 원복 */ };
  },
};
```

`ctx` (StageContext)
| 이름 | 설명 |
|---|---|
| `ctx.complete(fragment)` | 입력창 없이 통과시킬 때 (3단계의 `unlock`) |
| `ctx.verify(input)` | `Promise<boolean>`. input 이 이 단계 answerHash 와 맞는지 |
| `ctx.say(line)` | 대사 한 줄 추가. 문자열이면 주인공 독백, `{ speaker, text }` 면 그 화자 |
| `ctx.taunt(text)` | 크롤러 경고 표시 |
| `ctx.fragments` | 지금까지 얻은 조각 `{1: 'xxx', ...}` (읽기 전용) |
| `ctx.playScene(id)` | `Promise<void>`. 이야기 장면(2-2절)을 화면 전체에 덮어 튼다. 이미 본 장면이면 바로 풀린다 (4단계 반전 `'reveal'`) |

규칙
- 입력창으로 맞히면 입력값(normalize 후)이 그 단계의 **조각**이 된다. `ctx.complete(fragment)` 로 통과하면 넘긴 값이 조각.
- 정답 비교는 `normalize` = 앞뒤 공백 제거 + 소문자. 해시 = `SHA-256("f12escape:" + normalize(정답))`.
- 단계 화면은 단계마다 새로 그려진다. 단계가 바뀌면 mount 가 돌려준 정리 함수가 불린다.
- **화자 이름을 대사 문자열에 적지 않는다** (`'개발자: ...'` ✗). 화자는 `speaker` 키로 고르고, 이름·진행 라벨은 [src/content/characters.js](../src/content/characters.js) 에서만 바꾼다.
  - 화자 키 (2026-11-24 결정 2): `narration`(주인공 독백·내레이션, 기본값 — 시작 대사·힌트) · `developer`(개발자 메시지, 퍼즐·장면 안에서만) · `crawler`(크롤러, 오답 경고)
  - 4단계 반전 장면을 보기 전에는 정체를 숨긴 이름을 보여 준다: 개발자 "???", 크롤러 "알 수 없는 프로세스"
- 오답 경고는 화면이 `"비인가 접근 감지 (n회)"` 제목을 붙여 크롤러 이름으로 띄운다. `taunts` 에는 본문만 쓴다.
- 진행 표시는 "인증 키 조각 n/7" (1~7단계에서 하나씩, 8단계는 조합).

## 2. 진행 저장 (localStorage `f12escape:progress`)

[src/core/state.js](../src/core/state.js) 의 `Progress`:
```js
{
  sessionId, nickname, startedAt,   // startedAt 은 서버 시각 (ISO)
  stage: 1,                         // 8단계 통과 후 9
  stageEnteredAt,                   // ms
  fragments: { 1: 'test1' },
  hints: { 1: 2 },                  // 단계별 사용 힌트 수
  wrong: { 1: 3 },                  // 단계별 오답 수
  stageTimes: { 1: 53000 },         // 단계별 소요 ms
  result: null | { finalTime, rank } // /api/verify 결과
}
```

### 2-1. 프롤로그 저장 (localStorage `f12escape:prologue`)

진행 저장은 `/api/start` 뒤에야 생기므로, 그 전인 프롤로그는 별도 키에 둔다. [src/screens/prologue-state.js](../src/screens/prologue-state.js) (정씨)
```js
{
  scene: 'library',      // library → monitor → archive → glitch → trapped
  nickname: '익명',       // 로그인 화면에서 받은 이름
  printed: ['waiting'],  // 이미 출력한 콘솔 메시지 키 (새로고침 뒤 다시 출력)
}
```
- 흐름: 시작 → 로그인(이름 입력) → 프롤로그 → **`/api/start` 호출** → `createProgress` → 1단계. 프롤로그 키는 이때 지운다.
- **기록은 1단계부터 잰다.** 프롤로그 시간은 기록에 들어가지 않는다.
- 이름이 `/api/start` 에서 거절(400)되면 프롤로그 마지막 화면에서 다시 받는다.
- 시작할 때 `f12escape:progress` 가 있으면 단계 화면, 없고 `f12escape:prologue` 가 있으면 프롤로그를 이어 간다.
- 개발용: 개발 서버에서만 `?reset`(모두 지움), `?scene=archive`(그 장면부터), `?stage=6`(그 단계부터, 서버 없이 개발용 진행 생성), `?interlude=after-3`(그 이야기 장면부터, 끝나면 이어지는 단계로. `?interlude=ending` 은 다 깬 개발용 진행을 만들고 결말 → 클리어 화면). 배포판에서는 무시한다.

### 2-2. 이야기 장면 (데이터 [src/content/interludes.js](../src/content/interludes.js) · 저장 localStorage `f12escape:scenes`)

2026-11-24 결정 3. 단계 사이·4단계 반전·결말에 화면 전체를 덮어 트는 장면. 재생은 [src/ui/interlude.js](../src/ui/interlude.js), 언제 트는지는 [src/screens/stage.js](../src/screens/stage.js) (정씨).

장면 id
| id | 언제 |
|---|---|
| `after-N` | N단계 통과 연출 직후, N+1단계로 넘어가기 전 (`afterStage(N)`). 데이터에 없으면 건너뛴다 |
| `reveal` | 4단계에서 쿠키를 admin 으로 바꾸고 새로고침한 순간. `stage4.js` 가 `ctx.playScene('reveal')` |
| `ending` | 8단계 탈출 뒤 결말. ESCAPE COMPLETE 연출 뒤 클리어 화면(`screens/clear.js`)이 처음 그려질 때 튼다. 보는 중 새로고침하면 클리어 화면이 다시 튼다 |

장면 = 조각(beat) 배열. 조각 하나:
```js
{
  lines: [{ speaker: 'developer', text: '...' }],   // 대사창 (없어도 됨)
  log: { title: 'crawler.log', lines: [{ at: '2016-11-24 23:59', text: '...', speaker: 'crawler', delay: 700 }] }, // 로그 재생
  screen: { url: 'http://...', title: '...', body: ['...'] },   // 모형 화면 (log 와 둘 중 하나)
  reveal: true,   // 이 조각부터 개발자·크롤러 진짜 이름
  fx: 'shutdown', // 조각을 시작하기 전에 앞 조각 화면이 가로줄로 접히며 꺼진다 (서버 종료). 그 뒤 바탕은 검정
  backdrop: 'library', // 막 뒤 배경: 'library'(프롤로그 도서관 사진) | 'black'. 다음 조각에도 이어진다
}
```
- 로그가 다 찍히면 대사가 이어진다. 대사 없는 모형 화면·로그는 클릭을 기다린다.
- "장면 건너뛰기"·Esc 로 언제든 장면 전체를 건너뛴다 (처음 보는 장면도). 다시 보기는 없다.

저장 [src/screens/scenes-state.js](../src/screens/scenes-state.js) — 진행 저장(`f12escape:progress`)과 분리된 키
```js
{
  seen: ['after-1', 'reveal'],  // 본 장면 (건너뛴 장면 포함). 다시 틀지 않는다
  pending: ['after-2'],         // 틀기 시작했는데 아직 안 끝난 장면. 새로고침하면 단계 화면이 처음부터 다시 튼다
  revealed: true,               // 4단계 반전을 봤는지 → 화자 진짜 이름 (5단계 이상이면 장면을 안 봤어도 true 취급)
}
```
- "처음부터 다시"·새 게임·개발용 주소에서 이 키도 지운다.
- 장면을 보는 시간은 기록(서버 시작 시각 기준)에 들어간다. 단계별 시간에는 넣지 않으려고, 단계 통과 뒤 장면이 끝나면 다음 단계의 `stageEnteredAt` 을 다시 잡는다.

## 3. API

모든 응답은 JSON, `Cache-Control: no-store`. 에러는 `{ error: '코드' }`.
`.env.local` 에 Supabase 값이 없으면 `mock: true` 가 붙은 가짜 응답을 준다 (프론트 개발용).
- 405: `{ "error": "method_not_allowed" }` (각 API 제목에 적힌 메서드와 다르게 요청했을 때. 예: POST API 에 GET)

### POST /api/start
세션을 만들고 서버 시각으로 시작 시각을 기록.
- 요청: `{ "nickname": "익명" }` (1~16자)
- 201: `{ "sessionId": "uuid", "startedAt": "2026-11-04T02:17:53.155Z" }`
- 400: `{ "error": "invalid_nickname" }` (길이, 비속어)

### GET /api/stage5
5단계 퍼즐용. **항상 실패 상태 코드**를 보내지만 본문·헤더에 단서를 담는다. 화면(`src/stages/stage5.js`)은 `res.ok` 만 보고 본문을 읽지 않는다.
- 403: `{ "error": "access_denied", "message", "record", "key_tail": "열쇠 뒷부분", "note", "maintenance" }` + 헤더 `X-Archive-Key: 열쇠 앞부분`
- `maintenance` 에 8단계에서 쓸 주소 `POST /system/terminate` 가 적혀 있다 (뒷문 복선)
- 정답 = 헤더 값 + `key_tail`. 바꿀 때는 [api/stage5.js](../api/stage5.js) 의 두 상수와 stage5.js 의 `answerHash` 를 같이 바꾼다

### POST /system/terminate (= POST /api/verify)
최종 키 검증 + 기록 계산. 8단계에서 **플레이어가 콘솔로 직접** 보낸다 (2026-11-24 결정 1).
배포는 [vercel.json](../vercel.json) 의 rewrite, 로컬은 [vite.config.js](../vite.config.js) 플러그인이 [api/verify.js](../api/verify.js) 로 넘긴다. Network 탭 주소는 `/system/terminate` 그대로 보인다. `/api/verify` 로 보내도 같다.

| 구분 | 내용 |
|---|---|
| 플레이어가 쓰는 본문 | `{ "key": "..." }` — `fetch('/system/terminate', { method: 'POST', body: JSON.stringify({ key }) })` |
| 화면이 덧붙이는 필드 | `sessionId`, `hints`, `stageTimes` (형식은 아래 검증 규칙). 정씨의 fetch 감싸기가 8단계 동안만 붙인다 |
| 정답 필드 이름 | `key`. 넘어가는 동안 `answer` 도 받는다 (`key` 가 있으면 `key` 우선) |
| Content-Type | 헤더 없이 보내면 브라우저가 `text/plain` 으로 보낸다. 서버는 문자열 본문도 JSON 으로 풀어 읽는다 |
| 200 정답 | `{ "ok": true, "finalTime": 2450000, "rank": 3, "message": "..." }` — finalTime 은 ms, 랭킹 제외 기록이면 `rank: null` |
| 200 오답 | `{ "ok": false, "message": "..." }` |
| 400 | `{ "error": "invalid_body", "message" }` 본문을 못 읽음·`key` 없음·형식 오류 / `{ "error": "invalid_session", "message" }` 세션 정보 없이 보냄·없는 세션 |
| 429 | `{ "error": "too_many_attempts", "message" }` 세션당 오답 50번을 넘었을 때 |
| 500 | `{ "error": "db_error" \| "final_answer_not_configured" }` (Production 에 `FINAL_ANSWER` 가 없을 때) |
| message | 콘솔에서 응답을 열어 본 플레이어가 읽는 이야기 문구. 문구는 형씨, 위치는 [api/_lib/terminate-messages.js](../api/_lib/terminate-messages.js) |

- 화면 쪽 감싸기: [src/screens/terminate-fetch.js](../src/screens/terminate-fetch.js). 8단계 화면이 설치하고 떠날 때 원래 `fetch` 로 돌려놓는다. 경로가 `/system/terminate`·`/api/verify` 인 같은 출처 `POST` 만 손대고(문자열·URL·`Request` 모두), 본문이 JSON 객체 문자열일 때만 기록용 필드를 덧붙인다(같은 이름이면 화면 값 우선). 플레이어에게는 원래 응답을 그대로 돌려준다.
- 화면의 결과 처리: 200 정답 → 진행 저장에 `result` → ESCAPE COMPLETE → 결말 장면 → 클리어 화면 · 200 오답 → 크롤러 오답 경고 · 400 → 주인공 독백으로 응답을 열어 보라고 유도 · 429 → 차단 안내 · 그 밖·네트워크 오류 → 서버 응답 없음 안내
- 서버 계산: `finalTime = (now - sessions.started_at) + penaltyMsFromHints(hints)` ([src/core/rules.js](../src/core/rules.js) 공용)
- `Content-Type: application/json` 을 붙였는데 본문이 깨진 JSON 이면 Vercel 이 함수까지 오기 전에 400 (본문 없음)을 보낸다. 로컬 플러그인도 똑같이 한다.

검증 규칙
- 이미 클리어한 세션: 키를 다시 검사하지 않고 `{ ok: true, finalTime, rank, message }` 를 돌려준다. finalTime 은 처음 저장된 값 그대로, rank 는 그 기록의 **지금** 순위 (뒤에 더 빠른 사람이 오면 내려간다). 랭킹에서 빠진 기록이면 `rank: null`.
- 오답 제한: 오답마다 세션의 오답 횟수를 1 올린다. 50번을 넘으면 정답 여부와 상관없이 429.
- hints: 키는 단계 번호 1~8, 값은 0~3 정수. 벗어나면 400 `invalid_body`.
- stageTimes: 키는 1~8, 값은 0 이상 정수. 기록용으로 저장만 하고 finalTime 계산에는 쓰지 않는다. key 는 200자 이하.
- sessionId 가 없거나, uuid 모양이 아니거나, DB 에 없으면 400 `invalid_session`.
- 처리 순서: 요청 검사 → 세션 조회 → 이미 클리어했으면 저장된 결과 → 오답 제한(429) → 오답 기록 또는 클리어 처리. DB 쪽은 함수 `finish_session` 하나(한 트랜잭션)로 처리하고, 같은 세션의 동시 요청은 행 잠금으로 하나씩 처리된다.
- 이상 기록: 시작(`sessions.started_at`)부터 **5분** 안에 클리어하면 기록은 저장하되 랭킹에 넣지 않고 `rank: null`. (2026-11-26 1분 → 5분)

알려진 한계
- 플레이어가 fetch 대신 XHR 등으로 보내면 화면이 세션 정보를 못 붙여 400 `invalid_session` 이 된다. 힌트 3이 fetch 를 분명히 알려 준다.
- 힌트 개수는 클라이언트가 보낸 값을 믿는다. 0으로 줄여 보내면 막을 수 없다. 개선안은 [backlog.md](backlog.md).

### GET /api/ranking
- 200: `{ "rankings": [{ "rank": 1, "nickname": "익명", "finalTime": 1820000, "hintsUsed": 0 }] }` (상위 50명, finalTime 오름차순)
- 순위 = 나보다 기록이 좋은 사람 수 + 1. 기록이 같으면 같은 순위 (1, 2, 2, 4). `/system/terminate` 의 `rank` 와 같은 규칙
- 500: `{ "error": "db_error" }`
- Vercel Cron 이 하루 한 번 부른다 ([vercel.json](../vercel.json)). Supabase 무료 프로젝트 일시정지 방지

## 4. DB ([supabase/schema.sql](../supabase/schema.sql))
- `sessions(id, nickname, started_at, finished_at, hints_used, wrong_attempts, stage_times, final_time)`
- `rankings(session_id, nickname, final_time, hints_used, created_at)`
- RLS 켜고 정책 없음 → service_role(서버)만 접근.
- 함수 `finish_session(...)` ([migrations/002](../supabase/migrations/002_finish_session.sql)): `/api/verify` 의 DB 처리. 실행 권한은 service_role 만.
- 스키마를 바꿀 때는 `supabase/migrations/` 에 번호를 붙인 새 파일을 만들고, `schema.sql` 에도 최종 모양을 반영한다.
