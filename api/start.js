// 담당: 김씨 · POST /api/start — 세션을 만들고 서버 시각으로 시작 시각을 기록한다.
// 요청: { nickname }  응답 201: { sessionId, startedAt }  400: { error: 'invalid_nickname' }
import { randomUUID } from 'node:crypto';
import { allowMethod, badRequest } from './_lib/http.js';
import { hasDb, db } from './_lib/supabase.js';
import { hasProfanity, hasInvisibleChar } from './_lib/profanity.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  const nickname = String(req.body?.nickname ?? '').trim();
  if (nickname.length < 1 || nickname.length > 16 || hasProfanity(nickname) || hasInvisibleChar(nickname)) return badRequest(res, 'invalid_nickname');

  if (!hasDb()) {
    return res.status(201).json({ sessionId: randomUUID(), startedAt: new Date().toISOString(), mock: true });
  }

  const { data, error } = await db()
    .from('sessions')
    .insert({nickname})
    .select('id, started_at')
    .single();

  if (error) {
    console.error(`[api/start]`, error);
    return res.status(500).json({ error: 'db_error'});
  }

  return res.status(201).json({ sessionId: data.id, startedAt: data.started_at });
}
