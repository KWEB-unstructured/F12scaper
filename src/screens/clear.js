// 담당: 정씨 · 클리어 화면 (최종 기록, 단계별 소요 시간, 사용한 개발자 도구 기능 카드, 공유)
// 처음 들어오면 결말 장면(content/interludes.js 의 'ending')을 먼저 틀고 기록을 보여 준다.
// 8단계 통과 → ESCAPE COMPLETE(screens/stage.js) → 결말 장면 → 클리어 화면. 장면 도중 새로고침해도 여기서 다시 튼다.
import { loadProgress, resetProgress } from '../core/state.js';
import { clearScenes, loadScenes, beginScene, endScene } from './scenes-state.js';
import { playInterlude } from '../ui/interlude.js';
import { INTERLUDES } from '../content/interludes.js';
import { speakerName } from '../content/characters.js';
import { totalHintsUsed } from '../core/game.js';
import { formatDuration } from '../core/format.js';
import { STAGES } from '../stages/index.js';
import { ETHICS_NOTICE, CLEAR_TITLE } from '../content/story.js';

export function renderClear(root, { go }) {
  const p = loadProgress();
  if (!p?.result) return go('start');

  const ending = INTERLUDES.ending;
  if (ending?.length && !loadScenes().seen.includes('ending')) {
    beginScene('ending');
    // 결말은 4단계 반전 뒤라 진짜 이름을 쓴다
    const scene = playInterlude(root, ending, { nameOf: (key) => speakerName(key, true) });
    let left = false;
    scene.done.then(() => {
      if (left) return;
      endScene('ending');
      renderClear(root, { go });
    });
    return () => {
      left = true;
      scene.destroy();
    };
  }

  root.innerHTML = `
    <section class="screen clear-screen">
      <h1 data-title></h1>
      <p class="record">최종 기록 <strong>${formatDuration(p.result.finalTime)}</strong></p>
      <p>${p.result.rank ? `${p.result.rank}위` : '순위 집계 중'} · 힌트 ${totalHintsUsed(p)}개</p>
      <ol class="stage-times" data-times></ol>
      <h2>오늘 사용한 개발자 도구 기능 7개</h2>
      <div class="tool-cards" data-cards></div>
      <p class="notice" data-notice></p>
      <button type="button" class="primary" data-ranking>랭킹 보기</button>
      <button type="button" data-reset>처음부터 다시</button>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  $('[data-title]').textContent = CLEAR_TITLE; // 결말 미정 — 문구는 story.js 에서 바꾼다
  $('[data-times]').replaceChildren(
    ...STAGES.map((s) =>
      Object.assign(document.createElement('li'), {
        textContent: `${s.id}단계 ${s.title} — ${formatDuration(p.stageTimes[s.id] ?? 0)}`,
      }),
    ),
  );
  $('[data-cards]').replaceChildren(
    ...STAGES.filter((s) => s.toolUsage).map((s) => {
      const card = document.createElement('article');
      card.className = 'tool-card';
      card.append(
        Object.assign(document.createElement('h3'), { textContent: s.tool }),
        Object.assign(document.createElement('p'), { textContent: s.toolUsage }),
      );
      return card;
    }),
  );
  $('[data-notice]').textContent = ETHICS_NOTICE;
  $('[data-ranking]').addEventListener('click', () => go('ranking'));
  $('[data-reset]').addEventListener('click', () => {
    resetProgress();
    clearScenes();
    go('start');
  });
}
