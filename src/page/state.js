// BRB state machine. Pure: no browser APIs. Decides what to do; callers do it.
// Fail closed: every unsure input ends on the card, never the live camera.
(function () {
  const BRB_ID = 'brb-camera';

  function initialState() {
    return { mode: 'LIVE', openToken: 0 };
  }

  // A Meet video request. userInitiated = a real click/key just happened (computed by the caller).
  function onVideoRequest(state, { requestedDeviceId, userInitiated }) {
    const wantsBrb = requestedDeviceId === BRB_ID;

    if (state.mode === 'LIVE') {
      const next = { ...state, openToken: state.openToken + 1 };
      if (wantsBrb) return { action: 'PICK_BRB', token: next.openToken, next: { ...next, mode: 'BRB' } };
      return { action: 'SWITCH_CAMERA', token: next.openToken, next }; // real or default camera
    }

    if (state.mode === 'BRB' && !wantsBrb && userInitiated) {
      const next = { ...state, mode: 'REACQUIRING', openToken: state.openToken + 1 };
      return { action: 'LEAVE_BRB', token: next.openToken, next };
    }

    // BRB or REACQUIRING with no deliberate real-camera pick, or any unknown mode: stay on the card.
    return { action: 'CARD', next: state };
  }

  // A real-camera open finished. Use it only if it is still the latest request and we are not in BRB.
  function onCameraOpened(state, token) {
    const live = state.mode === 'LIVE' || state.mode === 'REACQUIRING';
    if (live && token === state.openToken) {
      return { action: 'USE_CAMERA', next: { ...state, mode: 'LIVE' } };
    }
    return { action: 'DISCARD', next: state };
  }

  // A real-camera open failed. If it was the latest, fail closed: back onto the card.
  function onCameraOpenFailed(state, token) {
    if (state.mode === 'REACQUIRING' && token === state.openToken) {
      return { action: 'STAY_CARD', next: { ...state, mode: 'BRB' } };
    }
    return { action: 'NONE', next: state };
  }

  const api = { BRB_ID, initialState, onVideoRequest, onCameraOpened, onCameraOpenFailed };
  globalThis.__brb = Object.assign(globalThis.__brb || {}, { state: api });
  if (typeof module !== 'undefined') module.exports = api;
})();
