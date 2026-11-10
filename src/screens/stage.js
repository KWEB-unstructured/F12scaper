// 담당: 정씨(화면 구성·디자인) · 형씨(진행 규칙은 core/game.js)
// 단계 화면: 화면 전체를 쓰는 "갇힌 사이트" 게임 화면
//
//   .game
//     .hud          상단: 구간·단계 이름 · 진행 점 · 탈출 진행률 · 기록 · ☰ 메뉴(처음부터 다시)
//     .site         가운데: 가짜 브라우저 창 (주소창 + 정보 표시줄 + 퍼즐)
//       .infobar    브라우저가 말하는 곳 (안내·힌트). 이미 받은 힌트는 ‹ › 로 다시 본다
//       .puzzle     퍼즐이 mount 되는 곳. 단계 파일들이 .puzzle[data-puzzle] 을 전제로 하므로 바꾸지 않는다
//     .game-bar     아래: 정답 입력(터미널) + 브라우저에게 묻기(힌트)
//     .dlg          단계를 처음 시작할 때 브라우저 대사를 대사창으로 (ui/dialogue.js)
//     .game-toast   보안 시스템 경고 (위에서 내려왔다 사라짐) + 화면 가장자리 붉게
//
// 화자 이름·진행률 라벨·문구는 content/ 데이터 파일에서 읽는다. 대사·힌트는 textContent 로만 넣는다.
import {
  currentStage,
  recoveryPercent,
  checkAnswer,
  recordWrong,
  useHint,
  openedHints,
  penaltyMs,
  completeStage,
  isFinished,
  HINT_PENALTY_MIN,
  WRONG_BEFORE_HINT_SUGGEST,
  TOTAL_STAGES,
} from '../core/game.js';
import { loadProgress, resetProgress } from '../core/state.js';
import { verifyFinal } from '../core/api.js';
import { formatDuration } from '../core/format.js';
import { DEFAULT_TAUNTS, HINT_SUGGEST, PROMPT, SERVER_DOWN, TOO_MANY_ATTEMPTS, GAME_UI, stageUrl } from '../content/story.js';
import { SPEAKERS, DEFAULT_SPEAKER, PROGRESS_LABEL, wrongAlertTitle } from '../content/characters.js';
import { createDialogue } from '../ui/dialogue.js';
import { confirmModal } from '../ui/modal.js';

/** 기획서의 구간 이름 (튜토리얼 1~3 · 본게임 4~6 · 보스 7 · 최종 8) */
function sectionOf(id) {
  if (id <= 3) return '튜토리얼';
  if (id <= 6) return '본게임';
  if (id === 7) return '보스';
  return '최종';
}

/** 대사 한 줄 → { speaker, text }. 문자열이면 기본 화자(브라우저) */
const toLine = (line) => (typeof line === 'string' ? { speaker: DEFAULT_SPEAKER, text: line } : { speaker: DEFAULT_SPEAKER, ...line });

/**
 * 단계 시작 대사를 대사창으로 본 적이 있는지 (탭을 닫기 전까지만 기억).
 * 4단계(쿠키 고치고 새로고침)·6단계(기기 모드 새로고침)처럼 새로고침이 퍼즐의 일부라서, 매번 다시 보여 주지 않는다.
 */
const seenKey = (p) => `f12escape:guide-seen:${p.sessionId}:${p.stage}`;
const wasGuideSeen = (p) => {
  try {
    return sessionStorage.getItem(seenKey(p)) === '1';
  } catch {
    return false;
  }
};
const markGuideSeen = (p) => {
  try {
    sessionStorage.setItem(seenKey(p), '1');
  } catch {
    /* 저장이 막힌 환경: 새로고침하면 대사창을 다시 본다 */
  }
};

