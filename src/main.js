import './styles/base.css';
import './styles/stages.css';
import { loadProgress } from './core/state.js';
import { isFinished } from './core/game.js';
import { renderStart } from './screens/start.js';
import { renderMobile, isMobileDevice } from './screens/mobile.js';
import { renderIntro } from './screens/intro.js';
import { renderStage } from './screens/stage.js';
import { renderClear } from './screens/clear.js';
import { renderRanking } from './screens/ranking.js';

const app = document.getElementById('app');

/** 화면 이름 → render(root, { go }) 함수. render 는 정리 함수를 돌려줄 수 있다. */
const screens = {
  start: renderStart,
  mobile: renderMobile,
  intro: renderIntro,
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

const progress = loadProgress();
if (progress) {
  // 진행 중이면 모바일 감지를 하지 않는다.
  // 6단계에서 기기 모드를 켜고 새로고침하면 UA 가 모바일로 바뀌기 때문.
  go(isFinished(progress) ? 'clear' : 'stage');
} else {
  go(isMobileDevice() ? 'mobile' : 'start');
}
