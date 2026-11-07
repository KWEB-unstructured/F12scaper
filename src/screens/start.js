// 담당: 정씨 · 시작 화면 (게임 제목, 시작 버튼, 윤리 안내, 크롬 권장)
// 구성: 서버 경보 로그로 상황 제시 → 제목 → 플레이어가 할 일 → 버튼 → 안내
// 스토리 문구는 src/content/story.js(형씨)에서 가져온다.
import { ETHICS_NOTICE } from '../content/story.js';

// TODO(형씨): 아래 화면 문구(경보 로그·할 일·분량)는 정씨가 쓴 초안입니다.
//             다듬어서 story.js 로 옮길지 결정해 주세요.
const ALERT_LOG = [
  { level: 'ALERT', text: '수강신청 시스템 접근 차단됨' },
  { level: 'ALERT', text: '관리자 권한 탈취 — ghost_admin' },
  { level: 'INFO', text: '서버 복구율 0%' },
];
const MISSION = [
  '호랑이대학교 수강신청 서버가 다운 되었습니다.',
  '브라우저 개발자 도구(F12)를 활용하여, 관리자 패널에 들어가 서버를 되살려라!',
];
const META = '8단계 · 30~60분 · 막히면 힌트';

export function renderStart(root, { go }) {
  root.innerHTML = `
    <section class="screen start-screen">
      <div class="screen-bar">
        <span>horangi-univ · 전산실 SRV-01</span>
        <span>상태: <span class="status-locked">LOCKED</span></span>
      </div>
      <ol class="syslog" data-log aria-label="서버 경보"></ol>
      <h1 class="title"><span class="key">F12</span>이스케이프</h1>
      <p class="tagline">본격 F12 창과 친해지기 게임</p>
      <div class="mission" data-mission></div>
      <div class="actions">
        <button type="button" class="primary" data-start>시작하기</button>
        <button type="button" data-ranking>랭킹 보기</button>
      </div>
      <p class="notice" data-notice></p>
      <p class="muted browser-note">PC 크롬(또는 엣지) 브라우저를 권장합니다.</p>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const make = (tag, props) => Object.assign(document.createElement(tag), props);

  $('[data-log]').append(
    ...ALERT_LOG.map(({ level, text }) => {
      const li = make('li', {});
      li.append(make('span', { className: `lv lv-${level.toLowerCase()}`, textContent: `[${level.padEnd(5)}]` }), ` ${text}`);
      return li;
    }),
  );
  $('[data-mission]').append(
    ...MISSION.map((text) => make('p', { textContent: text })),
    make('p', { className: 'meta', textContent: META }),
  );
  $('[data-notice]').textContent = ETHICS_NOTICE;
  $('[data-start]').addEventListener('click', () => go('intro'));
  $('[data-ranking]').addEventListener('click', () => go('ranking'));
}
