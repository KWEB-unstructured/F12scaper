// 담당: 김씨 · 종합 (최종 자물쇠)
// 정답은 클라이언트에 없다. 단계 화면이 입력값을 /api/verify 로 보내고, 서버가 환경변수 FINAL_ANSWER 와 비교한다.
// 화면: 관리자 패널에 1~7단계에서 모은 조각과 조합 규칙(RULE)을 보여 준다. 새 개발자 도구 기능은 없는 보상 단계다.
//
// TODO(형씨·김씨): 조합 규칙 확정. 1~7단계 정답(조각)이 정해지면 RULE·힌트를 바꾸고,
//   규칙대로 만든 최종 정답을 Vercel 환경변수 FINAL_ANSWER 에 넣는다. 정답 원문은 레포·채팅 어디에도 적지 않는다.

/** 자물쇠 옆에 붙은 조합 규칙. 줄마다 하나씩 보여 준다. */
const RULE = ['TODO: 조합 규칙 (형씨 확정 후)'];

/** @type {import('./types.js').Stage} */
export default {
  id: 8,
  title: '관리자 패널의 마지막 자물쇠',
  tool: '종합',
  toolUsage: '', // 새 기능이 없는 단계라 클리어 카드에서 뺀다
  guide: [
    '여기가 관리자 패널이야. 이 자물쇠만 열면 밖으로 나갈 수 있어.',
    '지금까지 방마다 하나씩 주운 조각, 기억나지? 전부 여기 모여 있어.',
  ],
  taunts: ['최종 인증 실패. 인증 시도는 모두 기록됩니다.', '조합이 맞지 않습니다. 접근이 계속되면 차단됩니다.'],
  answerHash: null,
  verify: 'server',
  // TODO(형씨·김씨): 규칙이 정해지면 1 방향 · 2 어디를 볼지 · 3 거의 정답 순서로 바꾼다
  hints: [
    '새로운 도구는 필요 없어. 지금까지 모은 조각과 자물쇠 옆 규칙만 보면 돼.',
    '규칙을 한 줄씩 따라가면서 조각을 순서대로 써 봐.',
    '규칙대로 만든 값을 공백 없이 그대로 입력해.',
  ],
  mount(el, ctx) {
    el.innerHTML = `
      <div class="wizard">
        <p class="wizard-title">THE ARCHIVE · 관리자 패널</p>
        <div class="wizard-body">
          <p class="puzzle-label">수집한 조각</p>
          <ul data-fragments style="list-style: none; padding: 0"></ul>
          <p class="puzzle-label">자물쇠 조합 규칙</p>
          <div data-rule></div>
          <p class="puzzle-empty" data-dev hidden></p>
        </div>
      </div>
    `;

    // 조각은 플레이어가 입력한 값이라 innerHTML 로 넣지 않는다 (CLAUDE.md 규칙 9)
    const make = (tag, text) => Object.assign(document.createElement(tag), { textContent: text });
    el.querySelector('[data-fragments]').replaceChildren(
      ...[1, 2, 3, 4, 5, 6, 7].map((id) => {
        const li = make('li', `${id}단계 · `);
        li.append(make('code', ctx.fragments[id] ?? '—'));
        return li;
      }),
    );
    el.querySelector('[data-rule]').replaceChildren(...RULE.map((line) => make('p', line)));

    // 개발 서버에서만 보인다. 빌드하면 import.meta.env.DEV 가 false 로 바뀌어 이 블록이 통째로 빠진다
    if (import.meta.env.DEV) {
      const dev = el.querySelector('[data-dev]');
      dev.textContent = '개발용: FINAL_ANSWER 가 없으면 최종 정답은 test8';
      dev.hidden = false;
    }
  },
};
