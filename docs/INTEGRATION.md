# UI 연결 가이드 (정씨용)

화면은 [src/core/engine.js](../src/core/engine.js) 의 **함수 호출 + 이벤트 구독**만으로 단계를 돌릴 수 있다.
규칙(정답 비교, 오답 집계, 힌트 감점, 저장)은 전부 core 안에 있으니 화면에서 다시 계산하지 않는다.
작동하는 최소 예시: [dev/test.js](../dev/test.js) (`npm run dev` → `/dev/test.html`).

> 지금 `screens/stage.js` 는 `game.js` 를 직접 부르고 있고 그대로 동작한다. engine.js 로 옮기는 건 선택이다.
> 옮길 때 `checkAnswer`/`recordWrong` 은 `game.js` 에서도 다시 내보내므로 import 경로가 깨지지 않는다.

```js
import { EVENTS, on, startGame, startLocalGame, getState, mountStage,
         submitAnswer, requestHint, reset } from '../core/engine.js';
```

## 함수

| 함수 | 설명 |
|---|---|
| `startGame(nickname) → Promise<State>` | `/api/start` 로 세션을 만들고 진행 저장을 새로 만든다. 실패하면 throw (API 에러 코드는 `err.message`) |
| `startLocalGame(nickname?) → State` | 서버 없이 시작. 테스트 페이지용 |
| `getState() → State \| null` | 현재 상태 스냅샷. 저장된 진행이 없으면 `null` |
| `mountStage(el) → cleanup` | 현재 단계 퍼즐을 `el` 에 그리고, 시작 대사를 `say` 이벤트로 보낸다. **돌려준 `cleanup` 을 단계가 바뀔 때(또는 화면을 떠날 때) 반드시 호출** — 전역 함수·타이머·스크립트·쿠키를 정리한다 |
| `submitAnswer(input) → Promise<{ok, error?}>` | 정답 제출. 빈 문자열은 `{ok:false, error:'empty'}` 로 무시. 8단계는 `/api/verify` 로 검증 |
| `requestHint() → {stage,index,text,penaltyMin,used} \| null` | 다음 힌트를 연다. **부르는 순간 감점이 확정**되니 `confirm` 은 화면에서 먼저. 다 열었으면 `null` |
| `reset()` | 진행 저장과 퍼즐 쿠키 삭제. 화면 전환은 화면에서 |
| `on(name, fn) → 해제함수` | 이벤트 구독 |

`State`:
```js
{ finished: false, stage: 4, totalStages: 8, title: '권한이 없습니다',
  inputEnabled: true,            // false 면 입력창 숨김 (3단계)
  recovery: 38,                  // 탈출 진행률 % (화면 라벨은 content/characters.js 의 PROGRESS_LABEL)
  hintsUsed: 1, hintsTotal: 3, nextHintCostMin: 5,   // 다 열었으면 null
  openedHints: ['...'],          // 이미 연 힌트 문구 (새로고침 후 복원용)
  wrong: 2, totalHints: 4, penaltyMs: 480000, startedAt: '2026-11-17T...Z',
  fragments: { 1: 'xxx' }, result: null }
```

## 이벤트 (`on(이름, fn)`, `fn` 은 detail 을 받는다)

| 이름 | 언제 | detail |
|---|---|---|
| `stage-enter` | `mountStage` 때 | `{ stage: 4, title, guide: ['대사', { speaker: 'unknown', text: '...' }], inputEnabled }` |
| `say` | 대사 한 줄. 시작 대사·퍼즐이 거는 대사·힌트 권유. 화자는 `speaker` 로 구분 | `{ speaker: 'browser', text: '...', reason?: 'guide' \| 'hint-suggest' }` |
| `taunt` | 보안 시스템 경고 본문 (제목 "비인가 접근 감지 (n회)" 는 화면이 붙인다) | `{ text, reason: 'wrong' \| 'puzzle' \| 'network' }` |
| `wrong` | 오답. 오답 수는 이미 저장됨 | `{ stage: 4, count: 3 }` |
| `hint-suggest` | 같은 단계 오답 **5회째**이고 힌트를 하나도 안 열었을 때 (한 번만) | `{ stage: 4, count: 5 }` — 대사 문구는 `say` 로도 같이 나간다 |
| `hint` | `requestHint` 로 힌트가 열림 | `{ stage, index: 0, text, penaltyMin: 3, used: 1 }` |
| `stage-clear` | 단계 통과 (저장 끝난 뒤) | `{ stage: 4, fragment: 'xxxx', stageTime: 53000, nextStage: 5 }` |
| `recovery` | `stage-clear` 직후 탈출 진행률 변경 | `{ percent: 50 }` |
| `finish` | 8단계까지 통과 | `{ result: { finalTime, rank } }` |

화자 이름은 문자열에 적지 않는다. `speaker` 키(`narration`·`browser`·`security`·`unknown`)만 쓰고, 이름은 [characters.js](../src/content/characters.js) 에서 찾는다 ([contracts.md](contracts.md) 참고).
대사·경고 문구는 `<` 가 들어갈 수 있으니 **`textContent` 로만** 넣는다 (CLAUDE.md 규칙 9).

## 호출 순서

```
앱 시작
 ├ getState() === null → 시작 화면 → startGame(닉네임)
 └ getState() 있음     → 이어하기
단계 화면 그리기
 1. on(...) 으로 이벤트 구독 (say, taunt, wrong, hint, stage-clear, recovery ...)
 2. cleanup = mountStage(puzzleEl)      → stage-enter, say(시작 대사) 이벤트가 따라온다
 3. 힌트 목록은 getState().openedHints 로 복원
정답 입력 → await submitAnswer(value)
 ├ 오답: wrong → taunt (→ 5회째 hint-suggest, say)
 └ 정답: stage-clear → recovery (→ 마지막이면 finish)
         → 화면에서 cleanup() 후 다시 mountStage (또는 finished 면 클리어 화면)
힌트 버튼 → confirm → requestHint() → hint 이벤트로 목록·타이머 갱신
"처음부터 다시" → cleanup() → reset() → 시작 화면
```

주의
- 입력창이 없는 단계(3단계)는 퍼즐이 스스로 통과시킨다 → 같은 `stage-clear` 이벤트가 온다.
- 4단계 퍼즐은 쿠키 `role` 을, 7단계는 `window.stage7Flash` 와 `<script data-stage="7">` 을 쓴다. `cleanup()` 을 빼먹으면 남는다.
- 새로고침은 정리 함수를 부르지 않는다. 4단계는 이걸 전제로 설계됐다 (쿠키·진행은 새로고침 후에도 유지).
- 타이머 표시: `Date.now() - Date.parse(state.startedAt) + state.penaltyMs`.

## 진행 저장 (참고)

localStorage 키 `f12escape:progress` 하나에 JSON 한 덩어리. `version` 필드가 있고, 깨졌거나 버전이 다르면 `getState()` 가 `null` 을 돌려준다(저장분은 자동 삭제). 쿠키에는 아무것도 저장하지 않는다.

### 8단계 `/api/verify` 요청 형식
`docs/contracts.md` 의 명세 그대로다. `submitAnswer` 가 `state.getVerifyPayload(progress, answer)` 로 만든다:
```json
{ "sessionId": "uuid", "answer": "플레이어가 입력한 최종 답",
  "hints": { "4": 1 }, "stageTimes": { "1": 53000, "8": 12000 } }
```
조각(fragments)은 서버로 보내지 않는다. 최종 정답은 플레이어가 조각을 조합해 입력하고, 서버가 `FINAL_ANSWER` 와 비교한다.
