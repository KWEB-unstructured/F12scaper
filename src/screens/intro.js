// 담당: 정씨(화면) · 형씨(문구는 content/story.js 의 LOGIN)
// 닉네임 입력 화면. "도서관 PC 로그인"으로 연출하고, 받은 이름을 들고 프롤로그로 간다.
// /api/start 는 여기서 부르지 않는다. 프롤로그가 끝날 때 불러서 프롤로그 시간이 기록에 들어가지 않게 한다.
// (F12 여는 법 안내는 없앴다. 플레이어가 프롤로그 안에서 스스로 F12 를 누르게 만드는 게 목표)
import { LOGIN } from '../content/story.js';
import { savePrologue } from './prologue-state.js';

export function renderIntro(root, { go }) {
  root.innerHTML = `
    <section class="screen intro-screen">
      <div class="screen-bar"><span data-bar></span></div>
      <h1 data-title></h1>
      <p class="muted" data-desc></p>
      <form class="nick-form" data-form>
        <label for="nickname" data-label></label>
        <input id="nickname" name="nickname" maxlength="16" autocomplete="off" required />
        <button type="submit" class="primary" data-submit></button>
      </form>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  $('[data-bar]').textContent = LOGIN.bar;
  $('[data-title]').textContent = LOGIN.title;
  $('[data-desc]').textContent = LOGIN.desc;
  $('[data-label]').textContent = LOGIN.label;
  $('[data-submit]').textContent = LOGIN.submit;

  const form = $('[data-form]');
  form.nickname.focus();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = form.nickname.value.trim();
    if (!nickname) return;
    // 비속어 등 서버 검사는 프롤로그 끝의 /api/start 에서 한다 (거절되면 그 자리에서 다시 받는다)
    savePrologue({ scene: 'library', nickname, printed: [] });
    go('prologue');
  });
}
