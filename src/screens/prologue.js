// 담당: 정씨(연출) · 형씨(문구는 content/prologue.js, content/console-messages.js)
// 프롤로그: 도서관(미연시) → 모니터 속 검색 → 10년 전 블로그(F12 유도) → F12 를 누르는 순간 이상 현상 → 갇힘 → 1단계
// (2026-11-24 결정 5: 갇히는 계기는 F12. 블로그 장면에 있는 동안 언제 눌러도 갇힌다)
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
import { LIBRARY, MONITOR, ARCHIVE, LURE, GLITCH, TRAPPED } from '../content/prologue.js';
import { SITE_NAME } from '../content/story.js';
import { speakerName } from '../content/characters.js';
import { AFTER_F12 } from '../content/console-messages.js';
import { createDialogue } from '../ui/dialogue.js';
import { printConsole } from '../ui/console-log.js';
import { loadPrologue, savePrologue, clearPrologue } from './prologue-state.js';
import { startSession } from '../core/api.js';
import { createProgress } from '../core/state.js';

/** prologue.css 의 transition 시간과 맞춘다 */
const ZOOM_MS = 1400;
/** 줌인이 끝난 뒤 바탕화면을 잠깐 보여 주고 나서 검색 화면으로 넘어가는 쉼 (ms) */
const AFTER_ZOOM_MS = 1500;
/** 화면 속으로 빨려 드는 시간 · 그 뒤 암전 시간 (SUCK_MS 는 prologue.css 의 --suck 과 맞춘다) */
const SUCK_MS = 2400;
/** 빨려 들기 시작하고 이만큼 뒤에 "뭐야, 이—" 가 뜬다 */
const CUT_LINE_AT_MS = 900;
const BLACKOUT_MS = 600;
/** 암전이 끝나고 "…여기가 어디야?" 가 뜨기까지 검은 화면으로 두는 시간 */
const WAKE_DELAY_MS = 2600;

/** F12 · Ctrl+Shift+I/J/C · Cmd+Option+I/J/C (개발자 도구를 여는 키) */
const isDevtoolsKey = (e) =>
  e.key === 'F12' || (['KeyI', 'KeyJ', 'KeyC'].includes(e.code) && (((e.ctrlKey || e.metaKey) && e.shiftKey) || (e.metaKey && e.altKey)));

/** 빨려 들 때 회오리 블러용 배경 복사본 (조금씩 더 크고 더 돌아간 배경을 겹쳐서 번진 잔상을 만든다. prologue.css 의 .pl-bg > i) */
const SWIRL_COPIES = Array.from({ length: 8 }, (_, i) => `<i style="--k:${i + 1}"></i>`).join('');

