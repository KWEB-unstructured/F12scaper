// 프롤로그 대사·화면 문구. 장면 흐름: library → monitor → archive → glitch → trapped
// 담당: 형씨(문구) · 정씨(연출은 screens/prologue.js)
// 대사 한 줄 = { speaker, text }. speaker 는 content/characters.js 의 SpeakerKey.

import { SITE_NAME } from './story.js';

const n = (text) => ({ speaker: 'narration', text });

/** 1) 도서관 — 미연시 내레이션. 끝나면 모니터로 줌인 */
export const LIBRARY = {
  lines: [n('오후 5:42'), n('제출까지 남은 시간은 얼마 없다.'), n('도서관은 조용했고, 컴퓨터 팬 돌아가는 소리만 희미하게 들렸다.')],
  /** 줌인 전 모니터에 떠 있는 화면 */
  desktopFile: '과제_최종_진짜최종.docx',
};

/** 2) 모니터 속 검색 */
export const MONITOR = {
  lines: [n('자료를 조금만 더 찾아보자.')],
  searchHost: 'https://search.example/',
  searchBrand: 'Lookup',
  placeholder: '검색어를 입력하세요',
  /** 무엇을 치든 이 문장이 한 글자씩 대신 입력된다 */
  forcedQuery: '웹 접근성 과제 참고 자료 아카이브',
  results: [
    { title: '웹 접근성 기초 — 강의 노트', url: 'https://lecture.example/a11y', desc: '시맨틱 마크업과 대체 텍스트 정리' },
    { title: '과제 참고 자료 모음 (2019)', url: 'https://blog.example/ref', desc: '링크 대부분이 만료되었습니다' },
  ],
  /** 마지막에 나오는 수상한 결과 */
  archive: {
    title: `${SITE_NAME} — 모든 기록이 보관되는 곳`,
    url: 'http://the-archive.invalid/',
    desc: '마지막 업데이트: 2031년 3월 14일',
  },
};

/** 3) 평범해 보이는 사이트. 메뉴를 MIN_PAGES 개 이상 본 뒤 "열람하기"를 누르면 glitch */
export const ARCHIVE = {
  url: 'http://the-archive.invalid/',
  minPages: 3,
  footer: '아직도 여기에 접속할 수 있는 사람이 있군요.',
  notReady: '열람 권한을 확인하는 중입니다… 다른 메뉴를 먼저 둘러봐 주세요.',
  openButton: '열람하기',
  /** 메뉴 → 페이지. 날짜가 이상한 게 의도 (미래, 1970년) */
  pages: {
    welcome: {
      menu: 'Welcome',
      title: `${SITE_NAME}에 오신 것을 환영합니다`,
      body: ['이곳에는 사라진 웹페이지의 기록이 보관됩니다.', '최근 업데이트: 2031년 3월 14일'],
    },
    archive: {
      menu: 'Archive',
      title: '보관 자료',
      body: ['웹 접근성 과제 참고 자료 — 등록일 1970-01-01', '도서관 이용자 기록 — 등록일 1970-01-01', '접속자 명단 (비공개) — 등록일 2031-03-14'],
    },
    community: {
      menu: 'Community',
      title: '404 Not Found',
      body: ['요청한 페이지는 존재하지 않습니다.', '마지막 게시글: 1970년 1월 1일 · 작성자 없음'],
    },
    about: {
      menu: 'About Us',
      title: '소개',
      body: ['설립: 1970년', '운영: —', '문의: 이 사이트에서 나가는 방법은 안내하지 않습니다.'],
    },
  },
};

/** 4) 이상 현상. 문구가 한 줄씩 바뀐 뒤 모니터가 화면 전체로 커진다 */
export const GLITCH = {
  screen: ['WELCOME BACK.', 'WE HAVE BEEN WAITING.', 'YOU ARE NOT SUPPOSED TO BE HERE.', 'Connection status: Restricted'],
  lines: [n('뭐야, 이거?'), n('사이트가 왜 이래?')],
};

/** 5) 갇힘 — F12 유도 */
export const TRAPPED = {
  question: '화면에 표시되는 정보가 전부라고 생각하십니까?',
  corner: '개발자 도구를 확인하세요.',
  /** F12 를 오래 안 누를 때 커서 근처 안내 (ms 뒤) */
  nudgeAfterMs: 30_000,
  nudge: 'F12 · Ctrl+Shift+I (Mac: Cmd+Option+I)',
  /** 콘솔 메시지를 다 보여 준 뒤 1단계로 넘어가기 전 화면 문구 */
  connecting: '연결을 시도하는 중…',
  /** 새로고침 등으로 빠져나가려 했을 때 */
  escape: '도망칠 수 없습니다.',
  /** 뒤로 가기를 눌렀을 때 (보안 시스템) */
  back: '이전 페이지로 돌아갈 수 없습니다. 이 시도는 기록되었습니다.',
  /** 프롤로그 끝에서 /api/start 실패 */
  nicknameRejected: '이 이름은 사용할 수 없습니다. 다른 이름을 입력하세요.',
  startFailed: '서버에 연결하지 못했습니다.',
  retry: '다시 시도',
};
