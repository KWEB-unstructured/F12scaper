import './styles/base.css';
import './styles/stages.css';
import './styles/prologue.css';
import './styles/interlude.css';
import { loadProgress, resetProgress, createProgress, saveProgress } from './core/state.js';
import { isFinished, TOTAL_STAGES } from './core/game.js';
import { renderStart } from './screens/start.js';
import { renderMobile, isMobileDevice } from './screens/mobile.js';
import { renderIntro } from './screens/intro.js';
import { renderPrologue } from './screens/prologue.js';
import { loadPrologue, savePrologue, clearPrologue, SCENES } from './screens/prologue-state.js';
import { clearScenes, saveScenes } from './screens/scenes-state.js';
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
//   ?stage=6        그 단계부터 바로 (서버 없이 개발용 진행을 만든다. 앞 단계 조각은 비어 있다)
//   ?interlude=after-3  그 이야기 장면부터 (content/interludes.js 의 id). 장면이 끝나면 이어지는 단계로
//                   (after-N → N+1단계, reveal → 4단계, ending → 클리어 화면, 그 밖은 1단계. ?stage= 를 같이 주면 그 단계)
if (import.meta.env.DEV) {
  const params = new URLSearchParams(location.search);
  const scene = params.get('scene');
  const interlude = params.get('interlude');
  const after = /^after-(\d)$/.exec(interlude ?? '');
  const stage =
    Number(params.get('stage')) ||
    (after ? Number(after[1]) + 1 : interlude === 'reveal' ? 4 : interlude && interlude !== 'ending' ? 1 : 0);
  if (params.has('reset') || scene || params.has('stage') || interlude) {
    resetProgress();
    clearPrologue();
    clearScenes();
    if (SCENES.includes(scene)) savePrologue({ scene, nickname: '개발자', printed: [] });
    if (Number.isInteger(stage) && stage >= 1 && stage <= TOTAL_STAGES) {
      // 진행 저장 형식은 core/state.js 가 정한다. 만든 뒤 단계 번호만 바꾼다.
      // sessionId 를 고정해 두면 같은 탭에서는 시작 대사창을 한 번만 본다 (다시 보려면 새 탭)
      const p = createProgress({ sessionId: 'dev-local', nickname: '개발자', startedAt: new Date().toISOString() });
      p.stage = stage;
      saveProgress(p);
    }
    if (interlude === 'ending') {
      // 결말은 클리어 화면이 튼다: 다 깬 진행 + 가짜 결과
      const p = createProgress({ sessionId: 'dev-local', nickname: '개발자', startedAt: new Date().toISOString() });
      p.stage = TOTAL_STAGES + 1;
      p.result = { finalTime: 0, rank: null };
      saveProgress(p);
    }
    if (interlude) saveScenes({ seen: [], pending: [interlude], revealed: false });
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
