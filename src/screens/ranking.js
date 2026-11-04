// 담당: 정씨 · 랭킹 (순위표, 내 순위, 힌트 0개 배지)
import { getRanking } from '../core/api.js';
import { loadProgress } from '../core/state.js';
import { formatDuration } from '../core/format.js';

export function renderRanking(root, { go }) {
  root.innerHTML = `
    <section class="screen ranking-screen">
      <h1>랭킹</h1>
      <p class="muted" data-status>불러오는 중...</p>
      <table hidden>
        <thead><tr><th>순위</th><th>닉네임</th><th>기록</th><th>힌트</th></tr></thead>
        <tbody></tbody>
      </table>
      <button type="button" data-back>돌아가기</button>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const myRank = loadProgress()?.result?.rank;
  $('[data-back]').addEventListener('click', () => go(loadProgress()?.result ? 'clear' : 'start'));

  let alive = true;
  getRanking()
    .then(({ rankings }) => {
      if (!alive) return;
      $('tbody').replaceChildren(
        ...rankings.map((r) => {
          const tr = document.createElement('tr');
          if (r.rank === myRank) tr.className = 'mine';
          const cells = [r.rank, r.nickname, formatDuration(r.finalTime), r.hintsUsed === 0 ? '0 · 노힌트' : r.hintsUsed];
          tr.append(...cells.map((v) => Object.assign(document.createElement('td'), { textContent: String(v) })));
          return tr;
        }),
      );
      $('table').hidden = false;
      $('[data-status]').hidden = rankings.length > 0;
      $('[data-status]').textContent = '아직 기록이 없습니다.';
    })
    .catch(() => {
      if (alive) $('[data-status]').textContent = '랭킹을 불러오지 못했습니다.';
    });

  return () => {
    alive = false;
  };
}
