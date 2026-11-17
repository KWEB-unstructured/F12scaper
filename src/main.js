import './styles/base.css';
import './styles/stages.css';
import './styles/prologue.css';
import { loadProgress, resetProgress } from './core/state.js';
import { isFinished } from './core/game.js';
import { renderStart } from './screens/start.js';
import { renderMobile, isMobileDevice } from './screens/mobile.js';
import { renderIntro } from './screens/intro.js';
import { renderPrologue } from './screens/prologue.js';
import { loadPrologue, savePrologue, clearPrologue, SCENES } from './screens/prologue-state.js';
import { renderStage } from './screens/stage.js';
import { renderClear } from './screens/clear.js';
import { renderRanking } from './screens/ranking.js';

const app = document.getElementById('app');

/** 화면 이름 → render(root, { go }) 함수. render 는 정리 함수를 돌려줄 수 있다. */
const screens = {
  start: renderStart,
  mobile: renderMobile,
  intro: renderIntro,
  prologue: renderPrologue,
  stage: renderStage,
  clear: renderClear,
  ranking: renderRanking,
};

let cleanup = null;

/** 화면 전환. render 안에서 go() 로 다른 화면으로 넘겨도 된다 (return go('clear')). */
function go(name) {
  cleanup?.();
  cleanup = null;
  app.replaceChildren();
  const result = screens[name](app, { go });
  if (typeof result === 'function') cleanup = result;
}

// 개발용 (npm run dev 에서만 동작, 배포판에서는 무시):
//   ?reset          진행·프롤로그를 모두 지우고 시작 화면부터
//   ?scene=archive  그 프롤로그 장면부터 (library | monitor | archive | glitch | trapped)
// 게임 안의 "처음부터 다시"(resetProgress)와는 별개다.
if (import.meta.env.DEV) {
  const params = new URLSearchParams(location.search);
  const scene = params.get('scene');
  if (params.has('reset') || scene) {
    resetProgress();
    clearPrologue();
    if (SCENES.includes(scene)) savePrologue({ scene, nickname: '개발자', printed: [] });
    history.replaceState(null, '', location.pathname);
  }
}

const progress = loadProgress();
if (progress) {
  // 진행 중이면 모바일 감지를 하지 않는다.
  // 6단계에서 기기 모드를 켜고 새로고침하면 UA 가 모바일로 바뀌기 때문.
  go(isFinished(progress) ? 'clear' : 'stage');
} else if (loadPrologue()) {
  // 프롤로그 도중: 저장된 장면부터 이어 간다 (갇힌 뒤라면 "도망칠 수 없습니다" 연출)
  go('prologue');
} else {
  go(isMobileDevice() ? 'mobile' : 'start');
}
