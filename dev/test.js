// 임시 테스트 페이지. UI 가 core/engine.js 를 어떻게 쓰면 되는지의 최소 예시이기도 하다.
import '../src/styles/base.css';
import '../src/styles/stages.css';
import { EVENTS, on, startLocalGame, getState, mountStage, submitAnswer, requestHint, reset } from '../src/core/engine.js';
import { loadProgress, saveProgress } from '../src/core/state.js';
import { STAGES } from '../src/stages/index.js';
import { SPEAKERS, PROGRESS_LABEL } from '../src/content/characters.js';

const $ = (id) => document.getElementById(id);
let cleanup = null;

const log = (name, detail) => {
  $('log').textContent += `${new Date().toLocaleTimeString()} ${name} ${JSON.stringify(detail)}\n`;
  $('log').scrollTop = $('log').scrollHeight;
};
EVENTS.forEach((name) => on(name, (d) => log(name, d)));

// 대사는 textContent 로 (CLAUDE.md 규칙 9)
on('say', ({ speaker, text }) => {
  const name = SPEAKERS[speaker]?.name;
  $('guide').append(Object.assign(document.createElement('p'), { textContent: name ? `${name}: ${text}` : text }));
});
on('taunt', ({ text }) => ($('taunt').textContent = `${SPEAKERS.security.name}: ${text}`));
on('hint', ({ text }) => {
  $('hints').append(Object.assign(document.createElement('li'), { textContent: text }));
  renderStatus();
});
on('wrong', renderStatus);
on('stage-clear', () => render());

function renderStatus() {
  const s = getState();
  $('status').textContent = s
    ? s.finished
      ? '모든 단계 완료'
      : `STAGE ${s.stage}/${s.totalStages} ${s.title} · ${PROGRESS_LABEL} ${s.recovery}% · 힌트 ${s.hintsUsed}/${s.hintsTotal} · 이번 단계 오답 ${s.wrong}`
    : '진행 없음. "새 게임"을 누르세요.';
}

/** 현재 단계를 다시 그린다. 이전 단계의 정리 함수를 먼저 부른다. */
function render() {
  cleanup?.();
  cleanup = null;
  $('guide').replaceChildren();
  $('puzzle').replaceChildren();
  $('hints').replaceChildren();
  $('taunt').textContent = '';
  renderStatus();
  const s = getState();
  $('form').hidden = !s || s.finished || !s.inputEnabled;
  if (!s || s.finished) return;
  cleanup = mountStage($('puzzle'));
  getState().openedHints.forEach((text) => $('hints').append(Object.assign(document.createElement('li'), { textContent: text })));
}

$('jump').replaceChildren(...STAGES.map((st) => Object.assign(document.createElement('option'), { value: st.id, textContent: `${st.id}. ${st.title}` })));
$('jump').addEventListener('change', () => {
  const p = loadProgress() ?? (startLocalGame(), loadProgress());
  p.stage = Number($('jump').value);
  p.stageEnteredAt = Date.now();
  saveProgress(p);
  render();
});
$('new').addEventListener('click', () => {
  reset();
  startLocalGame();
  render();
});
$('reset').addEventListener('click', () => {
  cleanup?.();
  cleanup = null;
  reset();
  render();
});
$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const value = $('answer').value;
  $('answer').value = '';
  await submitAnswer(value);
});
$('hint').addEventListener('click', () => requestHint());

render();
