// 담당: 정씨 · Elements + Styles (display: none)
// TODO(정씨): 퍼즐 구현. 지울 대상은 인라인 style 이나 짧은 클래스 하나로 둔다 (Tailwind 금지).

/** @type {import('./types.js').Stage} */
export default {
  id: 2,
  title: '사라진 다음 버튼',
  tool: 'Elements — Styles',
  toolUsage: 'CSS를 그 자리에서 고쳐 보며 레이아웃이 깨진 원인을 찾는다.',
  guide: ['선배 조교: TODO 대사'],
  answerHash: '0a339d4640c859174fe82f1fc0207c2139184509c8d2782baa85cc731058f5cb', // 임시 정답 test2
  hints: ['TODO 힌트 1', 'TODO 힌트 2', 'TODO 힌트 3'],
  mount(el) {
    el.innerHTML = `<p class="todo">TODO(정씨): 2단계 퍼즐 · 임시 정답 test2</p>`;
  },
};
