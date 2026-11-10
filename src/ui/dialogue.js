// 담당: 정씨 · 대사창 (프롤로그와 이후 단계 연출에서 같이 쓴다)
// - 화자 variant: narration / browser / security / unknown (content/characters.js)
// - 타자 효과. 클릭·스페이스·엔터로 넘기고, 타자 중에 누르면 그 줄을 즉시 다 보여 준다
// - 스킵 버튼: 남은 대사를 건너뛴다
// 대사는 '<' 가 들어갈 수 있으므로 textContent 로만 넣는다.
import { SPEAKERS } from '../content/characters.js';

/** @typedef {{ speaker: import('../content/characters.js').SpeakerKey, text: string }} Line */

const CHAR_MS = 38;

/**
 * @param {HTMLElement} parent 대사창을 붙일 곳
 * @returns {{ el: HTMLElement, play: (lines: Line[]) => Promise<void>, skip: () => void, destroy: () => void }}
 */
export function createDialogue(parent) {
  const el = document.createElement('div');
  el.className = 'dlg';
  el.hidden = true;
  el.innerHTML = `
    <span class="dlg-who" data-who></span>
    <p class="dlg-text"><span class="sr-only" data-full></span><span aria-hidden="true" data-typed></span></p>
    <span class="dlg-next" aria-hidden="true">▼</span>
    <button type="button" class="dlg-skip" data-skip>스킵 ≫</button>`;
  parent.append(el);

  const who = el.querySelector('[data-who]');
  const full = el.querySelector('[data-full]');
  const typed = el.querySelector('[data-typed]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** @type {Line[]} */
  let lines = [];
  let index = 0;
  let chars = [];
  let shown = 0;
  let timer = 0;
  let done = null;

  const typing = () => shown < chars.length;

  function showLine() {
    const line = lines[index];
    el.dataset.speaker = line.speaker;
    who.textContent = SPEAKERS[line.speaker]?.name ?? '';
    full.textContent = line.text;
    chars = [...line.text];
    shown = 0;
    el.classList.add('typing');
    if (reduceMotion) shown = chars.length - 1;
    tick();
  }

  function tick() {
    shown += 1;
    typed.textContent = chars.slice(0, shown).join('');
    if (typing()) timer = setTimeout(tick, CHAR_MS);
    else el.classList.remove('typing');
  }

  /** 클릭·스페이스·엔터: 타자 중이면 그 줄 완성, 아니면 다음 줄 */
  function advance() {
    if (!done) return;
    clearTimeout(timer);
    if (typing()) {
      shown = chars.length - 1;
      tick();
      return;
    }
    index += 1;
    if (index < lines.length) showLine();
    else finish();
  }

  function finish() {
    clearTimeout(timer);
    el.hidden = true;
    const resolve = done;
    done = null;
    resolve?.();
  }

  // 대사창뿐 아니라 장면 어디를 클릭해도 넘긴다. 장면 안의 버튼·입력칸을 누른 경우는 제외
  const onClick = (e) => {
    if (!done || e.target.closest('[data-skip]')) return;
    if (!el.contains(e.target) && e.target.closest('input, textarea, select, button, a, label')) return;
    advance();
  };
  parent.addEventListener('click', onClick);
  el.querySelector('[data-skip]').addEventListener('click', finish);

  const onKey = (e) => {
    if (!done || e.repeat) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, button, a')) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      advance();
    }
  };
  document.addEventListener('keydown', onKey);

  return {
    el,
    play(newLines) {
      if (done) finish();
      if (!newLines.length) return Promise.resolve();
      return new Promise((resolve) => {
        done = resolve;
        lines = newLines;
        index = 0;
        el.hidden = false;
        showLine();
      });
    },
    skip: finish,
    destroy() {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      parent.removeEventListener('click', onClick);
      done = null;
      el.remove();
    },
  };
}
