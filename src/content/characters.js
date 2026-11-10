// 등장인물·진행 지표 라벨. 스토리가 아직 바뀌는 중이라 이름과 라벨은 여기서만 고친다.
// 담당: 형씨(문구) · 정씨(화면에서 쓰는 방식)

/**
 * 화자 종류. 대사창·말풍선·경고창이 이 키로 화자를 구분한다.
 * - narration: 내레이션·주인공 독백 (이름 표시 없음)
 * - browser:   안내자. 단계 대사와 힌트를 말한다
 * - security:  보안 시스템. 오답·차단 경고를 띄운다
 * - unknown:   정체를 모르는 존재 (콘솔·프롤로그)
 * @typedef {'narration' | 'browser' | 'security' | 'unknown'} SpeakerKey
 */

/** @type {Record<SpeakerKey, { name: string }>} */
export const SPEAKERS = {
  narration: { name: '' },
  browser: { name: '브라우저' },
  security: { name: '보안 시스템' },
  unknown: { name: 'UNKNOWN USER' },
};

/** 단계 대사·힌트에 화자를 적지 않았을 때의 기본 화자 */
export const DEFAULT_SPEAKER = 'browser';

/** 진행 지표 라벨. TODO(형씨): 이름 미정, 임시로 "탈출 진행률" */
export const PROGRESS_LABEL = '탈출 진행률';

/** 오답 경고 제목. count 는 이 단계의 오답 횟수 */
export const wrongAlertTitle = (count) => `비인가 접근 감지 (${count}회)`;
