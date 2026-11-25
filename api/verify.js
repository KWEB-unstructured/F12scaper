// 담당: 김씨 · POST /system/terminate (= POST /api/verify) — 최종 키를 검증하고 기록을 계산한다.
// /system/terminate 는 vercel.json 의 rewrite(배포)와 vite.config.js 플러그인(로컬)이 이 파일로 넘긴다.
// 8단계에서 플레이어는 콘솔로 { key } 만 보내고, 화면(정씨)이 fetch 를 감싸 sessionId·hints·stageTimes 를 덧붙인다.
// 요청: { key, sessionId, hints: {단계: 사용 수}, stageTimes: {단계: ms} }   (key 대신 answer 도 받는다: 넘어가는 동안)
// 응답 200: { ok: false, message } | { ok: true, finalTime, rank, message }
//      400: invalid_body | invalid_session (+ message)   429: too_many_attempts (+ message)   500: db_error | final_answer_not_configured
// 규칙(멱등, 오답 제한, 랭킹 제외)은 docs/contracts.md 3절. DB 쪽 처리는 supabase/migrations/002_finish_session.sql 의 함수 하나로 묶었다.
import { allowMethod, badRequest, readJsonBody } from './_lib/http.js';
import { hasDb, db } from './_lib/supabase.js';
import { TERMINATE_MESSAGES as MSG } from './_lib/terminate-messages.js';
import { normalize } from '../src/core/hash.js';
import { penaltyMsFromHints, countHints, HINT_PENALTY_MIN } from '../src/core/rules.js';

const MAX_WRONG_ATTEMPTS = 50; // 세션당 오답 허용 횟수
const MIN_RANKED_MS = 60_000; // 이보다 빨리 깬 기록은 랭킹에서 뺀다 (4주차 테스트 후 조정)
const MAX_KEY_LENGTH = 200;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STAGE_KEY_RE = /^[1-8]$/;

/** { "1": 값, ... } 모양이고, 키는 단계 1~8, 값은 isValid 를 통과하는지 */
function isStageMap(value, isValid) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([k, v]) => STAGE_KEY_RE.test(k) && isValid(v));
}
const isHintCount = (v) => Number.isInteger(v) && v >= 0 && v <= HINT_PENALTY_MIN.length;
const isStageTime = (v) => Number.isInteger(v) && v >= 0;

const ok = (res, body) => res.status(200).json(body);

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  // 0. 요청 모양 검사. 클라이언트가 보낸 값은 전부 의심한다
  const body = readJsonBody(req);
  const key = body?.key ?? body?.answer;
  if (typeof key !== 'string' || key.length > MAX_KEY_LENGTH) return badRequest(res, 'invalid_body', MSG.invalidBody);

  // 세션 정보가 아예 없다 = 화면을 거치지 않고 보낸 요청 (5단계에서 주소만 알아낸 경우 등)
  const { sessionId, hints = {}, stageTimes = {} } = body;
  if (sessionId === undefined) return badRequest(res, 'invalid_session', MSG.invalidSession);
  if (typeof sessionId !== 'string' || !isStageMap(hints, isHintCount) || !isStageMap(stageTimes, isStageTime)) {
    return badRequest(res, 'invalid_body', MSG.invalidBody);
  }

  // 최종 키는 서버 환경변수에만 있다. Production 에서 비어 있으면 개발용 test8 로 넘어가지 않고 멈춘다
  const finalAnswer = process.env.FINAL_ANSWER || (process.env.VERCEL_ENV === 'production' ? null : 'test8');
  if (!finalAnswer) return res.status(500).json({ error: 'final_answer_not_configured' });
  const correct = normalize(key) === normalize(finalAnswer);

  if (!hasDb()) {
    // 개발용: 세션이 없으니 클라이언트가 보낸 단계 시간 합으로 대신 계산한다
    if (!correct) return ok(res, { ok: false, message: MSG.wrong });
    const elapsed = Object.values(stageTimes).reduce((sum, ms) => sum + ms, 0);
    return ok(res, { ok: true, finalTime: elapsed + penaltyMsFromHints(hints), rank: null, message: MSG.ok, mock: true });
  }

  // uuid 모양이 아니면 DB 에 묻기 전에 거른다 (DB 가 형 변환 에러를 내기 전에)
  if (!UUID_RE.test(sessionId)) return badRequest(res, 'invalid_session', MSG.invalidSession);

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
      return badRequest(res, 'invalid_session', MSG.invalidSession);
    case 'too_many_attempts':
      return res.status(429).json({ error: 'too_many_attempts', message: MSG.tooManyAttempts });
    case 'wrong':
      return ok(res, { ok: false, message: MSG.wrong });
    case 'ok':
      return ok(res, { ok: true, finalTime: data.final_time, rank: data.rank ?? null, message: MSG.ok });
    default:
      console.error('[api/verify] 알 수 없는 결과', data);
      return res.status(500).json({ error: 'db_error' });
  }
}
