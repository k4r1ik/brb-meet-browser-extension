// Draws the "Be Right Back" card once. Small and static on purpose.
(function () {
  const WIDTH = 640;
  const HEIGHT = 360;
  const TEXT = 'Be Right Back';

  function draw(ctx) {
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(TEXT, WIDTH / 2, HEIGHT / 2);
  }

  // Ctor is injectable so tests can run without a browser.
  function createCard(Ctor = globalThis.OffscreenCanvas) {
    const canvas = new Ctor(WIDTH, HEIGHT);
    draw(canvas.getContext('2d'));
    return canvas;
  }

  const api = { WIDTH, HEIGHT, TEXT, createCard };
  globalThis.__brb = Object.assign(globalThis.__brb || {}, { card: api });
  if (typeof module !== 'undefined') module.exports = api;
})();
