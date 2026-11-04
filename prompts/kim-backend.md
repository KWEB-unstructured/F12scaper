# 김씨 (백엔드·배포 리드) — Claude Code 작업 프롬프트

**쓰는 법**: 레포 루트에서 Claude Code 를 열고, 해당 주차의 코드 블록을 통째로 붙여 넣는다.
CLAUDE.md 는 자동으로 읽히므로 규칙은 다시 설명하지 않아도 된다.
작업 전에 브랜치를 만든다: `git switch -c 김씨/<작업명>`

담당 파일: `api/`, `supabase/`, `src/core/api.js`, `vite.config.js`, `src/stages/stage5.js` `stage8.js`, 배포 설정

> Vercel·Supabase 계정 생성, 프로젝트 연결, 환경변수 입력처럼 대시보드에서 해야 하는 일은 Claude 가 대신 못 할 수 있다. 그럴 때는 단계별 안내를 받아 직접 하고, 끝나면 Claude 에게 알려 준다.

---

## 1주차 — Git·Vercel 연결, API 명세 확정, DB 테이블 생성

```
나는 이 프로젝트에서 백엔드·배포 담당(김씨)이야. 이번 주 목표는 배포 파이프라인 연결, API 명세 확정, DB 테이블 생성이야.
(Vite 프로젝트와 Git 저장소는 이미 만들어져 있어.)

먼저 읽어 줘: CLAUDE.md, docs/contracts.md, vite.config.js, api/ 전체, supabase/schema.sql, src/core/api.js, .env.example

할 일
1. API 명세 검토: docs/contracts.md 3절의 요청·응답 형식을 검토해 줘.
   - 특히 /api/verify: 클라이언트가 보내는 hints·stageTimes 를 어디까지 믿을지, 세션 하나로 verify 를 여러 번 부르는 경우,
     정답 무차별 대입(같은 세션 반복 요청) 방어가 필요한지 판단해서 변경안을 제안해 줘.
   - 내가 승인하면 contracts.md 와 api/ 주석, src/core/api.js 의 JSDoc 을 같이 고친다.
2. Supabase: 프로젝트 생성 후 supabase/schema.sql 을 SQL Editor 에서 실행하는 과정을 안내해 줘.
   - RLS 가 켜져 있고 정책이 없는지 확인하는 SQL 도 알려 줘.
   - 무료 플랜은 1주일 동안 요청이 없으면 일시정지된다. 테스트·출시 기간 대응 방법을 제안해 줘.
3. Vercel: GitHub 저장소 KWEB-unstructured/F12scaper 를 Vercel 에 연결하는 과정을 안내해 줘.
   - 프레임워크 프리셋 Vite, api/ 폴더가 서버리스 함수로 올라가는지 확인.
   - 환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FINAL_ANSWER 를 Production/Preview 에 등록. FINAL_ANSWER 는 형씨가 확정하면 넣는다.
   - 프리뷰 배포에서 /api/ranking 이 mock 이 아닌 응답(501 이어도 됨)을 주는지 확인.
4. 로컬 개발: vite.config.js 의 local-vercel-api 플러그인이 Vercel 런타임과 다르게 동작할 수 있는 부분(req.body 파싱, 헤더, 에러 처리)을 점검하고 차이가 있으면 맞춰 줘.

완료 기준
- main 푸시 → Vercel 자동 배포가 되고, 배포 URL 에서 게임이 1단계까지 열린다.
- Supabase 에 sessions·rankings 테이블이 있고, anon 키로는 접근이 막혀 있다.
- .env.local 은 커밋되지 않았다. 담당 외 파일은 수정하지 않는다.
```

---

## 2주차 — /api/start, /api/stage5, 5단계

```
나는 백엔드·배포 담당(김씨)이야. 이번 주는 /api/start, /api/stage5 와 5단계 퍼즐이야.

먼저 읽어 줘: CLAUDE.md, docs/contracts.md, docs/story.md(있으면), api/_lib/*, api/start.js, api/stage5.js, src/stages/stage5.js, src/screens/intro.js(읽기만)

할 일
1. /api/start (api/start.js)
   - sessions 에 insert 하고 id, started_at 을 { sessionId, startedAt } 로 돌려준다. started_at 은 반드시 DB 기본값 now() 를 쓴다(클라이언트 시각 금지).
   - 닉네임 검증: 앞뒤 공백 제거, 1~16자, 제어문자 금지, 비속어 필터.
     비속어 목록은 api/_lib/profanity.js 에 두고, 글자 사이에 공백·특수문자를 끼워 넣는 우회를 정규화해서 걸러 낸다.
   - Supabase 환경변수가 없을 때의 mock 응답은 유지한다 (정씨·형씨 로컬 개발용).
2. 5단계 퍼즐 (api/stage5.js + src/stages/stage5.js)
   - 화면: 버튼을 누르면 "실패"만 뜬다. 단서는 화면에 절대 보여 주지 않는다.
   - /api/stage5 는 항상 실패 상태 코드(예: 403 또는 418 등, 이야기에 맞게)를 보낸다. 단서를 응답 본문과 커스텀 헤더에 나눠 담아 둘 다 봐야 정답을 알 수 있게 한다.
   - 플레이어가 Network 탭에서 요청을 클릭 → Headers / Response(Preview) 를 보는 흐름. 상태 코드가 빨갛게 보이는 것 자체가 단서의 시작이다.
   - 헤더 이름·경로에 ad/track 같은 단어 금지. Cache-Control: no-store 유지.
   - 정답 해시는 npm run hash 로 만든다. 힌트 3개와 대사 초안은 형씨에게 넘길 수 있게 작성.
3. 광고 차단 확장(uBlock Origin 등)을 켠 크롬에서 /api/start, /api/stage5 가 막히지 않는지 확인하는 방법을 안내해 줘.

완료 기준
- .env.local 에 Supabase 값을 넣으면 실제 sessions 행이 생기고, 빼면 mock 으로 동작한다.
- 5단계를 Network 탭만으로 풀 수 있다. 화면·콘솔에는 단서가 없다.
- npm run build 통과, 프리뷰 배포에서도 동작. 담당 외 파일은 수정하지 않는다.
```

