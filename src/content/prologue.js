// 프롤로그 대사·화면 문구. 장면 흐름: library → monitor → archive → glitch → trapped
// 담당: 형씨(문구) · 정씨(연출은 screens/prologue.js)
// 대사 한 줄 = { speaker, text }. speaker 는 content/characters.js 의 SpeakerKey.
//
// 2026-11-24 새 스토리 반영 (TODO(형씨): 문구 다듬기)
// - 사이트는 10년 전 멈춘 한 개발자의 개인 지식 블로그. 날짜는 전부 10년 전(2016년)
// - 하단 문구 "아직도 여기에 접속할 수 있는 사람이 있군요" 는 개발자가 쓴 말
// - 결정 5: 블로그에서 F12 를 누르는 순간 갇힌다 (archive 장면에서 F12 를 유도)

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
  forcedQuery: '브라우저 렌더링 원리 정리',
  results: [
    { title: '브라우저 렌더링 과정 — 강의 노트', url: 'https://lecture.example/rendering', desc: 'DOM · CSSOM · 렌더 트리 · 레이아웃 · 페인트 정리' },
    { title: '브라우저 렌더링 원리 정리 (2019)', url: 'https://blog.example/rendering', desc: '리플로우와 리페인트, 그리고 렌더링 최적화' },
  ],
  /** 수상한 결과: 10년 전 멈춘 개인 블로그의 글 하나 (누르면 이 글이 먼저 열린다) */
  archive: {
    title: `브라우저는 무엇을 그리고, 크롤러는 무엇을 읽는가 — ${SITE_NAME}`,
    url: 'http://the-archive.invalid/2016/11/rendering',
    desc: '2016. 11. 24. — 크롤러는 서버가 보낸 HTML 텍스트만 읽는다. 최근 도메인이 다시 등록되었습니다',
  },
  /** 일반 결과를 눌렀을 때 */
  unreachable: '페이지에 연결할 수 없습니다.',
  /** 일반 결과가 이만큼 실패하면 주인공이 수상한 결과 쪽으로 눈을 돌린다 */
  failsBeforeHint: 2,
  failLines: [n('어… 여기도 안 열리네.'), n('열리는 건 이 오래된 블로그 하나뿐인가?')],
};

/**
 * 3) 10년 전 멈춘 개인 블로그.
 * 검색 결과의 글이 먼저 열리고 → 메뉴를 둘러보다 → 글 목록의 비공개 글을 열면 F12 를 유도한다.
 */
export const ARCHIVE = {
  origin: 'http://the-archive.invalid',
  /** 개발자가 쓴 말 */
  footer: '아직도 여기에 접속할 수 있는 사람이 있군요.',
  /** 검색 결과에서 눌러서 처음 열리는 글 (새 스토리의 떡밥: 크롤러는 원본 HTML 만 읽는다) */
  article: {
    path: '/2016/11/rendering',
    title: '브라우저는 무엇을 그리고, 크롤러는 무엇을 읽는가',
    date: '2016-11-24',
    body: [
      '크롤러는 서버가 보낸 HTML 텍스트만 읽는다. CSS가 칠해진 화면도, 스크립트가 실행된 결과도 보지 못한다.',
      '브라우저는 다르다. HTML을 받아 화면을 그리고, 스크립트를 실행하고, 그 결과를 남긴다.',
      '그러니 정말 중요한 것은 브라우저에서 그려지고 실행돼야만 보이는 곳에 두면 된다.',
    ],
  },
  /** 메뉴 → 페이지 */
  pages: {
    welcome: {
      menu: 'Welcome',
      path: '/',
      title: SITE_NAME,
      body: ['개발하면서 배운 것을 적어 두는 개인 지식 블로그입니다.', '마지막 글: 2016년 11월 24일'],
    },
    archive: {
      menu: 'Archive',
      path: '/archive',
      title: '글 목록',
      /** 글 목록. locked = 비공개 글(누르면 F12 유도), deleted = 지워진 글 (제목만 떡밥) */
      posts: [
        { date: '2016-11-24', title: '다음에 올 사람에게', status: 'locked' },
        { date: '2016-11-24', title: '브라우저는 무엇을 그리고, 크롤러는 무엇을 읽는가', status: 'article' },
        { date: '2016-03-02', title: '크롤러 때문에 골치다', status: 'deleted' },
        { date: '2016-02-14', title: '끝없이 이어지는 페이지 설계 메모', status: 'deleted' },
        { date: '2015-12-30', title: '정적 사이트 배포 정리', status: 'deleted' },
      ],
    },
    community: {
      menu: 'Community',
      path: '/community',
      title: '404 Not Found',
      body: ['요청한 페이지는 존재하지 않습니다.', '마지막 게시글: 2016년 11월 24일 · 작성자 없음'],
    },
    about: {
      menu: 'About',
      path: '/about',
      title: '소개',
      body: ['블로그 주인: (비공개)', '웹과 크롤링을 공부하는 개발자입니다.', '문의: —'],
    },
  },
  /** 지워진 글을 눌렀을 때 */
  deleted: '삭제되었거나 존재하지 않는 글입니다.',
  /** 비공개 글. 내용은 화면에 표시되지 않는다 */
  lockedPost: {
    path: '/2016/11/to-the-next',
    title: '다음에 올 사람에게',
    date: '2016-11-24',
    body: '이 글은 화면에 표시되지 않습니다.',
    badge: '비공개',
  },
  /** 블로그 장면의 주인공 독백 */
  lines: {
    enter: [n('마지막 글이 2016년…? 10년 전에 멈춘 블로그네.')],
    locked: [n('"다음에 올 사람에게"…? 제목만 있고 내용이 없어.')],
    lure: [n('개발자 도구… F12 말하는 건가?')],
  },
};

