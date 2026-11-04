// 진행 저장 (localStorage). 4단계가 쿠키를 퍼즐로 쓰므로 진행 상황은 쿠키에 두지 않는다.

const KEY = 'f12escape:progress';

/**
 * @typedef {Object} Progress
 * @property {string} sessionId          /api/start 가 준 세션 ID
 * @property {string} nickname
 * @property {string} startedAt          서버가 기록한 시작 시각 (ISO)
 * @property {number} stage              현재 단계 (1~8). 8단계 통과 후에는 9
 * @property {number} stageEnteredAt     현재 단계에 들어온 시각 (ms)
 * @property {Record<number, string>} fragments   단계별로 얻은 조각
 * @property {Record<number, number>} hints       단계별 사용한 힌트 수 (0~3)
 * @property {Record<number, number>} wrong       단계별 오답 횟수
 * @property {Record<number, number>} stageTimes  단계별 소요 시간 (ms)
 * @property {null | {finalTime: number, rank: number|null}} result  /api/verify 결과
 */

/** @returns {Progress} */
export function createProgress({ sessionId, nickname, startedAt }) {
  const progress = {
    sessionId,
    nickname,
    startedAt,
    stage: 1,
    stageEnteredAt: Date.now(),
    fragments: {},
    hints: {},
    wrong: {},
    stageTimes: {},
    result: null,
  };
  saveProgress(progress);
  return progress;
}

/** @returns {Progress | null} */
export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

/** @param {Progress} progress */
export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

/** "처음부터 다시": 진행 상황과 퍼즐이 건드린 흔적(쿠키 등)을 모두 지운다. */
export function resetProgress() {
  localStorage.removeItem(KEY);
  document.cookie = 'role=; max-age=0; path=/';
}
