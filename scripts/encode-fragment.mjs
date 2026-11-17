// 퍼즐에 숨길 조각 인코딩: npm run encode -- "조각"
// 출력된 CODES 배열을 4단계(src/stages/stage4.js)와 7단계(public/stages/stage7-flash.js)에 붙여 넣는다.
// 두 파일의 maskAt() 과 같은 규칙: 글자 코드 XOR ((i * 7 + 13) & 63). ASCII 글자만 지원한다.
// 조각 원문은 커밋하지 않는다. 출력되는 answerHash 도 해당 단계 파일에 같이 넣는다.
import { normalize, hashAnswer } from '../src/core/hash.js';

const maskAt = (i) => (i * 7 + 13) & 63;

if (process.argv.length !== 3) {
  console.error('사용법: npm run encode -- "조각"');
  process.exit(1);
}
const fragment = normalize(process.argv[2]);
if ([...fragment].some((c) => c.charCodeAt(0) > 127)) {
  console.error('ASCII 글자(영문 소문자·숫자)만 쓸 수 있어요.');
  process.exit(1);
}
const codes = [...fragment].map((ch, i) => ch.charCodeAt(0) ^ maskAt(i));
console.log(`const CODES = [${codes.join(', ')}];`);
console.log(`answerHash: '${await hashAnswer(fragment)}',`);
