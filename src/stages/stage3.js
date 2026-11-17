// 담당: 형씨 · Console
// 입력창 없이 콘솔에서 unlock("열쇠") 를 실행하면 통과하는 단계.
// Vite 는 ES 모듈이라 함수 선언만으로는 콘솔에서 안 보인다 → window 에 직접 건다.
//
// 퍼즐: 열쇠는 탭 제목(document.title)에 거꾸로 적혀 있다. 콘솔 로그가 unlock() 의 존재와
// "열쇠는 이 페이지의 이름 속에 있다"는 것을 알려 준다. 튜토리얼(★★)이라 꼬임은 뒤집기 하나만 둔다.

const ORIGINAL_TITLE = document.title;

// 탭 제목에 들어갈 열쇠 (퍼즐 안에 숨긴 원문이라 커밋 예외. CLAUDE.md 규칙 7)
const REVERSED_KEY = 'latrop';
const PUZZLE_TITLE = `무료 과제 자료실 · ${REVERSED_KEY}`;

const LOG_SYSTEM = 'color:#2a7a2a';
const LOG_SPIDER = 'color:#888;font-style:italic';

/** @type {import('./types.js').Stage} */
export default {
  id: 3,
  title: '남겨진 함수',
  tool: 'Console',
  toolUsage: '페이지의 변수와 함수를 직접 호출해 보며 동작을 확인하고 에러 로그를 읽는다.',

  input: false,
  hints: [
    '이 페이지의 "이름"은 어디에 적혀 있을까요? 브라우저 맨 위를 봐요.',
    'Console 로그대로 열쇠는 탭 제목에 있어요. 그런데 거울에 비친 것처럼 뒤집혀 있네요.',
    '탭 제목 끝의 latrop 을 오른쪽 글자부터 거꾸로 읽어 보세요. 그 단어로 Console 에 unlock("단어") 를 입력하고 Enter 를 누르면 돼요.',
  ],
  mount(el, ctx) {


    window.unlock = async (key) => {
      if (key === undefined) {
        console.warn('[보안시스템] unlock("열쇠") 처럼 열쇠를 넣어 주십시오.');
        return;
      }
      if (await ctx.verify(String(key))) {
        console.log('%c[보안시스템] 잠금 해제. 손님의 이동을 기록합니다.', LOG_SYSTEM);
        // 거미의 첫 흔적 (스토리 복선)
        console.log('%c[spider] visitor 수집 완료. 전달 대기 중.', LOG_SPIDER);
        ctx.complete(String(key));
      } else if (String(key).trim().toLowerCase() === REVERSED_KEY) {
        console.warn('[보안시스템] 열쇠가 뒤집혀 있습니다.');
      } else {

      }
    };

    return () => {
      delete window.unlock;
      document.title = ORIGINAL_TITLE;
    };
  },
};