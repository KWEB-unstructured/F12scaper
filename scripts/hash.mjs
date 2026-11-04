// 정답 해시 만들기: npm run hash -- "정답"
// 출력값을 stages/stageN.js 의 answerHash 에 넣는다. 정답 원문은 커밋하지 않는다.
import { hashAnswer, normalize } from '../src/core/hash.js';

const answers = process.argv.slice(2);
if (answers.length === 0) {
  console.error('사용법: npm run hash -- "정답" ["정답2" ...]');
  process.exit(1);
}
for (const answer of answers) {
  console.log(`${normalize(answer)}\t${await hashAnswer(answer)}`);
}
