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
  guide: [
    '여기가 기록 보관실 입구야. 이 단말기로 안쪽 서버에 열람 요청을 보낼 수 있어.',
    '그런데 보내는 족족 거절당해. 그래도 거절했다는 건 서버가 뭔가 대답을 보냈다는 뜻이야.',
    '화면에 나오는 건 그 대답의 일부뿐이거든. 대답 전체를 볼 방법을 찾아봐.',
  ],
  answerHash: '531e9d6d23b3f507871fe9457b3a79f9a943f5d3ebd06eed4a2977b71990d657',
  hints: [
    '화면은 "거부됨"만 보여 줘. 하지만 브라우저는 서버와 주고받은 요청과 대답을 전부 따로 기록하고 있어.',
    '개발자 도구의 Network 탭을 열어 둔 채로 열람 요청을 다시 보내 봐. 빨갛게 표시된 stage5 요청을 클릭하면 Headers 와 Response 를 볼 수 있어.',
    'Response 의 key_tail 이 열쇠 뒷부분이야. 앞부분은 Headers 의 Response Headers 에 있는 X-Archive-Key 값이고. 앞부분 + 뒷부분을 이어서 입력해.',
  ],
  taunts: ['열람 권한이 확인되지 않았습니다. 이 접근은 기록됩니다.', '화면에 표시된 정보만으로는 열 수 없습니다.'],
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
