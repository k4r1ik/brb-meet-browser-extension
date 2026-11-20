// Relay video track. Meet only ever receives clones of one master track; the source feeding
// the master changes (real camera frames, or card frames), the track does not.
// Fail closed: any error while switching ends on the card or no frames, never a stale camera.
(function () {
  const CARD_INTERVAL_MS = 500;
  const CARD_STEP_US = CARD_INTERVAL_MS * 1000;

  function createRelay(overrides) {
    const d = Object.assign({
      makeGenerator: () => new MediaStreamTrackGenerator({ kind: 'video' }),
      makeProcessor: (track) => new MediaStreamTrackProcessor({ track }),
      makeFrame: (canvas, timestamp) => new VideoFrame(canvas, { timestamp }),
      setInterval: (fn, ms) => globalThis.setInterval(fn, ms),
      clearInterval: (id) => globalThis.clearInterval(id),
      card: null, // canvas from card.js
    }, overrides);

    const master = d.makeGenerator();
    const writer = master.writable.getWriter();

    let source = 'none'; // 'none' | 'card' | 'camera'
    let cameraTrack = null;
    let reader = null;
    let timer = null;
    let loopToken = 0;
    let cardTs = 0;

    const quiet = (fn) => { try { return fn(); } catch (e) { return undefined; } };

    function write(frame) {
      return Promise.resolve()
        .then(() => writer.write(frame))
        .catch(() => {})
        .then(() => quiet(() => frame.close()));
    }

    // Stops whatever is feeding the master. Stopping the camera track turns the light off.
    function stop() {
      loopToken += 1;
      if (timer !== null) { d.clearInterval(timer); timer = null; }
      if (reader) { const r = reader; reader = null; quiet(() => r.cancel()); }
      if (cameraTrack) { const t = cameraTrack; cameraTrack = null; quiet(() => t.stop()); }
      source = 'none';
    }

    function tickCard() {
      if (source !== 'card') return;
      cardTs += CARD_STEP_US;
      let frame;
      try { frame = d.makeFrame(d.card, cardTs); } catch (e) { return; }
      write(frame);
    }

    function setCard() {
      stop();
      source = 'card';
      timer = d.setInterval(tickCard, CARD_INTERVAL_MS);
      tickCard();
    }

    async function pump(r, token) {
      try {
        for (;;) {
          const { value, done } = await r.read();
          if (done) break;
          if (token !== loopToken) { quiet(() => value.close()); break; }
          await write(value);
        }
      } catch (e) { /* camera ended or errored: handled below */ }
      // If the camera ended on its own, stop feeding; the state machine decides what happens next.
      if (token === loopToken && source === 'camera') stop();
    }

    // Returns true if the camera is now feeding the master; false if it fell back to the card.
    function setCamera(track) {
      stop();
      try {
        reader = d.makeProcessor(track).readable.getReader();
      } catch (e) {
        quiet(() => track.stop());
        setCard();
        return false;
      }
      cameraTrack = track;
      source = 'camera';
      pump(reader, loopToken);
      return true;
    }

    // A fresh clone for Meet. Reports the device Meet asked for, fixed at creation time.
    function clone(deviceId) {
      const c = master.clone();
      c.getSettings = () => Object.assign(
        {},
        (cameraTrack && quiet(() => cameraTrack.getSettings())) || { width: 640, height: 360 },
        { deviceId },
      );
      c.getCapabilities = () => (cameraTrack && quiet(() => cameraTrack.getCapabilities())) || {};
      c.applyConstraints = async (constraints) => {
        if (cameraTrack) { try { await cameraTrack.applyConstraints(constraints); } catch (e) { /* always resolve */ } }
      };
      return c;
    }

    return { setCard, setCamera, stop, clone, getSource: () => source };
  }

  const api = { CARD_INTERVAL_MS, createRelay };
  globalThis.__brb = Object.assign(globalThis.__brb || {}, { relay: api });
  if (typeof module !== 'undefined') module.exports = api;
})();
