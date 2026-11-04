// 담당: 형씨 · Application (쿠키)
// TODO(형씨): 쿠키 role 이 없으면 role=student 를 심고, role=admin 이면 조각을 보여 준다.
// 쿠키는 반드시 document.cookie 로 심는다 (서버가 심으면 HttpOnly 가 될 수 있음).

/** @type {import('./types.js').Stage} */
export default {
  id: 4,
  title: '권한이 없습니다',
  tool: 'Application — 쿠키',
  toolUsage: '로그인·세션 문제를 디버깅할 때 쿠키와 저장소 값을 확인하고 지운다.',
  guide: ['선배 조교: TODO 대사'],
  answerHash: '9e5da9f5a25c648ab528f6bdc871ff39fae642b24d1a39f0366021e93692f9aa', // 임시 정답 test4
  hints: ['쿠키는 어디에 저장될까?', 'TODO 힌트 2', 'TODO 힌트 3'],
  mount(el) {
    el.innerHTML = `<p class="todo">TODO(형씨): 4단계 퍼즐 · 임시 정답 test4</p>`;
  },
};
