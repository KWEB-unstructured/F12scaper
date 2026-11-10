// 담당: 형씨 · Sources (중단점)
// TODO(형씨): 정답이 0.1초만 깜빡이는 퍼즐. 플레이어가 읽고 중단점을 걸 코드는
// public/stages/stage7-flash.js 에 둔다 (번들·압축되지 않아 Sources 탭에서 그대로 보인다).
// mount 에서 <script src="/stages/stage7-flash.js"> 를 붙이고, 정리 함수에서 떼어 낸다.

/** @type {import('./types.js').Stage} */
export default {
  id: 7,
  title: '0.1초의 정답',
  tool: 'Sources — 중단점',
  toolUsage: '코드 실행을 멈추고 그 순간의 변수 값을 확인하며 버그를 추적한다.',
  guide: ['TODO 대사'],
  answerHash: '350a75e9fcb0481ffdbb5d30517265700a8f9fa6b9bab5a0fdf9ad849a2377ce', // 임시 정답 test7
  hints: ['TODO 힌트 1', 'TODO 힌트 2', 'TODO 힌트 3'],
  mount(el) {
    el.innerHTML = `<p class="todo">TODO(형씨): 7단계 퍼즐 · 임시 정답 test7</p>`;
  },
};
