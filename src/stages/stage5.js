// 담당: 김씨 · Network
// 퍼즐: "열람 요청" 버튼은 /api/stage5 를 부르고, 서버는 항상 403 으로 거절한다.
// 화면에는 "거부됨"만 보인다. 열쇠는 응답 헤더(X-Archive-Key, 앞부분)와 응답 본문(key_tail, 뒷부분)에 나뉘어 있다 → api/stage5.js
// 단서를 화면·콘솔에 절대 내보내지 않는다. 그래서 응답 본문은 읽지도 않고 res.ok 만 본다.
// 본게임(4~6) 구간이라 시작 대사에서는 어느 탭인지 알려 주지 않는다. 탭 이름은 힌트 2부터.

/** @type {import('./types.js').Stage} */
export default {
  id: 5,
  title: '실패한 요청',
  tool: 'Network',
  toolUsage: 'API 요청의 상태 코드, 헤더, 응답 본문을 보고 프론트와 서버 중 어디가 문제인지 가른다.',
  // 화자를 적지 않은 대사·힌트는 주인공 독백 (반말 혼잣말). 본게임이라 시작 대사에서는 탭 이름을 말하지 않는다
  guide: [
    '기록 보관실 입구다. 이 단말기로 안쪽 서버에 열람 요청을 보낼 수 있나 봐.',
    '근데 보낼 때마다 거부래. …거부했다는 건, 서버가 뭔가 대답은 보냈다는 거잖아?',
    '화면에 뜨는 게 그 대답 전부일까?',
  ],
  answerHash: '531e9d6d23b3f507871fe9457b3a79f9a943f5d3ebd06eed4a2977b71990d657',
  hints: [
    '화면엔 "거부됨"뿐이야. 그래도 브라우저는 서버랑 주고받은 걸 전부 어딘가에 기록해 두고 있을 거야.',
    'Network 탭을 열어 둔 채로 요청을 다시 보내 보자. 빨갛게 표시된 stage5 요청을 누르면 Headers 랑 Response 를 볼 수 있어.',
    'Response 의 key_tail 이 뒷부분이고, Headers 의 Response Headers 에 있는 X-Archive-Key 가 앞부분이야. 앞 + 뒤를 이어서 입력하자.',
  ],
  // 오답 경고는 크롤러 (화면이 이름과 "비인가 접근 감지 (n회)" 제목을 붙인다)
  taunts: ['열람 권한 없음. 접근 기록을 수집합니다.', '화면에 표시된 정보로는 열 수 없습니다.'],
  mount(el) {
    el.innerHTML = `
      <div class="wizard">
        <p class="wizard-title">기록 보관실 · 열람 단말기</p>
        <div class="wizard-body">
          <p>열람 대상: 이전 접속자 기록</p>
          <p class="key" data-status>대기 중</p>
        </div>
        <div class="wizard-buttons">
          <button type="button" class="primary" data-request>열람 요청 보내기</button>
        </div>
      </div>
    `;

    const status = el.querySelector('[data-status]');
    const button = el.querySelector('[data-request]');
    let attempts = 0;
    let alive = true;

    button.addEventListener('click', async () => {
      button.disabled = true;
      status.textContent = '요청 보내는 중…';
      let text;
      try {
        const res = await fetch('/api/stage5', { cache: 'no-store' });
        attempts += 1;
        // 본문은 읽지 않는다. 단서가 화면·콘솔로 새지 않게.
        text = res.ok ? '열람 승인' : `거부됨 (${attempts}회)`;
      } catch {
        text = '연결 실패. 다시 시도하세요.';
      }
      if (!alive) return; // 응답이 오기 전에 단계를 떠났으면 아무것도 안 한다
      status.textContent = text;
      button.disabled = false;
    });

    return () => {
      alive = false;
    };
  },
};
