// 담당: 정씨(화면 구성·디자인) · 형씨(진행 규칙은 core/game.js)
// 단계 화면: 화면 전체를 쓰는 "갇힌 사이트" 게임 화면
//
//   .game
//     .hud          상단: 구간·단계 이름 · 진행 점 · 탈출 진행률 · 기록 · ☰ 메뉴(처음부터 다시)
//     .site         가운데: 가짜 브라우저 창 (주소창 + 정보 표시줄 + 퍼즐)
//       .infobar    주인공 독백(시작 대사·힌트)이 뜨는 곳. 이미 받은 힌트는 ‹ › 로 다시 본다
//       .puzzle     퍼즐이 mount 되는 곳. 단계 파일들이 .puzzle[data-puzzle] 을 전제로 하므로 바꾸지 않는다
//     .game-bar     아래: 정답 입력(터미널) + 힌트 보기
//     .dlg          단계를 처음 시작할 때 시작 대사를 대사창으로 (ui/dialogue.js)
//     .game-toast   크롤러 경고 (입력창 위에서 떠올랐다 사라짐) + 화면 가장자리 붉게
//     (8단계)       입력창 없음. 콘솔 fetch('/system/terminate') 를 감싸 결과를 받는다 (screens/terminate-fetch.js)
//     .il           이야기 장면 (ui/interlude.js). 단계 통과 뒤 'after-N', 4단계 반전 'reveal' 등을 화면 전체에 덮어 튼다
//
// 화자 이름·진행률 라벨·문구는 content/ 데이터 파일에서 읽는다. 대사·힌트는 textContent 로만 넣는다.
import {
  currentStage,
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
import { loadProgress, resetProgress, saveProgress, getVerifyPayload } from '../core/state.js';
import { verifyFinal } from '../core/api.js';
import { formatDuration } from '../core/format.js';
import { DEFAULT_TAUNTS, HINT_SUGGEST, PROMPT, SERVER_DOWN, TOO_MANY_ATTEMPTS, TERMINATE_REJECTED, GAME_UI, STAGE_CLEAR, stageUrl } from '../content/story.js';
import { speakerName, DEFAULT_SPEAKER, PROGRESS_LABEL, wrongAlertTitle } from '../content/characters.js';
import { createDialogue } from '../ui/dialogue.js';
import { playInterlude } from '../ui/interlude.js';
import { INTERLUDES, afterStage } from '../content/interludes.js';
import { confirmModal } from '../ui/modal.js';
import { isRevealed, clearScenes, loadScenes, beginScene, endScene, markRevealed } from './scenes-state.js';
import { installTerminateFetch } from './terminate-fetch.js';

/** 모을 수 있는 인증 키 조각 수 (1~7단계에서 하나씩, 8단계는 조합) */
const TOTAL_PIECES = TOTAL_STAGES - 1;
/** 지금까지 모은 조각 수. 현재 단계 앞의 단계를 모두 풀었으므로 stage - 1 */
const piecesOf = (stageNo) => Math.min(Math.max(stageNo - 1, 0), TOTAL_PIECES);
/** 조각 칸 n 개 중 got 개 채운 표시 요소들 */
const pipsHtml = (got, extraClass = '') =>
  Array.from({ length: TOTAL_PIECES }, (_, i) => `<i class="${i < got ? 'on' : ''} ${extraClass}"></i>`).join('');

/** 기획서의 구간 이름 (튜토리얼 1~3 · 본게임 4~6 · 보스 7 · 최종 8) */
function sectionOf(id) {
  if (id <= 3) return '튜토리얼';
  if (id <= 6) return '본게임';
  if (id === 7) return '보스';
  return '최종';
}

/** 대사 한 줄 → { speaker, text }. 문자열이면 기본 화자(주인공 독백) */
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
  const pieces = piecesOf(p.stage);
  // 개발자·크롤러의 진짜 이름은 4단계 반전 장면을 본 뒤에 보여 준다
  const nameOf = (key) => speakerName(key, isRevealed(p));

  root.innerHTML = `
    <section class="game">
      <header class="hud">
        <div class="hud-stage">
          <span class="hud-kicker" data-kicker></span>
          <h1 class="hud-title" data-title></h1>
        </div>
        <ol class="steps" data-steps aria-hidden="true"></ol>
        <span class="pieces"><span data-progress-label></span>
          <span class="pips" aria-hidden="true">${pipsHtml(pieces)}</span>
          <strong>${pieces}/${TOTAL_PIECES}</strong></span>
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
      <div class="clear-fx" data-clear role="status" hidden>
        <p class="clear-title" data-clear-title></p>
        <div class="clear-progress">
          <span data-clear-label></span>
          <span class="pips clear-pips" data-clear-pips aria-hidden="true"></span>
          <strong data-clear-count></strong>
        </div>
      </div>
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

  // ── 정보 표시줄: 주인공 독백(시작 대사·힌트)이 짧게 뜨는 곳. 메시지가 여러 개면 ‹ › 로 넘겨 본다 ──
  /** @type {{ speaker: string, label?: string, lines: string[] }[]} */
  const infoItems = [];
  let infoIndex = 0;
  const infobar = $('[data-infobar]');

  function renderInfo() {
    const item = infoItems[infoIndex];
    if (!item) return;
    infobar.dataset.speaker = item.speaker;
    $('[data-info-who]').textContent = item.label ?? nameOf(item.speaker);
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

  // ── 크롤러 경고: 입력창 위에서 떠올랐다 사라지는 알림 + 화면 가장자리 붉게 ──
  // 4단계 반전 전에는 "알 수 없는 프로세스", 반전 뒤에는 "크롤러"
  let toastTimer = 0;
  const taunt = (text, count) => {
    const el = $('[data-taunt]');
    el.dataset.speaker = 'crawler';
    el.replaceChildren(make('span', { className: 'who', textContent: nameOf('crawler') }));
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

  // ── 힌트: 주인공이 스스로 떠올리는 생각으로 보여 준다 ──
  const hintBtn = $('[data-hint]');
  const hintItem = (text, i) => ({ speaker: 'narration', label: `힌트 ${i + 1}/${stage.hints.length}`, lines: [text] });
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
  const dialogue = createDialogue(screen, { nameOf });
  const focusAnswer = () => {
    if (!form.hidden) form.answer.focus();
  };

  // ── 타이머: 서버 시작 시각 기준 + 힌트 패널티 ──
  const tick = () => {
    $('[data-timer]').textContent = formatDuration(Date.now() - Date.parse(p.startedAt) + penaltyMs(p));
  };
  tick();
  const interval = setInterval(tick, 1000);

  // ── 이야기 장면 (2026-11-24 결정 3) ──
  // 장면은 줄을 세워 하나씩 튼다. 본 장면(건너뛴 장면 포함)은 다시 틀지 않고,
  // 보던 중 새로고침하면 scenes-state 의 남은 장면(pending)을 단계 화면을 그릴 때 처음부터 다시 튼다.
  // 장면을 보는 시간도 기록에 들어간다 (서버는 시작 시각 기준). 다만 단계별 시간에는 넣지 않으려고,
  // 단계 통과 뒤 장면이 끝나면 다음 단계에 들어온 시각을 장면이 끝난 시각으로 다시 잡는다.
  let destroyed = false;
  let sceneChain = Promise.resolve();
  /** @type {ReturnType<typeof playInterlude> | null} */
  let activeScene = null;
  /** @param {string} id content/interludes.js 의 장면 id. 끝나면(또는 틀 장면이 없으면) 풀리는 Promise */
  const playScene = (id) => {
    sceneChain = sceneChain.then(async () => {
      const beats = INTERLUDES[id];
      if (destroyed || !beats?.length || loadScenes().seen.includes(id)) return;
      beginScene(id);
      activeScene = playInterlude(screen, beats, { nameOf, onReveal: markRevealed });
      await activeScene.done;
      activeScene = null;
      if (destroyed) return;
      endScene(id);
      if (id === 'reveal') markRevealed();
      if (id.startsWith('after-')) {
        p.stageEnteredAt = Date.now();
        saveProgress(p);
      }
    });
    return sceneChain;
  };
  // 지난번에 보다 만 장면부터
  loadScenes().pending.forEach(playScene);

  // ── 단계 통과: 저장은 바로 하고, 연출(약 1.8초)이 끝나면 다음 단계로 ──
  // 화면 네 변 초록빛 → 가운데 ACCESS GRANTED 두 번 깜박 → 인증 키 조각 칸이 하나 채워짐.
  // 클릭·Enter·Space·Esc 로 넘길 수 있다. 입력창으로 맞히든 콘솔 unlock() 으로 통과하든 같은 연출.
  let solved = false;
  let clearTimers = [];
  let removeClearKeys = null;
  const CLEAR_MS = 1800;
  const PIECE_AT_MS = 800;

  const playClear = (from, to, final) =>
    new Promise((resolve) => {
      form.classList.add('granted');
      form.answer.disabled = true;
      hintBtn.disabled = true;
      $('[data-taunt]').hidden = true;

      const fx = $('[data-clear]');
      $('[data-clear-title]').textContent = final ? STAGE_CLEAR.finalTitle : STAGE_CLEAR.title;
      $('[data-clear-label]').textContent = PROGRESS_LABEL;
      const pips = $('[data-clear-pips]');
      const count = $('[data-clear-count]');
      pips.innerHTML = pipsHtml(from);
      count.textContent = `${from}/${TOTAL_PIECES}`;
      fx.hidden = false;
      $('[data-edge]').classList.remove('is-on');
      $('[data-edge]').classList.add('is-grant');

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimers.forEach(clearTimeout);
        removeClearKeys?.();
        resolve();
      };
      // 새로 얻은 조각 칸을 채운다 (8단계는 이미 7/7 이라 그대로)
      clearTimers.push(
        setTimeout(() => {
          pips.querySelectorAll('i').forEach((pip, i) => {
            if (i >= from && i < to) pip.classList.add('on', 'new');
          });
          count.textContent = `${to}/${TOTAL_PIECES}`;
        }, PIECE_AT_MS),
      );
      clearTimers.push(setTimeout(finish, CLEAR_MS));

      // 넘기기: 정답을 낸 Enter 가 바로 넘기지 않도록 잠깐 뒤부터 받는다
      clearTimers.push(
        setTimeout(() => {
          const onKey = (e) => {
            if (!e.repeat && ['Enter', ' ', 'Escape'].includes(e.key)) finish();
          };
          fx.addEventListener('click', finish);
          document.addEventListener('keydown', onKey);
          removeClearKeys = () => {
            fx.removeEventListener('click', finish);
            document.removeEventListener('keydown', onKey);
          };
        }, 250),
      );
    });

  const solve = (fragment) => {
    if (solved) return;
    solved = true;
    const from = piecesOf(p.stage);
    completeStage(p, fragment);
    const final = isFinished(p);
    // 통과 연출 → 이 단계 뒤 이야기 장면(있으면) → 다음 단계
    playClear(from, piecesOf(p.stage), final)
      .then(() => playScene(afterStage(stage.id)))
      .then(() => {
        if (!destroyed) go('stage');
      });
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
    playScene,
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

  // ── 8단계: 콘솔에서 보내는 종료 요청을 감싼다 (2026-11-24 결정 1) ──
  // 플레이어는 key 만 보내고, 기록용 정보는 여기서 덧붙인다. 결과는 플레이어 콘솔과 별개로 화면이 받아서 처리한다.
  let restoreFetch = null;
  if (stage.verify === 'terminate') {
    restoreFetch = installTerminateFetch({
      extra: () => {
        // 기록용 필드만 골라 넘긴다. 나머지(...rest)를 넘기면 getVerifyPayload 의 정답 필드 이름이 answer → key 로
        // 바뀌었을 때 빈 key 가 플레이어의 key 를 덮어써서 항상 오답이 된다
        const { sessionId, hints, stageTimes } = getVerifyPayload(p, '');
        return { sessionId, hints, stageTimes };
      },
      onResult: ({ status, data }) => {
        if (solved || destroyed) return;
        if (status === 200 && data?.ok) {
          // 결과를 넣은 뒤 completeStage 가 저장한다. 최종 키는 저장하지 않는다
          p.result = { finalTime: data.finalTime, rank: data.rank ?? null };
          solve('');
        } else if (status === 200) onWrong();
        else if (status === 429) taunt(TOO_MANY_ATTEMPTS);
        else if (status === 400) say(TERMINATE_REJECTED);
        else taunt(SERVER_DOWN);
      },
    });
  }

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
    clearScenes();
    go('start');
  });

  renderHintButton();
  // 시작 대사는 이어 트는 장면·퍼즐이 튼 장면(4단계 반전 등)이 끝난 뒤에
  sceneChain.then(() => {
    if (destroyed || solved) return;
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
  });

  return () => {
    destroyed = true;
    activeScene?.destroy();
    clearInterval(interval);
    clearTimeout(toastTimer);
    clearTimers.forEach(clearTimeout);
    removeClearKeys?.();
    document.removeEventListener('click', onDocClick);
    dialogue.destroy();
    restoreFetch?.();
    stageCleanup?.();
  };
}
