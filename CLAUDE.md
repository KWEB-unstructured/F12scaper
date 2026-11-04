# F12 이스케이프 — 작업 규칙

브라우저 개발자 도구로 푸는 웹 방탈출 게임. 기획 요약은 [docs/spec.md](docs/spec.md), 모듈·API 계약은 [docs/contracts.md](docs/contracts.md).

## 스택
- 프론트: Vite + Vanilla JS(ES 모듈) + 일반 CSS. JSDoc 으로 타입을 적는다.
- API: Vercel 서버리스 함수 (`api/*.js`, Node, `export default function handler(req, res)`)
- DB: Supabase Postgres. **서버(api/)에서 service_role 키로만 접근**한다.
- 해시: Web Crypto SHA-256 (`src/core/hash.js`)

## 명령
- `npm run dev` — Vite 개발 서버. `/api/*` 도 vite.config.js 의 플러그인이 같이 띄운다 (Vercel 로그인 불필요)
- `npm run build` — 프로덕션 빌드 (소스맵 포함)
- `npm run hash -- "정답"` — stageN.js 의 answerHash 값 만들기
- `.env.local` 이 없으면 API 는 mock 응답을 준다. 임시 정답은 `test1` ~ `test8`

## 이 게임이라서 지켜야 하는 규칙
1. **React·Vue·Tailwind 금지.** 플레이어가 Elements 에서 고친 DOM 을 프레임워크가 덮어쓰고, 유틸리티 클래스는 Styles 패널을 읽기 어렵게 만든다.
2. **퍼즐 대상 코드는 사람이 읽을 수 있어야 한다.** Sources 에서 읽힐 코드(7단계)는 `public/stages/` 에 둬서 번들·압축을 피한다.
3. **콘솔에서 부를 함수는 `window.xxx = ...` 로 직접 건다.** 모듈 스코프 함수는 콘솔에서 안 보인다. 단계를 떠날 때 mount 의 정리 함수에서 `delete window.xxx`.
4. **퍼즐 쿠키는 `document.cookie` 로만 심는다.** 서버가 심으면 HttpOnly 가 될 수 있다. 진행 상황은 쿠키가 아니라 localStorage(`src/core/state.js`)에 둔다.
5. **2단계 숨김 대상에 `hidden` 속성을 쓰지 않는다.** base.css 의 `[hidden] { display: none !important }` 때문에 Styles 에서 못 푼다. 인라인 `style="display: none"` 을 쓴다.
6. **모바일 감지는 진행 중인 게임이 없을 때만 한다.** 6단계에서 기기 모드로 새로고침하면 UA 가 모바일로 바뀐다 (`src/main.js` 참고).
7. **최종(8단계) 정답은 클라이언트 코드에 절대 넣지 않는다.** 서버 환경변수 `FINAL_ANSWER` 에만 둔다. 1~7단계 정답은 원문을 따로 적어 두지 말고 해시만 커밋한다 (퍼즐 안에 숨긴 원문은 예외).
8. **파일명·경로·클래스명에 `ad`, `ads`, `track`, `banner` 같은 단어를 쓰지 않는다.** 광고 차단 확장이 막는다.
9. **대사·힌트처럼 `<` 가 들어갈 수 있는 문구는 `textContent` 로 넣는다.** `innerHTML` 은 퍼즐 마크업에만 쓴다.
10. `crypto.subtle` 은 보안 컨텍스트(https 또는 localhost)에서만 동작한다. 다른 PC 에서 `http://192.168...` 로 접속해서 테스트하면 정답 확인이 안 된다.

## 담당 (파일 소유권)
다른 사람 담당 파일을 고쳐야 하면 PR 설명에 이유를 적고 담당자 리뷰를 받는다.
- **정씨 (프론트·UI)**: `index.html`, `src/styles/`, `src/screens/`, `src/stages/stage1.js` `stage2.js` `stage6.js`
- **형씨 (로직·스토리)**: `src/core/game.js` `state.js` `hash.js` `rules.js`, `src/content/`, `src/stages/stage3.js` `stage4.js` `stage7.js` `types.js`, `public/stages/`, `scripts/`
- **김씨 (백엔드·배포)**: `api/`, `supabase/`, `src/core/api.js`, `vite.config.js`, `src/stages/stage5.js` `stage8.js`, 배포 설정

## Git
- `main` 은 항상 배포 가능한 상태. 기능 브랜치(`정씨/stage2`, `김씨/api-start` 등)에서 작업하고 다른 한 명의 리뷰를 받아 합친다.
- `.env.local` 은 커밋하지 않는다.
- 코드 주석과 문서는 한국어로 쓴다.
