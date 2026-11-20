const test = require('node:test');
const assert = require('node:assert');
const S = require('../src/page/state.js');

const live = (over = {}) => ({ ...S.initialState(), ...over });
const brb = (over = {}) => live({ mode: 'BRB', lastLiveRequestId: S.BRB_ID, openToken: 1, ...over });

test('picking BRB Camera in LIVE enters BRB and opens no camera', () => {
  const r = S.onVideoRequest(live({ lastLiveRequestId: 'cam1' }), { requestedDeviceId: S.BRB_ID, userInitiated: true });
  assert.strictEqual(r.action, 'PICK_BRB');
  assert.strictEqual(r.next.mode, 'BRB');
});

test('a BRB Camera request in LIVE always enters BRB (also the first request of a call)', () => {
  const r = S.onVideoRequest(live(), { requestedDeviceId: S.BRB_ID, userInitiated: false });
  assert.strictEqual(r.action, 'PICK_BRB');
});

test('real camera request in LIVE switches camera', () => {
  const r = S.onVideoRequest(live(), { requestedDeviceId: 'cam1', userInitiated: true });
  assert.strictEqual(r.action, 'SWITCH_CAMERA');
});

test('in BRB an automatic switch keeps the card', () => {
  const r = S.onVideoRequest(brb(), { requestedDeviceId: 'cam2', userInitiated: false });
  assert.strictEqual(r.action, 'CARD');
  assert.strictEqual(r.next.mode, 'BRB');
});

test('in BRB a re-ask for BRB Camera keeps the card, even if user initiated', () => {
  const r = S.onVideoRequest(brb(), { requestedDeviceId: S.BRB_ID, userInitiated: true });
  assert.strictEqual(r.action, 'CARD');
});

test('in BRB a deliberate real-camera pick leaves BRB via REACQUIRING', () => {
  const r = S.onVideoRequest(brb(), { requestedDeviceId: 'cam1', userInitiated: true });
  assert.strictEqual(r.action, 'LEAVE_BRB');
  assert.strictEqual(r.next.mode, 'REACQUIRING');
});

test('in BRB a default-camera request (no id) is a real camera: leaves only if user initiated', () => {
  assert.strictEqual(S.onVideoRequest(brb(), { requestedDeviceId: undefined, userInitiated: false }).action, 'CARD');
  assert.strictEqual(S.onVideoRequest(brb(), { requestedDeviceId: undefined, userInitiated: true }).action, 'LEAVE_BRB');
});

test('REACQUIRING keeps the card for any further request', () => {
  const s = live({ mode: 'REACQUIRING', openToken: 2 });
  assert.strictEqual(S.onVideoRequest(s, { requestedDeviceId: 'cam2', userInitiated: true }).action, 'CARD');
});

test('unknown mode fails closed to the card', () => {
  const r = S.onVideoRequest({ mode: 'WAT', lastLiveRequestId: null, openToken: 0 }, { requestedDeviceId: 'cam1', userInitiated: true });
  assert.strictEqual(r.action, 'CARD');
});

test('a camera open that finishes after entering BRB is discarded', () => {
  const picked = S.onVideoRequest(live(), { requestedDeviceId: 'cam1', userInitiated: true });
  const entered = S.onVideoRequest(picked.next, { requestedDeviceId: S.BRB_ID, userInitiated: true });
  assert.strictEqual(entered.next.mode, 'BRB');
  assert.strictEqual(S.onCameraOpened(entered.next, picked.token).action, 'DISCARD');
});

test('a stale camera open is discarded; the latest is used', () => {
  const a = S.onVideoRequest(live(), { requestedDeviceId: 'cam1', userInitiated: true });
  const b = S.onVideoRequest(a.next, { requestedDeviceId: 'cam2', userInitiated: true });
  assert.strictEqual(S.onCameraOpened(b.next, a.token).action, 'DISCARD');
  assert.strictEqual(S.onCameraOpened(b.next, b.token).action, 'USE_CAMERA');
});

test('leaving BRB: camera opens -> LIVE; camera fails -> back on the card', () => {
  const left = S.onVideoRequest(brb(), { requestedDeviceId: 'cam1', userInitiated: true });
  assert.strictEqual(S.onCameraOpened(left.next, left.token).next.mode, 'LIVE');
  const failed = S.onCameraOpenFailed(left.next, left.token);
  assert.strictEqual(failed.action, 'STAY_CARD');
  assert.strictEqual(failed.next.mode, 'BRB');
});

test('a failure from a stale open does not change the state', () => {
  const left = S.onVideoRequest(brb(), { requestedDeviceId: 'cam1', userInitiated: true });
  assert.strictEqual(S.onCameraOpenFailed(left.next, left.token - 1).action, 'NONE');
});

test('functions do not mutate their input', () => {
  const s = Object.freeze(brb());
  S.onVideoRequest(s, { requestedDeviceId: 'cam1', userInitiated: true });
  S.onCameraOpened(s, 1);
});
