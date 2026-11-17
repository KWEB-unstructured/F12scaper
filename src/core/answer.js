// 정답 검증과 오답 집계 (1~7단계, 클라이언트 쪽).
// 정답 원문은 어디에도 두지 않고, stageN.js 의 answerHash(SHA-256) 와 비교만 한다.
import { hashAnswer } from './hash.js';
import { saveProgress } from './state.js';

/** 같은 단계에서 이만큼 틀리면 첫 힌트를 권한다. */
export const WRONG_BEFORE_HINT_SUGGEST = 5;

/** 코어 이벤트 통로. UI 는 core/engine.js 를 통해 구독한다. */
export const bus = new EventTarget();

export function emit(name, detail) {
  bus.dispatchEvent(new CustomEvent(name, { detail }));
}

/**
 * 입력이 이 단계의 정답인지 확인한다.
 * 비교 규칙은 hash.js 의 normalize: 앞뒤 공백을 지우고 **소문자로 바꿔서** 해시한다.
 * 그래서 "Test4", " test4 " 도 정답이고 대소문자는 구분하지 않는다. (정답은 소문자/숫자로 정해 둘 것)
 * @param {{answerHash: string | null}} stage
 * @param {string} input
 * @returns {Promise<boolean>}
 */
export async function checkAnswer(stage, input) {
  if (!stage?.answerHash) return false;
  return (await hashAnswer(input)) === stage.answerHash;
}

/**
 * 현재 단계의 오답 횟수를 올려 저장하고 현재 횟수를 돌려준다.
 * 'wrong' 이벤트를 내고, 정확히 5회째이고 힌트를 하나도 안 열었으면 'hint-suggest' 이벤트도 낸다.
 * @param {import('./state.js').Progress} p
 */
export function recordWrong(p) {
  const stage = p.stage;
  const count = (p.wrong[stage] = (p.wrong[stage] ?? 0) + 1);
  saveProgress(p);
  emit('wrong', { stage, count });
  if (count === WRONG_BEFORE_HINT_SUGGEST && !p.hints[stage]) {
    emit('hint-suggest', { stage, count });
  }
  return count;
}
