// 담당: 정씨(화면) · 형씨(문구) · 인트로·스토리 (상황 설명, 닉네임 입력, F12 여는 법)
import { INTRO_LINES, F12_GUIDE } from '../content/story.js';
import { startSession } from '../core/api.js';
import { createProgress } from '../core/state.js';

/** 글자 하나가 찍히는 간격 (ms) */
const CHAR_MS = 35;
/** 한 줄이 끝나고 다음 줄까지 쉬는 시간 (ms) */
const LINE_PAUSE_MS = 500;

export function renderIntro(root, { go }) {
  root.innerHTML = `
    <section class="screen intro-screen">
      <div class="screen-bar">
        <span>srv-01 · /var/log/incident.log</span>
        <button type="button" class="link" data-skip>건너뛰기</button>
      </div>
      <div class="story" data-story></div>
      <div class="intro-next" data-next hidden>
        <p class="f12-guide"><strong>개발자 도구 여는 법</strong><br /><span data-f12></span></p>
        <form class="nick-form" data-form>
          <label for="nickname">닉네임</label>
          <input id="nickname" name="nickname" maxlength="16" autocomplete="off" required />
          <button type="submit" class="primary">출근하기</button>
        </form>
        <p class="error" data-error hidden></p>
      </div>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const story = $('[data-story]');
  const next = $('[data-next]');
  const skip = $('[data-skip]');
  $('[data-f12]').textContent = F12_GUIDE;

  // ── 대사를 한 줄씩 타자 치듯 보여 주기 ──
  // 화면 읽기 프로그램에는 한 글자씩이 아니라 줄 전체를 읽히도록 sr-only 사본을 둔다.
  const lines = INTRO_LINES.map((text) => {
    const p = document.createElement('p');
    p.className = 'story-line';
    p.hidden = true;
    const full = Object.assign(document.createElement('span'), { className: 'sr-only', textContent: text });
    const typed = document.createElement('span');
    typed.setAttribute('aria-hidden', 'true');
    p.append(full, typed);
    story.append(p);
    return { p, typed, chars: [...text] };
  });

  let timer = 0;
  let lineIdx = 0;
  let charIdx = 0;
  let finished = false;

  function step() {
    const line = lines[lineIdx];
    line.p.hidden = false;
    line.p.classList.add('typing');
    charIdx += 1;
    line.typed.textContent = line.chars.slice(0, charIdx).join('');
    if (charIdx < line.chars.length) {
      timer = setTimeout(step, CHAR_MS);
      return;
    }
    line.p.classList.remove('typing');
    lineIdx += 1;
    charIdx = 0;
    if (lineIdx < lines.length) timer = setTimeout(step, LINE_PAUSE_MS);
    else timer = setTimeout(finish, LINE_PAUSE_MS);
  }

  /** 남은 대사를 한꺼번에 보여 주고 닉네임 입력으로 넘어간다. */
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    for (const line of lines) {
      line.p.hidden = false;
      line.p.classList.remove('typing');
      line.typed.textContent = line.chars.join('');
    }
    skip.hidden = true;
    next.hidden = false;
    $('#nickname').focus();
  }

  skip.addEventListener('click', finish);
  story.addEventListener('click', finish);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || lines.length === 0) finish();
  else timer = setTimeout(step, 300);

  // ── 닉네임 입력 → /api/start → 진행 생성 (흐름 유지) ──
  const form = $('[data-form]');
  const error = $('[data-error]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    error.hidden = true;
    try {
      const nickname = form.nickname.value.trim();
      const { sessionId, startedAt } = await startSession(nickname);
      createProgress({ sessionId, nickname, startedAt });
      go('stage');
    } catch (err) {
      error.textContent = err.status === 400 ? '사용할 수 없는 닉네임입니다.' : '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.';
      error.hidden = false;
      button.disabled = false;
    }
  });

  return () => clearTimeout(timer);
}
