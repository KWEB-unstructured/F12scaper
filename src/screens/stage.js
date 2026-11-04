// 담당: 정씨(화면 구성·디자인) · 형씨(진행 규칙은 core/game.js)
// 단계 화면: 안내자 대사, 퍼즐 영역, 정답 입력창, 힌트 버튼, 타이머, 서버 복구율
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
import { DEFAULT_TAUNTS, HINT_SUGGEST } from '../content/story.js';

export function renderStage(root, { go }) {
  const p = loadProgress();
  if (!p) return go('start');
  if (isFinished(p)) return go('clear');
  const stage = currentStage(p);

  root.innerHTML = `
    <section class="stage-screen">
      <header class="stage-header">
        <span class="stage-label" data-label></span>
        <span class="recovery">서버 복구율 <strong>${recoveryPercent(p)}%</strong></span>
        <span class="timer" data-timer></span>
      </header>
      <div class="guide" data-guide></div>
      <div class="puzzle" data-puzzle></div>
      <p class="taunt" data-taunt hidden></p>
      <ol class="hints" data-hints></ol>
      <footer class="stage-footer">
        <form class="terminal" data-form>
          <label for="answer">root@horangi:~$</label>
          <input id="answer" name="answer" autocomplete="off" spellcheck="false" />
        </form>
        <button type="button" data-hint>힌트</button>
        <button type="button" data-reset>처음부터 다시</button>
      </footer>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  // 대사·힌트에 <!-- --> 같은 문자열이 들어가므로 textContent 로만 넣는다.
  $('[data-label]').textContent = `STAGE ${stage.id} / ${TOTAL_STAGES} · ${stage.title}`;

  const say = (text) => $('[data-guide]').append(Object.assign(document.createElement('p'), { textContent: text }));
  const taunt = (text) => {
    const el = $('[data-taunt]');
    el.textContent = `유령 관리자: ${text}`;
    el.hidden = false;
  };
  const renderHints = () => {
    $('[data-hints]').replaceChildren(
      ...openedHints(p).map((text) => Object.assign(document.createElement('li'), { textContent: text })),
    );
    $('[data-hint]').disabled = (p.hints[p.stage] ?? 0) >= stage.hints.length;
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
    const count = recordWrong(p);
    const taunts = stage.taunts?.length ? stage.taunts : DEFAULT_TAUNTS;
    taunt(taunts[Math.floor(Math.random() * taunts.length)]);
    if (count === WRONG_BEFORE_HINT_SUGGEST && !p.hints[p.stage]) say(HINT_SUGGEST);
  };

  const stageCleanup = stage.mount($('[data-puzzle]'), {
    complete: solve,
    verify: (input) => checkAnswer(stage, input),
    say,
    taunt,
    fragments: Object.freeze({ ...p.fragments }),
  });

  const form = $('[data-form]');
  form.hidden = stage.input === false;
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
      } catch {
        taunt('서버가 응답하지 않는다... 잠시 후 다시 입력해 봐.');
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
