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
  guide: ['...', { speaker: 'unknown', text: '...' }], // 단계 시작 대사. 문자열이면 브라우저가 말한다
  answerHash: '<npm run hash -- "정답">',  // 8단계는 null
  input: true,                             // false 면 입력창 숨김 (3단계)
  verify: 'local',                         // 'server' 면 /api/verify (8단계)
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
| `ctx.say(line)` | 대사 한 줄 추가. 문자열이면 브라우저, `{ speaker, text }` 면 그 화자 |
| `ctx.taunt(text)` | 보안 시스템 경고 표시 |
| `ctx.fragments` | 지금까지 얻은 조각 `{1: 'xxx', ...}` (읽기 전용) |

규칙
- 입력창으로 맞히면 입력값(normalize 후)이 그 단계의 **조각**이 된다. `ctx.complete(fragment)` 로 통과하면 넘긴 값이 조각.
- 정답 비교는 `normalize` = 앞뒤 공백 제거 + 소문자. 해시 = `SHA-256("f12escape:" + normalize(정답))`.
- 단계 화면은 단계마다 새로 그려진다. 단계가 바뀌면 mount 가 돌려준 정리 함수가 불린다.
- **화자 이름을 대사 문자열에 적지 않는다** (`'브라우저: ...'` ✗). 화자는 `speaker` 키로 고르고, 이름·진행률 라벨은 [src/content/characters.js](../src/content/characters.js) 에서만 바꾼다.
  - 화자 키: `narration`(내레이션) · `browser`(안내자, 기본값) · `security`(보안 시스템) · `unknown`(정체 미상)
- 오답 경고는 화면이 `"비인가 접근 감지 (n회)"` 제목을 붙여 보안 시스템 이름으로 띄운다. `taunts` 에는 본문만 쓴다.

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
- 개발용: 개발 서버에서만 `?reset`(둘 다 지움), `?scene=archive`(그 장면부터). 배포판에서는 무시한다.

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
5단계 퍼즐용. **항상 실패 상태 코드**를 보내지만 본문·헤더에 단서를 담는다.
- 4xx/5xx: `{ "error": "...", ... 단서 ... }` + 커스텀 헤더 (`X-...`)

### POST /api/verify
최종 정답 검증 + 기록 계산.
- 요청: `{ "sessionId": "uuid", "answer": "...", "hints": { "1": 2 }, "stageTimes": { "1": 53000 } }`
- 200 오답: `{ "ok": false }`
- 200 정답: `{ "ok": true, "finalTime": 2450000, "rank": 3 }` — finalTime 은 ms, 이상 기록이면 `rank: null`
- 400: `{ "error": "invalid_body" | "invalid_session" }`
- 429: `{ "error": "too_many_attempts" }` (세션당 오답 50번을 넘었을 때)

- 서버 계산: `finalTime = (now - sessions.started_at) + penaltyMsFromHints(hints)` ([src/core/rules.js](../src/core/rules.js) 공용)

검증 규칙
- 이미 클리어한 세션: 정답을 다시 검사하지 않고 처음 저장된 `{ ok: true, finalTime, rank }` 를 그대로 돌려준다.
- 오답 제한: 오답마다 세션의 오답 횟수를 1 올린다. 50번을 넘으면 정답 여부와 상관없이 429.
- hints: 키는 단계 번호 1~8, 값은 0~3 정수. 벗어나면 400 `invalid_body`.
- 이상 기록: 시작(`sessions.started_at`)부터 1분 안에 클리어하면 기록은 저장하되 랭킹에 넣지 않고 `rank: null`. 기준은 4주차 테스트 후 결정.

알려진 한계
- 힌트 개수는 클라이언트가 보낸 값을 믿는다. 0으로 줄여 보내면 막을 수 없다. 개선안은 [backlog.md](backlog.md).

### GET /api/ranking
- 200: `{ "rankings": [{ "rank": 1, "nickname": "익명", "finalTime": 1820000, "hintsUsed": 0 }] }` (상위 50명, finalTime 오름차순)

## 4. DB ([supabase/schema.sql](../supabase/schema.sql))
- `sessions(id, nickname, started_at, finished_at, hints_used, wrong_attempts, stage_times)`
- `rankings(session_id, nickname, final_time, hints_used, created_at)`
- RLS 켜고 정책 없음 → service_role(서버)만 접근.
