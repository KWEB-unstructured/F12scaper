// 담당: 김씨 · Network
// TODO(김씨): 버튼 → fetch('/api/stage5') → 화면에는 "실패"만. 단서는 응답 본문·헤더에만 둔다.

/** @type {import('./types.js').Stage} */
export default {
  id: 5,
  title: '실패한 요청',
  tool: 'Network',
  toolUsage: 'API 요청의 상태 코드, 헤더, 응답 본문을 보고 프론트와 서버 중 어디가 문제인지 가른다.',
  guide: ['선배 조교: TODO 대사'],
  answerHash: 'bf08e0583866dfcda6353e9e2d4ada2fa308e0e8e87d9b8f9af714d206fcddb4', // 임시 정답 test5
  hints: ['TODO 힌트 1', 'TODO 힌트 2', 'TODO 힌트 3'],
  mount(el) {
    el.innerHTML = `<p class="todo">TODO(김씨): 5단계 퍼즐 · 임시 정답 test5</p>`;
  },
};
