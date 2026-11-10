// 담당: 정씨 · 시작 화면 (게임 제목, 시작 버튼, 윤리 안내, 크롬 권장)
// 구성: 접속 로그로 상황 제시 → 제목 → 플레이어가 할 일 → 버튼 → 안내
// 문구는 src/content/story.js 의 START (형씨)
import { ETHICS_NOTICE, START } from '../content/story.js';

export function renderStart(root, { go }) {
  root.innerHTML = `
    <section class="screen start-screen">
      <div class="screen-bar">
        <span data-bar-left></span>
        <span><span data-bar-right></span> <span class="status-locked" data-status></span></span>
      </div>
      <ol class="syslog" data-log aria-label="접속 로그"></ol>
      <h1 class="title"><span class="key">F12</span>이스케이프</h1>
      <p class="tagline" data-tagline></p>
      <div class="mission" data-mission></div>
      <div class="actions">
        <button type="button" class="primary" data-start>시작하기</button>
        <button type="button" data-ranking>랭킹 보기</button>
      </div>
      <p class="notice" data-notice></p>
      <p class="muted browser-note">PC 크롬(또는 엣지) 브라우저를 권장합니다.</p>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const make = (tag, props) => Object.assign(document.createElement(tag), props);

  $('[data-bar-left]').textContent = START.bar.left;
  $('[data-bar-right]').textContent = START.bar.right;
  $('[data-status]').textContent = START.bar.status;
  $('[data-tagline]').textContent = START.tagline;
  $('[data-log]').append(
    ...START.log.map(({ level, text }) => {
      const li = make('li', {});
      li.append(make('span', { className: `lv lv-${level.toLowerCase()}`, textContent: `[${level.padEnd(5)}]` }), ` ${text}`);
      return li;
    }),
  );
  $('[data-mission]').append(
    ...START.mission.map((text) => make('p', { textContent: text })),
    make('p', { className: 'meta', textContent: START.meta }),
  );
  $('[data-notice]').textContent = ETHICS_NOTICE;
  $('[data-start]').addEventListener('click', () => go('intro'));
  $('[data-ranking]').addEventListener('click', () => go('ranking'));
}
