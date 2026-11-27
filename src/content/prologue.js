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
  /** 웹프로그래밍 과제 2: HTML 문서가 화면에 표시되기까지 (파싱 → DOM 트리 → 렌더 트리) 조사 보고서 */
  desktopFile: '웹프로그래밍_과제2_보고서_최종.docx',
};

/** 2) 모니터 속 검색 */
export const MONITOR = {
  lines: [n('자료를 조금만 더 찾아보자.')],
  searchHost: 'https://search.example/',
  searchBrand: 'Lookup',
  placeholder: '검색어를 입력하세요',
  /** 무엇을 치든 이 문장이 한 글자씩 대신 입력된다 */
  forcedQuery: 'HTML 파싱 DOM 트리 렌더 트리 차이',
  results: [
    { title: '렌더 트리 구성 과정 정리 — 강의 노트', url: 'https://lecture.example/render-tree', desc: 'HTML 파싱 · DOM · CSSOM · 렌더 트리 · 레이아웃 · 페인트' },
    { title: 'DOM 과 CSSOM, 그리고 렌더링 (2019)', url: 'https://blog.example/dom-cssom', desc: '브라우저 렌더링 과정과 리플로우·리페인트 정리' },
  ],
  /** 수상한 결과: 10년 전 멈춘 개인 블로그의 글 하나 (누르면 이 글이 먼저 열린다) */
  archive: {
    title: `[Browser] DOM 트리와 렌더 트리의 차이 — ${SITE_NAME}`,
    url: 'http://the-archive.invalid/2016/11/dom-render-tree',
    desc: '2016. 11. 24. — 브라우저는 HTML 문서를 파싱해 DOM 트리를 만들고, 화면에 표시할 노드만 골라 렌더 트리를 만든다. 최근 도메인이 다시 등록되었습니다',
  },
  /** 일반 결과를 눌렀을 때 */
  unreachable: '페이지에 연결할 수 없습니다.',
  /** 일반 결과가 이만큼 실패하면 주인공이 수상한 결과 쪽으로 눈을 돌린다 */
  failsBeforeHint: 2,
  failLines: [n('어… 여기도 안 열리네.'), n('열리는 건 이 오래된 블로그 하나뿐인가?')],
};

/**
 * 3) 10년 전 멈춘 개발자의 개인 블로그 (직접 만든 정적 사이트, 2014~2016).
 * 검색 결과의 글이 먼저 열리고 → 글 목록·태그를 둘러보다 → 비공개 글 "다음에 올 사람에게"를 열면 F12 를 유도한다.
 * 글 제목은 "[태그] 핵심 명사형" (태그는 화면이 앞에 붙인다). 본문은 담백한 정보 정리 문체, 비유 없이.
 * TODO(형씨): 2026-11-27 정씨가 새 블로그 화면에 맞춰 넣은 초안. 글 본문·글 목록·잡담 제목 다듬기
 */
