// 담당: 정씨 · Elements (HTML 주석)
// 정답·대사·힌트는 확정되면 교체한다. 정답을 바꾸면 아래 주석과 answerHash 를 같이 바꾼다.

/** @type {import('./types.js').Stage} */
export default {
  id: 1,
  title: '개발자의 흔적',
  tool: 'Elements — HTML 주석',
  toolUsage: '배포된 페이지의 마크업을 직접 보고, 화면에 안 보이는 요소나 남은 주석을 확인한다.',
  guide: ['선배 조교: 키보드에서 F12를 눌러 봐. 오른쪽에 뜨는 창에서 Elements 탭을 열면 돼.'],
  answerHash: 'e21127353e0247cd99fdd3d7581f63578a14265c9df75017062009ed9192d42a', // TODO(정씨): 임시 정답 test1
  hints: [
    '개발자는 화면에 안 보이는 메모를 어디에 남길까? 화면 말고 페이지의 "코드"를 봐야 해.',
    '"개발자는 늘 흔적을 남긴다" 문장 위에서 마우스 오른쪽 클릭 → "검사"를 눌러 봐. Elements 탭에서 그 줄 바로 아래 <!-- --> 줄을 찾아.',
    '<!-- 비밀번호: ... --> 안에 적힌 단어를 아래 입력창에 그대로 입력하고 Enter.',
  ],
  mount(el) {
    // 주석은 .puzzle 의 직속 자식으로, 보이는 문장 바로 아래에 둔다.
    // → 문장을 "검사"하면 Elements 에서 바로 다음 줄에 보인다. 더 깊이 넣지 않는다.
    el.innerHTML = `
      <p class="puzzle-label">[ 전 관리자 작업 메모 · 1개 ]</p>
      <p class="puzzle-text">개발자는 늘 흔적을 남긴다.</p>
      <!-- 비밀번호: test1 -->
      <p class="puzzle-empty">(화면에 표시할 내용이 없습니다)</p>
    `;
  },
};
