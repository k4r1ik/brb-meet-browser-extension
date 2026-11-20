const test = require('node:test');
const assert = require('node:assert');
const S = require('../src/page/state.js');
const { install, extractDeviceId, createInputTracker } = require('../src/page/media-hooks.js');

const BRB = S.BRB_ID;
const track = (kind, name) => ({ kind, name, stopped: 0, stop() { this.stopped += 1; } });

function setup({ userInitiated = true, state, devices } = {}) {
  const gumCalls = [];
  const events = [];
  const relayCalls = [];
  const flags = { userInitiated, failVideo: null, deferVideo: null };
  const target = {
    enumerateDevices: async () => devices || [
      { kind: 'videoinput', label: 'Cam', deviceId: 'cam1' },
      { kind: 'audioinput', label: 'Mic', deviceId: 'mic1' },
    ],
    getUserMedia: async (c) => {
      gumCalls.push(c);
      if (c.video) {
        if (flags.failVideo) throw flags.failVideo;
        if (flags.deferVideo) await flags.deferVideo;
        const t = track('video', 'real');
        t.getSettings = () => ({ deviceId: 'real-id' });
        return { getVideoTracks: () => [t], getAudioTracks: () => [] };
      }
      const a = track('audio', 'mic');
      return { getVideoTracks: () => [], getAudioTracks: () => [a] };
    },
    dispatchEvent: (e) => events.push(e),
  };
  const relay = {
    setCard: () => relayCalls.push(['card']),
    setCamera: (t) => { relayCalls.push(['camera', t.name]); return true; },
    clone: (id) => { relayCalls.push(['clone', id]); return { kind: 'video', name: 'clone', id }; },
  };
  const gateCalls = [];
  const gate = {
    registerVideoClone: (t) => gateCalls.push(['clone', t.id]),
    setBrb: (on) => gateCalls.push(['brb', on]),
  };
  const hooks = install({
    target, relay, S, state, gate,
    isUserInitiated: () => flags.userInitiated,
    makeStream: (tracks) => ({ tracks }),
    makeEvent: (type) => ({ type }),
    log: () => {},
  });
  const gum = (c) => target.getUserMedia.call(target, c);
  return { target, gum, gumCalls, relayCalls, gateCalls, events, flags, hooks };
}

const wait = () => new Promise((r) => setTimeout(r, 5));
const videoCalls = (s) => s.gumCalls.filter((c) => c.video);
const neverFakeId = (s) => assert.ok(!JSON.stringify(s.gumCalls).includes(BRB), 'fake id leaked to the real API');

test('extractDeviceId handles string, exact, ideal, array and missing', () => {
  assert.strictEqual(extractDeviceId({ deviceId: 'a' }), 'a');
  assert.strictEqual(extractDeviceId({ deviceId: { exact: 'b' } }), 'b');
  assert.strictEqual(extractDeviceId({ deviceId: { ideal: ['c'] } }), 'c');
  assert.strictEqual(extractDeviceId(true), undefined);
  assert.strictEqual(extractDeviceId({}), undefined);
});

test('enumerateDevices appends BRB Camera once a real camera has a label, and announces it once', async () => {
  const s = setup();
  const a = await s.target.enumerateDevices();
  const b = await s.target.enumerateDevices();
  await wait();
  const fake = a[a.length - 1];
  assert.strictEqual(fake.label, 'BRB Camera');
  assert.strictEqual(fake.deviceId, BRB);
  assert.strictEqual(fake.kind, 'videoinput');
  assert.strictEqual(JSON.parse(JSON.stringify(fake)).label, 'BRB Camera');
  assert.strictEqual(b.length, 3);
  assert.deepStrictEqual(s.events, [{ type: 'devicechange' }]);
});

test('enumerateDevices adds nothing while camera labels are blank', async () => {
  const s = setup({ devices: [{ kind: 'videoinput', label: '', deviceId: '' }] });
  const list = await s.target.enumerateDevices();
  await wait();
  assert.strictEqual(list.length, 1);
  assert.strictEqual(s.events.length, 0);
});

test('audio-only requests pass through untouched', async () => {
  const s = setup();
  const out = await s.gum({ audio: true });
  assert.strictEqual(out.getAudioTracks().length, 1);
  assert.deepStrictEqual(s.relayCalls, []);
});

test('picking BRB Camera shows the card and opens no real camera', async () => {
  const s = setup();
  const out = await s.gum({ video: { deviceId: { exact: BRB } }, audio: false });
  assert.deepStrictEqual(s.relayCalls, [['card'], ['clone', BRB]]);
  assert.strictEqual(videoCalls(s).length, 0);
  assert.strictEqual(out.tracks.length, 1);
  assert.strictEqual(s.hooks.getState().mode, 'BRB');
});

