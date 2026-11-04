// 담당: 김씨 · GET /api/ranking — 상위 50명 순위표
// 응답 200: { rankings: [{ rank, nickname, finalTime, hintsUsed }] }
import { allowMethod } from './_lib/http.js';
import { hasDb } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'GET')) return;

  if (!hasDb()) {
    return res.status(200).json({
      rankings: [
        { rank: 1, nickname: '호랑이1', finalTime: 1_820_000, hintsUsed: 0 },
        { rank: 2, nickname: '호랑이2', finalTime: 2_450_000, hintsUsed: 3 },
      ],
      mock: true,
    });
  }

  // TODO(김씨): rankings 를 final_time 오름차순으로 50개 조회해서 위 형식으로 변환
  return res.status(501).json({ error: 'not_implemented' });
}
