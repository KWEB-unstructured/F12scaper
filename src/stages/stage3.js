// 담당: 형씨 · Console
// 입력창 없이 콘솔에서 unlock("열쇠") 를 실행하면 통과하는 단계.
// Vite 는 ES 모듈이라 함수 선언만으로는 콘솔에서 안 보인다 → window 에 직접 건다.

const ORIGINAL_TITLE = document.title;

/** @type {import('./types.js').Stage} */
export default {
  id: 3,
  title: '남겨진 함수',
  tool: 'Console',
  toolUsage: '페이지의 변수와 함수를 직접 호출해 보며 동작을 확인하고 에러 로그를 읽는다.',
  guide: ['선배 조교: 이번엔 Console 탭이야. 뭔가 로그가 찍혀 있을걸?'],
  answerHash: '305ca66f5c2b134ee6bf23de834aa699de6f1f2f7b093569f7698f1979d9f300', // TODO(형씨): 임시 정답 test3
  input: false,
  hints: ['TODO 힌트 1', 'TODO 힌트 2', 'TODO 힌트 3'],
  mount(el, ctx) {
    // TODO(형씨): 열쇠를 페이지 제목에 숨기는 방식 확정
    document.title = `${ORIGINAL_TITLE} [key:test3]`;
    el.innerHTML = `<p class="puzzle-text">관리자 콘솔이 응답하지 않는다.</p>`;
    console.log('%c[system] unlock(key) 함수가 아직 남아 있습니다.', 'color:#0a0');

    window.unlock = async (key) => {
      if (await ctx.verify(String(key))) {
        console.log('[system] 잠금 해제.');
        ctx.complete(String(key));
      } else {
        console.warn('[유령 관리자] 그 열쇠가 아닌데?');
      }
    };

    return () => {
      delete window.unlock;
      document.title = ORIGINAL_TITLE;
    };
  },
};
