// 코어 로직 자체 점검: npm run selftest
// 해시(Node), 진행 저장(손상 데이터 복구), 4·7단계 조각이 answerHash 와 맞는지 확인한다.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { hashAnswer, normalize } from '../src/core/hash.js';

let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL ${name}\n     ${err.message}`);
  }
}

// ── localStorage / document 가짜 (state.js 가 쓰는 만큼만)
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => void store.set(k, String(v)),
  removeItem: (k) => void store.delete(k),
};
globalThis.document = { cookie: '' };
const KEY = 'f12escape:progress';
const state = await import('../src/core/state.js');

await test('normalize: 공백 제거 + 소문자', () => {
  assert.equal(normalize('  TeSt4 \n'), 'test4');
});

await test('해시: 브라우저(Web Crypto)와 같은 규칙, 공백·대소문자 무시', async () => {
  assert.equal(await hashAnswer(' TEST4 '), await hashAnswer('test4'));
  assert.match(await hashAnswer('test4'), /^[0-9a-f]{64}$/);
});

await test('진행 저장: 저장 → 읽기 왕복, 버전 필드', () => {
  const p = state.createProgress({ sessionId: 's1', nickname: 'n', startedAt: '2026-01-01T00:00:00Z' });
  assert.equal(p.version, state.SAVE_VERSION);
  assert.deepEqual(state.loadProgress(), JSON.parse(store.get(KEY)));
});

for (const [label, raw] of [
  ['깨진 JSON', '{not json'],
  ['버전 없는 옛 형식', JSON.stringify({ sessionId: 's', nickname: 'n', startedAt: 'x', stage: 3 })],
  ['엉뚱한 타입', JSON.stringify({ version: 1, sessionId: 5, stage: 'a' })],
  ['배열', '[]'],
  ['null', 'null'],
]) {
  await test(`손상된 저장 → 초기화 (${label})`, () => {
    store.set(KEY, raw);
    assert.equal(state.loadProgress(), null);
    assert.equal(store.has(KEY), false);
  });
}

await test('resetProgress: 저장과 role 쿠키 삭제', () => {
  state.createProgress({ sessionId: 's', nickname: 'n', startedAt: 'x' });
  state.resetProgress();
  assert.equal(store.has(KEY), false);
  assert.match(document.cookie, /role=; max-age=0/);
});

await test('getVerifyPayload: contracts.md 의 /api/verify 요청 형식', () => {
  const p = state.createProgress({ sessionId: 'sid', nickname: 'n', startedAt: 'x' });
  p.hints = { 1: 2 };
  p.stageTimes = { 1: 5000 };
  p.stage = 8;
  const body = state.getVerifyPayload(p, 'abc');
  assert.deepEqual(Object.keys(body).sort(), ['answer', 'hints', 'sessionId', 'stageTimes']);
  assert.deepEqual(body.hints, { 1: 2 });
  assert.equal(body.stageTimes[1], 5000);
  assert.ok(body.stageTimes[8] >= 0);
});

await test('answer.js: 5회째에 hint-suggest, 힌트를 썼으면 안 냄', async () => {
  const { recordWrong, bus } = await import('../src/core/answer.js');
  const seen = [];
  bus.addEventListener('hint-suggest', (e) => seen.push(e.detail.count));
  const p = state.createProgress({ sessionId: 's', nickname: 'n', startedAt: 'x' });
  for (let i = 0; i < 6; i++) recordWrong(p);
  assert.deepEqual(seen, [5]);
  p.stage = 2;
  p.hints[2] = 1;
  for (let i = 0; i < 6; i++) recordWrong(p);
  assert.deepEqual(seen, [5]);
});

// ── 4·7단계 조각이 answerHash 와 맞는지
await test('4단계: 인코딩된 조각 → answerHash 일치', async () => {
  const stage4 = (await import('../src/stages/stage4.js')).default;
  const host = { innerHTML: '', querySelector: () => ({ set textContent(v) { host.code = v; } }) };
  globalThis.document = { cookie: 'role=admin' };
  stage4.mount(host, { say() {}, taunt() {} });
  assert.equal(await hashAnswer(host.code), stage4.answerHash);
});

await test('7단계: flash 스크립트가 만드는 값 → answerHash 일치', async () => {
  const stage7 = (await import('../src/stages/stage7.js')).default;
  const shown = [];
  const box = { style: {}, set textContent(v) { shown.push(v); } };
  const win = {};
  runInNewContext(readFileSync(new URL('../public/stages/stage7-flash.js', import.meta.url), 'utf8'), { window: win, setTimeout, clearTimeout });
  win.stage7Flash.start(box);
  await new Promise((r) => setTimeout(r, 1800));
  win.stage7Flash.stop();
  const value = shown.find((v) => /^[a-z0-9]+$/.test(v));
  assert.ok(value, '조각이 한 번도 표시되지 않음');
  assert.equal(await hashAnswer(value), stage7.answerHash);
});

await test('7단계: 소스에 조각 원문이 문자열로 없음', async () => {
  const src = readFileSync(new URL('../public/stages/stage7-flash.js', import.meta.url), 'utf8');
  assert.equal(/['"`]test7['"`]/i.test(src), false);
});

if (failed) {
  console.log(`\n${failed}개 실패`);
  process.exit(1);
}
console.log('\n모두 통과');
