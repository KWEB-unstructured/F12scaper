// 담당: 정씨 · 8단계 콘솔 fetch 감싸기 (2026-11-24 결정 1)
// 8단계에는 정답 입력창이 없다. 플레이어가 Console 에 직접
//   fetch('/system/terminate', { method: 'POST', body: JSON.stringify({ key: '조합한 키' }) })
// 를 보내면, 이 감싸기가 본문에 기록용 정보(sessionId·hints·stageTimes)를 덧붙여 같은 주소로 보낸다.
// - 경로가 /system/terminate(또는 같은 처리인 /api/verify)인 POST 만 손댄다. 상대·절대 주소, URL·Request 객체 모두
// - 본문이 JSON 객체 문자열일 때만 덧붙인다. JSON.stringify 를 빠뜨린 요청은 그대로 보내서
//   서버가 400 + 안내 문구(message)를 돌려주게 한다
// - 결과는 응답 복제본으로 확인하고, 플레이어의 fetch 에는 원래 응답을 그대로 돌려준다
// 화면(screens/stage.js)이 8단계에 들어가면 설치하고, 떠날 때 돌려놓는다.

const PATHS = ['/system/terminate', '/api/verify'];

/**
 * @typedef {Object} TerminateResult
 * @property {number} status   HTTP 상태 코드 (네트워크 오류면 0)
 * @property {any} data        응답 JSON (못 읽으면 null)
 */

/**
 * @param {RequestInfo | URL} input
 * @param {RequestInit} [init]
 * @returns {boolean} 손댈 요청인지
 */
function isTerminateRequest(input, init) {
  let url;
  try {
    url = new URL(input instanceof Request ? input.url : String(input), location.href);
  } catch {
    return false;
  }
  if (url.origin !== location.origin || !PATHS.includes(url.pathname.replace(/\/+$/, ''))) return false;
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
  return method.toUpperCase() === 'POST';
}

/**
 * 본문 문자열에 extra 를 덧붙인다. JSON 객체가 아니면 null (그대로 보낸다)
 * @param {unknown} body
 * @param {Record<string, unknown>} extra
 */
function withExtra(body, extra) {
  if (typeof body !== 'string') return null;
  try {
    const parsed = JSON.parse(body);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    // 기록용 필드는 화면 값이 우선 (플레이어가 같은 이름을 넣어도 덮는다). key 는 플레이어 값 그대로
    return JSON.stringify({ ...parsed, ...extra });
  } catch {
    return null;
  }
}

/**
 * window.fetch 를 감싼다.
 * @param {{
 *   extra: () => Record<string, unknown>,
 *   onResult: (result: TerminateResult) => void,
 * }} opts extra: 보낼 때마다 덧붙일 필드를 만든다 · onResult: 응답(또는 네트워크 오류)을 받았을 때
 * @returns {() => void} 원래 fetch 로 돌려놓는 함수
 */
export function installTerminateFetch({ extra, onResult }) {
  const original = window.fetch;

  /** @type {typeof fetch} */
  async function fetch(input, init) {
    if (!isTerminateRequest(input, init)) return original.call(window, input, init);

    // Request 객체로 보냈으면 주소·헤더·본문을 꺼내서 다시 만든다
    let url = input;
    let opts = init ?? {};
    if (input instanceof Request) {
      url = input.url;
      opts = { method: input.method, headers: input.headers, body: await input.clone().text(), ...init };
    }
    const body = withExtra(opts.body, extra());
    if (body !== null) opts = { ...opts, body };

    let res;
    try {
      res = await original.call(window, url, opts);
    } catch (err) {
      onResult({ status: 0, data: null });
      throw err;
    }
    res
      .clone()
      .json()
      .catch(() => null)
      .then((data) => onResult({ status: res.status, data }));
    return res;
  }

  window.fetch = fetch;
  return () => {
    // 다른 코드가 그 사이에 또 감쌌으면 건드리지 않는다
    if (window.fetch === fetch) window.fetch = original;
  };
}
