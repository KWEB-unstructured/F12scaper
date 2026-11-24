// 담당: 정씨 · 기기 모드 (반응형)
// THE ARCHIVE 의 "모바일 전용 게시판". 화면 너비 375px 이하에서만 비공개 글이 열리고 열람 코드(조각)가 보인다.
//
// 퍼즐 구조
// - 코드 문장은 HTML 에 없다. src/styles/stages.css 6단계 구역의 @media (max-width: 375px) 안에서
//   .board-secret::after { content: ... } 로만 붙는다. → Elements 를 봐도 안 보이고, 화면 폭을 실제로 줄여야 풀린다.
// - 정답 원문은 stages.css 에 있다 (퍼즐 안에 숨긴 원문, CLAUDE.md 규칙 7 예외).
//   정답을 바꾸면 stages.css 의 content 문자열과 아래 answerHash 를 같이 바꾼다.
// - 기기 모드로 새로고침해도 모바일 안내로 튕기지 않는다: main.js 는 진행 중이면 모바일 감지를 하지 않는다.
// 대사·힌트는 초안. 형씨가 다듬는다.

/** @type {import('./types.js').Stage} */
export default {
  id: 6,
  title: '작은 화면으로만 보인다',
  tool: '기기 모드 (반응형)',
  toolUsage: '모바일 화면 크기를 흉내 내서 반응형 레이아웃이 깨지지 않는지 확인한다.',
  // 본게임 구간이라 어느 기능을 쓸지는 말하지 않는다
  guide: [
    '모바일 전용 게시판? 이 사이트, 우리가 보는 화면이 너무 크다고 글을 숨기고 있어.',
    '화면을 작게 만들 방법이 있을 텐데…',
  ],
  answerHash: 'fdb6d4437c15f56d72413ed17252732ba12960672f975547a91977557d086446', // 임시 정답 test6 (원문은 stages.css)
  hints: [
    '이 게시판은 화면 크기에 따라 보여 주는 내용이 달라지는 것 같아.',
    '개발자 도구 왼쪽 위의 휴대폰·태블릿 모양 아이콘(기기 툴바, Ctrl+Shift+M)을 눌러 봐.',
    '기기 툴바 위쪽에서 iPhone SE(너비 375)를 고르면 비공개 글에 열람 코드가 나타나. 그대로 입력해.',
  ],
  // 오답 경고는 크롤러가 말한다
  taunts: ['PC 환경에서는 열람이 제한됩니다.', '모바일 인증이 확인되지 않았습니다. 이 접근은 기록됩니다.'],
  mount(el) {
    el.innerHTML = `
      <div class="board">
        <p class="board-title">모바일 전용 게시판</p>
        <p class="board-notice">📱 이 게시판은 모바일 기기에서만 열람할 수 있습니다.<br />현재 화면에서는 일부 게시글이 표시되지 않습니다.</p>
        <p class="board-ok">📱 모바일 확인 · 비공개 글 열림</p>
        <ul class="board-list">
          <li><span class="board-tag">[공지]</span><span class="board-subject">열람 규칙 안내</span><span class="board-date">1970-01-01</span></li>
          <li><span class="board-tag">[공지]</span><span class="board-subject">PC 열람 제한 안내</span><span class="board-date">2031-03-14</span></li>
          <li class="board-locked"><span class="board-tag">[비공개]</span><span class="board-subject board-secret"></span><span class="board-date">모바일 전용</span></li>
        </ul>
      </div>
    `;
  },
};