test('a real camera request in LIVE opens the camera and feeds the relay', async () => {
  const s = setup();
  const out = await s.gum({ video: { deviceId: { exact: 'cam1' } }, audio: true });
  assert.strictEqual(videoCalls(s).length, 1);
  assert.deepStrictEqual(s.relayCalls, [['camera', 'real'], ['clone', 'cam1']]);
  assert.strictEqual(out.tracks.length, 2); // mic + clone
  neverFakeId(s);
});

test('in BRB an automatic request keeps the card and opens no camera', async () => {
  const s = setup({ userInitiated: false, state: { mode: 'BRB', lastLiveRequestId: BRB, openToken: 1 } });
  const out = await s.gum({ video: { deviceId: { exact: 'cam2' } } });
  assert.strictEqual(videoCalls(s).length, 0);
  assert.deepStrictEqual(s.relayCalls, [['clone', 'cam2']]);
  assert.strictEqual(out.tracks.length, 1);
  assert.strictEqual(s.hooks.getState().mode, 'BRB');
});

test('in BRB a deliberate real-camera pick leaves BRB', async () => {
  const s = setup({ userInitiated: true, state: { mode: 'BRB', lastLiveRequestId: BRB, openToken: 1 } });
  await s.gum({ video: { deviceId: { exact: 'cam1' } } });
  assert.deepStrictEqual(s.relayCalls, [['camera', 'real'], ['clone', 'cam1']]);
  assert.strictEqual(s.hooks.getState().mode, 'LIVE');
});

test('leaving BRB: if the camera cannot be opened, stay on the card and do not throw', async () => {
  const s = setup({ userInitiated: true, state: { mode: 'BRB', lastLiveRequestId: BRB, openToken: 1 } });
  s.flags.failVideo = new Error('busy');
  const out = await s.gum({ video: { deviceId: { exact: 'cam1' } } });
  assert.ok(!s.relayCalls.some((c) => c[0] === 'camera'));
  assert.strictEqual(out.tracks.length, 1);
  assert.strictEqual(s.hooks.getState().mode, 'BRB');
});

test('in LIVE a camera error passes to Meet and the mic opened for it is stopped', async () => {
  const s = setup();
  s.flags.failVideo = new Error('NotReadableError');
  await assert.rejects(s.gum({ video: { deviceId: { exact: 'cam1' } }, audio: true }), /NotReadableError/);
});

test('a camera open that finishes after BRB was entered is discarded and stopped', async () => {
  const s = setup();
  let release;
  s.flags.deferVideo = new Promise((r) => { release = r; });
  const slow = s.gum({ video: { deviceId: { exact: 'cam1' } } });
  await wait();
  s.flags.deferVideo = null;
  await s.gum({ video: { deviceId: { exact: BRB } } }); // user enters BRB meanwhile
  release();
  await slow;
  assert.ok(!s.relayCalls.some((c) => c[0] === 'camera'), 'late camera reached the relay');
  assert.strictEqual(s.hooks.getState().mode, 'BRB');
});

test('input tracker: trusted input counts for 1.5 s, untrusted does not', () => {
  const handlers = {};
  const doc = { addEventListener: (t, fn) => { handlers[t] = fn; } };
  let t = 0;
  const isUser = createInputTracker(doc, () => t);
  assert.strictEqual(isUser(), false);
  t = 100; handlers.click({ isTrusted: false });
  assert.strictEqual(isUser(), false);
  handlers.click({ isTrusted: true });
  t = 1500; assert.strictEqual(isUser(), true);
  t = 1700; assert.strictEqual(isUser(), false);
});

test('gate: picking BRB turns the gate on and registers the clone', async () => {
  const s = setup();
  await s.gum({ video: { deviceId: { exact: BRB } }, audio: true });
  assert.deepStrictEqual(s.gateCalls.filter((c) => c[0] === 'brb').pop(), ['brb', true]);
  assert.ok(s.gateCalls.some((c) => c[0] === 'clone' && c[1] === BRB));
});

test('gate: leaving BRB turns the gate off only after the real camera is in', async () => {
  const s = setup({ userInitiated: true, state: { mode: 'BRB', lastLiveRequestId: BRB, openToken: 1 } });
  await s.gum({ video: { deviceId: { exact: 'cam1' } } });
  assert.deepStrictEqual(s.gateCalls.filter((c) => c[0] === 'brb').pop(), ['brb', false]);
});

