// Wraps enumerateDevices and getUserMedia. Adds the fake "BRB Camera" and answers Meet's
// video requests from the relay. Invariant: the id "brb-camera" never reaches the real API,
// and the real camera is only handed on when the state machine says so (fail closed).
(function () {
  const INPUT_WINDOW_MS = 1500;

  // "Deliberate" = a real (trusted) click or key press shortly before the request.
  function createInputTracker(doc, now) {
    let last = -Infinity;
    ['pointerdown', 'click', 'keydown'].forEach((type) =>
      doc.addEventListener(type, (e) => { if (e.isTrusted) last = now(); }, true));
    return () => now() - last <= INPUT_WINDOW_MS;
  }

  function extractDeviceId(video) {
    const d = video && typeof video === 'object' ? video.deviceId : undefined;
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object') {
      const v = d.exact !== undefined ? d.exact : d.ideal;
      return Array.isArray(v) ? v[0] : v;
    }
    return undefined;
  }

  function install(overrides) {
    const B = globalThis.__brb || {};
    const d = Object.assign({
      target: globalThis.MediaDevices && MediaDevices.prototype,
      relay: null,
      S: B.state,
      isUserInitiated: null,
      makeStream: (tracks) => new MediaStream(tracks),
      makeEvent: (type) => new Event(type),
      log: (...a) => console.log('[BRB]', ...a),
      state: null,
      gate: { registerVideoClone() {}, setBrb() {} },
    }, overrides);
    if (!d.isUserInitiated) d.isUserInitiated = createInputTracker(document, () => performance.now());

    const { S, relay, target, gate } = d;
    let state = d.state || S.initialState();
    // Video clones are forced on whenever we are not plainly LIVE, so the card keeps showing.
    const syncGate = () => gate.setBrb(state.mode !== 'LIVE');
    let savedDeviceId; // last real camera Meet asked for
    let announced = false;
    const origEnum = target.enumerateDevices;
    const origGum = target.getUserMedia;

    const fakeDevice = { deviceId: S.BRB_ID, groupId: S.BRB_ID, kind: 'videoinput', label: 'BRB Camera' };
    fakeDevice.toJSON = () => ({ deviceId: fakeDevice.deviceId, groupId: fakeDevice.groupId, kind: fakeDevice.kind, label: fakeDevice.label });

    target.enumerateDevices = async function (...args) {
      const list = await origEnum.apply(this, args);
      // Real cameras have blank labels until permission is granted; wait for one with a label.
      if (!list.some((x) => x.kind === 'videoinput' && x.label)) return list;
      if (!announced) {
        announced = true;
        const self = this;
        setTimeout(() => self.dispatchEvent(d.makeEvent('devicechange')), 0);
      }
      return list.concat([fakeDevice]);
    };

    target.getUserMedia = async function (constraints, ...rest) {
      const self = this;
      const video = constraints && constraints.video;
      if (!video) return origGum.call(self, constraints, ...rest); // audio only: untouched

      const requestedId = extractDeviceId(video);
      if (requestedId && requestedId !== S.BRB_ID) savedDeviceId = requestedId;

      // Audio first, so a failure here opens no camera.
      let audioTracks = [];
      if (constraints.audio) {
        const as = await origGum.call(self, { audio: constraints.audio }, ...rest);
        audioTracks = as.getAudioTracks();
      }
      const stopAudio = () => audioTracks.forEach((t) => { try { t.stop(); } catch (e) { /* ignore */ } });

      const r = S.onVideoRequest(state, { requestedDeviceId: requestedId, userInitiated: d.isUserInitiated() });
      state = r.next;
      syncGate();
      d.log(r.action);

      if (r.action === 'PICK_BRB') {
        relay.setCard();
      } else if (r.action === 'SWITCH_CAMERA' || r.action === 'LEAVE_BRB') {
        let track;
        try {
          const cs = await origGum.call(self, { video: video && typeof video === 'object' ? video : {} }, ...rest);
          track = cs.getVideoTracks()[0];
        } catch (err) {
          const f = S.onCameraOpenFailed(state, r.token);
          state = f.next;
          syncGate();
          if (r.action === 'SWITCH_CAMERA') { stopAudio(); throw err; } // LIVE: pass the error to Meet
          d.log('open failed, staying on the card'); // leaving BRB: fail closed
        }
        if (track) {
          const o = S.onCameraOpened(state, r.token);
          state = o.next;
          if (o.action === 'USE_CAMERA') {
            if (!relay.setCamera(track)) state = Object.assign({}, state, { mode: 'BRB' });
            syncGate();
          } else {
            try { track.stop(); } catch (e) { /* ignore */ } // late open: discard
          }
        }
      }
      // CARD: nothing to do, Meet just gets a clone.

      const cloneId = requestedId !== undefined ? requestedId : savedDeviceId;
      const clone = relay.clone(cloneId);
      gate.registerVideoClone(clone);
      syncGate();
      return d.makeStream(audioTracks.concat([clone]));
    };

    return { getState: () => state };
  }

  const api = { INPUT_WINDOW_MS, createInputTracker, extractDeviceId, install };
  globalThis.__brb = Object.assign(globalThis.__brb || {}, { hooks: api });
  if (typeof module !== 'undefined') module.exports = api;
})();
