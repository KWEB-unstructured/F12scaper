// 담당: 김씨 · 종합 (최종 자물쇠)
// 2026-11-24 결정 1: 정답 입력창이 없다. 플레이어가 콘솔에서 직접 종료 요청을 보내 탈출한다.
//   fetch('/system/terminate', { method: 'POST', body: JSON.stringify({ key: '조합한 키' }) })
// 화면(정씨, screens/stage.js)이 8단계 동안 fetch 를 감싸 본문에 sessionId·hints·stageTimes 를 덧붙이고,
// 서버(api/verify.js)가 환경변수 FINAL_ANSWER 와 비교한다. 최종 키는 클라이언트 어디에도 없다.
// 이 파일은 관리자 패널(모은 조각·조합 규칙·개발자 메시지)만 그린다. 주소 /system/terminate 는 5단계 실패 응답에 복선이 있다.
//
// TODO(형씨·김씨): 조합 규칙 확정. 1~7단계 키 조각이 정해지면 RULE 을 바꾸고,
//   규칙대로 만든 최종 키를 Vercel 환경변수 FINAL_ANSWER 에 넣는다. 키 원문은 레포·채팅 어디에도 적지 않는다.
import { speakerName } from '../content/characters.js';

/** 관리자 패널에 붙은 조합 규칙. 줄마다 하나씩 보여 준다. */
const RULE = ['TODO: 조합 규칙 (형씨 확정 후)'];

/** 개발자가 남긴 메시지 (2026-11-24 결정 문구) */
const DEVELOPER_NOTE = '저는 HTML밖에 쓸 수 없습니다. 이 문은 당신 쪽에서만 열 수 있어요.';

/** @type {import('./types.js').Stage} */
export default {
  id: 8,
  title: '관리자 패널의 마지막 자물쇠',
  tool: '종합',
  toolUsage: '', // 새 기능이 없는 단계라 클리어 카드에서 뺀다
  // 화자를 적지 않은 대사·힌트는 주인공 독백. TODO(형씨): 문구 확정
  guide: [
    '관리자 패널이다. 지금까지 모은 키 조각이 전부 여기 있어.',
    '그런데 입력할 곳이 없네. 이 문은… 어떻게 여는 거지?',
  ],
  answerHash: null,
  input: false,
  verify: 'terminate',
  hints: [
    '"당신 쪽에서만 열 수 있다"… 화면 말고, 내가 직접 서버에 요청을 보내라는 뜻인가?',
    '5단계에서 거절당한 응답에 서버 종료 요청 주소가 적혀 있었지. Console 에서 fetch 로 그 주소에 POST 를 보내 보자.',
    "Console 에 fetch('/system/terminate', { method: 'POST', body: JSON.stringify({ key: '조합한 키' }) }) 를 입력하자. key 에는 규칙대로 이어 붙인 값을.",
  ],
  taunts: ['종료 키 불일치. 비인가 종료 시도를 기록합니다.', '조합이 맞지 않습니다. 접근이 계속되면 차단됩니다.'],
  mount(el, ctx) {
    el.innerHTML = `
      <div class="wizard">
        <p class="wizard-title">THE ARCHIVE · 관리자 패널</p>
        <div class="wizard-body">
          <p class="puzzle-label">수집한 키 조각</p>
          <ul data-fragments style="list-style: none; padding: 0"></ul>
          <p class="puzzle-label">자물쇠 조합 규칙</p>
          <div data-rule></div>
          <p class="puzzle-label" data-note-who></p>
          <p data-note></p>
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
    // 8단계는 4단계 반전 뒤라 개발자의 이름이 드러난 상태다
    el.querySelector('[data-note-who]').textContent = `${speakerName('developer', true)}의 메시지`;
    el.querySelector('[data-note]').textContent = DEVELOPER_NOTE;

    // 개발 서버에서만 보인다. 빌드하면 import.meta.env.DEV 가 false 로 바뀌어 이 블록이 통째로 빠진다
    if (import.meta.env.DEV) {
      const dev = el.querySelector('[data-dev]');
      dev.textContent = '개발용: FINAL_ANSWER 가 없으면 최종 키는 test8';
      dev.hidden = false;
    }
  },
};