test('gate: a failed reopen keeps BRB on', async () => {
  const s = setup({ userInitiated: true, state: { mode: 'BRB', lastLiveRequestId: BRB, openToken: 1 } });
  s.flags.failVideo = new Error('busy');
  await s.gum({ video: { deviceId: { exact: 'cam1' } } });
  assert.deepStrictEqual(s.gateCalls.filter((c) => c[0] === 'brb').pop(), ['brb', true]);
});

test('leaving BRB opens the real camera with the constraints Meet asked for', async () => {
  const s = setup({ userInitiated: true, state: { mode: 'BRB', lastLiveRequestId: BRB, openToken: 1 } });
  const video = { deviceId: { exact: 'cam1' }, width: { ideal: 1280 }, frameRate: { ideal: 30 } };
  await s.gum({ video });
  assert.deepStrictEqual(videoCalls(s)[0].video, video);
});

test('a clone that stays on the card still reports BRB Camera', async () => {
  const s = setup();
  await s.gum({ video: { deviceId: { exact: BRB } } });
  assert.deepStrictEqual(s.relayCalls.filter((c) => c[0] === 'clone'), [['clone', BRB]]);
});

// ---- Task 9: pre-join screen and joining in BRB

test('join in BRB: a call that starts with the remembered BRB Camera and no click enters BRB, opening no camera', async () => {
  const s = setup({ userInitiated: false });
  await s.gum({ video: { deviceId: { exact: BRB } }, audio: false });
  assert.strictEqual(s.hooks.getState().mode, 'BRB');
  assert.strictEqual(videoCalls(s).length, 0);
  assert.deepStrictEqual(s.relayCalls, [['card'], ['clone', BRB]]);
});

test('join in BRB: the requests Meet makes after clicking Join keep the card and open no camera', async () => {
  const s = setup({ userInitiated: false });
  await s.gum({ video: { deviceId: { exact: BRB } } }); // pre-join preview
  s.flags.userInitiated = true; // user clicks "Join"
  await s.gum({ video: { deviceId: { exact: BRB } }, audio: true });
  await s.gum({ audio: true });
  assert.strictEqual(s.hooks.getState().mode, 'BRB');
  assert.strictEqual(videoCalls(s).length, 0);
  assert.strictEqual(s.relayCalls.filter((c) => c[0] === 'camera').length, 0);
  neverFakeId(s);
});

test('pre-join: live preview, pick BRB Camera, then Join keeps the card and the camera stays released', async () => {
  const s = setup();
  await s.gum({ video: { deviceId: { exact: 'cam1' } } }); // live preview
  assert.strictEqual(s.hooks.getState().mode, 'LIVE');
  await s.gum({ video: { deviceId: { exact: BRB } } }); // user picks BRB Camera
  assert.strictEqual(s.hooks.getState().mode, 'BRB');
  assert.deepStrictEqual(s.relayCalls.filter((c) => c[0] === 'card'), [['card']]);
  const videoOpens = videoCalls(s).length;
  await s.gum({ video: { deviceId: { exact: BRB } }, audio: true }); // Join
  assert.strictEqual(videoCalls(s).length, videoOpens);
  assert.strictEqual(s.hooks.getState().mode, 'BRB');
});

test('pre-join in BRB: picking the real camera and then joining joins live', async () => {
  const s = setup({ userInitiated: false });
  await s.gum({ video: { deviceId: { exact: BRB } } });
  s.flags.userInitiated = true;
  await s.gum({ video: { deviceId: { exact: 'cam1' } } }); // user picks real camera
  assert.strictEqual(s.hooks.getState().mode, 'LIVE');
  await s.gum({ video: { deviceId: { exact: 'cam1' } }, audio: true }); // Join
  assert.strictEqual(s.hooks.getState().mode, 'LIVE');
  assert.deepStrictEqual(s.gateCalls.filter((c) => c[0] === 'brb').pop(), ['brb', false]);
});

test('pre-join: a camera open that finishes after BRB was picked is discarded (no live frames after the pick)', async () => {
  const s = setup();
  let release;
  s.flags.deferVideo = new Promise((r) => { release = r; });
  const slow = s.gum({ video: { deviceId: { exact: 'cam1' } } }); // preview still opening the camera
  await wait();
  s.flags.deferVideo = null;
  await s.gum({ video: { deviceId: { exact: BRB } } });
  release();
  await slow;
  assert.ok(!s.relayCalls.some((c) => c[0] === 'camera'));
});
