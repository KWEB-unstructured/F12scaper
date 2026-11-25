// 담당: 정씨 · 이야기 장면 재생기 (2026-11-24 결정 3)
// 장면 = 조각(beat) 배열 (content/interludes.js). 화면 전체를 덮는 어두운 막 위에서 조각을 차례로 재생한다.
//   조각마다: 로그 재생(ui/log-replay.js) 또는 모형 화면(ui/mock-screen.js)을 가운데에 → 대사창(ui/dialogue.js)
// - "장면 건너뛰기" 버튼·Esc 로 언제든 장면 전체를 건너뛴다 (처음 보는 장면도)
// - 저장(본 장면·남은 장면)은 여기서 하지 않는다. 부르는 쪽(screens/stage.js)이 scenes-state.js 로 한다
import { createDialogue } from './dialogue.js';
import { playLog } from './log-replay.js';
import { renderMockScreen } from './mock-screen.js';

const LEAVE_MS = 350;

/**
 * @param {HTMLElement} parent 막을 붙일 곳 (단계 화면)
 * @param {import('../content/interludes.js').Beat[]} beats
 * @param {{
 *   nameOf?: (key: import('../content/characters.js').SpeakerKey) => string,
 *   onReveal?: () => void,
 * }} [opts] nameOf: 화자 이름 (매 줄 다시 묻는다) · onReveal: reveal 조각에 들어설 때
 * @returns {{ done: Promise<{ skipped: boolean }>, destroy: () => void }}
 */
export function playInterlude(parent, beats, { nameOf, onReveal } = {}) {
  const el = document.createElement('section');
  el.className = 'il';
  el.setAttribute('aria-label', '이야기 장면');
  el.innerHTML = `
    <div class="il-stage" data-stage></div>
    <p class="il-continue" data-continue hidden>클릭해서 계속 ▼</p>
    <button type="button" class="il-skip" data-skip>장면 건너뛰기 ≫</button>`;
  parent.append(el);
  const stage = el.querySelector('[data-stage]');
  const dialogue = createDialogue(el, { nameOf });

  let skipped = false;
  let destroyed = false;
  /** 지금 재생 중인 조각을 멈추는 함수 */
  let stopBeat = () => {};

  const skip = () => {
    if (skipped) return;
    skipped = true;
    stopBeat();
    dialogue.skip();
  };
  el.querySelector('[data-skip]').addEventListener('click', skip);
  const onKey = (e) => {
    if (e.key === 'Escape') skip();
  };
  document.addEventListener('keydown', onKey);

  /** 대사 없는 모형 화면: 클릭·Enter·Space 를 기다린다 */
  const waitAdvance = () =>
    new Promise((resolve) => {
      const hint = el.querySelector('[data-continue]');
      hint.hidden = false;
      const end = () => {
        hint.hidden = true;
        el.removeEventListener('click', onClick);
        document.removeEventListener('keydown', onEnter);
        resolve();
      };
      const onClick = (e) => {
        if (!e.target.closest('[data-skip]')) end();
      };
      const onEnter = (e) => {
        if (!e.repeat && ['Enter', ' '].includes(e.key)) end();
      };
      el.addEventListener('click', onClick);
      document.addEventListener('keydown', onEnter);
      stopBeat = end;
    });

  const run = async () => {
    for (const beat of beats) {
      if (skipped || destroyed) break;
      if (beat.reveal) onReveal?.();
      stage.replaceChildren();
      if (beat.screen) stage.append(renderMockScreen(beat.screen));
      if (beat.log) {
        const log = playLog(stage, beat.log);
        stopBeat = log.cancel;
        await log.done;
      }
      if (skipped || destroyed) break;
      if (beat.lines?.length) await dialogue.play(beat.lines);
      else if (beat.screen || beat.log) await waitAdvance();
    }
    // 건너뛰었어도 reveal 조각이 있었다면 이름은 드러난 것으로 친다
    if (skipped && beats.some((b) => b.reveal)) onReveal?.();
    if (!destroyed) {
      el.classList.add('is-leaving');
      await new Promise((r) => setTimeout(r, LEAVE_MS));
    }
    cleanup();
    return { skipped };
  };

  function cleanup() {
    document.removeEventListener('keydown', onKey);
    dialogue.destroy();
    el.remove();
  }

  const done = run();
  return {
    done,
    destroy() {
      destroyed = true;
      stopBeat();
      dialogue.skip();
    },
  };
}
