// 담당: 형씨 · Sources (중단점)
// 정답이 0.1초만 깜빡이는 퍼즐. 플레이어가 읽고 중단점을 걸 코드는
// public/stages/stage7-flash.js 에 둔다 (번들·압축되지 않아 Sources 탭에서 그대로 보인다).
// mount 에서 <script src="/stages/stage7-flash.js"> 를 붙이고, 정리 함수에서 떼어 낸다.
// 힌트 3 의 줄 번호는 stage7-flash.js 의 `showFlash(flashValue);` 줄이다 (flashValue 가 이미 만들어진 뒤라 값이 보인다). 그 파일의 줄이 밀리면 같이 고친다.

const SCRIPT_SRC = '/stages/stage7-flash.js';

/** @type {import('./types.js').Stage} */
export default {
  id: 7,
  title: '0.1초의 정답',
  tool: 'Sources — 중단점',
  toolUsage: '코드 실행을 멈추고 그 순간의 변수 값을 확인하며 버그를 추적한다.',
  guide: [
    '선배 조교: 마지막 관문 앞이야. 이 서버의 암호 조각이 화면에 잠깐 나타났다 사라지는 것 같아.',
    '선배 조교: 눈으로 잡기엔 너무 빨라. 그 순간을 멈출 방법이 있을 텐데...',
  ],
  answerHash: '350a75e9fcb0481ffdbb5d30517265700a8f9fa6b9bab5a0fdf9ad849a2377ce', // 임시 정답 test7
  hints: [
    '화면 캡처나 빠른 눈으로는 어려워요. 코드가 실행되는 도중에 멈춰서 값을 보는 방법이 있어요.',
    'F12 의 Sources 탭에서 왼쪽 파일 목록의 stages 폴더 안 stage7-flash.js 를 열고, 값을 만드는 곳을 찾아 줄 번호를 눌러 중단점을 거세요.',
    'stage7-flash.js 47번째 줄 showFlash(flashValue); 의 줄 번호를 눌러 중단점을 걸어요. 3초 안에 코드가 멈추면 오른쪽 Scope 의 Local 에서 flashValue 값을 읽고, ▶ 로 재개하세요.',
  ],
  taunts: [
    '봤어? 못 봤지? 0.1초면 충분해.',
    '눈이 빠른 게 아니라 코드를 멈춰야 한다는 걸 아직 모르는 거야?',
    '여기까지 온 건 칭찬해 주지. 하지만 그 답은 아니야.',
  ],
  mount(el, ctx) {
    el.innerHTML = `
      <p class="puzzle-text">서버 중앙 장치가 암호 조각을 주기적으로 송출하고 있다.</p>
      <div data-flash style="display:inline-block; min-width:16em; padding:1em 1.5em; background:#1c1f26; color:#9fd8b0; font:1.4em monospace; text-align:center; opacity:0.45;">신호 연결 중...</div>
    `;
    const box = el.querySelector('[data-flash]');

    let disposed = false;
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.dataset.stage = '7';
    script.onload = () => {
      if (!disposed) window.stage7Flash.start(box);
    };
    script.onerror = () => ctx.taunt('신호 송출기가 응답하지 않는다... 페이지를 새로고침해 봐.');
    document.head.append(script);

    return () => {
      disposed = true;
      window.stage7Flash?.stop();
      delete window.stage7Flash;
      script.remove();
    };
  },
};
