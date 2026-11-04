// 담당: 김씨 · 종합 (최종 자물쇠)
// 정답은 클라이언트에 없다. 단계 화면이 입력값을 /api/verify 로 보내 서버가 검증한다.
// TODO(김씨): 1~7단계 조각을 조합하는 규칙을 퍼즐로 보여 준다.

/** @type {import('./types.js').Stage} */
export default {
  id: 8,
  title: '관리자 패널의 마지막 자물쇠',
  tool: '종합',
  toolUsage: '',
  guide: ['선배 조교: TODO 대사'],
  answerHash: null,
  verify: 'server',
  hints: ['TODO 힌트 1', 'TODO 힌트 2', 'TODO 힌트 3'],
  mount(el, ctx) {
    const list = Object.entries(ctx.fragments)
      .map(([id, fragment]) => `<li>${id}단계: <code>${fragment}</code></li>`)
      .join('');
    el.innerHTML = `
      <p class="todo">TODO(김씨): 8단계 퍼즐 · 개발용 최종 정답 test8 (서버 FINAL_ANSWER)</p>
      <ul>${list}</ul>
    `;
  },
};
