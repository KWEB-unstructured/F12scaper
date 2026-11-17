// UI 연결 진입점. 화면(정씨)은 이 파일의 함수만 부르고 이벤트만 구독하면 된다.
// 규칙은 answer.js · game.js · state.js 에 있고, 여기서는 호출 순서와 이벤트 발행만 맡는다.
// 자세한 사용법과 페이로드 예시는 docs/INTEGRATION.md.
import { bus, emit, checkAnswer, recordWrong } from './answer.js';
import {
  currentStage,
  recoveryPercent,
  useHint,
  openedHints,
  penaltyMs,
  completeStage,
  isFinished,
  totalHintsUsed,
  HINT_PENALTY_MIN,
  TOTAL_STAGES,
} from './game.js';
import { loadProgress, saveProgress, createProgress, resetProgress, getVerifyPayload } from './state.js';
import { startSession, verifyFinal } from './api.js';
import { DEFAULT_TAUNTS, HINT_SUGGEST, SERVER_DOWN } from '../content/story.js';
import { DEFAULT_SPEAKER } from '../content/characters.js';

/** 대사 한 줄 → { speaker, text }. 문자열이면 기본 화자(브라우저), 객체면 speaker 가 없을 때만 기본 화자 */
const toLine = (line) => (typeof line === 'string' ? { speaker: DEFAULT_SPEAKER, text: line } : { speaker: DEFAULT_SPEAKER, ...line });

/** 구독할 수 있는 이벤트 이름 */
export const EVENTS = ['stage-enter', 'say', 'taunt', 'wrong', 'hint-suggest', 'hint', 'stage-clear', 'recovery', 'finish'];

// 5회 오답 → 브라우저가 힌트를 권하는 대사도 같이 내보낸다.
bus.addEventListener('hint-suggest', () => emit('say', { ...toLine(HINT_SUGGEST), reason: 'hint-suggest' }));

/**
 * 이벤트 구독. 해제 함수를 돌려준다.
 * @param {string} name   EVENTS 중 하나
 * @param {(detail: any) => void} fn
 */
export function on(name, fn) {
  const handler = (e) => fn(e.detail);
  bus.addEventListener(name, handler);
  return () => bus.removeEventListener(name, handler);
}

/** 새 게임 시작: /api/start 로 세션을 만들고 진행 저장을 새로 만든다. */
export async function startGame(nickname) {
  const { sessionId, startedAt } = await startSession(nickname);
  createProgress({ sessionId, nickname, startedAt });
  return getState();
}

/** 서버 없이 시작 (dev/test.html 용). */
export function startLocalGame(nickname = 'tester') {
  createProgress({ sessionId: 'local-test', nickname, startedAt: new Date().toISOString() });
  return getState();
}

/** 현재 상태 스냅샷. 저장된 진행이 없으면 null. */
export function getState() {
  const p = loadProgress();
  if (!p) return null;
  const stage = currentStage(p);
  const used = p.hints[p.stage] ?? 0;
  return {
    finished: isFinished(p),
    stage: p.stage,
    totalStages: TOTAL_STAGES,
    title: stage?.title ?? null,
    inputEnabled: stage ? stage.input !== false : false,
    recovery: recoveryPercent(p),
    hintsUsed: used,
    hintsTotal: stage?.hints.length ?? 0,
    nextHintCostMin: HINT_PENALTY_MIN[used] ?? null,
    openedHints: openedHints(p),
    wrong: p.wrong[p.stage] ?? 0,
    totalHints: totalHintsUsed(p),
    penaltyMs: penaltyMs(p),
    startedAt: p.startedAt,
    fragments: { ...p.fragments },
    result: p.result,
  };
}

/**
 * 현재 단계의 퍼즐을 el 에 그린다. 'stage-enter' 이벤트로 시작 대사(guide)를 알린다.
 * 돌려준 정리 함수를 단계가 바뀔 때 반드시 부를 것 (전역 함수·타이머·스크립트·쿠키 정리).
 * @param {HTMLElement} el
 * @returns {() => void}
 */
export function mountStage(el) {
  const p = loadProgress();
  const stage = p && currentStage(p);
  if (!stage) return () => {};
  const ctx = {
    complete: (fragment) => clearStage(fragment),
    verify: (input) => checkAnswer(stage, input),
    say: (line) => emit('say', toLine(line)),
    taunt: (text) => emit('taunt', { text, reason: 'puzzle' }),
    fragments: Object.freeze({ ...p.fragments }),
  };
  emit('stage-enter', { stage: stage.id, title: stage.title, guide: [...stage.guide], inputEnabled: stage.input !== false });
  stage.guide.forEach((line) => emit('say', { ...toLine(line), reason: 'guide' }));
  const cleanup = stage.mount(el, ctx);
  return typeof cleanup === 'function' ? cleanup : () => {};
}

let solving = false;

/** 현재 단계 통과 처리 + 이벤트 발행. 입력창 없는 단계는 mount 의 ctx.complete 가 이걸 부른다. */
function clearStage(fragment) {
  const p = loadProgress();
  if (!p || solving) return;
  solving = true;
  try {
    const stageId = p.stage;
    const entered = p.stageEnteredAt;
    completeStage(p, fragment);
    emit('stage-clear', { stage: stageId, fragment: p.fragments[stageId], stageTime: p.stageTimes[stageId] ?? Date.now() - entered, nextStage: p.stage });
    emit('recovery', { percent: recoveryPercent(p) });
    if (isFinished(p)) emit('finish', { result: p.result });
  } finally {
    solving = false;
  }
}

/**
 * 정답 제출. 정답이면 'stage-clear' (+ 'recovery', 마지막이면 'finish'), 오답이면 'wrong' + 'taunt' 이벤트.
 * 8단계(verify:'server')는 /api/verify 로 검증한다.
 * @param {string} input
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function submitAnswer(input) {
  const p = loadProgress();
  const stage = p && currentStage(p);
  if (!stage || !String(input).trim()) return { ok: false, error: 'empty' };

  let ok;
  if (stage.verify === 'server') {
    try {
      const res = await verifyFinal(getVerifyPayload(p, input));
      ok = res.ok;
      if (ok) {
        p.result = { finalTime: res.finalTime, rank: res.rank };
        saveProgress(p); // clearStage 가 저장분을 다시 읽으므로 먼저 저장
      }
    } catch (err) {
      emit('taunt', { text: SERVER_DOWN, reason: 'network' });
      return { ok: false, error: err.message };
    }
  } else {
    ok = await checkAnswer(stage, input);
  }

  if (ok) {
    clearStage(input);
    return { ok: true };
  }
  recordWrong(p);
  const taunts = stage.taunts?.length ? stage.taunts : DEFAULT_TAUNTS;
  emit('taunt', { text: taunts[Math.floor(Math.random() * taunts.length)], reason: 'wrong' });
  return { ok: false };
}

/**
 * 다음 힌트를 연다. 'hint' 이벤트로 문구와 감점을 알린다. 이미 다 열었으면 null.
 * 확인창(confirm)은 UI 몫이다. 부르는 순간 감점이 확정된다.
 */
export function requestHint() {
  const p = loadProgress();
  if (!p) return null;
  const index = p.hints[p.stage] ?? 0;
  const text = useHint(p);
  if (text === null) return null;
  const detail = { stage: p.stage, index, text, penaltyMin: HINT_PENALTY_MIN[index], used: index + 1 };
  emit('hint', detail);
  return detail;
}

/** "처음부터 다시": 진행 저장과 퍼즐 쿠키를 지운다. 화면 전환은 UI 가 한다. */
export function reset() {
  resetProgress();
}
