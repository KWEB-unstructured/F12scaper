// 담당: 김씨 · POST /api/start — 세션을 만들고 서버 시각으로 시작 시각을 기록한다.
// 요청: { nickname }  응답 201: { sessionId, startedAt }  400: { error: 'invalid_nickname' }
import { randomUUID } from 'node:crypto';
import { allowMethod, badRequest } from './_lib/http.js';
import { hasDb } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  const nickname = String(req.body?.nickname ?? '').trim();
  if (nickname.length < 1 || nickname.length > 16) return badRequest(res, 'invalid_nickname');
  // TODO(김씨): 비속어 닉네임 필터 → badRequest(res, 'invalid_nickname')

  if (!hasDb()) {
    return res.status(201).json({ sessionId: randomUUID(), startedAt: new Date().toISOString(), mock: true });
  }

  // TODO(김씨): sessions 에 insert (started_at 은 DB 기본값 now()) 후 id, started_at 반환
  return res.status(501).json({ error: 'not_implemented' });
}
