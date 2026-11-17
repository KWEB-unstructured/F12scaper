// 담당: 정씨 · 시작 화면 (게임 제목, 시작 버튼, 윤리 안내, 크롬 권장)
// 영화 타이틀처럼: 흐린 도서관 배경 위에 제목과 문구가 차례로 떠오른다. 이어지는 로그인·프롤로그와 같은 배경을 쓴다.
// 문구는 src/content/story.js 의 START (형씨)
import { ETHICS_NOTICE, START } from '../content/story.js';

/** 로그인 화면과 같이 쓰는 배경 (흐린 도서관 + 가장자리 어둡게 + 주사선) */
export const BACKDROP = `
  <div class="ts-backdrop" aria-hidden="true">
    <div class="ts-bg"></div>
    <div class="ts-vignette"></div>
  </div>`;

export function renderStart(root, { go }) {
  root.innerHTML = `
    <section class="title-screen">
      ${BACKDROP}
      <header class="ts-corner">
        <span data-corner-left></span>
        <span class="ts-status" data-corner-right></span>
      </header>

      <div class="ts-main">
        <p class="ts-kicker ts-in" data-kicker></p>
        <h1 class="ts-title ts-in" data-text="F12 이스케이프"><span class="ts-f12">F12</span> 이스케이프</h1>
        <p class="ts-tagline ts-in" data-tagline></p>
        <div class="ts-mission" data-mission></div>
        <div class="ts-actions ts-in">
          <button type="button" class="primary ts-start" data-start></button>
          <button type="button" class="ts-ghost" data-ranking></button>
        </div>
      </div>

      <footer class="ts-foot">
        <p data-notice></p>
        <p data-browser></p>
      </footer>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const make = (tag, props) => Object.assign(document.createElement(tag), props);

  $('[data-corner-left]').textContent = START.corner.left;
  $('[data-corner-right]').textContent = START.corner.right;
  $('[data-kicker]').textContent = START.kicker;
  $('[data-tagline]').textContent = START.tagline;
  $('[data-mission]').append(...START.mission.map((text) => make('p', { className: 'ts-in', textContent: text })));
  $('[data-start]').textContent = START.startLabel;
  $('[data-ranking]').textContent = START.rankingLabel;
  $('[data-notice]').textContent = ETHICS_NOTICE;
  $('[data-browser]').textContent = START.browserNote;

  // 문구가 위에서부터 차례로 떠오르도록 순서대로 지연을 준다
  root.querySelectorAll('.ts-in').forEach((el, i) => el.style.setProperty('--i', String(i)));

  $('[data-start]').addEventListener('click', () => go('intro'));
  $('[data-ranking]').addEventListener('click', () => go('ranking'));
}
