// 7단계 퍼즐 스크립트 (담당: 형씨)
// 이 파일은 public/ 에 있어서 Vite 가 번들·압축하지 않는다.
// 플레이어가 Sources 탭에서 이 파일을 열어 읽고 중단점을 걸 줄을 찾을 수 있게,
// 변수명과 줄 구성을 사람이 읽기 좋게 유지한다. (줄 번호를 바꾸면 stage7.js 의 힌트 3 도 같이 고칠 것)
//
// 흐름: start() → flashOnce() 를 GAP_MS 마다 반복
//       flashOnce(): 조각을 조립하고(assembleParts) → FLASH_MS 동안만 화면에 보여 준다(showFlash)
// 광과민성 배려: 색 반전·강한 번쩍임 없이, 어두운 칸 안에서 글자가 잠깐 나타났다 사라지는 정도로만 한다.

(function () {
  const FLASH_MS = 100; // 조각이 화면에 머무는 시간
  const GAP_MS = 3000; // 다음 깜빡임까지의 간격

  // 화면에 보여 줄 조각 (퍼즐 안에 숨긴 원문이라 커밋 예외. CLAUDE.md 규칙 7)
  // 글자 코드 XOR maskAt(i) 로 인코딩해 둔다. 바꿀 때: npm run encode -- "조각"
  const CODES = [121, 113, 104, 86, 30];

  let box = null;
  let nextTimer = null;
  let hideTimer = null;
  let flashCount = 0;

  function maskAt(index) {
    return (index * 7 + 13) & 63;
  }

  function assembleParts(codes) {
    let result = '';
    for (let i = 0; i < codes.length; i++) {
      result += String.fromCharCode(codes[i] ^ maskAt(i));
    }
    return result;
  }

  function showFlash(value) {
    box.textContent = value;
    box.style.opacity = '1';
    hideTimer = setTimeout(function () {
      box.textContent = '신호 대기 중... (' + flashCount + '회 수신)';
      box.style.opacity = '0.45';
    }, FLASH_MS);
  }

  function flashOnce() {
    flashCount += 1;
    const flashValue = assembleParts(CODES);
    showFlash(flashValue);
    nextTimer = setTimeout(flashOnce, GAP_MS);
  }

  function stop() {
    clearTimeout(nextTimer);
    clearTimeout(hideTimer);
    box = null;
  }

  function start(target) {
    stop();
    box = target;
    box.textContent = '신호 대기 중...';
    box.style.opacity = '0.45';
    nextTimer = setTimeout(flashOnce, 1500);
  }

  window.stage7Flash = { start: start, stop: stop };
})();
