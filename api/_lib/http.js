// API 공통 헬퍼. _ 로 시작하는 폴더는 Vercel 에서 라우트로 올라가지 않는다.

/** 허용하지 않는 메서드면 405 를 보내고 false 를 돌려준다. */
export function allowMethod(req, res, method) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === method) return true;
  res.setHeader('Allow', method);
  res.status(405).json({ error: 'method_not_allowed' });
  return false;
}

/** 400 응답. message 를 주면 { error, message } (이야기 문구를 같이 보낼 때) */
export function badRequest(res, error, message) {
  return res.status(400).json(message ? { error, message } : { error });
}

/**
 * 요청 본문을 객체로 읽는다. 못 읽으면 null.
 * Vercel 은 Content-Type 에 따라 req.body 를 다르게 준다: application/json → 객체, text/plain → 문자열.
 * 콘솔에서 fetch(url, { method: 'POST', body: JSON.stringify(...) }) 만 쓰면 헤더가 없어 text/plain 으로 오므로
 * 문자열도 JSON 으로 풀어 본다.
 */
export function readJsonBody(req) {
  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body !== null && typeof body === 'object' && !Array.isArray(body) ? body : null;
}
