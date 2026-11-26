// 담당: 정씨 · 이야기 장면의 로그 재생 (content/interludes.js 의 log 조각)
// 터미널 같은 상자에 로그를 한 줄씩 찍는다. 클릭·Enter·Space 를 누르면 남은 줄을 한 번에 다 보여 준다.
// 로그 문구는 textContent 로만 넣는다.

const FIRST_MS = 400;
const LINE_MS = 700;

/**
 * @param {HTMLElement} parent 로그 상자를 붙일 곳 (장면 화면)
 * @param {{ title?: string, lines: import('../content/interludes.js').LogLine[] }} log
 * @returns {{ done: Promise<void>, cancel: () => void }} done: 모든 줄이 찍히면 끝난다
 */
export function playLog(parent, { title, lines }) {
  const box = document.createElement('div');
  box.className = 'il-log';
  box.innerHTML = `<p class="il-log-head" data-head></p><ol class="il-log-lines" data-lines></ol>`;
  box.querySelector('[data-head]').textContent = title ?? 'log';
  const list = box.querySelector('[data-lines]');
  parent.append(box);

  let index = 0;
  let timer = 0;
  let finished = false;
  /** @type {() => void} */
  let resolveDone;
  const done = new Promise((r) => (resolveDone = r));

  const show = (line) => {
    const li = document.createElement('li');
    if (line.speaker) li.dataset.speaker = line.speaker;
    if (line.at) li.append(Object.assign(document.createElement('time'), { textContent: line.at }));
    li.append(Object.assign(document.createElement('span'), { textContent: line.text }));
    list.append(li);
    list.scrollTop = list.scrollHeight;
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    box.removeEventListener('click', showAll);
    document.removeEventListener('keydown', onKey);
    box.classList.add('is-done');
    resolveDone();
  };

  const next = () => {
    if (index >= lines.length) return finish();
    const line = lines[index++];
    show(line);
    timer = setTimeout(next, line.delay ?? LINE_MS);
  };

  /** @param {Event} [e] */
  function showAll(e) {
    if (finished) return;
    // 이 클릭이 장면 막까지 올라가 바로 다음 대사를 넘기지 않게 막는다
    if (e?.type === 'click') e.stopPropagation();
    clearTimeout(timer);
    while (index < lines.length) show(lines[index++]);
    finish();
  }
  function onKey(e) {
    if (e.repeat || !['Enter', ' '].includes(e.key)) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, button, a')) return;
    e.preventDefault();
    showAll();
  }

  box.addEventListener('click', showAll);
  document.addEventListener('keydown', onKey);
  timer = setTimeout(next, FIRST_MS);

  return { done, cancel: finish };
}
