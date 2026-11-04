// 담당: 김씨 · GET /api/stage5 — 5단계 퍼즐용. 항상 실패 상태 코드를 보내지만 본문·헤더에 단서를 담는다.
// 화면에는 "실패"만 보이고, 플레이어는 Network 탭에서 응답을 열어 봐야 단서를 찾는다.
import { allowMethod } from './_lib/http.js';

export default function handler(req, res) {
  if (!allowMethod(req, res, 'GET')) return;

  // TODO(김씨): 상태 코드·헤더 이름·본문 단서 확정 (임시 정답 test5)
  res.setHeader('X-Ghost-Note', 'TODO');
  return res.status(403).json({ error: 'forbidden', message: '권한이 없습니다.', clue: 'TODO: test5' });
}
