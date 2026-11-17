// 담당: 김씨 · GET /api/ranking — 상위 50명 순위표
// 응답 200: { rankings: [{ rank, nickname, finalTime, hintsUsed }] }   500: db_error
// Vercel Cron 이 하루 한 번 이 API 를 불러 Supabase 무료 프로젝트가 일시정지되지 않게 한다 (vercel.json).
import { allowMethod } from './_lib/http.js';
import { hasDb, db } from './_lib/supabase.js';

const LIMIT = 50;

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'GET')) return;

  if (!hasDb()) {
    return res.status(200).json({
      rankings: [
        { rank: 1, nickname: '접속자1', finalTime: 1_820_000, hintsUsed: 0 },
        { rank: 2, nickname: '접속자2', finalTime: 2_450_000, hintsUsed: 3 },
      ],
      mock: true,
    });
  }

  // 기록이 같으면 먼저 올라간 사람이 위에 보인다
  const { data, error } = await db()
    .from('rankings')
    .select('nickname, final_time, hints_used')
    .order('final_time', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(LIMIT);

  if (error) {
    console.error('[api/ranking]', error);
    return res.status(500).json({ error: 'db_error' });
  }

  // 순위 = 나보다 기록이 좋은 사람 수 + 1. 기록이 같으면 같은 순위 (1, 2, 2, 4).
  // /api/verify 가 돌려주는 rank 와 같은 규칙이다.
  const rankings = [];
  data.forEach((row, i) => {
    const prev = rankings[i - 1];
    const rank = prev && data[i - 1].final_time === row.final_time ? prev.rank : i + 1;
    // DB 는 snake_case, API 는 camelCase
    rankings.push({ rank, nickname: row.nickname, finalTime: row.final_time, hintsUsed: row.hints_used });
  });

  return res.status(200).json({ rankings });
}
