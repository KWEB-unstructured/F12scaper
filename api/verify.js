// 담당: 김씨 · POST /api/verify — 최종 정답을 검증하고 기록을 계산한다.
// 요청: { sessionId, answer, hints: {단계: 사용 수}, stageTimes: {단계: ms} }
// 응답 200: { ok: false } | { ok: true, finalTime, rank }
//      400: invalid_body | invalid_session   429: too_many_attempts   500: db_error | final_answer_not_configured
// 규칙(멱등, 오답 제한, 랭킹 제외)은 docs/contracts.md 3절. DB 쪽 처리는 supabase/migrations/002_finish_session.sql 의 함수 하나로 묶었다.
import { allowMethod, badRequest } from './_lib/http.js';
import { hasDb, db } from './_lib/supabase.js';
import { normalize } from '../src/core/hash.js';
import { penaltyMsFromHints, countHints, HINT_PENALTY_MIN } from '../src/core/rules.js';

const MAX_WRONG_ATTEMPTS = 50; // 세션당 오답 허용 횟수
const MIN_RANKED_MS = 60_000; // 이보다 빨리 깬 기록은 랭킹에서 뺀다 (4주차 테스트 후 조정)
const MAX_ANSWER_LENGTH = 200;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STAGE_KEY_RE = /^[1-8]$/;

/** { "1": 값, ... } 모양이고, 키는 단계 1~8, 값은 isValid 를 통과하는지 */
function isStageMap(value, isValid) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, v]) => STAGE_KEY_RE.test(key) && isValid(v));
}
const isHintCount = (v) => Number.isInteger(v) && v >= 0 && v <= HINT_PENALTY_MIN.length;
const isStageTime = (v) => Number.isInteger(v) && v >= 0;

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  // 0. 요청 모양 검사. 클라이언트가 보낸 값은 전부 의심한다
  const { sessionId, answer, hints = {}, stageTimes = {} } = req.body ?? {};
  if (
    typeof sessionId !== 'string' ||
    typeof answer !== 'string' ||
    answer.length > MAX_ANSWER_LENGTH ||
    !isStageMap(hints, isHintCount) ||
    !isStageMap(stageTimes, isStageTime)
  ) {
    return badRequest(res, 'invalid_body');
  }

  // 최종 정답은 서버 환경변수에만 있다. Production 에서 비어 있으면 개발용 test8 로 넘어가지 않고 멈춘다
  const finalAnswer = process.env.FINAL_ANSWER || (process.env.VERCEL_ENV === 'production' ? null : 'test8');
  if (!finalAnswer) return res.status(500).json({ error: 'final_answer_not_configured' });
  const correct = normalize(answer) === normalize(finalAnswer);

  if (!hasDb()) {
    // 개발용: 세션이 없으니 클라이언트가 보낸 단계 시간 합으로 대신 계산한다
    if (!correct) return res.status(200).json({ ok: false });
    const elapsed = Object.values(stageTimes).reduce((sum, ms) => sum + ms, 0);
    return res.status(200).json({ ok: true, finalTime: elapsed + penaltyMsFromHints(hints), rank: null, mock: true });
  }

  // uuid 모양이 아니면 DB 에 묻기 전에 거른다 (DB 가 형 변환 에러를 내기 전에)
  if (!UUID_RE.test(sessionId)) return badRequest(res, 'invalid_session');

  // 1~6. 세션 조회 → 멱등 → 오답 제한 → 오답 기록 / 클리어 처리 → 랭킹. 한 트랜잭션 안에서 처리된다
  const { data, error } = await db().rpc('finish_session', {
    p_session_id: sessionId,
    p_correct: correct,
    p_hints_used: countHints(hints),
    p_penalty_ms: penaltyMsFromHints(hints),
    p_stage_times: stageTimes,
    p_max_wrong: MAX_WRONG_ATTEMPTS,
    p_min_ranked_ms: MIN_RANKED_MS,
  });

  if (error) {
    console.error('[api/verify]', error);
    return res.status(500).json({ error: 'db_error' });
  }

  switch (data?.status) {
    case 'invalid_session':
      return badRequest(res, 'invalid_session');
    case 'too_many_attempts':
      return res.status(429).json({ error: 'too_many_attempts' });
    case 'wrong':
      return res.status(200).json({ ok: false });
    case 'ok':
      return res.status(200).json({ ok: true, finalTime: data.final_time, rank: data.rank ?? null });
    default:
      console.error('[api/verify] 알 수 없는 결과', data);
      return res.status(500).json({ error: 'db_error' });
  }
}
