// 담당: 정씨 · 이야기 장면의 모형 화면 (content/interludes.js 의 screen 조각)
// 가짜 창 하나: 주소창 + 제목 + 본문 줄. 퍼즐이 아니라 보여 주기만 하는 화면이다. 문구는 textContent 로만 넣는다.

/**
 * @param {{ url?: string, title: string, body: string[] }} screen
 * @returns {HTMLElement}
 */
export function renderMockScreen({ url, title, body }) {
  const win = document.createElement('div');
  win.className = 'il-window';
  win.innerHTML = `
    <div class="il-window-bar">
      <span class="il-window-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="il-window-url" data-url></span>
    </div>
    <div class="il-window-body">
      <h2 data-title></h2>
      <div data-body></div>
    </div>`;
  win.querySelector('[data-url]').textContent = url ?? '';
  win.querySelector('[data-title]').textContent = title;
  win.querySelector('[data-body]').replaceChildren(
    ...body.map((text) => Object.assign(document.createElement('p'), { textContent: text })),
  );
  return win;
}
