// 담당: 정씨 · 시작 화면 (게임 제목, 시작 버튼, 윤리 안내, 크롬 권장)
import { ETHICS_NOTICE } from '../content/story.js';

export function renderStart(root, { go }) {
  root.innerHTML = `
    <section class="screen start-screen">
      <h1>F12 이스케이프</h1>
      <p class="tagline">페이지는 거짓말을 하고, 정답은 F12 안에 있다</p>
      <button type="button" class="primary" data-start>시작하기</button>
      <button type="button" data-ranking>랭킹 보기</button>
      <p class="notice"></p>
      <p class="muted">PC 크롬(또는 엣지) 브라우저를 권장합니다.</p>
    </section>`;
  root.querySelector('.notice').textContent = ETHICS_NOTICE;
  root.querySelector('[data-start]').addEventListener('click', () => go('intro'));
  root.querySelector('[data-ranking]').addEventListener('click', () => go('ranking'));
}
