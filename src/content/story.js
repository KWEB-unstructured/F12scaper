// 화면 공통 문구. 단계별 대사와 힌트는 각 stages/stageN.js, 프롤로그 대사는 content/prologue.js 에 둔다.
// 담당: 형씨(문구)

export const SITE_NAME = 'THE ARCHIVE';

export const ETHICS_NOTICE =
  '이 게임의 모든 퍼즐은 이 페이지 안에서만 이루어집니다. 권한 없이 다른 사이트의 쿠키나 요청을 조작하는 것은 불법이 될 수 있습니다.';

/** 시작 화면 (타이틀). TODO(형씨): 문구 다듬기 */
export const START = {
  /** 화면 위 양쪽 구석의 작은 상태 표시 */
  corner: { left: 'library-pc-07 · 오후 5:41', right: '연결 상태: 불안정' },
  /** 제목 위 한 줄. 사이트가 플레이어를 부르는 듯한 문구 */
  kicker: `${SITE_NAME} — 누군가 당신의 접속을 기다리고 있습니다`,
  tagline: '본격 F12 창과 친해지기 게임',
  mission: [
    '도서관에서 과제를 하던 당신은 수상한 웹사이트에 갇힌다.',
    '화면은 거짓말을 한다. 브라우저 개발자 도구(F12)로 숨겨진 단서를 찾아 탈출하라.',
  ],
  startLabel: '접속하기',
  rankingLabel: '랭킹 보기',
  browserNote: 'PC 크롬(또는 엣지) 브라우저를 권장합니다.',
};

/** 닉네임 입력 화면 (도서관 PC 로그인으로 연출) */
export const LOGIN = {
  bar: '도서관 PC-07 · 이용자 로그인',
  title: '이용자 로그인',
  desc: '이름은 랭킹에 표시됩니다. (1~16자)',
  label: '이름',
  submit: '로그인',
};

/** 정답 입력창 앞 프롬프트 */
export const PROMPT = 'ghost@the-archive:~$'; // 브라우저가 주인공을 정체불명의 객체(유령)로 인식한다

/** 단계 화면의 사이트 주소. 단계 번호로 만든다 (퍼즐 내용이 드러나지 않게 중립적인 이름) */
export const stageUrl = (id) => `http://the-archive.invalid/room/${id}`;

/** 단계 통과 연출 문구. TODO(형씨): 8단계 문구는 결말이 정해지면 다시 보기 */
export const STAGE_CLEAR = {
  title: 'ACCESS GRANTED',
  finalTitle: 'ESCAPE COMPLETE',
};

/** 단계 화면 버튼·확인 창 문구 */
export const GAME_UI = {
  askBrowser: '힌트 보기',
  askMeta: (used, total, nextMin) => (used >= total ? `${used}/${total}` : `${used}/${total} · +${nextMin}분`),
  hintTitle: (n) => `힌트 ${n}을 열까요?`,
  hintBody: (min) => `힌트를 열면 기록에 ${min}분이 더해집니다.`,
  hintOk: '힌트 열기',
  menu: '메뉴',
  reset: '처음부터 다시',
  resetTitle: '처음부터 다시 시작할까요?',
  resetBody: '진행 상황과 기록이 모두 지워집니다.',
  resetOk: '지우고 다시 시작',
  cancel: '취소',
  submit: '실행',
  placeholder: '찾은 정답을 입력하고 Enter',
};

/** 클리어 화면 제목. TODO(형씨): 결말 미정 — 결말이 정해지면 바꾼다 */
export const CLEAR_TITLE = '탈출 성공';

/** 단계에 taunts 가 없을 때 쓰는 크롤러 기본 경고 */
export const DEFAULT_TAUNTS = ['허가되지 않은 입력입니다. 이 접근은 기록됩니다.', '화면에 보이는 것만으로는 통과할 수 없습니다.'];

/** 같은 단계에서 여러 번 틀렸을 때 주인공이 힌트를 떠올린다 (독백). TODO(형씨): 문구 다듬기 */
export const HINT_SUGGEST = '너무 오래 붙잡고 있었나… 힌트를 볼까? (기록에 시간이 더해지긴 하지만)';

/** 8단계 서버 검증 실패 */
export const SERVER_DOWN = '서버가 응답하지 않습니다. 잠시 후 다시 입력하세요.';
export const TOO_MANY_ATTEMPTS = '비정상 시도가 너무 많아 입력이 차단되었습니다.';

/**
 * 8단계 콘솔 종료 요청이 400 으로 거절됐을 때 주인공 독백 (JSON.stringify 를 빠뜨렸거나 key 가 없을 때).
 * 서버가 응답 message 에 이유를 적어 주니, 그쪽을 보게 유도한다. TODO(형씨): 문구 다듬기
 */
export const TERMINATE_REJECTED = '요청이 거절됐어. 서버가 뭐라고 답했는지 응답을 열어 보자. (Network 탭이나 .then(r => r.json()))';
