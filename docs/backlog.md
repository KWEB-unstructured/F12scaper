# 나중에 할 일 (백로그)

MVP 범위에서 뺐지만 시간이 나면 할 작업. 시작하기 전에 관련 담당자와 다시 합의한다.

## 서버가 힌트를 나눠 주는 `/api/hint`

- 제안: 김씨 · 기록: 2026-11-09
- 결정: MVP 는 지금 방식을 유지한다. 3주차에 `/api/verify` 까지 끝나고 여유가 있으면 한다.

### 지금 방식과 문제
- 힌트 문구는 각 `src/stages/stageN.js` 의 `hints` 에 들어 있다.
- 힌트 버튼을 누르면 `src/core/game.js` 의 `useHint` 가 localStorage(`f12escape:progress`)의 `hints` 개수를 올린다. 서버는 이 과정을 모른다.
- `/api/verify` 는 클라이언트가 보낸 `hints` 로 벌칙 시간을 계산한다.
- 그래서 플레이어가 Application 탭에서 `hints` 를 `0` 으로 고치고 보내면 벌칙 없이 랭킹에 오른다. 범위 검사(키 1~8, 값 0~3)로는 막지 못한다. 0 도 범위 안에 있기 때문이다.

### 바꾸면
- 힌트 문구를 서버에만 둔다. 클라이언트는 `POST /api/hint { sessionId, stage }` 로 요청하고, 서버가 DB 에 사용 개수를 기록한 뒤 문구를 돌려준다.
- `/api/verify` 는 클라이언트가 보낸 `hints` 대신 DB 에 기록된 개수로 계산한다.

### 해야 할 일
| 담당 | 작업 |
|---|---|
| 김씨 | `api/hint.js` 추가, DB 에 단계별 힌트 사용 수 저장 (`sessions` 에 jsonb 컬럼 또는 별도 테이블), `/api/verify` 계산 기준을 DB 값으로 변경, contracts.md 갱신 |
| 형씨 | 힌트 문구를 `stageN.js` 에서 서버 쪽으로 옮기고, `game.js` 의 `useHint` 를 API 호출로 변경 |
| 정씨 | `src/screens/stage.js` 힌트 버튼에 로딩·실패 처리 추가 |

### 고려할 점
- 힌트를 열 때마다 서버를 거치므로 응답이 늦거나 실패할 때의 화면 처리가 필요하다.
- `.env.local` 이 없는 로컬 mock 모드에서도 힌트가 나오게 해야 한다.
