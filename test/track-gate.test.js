const test = require('node:test');
const assert = require('node:assert');
const { createGate, IDLE_MS } = require('../src/page/track-gate.js');

function env(over = {}) {
  class Track {
    constructor(kind) { this.kind = kind; this._enabled = true; this.stopped = 0; }
    get enabled() { return this._enabled; }
    set enabled(v) { this._enabled = !!v; }
    clone() { const c = new Track(this.kind); c._enabled = this._enabled; return c; }
    stop() { this.stopped += 1; }
  }
  class Stream {
    constructor(tracks) { this.tracks = tracks; }
    getTracks() { return this.tracks; }
    clone() { return new Stream(this.tracks.map((t) => t.clone())); }
  }
  const timers = [];
  const idle = { n: 0 };
  const gate = createGate(Object.assign({
    proto: Track.prototype,
    streamProto: Stream.prototype,
    setTimeout: (fn, ms) => { timers.push({ fn, ms, cleared: false }); return timers.length - 1; },
    clearTimeout: (id) => { timers[id].cleared = true; },
    onIdle: () => { idle.n += 1; },
  }, over));
  const real = (t) => t._enabled; // the value the browser actually sees
  const fire = () => timers.filter((t) => !t.cleared).forEach((t) => { t.cleared = true; t.fn(); });
  return { Track, Stream, gate, timers, idle, real, fire };
}

test('video clone is forced on in BRB even when Meet disables it, and Meet\'s value returns on exit', () => {
  const e = env();
  const v = new e.Track('video');
  e.gate.registerVideoClone(v);
  e.gate.setBrb(true);
  v.enabled = false; // Meet turns video off
  assert.strictEqual(v.enabled, false);
  assert.strictEqual(e.real(v), true); // card keeps showing
  e.gate.setBrb(false);
  assert.strictEqual(e.real(v), false);
});

test('clone() of a registered track is registered with the same value; unregistered tracks are untouched', () => {
  const e = env();
  const a = new e.Track('video');
  e.gate.registerVideoClone(a);
  a.enabled = false;
  const c = a.clone();
  assert.strictEqual(c.enabled, false);
  e.gate.setBrb(true);
  assert.strictEqual(e.real(c), true);
  const other = new e.Track('video');
  const oc = other.clone();
  other.enabled = true;
  assert.strictEqual(e.real(other), true);
  assert.strictEqual(e.real(oc), true);
});

test('MediaStream.clone() registers the cloned tracks', () => {
  const e = env();
  const v = new e.Track('video');
  const other = new e.Track('audio'); // unregistered
  e.gate.registerVideoClone(v);
  const s = new e.Stream([v, other]).clone();
  v.enabled = false;
  e.gate.setBrb(true);
  assert.strictEqual(e.real(s.getTracks()[0]), true);
  assert.strictEqual(e.real(s.getTracks()[1]), true);
  assert.strictEqual(e.gate.liveVideoClones(), 2);
});

test('setBrb leaves unregistered tracks alone', () => {
  const e = env();
  const t = new e.Track('video');
  e.gate.setBrb(true);
  assert.strictEqual(e.real(t), true);
});

test('idle: no live video clone for 1.5 s triggers onIdle once; a new clone cancels it', () => {
  const e = env();
  const v = new e.Track('video');
  e.gate.registerVideoClone(v);
  v.stop();
  assert.strictEqual(e.timers[0].ms, IDLE_MS);
  e.fire();
  assert.strictEqual(e.idle.n, 1);

  const w = new e.Track('video');
  e.gate.registerVideoClone(w);
  w.stop();
  const w2 = new e.Track('video');
  e.gate.registerVideoClone(w2); // Meet swaps clones: the timer is cancelled
  e.fire();
  assert.strictEqual(e.idle.n, 1);
});

test('stopping the same clone twice counts once', () => {
  const e = env();
  const v = new e.Track('video');
  const w = new e.Track('video');
  e.gate.registerVideoClone(v);
  e.gate.registerVideoClone(w);
  v.stop(); v.stop();
  assert.strictEqual(e.gate.liveVideoClones(), 1);
  e.fire();
  assert.strictEqual(e.idle.n, 0);
});

test('createGate throws if enabled is not an accessor (so nothing is installed)', () => {
  assert.throws(() => createGate({ proto: {}, streamProto: {} }));
});
