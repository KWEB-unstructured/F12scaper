// 담당: 형씨 · Application (쿠키)
// 화면에는 "권한이 없습니다"만 보인다. 첫 진입 때 쿠키 role=student 를 심고,
// 플레이어가 Application 탭에서 role 을 admin 으로 고친 뒤 새로고침하면 조각이 나타난다.
// 쿠키는 반드시 document.cookie 로 심는다 (서버가 심으면 HttpOnly 가 될 수 있음).
// 진행 상황(4단계에 있다는 것)은 쿠키가 아니라 localStorage(core/state.js)에 있으므로 새로고침해도 유지된다.

// 화면에 보여 줄 조각 (퍼즐 안에 숨긴 원문이라 커밋 예외. CLAUDE.md 규칙 7)
// 글자 코드 XOR maskAt(i) 로 인코딩해 둔다. 바꿀 때: npm run encode -- "조각"
const CODES = [121, 113, 104, 86, 29];
const maskAt = (i) => (i * 7 + 13) & 63;
const revealFragment = () => String.fromCharCode(...CODES.map((c, i) => c ^ maskAt(i)));

function readRole() {
  const m = /(?:^|;\s*)role=([^;]*)/.exec(document.cookie);
  return m ? decodeURIComponent(m[1]) : null;
}

/** @type {import('./types.js').Stage} */
export default {
  id: 4,
  title: '권한이 없습니다',
  tool: 'Application — 쿠키',
  toolUsage: '로그인·세션 문제를 디버깅할 때 쿠키와 저장소 값을 확인하고 지운다.',
  guide: [
    '여기서부터는 어느 탭을 열어야 하는지 내가 알려주지 않을 거야.',
    'THE ARCHIVE 가 우리를 알아보고 문전박대하네. 그런데 사이트는 우리가 누군지 어떻게 기억하고 있을까?',
  ],
  answerHash: '9e5da9f5a25c648ab528f6bdc871ff39fae642b24d1a39f0366021e93692f9aa', // 임시 정답 test4
  hints: [
    '쿠키는 어디에 저장될까?',
    'F12 의 Application 탭 왼쪽 Storage 에서 Cookies 를 열고, 이 사이트 주소를 눌러 보세요.',
    'role 이라는 쿠키의 Value 를 student 에서 admin 으로 고치고(더블클릭), 페이지를 새로고침(F5)하세요. 나타난 글자를 입력창에 넣으면 돼요.',
  ],
  taunts: [
    '관리자 권한이 확인되지 않았습니다. 이 접근은 기록됩니다.',
    '이용자 등급이 변경되지 않았습니다. 일반 이용자에게 이 문은 열리지 않습니다.',
    '입력값 거부: 먼저 이용자 신원을 증명하십시오.',
  ],
  mount(el, ctx) {
    // 쿠키가 없을 때만 학생으로 시작한다. 이미 있으면(admin 포함) 건드리지 않는다.
    if (readRole() === null) {
      document.cookie = 'role=student; path=/; SameSite=Lax';
    }

    if (readRole() === 'admin') {
      el.innerHTML = `<p class="puzzle-text">관리자 인증 완료.</p><p class="puzzle-text">접근 코드: <code data-code></code></p>`;
      el.querySelector('[data-code]').textContent = revealFragment();
      ctx.say('오, 관리자 등급이 됐네! 화면에 나온 코드를 입력해 봐.');
      ctx.taunt('이용자 등급 변조가 감지되었습니다. 이 사실은 기록됩니다.');
    } else {
      el.innerHTML = `<p class="puzzle-text">권한이 없습니다.</p>`;
    }

    // 단계를 떠나면 퍼즐용 쿠키를 치운다. (새로고침으로는 이 정리 함수가 불리지 않는다)
    return () => {
      document.cookie = 'role=; max-age=0; path=/';
    };
  },
};
