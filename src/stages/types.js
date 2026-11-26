// 단계 모듈 형식. 모든 stages/stageN.js 는 이 형식의 객체를 default export 한다.

/**
 * 대사 한 줄. 문자열이면 기본 화자(주인공 독백)다.
 * 다른 화자가 말하게 하려면 { speaker, text } 로 쓴다 (화자 키: narration · developer · crawler).
 * 화자 이름은 문자열에 적지 않는다 (content/characters.js 에서 관리, 4단계 반전 전에는 정체를 숨긴 이름).
 * @typedef {string | { speaker: import('../content/characters.js').SpeakerKey, text: string }} GuideLine
 */

/**
 * 단계 화면이 mount() 에 넘겨 주는 도구 모음
 * @typedef {Object} StageContext
 * @property {(fragment: string) => void} complete   입력창 없이 통과시킬 때 부른다 (3단계 등). fragment 는 이 단계의 조각
 * @property {(input: string) => Promise<boolean>} verify   input 이 이 단계 answerHash 와 맞는지 확인
 * @property {(line: GuideLine) => void} say        대사 한 줄 추가 (문자열이면 주인공 독백)
 * @property {(text: string) => void} taunt          크롤러 경고를 띄움
 * @property {Readonly<Record<number, string>>} fragments   지금까지 얻은 조각 (8단계용)
 * @property {(id: string) => Promise<void>} playScene
 *           이야기 장면(content/interludes.js 의 id)을 화면 전체에 덮어 튼다. 끝나면 풀린다.
 *           이미 본 장면이면 바로 풀린다 (새로고침이 퍼즐의 일부인 4단계에서도 한 번만 나온다)
 */

/**
 * @typedef {Object} Stage
 * @property {number} id
 * @property {string} title
 * @property {string} tool          클리어 카드에 쓰는 개발자 도구 기능 이름
 * @property {string} toolUsage     클리어 카드에 쓰는 "실무에서는 이렇게 쓴다" 한 줄
 * @property {GuideLine[]} guide    단계 시작 때 보여 줄 대사 (기본 화자: 주인공 독백)
 * @property {string | null} answerHash   SHA-256(SALT + normalize(정답)). `npm run hash -- "정답"` 으로 만든다. verify:'server' 면 null
 * @property {boolean} [input]      false 면 정답 입력창을 숨긴다 (기본 true)
 * @property {'local' | 'server' | 'terminate'} [verify]  검증 방식 (기본 'local')
 *           - 'local': 입력값 해시를 answerHash 와 비교
 *           - 'server': 입력창 값을 /api/verify 로 검증 (예전 8단계 방식)
 *           - 'terminate': 입력창 없이, 플레이어가 콘솔에서 fetch('/system/terminate') 로 키를 보낸다 (새 8단계 방식, 2026-11-24 결정 1)
 * @property {[string, string, string]} hints   힌트 1(방향) · 2(탭과 위치) · 3(거의 정답). 주인공 독백으로 보여 준다
 * @property {string[]} [taunts]    오답일 때 크롤러 경고 본문 (없으면 content/story.js 의 기본 경고)
 * @property {(el: HTMLElement, ctx: StageContext) => void | (() => void)} mount
 *           퍼즐 영역(el)에 퍼즐을 그린다. 단계를 떠날 때 정리할 게 있으면 정리 함수를 돌려준다
 *           (전역 함수 삭제, 타이머 해제, document.title 원복 등)
 */

export {};
