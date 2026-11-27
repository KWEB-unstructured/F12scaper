// 담당: 정씨 · Elements + Styles (display: none)
// 1단계 글 "다음에 올 사람에게"의 1장. 개발자가 2장에 조각을 남겼는데, "다음 장" 버튼을 누군가(크롤러) 숨겨 놓았다.
// 버튼은 인라인 style="display: none" 으로 숨어 있다. Styles 패널에서 그 한 줄을 지우면
// 버튼이 제자리("목록으로" 버튼 옆)에 나타나고, 누르면 두 번째 조각을 보여 준다.
//
// 지켜야 할 것
// - hidden 속성 금지: base.css 의 [hidden] { display: none !important } 때문에 Styles 에서 못 푼다.
// - .next 규칙에 display 를 넣지 않는다. 숨김은 인라인 style 한 곳에만 있어야 한 동작으로 풀린다.
// - 화면 밖 배치·투명도 같은 다른 숨김을 겹치지 않는다.
// 대사·힌트는 초안. TODO(형씨): 다듬기

/** 퍼즐 안에 숨긴 원문(규칙 7 예외). 정답을 확정하면 이 값과 answerHash 를 같이 바꾼다. */
const ACCESS_KEY = 'test2'; // TODO(정씨): 임시 정답 test2

/** @type {import('./types.js').Stage} */
export default {
  id: 2,
  title: '사라진 다음 장',
  tool: 'Elements — Styles',
  toolUsage: 'CSS를 그 자리에서 고쳐 보며 레이아웃이 깨진 원인을 찾는다.',
  guide: [
    '글이 두 장으로 나뉘어 있는데… "다음 장" 버튼이 없네? 누가 일부러 숨겨 놓은 것 같아.',
    '이번에도 Elements 탭이야. 요소를 하나 클릭하면 옆이나 아래에 Styles 패널이 같이 보일 거야.',
    'Styles 에 적힌 줄 왼쪽에 마우스를 올리면 체크박스가 나와. 체크를 끄면 그 스타일이 바로 꺼져.',
  ],
  answerHash: '0a339d4640c859174fe82f1fc0207c2139184509c8d2782baa85cc731058f5cb', // 임시 정답 test2
  hints: [
    '버튼이 지워진 게 아니라 "안 보이게" 설정돼 있을 수도 있어. 화면 대신 버튼이 있어야 할 자리의 코드를 보자.',
    '"목록으로" 버튼 위에서 오른쪽 클릭 → "검사". 바로 아래 <button class="next"> 줄을 클릭하고, Styles 맨 위 element.style 에서 버튼을 숨기는 줄의 체크를 꺼 보자.',
    'element.style 의 display: none 체크를 끄면(또는 그 줄을 지우면) "다음 장" 버튼이 나타나. 눌러서 나온 두 번째 조각을 아래 입력창에 입력하자.',
  ],
  // 오답 경고는 크롤러가 말한다
  taunts: ['존재하지 않는 버튼은 누를 수 없습니다. 이 접근은 기록됩니다.', '허가되지 않은 열람 시도입니다.'],
  mount(el) {
    el.innerHTML = `
      <div class="wizard">
        <p class="wizard-title">다음에 올 사람에게 <span class="muted">— 1 / 2장</span></p>
        <div class="wizard-body">
          <p>이 글을 읽고 있다면, 당신도 여기 갇혔겠군요.</p>
          <p>나머지는 2장에 적어 두었습니다. 아래의 <b>[다음 장]</b> 버튼을 누르세요.</p>
          <p class="key" data-key></p>
        </div>
        <div class="wizard-buttons">
          <button type="button" disabled>&lt; 이전 장</button>
          <button type="button" data-cancel>목록으로</button>
          <button type="button" class="next" style="display: none">다음 장 &gt;</button>
        </div>
      </div>
    `;

    const key = el.querySelector('[data-key]');
    el.querySelector('[data-cancel]').addEventListener('click', () => {
      key.textContent = '목록으로 돌아갈 수 없습니다. 이 페이지에서 나갈 수 없습니다.';
    });
    el.querySelector('.next').addEventListener('click', () => {
      key.textContent = `2장 — 버튼까지 찾아 주셨네요. 두 번째 조각: ${ACCESS_KEY}`;
      key.classList.add('found');
    });
  },
};
