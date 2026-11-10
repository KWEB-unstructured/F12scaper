// 담당: 정씨(연출) · 형씨(문구는 content/prologue.js, content/console-messages.js)
// 프롤로그: 도서관(미연시) → 모니터 속 검색 → 평범한 사이트 → 이상 현상 → 갇힘(F12 유도) → 1단계
//
// 화면 구조
//   .prologue[data-scene]
//     .pl-world        도서관 전체. 모니터 쪽으로 줌인할 때 이 요소를 transform 한다
//       .pl-bg         배경 이미지 (없으면 CSS 그라디언트로 대신 보인다)
//       .pl-monitor    모니터 베젤. 위치·크기는 CSS 변수 --monitor-x/y/w/h (prologue.css)
//         .pl-screen   모니터 화면. 가짜 브라우저·사이트는 모두 실제 DOM (Elements 로 조사 가능)
//     .dlg             하단 대사창 (ui/dialogue.js)
//
// 상호작용 요소는 모두 실제 DOM 이다. 이후 단계에서 Elements 로 조사할 수 있어야 한다.
import { LIBRARY, MONITOR, ARCHIVE, GLITCH, TRAPPED } from '../content/prologue.js';
import { SITE_NAME } from '../content/story.js';
import { SPEAKERS } from '../content/characters.js';
import { AFTER_F12 } from '../content/console-messages.js';
import { createDialogue } from '../ui/dialogue.js';
import { printConsole } from '../ui/console-log.js';
import { loadPrologue, savePrologue, clearPrologue } from './prologue-state.js';
import { startSession } from '../core/api.js';
import { createProgress } from '../core/state.js';

/** prologue.css 의 transition 시간과 맞춘다 */
const ZOOM_MS = 1400;
const FULL_MS = 1400;

