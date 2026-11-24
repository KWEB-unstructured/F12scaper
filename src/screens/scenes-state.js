// 담당: 정씨 · 이야기 장면 저장 (localStorage 전용 키)
// 2026-11-24 결정 3: 장면 기록은 진행 저장(f12escape:progress)과 분리된 별도 키에 둔다.
// - seen:     이미 본 장면 id (같은 장면을 반복하지 않는다. 다시 보기는 없음)
// - pending:  재생해야 하는데 아직 끝나지 않은 장면 id (새로고침하면 여기부터 이어 재생)
// - revealed: 4단계 반전 장면을 봤는지. 개발자·크롤러의 진짜 이름을 보여 줄지 정한다
// "처음부터 다시"·새 게임 시작 때 clearScenes() 로 지운다.

const KEY = 'f12escape:scenes';

/** @typedef {{ seen: string[], pending: string[], revealed: boolean }} ScenesState */

/** @returns {ScenesState} */
export function loadScenes() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return {
      seen: Array.isArray(s?.seen) ? s.seen : [],
      pending: Array.isArray(s?.pending) ? s.pending : [],
      revealed: s?.revealed === true,
    };
  } catch {
    return { seen: [], pending: [], revealed: false };
  }
}

/** @param {ScenesState} state */
export function saveScenes(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 저장이 막힌 환경: 새로고침하면 장면을 다시 볼 수 있다 */
  }
}

export function clearScenes() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}

/** 4단계 반전 장면을 봤다고 기록한다 */
export function markRevealed() {
  const s = loadScenes();
  if (s.revealed) return;
  s.revealed = true;
  saveScenes(s);
}

/**
 * 개발자·크롤러의 진짜 이름을 보여 줄지.
 * 반전 장면을 봤거나, 이미 5단계 이상이면 (장면을 건너뛰었거나 개발용 ?stage= 로 들어온 경우) true.
 * @param {{ stage?: number } | null} [progress]
 */
export function isRevealed(progress) {
  return loadScenes().revealed || (progress?.stage ?? 0) >= 5;
}