---

## 3주차 — /api/verify, /api/ranking, 8단계, 실제 배포

```
나는 백엔드·배포 담당(김씨)이야. 이번 주는 /api/verify, /api/ranking, 8단계, 실제 배포야.

먼저 읽어 줘: CLAUDE.md, docs/contracts.md, api/verify.js, api/ranking.js, src/core/rules.js, src/stages/stage8.js, src/screens/stage.js 의 verify 호출 부분(읽기만)

할 일
1. /api/verify (api/verify.js) — 파일 안의 TODO 순서대로
   - sessions 조회: 없는 세션 → 400 invalid_session, 이미 finished_at 이 있으면 저장된 결과를 그대로 돌려주거나 400 (계약대로).
   - 오답은 { ok: false }. 같은 세션의 오답 시도 횟수를 제한할지 1주차 결정대로 적용.
   - finalTime = (지금 - sessions.started_at) + penaltyMsFromHints(hints). src/core/rules.js 를 그대로 import 해서 클라이언트와 같은 규칙을 쓴다.
   - hints 값 검증: 단계 1~8, 단계당 0~3, 정수만. 이상하면 400.
   - 비현실적으로 짧은 기록 기준(예: 실제 경과 시간 5분 미만)을 상수로 두고, 해당하면 rankings 에 넣지 않고 rank: null.
   - sessions 업데이트(finished_at, hints_used, stage_times) → rankings insert → 순위 계산(final_time 이 더 작은 행 수 + 1).
   - 여러 쿼리가 중간에 실패해도 데이터가 어긋나지 않게 순서와 에러 처리를 신경 쓴다. 필요하면 Postgres 함수(RPC)로 묶는 안을 제안해 줘.
2. /api/ranking: final_time 오름차순 상위 50명. 응답 형식은 contracts.md 그대로 (camelCase).
3. 8단계 (src/stages/stage8.js): 관리자 패널의 마지막 자물쇠. ctx.fragments 로 1~7단계 조각을 보여 주고, 형씨가 확정한 조합 규칙을 퍼즐로 제시한다.
   - 최종 정답 원문은 클라이언트 코드·레포 어디에도 두지 않는다. 서버 FINAL_ANSWER 환경변수에만.
   - 힌트 3개·대사 초안 작성.
4. 실제 배포: Production 환경변수 확인, 프로덕션 URL 에서 시작 → 8단계 → 클리어 → 랭킹까지 한 판 진행.
   - VERCEL_ENV=production 인데 FINAL_ANSWER 가 비어 있으면 500 이 나는지 확인.

완료 기준
- 실제 DB 로 한 판 끝내면 sessions·rankings 에 행이 생기고, 랭킹 화면에 보인다.
- curl 로 위조 요청(hints 음수·과다, 없는 세션, 같은 세션 반복)을 보내도 랭킹이 오염되지 않는다. 테스트한 curl 명령을 정리해 줘.
- npm run build 통과. 담당 외 파일은 수정하지 않는다.
```

---

## 4주차 — 브라우저·광고 차단 환경 점검, 이상 기록 필터, 최종 배포

```
나는 백엔드·배포 담당(김씨)이야. 이번 주는 환경 점검, 이상 기록 필터 보강, 최종 배포야.

할 일
1. 호환성 점검표(docs/compat-checklist.md): 크롬·엣지 최신, 광고 차단 확장(uBlock Origin, AdBlock) 켬/끔, 시크릿 모드에서
   1~8단계 각각이 동작하는지 확인할 항목을 만들어 줘. 문제가 생기면 시크릿 모드 안내 문구를 어디에 띄울지도 제안.
2. 이상 기록: 테스트 기간 sessions 데이터를 보고 "비현실적으로 짧은 기록" 기준을 조정. 단계별 stage_times 합과 서버 경과 시간이 크게 어긋나는 기록도 제외할지 판단.
   테스트·개발 중 쌓인 기록을 출시 전에 정리하는 SQL 을 써 줘 (실행 전에 나에게 확인받기).
3. 운영: Supabase 일시정지 대응, Vercel 함수 에러 로그 보는 법, 출시 후 첫 2주 플레이 수(목표 100회)를 sessions 로 집계하는 SQL.
4. 최종 배포 전 점검: 환경변수, .env.local 미커밋, 프로덕션에서 mock 응답이 나오지 않는지(mock: true 필드), 소스맵에 비밀값이 없는지.
```
