// 담당: 정씨 · Elements + Styles (display: none)
// "다음" 버튼이 인라인 style="display: none" 으로 숨어 있다. Styles 패널에서 그 한 줄을 지우면
// 버튼이 제자리(취소 버튼 옆)에 나타나고, 누르면 복구 키(이 단계의 조각)를 보여 준다.
//
// 지켜야 할 것
// - hidden 속성 금지: base.css 의 [hidden] { display: none !important } 때문에 Styles 에서 못 푼다.
// - .next 규칙에 display 를 넣지 않는다. 숨김은 인라인 style 한 곳에만 있어야 한 동작으로 풀린다.
// - 화면 밖 배치·투명도 같은 다른 숨김을 겹치지 않는다.
// 대사·힌트는 초안. 형씨가 다듬는다.

/** 퍼즐 안에 숨긴 원문(규칙 7 예외). 정답을 확정하면 이 값과 answerHash 를 같이 바꾼다. */
const RECOVERY_KEY = 'test2'; // TODO(정씨): 임시 정답 test2

/** @type {import('./types.js').Stage} */
export default {
  id: 2,
  title: '사라진 다음 버튼',
  tool: 'Elements — Styles',
  toolUsage: 'CSS를 그 자리에서 고쳐 보며 레이아웃이 깨진 원인을 찾는다.',
  guide: [
    '선배 조교: 복구 마법사를 띄웠는데… "다음" 버튼이 없네? 유령 관리자가 숨겨 놓은 것 같아.',
    '선배 조교: 이번에도 Elements 탭이야. 요소를 하나 클릭하면 옆이나 아래에 Styles 패널이 같이 보일 거야.',
    '선배 조교: Styles 에 적힌 줄 왼쪽에 마우스를 올리면 체크박스가 나와. 체크를 끄면 그 스타일이 바로 꺼져.',
  ],
  answerHash: '0a339d4640c859174fe82f1fc0207c2139184509c8d2782baa85cc731058f5cb', // 임시 정답 test2
  hints: [
    '버튼이 지워진 게 아니라 "안 보이게" 설정돼 있을 수도 있어. 화면 대신 버튼이 있어야 할 자리의 코드를 봐.',
    '"취소" 버튼 위에서 오른쪽 클릭 → "검사". 바로 아래 <button class="next"> 줄을 클릭하고, Styles 맨 위 element.style 에서 버튼을 숨기는 줄의 체크를 꺼 봐.',
    'element.style 의 display: none 체크를 끄면(또는 그 줄을 지우면) "다음" 버튼이 나타나. 버튼을 눌러 나온 복구 키를 아래 입력창에 입력해.',
  ],
  taunts: ['버튼이 없는데 어떻게 넘어가려고? 흐흐.', '화면에 없는 건 정말 없는 걸까?'],
  mount(el) {
    el.innerHTML = `
      <div class="wizard">
        <p class="wizard-title">서버 복구 마법사 <span class="muted">— 2 / 3 단계</span></p>
        <div class="wizard-body">
          <p>복구에 필요한 파일을 모두 확인했습니다.</p>
          <p>계속하려면 아래의 <b>[다음]</b> 버튼을 누르세요.</p>
          <p class="key" data-key></p>
        </div>
        <div class="wizard-buttons">
          <button type="button" disabled>이전</button>
          <button type="button" data-cancel>취소</button>
          <button type="button" class="next" style="display: none">다음 &gt;</button>
        </div>
      </div>
    `;

    const key = el.querySelector('[data-key]');
    el.querySelector('[data-cancel]').addEventListener('click', () => {
      key.textContent = '취소할 수 없습니다. 서버가 잠겨 있습니다.';
    });
    el.querySelector('.next').addEventListener('click', () => {
      key.textContent = `복구 키: ${RECOVERY_KEY}  — 아래 입력창에 입력하세요.`;
      key.classList.add('found');
    });
  },
};