export const ARCHIVE = {
  origin: 'http://the-archive.invalid',
  /** 바닥글 (RSS·robots.txt 는 화면이 링크 모양으로 붙인다) */
  copyright: `© 2014–2016 ${SITE_NAME}`,
  footerLinks: ['RSS', 'robots.txt'],
  /** 메뉴 (posts: 글 목록 · tags: 분류 목록 · guestbook: 끊긴 페이지) */
  menu: { posts: 'Posts', tags: 'Category', guestbook: 'Guestbook' },
  /** 옆줄 */
  sidebar: {
    profileName: 'admin',
    /** 옆줄 분류 목록 맨 위 줄 (2016년 한국 블로그식 "분류 전체보기 (n)") */
    tagsTitle: '분류 전체보기',
    monthsTitle: '지난 글',
    /** 10년 동안 아무도 없다가 오늘 처음 1명 */
    visitors: { today: 1, total: 48213 },
  },
  /**
   * 태그와 글 수. 화면에 남은 글보다 수가 많다 (나머지는 지워졌다).
   * 잡담: 개인 프로젝트(크롤러)가 이상해지는 과정을 적던 글들이 여기 있었다. 제목에는 "크롤러"를 쓰지 않는다.
   */
  tags: [
    { name: 'Browser', count: 4 },
    { name: 'HTML/CSS', count: 6 },
    { name: 'JavaScript', count: 7 },
    { name: 'Network', count: 3 },
    { name: 'Algorithm', count: 5 },
    { name: '잡담', count: 9 },
  ],
  /** 옆줄 "지난 글" (월별 글 수) */
  months: [
    { label: '2016년 11월', count: 4 },
    { label: '2016년 06월', count: 2 },
    { label: '2016년 03월', count: 3 },
    { label: '2015년 12월', count: 2 },
  ],
  /**
   * 글 목록 (최신순). status: locked 비공개 글(누르면 F12 유도) · article 열리는 글 · deleted 지워진 글(제목만 남음)
   * @type {{ date: string, tag?: string, title: string, status: 'locked' | 'article' | 'deleted' }[]}
   */
  posts: [
    { date: '2016-11-24', title: '다음에 올 사람에게', status: 'locked' },
    { date: '2016-11-24', tag: 'Browser', title: 'DOM 트리와 렌더 트리의 차이', status: 'article' },
    // 잡담 3편: 계획 → 이상한 접속(반전 로그 2016-11-02 03:14 와 같은 시각) → 스스로 바뀐 코드(반전 로그 11-17)
    { date: '2016-11-17', tag: '잡담', title: '작성한 적 없는 커밋', status: 'deleted' },
    { date: '2016-11-03', tag: '잡담', title: '새벽 3시 14분의 접속 기록', status: 'deleted' },
    { date: '2016-06-12', tag: 'JavaScript', title: '이벤트 루프(Event Loop) 정리', status: 'deleted' },
    { date: '2016-06-02', tag: 'Algorithm', title: 'BFS로 링크 따라가기', status: 'deleted' },
    { date: '2016-03-20', tag: '잡담', title: '올해의 개인 프로젝트', status: 'deleted' },
    { date: '2016-03-08', tag: 'Network', title: 'HTTP 쿠키와 세션', status: 'deleted' },
    { date: '2016-03-02', tag: 'HTML/CSS', title: 'display: none 과 visibility: hidden', status: 'deleted' },
    { date: '2015-12-30', tag: 'Network', title: 'HTTP 상태 코드 정리', status: 'deleted' },
    { date: '2015-12-14', tag: 'JavaScript', title: '클로저(Closure)란?', status: 'deleted' },
  ],
  /**
   * 검색 결과에서 눌러서 처음 열리는 글. 과제(웹프로그래밍 과제 2: 파싱 → DOM 트리 → 렌더 트리)와 같은 주제다.
   * 1·2·3·6단계에서 겪을 것(주석, display: none, 스크립트·CSS 로 만든 내용)을 미리 정리해 둔 셈이다.
   * blocks 종류: h3 소제목 · p 문단 · ol/ul 목록 · code 코드 · img 깨진 그림(10년 사이 외부 이미지가 사라짐)
   * 문단·목록 안에서 `백틱`으로 감싼 말은 화면이 인라인 코드로 보여 준다
   */
  article: {
    path: '/2016/11/dom-render-tree',
    tag: 'Browser',
    title: 'DOM 트리와 렌더 트리의 차이',
    date: '2016-11-24',
    blocks: [
      { type: 'h3', text: '1. 개요' },
      { type: 'p', text: '브라우저는 서버에서 받은 HTML 문서를 다음 순서로 처리해 화면에 표시한다.' },
      {
        type: 'ol',
        items: ['HTML 파싱 → DOM 트리 생성', 'CSS 파싱 → CSSOM 생성', 'DOM 트리 + CSSOM → 렌더 트리 생성', '레이아웃(Layout) → 페인트(Paint)'],
      },
      { type: 'img', alt: '[그림 1] 렌더링 과정' },
      { type: 'h3', text: '2. DOM 트리' },
      {
        type: 'p',
        text: 'HTML 파서는 문서를 토큰 단위로 나눈 뒤 노드로 변환한다. 요소뿐 아니라 텍스트와 주석도 노드가 된다. 주석은 화면에 표시되지 않지만 DOM 트리에는 Comment 노드로 남는다.',
      },
      { type: 'code', text: '<body>\n  <p>안녕하세요</p>\n  <!-- 메모 -->\n</body>\n\nbody\n├─ p\n│  └─ #text "안녕하세요"\n└─ #comment " 메모 "' },
      { type: 'h3', text: '3. 렌더 트리' },
      {
        type: 'p',
        text: '렌더 트리는 화면에 표시할 노드만 포함한다. `display: none` 이 적용된 요소는 DOM 트리에는 있지만 렌더 트리에는 포함되지 않는다. `visibility: hidden` 이 적용된 요소는 보이지 않아도 공간을 차지하므로 렌더 트리에 포함된다.',
      },
      { type: 'h3', text: '4. 원본 HTML 에 없는 내용' },
      {
        type: 'p',
        text: '스크립트로 추가한 요소와 CSS 의 `::before`, `::after` 로 넣은 `content` 는 서버가 보낸 원본 HTML 에 없다. 페이지 소스 보기(`view-source`)는 원본 HTML 을 보여 주고, 개발자 도구의 Elements 패널은 현재의 DOM 트리를 보여 준다.',
      },
      { type: 'h3', text: '5. 정리' },
      {
        type: 'ul',
        items: ['원본 HTML: 서버가 보낸 텍스트 그대로', 'DOM 트리: 원본 HTML 을 파싱한 결과 + 스크립트가 바꾼 내용', '렌더 트리: DOM 트리 중 화면에 표시할 노드만'],
      },
      { type: 'p', text: '따라서 원본 HTML 만 읽는 프로그램은 스크립트나 CSS 로 만들어진 내용을 확인할 수 없다.' },
    ],
  },
  /** 글 아래 이전·다음 글 (글 목록에서 바로 아래·위 글). 다음 글 = 비공개 글로 가는 길 */
  prevLabel: '이전 글',
  nextLabel: '다음 글',
  /** 댓글란 (댓글 없이 비어 있다) */
  comments: { title: '댓글', empty: '댓글을 불러올 수 없습니다.' },
  /** 외부 이미지가 사라진 자리 */
  brokenImage: '이미지를 불러올 수 없습니다',
  /** 끊긴 페이지 (방명록) */
  notFound: { title: '404 Not Found', body: '요청한 페이지를 찾을 수 없습니다.' },
  postsTitle: '전체 글',
  /** @param {string} tag */
  tagPageTitle: (tag) => `'${tag}' 분류의 글`,
  /** 지워진 글을 눌렀을 때 */
  deleted: '삭제되었거나 존재하지 않는 글입니다.',
  /** 비공개 글. 내용은 화면에 표시되지 않는다 */
  lockedPost: {
    path: '/2016/11/to-the-next',
    title: '다음에 올 사람에게',
    date: '2016-11-24',
    /** 비공개 글 본문 자리에 처음부터 적혀 있는 한 줄 (개발자가 남긴 말). TODO(형씨): 다듬기 */
    body: '이 글은 지워지지 않았습니다. 개발자 화면을 참조하세요.',
    badge: '비공개',
  },
  /**
   * 블로그 장면의 주인공 독백.
   * 글을 끝까지 내려 "다음 글"(= 비공개 글 "다음에 올 사람에게")을 누르도록 이끈다:
   * enter → (한동안 안 내려가면 scrollHint) → 글 아래 이전·다음 글이 보이면 nextPost
   */
  scrollHintAfterMs: 15_000,
  lines: {
    enter: [n('마지막 글이 2016년…? 10년 전에 멈춘 블로그네.'), n('그래도 과제 주제랑 딱 맞는 글이야. 끝까지 읽어 보자.')],
    scrollHint: [n('글이 아래로 더 이어지네. 스크롤해서 끝까지 내려가 보자.')],
    nextPost: [n('다음 글이… "다음에 올 사람에게"?'), n('과제랑은 상관없어 보이는데, 이 블로그의 마지막 글이야. 한번 눌러 볼까.')],
    locked: [n('"다음에 올 사람에게"…? 본문 대신 한 줄뿐이야.')],
    // 본문 한 줄을 보고 F12 에 닿는다 (화면 구석 안내 없이 독백으로만)
    lure: [n('개발자 화면을 참조하라니… 개발자 도구를 말하는 건가?'), n('개발자 도구… F12였지.')],
  },
};

/** 비공개 글을 연 뒤 F12 를 유도하는 문구. 개발자가 미리 숨겨 둔 말이라 개발자(정체를 숨긴 "???")로 표시한다 */
export const LURE = {
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
