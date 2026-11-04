// 점수 규칙. 브라우저(core/game.js)와 서버(api/verify.js)가 같이 import 하므로
// 이 파일에는 DOM·localStorage 를 쓰는 코드를 넣지 않는다.

/** 힌트 1·2·3 각각의 감점 (분). 쓴 힌트만큼 누적된다. */
export const HINT_PENALTY_MIN = [3, 5, 10];

/** 단계별 힌트 사용 수({1: 2, 4: 1}) → 패널티 합계 (ms) */
export function penaltyMsFromHints(hints) {
  let minutes = 0;
  for (const used of Object.values(hints ?? {})) {
    const n = Math.min(Math.max(Number(used) || 0, 0), HINT_PENALTY_MIN.length);
    for (let i = 0; i < n; i++) minutes += HINT_PENALTY_MIN[i];
  }
  return minutes * 60_000;
}

export function countHints(hints) {
  return Object.values(hints ?? {}).reduce((sum, n) => sum + Math.min(Math.max(Number(n) || 0, 0), HINT_PENALTY_MIN.length), 0);
}
