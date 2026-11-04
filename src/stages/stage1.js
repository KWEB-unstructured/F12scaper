// 담당: 정씨 · Elements (HTML 주석)
// 형식 참고용으로 실제 동작하는 예시. 정답·대사·힌트는 확정되면 교체한다.

/** @type {import('./types.js').Stage} */
export default {
  id: 1,
  title: '개발자의 흔적',
  tool: 'Elements — HTML 주석',
  toolUsage: '배포된 페이지의 마크업을 직접 보고, 화면에 안 보이는 요소나 남은 주석을 확인한다.',
  guide: ['선배 조교: 키보드에서 F12를 눌러 봐. 오른쪽에 뜨는 창에서 Elements 탭을 열면 돼.'],
  answerHash: 'e21127353e0247cd99fdd3d7581f63578a14265c9df75017062009ed9192d42a', // TODO(정씨): 임시 정답 test1
  hints: [
    '개발자는 화면에 안 보이는 메모를 어디에 남길까?',
    'Elements 탭에서 퍼즐 영역을 펼쳐 초록색 <!-- --> 줄을 찾아 봐.',
    'Elements 탭의 HTML 주석 안에 적힌 비밀번호를 그대로 입력하면 돼.',
  ],
  mount(el) {
    el.innerHTML = `
      <p class="puzzle-text">개발자는 늘 흔적을 남긴다.</p>
      <!-- 비밀번호: test1 -->
    `;
  },
};
