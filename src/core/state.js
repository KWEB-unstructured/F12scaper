// 진행 저장 (localStorage). 4단계가 쿠키를 퍼즐로 쓰므로 진행 상황은 쿠키에 두지 않는다.
// 모든 데이터는 키 하나(KEY) 아래 JSON 한 덩어리로 저장한다.

const KEY = 'f12escape:progress';

/** 저장 형식 버전. Progress 의 구조를 바꾸면 올리고, 옛 데이터는 안전하게 버린다. */
export const SAVE_VERSION = 1;

/**
 * @typedef {Object} Progress
 * @property {number} version            저장 형식 버전 (SAVE_VERSION)
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
    version: SAVE_VERSION,
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

const isRecord = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

/** 저장된 값이 Progress 로 쓸 수 있는 모양인지 확인한다. (값의 범위까지는 보지 않는다) */
function isValidProgress(p) {
  return (
    isRecord(p) &&
    p.version === SAVE_VERSION &&
    typeof p.sessionId === 'string' &&
    typeof p.nickname === 'string' &&
    typeof p.startedAt === 'string' &&
    Number.isInteger(p.stage) &&
    p.stage >= 1 &&
    p.stage <= 9 &&
    Number.isFinite(p.stageEnteredAt) &&
    isRecord(p.fragments) &&
    isRecord(p.hints) &&
    isRecord(p.wrong) &&
    isRecord(p.stageTimes) &&
    (p.result === null || isRecord(p.result))
  );
}

/**
 * 저장된 진행 상황을 읽는다.
 * 없거나, JSON 이 깨졌거나, 버전·모양이 다르면 저장분을 지우고 null (= 새로 시작).
 * @returns {Progress | null}
 */
export function loadProgress() {
  let raw;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null; // localStorage 자체를 못 쓰는 환경 (시크릿 모드 등)
  }
  if (raw === null) return null;
  try {
    const data = JSON.parse(raw);
    if (isValidProgress(data)) return data;
  } catch {
    // 아래에서 초기화
  }
  clearSaved();
  return null;
}

/** @param {Progress} progress */
export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...progress, version: SAVE_VERSION }));
  } catch {
    // 용량 초과·저장 차단: 게임은 메모리의 progress 로 계속 진행할 수 있다.
  }
}

function clearSaved() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}

/** "처음부터 다시": 진행 상황과 퍼즐이 건드린 흔적(쿠키 등)을 모두 지운다. */
export function resetProgress() {
  clearSaved();
  document.cookie = 'role=; max-age=0; path=/';
}

/**
 * 8단계에서 POST /api/verify 로 보낼 본문 (docs/contracts.md 3절).
 * 조각(fragments)은 보내지 않는다. 최종 정답은 플레이어가 조각을 조합해 입력한 값이고, 서버가 FINAL_ANSWER 와 비교한다.
 * @param {Progress} p
 * @param {string} answer          플레이어가 입력한 최종 답
 * @param {number} [stageId]       지금 푸는 단계. 이 단계의 진행 중 시간도 stageTimes 에 포함한다
 */
export function getVerifyPayload(p, answer, stageId = p.stage) {
  return {
    sessionId: p.sessionId,
    answer,
    hints: { ...p.hints },
    stageTimes: { ...p.stageTimes, [stageId]: Date.now() - p.stageEnteredAt },
  };
}