export function renderPrologue(root, { go }) {
  const state = loadPrologue();
  if (!state) return go('start');

  root.innerHTML = `
    <section class="prologue" data-scene="${state.scene}">
      <div class="pl-world">
        <div class="pl-bg" aria-hidden="true">${SWIRL_COPIES}</div>
        <div class="pl-monitor">
          <div class="pl-screen" data-screen></div>
        </div>
      </div>
      <p class="pl-nudge" data-nudge hidden></p>
      <p class="pl-chip" data-chip role="status" hidden></p>
      <div class="pl-streaks" aria-hidden="true"></div>
      <div class="pl-tunnel" aria-hidden="true"></div>
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

  /** 마지막 마우스 위치 (F12 를 오래 안 누를 때 커서 근처 안내용) */
  let pointer = null;
  on(document, 'mousemove', (e) => (pointer = { x: e.clientX, y: e.clientY }));

  // 블로그에 들어가기 전(도서관·검색)에 미리 F12 를 눌러 개발자 도구가 이미 열려 있으면 기억해 둔다.
  // 블로그 장면에 들어가면 잠시 뒤 바로 갇힌다 (이미 열려 있어서 다시 누를 일이 없으므로).
  on(
    document,
    'keydown',
    (e) => {
      if (!isDevtoolsKey(e) || !['library', 'monitor'].includes(state.scene) || state.f12Early) return;
      state.f12Early = true;
      savePrologue(state);
    },
    true,
  );

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

  /** 크롤러 짧은 알림 (뒤로 가기 경고) */
  let toastTimer = 0;
  function toast(text) {
    const el = $('[data-toast]');
    // 프롤로그는 4단계 반전 전이라 정체를 숨긴 이름("알 수 없는 프로세스")
    el.dataset.speaker = 'crawler';
    el.replaceChildren(make('span', { className: 'who', textContent: speakerName('crawler', false) }), make('p', { textContent: text }));
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

  /** 모니터 안 가짜 브라우저 틀. 돌려준 요소 안에 페이지를 그린다. opening 이면 창이 열리듯 나타난다 */
  function renderBrowser(url, { opening = false } = {}) {
    screen.innerHTML = `
      <div class="pl-browser${opening ? ' is-opening' : ''}">
        <div class="pl-chrome"><span class="pl-dots" aria-hidden="true">● ● ●</span><span class="pl-url" data-url></span></div>
        <div class="pl-view" data-view></div>
      </div>`;
    setUrl(url);
    return screen.querySelector('[data-view]');
  }
  /** 가짜 브라우저 주소창 */
  function setUrl(url) {
    const el = screen.querySelector('[data-url]');
    if (el) el.textContent = url;
  }


  // ───────── 1) library: 미연시 내레이션 → 모니터로 줌인 ─────────
  async function library() {
    setScene('library');
    screen.innerHTML = `<div class="pl-desktop"><div class="pl-file"><span class="pl-file-icon" aria-hidden="true"></span><span data-file></span></div></div>`;
    screen.querySelector('[data-file]').textContent = LIBRARY.desktopFile;
    await dialogue.play(LIBRARY.lines);
    if (!alive) return;
    section.classList.add('is-zoomed');
    await wait(ZOOM_MS + AFTER_ZOOM_MS);
    monitor();
  }

  // ───────── 2) monitor: 무엇을 치든 과제 문장으로 바뀌는 검색창 ─────────
  async function monitor() {
    setScene('monitor');
    // 바탕화면에서 브라우저 창이 열리듯 나타난다
    const view = renderBrowser(MONITOR.searchHost, { opening: true });
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
    // 일반 결과는 열리지 않는다. 몇 번 실패하면 주인공이 수상한 결과 쪽으로 눈을 돌린다
    let fails = 0;
    for (const item of MONITOR.results) {
      const { li, a } = link(item);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        note.textContent = MONITOR.unreachable;
        fails += 1;
        if (fails === MONITOR.failsBeforeHint) dialogue.play(MONITOR.failLines);
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

  // ───────── 3) archive: 10년 전 멈춘 블로그. 검색한 글 → 메뉴 → 비공개 글을 열면 F12 를 유도하고, F12 를 누르는 순간 갇힌다 ─────────
  async function archiveScene() {
    setScene('archive');
    const view = renderBrowser(ARCHIVE.origin + ARCHIVE.article.path);
    // 개발자가 직접 만든 정적 블로그: 머리글(이름·메뉴) / 본문 + 옆줄(프로필·태그·지난 글·방문자) / 바닥글
    view.innerHTML = `
      <div class="pl-page pl-site">
        <header class="pl-site-head">
          <button type="button" class="pl-logo" data-logo></button>
          <nav class="pl-nav" data-nav></nav>
        </header>
        <div class="pl-site-body">
          <main class="pl-site-main" data-main></main>
          <aside class="pl-side" data-side></aside>
        </div>
        <footer class="pl-site-foot" data-foot></footer>
      </div>`;
    const nav = view.querySelector('[data-nav]');
    const main = view.querySelector('[data-main]');
    view.querySelector('[data-logo]').textContent = SITE_NAME;
    view.querySelector('[data-foot]').append(
      make('span', { textContent: ARCHIVE.copyright }),
      ...ARCHIVE.footerLinks.map((t) => make('span', { className: 'pl-foot-link', textContent: t })),
    );

    // ── 갇히는 순간: F12 (또는 아래 폴백) ──
    let trapNow = null;
    let isTrapped = false; // 갇힌 뒤에는 늦게 도착한 유도 안내를 띄우지 않는다
    const f12Pressed = new Promise((resolve) => {
      trapNow = () => {
        isTrapped = true;
        resolve();
      };
    });
    on(
      document,
      'keydown',
      (e) => {
        if (isDevtoolsKey(e)) trapNow();
      },
      true,
    );
    // 블로그에 오기 전에 이미 개발자 도구를 열어 뒀다면: 블로그를 잠깐 보여 준 뒤 갇힌다
    if (state.f12Early) wait(2500).then(() => trapNow());

    // ── F12 유도: 비공개 글 본문 한 줄("개발자 화면을 참조하세요") → 주인공 독백 → (30초) 커서 근처 안내 ──
    // 본문은 처음부터 그대로 적혀 있다 (지직거리며 바뀌는 연출 없음). 화면 구석 안내도 없다.
    let lureShown = false;
    const showLure = async () => {
      if (lureShown) return;
      lureShown = true;
      dialogue.play(ARCHIVE.lines.lure);

      const nudge = $('[data-nudge]');
      nudge.textContent = LURE.nudge;
      const place = () => {
        if (!pointer) return;
        nudge.style.left = `${pointer.x + 16}px`;
        nudge.style.top = `${pointer.y + 16}px`;
      };
      on(document, 'mousemove', place);
      wait(LURE.nudgeAfterMs).then(() => {
        if (isTrapped) return;
        place();
        nudge.hidden = false;
      });

      // 폴백 1: 개발자 도구를 창에 붙여서 열면 페이지 크기가 확 줄어든다 (메뉴·우클릭으로 열어도 감지)
      const base = { w: innerWidth, h: innerHeight };
      on(window, 'resize', () => {
        if (base.w - innerWidth >= 120 || base.h - innerHeight >= 120) trapNow();
      });
      // 폴백 2: 별도 창으로 열면 크기가 안 바뀐다 → 한참 지난 뒤의 클릭은 열었다고 본다
      wait(LURE.clickFallbackMs).then(() => on(document, 'pointerdown', () => trapNow(), { once: true }));
    };

    const markMenu = (key) => nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.page === key)));

    /** "[태그] 제목" (비공개 글처럼 태그가 없으면 제목만) */
    const postTitle = (post) => (post.tag ? `[${post.tag}] ${post.title}` : post.title);
    /** 글 목록의 글을 연다 */
    const openPost = (post) => {
      if (post.status === 'locked') showLockedPost();
      else if (post.status === 'article') showArticle();
      else showDeleted(post);
      view.scrollTop = 0;
    };

    /** 글자 속 `백틱` 부분을 인라인 코드로 (나머지는 그냥 글자). textContent 로만 넣는다 */
    const withInlineCode = (el, text) => {
      text.split('`').forEach((part, i) => {
        if (!part) return;
        el.append(i % 2 ? make('code', { className: 'pl-inline-code', textContent: part }) : document.createTextNode(part));
      });
      return el;
    };
    /** 글 본문 조각 (content/prologue.js 의 article.blocks) */
    const renderBlock = (block) => {
      if (block.type === 'ol' || block.type === 'ul') {
        const list = make(block.type, { className: 'pl-article-list' });
        list.append(...block.items.map((t) => withInlineCode(make('li', {}), t)));
        return list;
      }
      if (block.type === 'code') return make('pre', { className: 'pl-code', textContent: block.text });
      if (block.type === 'img') {
        // 10년 사이 외부 이미지가 사라져 깨진 그림 자리만 남았다
        const fig = make('figure', { className: 'pl-broken-img' });
        fig.append(make('span', { textContent: ARCHIVE.brokenImage }), make('figcaption', { textContent: block.alt }));
        return fig;
      }
      if (block.type === 'h3') return make('h3', { textContent: block.text });
      return withInlineCode(make('p', { className: 'pl-article' }), block.text);
    };

    /**
     * 글 아래 이전 글 · 다음 글 (글 목록에서 바로 아래·위 글).
     * 이전 글 칸은 겉으로는 평범한 링크지만 눌러도 아무 일이 없다 (과거 글로 헤매지 않고 다음 글 = 비공개 글로 가게).
     */
    const buildPager = (post) => {
      const index = ARCHIVE.posts.indexOf(post);
      const pager = make('nav', { className: 'pl-pager' });
      const link = (target, label, cls, onClick) => {
        if (!target) return make('span', {});
        const b = make('button', { type: 'button', className: `pl-pager-link ${cls}` });
        b.append(make('small', { textContent: label }), make('span', { textContent: postTitle(target) }));
        if (onClick) b.addEventListener('click', onClick);
        return b;
      };
      const newer = ARCHIVE.posts[index - 1];
      pager.append(
        link(ARCHIVE.posts[index + 1], `‹ ${ARCHIVE.prevLabel}`, 'is-prev', null),
        link(newer, `${ARCHIVE.nextLabel} ›`, 'is-next', () => openPost(newer)),
      );
      return pager;
    };

    /** 검색 결과에서 누른 글 (처음 열리는 페이지): 제목 · 날짜 · 본문 · 이전/다음 글 · 댓글란 */
    const showArticle = () => {
      const a = ARCHIVE.article;
      setUrl(ARCHIVE.origin + a.path);
      markMenu(null);
      const pager = buildPager(ARCHIVE.posts.find((p) => p.status === 'article'));
      const comments = make('section', { className: 'pl-comments' });
      comments.append(make('h4', { textContent: `${ARCHIVE.comments.title} 0` }), make('p', { className: 'pl-comments-empty', textContent: ARCHIVE.comments.empty }));
      main.replaceChildren(
        make('h2', { textContent: postTitle(a) }),
        make('p', { className: 'pl-post-date', textContent: a.date }),
        ...a.blocks.map(renderBlock),
        pager,
        comments,
      );
      // 끝까지 내려 이전·다음 글이 보이면 "다음 글"(비공개 글)을 누르도록 독백
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io.disconnect();
          onPagerSeen();
        },
        { root: view, threshold: 0.6 },
      );
      io.observe(pager);
    };

    // ── 비공개 글로 이끄는 독백: 들어옴 → (안 내려가면) 스크롤 안내 → 다음 글이 보이면 눌러 보자 ──
    let pagerSeen = false;
    const enterDone = dialogue.play(ARCHIVE.lines.enter);
    const onPagerSeen = () => {
      if (pagerSeen) return;
      pagerSeen = true;
      // 들어올 때 독백을 끊지 않게 끝난 뒤에. 그사이 다른 페이지로 갔으면 틀지 않는다
      enterDone.then(() => {
        if (alive && !isTrapped && !lureShown && onArticle()) dialogue.play(ARCHIVE.lines.nextPost);
      });
    };
    /** 지금 검색 결과의 그 글을 보고 있는지 */
    const onArticle = () => main.querySelector('h2')?.textContent === postTitle(ARCHIVE.article);
    enterDone
      .then(() => wait(ARCHIVE.scrollHintAfterMs))
      .then(() => {
        // 아직 글을 끝까지 안 내렸고, 지금 그 글을 보고 있을 때만
        if (alive && !isTrapped && !lureShown && !pagerSeen && onArticle()) dialogue.play(ARCHIVE.lines.scrollHint);
      });

    /** 지워진 글: 제목만 남아 있다 */
    const showDeleted = (post) => {
      markMenu(null);
      main.replaceChildren(
        make('h2', { textContent: postTitle(post) }),
        make('p', { className: 'pl-post-date', textContent: post.date }),
        make('p', { className: 'pl-post-hidden', textContent: ARCHIVE.deleted }),
        // 글 목록에서 지워진 글을 열었어도 "다음 글"로 최근 글 쪽으로 돌아갈 수 있게
        buildPager(post),
      );
    };

    /** 비공개 글: 제목만 있고 내용은 "화면에 표시되지 않습니다" → 독백 → F12 유도 */
    const showLockedPost = () => {
      const post = ARCHIVE.lockedPost;
      setUrl(ARCHIVE.origin + post.path);
      markMenu(null);
      main.replaceChildren(
        make('h2', { textContent: post.title }),
        make('p', { className: 'pl-post-date', textContent: `${post.date} · ${post.badge}` }),
        make('p', { className: 'pl-article pl-locked-body', textContent: post.body }),
      );
      if (lureShown) return;
      dialogue.play(ARCHIVE.lines.locked);
      wait(1800).then(() => !isTrapped && showLure());
    };

    /** 글 목록 (전체 또는 태그별). 제목을 누르면 연다 (비공개 글 → 유도, 지워진 글 → 삭제 안내) */
    const showList = (posts, title, path, menuKey) => {
      setUrl(ARCHIVE.origin + path);
      markMenu(menuKey);
      printOnce('crawler'); // 크롤러의 복선
      const list = make('ul', { className: 'pl-posts' });
      for (const post of posts) {
        const li = make('li', {});
        const link = make('button', { type: 'button', className: 'pl-post-link', textContent: postTitle(post) });
        link.addEventListener('click', () => openPost(post));
        li.append(make('span', { className: 'pl-post-date', textContent: post.date }), link);
        if (post.status === 'locked') li.append(make('span', { className: 'pl-badge', textContent: ARCHIVE.lockedPost.badge }));
        list.append(li);
      }
      main.replaceChildren(make('h2', { textContent: title }), list);
      view.scrollTop = 0;
    };
    const showAll = () => showList(ARCHIVE.posts, ARCHIVE.postsTitle, '/', 'posts');
    const showTag = (tag) =>
      showList(
        ARCHIVE.posts.filter((p) => p.tag === tag),
        ARCHIVE.tagPageTitle(tag),
        `/category/${tag}`, // 주소창에 보여 주기만 하는 글자라 인코딩하지 않는다
        'tags',
      );
    /**
     * 분류 목록 (2016년 한국 블로그식): "분류 전체보기 (n)" 아래에 분류마다 "이름 (글 수)".
     * 옆줄과 Category 페이지가 같이 쓴다. 글 수는 지워진 글까지 센 값이라 화면에 남은 글보다 많다.
     */
    const categoryList = () => {
      const total = ARCHIVE.tags.reduce((sum, t) => sum + t.count, 0);
      const all = make('button', { type: 'button', className: 'pl-cat-all', textContent: `${ARCHIVE.sidebar.tagsTitle} (${total})` });
      all.addEventListener('click', showAll);
      const list = make('ul', { className: 'pl-cats' });
      for (const { name, count } of ARCHIVE.tags) {
        const b = make('button', { type: 'button', className: 'pl-cat', textContent: `${name} (${count})` });
        b.addEventListener('click', () => showTag(name));
        const li = make('li', {});
        li.append(b);
        list.append(li);
      }
      const box = make('div', { className: 'pl-cat-box' });
      box.append(all, list);
      return box;
    };
    const showTags = () => {
      setUrl(`${ARCHIVE.origin}/category`);
      markMenu('tags');
      main.replaceChildren(make('h2', { textContent: ARCHIVE.menu.tags }), categoryList());
    };
    const showNotFound = () => {
      setUrl(`${ARCHIVE.origin}/guestbook`);
      markMenu('guestbook');
      main.replaceChildren(make('h2', { textContent: ARCHIVE.notFound.title }), make('p', { textContent: ARCHIVE.notFound.body }));
    };

    // 메뉴
    const menuActions = { posts: showAll, tags: showTags, guestbook: showNotFound };
    for (const [key, label] of Object.entries(ARCHIVE.menu)) {
      const b = make('button', { type: 'button', textContent: label });
      b.dataset.page = key;
      b.addEventListener('click', () => menuActions[key]?.());
      nav.append(b);
    }
    view.querySelector('[data-logo]').addEventListener('click', showAll);

    // 옆줄: 프로필 · 분류 · 지난 글 · 방문자 수
    const side = view.querySelector('[data-side]');
    const section = (title, ...children) => {
      const s = make('section', { className: 'pl-side-box' });
      if (title) s.append(make('h4', { textContent: title }));
      s.append(...children);
      return s;
    };
    const profile = make('div', { className: 'pl-profile' });
    profile.append(make('span', { className: 'pl-avatar' }), make('strong', { textContent: ARCHIVE.sidebar.profileName }));
    const months = make('ul', { className: 'pl-months' });
    months.append(...ARCHIVE.months.map((m) => make('li', { textContent: `${m.label} (${m.count})` })));
    const { today, total } = ARCHIVE.sidebar.visitors;
    const counter = make('p', { className: 'pl-counter' });
    counter.append(make('span', { textContent: `TODAY ${today}` }), make('span', { textContent: `TOTAL ${total.toLocaleString('en-US')}` }));
    side.append(
      section(null, profile),
      section(null, categoryList()),
      section(ARCHIVE.sidebar.monthsTitle, months),
      section(null, counter),
    );

    showArticle();

    await f12Pressed;
    if (!alive) return;
    $('[data-nudge]').hidden = true;
    dialogue.skip();
    glitch();
  }

  // ───────── 4) glitch: F12 를 누른 순간 화면 속으로 빨려 든다 ─────────
  //   번쩍 + 화면 깨짐 + "WELCOME BACK." → 가속 줌 + 주변이 빨려 드는 터널 + 끊기는 독백
  //   → 암전 → 검은 화면인 채로 정신을 차리는 독백
  async function glitch() {
    setScene('glitch');
    printOnce('waiting'); // 방금 연 콘솔에 개발자가 써 둔 말이 먼저 찍힌다
    lockBack();
    // 전기 신호: 화면 전체가 하얗게 번쩍
    section.classList.remove('is-zap');
    void section.offsetWidth;
    section.classList.add('is-zap');
    screen.classList.add('is-glitch');
    await wait(700);
    screen.innerHTML = `<div class="pl-void" data-void></div>`;
    const voidEl = screen.querySelector('[data-void]');
    voidEl.append(make('p', { textContent: GLITCH.screen }));
    await wait(900);

    // 빨려 듦: 처음엔 천천히, 끝으로 갈수록 빨라진다 (prologue.css 의 .is-sucking)
    section.classList.add('is-sucking', 'is-full');
    // 소용돌이가 빨라지기 시작할 때 독백을 꺼낸다
    await wait(CUT_LINE_AT_MS);
    dialogue.play(GLITCH.cutLines);
    await wait(SUCK_MS - CUT_LINE_AT_MS - 250);
    // 독백이 말하다가 지지직 끊긴다
    dialogue.el.classList.add('is-cut');
    await wait(250);
    dialogue.skip();
    dialogue.el.classList.remove('is-cut');

    // 암전: 정신을 잃었다가
    section.classList.add('is-blackout');
    screen.classList.remove('is-glitch');
    voidEl.replaceChildren();
    await wait(BLACKOUT_MS);
    // 안쪽 세계에서 깨어난다. 화면은 검은 채로 한동안 아무것도 없다가 독백만 뜬다
    section.classList.remove('is-sucking', 'is-blackout');
    await wait(WAKE_DELAY_MS);
    await dialogue.play(GLITCH.lines);
    if (!alive) return;
    trapped();
  }

  // ───────── 5) trapped: 이미 개발자 도구가 열려 있다 → 콘솔 메시지가 차례로 찍힌 뒤 1단계 ─────────
  // 개발자 도구는 처음 열면 Elements 탭이 먼저 보일 수 있어서 콘솔 메시지를 놓치기 쉽다.
  // → 말 거는 내용은 콘솔에만 두고(화면에는 비추지 않는다), 구석에 "Console · 새 메시지 n" 알림만 띄워 콘솔로 이끈다.
  async function trapped() {
    setScene('trapped');
    lockBack();
    // 화면은 검은 채로 두고 구석 알림만 띄운다
    screen.innerHTML = `<div class="pl-void is-trapped"></div>`;
    const chip = $('[data-chip]');

    const bumpChip = () => {
      chip.textContent = TRAPPED.chip(state.printed.length);
      chip.hidden = false;
      chip.classList.remove('is-new');
      void chip.offsetWidth;
      chip.classList.add('is-new');
    };

    bumpChip();
    // 새로고침으로 이어 온 경우 이미 찍은 메시지는 건너뛰고 남은 것부터
    for (const { key, delay } of AFTER_F12) {
      if (state.printed.includes(key)) continue;
      await wait(delay);
      printOnce(key);
      bumpChip();
    }
    await wait(1200);
    await dialogue.play(TRAPPED.lines);
    if (!alive) return;
    chip.hidden = true;
    finish();
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
      // 어두워졌다가 1단계 화면이 밝아진다 (단계 화면 쪽 페이드인은 base.css 의 .game)
      section.classList.add('is-leaving');
      await wait(900);
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
    trapped();
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