export function renderStage(root, { go }) {
  const p = loadProgress();
  if (!p) return go('start');
  if (isFinished(p)) return go('clear');
  const stage = currentStage(p);
  const percent = recoveryPercent(p);

  root.innerHTML = `
    <section class="game">
      <header class="hud">
        <div class="hud-stage">
          <span class="hud-kicker" data-kicker></span>
          <h1 class="hud-title" data-title></h1>
        </div>
        <ol class="steps" data-steps aria-hidden="true"></ol>
        <span class="recovery"><span data-progress-label></span>
          <span class="meter" aria-hidden="true"><span style="width: ${percent}%"></span></span>
          <strong>${percent}%</strong></span>
        <span class="clock" title="실제 경과 시간 + 힌트 감점"><span aria-hidden="true">⏱</span> <span class="timer" data-timer></span></span>
        <div class="hud-menu">
          <button type="button" class="hud-menu-btn" data-menu aria-expanded="false" aria-haspopup="true">☰</button>
          <div class="hud-menu-list" data-menu-list hidden>
            <button type="button" data-reset></button>
          </div>
        </div>
      </header>

      <div class="site">
        <div class="site-chrome">
          <span class="site-nav" aria-hidden="true">◀ ▶ ⟳</span>
          <div class="site-url">
            <button type="button" class="site-info-btn" data-info-open aria-label="브라우저 메시지 보기">ⓘ</button>
            <span data-url></span>
          </div>
        </div>
        <div class="infobar" data-infobar role="status" hidden>
          <span class="infobar-icon" aria-hidden="true">ⓘ</span>
          <div class="infobar-body">
            <span class="infobar-who" data-info-who></span>
            <div class="infobar-text" data-info-text></div>
          </div>
          <div class="infobar-pager" data-info-pager hidden>
            <button type="button" data-info-prev aria-label="이전 메시지">‹</button>
            <span data-info-pos></span>
            <button type="button" data-info-next aria-label="다음 메시지">›</button>
          </div>
          <button type="button" class="infobar-close" data-info-close aria-label="닫기">×</button>
        </div>
        <div class="puzzle" data-puzzle></div>
      </div>

      <footer class="game-bar">
        <form class="terminal" data-form>
          <label for="answer" data-prompt></label>
          <input id="answer" name="answer" autocomplete="off" spellcheck="false" />
          <button type="submit" class="run" data-submit></button>
        </form>
        <button type="button" class="ask" data-hint><span data-hint-label></span> <span class="ask-meta" data-hint-meta></span></button>
      </footer>

      <div class="alert-edge" data-edge aria-hidden="true"></div>
      <div class="game-toast taunt" data-taunt role="alert" hidden></div>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const make = (tag, props) => Object.assign(document.createElement(tag), props);
  const screen = $('.game');

  // ── 고정 문구 ──
  $('[data-kicker]').textContent = `${sectionOf(stage.id)} · STAGE ${stage.id} / ${TOTAL_STAGES}`;
  $('[data-title]').textContent = stage.title;
  $('[data-progress-label]').textContent = PROGRESS_LABEL;
  $('[data-prompt]').textContent = PROMPT;
  $('[data-url]').textContent = stageUrl(stage.id);
  $('[data-menu]').setAttribute('aria-label', GAME_UI.menu);
  $('[data-reset]').textContent = GAME_UI.reset;
  $('[data-submit]').textContent = GAME_UI.submit;
  $('[data-hint-label]').textContent = GAME_UI.askBrowser;
  $('#answer').placeholder = GAME_UI.placeholder;
  $('[data-steps]').append(
    ...Array.from({ length: TOTAL_STAGES }, (_, i) =>
      make('li', { className: i + 1 < p.stage ? 'done' : i + 1 === p.stage ? 'now' : '' }),
    ),
  );

  // ── 정보 표시줄: 브라우저가 짧게 말하는 곳. 메시지가 여러 개면 ‹ › 로 넘겨 본다 ──
  /** @type {{ speaker: string, label?: string, lines: string[] }[]} */
  const infoItems = [];
  let infoIndex = 0;
  const infobar = $('[data-infobar]');

  function renderInfo() {
    const item = infoItems[infoIndex];
    if (!item) return;
    infobar.dataset.speaker = item.speaker;
    $('[data-info-who]').textContent = item.label ?? SPEAKERS[item.speaker]?.name ?? '';
    $('[data-info-text]').replaceChildren(...item.lines.map((text) => make('p', { textContent: text })));
    const many = infoItems.length > 1;
    $('[data-info-pager]').hidden = !many;
    $('[data-info-pos]').textContent = `${infoIndex + 1}/${infoItems.length}`;
    $('[data-info-prev]').disabled = infoIndex === 0;
    $('[data-info-next]').disabled = infoIndex === infoItems.length - 1;
  }
  function openInfo() {
    infobar.hidden = false;
    $('[data-info-open]').classList.remove('has-new');
    renderInfo();
  }
  /** 새 메시지를 붙이고 그 메시지를 보여 준다 */
  function pushInfo(item) {
    infoItems.push(item);
    infoIndex = infoItems.length - 1;
    openInfo();
    // 다시 내려오는 효과
    infobar.classList.remove('is-new');
    void infobar.offsetWidth;
    infobar.classList.add('is-new');
  }
  $('[data-info-prev]').addEventListener('click', () => {
    infoIndex = Math.max(0, infoIndex - 1);
    renderInfo();
  });
  $('[data-info-next]').addEventListener('click', () => {
    infoIndex = Math.min(infoItems.length - 1, infoIndex + 1);
    renderInfo();
  });
  $('[data-info-close]').addEventListener('click', () => (infobar.hidden = true));
  $('[data-info-open]').addEventListener('click', () => (infobar.hidden ? openInfo() : (infobar.hidden = true)));

  /** ctx.say: 퍼즐 중 대사 한 줄 → 정보 표시줄 */
  const say = (line) => {
    const { speaker, text } = toLine(line);
    pushInfo({ speaker, lines: [text] });
  };

  // ── 보안 시스템 경고: 위에서 내려왔다 사라지는 알림 + 화면 가장자리 붉게 ──
  let toastTimer = 0;
  const taunt = (text, count) => {
    const el = $('[data-taunt]');
    el.dataset.speaker = 'security';
    el.replaceChildren(make('span', { className: 'who', textContent: SPEAKERS.security.name }));
    if (count) el.append(make('p', { className: 'alert-title', textContent: wrongAlertTitle(count) }));
    el.append(make('p', { textContent: text }));
    el.hidden = false;
    el.classList.remove('is-new');
    void el.offsetWidth;
    el.classList.add('is-new');
    const edge = $('[data-edge]');
    edge.classList.remove('is-on');
    void edge.offsetWidth;
    edge.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 4000);
  };

  // ── 힌트: 브라우저에게 묻기 ──
  const hintBtn = $('[data-hint]');
  const hintItem = (text, i) => ({ speaker: 'browser', label: `${SPEAKERS.browser.name} · 힌트 ${i + 1}/${stage.hints.length}`, lines: [text] });
  const renderHintButton = () => {
    const used = p.hints[p.stage] ?? 0;
    const total = stage.hints.length;
    hintBtn.disabled = used >= total;
    $('[data-hint-meta]').textContent = GAME_UI.askMeta(used, total, HINT_PENALTY_MIN[used]);
  };

  // ── 시작 대사: 처음이면 대사창(B), 이미 봤으면 정보 표시줄(A)에 바로 ──
  const guideLines = stage.guide.map(toLine);
  const guideItem = { speaker: guideLines[0]?.speaker ?? DEFAULT_SPEAKER, lines: guideLines.map((l) => l.text) };
  const showGuideInfo = () => {
    if (guideLines.length) infoItems.unshift(guideItem);
    openedHints(p).forEach((text, i) => infoItems.push(hintItem(text, i)));
    infoIndex = infoItems.length - 1;
    if (infoItems.length) openInfo();
  };
  const dialogue = createDialogue(screen);
  const focusAnswer = () => {
    if (!form.hidden) form.answer.focus();
  };

  // ── 타이머: 서버 시작 시각 기준 + 힌트 패널티 ──
  const tick = () => {
    $('[data-timer]').textContent = formatDuration(Date.now() - Date.parse(p.startedAt) + penaltyMs(p));
  };
  tick();
  const interval = setInterval(tick, 1000);

  let solved = false;
  const solve = (fragment) => {
    if (solved) return;
    solved = true;
    completeStage(p, fragment);
    go('stage');
  };

  const form = $('[data-form]');
  const onWrong = () => {
    // 입력칸을 잠깐 흔들어 오답을 알린다
    form.classList.remove('wrong');
    void form.offsetWidth;
    form.classList.add('wrong');
    const count = recordWrong(p);
    const taunts = stage.taunts?.length ? stage.taunts : DEFAULT_TAUNTS;
    taunt(taunts[Math.floor(Math.random() * taunts.length)], count);
    if (count === WRONG_BEFORE_HINT_SUGGEST && !p.hints[p.stage]) say(HINT_SUGGEST);
  };

  const stageCleanup = stage.mount($('[data-puzzle]'), {
    complete: solve,
    verify: (input) => checkAnswer(stage, input),
    say,
    taunt: (text) => taunt(text),
    fragments: Object.freeze({ ...p.fragments }),
  });

  form.hidden = stage.input === false;
  form.addEventListener('animationend', () => form.classList.remove('wrong'));
  form.answer.addEventListener('input', () => form.classList.remove('wrong')); // 애니메이션 꺼진 환경 대비
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = form.answer.value;
    if (!input.trim()) return;
    form.answer.value = '';

    if (stage.verify === 'server') {
      try {
        const res = await verifyFinal({
          sessionId: p.sessionId,
          answer: input,
          hints: p.hints,
          stageTimes: { ...p.stageTimes, [stage.id]: Date.now() - p.stageEnteredAt },
        });
        if (!res.ok) return onWrong();
        p.result = { finalTime: res.finalTime, rank: res.rank };
        solve(input);
      } catch (err) {
        taunt(err.status === 429 ? TOO_MANY_ATTEMPTS : SERVER_DOWN);
      }
      return;
    }

    if (await checkAnswer(stage, input)) solve(input);
    else onWrong();
  });

  hintBtn.addEventListener('click', async () => {
    const next = p.hints[p.stage] ?? 0;
    if (next >= stage.hints.length) return;
    const ok = await confirmModal(screen, {
      title: GAME_UI.hintTitle(next + 1),
      body: GAME_UI.hintBody(HINT_PENALTY_MIN[next]),
      ok: GAME_UI.hintOk,
      cancel: GAME_UI.cancel,
    });
    if (!ok) return;
    const text = useHint(p);
    if (text) pushInfo(hintItem(text, next));
    renderHintButton();
    tick();
  });

  // ── ☰ 메뉴 ──
  const menuBtn = $('[data-menu]');
  const menuList = $('[data-menu-list]');
  const setMenu = (open) => {
    menuList.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setMenu(menuList.hidden));
  const onDocClick = (e) => {
    if (!e.target.closest('.hud-menu')) setMenu(false);
  };
  document.addEventListener('click', onDocClick);
  $('[data-reset]').addEventListener('click', async () => {
    setMenu(false);
    const ok = await confirmModal(screen, {
      title: GAME_UI.resetTitle,
      body: GAME_UI.resetBody,
      ok: GAME_UI.resetOk,
      cancel: GAME_UI.cancel,
      danger: true,
    });
    if (!ok) return;
    resetProgress();
    go('start');
  });

  renderHintButton();
  if (!guideLines.length || wasGuideSeen(p)) {
    showGuideInfo();
    focusAnswer();
  } else {
    dialogue.play(guideLines).then(() => {
      if (solved) return;
      markGuideSeen(p);
      showGuideInfo();
      focusAnswer();
    });
  }

  return () => {
    clearInterval(interval);
    clearTimeout(toastTimer);
    document.removeEventListener('click', onDocClick);
    dialogue.destroy();
    stageCleanup?.();
  };
}
