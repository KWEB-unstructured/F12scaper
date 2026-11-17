// 담당: 김씨 · GET /api/stage5 — 5단계 퍼즐. 항상 403 을 보내고, 열쇠를 헤더와 본문에 반씩 나눠 담는다.
// 화면에는 "거부됨"만 보인다. 플레이어는 Network 탭에서 이 요청을 열어
// Headers(응답 헤더 X-Archive-Key = 앞부분)와 Response(본문 key_tail = 뒷부분)를 둘 다 봐야 한다.
// 열쇠는 퍼즐 안에 숨긴 원문이라 커밋 예외 (CLAUDE.md 규칙 7). 바꾸면 src/stages/stage5.js 의 answerHash 도 같이 바꾼다.
import { allowMethod } from './_lib/http.js';

const KEY_HEAD = 'foot';
const KEY_TAIL = 'print';

export default function handler(req, res) {
  if (!allowMethod(req, res, 'GET')) return;

  // 헤더 이름에 ad·track 같은 단어를 쓰지 않는다 (광고 차단 확장이 막는다)
  res.setHeader('X-Archive-Key', KEY_HEAD);
  return res.status(403).json({
    error: 'access_denied',
    message: '열람 권한이 없습니다. 이 요청은 기록됩니다.',
    record: '이전 접속자 기록 (잠김)',
    key_tail: KEY_TAIL,
    note: '열쇠 앞부분은 봉투 겉면에 적어 뒀어. 내용물만 뜯어 보는 사람은 절대 못 열어.',
  });
}
