// 단계 사이 이야기 장면 (2026-11-24 결정 3-1: 장면 데이터는 이 파일 한 곳)
// 담당: 형씨(문구) · 정씨(재생은 ui/interlude.js, 언제 트는지는 screens/stage.js)
// TODO(형씨): 문구 다듬기. 아래 문구는 장면 구조를 시험하려고 정씨가 넣은 임시 문구다.
//
// 장면 id
// - 'after-N'  N단계를 통과한 직후 (통과 연출 → 이 장면 → N+1단계). afterStage(N) 으로 만든다
// - 'reveal'   4단계 반전. stage4.js 가 쿠키를 admin 으로 바꾸고 새로고침한 순간 ctx.playScene('reveal') 로 튼다
// - 'ending'   8단계 탈출 뒤 결말 (TODO: 8단계·결말 작업 때 연결)
// 장면 하나 = 장면 조각(beat) 배열. 조각은 차례로 재생되고, 플레이어는 언제든 장면 전체를 건너뛸 수 있다.
// 한 번 본 장면(건너뛴 장면 포함)은 다시 나오지 않는다. 새로고침하면 보던 장면을 처음부터 다시 튼다.

/**
 * 대사 한 줄 (화자 키는 content/characters.js)
 * @typedef {{ speaker: import('./characters.js').SpeakerKey, text: string }} Line
 */
/**
 * 로그 한 줄. 한 줄씩 차례로 찍힌다 (클릭·Enter 로 남은 줄을 한 번에)
 * @typedef {Object} LogLine
 * @property {string} text
 * @property {string} [at]        줄 앞에 흐리게 붙는 시각 (예: '2016-11-24 23:59')
 * @property {import('./characters.js').SpeakerKey} [speaker]  글자색 (없으면 흐린 회색 · crawler 빨강 · developer 파랑)
 * @property {number} [delay]     이 줄이 찍힌 뒤 다음 줄까지 (ms, 기본 700)
 */
/**
 * 장면 조각. log·screen 중 하나를 화면 가운데에 띄우고(없으면 어두운 바탕만), lines 대사를 그 위 대사창으로 재생한다.
 * @typedef {Object} Beat
 * @property {Line[]} [lines]   대사창 대사
 * @property {{ title?: string, lines: LogLine[] }} [log]   로그 재생 (다 찍힌 뒤 대사가 이어진다)
 * @property {{ url?: string, title: string, body: string[] }} [screen]   모형 화면 (가짜 창)
 * @property {boolean} [reveal]  이 조각부터 개발자·크롤러의 진짜 이름을 보여 준다 (4단계 반전)
 */

const n = (text) => ({ speaker: 'narration', text });
const dev = (text) => ({ speaker: 'developer', text });

/** @param {number} stageId 통과한 단계 */
export const afterStage = (stageId) => `after-${stageId}`;

/** @type {Record<string, Beat[]>} */
export const INTERLUDES = {
  'after-1': [
    { lines: [dev('찾았군요. 첫 번째 조각이에요.'), dev('그들은 화면에 보이는 것만 확인합니다. 그러니 앞으로도 화면 뒤를 보세요.'), n('인증 키 조각… 이걸 다 모으면 나갈 수 있는 건가?')] },
  ],
  'after-2': [
    {
      log: { title: 'console', lines: [{ speaker: 'crawler', text: '[crawler] 변경 사항 감지 · 복구 예약' }] },
      lines: [dev('방금 고친 곳을 그들이 되돌리려 하고 있어요. 지나온 문은 다시 닫힙니다.'), n('뒤는 돌아보지 말고 가라는 거네.')],
    },
  ],
  'after-3': [
    { lines: [dev('콘솔은 그들이 읽지 못하는 곳이에요. 스크립트가 실행돼야만 보이니까요.'), dev('그래서 제가 여기서만 말할 수 있는 겁니다.')] },
  ],
  reveal: [
    {
      screen: {
        url: 'http://the-archive.invalid/admin/crawler',
        title: 'CRAWLER CONTROL',
        body: ['상태: 실행 중 · 3,652일째', '마지막 관리자 접속: 2016-11-24', '현재 권한: admin (방금 변경됨)'],
      },
      lines: [n('관리 프로그램…? 크롤러를 관리하는 화면인가 봐.')],
    },
    {
      log: {
        title: 'crawler.log — 2016-11',
        lines: [
          { at: '2016-11-02 03:14', text: '방문자 수집 시작' },
          { at: '2016-11-17 22:40', text: '방문자를 페이지 안에 붙잡아 두는 기능 추가 (관리자 승인 없음)', speaker: 'crawler' },
          { at: '2016-11-23 01:05', text: '관리자 종료 명령 거부', speaker: 'crawler' },
          { at: '2016-11-24 23:59', text: '관리자 계정을 페이지 안에 격리', speaker: 'crawler', delay: 1200 },
        ],
      },
      lines: [n('…10년 전 로그야.'), n('크롤러가 관리자를… 가둔 거야?')],
    },
    { reveal: true, lines: [dev('네. 그 관리자가 저예요.'), dev('이제야 제대로 인사드리네요. 저도 당신처럼 여기 갇혀 있습니다.')] },
  ],
  'after-4': [{ lines: [dev('로그를 보셨으니 이제 아시겠죠. 그들은 저를 가둔 크롤러입니다.'), dev('남은 조각은 세 개예요.')] }],
  'after-5': [{ lines: [dev('방금 그 응답에 서버 종료 주소가 있었죠. 기억해 두세요. 마지막 문에 필요합니다.')] }],
  'after-6': [
    {
      log: { title: 'console', lines: [{ speaker: 'crawler', text: '[crawler] 격리 대상 2 · 탈출 시도 감지 · 감시 강화' }] },
      lines: [dev('작은 화면에서만 보이게 남긴 말을 읽어 주셨군요.'), dev('그들이 서두르고 있어요. 다음이 마지막 조각입니다.')],
    },
  ],
  'after-7': [
    {
      log: {
        title: 'developer.log — 2016-11-24',
        lines: [
          { at: '23:41', text: '크롤러가 모든 페이지를 읽고 있다. 내가 쓴 글도, 주석도.', speaker: 'developer' },
          { at: '23:48', text: '그래도 크롤러는 원본 HTML 만 읽는다. 브라우저에서 실행돼야 보이는 것은 못 본다.', speaker: 'developer' },
          { at: '23:55', text: '그러니 조각을 화면 뒤에 나눠 숨긴다. 언젠가 누군가 F12 를 누르겠지.', speaker: 'developer', delay: 1200 },
        ],
      },
      lines: [dev('조각이 다 모였습니다.'), dev('마지막 문은 제가 열 수 없어요. 저는 HTML 밖에 쓸 수 없으니까요.'), n('…그럼 내가 직접 열어야 한다는 거구나.')],
    },
  ],
  // TODO(8단계·결말 작업): 서버가 꺼짐 → 도서관 의자에서 깨어남 → 모니터에 접속할 수 없는 페이지
  ending: [{ lines: [n('…')] }],
};
