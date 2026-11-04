// 담당: 정씨 · 모바일 안내 (PC 접속 안내, 링크 복사)

export function isMobileDevice() {
  const ua = navigator.userAgent;
  // iPadOS 는 Mac 으로 자신을 소개하므로 터치 지원 여부로 한 번 더 본다.
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function renderMobile(root) {
  root.innerHTML = `
    <section class="screen mobile-screen">
      <h1>PC에서 접속해 주세요</h1>
      <p>이 게임은 브라우저 개발자 도구(F12)로 푸는 퍼즐이라 모바일에서는 플레이할 수 없습니다.</p>
      <button type="button" class="primary" data-copy>링크 복사</button>
      <p class="muted" data-copied hidden>복사했습니다. PC 브라우저에 붙여 넣어 주세요.</p>
    </section>`;
  root.querySelector('[data-copy]').addEventListener('click', async () => {
    await navigator.clipboard.writeText(location.origin);
    root.querySelector('[data-copied]').hidden = false;
  });
}
