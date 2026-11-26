// 담당: 정씨 · 콘솔에 이야기 메시지를 찍는 유틸 (%c 로 화자별 색 구분)
import { CONSOLE_MESSAGES, CONSOLE_STYLES } from '../content/console-messages.js';

/**
 * 메시지 하나를 콘솔에 출력한다.
 * @param {keyof typeof CONSOLE_MESSAGES} key
 */
export function printConsole(key) {
  const msg = CONSOLE_MESSAGES[key];
  if (!msg) return;
  const style = CONSOLE_STYLES[msg.style] ?? '';
  if (msg.title) {
    // 테두리 블록
    const body = msg.lines.map((line) => `│ ${line}`).join('\n');
    console.log(`%c┌─ ${msg.title} ─\n${body}\n└────`, style);
    return;
  }
  const pad = ' '.repeat((msg.tag?.length ?? 0) + 1);
  console.log(`%c${msg.tag ? `${msg.tag} ` : ''}${msg.lines.join(`\n${pad}`)}`, style);
}

/**
 * 크롤러 로그를 콘솔에 찍는다 (회색, 줄마다 [crawler] 태그). 단계 화면의 크롤러 흔적용 (content/crawler.js)
 * @param {string[]} lines
 */
export function printCrawler(lines) {
  lines.forEach((line) => console.log(`%c[crawler] ${line}`, CONSOLE_STYLES.crawler));
}
