// 크롤러 흔적 (2026-11-24 결정 4: A 푼 뒤에만 되돌림 + B 퍼즐과 무관한 흔적만)
// 담당: 형씨(어느 단계에 무슨 흔적을 낼지·문구) · 정씨(연출은 screens/stage.js, 콘솔 출력은 ui/console-log.js)
// TODO(형씨): 아래는 정씨가 연출을 시험하려고 넣은 초안이다. 단계 목록과 문구를 정해 주세요.
//
// 금지: 퍼즐을 푸는 도중에 되돌리기 (초보자가 막힌다). 되돌리기는 정답을 맞힌 직후에만 한다.

/**
 * A. 통과 직후 되돌리기: 이 단계들은 정답을 맞히면, 플레이어가 Elements·Styles 로 고쳐 둔 퍼즐 화면을
 * 크롤러가 처음 모습으로 되돌린다 (화면이 잠깐 지직거린 뒤 원래대로 + 콘솔에 복구 로그).
 * 퍼즐 화면이 처음과 같으면(고친 게 없으면) 아무 일도 없다.
 * 화면이 스스로 바뀌는 단계(3단계 콘솔 연출·7단계 깜빡임 등)는 넣지 않는다. 플레이어가 안 고쳐도 "복구"가 떠 버린다.
 */
export const REVERT_STAGES = [1, 2];

/** @param {number} stageId */
export const revertLog = (stageId) => `변경 사항 감지 · 원래대로 복구 · /room/${stageId}`;

/**
 * B. 콘솔 흔적: 단계에 들어올 때마다 크롤러 로그를 찍는다.
 * N단계에서는 1~N단계 줄을 모두 다시 찍어서, 단계가 갈수록 콘솔의 정체불명 줄이 늘어난다.
 * 4단계 반전 전에도 [crawler] 태그는 그대로 보인다 (프롤로그 콘솔의 회색 기록과 같은 모습).
 * @type {Record<number, string[]>}
 */
export const STAGE_TRACES = {
  1: ['visitor 2 · /room/1 · 관찰 시작'],
  2: ['visitor 2 · 페이지 구조 열람 감지'],
  3: ['visitor 2 · 콘솔 사용 감지 · 이 채널은 읽을 수 없음'],
  4: ['visitor 2 · 신원 정보 조회 시도 예상 · 감시 등급 상향'],
  5: ['visitor 1 의 흔적 발견 · 관리자 계정 · 격리 상태 정상', 'visitor 2 · 서버 요청 감시 시작'],
  6: ['visitor 2 · 화면 크기 변경 감지 · 원인 불명'],
  7: ['격리 대상 2 · 탈출 경로 접근 · 모든 페이지 잠금 준비', '█▓▒░ 신호 손실 ░▒▓█'],
  8: ['종료 명령은 허가되지 않습니다', '종료 명령은 허가되지 않습니다', '종료 명령은'],
};

/** @param {number} stageId 1~stageId 단계의 콘솔 흔적을 차례로 */
export const tracesUpTo = (stageId) =>
  Object.entries(STAGE_TRACES)
    .filter(([id]) => Number(id) <= stageId)
    .flatMap(([, lines]) => lines);
