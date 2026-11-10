// 프롤로그 콘솔 메시지. 출력은 src/ui/console-log.js 가 한다.
// 담당: 형씨(문구)
// TODO(형씨): SYSTEM 이 보안 시스템인지 납치범 쪽인지 미정 → 화자 이름 대신 메시지 단위로 둔다.

/** %c 스타일 (메시지의 style 키) */
export const CONSOLE_STYLES = {
  system: 'color:#f5a524; font-weight:bold',
  unknownSystem: 'color:#ff6b6b; font-weight:bold',
  unknownUser: 'color:#7cc4ff',
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
  /** 1. glitch 때 미리 출력 (콘솔은 열기 전 로그도 보여 준다) */
  waiting: { style: 'system', tag: '[ SYSTEM ]', lines: ['예상한 시간보다 조금 늦었네요.', '이제 대화할 준비가 되었습니까?'] },
  /** 2. F12 감지 직후 */
  detected: {
    style: 'unknownSystem',
    title: 'UNKNOWN SYSTEM',
    lines: [
      '새로운 접속자를 확인했습니다',
      'USER : UNKNOWN',
      'STATUS : TRAPPED',
      'WARNING: 이 웹사이트에서 나가려고 하지 마십시오.',
      '그들은 당신이 접속한 것을 알고 있습니다.',
    ],
  },
  /** 3. 2번 뒤 시간 차 */
  hello: { style: 'unknownUser', tag: '[UNKNOWN USER]', lines: ['저기요.', '혹시... 제 메시지가 보이나요?'] },
  /** 3-1. 1단계(Elements · HTML 주석)로 잇는 연결 대사 (제안) */
  bridge: {
    style: 'unknownUser',
    tag: '[UNKNOWN USER]',
    lines: ['콘솔만 보면 안 돼요. 그들이 여기를 지켜보고 있어요.', '메모는 화면 안에 숨겨 뒀어요. Elements 탭에서… 페이지 속을 들여다봐요.'],
  },
  /** 4. 거미의 복선. Archive 메뉴를 열었을 때 */
  crawler: { style: 'crawler', tag: '[crawler]', lines: ['visited: /archive'] },
};

/** F12 감지 후 출력 순서와 간격 (ms, 앞 메시지 기준) */
export const AFTER_F12 = [
  { key: 'detected', delay: 700 },
  { key: 'hello', delay: 2200 },
  { key: 'bridge', delay: 2600 },
];
