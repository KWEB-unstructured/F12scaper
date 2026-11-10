// 단계 진행 규칙: 정답 확인, 힌트·감점, 단계 전환. UI는 여기 함수만 부르고 규칙은 직접 계산하지 않는다.

import { hashAnswer, normalize } from './hash.js';
import { saveProgress } from './state.js';
import { HINT_PENALTY_MIN, penaltyMsFromHints, countHints } from './rules.js';
import { STAGES } from '../stages/index.js';

export { HINT_PENALTY_MIN };
/** 같은 단계에서 이만큼 틀리면 첫 힌트를 권한다. */
export const WRONG_BEFORE_HINT_SUGGEST = 5;

export const TOTAL_STAGES = STAGES.length;

/** @param {import('./state.js').Progress} p */
export function currentStage(p) {
  return STAGES[p.stage - 1] ?? null;
}

/** 진행률 (0~100). 푼 단계 수 기준. 화면 라벨은 content/characters.js 의 PROGRESS_LABEL */
export function recoveryPercent(p) {
  return Math.round(((p.stage - 1) / TOTAL_STAGES) * 100);
}

/** 1~7단계: 입력값 해시를 단계의 answerHash 와 비교한다. */
export async function checkAnswer(stage, input) {
  return (await hashAnswer(input)) === stage.answerHash;
}

/** 오답 횟수를 올리고 현재 횟수를 돌려준다. */
export function recordWrong(p) {
  p.wrong[p.stage] = (p.wrong[p.stage] ?? 0) + 1;
  saveProgress(p);
  return p.wrong[p.stage];
}

/** 다음 힌트를 열고 그 문구를 돌려준다. 이미 3개 다 썼으면 null. */
export function useHint(p) {
  const stage = currentStage(p);
  const used = p.hints[p.stage] ?? 0;
  if (!stage || used >= stage.hints.length) return null;
  p.hints[p.stage] = used + 1;
  saveProgress(p);
  return stage.hints[used];
}

/** 현재 단계에서 이미 연 힌트 문구들 */
export function openedHints(p) {
  const stage = currentStage(p);
  return stage ? stage.hints.slice(0, p.hints[p.stage] ?? 0) : [];
}

export function totalHintsUsed(p) {
  return countHints(p.hints);
}

/** 힌트 패널티 합계 (ms). 서버도 같은 규칙(core/rules.js)으로 다시 계산한다. */
export function penaltyMs(p) {
  return penaltyMsFromHints(p.hints);
}

/** 현재 단계를 통과 처리하고 다음 단계로 넘긴다. */
export function completeStage(p, fragment) {
  p.fragments[p.stage] = normalize(fragment);
  p.stageTimes[p.stage] = Date.now() - p.stageEnteredAt;
  p.stage += 1;
  p.stageEnteredAt = Date.now();
  saveProgress(p);
}

export function isFinished(p) {
  return p.stage > TOTAL_STAGES;
}
