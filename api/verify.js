// 담당: 김씨 · POST /api/verify — 최종 정답을 검증하고 기록을 계산한다.
// 요청: { sessionId, answer, hints: {단계: 사용 수}, stageTimes: {단계: ms} }
// 응답 200: { ok: false } | { ok: true, finalTime, rank }
import { allowMethod, badRequest } from './_lib/http.js';
import { hasDb } from './_lib/supabase.js';
import { normalize } from '../src/core/hash.js';
import { penaltyMsFromHints } from '../src/core/rules.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  const { sessionId, answer, hints = {}, stageTimes = {} } = req.body ?? {};
  if (typeof sessionId !== 'string' || typeof answer !== 'string') return badRequest(res, 'invalid_body');

  const finalAnswer = process.env.FINAL_ANSWER || (process.env.VERCEL_ENV === 'production' ? null : 'test8');
  if (!finalAnswer) return res.status(500).json({ error: 'final_answer_not_configured' });
  if (normalize(answer) !== normalize(finalAnswer)) return res.status(200).json({ ok: false });

  if (!hasDb()) {
    // 개발용: 클라이언트가 보낸 단계 시간 합으로 대신 계산한다.
    const elapsed = Object.values(stageTimes).reduce((sum, ms) => sum + (Number(ms) || 0), 0);
    return res.status(200).json({ ok: true, finalTime: elapsed + penaltyMsFromHints(hints), rank: null, mock: true });
  }

  // TODO(김씨):
  // 1. sessions 에서 sessionId 조회 (없거나 이미 finished 면 400)
  // 2. finalTime = (지금 - started_at) + penaltyMsFromHints(hints)   ← 시작 시각은 반드시 DB 값 기준
  // 3. sessions 업데이트 (finished_at, hints_used, stage_times)
  // 4. 비현실적으로 짧은 기록이면 rankings 에 넣지 않고 rank: null
  // 5. rankings insert 후 순위 계산
  return res.status(501).json({ error: 'not_implemented' });
}
