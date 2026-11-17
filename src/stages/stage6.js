// 담당: 정씨 · 기기 모드 (반응형)
// TODO(정씨): 화면 너비 375px 이하에서만 보이는 문장. 미디어 쿼리는 src/styles/stages.css 에 둔다.

/** @type {import('./types.js').Stage} */
export default {
  id: 6,
  title: '작은 화면으로만 보인다',
  tool: '기기 모드 (반응형)',
  toolUsage: '모바일 화면 크기를 흉내 내서 반응형 레이아웃이 깨지지 않는지 확인한다.',
  guide: ['TODO 대사'],
  answerHash: 'fdb6d4437c15f56d72413ed17252732ba12960672f975547a91977557d086446', // 임시 정답 test6
  hints: ['TODO 힌트 1', 'TODO 힌트 2', 'TODO 힌트 3'],
  mount(el) {
    el.innerHTML = `<p class="todo">TODO(정씨): 6단계 퍼즐 · 임시 정답 test6</p>`;
  },
};