export function renderPrologue(root, { go }) {
  const state = loadPrologue();
  if (!state) return go('start');

  root.innerHTML = `
    <section class="prologue" data-scene="${state.scene}">
      <div class="pl-world">
        <div class="pl-bg" aria-hidden="true"></div>
        <div class="pl-monitor">
          <div class="pl-screen" data-screen></div>
        </div>
      </div>
      <p class="pl-question" data-question hidden></p>
      <p class="pl-corner" data-corner hidden></p>
      <p class="pl-nudge" data-nudge hidden></p>
      <div class="pl-toast taunt" data-toast role="alert" hidden></div>
      <p class="pl-escape" data-escape hidden></p>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const make = (tag, props) => Object.assign(document.createElement(tag), props);
  const section = $('.prologue');
  const screen = $('[data-screen]');
  const dialogue = createDialogue(section);

  // ── 화면을 떠나면 모든 타이머·리스너를 정리한다 ──
  let alive = true;
  const timers = new Set();
  const cleanups = [];
  /** 취소 가능한 대기. 화면을 떠나면 다음 줄로 진행하지 않는다 */
  const wait = (ms) =>
    new Promise((resolve) => {
      const t = setTimeout(() => {
        timers.delete(t);
        if (alive) resolve();
      }, ms);
      timers.add(t);
    });
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  };

  /** 마지막 마우스 위치 (갇힘 장면의 커서 근처 안내용) */
  let pointer = null;
  on(document, 'mousemove', (e) => (pointer = { x: e.clientX, y: e.clientY }));

  function setScene(scene) {
    section.dataset.scene = scene;
    state.scene = scene;
    savePrologue(state);
  }

  /** 줌·전체 화면 상태를 애니메이션 없이 바로 적용 (이어 하기용) */
  function applyInstant(...classes) {
    section.classList.add('no-anim', ...classes);
    void section.offsetWidth;
    section.classList.remove('no-anim');
  }

  /** 콘솔 메시지는 한 번만 찍고, 찍은 것은 저장해 둔다 */
  function printOnce(key) {
    if (state.printed.includes(key)) return;
    state.printed.push(key);
    savePrologue(state);
    printConsole(key);
  }

  /** 보안 시스템 짧은 알림 */
  let toastTimer = 0;
  function toast(text) {
    const el = $('[data-toast]');
    el.replaceChildren(make('span', { className: 'who', textContent: SPEAKERS.security.name }), make('p', { textContent: text }));
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2600);
  }

  /** 뒤로 가기: 막는 척 + 경고. 창 닫기는 막지 않는다 (beforeunload 쓰지 않음) */
  let backLocked = false;
  function lockBack() {
    if (backLocked) return;
    backLocked = true;
    history.pushState({ f12: 'trapped' }, '');
    on(window, 'popstate', () => {
      history.pushState({ f12: 'trapped' }, '');
      toast(TRAPPED.back);
    });
  }

  /** 모니터 안 가짜 브라우저 틀. 돌려준 요소 안에 페이지를 그린다 */
  function renderBrowser(url) {
    screen.innerHTML = `
      <div class="pl-browser">
        <div class="pl-chrome"><span class="pl-dots" aria-hidden="true">● ● ●</span><span class="pl-url" data-url></span></div>
        <div class="pl-view" data-view></div>
      </div>`;
    screen.querySelector('[data-url]').textContent = url;
    return screen.querySelector('[data-view]');
  }

  // ───────── 1) library: 미연시 내레이션 → 모니터로 줌인 ─────────
  async function library() {
    setScene('library');
    screen.innerHTML = `<div class="pl-desktop"><div class="pl-file"><span class="pl-file-icon" aria-hidden="true"></span><span data-file></span></div></div>`;
    screen.querySelector('[data-file]').textContent = LIBRARY.desktopFile;
    await dialogue.play(LIBRARY.lines);
    if (!alive) return;
    section.classList.add('is-zoomed');
    await wait(ZOOM_MS);
    monitor();
  }

  // ───────── 2) monitor: 무엇을 치든 과제 문장으로 바뀌는 검색창 ─────────
  async function monitor() {
    setScene('monitor');
    const view = renderBrowser(MONITOR.searchHost);
    view.innerHTML = `
      <div class="pl-page pl-search">
        <p class="pl-brand" data-brand></p>
        <form class="pl-searchbar" data-search>
          <input name="q" autocomplete="off" spellcheck="false" aria-label="검색어" />
          <button type="submit">검색</button>
        </form>
        <ol class="pl-results" data-results hidden></ol>
        <p class="pl-note" data-note></p>
      </div>`;
    view.querySelector('[data-brand]').textContent = MONITOR.searchBrand;
    const form = view.querySelector('[data-search]');
    const input = form.q;
    input.placeholder = MONITOR.placeholder;

    const target = [...MONITOR.forcedQuery];
    let count = 0;
    const render = () => {
      input.value = target.slice(0, count).join('');
    };
    const step = () => {
      count = Math.min(target.length, count + 1);
      render();
    };
    on(input, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        count = Math.max(0, count - 1);
        render();
      } else if (e.key.length === 1) {
        e.preventDefault();
        step();
      }
    });
    // 한글 입력기처럼 keydown 으로 막지 못한 입력도 한 글자씩 과제 문장으로 바꾼다
    on(input, 'input', step);

    await dialogue.play(MONITOR.lines);
    if (!alive) return;
    input.focus();

    await new Promise((resolve) =>
      on(form, 'submit', (e) => {
        e.preventDefault();
        count = target.length;
        render();
        resolve();
      }),
    );
    if (!alive) return;
    input.blur();

    // 검색 결과: 평범한 결과 + 마지막에 THE ARCHIVE
    const results = view.querySelector('[data-results]');
    const note = view.querySelector('[data-note]');
    const link = (item) => {
      const li = make('li', {});
      const a = make('a', { href: item.url, textContent: item.title });
      li.append(a, make('span', { className: 'pl-result-url', textContent: item.url }), make('p', { textContent: item.desc }));
      return { li, a };
    };
    for (const item of MONITOR.results) {
      const { li, a } = link(item);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        note.textContent = '페이지에 연결할 수 없습니다.';
      });
      results.append(li);
    }
    const archive = link(MONITOR.archive);
    archive.li.className = 'pl-result-archive';
    results.append(archive.li);
    results.hidden = false;

    await new Promise((resolve) =>
      on(archive.a, 'click', (e) => {
        e.preventDefault();
        resolve();
      }),
    );
    if (!alive) return;
    archiveScene();
  }

  // ───────── 3) archive: 평범해 보이는 사이트. 메뉴를 몇 개 본 뒤 "열람하기" ─────────
  async function archiveScene() {
    setScene('archive');
    const view = renderBrowser(ARCHIVE.url);
    view.innerHTML = `
      <div class="pl-page pl-site">
        <header class="pl-site-head"><strong class="pl-logo" data-logo></strong><nav class="pl-nav" data-nav></nav></header>
        <main class="pl-site-main" data-main></main>
        <footer class="pl-site-foot" data-foot></footer>
      </div>`;
    view.querySelector('[data-logo]').textContent = SITE_NAME;
    view.querySelector('[data-foot]').textContent = ARCHIVE.footer;
    const nav = view.querySelector('[data-nav]');
    const main = view.querySelector('[data-main]');
    const visited = new Set();

    let openRequested = null;
    const opened = new Promise((resolve) => (openRequested = resolve));

    const showPage = (key) => {
      const page = ARCHIVE.pages[key];
      visited.add(key);
      nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.page === key)));
      main.replaceChildren(make('h2', { textContent: page.title }), ...page.body.map((t) => make('p', { textContent: t })));
      if (key === 'archive') {
        printOnce('crawler'); // 거미의 복선
        const note = make('p', { className: 'pl-note' });
        const open = make('button', { type: 'button', className: 'pl-open', textContent: ARCHIVE.openButton });
        open.addEventListener('click', () => {
          if (visited.size < ARCHIVE.minPages) note.textContent = ARCHIVE.notReady;
          else openRequested();
        });
        main.append(open, note);
      }
    };
    for (const [key, page] of Object.entries(ARCHIVE.pages)) {
      const b = make('button', { type: 'button', textContent: page.menu });
      b.dataset.page = key;
      b.addEventListener('click', () => showPage(key));
      nav.append(b);
    }
    showPage('welcome');

    await opened;
    if (!alive) return;
    glitch();
  }

  // ───────── 4) glitch: 화면이 깨지고 문구가 바뀐 뒤 모니터가 세상 전체가 된다 ─────────
  async function glitch() {
    setScene('glitch');
    printOnce('waiting'); // 콘솔을 열기 전에 미리 찍어 둔다
    lockBack();
    screen.classList.add('is-glitch');
    await wait(900);
    screen.innerHTML = `<div class="pl-void" data-void></div>`;
    const voidEl = screen.querySelector('[data-void]');
    for (const text of GLITCH.screen) {
      voidEl.append(make('p', { textContent: text }));
      await wait(750);
    }
    await wait(500);
    section.classList.add('is-full');
    await wait(FULL_MS);
    screen.classList.remove('is-glitch');
    await dialogue.play(GLITCH.lines);
    if (!alive) return;
    trapped();
  }

  // ───────── 5) trapped: F12 유도 → 콘솔 메시지 → 1단계 ─────────
  async function trapped({ resumed = false } = {}) {
    setScene('trapped');
    lockBack();
    screen.innerHTML = `<div class="pl-void is-dim"><p data-status></p></div>`;
    screen.querySelector('[data-status]').textContent = GLITCH.screen.at(-1);

    let opened = false;
    let nudgeTimer = 0;

    const onOpened = async () => {
      if (opened) return;
      opened = true;
      clearTimeout(nudgeTimer);
      $('[data-nudge]').hidden = true;
      $('[data-corner]').hidden = true;
      for (const { key, delay } of AFTER_F12) {
        if (state.printed.includes(key)) continue;
        await wait(delay);
        printOnce(key);
      }
      await wait(1800);
      finish();
    };

    // F12 · Ctrl+Shift+I/J/C · Cmd+Option+I/J/C 감지 (캡처 단계에서 먼저 받는다)
    on(
      document,
      'keydown',
      (e) => {
        const combo = ['KeyI', 'KeyJ', 'KeyC'].includes(e.code) && (((e.ctrlKey || e.metaKey) && e.shiftKey) || (e.metaKey && e.altKey));
        if (e.key === 'F12' || combo) onOpened();
      },
      true,
    );

    // 이미 콘솔을 연 뒤 새로고침했다면 남은 메시지부터 이어 간다
    if (resumed && state.printed.includes('detected')) return onOpened();

    if (!resumed) {
      const q = $('[data-question]');
      q.textContent = TRAPPED.question;
      q.hidden = false;
      await wait(3600);
      q.hidden = true;
    }
    await wait(500);
    // 구석 안내: 지직거리며 나타난 뒤 개발자 도구를 열 때까지 남아 있다 (작게 1초만 보이면 놓치기 쉬움)
    const corner = $('[data-corner]');
    corner.textContent = TRAPPED.corner;
    corner.hidden = false;
    await wait(1200);
    if (opened) return;

    // 메뉴·우클릭으로 개발자 도구를 열면 keydown 이 오지 않는다 → 다음 상호작용 때 출력 (폴백)
    on(document, 'pointerdown', onOpened, { once: true });
    on(document, 'keydown', onOpened, { once: true });

    // 30초 동안 반응이 없으면 커서 근처에 작은 안내
    const nudge = $('[data-nudge]');
    nudge.textContent = TRAPPED.nudge;
    const place = () => {
      if (!pointer) return;
      nudge.style.left = `${pointer.x + 16}px`;
      nudge.style.top = `${pointer.y + 16}px`;
    };
    on(document, 'mousemove', place);
    nudgeTimer = setTimeout(() => {
      if (!alive || opened) return;
      place();
      nudge.hidden = false;
    }, TRAPPED.nudgeAfterMs);
    timers.add(nudgeTimer);
  }

  /** 프롤로그 끝: 여기서 세션을 시작한다 (프롤로그 시간은 기록에 넣지 않는다) */
  async function finish() {
    const voidEl = screen.querySelector('.pl-void') ?? screen;
    voidEl.replaceChildren(make('p', { className: 'pl-connecting', textContent: TRAPPED.connecting }));
    try {
      const { sessionId, startedAt } = await startSession(state.nickname);
      if (!alive) return;
      createProgress({ sessionId, nickname: state.nickname, startedAt });
      clearPrologue();
      go('stage');
    } catch (err) {
      if (!alive) return;
      showRetry(voidEl, err.status === 400);
    }
  }

  /** /api/start 실패: 이름 거절이면 이름을 다시 받고, 아니면 다시 시도 버튼 */
  function showRetry(container, rejected) {
    const form = make('form', { className: 'pl-retry' });
    form.append(make('p', { className: 'error', textContent: rejected ? TRAPPED.nicknameRejected : TRAPPED.startFailed }));
    let input = null;
    if (rejected) {
      input = make('input', { name: 'nickname', maxLength: 16, required: true, autocomplete: 'off', value: '' });
      input.setAttribute('aria-label', '이름');
      form.append(input);
    }
    form.append(make('button', { type: 'submit', className: 'primary', textContent: TRAPPED.retry }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input) {
        const name = input.value.trim();
        if (!name) return;
        state.nickname = name;
        savePrologue(state);
      }
      finish();
    });
    container.replaceChildren(form);
    input?.focus();
  }

  /** 갇힌 뒤 새로고침: 도서관으로 돌아가지 않고 "도망칠 수 없습니다" 연출 후 복귀 */
  async function escapeAttempt() {
    applyInstant('is-zoomed', 'is-full');
    screen.innerHTML = `<div class="pl-void is-dim"></div>`;
    state.printed.forEach(printConsole); // 새로고침으로 지워진 콘솔 기록을 다시 남긴다
    const el = $('[data-escape]');
    el.textContent = TRAPPED.escape;
    el.hidden = false;
    await wait(2200);
    el.hidden = true;
    trapped({ resumed: true });
  }

  // ── 시작: 저장된 장면부터 ──
  switch (state.scene) {
    case 'glitch':
    case 'trapped':
      escapeAttempt();
      break;
    case 'archive':
      applyInstant('is-zoomed');
      state.printed.forEach(printConsole);
      archiveScene();
      break;
    case 'monitor':
      applyInstant('is-zoomed');
      monitor();
      break;
    default:
      library();
  }

  return () => {
    alive = false;
    timers.forEach(clearTimeout);
    clearTimeout(toastTimer);
    cleanups.forEach((fn) => fn());
    dialogue.destroy();
  };
}
