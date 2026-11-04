// 정답 해시 규칙: SHA-256(SALT + normalize(정답))
// 짧은 정답의 해시를 검색해서 원문을 찾는 걸 막으려고 SALT 를 붙인다.
// 브라우저와 Node(scripts/hash.mjs) 양쪽에서 같은 코드를 쓴다.

export const SALT = 'f12escape:';

/** 앞뒤 공백 제거 + 소문자. 정답 비교와 조각 저장에 같은 규칙을 쓴다. */
export function normalize(input) {
  return String(input).trim().toLowerCase();
}

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hashAnswer(input) {
  return sha256Hex(SALT + normalize(input));
}
