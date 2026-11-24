// 등장인물·진행 지표 라벨. 스토리가 아직 바뀌는 중이라 이름과 라벨은 여기서만 고친다.
// 담당: 형씨(문구) · 정씨(화면에서 쓰는 방식)
// 2026-11-24 결정: 시작 대사·힌트는 주인공 독백, 개발자 메시지는 퍼즐·장면 안에서만, 오답 경고는 크롤러.

/**
 * 화자 종류. 대사창·정보 표시줄·경고창이 이 키로 화자를 구분한다.
 * - narration: 주인공 독백·내레이션. 시작 대사와 힌트의 기본 화자 (이름 표시 없음)
 * - developer: 10년 전 개발자가 남긴 메시지. 퍼즐 안·이야기 장면에서만 나온다
 * - crawler:   크롤러. 오답·차단 경고를 띄운다
 * @typedef {'narration' | 'developer' | 'crawler'} SpeakerKey
 */

/**
 * name: 4단계 반전(크롤러 관리 프로그램 로그) 이후 이름
 * hiddenName: 반전 전에 보여 줄 이름. 전반부에는 정체를 숨긴다
 * @type {Record<SpeakerKey, { name: string, hiddenName?: string }>}
 */
export const SPEAKERS = {
  narration: { name: '' },
  developer: { name: '개발자', hiddenName: '???' }, // TODO(형씨): 개발자 이름 보류 중. 정해지면 name 만 바꾼다
  crawler: { name: '크롤러', hiddenName: '알 수 없는 프로세스' },
};

/** 단계 대사·힌트에 화자를 적지 않았을 때의 기본 화자 (주인공 독백) */
export const DEFAULT_SPEAKER = 'narration';

/**
 * 화면에 보일 화자 이름.
 * @param {SpeakerKey} key
 * @param {boolean} revealed 4단계 반전 장면을 봤는지 (screens/scenes-state.js 의 isRevealed)
 */
export const speakerName = (key, revealed) => {
  const s = SPEAKERS[key];
  if (!s) return '';
  return revealed || !s.hiddenName ? s.name : s.hiddenName;
};

/** 진행 지표 라벨. 1~7단계에서 인증 키 조각을 하나씩 모은다 */
export const PROGRESS_LABEL = '인증 키 조각';

/** 오답 경고 제목. count 는 이 단계의 오답 횟수 */
export const wrongAlertTitle = (count) => `비인가 접근 감지 (${count}회)`;
