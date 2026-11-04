// 단계 모듈 형식. 모든 stages/stageN.js 는 이 형식의 객체를 default export 한다.

/**
 * 단계 화면이 mount() 에 넘겨 주는 도구 모음
 * @typedef {Object} StageContext
 * @property {(fragment: string) => void} complete   입력창 없이 통과시킬 때 부른다 (3단계 등). fragment 는 이 단계의 조각
 * @property {(input: string) => Promise<boolean>} verify   input 이 이 단계 answerHash 와 맞는지 확인
 * @property {(text: string) => void} say            선배 조교 대사를 한 줄 추가
 * @property {(text: string) => void} taunt          유령 관리자 메시지를 띄움
 * @property {Readonly<Record<number, string>>} fragments   지금까지 얻은 조각 (8단계용)
 */

/**
 * @typedef {Object} Stage
 * @property {number} id
 * @property {string} title
 * @property {string} tool          클리어 카드에 쓰는 개발자 도구 기능 이름
 * @property {string} toolUsage     클리어 카드에 쓰는 "실무에서는 이렇게 쓴다" 한 줄
 * @property {string[]} guide       단계 시작 때 보여 줄 선배 조교 대사
 * @property {string | null} answerHash   SHA-256(SALT + normalize(정답)). `npm run hash -- "정답"` 으로 만든다. verify:'server' 면 null
 * @property {boolean} [input]      false 면 정답 입력창을 숨긴다 (기본 true)
 * @property {'local' | 'server'} [verify]  'server' 면 /api/verify 로 검증한다 (8단계만, 기본 'local')
 * @property {[string, string, string]} hints   힌트 1(방향) · 2(탭과 위치) · 3(거의 정답)
 * @property {string[]} [taunts]    오답일 때 유령 관리자 대사 (없으면 기본 대사)
 * @property {(el: HTMLElement, ctx: StageContext) => void | (() => void)} mount
 *           퍼즐 영역(el)에 퍼즐을 그린다. 단계를 떠날 때 정리할 게 있으면 정리 함수를 돌려준다
 *           (전역 함수 삭제, 타이머 해제, document.title 원복 등)
 */

export {};
