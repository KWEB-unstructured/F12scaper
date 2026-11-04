// /api 호출 래퍼. 요청·응답 형식은 docs/contracts.md 의 API 명세를 따른다.

async function request(path, options = {}) {
  const res = await fetch(`/api/${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.error ?? `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

/** @returns {Promise<{sessionId: string, startedAt: string}>} */
export function startSession(nickname) {
  return request('start', { method: 'POST', body: JSON.stringify({ nickname }) });
}

/**
 * @param {{sessionId: string, answer: string, hints: Record<number, number>, stageTimes: Record<number, number>}} payload
 * @returns {Promise<{ok: false} | {ok: true, finalTime: number, rank: number|null}>}
 */
export function verifyFinal(payload) {
  return request('verify', { method: 'POST', body: JSON.stringify(payload) });
}

/** @returns {Promise<{rankings: Array<{rank: number, nickname: string, finalTime: number, hintsUsed: number}>}>} */
export function getRanking() {
  return request('ranking');
}
