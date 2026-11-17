// 담당: 정씨 · 프롤로그 장면 저장 (localStorage 전용 키)
// 진행 데이터(f12escape:progress)는 /api/start 뒤에야 생기므로 프롤로그는 따로 저장한다.
// 프롤로그가 끝나 1단계로 넘어가면 지운다. 쿠키는 4단계 퍼즐이 쓰므로 쓰지 않는다.

const KEY = 'f12escape:prologue';

/** 장면 순서 */
export const SCENES = /** @type {const} */ (['library', 'monitor', 'archive', 'glitch', 'trapped']);

/**
 * @typedef {Object} PrologueState
 * @property {typeof SCENES[number]} scene  현재 장면
 * @property {string} nickname              로그인 화면에서 받은 이름 (/api/start 는 프롤로그 끝에서 호출)
 * @property {string[]} printed             이미 출력한 콘솔 메시지 키 (새로고침 뒤 다시 찍기용)
 */

/** @returns {PrologueState | null} */
export function loadPrologue() {
  try {
    const state = JSON.parse(localStorage.getItem(KEY));
    return state && SCENES.includes(state.scene) && typeof state.nickname === 'string'
      ? { printed: [], ...state }
      : null;
  } catch {
    return null;
  }
}

/** @param {PrologueState} state */
export function savePrologue(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 저장이 막힌 환경: 새로고침하면 처음부터 다시 본다 */
  }
}

export function clearPrologue() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}
