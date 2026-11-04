// API 공통 헬퍼. _ 로 시작하는 폴더는 Vercel 에서 라우트로 올라가지 않는다.

/** 허용하지 않는 메서드면 405 를 보내고 false 를 돌려준다. */
export function allowMethod(req, res, method) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === method) return true;
  res.setHeader('Allow', method);
  res.status(405).json({ error: 'method_not_allowed' });
  return false;
}

export function badRequest(res, error) {
  return res.status(400).json({ error });
}
