const test = require('node:test');
const assert = require('node:assert');
const { createRelay } = require('../src/page/relay.js');

const flush = () => new Promise((r) => setImmediate(r));

function setup(over = {}) {
  const written = [];
  const closed = [];
  const timers = [];
  const cleared = [];
  const clones = [];
  const generator = {
    writable: { getWriter: () => ({ write: async (f) => { written.push(f); } }) },
    clone: () => { const c = {}; clones.push(c); return c; },
  };
  const readers = [];
  const makeProcessor = (track) => {
    let resolveNext = [];
    const r = {
      track,
      cancelled: false,
      queue: [],
      read: () => (r.queue.length ? Promise.resolve(r.queue.shift()) : new Promise((res) => resolveNext.push(res))),
      cancel: () => { r.cancelled = true; resolveNext.forEach((res) => res({ done: true })); },
      push(value) { const item = { value, done: false }; resolveNext.length ? resolveNext.shift()(item) : r.queue.push(item); },
    };
    readers.push(r);
    return { readable: { getReader: () => r } };
  };
  const camera = (name = 'cam') => ({
    name, stopped: 0, constraints: [],
    stop() { this.stopped += 1; },
    getSettings: () => ({ width: 1280, height: 720, deviceId: 'real' }),
    getCapabilities: () => ({ width: { max: 1920 } }),
    applyConstraints: async function (c) { this.constraints.push(c); },
  });
  const frame = (id) => ({ id, close() { closed.push(id); } });
  const relay = createRelay(Object.assign({
    makeGenerator: () => generator,
    makeProcessor,
    makeFrame: (canvas, ts) => frame('card@' + ts),
    setInterval: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    clearInterval: (id) => cleared.push(id),
    card: { canvas: true },
  }, over));
  return { relay, written, closed, timers, cleared, clones, readers, camera, frame };
}

test('setCard writes a card frame at once and then on every tick, with increasing timestamps', async () => {
  const s = setup();
  s.relay.setCard();
  assert.strictEqual(s.relay.getSource(), 'card');
  assert.strictEqual(s.timers[0].ms, 500);
  s.timers[0].fn();
  await flush();
  assert.deepStrictEqual(s.written.map((f) => f.id), ['card@500000', 'card@1000000']);
  assert.deepStrictEqual(s.closed, ['card@500000', 'card@1000000']);
});

test('camera frames are written and closed', async () => {
  const s = setup();
  s.relay.setCamera(s.camera());
  assert.strictEqual(s.relay.getSource(), 'camera');
  s.readers[0].push(s.frame('f1'));
  s.readers[0].push(s.frame('f2'));
  await flush();
  assert.deepStrictEqual(s.written.map((f) => f.id), ['f1', 'f2']);
  assert.deepStrictEqual(s.closed, ['f1', 'f2']);
});

test('camera -> card stops the real camera and drops late camera frames', async () => {
  const s = setup();
  const cam = s.camera();
  s.relay.setCamera(cam);
  s.relay.setCard();
  assert.strictEqual(cam.stopped, 1);
  assert.strictEqual(s.readers[0].cancelled, true);
  s.readers[0].push(s.frame('late'));
  await flush();
  assert.ok(!s.written.some((f) => f.id === 'late'));
  assert.strictEqual(s.relay.getSource(), 'card');
});

test('card -> camera clears the card timer and ignores a stale tick', async () => {
  const s = setup();
  s.relay.setCard();
  s.relay.setCamera(s.camera());
  assert.deepStrictEqual(s.cleared, [1]);
  s.timers[0].fn();
  await flush();
  assert.strictEqual(s.written.length, 1); // only the first immediate card frame
});

test('camera -> camera stops the previous track', () => {
  const s = setup();
  const a = s.camera('a');
  const b = s.camera('b');
  s.relay.setCamera(a);
  s.relay.setCamera(b);
  assert.strictEqual(a.stopped, 1);
  assert.strictEqual(b.stopped, 0);
});

test('a processor that throws stops the track and falls back to the card (fail closed)', () => {
  const s = setup({ makeProcessor: () => { throw new Error('nope'); } });
  const cam = s.camera();
  const ok = s.relay.setCamera(cam);
  assert.strictEqual(ok, false);
  assert.strictEqual(cam.stopped, 1);
  assert.strictEqual(s.relay.getSource(), 'card');
});

test('a card frame error does not throw out of the timer', async () => {
  let n = 0;
  const s = setup({ makeFrame: () => { n += 1; throw new Error('frame'); } });
  s.relay.setCard();
  assert.doesNotThrow(() => s.timers[0].fn());
  await flush();
  assert.strictEqual(n, 2);
});

test('a write error is swallowed and the frame is still closed', async () => {
  const closed = [];
  const failing = setup({
    makeGenerator: () => ({ writable: { getWriter: () => ({ write: async () => { throw new Error('w'); } }) }, clone: () => ({}) }),
    makeFrame: (c, ts) => ({ id: ts, close() { closed.push(ts); } }),
  });
  failing.relay.setCard();
  await flush();
  assert.deepStrictEqual(closed, [500000]);
});

test('camera ending on its own stops feeding and does not show the card', async () => {
  const s = setup();
  s.relay.setCamera(s.camera());
  s.readers[0].cancel(); // simulates done: true
  await flush();
  assert.strictEqual(s.relay.getSource(), 'none');
});

test('stop() stops the camera and clears everything', () => {
  const s = setup();
  const cam = s.camera();
  s.relay.setCamera(cam);
  s.relay.stop();
  assert.strictEqual(cam.stopped, 1);
  assert.strictEqual(s.relay.getSource(), 'none');
});

test('clone reports the deviceId Meet asked for, camera settings, and forwards applyConstraints', async () => {
  const s = setup();
  const cam = s.camera();
  s.relay.setCamera(cam);
  const c = s.relay.clone('chosen-id');
  assert.deepStrictEqual(c.getSettings(), { width: 1280, height: 720, deviceId: 'chosen-id' });
  assert.deepStrictEqual(c.getCapabilities(), { width: { max: 1920 } });
  await c.applyConstraints({ frameRate: 15 });
  assert.deepStrictEqual(cam.constraints, [{ frameRate: 15 }]);
});

test('clone in card mode reports card size, empty capabilities, and applyConstraints always resolves', async () => {
  const s = setup();
  s.relay.setCard();
  const c = s.relay.clone('brb-camera');
  assert.deepStrictEqual(c.getSettings(), { width: 640, height: 360, deviceId: 'brb-camera' });
  assert.deepStrictEqual(c.getCapabilities(), {});
  await c.applyConstraints({ width: 1 });
});
