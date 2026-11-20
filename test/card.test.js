const test = require('node:test');
const assert = require('node:assert');
const { createCard, WIDTH, HEIGHT, TEXT } = require('../src/page/card.js');

test('card is 640x360 and draws the text once', () => {
  const calls = [];
  const ctx = new Proxy({}, { get: (_, k) => (...a) => calls.push([k, ...a]), set: (_, k, v) => { calls.push([k, v]); return true; } });
  class FakeCanvas { constructor(w, h) { this.w = w; this.h = h; } getContext() { return ctx; } }
  const canvas = createCard(FakeCanvas);
  assert.strictEqual(canvas.w, 640);
  assert.strictEqual(canvas.h, 360);
  assert.strictEqual(WIDTH, 640);
  assert.strictEqual(HEIGHT, 360);
  const texts = calls.filter((c) => c[0] === 'fillText');
  assert.strictEqual(texts.length, 1);
  assert.strictEqual(texts[0][1], TEXT);
});
