// 프롤로그 콘솔 메시지. 출력은 src/ui/console-log.js 가 한다.
// 담당: 형씨(문구) · TODO(형씨): 문구 다듬기
//
// 2026-11-24 새 스토리 반영
// - 개발자는 HTML 에 스크립트를 숨겨 두었고, 그 스크립트가 남긴 로그가 콘솔에 찍힌다.
//   크롤러는 원본 HTML 텍스트만 읽어서 JS 실행 결과(콘솔)는 보지 못한다 → 콘솔은 개발자가 말을 걸 수 있는 곳.
// - 전반부라 개발자는 정체를 숨긴다("???"). 이름 표시는 characters.js 와 맞춘다.

/** %c 스타일 (메시지의 style 키) */
export const CONSOLE_STYLES = {
  developer: 'color:#1558b0; font-weight:bold', // 짙은 파랑 (옅은 하늘색은 밝은 콘솔에서 잘 안 보였다)
  crawler: 'color:#7d8b9c',
};

/**
 * @typedef {Object} ConsoleMessage
 * @property {keyof typeof CONSOLE_STYLES} style
 * @property {string} [tag]      줄 앞에 붙는 화자 표시
 * @property {string} [title]    있으면 테두리 블록으로 출력
 * @property {string[]} lines
 */

/** @type {Record<string, ConsoleMessage>} */
export const CONSOLE_MESSAGES = {
  /** 1. F12 를 누른 순간(glitch) 출력. 개발자가 10년 전에 써 둔 말 */
  waiting: { style: 'developer', tag: '[ ??? ]', lines: ['예상한 시간보다 조금 늦었네요.', '이제 대화할 준비가 되었습니까?'] },
  /** 2. 갇힌 직후. 화면 뒤의 크롤러가 새 접속자를 기록한다 (회색 로그, 정체는 아직 모름) */
  detected: { style: 'crawler', tag: '[crawler]', lines: ['new visitor · type: UNKNOWN · status: TRAPPED'] },
  /** 3. 개발자의 첫인사 */
  hello: { style: 'developer', tag: '[ ??? ]', lines: ['저기요. 이 메시지가 보이나요?', '보인다면… 10년을 기다린 보람이 있군요.'] },
  /** 3-1. 경고 + 1단계(Elements · HTML 주석)로 잇는 연결 대사. 바로 위 회색 기록으로 "그들"을 처음 가리킨다 */
  bridge: {
    style: 'developer',
    tag: '[ ??? ]',
    lines: [
      '방금 그 회색 기록 보셨죠? 그들이 당신을 알아챘어요. 여기서는 길게 말할 수 없습니다.',
      '첫 번째 메모는 이 페이지 속에 숨겨 뒀습니다. Elements 탭에서 페이지를 들여다보세요.',
    ],
  },
  /** 4. 크롤러의 복선. 블로그의 Archive 메뉴를 열었을 때 */
  crawler: { style: 'crawler', tag: '[crawler]', lines: ['visited: /archive'] },
};

/** 갇힌 뒤 출력 순서와 간격 (ms, 앞 메시지 기준) */
export const AFTER_F12 = [
  { key: 'detected', delay: 700 },
  { key: 'hello', delay: 2200 },
  { key: 'bridge', delay: 2600 },
];
