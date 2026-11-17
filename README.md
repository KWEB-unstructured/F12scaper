# F12scaper

브라우저 개발자 도구로 푸는 웹 방탈출 게임 **F12 이스케이프**.

## 시작하기
```bash
npm install
npm run dev        # http://localhost:5173 (API 포함)
```
Supabase 없이도 돌아간다 (API가 mock 응답). 임시 정답은 `test1` ~ `test8`.
실제 DB에 붙이려면 `.env.example` 을 `.env.local` 로 복사해 값을 채운다.

## 구조
```
index.html
src/
  main.js            화면 전환 (start/mobile/intro/stage/clear/ranking)
  screens/           화면 6개
  stages/            단계 모듈 stage1~8.js + types.js(형식)
  core/              game(진행 규칙) · state(저장) · hash · rules(감점) · api(fetch)
  content/story.js   스토리·공통 대사
  styles/            base.css(공통) · stages.css(퍼즐용)
public/stages/       번들하지 않는 퍼즐 스크립트 (7단계, Sources 탭용)
api/                 Vercel 서버리스 함수 (start, stage5, verify, ranking)
supabase/schema.sql  DB 테이블
scripts/hash.mjs     정답 해시 생성: npm run hash -- "정답"
scripts/encode-fragment.mjs  4·7단계 조각 인코딩: npm run encode -- "조각"
scripts/selftest.mjs 코어 로직 점검: npm run selftest
dev/test.html        로직 테스트용 임시 페이지 (npm run dev → /dev/test.html)
docs/                기획 요약(spec) · 팀 계약(contracts)
prompts/             팀원별 Claude Code 작업 프롬프트
```

## 정답·조각 바꾸기
```bash
npm run hash -- "정답"      # 1~7단계 입력 정답의 answerHash (소문자·앞뒤 공백 무시)
npm run encode -- "조각"    # 4·7단계: 화면에 보여 줄 조각을 인코딩 + answerHash 출력
npm run selftest            # 바꾼 뒤 해시와 조각이 맞는지 확인
```
- 4·7단계는 출력된 `CODES` 배열을 `src/stages/stage4.js` 와 `public/stages/stage7-flash.js` 에 붙이고 `answerHash` 도 단계 파일에 넣는다.
- 정답은 소문자·숫자 ASCII 로 정한다 (비교할 때 소문자로 바꾸므로). 원문은 커밋하지 않는다.
- 7단계 `stage7.js` 힌트 3 의 줄 번호(`showFlash(flashValue);` 줄)는 `stage7-flash.js` 를 고치면 같이 확인한다.

작업 규칙은 [CLAUDE.md](CLAUDE.md), 모듈·API 형식은 [docs/contracts.md](docs/contracts.md).
