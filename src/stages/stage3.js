// 담당: 형씨 · Console
// 입력창 없이 콘솔에서 unlock("열쇠") 를 실행하면 통과하는 단계.
// Vite 는 ES 모듈이라 함수 선언만으로는 콘솔에서 안 보인다 → window 에 직접 건다.
//
// 퍼즐: 열쇠는 탭 제목(document.title)에 거꾸로 적혀 있다. 콘솔 로그가 unlock() 의 존재와
// "열쇠는 이 페이지의 이름 속에 있다"는 것을 알려 준다. 튜토리얼(★★)이라 꼬임은 뒤집기 하나만 둔다.

import { CONSOLE_STYLES } from '../content/console-messages.js';

const ORIGINAL_TITLE = document.title;

// 탭 제목에 들어갈 열쇠 (퍼즐 안에 숨긴 원문이라 커밋 예외. CLAUDE.md 규칙 7)
const REVERSED_KEY = 'latrop';
const PUZZLE_TITLE = `무료 과제 자료실 · ${REVERSED_KEY}`;

// 콘솔 로그 화자는 크롤러 (2026-11-24 결정 2-2). 색은 프롤로그·크롤러 흔적(content/crawler.js)과 같은 회색
// TODO(형씨): 정씨가 [보안시스템]·[spider] 를 [crawler] 로 통일했다. 문구 다듬기
const LOG_CRAWLER = CONSOLE_STYLES.crawler;

/** @type {import('./types.js').Stage} */
export default {
  id: 3,
  title: '남겨진 함수',
  tool: 'Console',
  toolUsage: '페이지의 변수와 함수를 직접 호출해 보며 동작을 확인하고 에러 로그를 읽는다.',
  // 주인공 독백 (2026-11-24 결정 2-1). TODO(형씨): 정씨가 존댓말 → 반말 독백으로만 바꿨다. 다듬기
  guide: [
    '문이 잠겨 있어. 이번엔 Console 탭을 열어 보자.',
    '누군가 쓰던 함수가 아직 남아 있는 것 같아.',
  ],
  answerHash: '1ade1fd4843f0c181624362b7aa686aeb5d7e86b492b89613d6888843f551220',
  input: false,
  hints: [
    '이 페이지의 "이름"은 어디에 적혀 있지? 브라우저 맨 위를 보자.',
    'Console 로그대로라면 열쇠는 탭 제목에 있어. 그런데 거울에 비친 것처럼 뒤집혀 있네.',
    '탭 제목 끝의 latrop 을 오른쪽 글자부터 거꾸로 읽어 보자. 그 단어로 Console 에 unlock("단어") 를 입력하고 Enter.',
  ],
  mount(el, ctx) {
    document.title = PUZZLE_TITLE;
    el.innerHTML = `
      <p class="puzzle-text">나가는 문이 잠겨 있다.</p>
      <p class="puzzle-text">문 위에 작은 글씨: <q>열쇠는 거울 속에 있다.</q></p>
    `;

    console.log('%c[crawler] 출입 잠금 상태입니다.', LOG_CRAWLER);
    console.log('%c[crawler] 관리용 함수 unlock(key) 가 아직 제거되지 않았습니다.', LOG_CRAWLER);
    console.log('%c[crawler] key 는 이 페이지의 이름에 보관되어 있습니다.', LOG_CRAWLER);

    window.unlock = async (key) => {
      if (key === undefined) {
        console.warn('[crawler] unlock("열쇠") 처럼 열쇠를 넣어 주십시오.');
        return;
      }
      if (await ctx.verify(String(key))) {
        console.log('%c[crawler] 잠금 해제. 방문자의 이동을 기록합니다.', LOG_CRAWLER);
        console.log('%c[crawler] visitor 2 수집 완료. 전달 대기 중.', LOG_CRAWLER);
        ctx.complete(String(key));
      } else if (String(key).trim().toLowerCase() === REVERSED_KEY) {
        console.warn('[crawler] 열쇠가 뒤집혀 있습니다.');
      } else {
        console.warn('[crawler] 등록되지 않은 열쇠입니다. 비정상 접근으로 기록됩니다.');
      }
    };

    return () => {
      delete window.unlock;
      document.title = ORIGINAL_TITLE;
    };
  },
};