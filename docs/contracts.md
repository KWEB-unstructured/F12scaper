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
  guide: ['선배 조교: ...'],               // 단계 시작 대사
  answerHash: '<npm run hash -- "정답">',  // 8단계는 null
  input: true,                             // false 면 입력창 숨김 (3단계)
  verify: 'local',                         // 'server' 면 /api/verify (8단계)
  hints: ['방향', '탭과 위치', '거의 정답'],
  taunts: ['오답일 때 유령 관리자 대사'],   // 선택
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
| `ctx.say(text)` | 선배 조교 대사 한 줄 추가 |
| `ctx.taunt(text)` | 유령 관리자 메시지 표시 |
| `ctx.fragments` | 지금까지 얻은 조각 `{1: 'xxx', ...}` (읽기 전용) |

규칙
- 입력창으로 맞히면 입력값(normalize 후)이 그 단계의 **조각**이 된다. `ctx.complete(fragment)` 로 통과하면 넘긴 값이 조각.
- 정답 비교는 `normalize` = 앞뒤 공백 제거 + 소문자. 해시 = `SHA-256("f12escape:" + normalize(정답))`.
- 단계 화면은 단계마다 새로 그려진다. 단계가 바뀌면 mount 가 돌려준 정리 함수가 불린다.

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

## 3. API

모든 응답은 JSON, `Cache-Control: no-store`. 에러는 `{ error: '코드' }`.
`.env.local` 에 Supabase 값이 없으면 `mock: true` 가 붙은 가짜 응답을 준다 (프론트 개발용).

### POST /api/start
세션을 만들고 서버 시각으로 시작 시각을 기록.
- 요청: `{ "nickname": "호랑이" }` (1~16자)
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
- 서버 계산: `finalTime = (now - sessions.started_at) + penaltyMsFromHints(hints)` ([src/core/rules.js](../src/core/rules.js) 공용)

### GET /api/ranking
- 200: `{ "rankings": [{ "rank": 1, "nickname": "호랑이", "finalTime": 1820000, "hintsUsed": 0 }] }` (상위 50명, finalTime 오름차순)

## 4. DB ([supabase/schema.sql](../supabase/schema.sql))
- `sessions(id, nickname, started_at, finished_at, hints_used, stage_times)`
- `rankings(session_id, nickname, final_time, hints_used, created_at)`
- RLS 켜고 정책 없음 → service_role(서버)만 접근.
