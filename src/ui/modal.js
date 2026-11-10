// 담당: 정씨 · 게임 안 확인 창 (브라우저 기본 confirm() 대신)
// 문구는 '<' 가 들어갈 수 있으므로 textContent 로만 넣는다.

/**
 * 확인 창을 띄우고 고른 결과를 돌려준다. Esc·바깥 클릭은 취소.
 * @param {HTMLElement} container 확인 창을 붙일 곳 (화면을 떠나면 같이 사라진다)
 * @param {{ title: string, body?: string, ok: string, cancel: string, danger?: boolean }} opts
 * @returns {Promise<boolean>}
 */
export function confirmModal(container, { title, body = '', ok, cancel, danger = false }) {
  return new Promise((resolve) => {
    const prevFocus = document.activeElement;
    const el = document.createElement('div');
    el.className = 'modal';
    el.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title" data-title></h2>
        <p data-body></p>
        <div class="modal-actions">
          <button type="button" data-cancel></button>
          <button type="button" class="primary" data-ok></button>
        </div>
      </div>`;
    el.querySelector('[data-title]').textContent = title;
    el.querySelector('[data-body]').textContent = body;
    const okBtn = el.querySelector('[data-ok]');
    const cancelBtn = el.querySelector('[data-cancel]');
    okBtn.textContent = ok;
    cancelBtn.textContent = cancel;
    if (danger) okBtn.classList.add('danger');
    container.append(el);
    okBtn.focus();

    const close = (value) => {
      document.removeEventListener('keydown', onKey, true);
      el.remove();
      if (prevFocus instanceof HTMLElement && prevFocus.isConnected) prevFocus.focus();
      resolve(value);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
      } else if (e.key === 'Tab') {
        // 버튼 두 개 사이에서만 포커스가 돈다
        e.preventDefault();
        (document.activeElement === okBtn ? cancelBtn : okBtn).focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    okBtn.addEventListener('click', () => close(true));
    cancelBtn.addEventListener('click', () => close(false));
    el.addEventListener('click', (e) => {
      if (e.target === el) close(false);
    });
  });
}