/** 비공개 글을 연 뒤 F12 를 유도하는 문구. 개발자가 미리 숨겨 둔 말이라 개발자(정체를 숨긴 "???")로 표시한다 */
export const LURE = {
  /** 비공개 글의 빈 내용 상자가 지직거리며 이 문장으로 바뀌어 한 글자씩 써진다 */
  question: '화면에 표시되는 정보가 전부라고 생각하십니까?',
  corner: '개발자 도구를 확인하세요.',
  /** F12 를 오래 안 누를 때 커서 근처 안내 (ms 뒤) */
  nudgeAfterMs: 30_000,
  nudge: 'F12 · Ctrl+Shift+I (Mac: Cmd+Option+I)',
  /** 메뉴로 개발자 도구를 열면 키 입력이 잡히지 않는다 → 이만큼 지난 뒤의 클릭은 열었다고 본다 (ms) */
  clickFallbackMs: 45_000,
};

/** 4) F12 를 누른 순간: 전기 신호가 튀고 화면이 깨진다 → 모니터가 화면 전체로 커진다 (갇힘) */
export const GLITCH = {
  /** 빨려 들기 전 모니터에 뜨는 한 줄. 크롤러가 돌아온 개발자로 착각하는 말로도 읽힌다 (빨려 들어간 뒤 화면은 검은 채로 둔다) */
  screen: 'WELCOME BACK.',
  /** 빨려 드는 도중의 독백. 말하다가 끊긴다 */
  cutLines: [n('뭐야, 이—')],
  /** 암전 뒤 정신을 차리며 */
  lines: [n('…여기가 어디야?'), n('개발자 도구를 연 것뿐인데…'), n('화면이… 아니, 내가 화면 안에 있는 건가?')],
};

/** 5) 갇힘 — 콘솔 메시지 뒤 1단계로 */
export const TRAPPED = {
  /** 콘솔에 메시지가 찍힐 때마다 화면 구석에 뜨는 알림 (개발자 도구의 새 메시지 표시처럼) */
  chip: (count) => `Console · 새 메시지 ${count}`,
  /** 메시지가 다 찍힌 뒤 주인공 독백 → 1단계 */
  lines: [n('누군가… 콘솔로 말을 걸고 있어.'), n('일단… 시키는 대로 해 보는 수밖에 없겠어.')],
  /** 콘솔 메시지를 다 보여 준 뒤 1단계로 넘어가기 전 화면 문구 */
  connecting: '연결을 시도하는 중…',
  /** 새로고침 등으로 빠져나가려 했을 때 */
  escape: '도망칠 수 없습니다.',
  /** 뒤로 가기를 눌렀을 때 (크롤러) */
  back: '이전 페이지로 돌아갈 수 없습니다. 이 시도는 기록되었습니다.',
  /** 프롤로그 끝에서 /api/start 실패 */
  nicknameRejected: '이 이름은 사용할 수 없습니다. 다른 이름을 입력하세요.',
  startFailed: '서버에 연결하지 못했습니다.',
  retry: '다시 시도',
};
