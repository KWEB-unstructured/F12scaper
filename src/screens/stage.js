// 담당: 정씨(화면 구성·디자인) · 형씨(진행 규칙은 core/game.js)
// 단계 화면: 안내자(브라우저) 대사, 퍼즐 영역, 정답 입력창, 힌트 버튼, 타이머, 진행률
// 화자 이름·진행률 라벨·프롬프트는 content/ 데이터 파일에서 읽는다 (스토리가 바뀌어도 이 파일은 그대로)
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
import { DEFAULT_TAUNTS, HINT_SUGGEST, PROMPT, SERVER_DOWN, TOO_MANY_ATTEMPTS } from '../content/story.js';
import { SPEAKERS, DEFAULT_SPEAKER, PROGRESS_LABEL, wrongAlertTitle } from '../content/characters.js';

/** 기획서의 구간 이름 (튜토리얼 1~3 · 본게임 4~6 · 보스 7 · 최종 8) */
function sectionOf(id) {
  if (id <= 3) return '튜토리얼';
  if (id <= 6) return '본게임';
  if (id === 7) return '보스';
  return '최종';
}

export function renderStage(root, { go }) {
  const p = loadProgress();
  if (!p) return go('start');
  if (isFinished(p)) return go('clear');
  const stage = currentStage(p);

  // 화면 순서: 헤더(단계·진행·진행률·기록) → 브라우저 말풍선 → 조사 대상(퍼즐) → 정답 입력 → 보안 경고 → 힌트·도구
  // 퍼즐은 반드시 .puzzle[data-puzzle] 안에 mount 된다 (단계 파일들이 이 구조를 전제로 한다).
  const percent = recoveryPercent(p);
  root.innerHTML = `
    <section class="stage-screen">
      <header class="stage-header">
        <div class="stage-head-main">
          <p class="stage-kicker" data-kicker></p>
          <h1 class="stage-title" data-title></h1>
        </div>
        <div class="stage-stats">
          <ol class="steps" data-steps aria-hidden="true"></ol>
          <span class="recovery"><span data-progress-label></span>
            <span class="meter" aria-hidden="true"><span style="width: ${percent}%"></span></span>
            <strong>${percent}%</strong></span>
          <span class="clock" title="실제 경과 시간 + 힌트 감점">기록 <span class="timer" data-timer></span></span>
        </div>
      </header>

      <div class="guide" data-guide></div>

      <figure class="puzzle-frame">
        <figcaption class="puzzle-bar"><span class="tag">조사 대상</span><span>F12 를 열고 단서를 찾으세요</span></figcaption>
        <div class="puzzle" data-puzzle></div>
      </figure>

      <form class="terminal" data-form>
        <label for="answer" data-prompt></label>
        <input id="answer" name="answer" autocomplete="off" spellcheck="false" placeholder="찾은 정답을 입력하고 Enter" />
        <button type="submit" class="run">정답 확인</button>
      </form>

      <div class="taunt" data-taunt role="status" hidden></div>

      <div class="stage-tools">
        <button type="button" data-hint>힌트 <span data-hint-count></span></button>
        <span class="hint-cost" data-hint-cost></span>
        <button type="button" class="link" data-reset>처음부터 다시</button>
      </div>
      <div class="hints" data-hints></div>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const make = (tag, props) => Object.assign(document.createElement(tag), props);

  // 대사·힌트에 <!-- --> 같은 문자열이 들어가므로 textContent 로만 넣는다.
  $('[data-kicker]').textContent = `${sectionOf(stage.id)} · STAGE ${stage.id} / ${TOTAL_STAGES}`;
  $('[data-title]').textContent = stage.title;
  $('[data-progress-label]').textContent = PROGRESS_LABEL;
  $('[data-prompt]').textContent = PROMPT;
  $('[data-steps]').append(
    ...Array.from({ length: TOTAL_STAGES }, (_, i) =>
      make('li', { className: i + 1 < p.stage ? 'done' : i + 1 === p.stage ? 'now' : '' }),
    ),
  );

  /** 말풍선 하나. speaker 는 content/characters.js 의 SpeakerKey */
  const bubbleOf = (speaker, label) => {
    const el = make('div', { className: 'say' });
    el.dataset.speaker = speaker;
    el.append(make('span', { className: 'who', textContent: label ?? SPEAKERS[speaker]?.name ?? '' }));
    return el;
  };

  /**
   * 대사 한 줄. 문자열이면 기본 화자(브라우저), { speaker, text } 면 그 화자.
   * 같은 화자가 이어 말하면 같은 말풍선에 붙인다.
   */
  let lastSpeaker = null;
  let bubble = null;
  const say = (line) => {
    const { speaker = DEFAULT_SPEAKER, text } = typeof line === 'string' ? { text: line } : line;
    if (!bubble || speaker !== lastSpeaker) {
      bubble = bubbleOf(speaker);
      $('[data-guide]').append(bubble);
    }
    bubble.append(make('p', { textContent: text }));
    lastSpeaker = speaker;
  };

  /** 보안 시스템 경고. count 가 있으면 "비인가 접근 감지 (n회)" 제목을 붙인다 */
  const taunt = (text, count) => {
    const el = $('[data-taunt]');
    el.dataset.speaker = 'security';
    el.replaceChildren(make('span', { className: 'who', textContent: SPEAKERS.security.name }));
    if (count) el.append(make('p', { className: 'alert-title', textContent: wrongAlertTitle(count) }));
    el.append(make('p', { textContent: text }));
    el.hidden = false;
  };
  const renderHints = () => {
    const used = p.hints[p.stage] ?? 0;
    const total = stage.hints.length;
    // 힌트는 브라우저가 말한다
    $('[data-hints]').replaceChildren(
      ...openedHints(p).map((text, i) => {
        const el = bubbleOf('browser', `${SPEAKERS.browser.name} · 힌트 ${i + 1}`);
        el.append(make('p', { textContent: text }));
        return el;
      }),
    );
    $('[data-hint-count]').textContent = `${used}/${total}`;
    $('[data-hint]').disabled = used >= total;
    $('[data-hint-cost]').textContent = used >= total ? '힌트를 모두 열었어요' : `다음 힌트를 열면 기록 +${HINT_PENALTY_MIN[used]}분`;
  };
  stage.guide.forEach(say);
  renderHints();

  // 타이머: 서버 시작 시각 기준 + 힌트 패널티
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

  const onWrong = () => {
    // 입력칸을 잠깐 흔들어 오답을 알린다
    form.classList.remove('wrong');
    void form.offsetWidth; // 연속 오답에도 애니메이션이 다시 돌도록 리플로우
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

  const form = $('[data-form]');
  form.hidden = stage.input === false;
  form.addEventListener('animationend', () => form.classList.remove('wrong'));
  form.answer.addEventListener('input', () => form.classList.remove('wrong')); // 애니메이션 꺼진 환경 대비
  if (!form.hidden) form.answer.focus();
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

  $('[data-hint]').addEventListener('click', () => {
    const next = p.hints[p.stage] ?? 0;
    if (!confirm(`힌트 ${next + 1}을 열면 기록에 ${HINT_PENALTY_MIN[next]}분이 더해집니다. 열까요?`)) return;
    useHint(p);
    renderHints();
    tick();
  });

  $('[data-reset]').addEventListener('click', () => {
    if (!confirm('진행 상황을 모두 지우고 처음부터 다시 시작할까요?')) return;
    resetProgress();
    go('start');
  });

  return () => {
    clearInterval(interval);
    stageCleanup?.();
  };
}
