// 담당: 정씨(화면) · 형씨(문구) · 인트로·스토리 (상황 설명, 닉네임 입력, F12 여는 법)
import { INTRO_LINES, F12_GUIDE } from '../content/story.js';
import { startSession } from '../core/api.js';
import { createProgress } from '../core/state.js';

export function renderIntro(root, { go }) {
  root.innerHTML = `
    <section class="screen intro-screen">
      <div class="story" data-story></div>
      <p class="muted" data-f12></p>
      <form data-form>
        <label for="nickname">닉네임</label>
        <input id="nickname" name="nickname" maxlength="16" autocomplete="off" required />
        <button type="submit" class="primary">출근하기</button>
      </form>
      <p class="error" data-error hidden></p>
    </section>`;

  const story = root.querySelector('[data-story]');
  for (const line of INTRO_LINES) story.append(Object.assign(document.createElement('p'), { textContent: line }));
  root.querySelector('[data-f12]').textContent = `개발자 도구 여는 법 — ${F12_GUIDE}`;

  const form = root.querySelector('[data-form]');
  const error = root.querySelector('[data-error]');
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
}
