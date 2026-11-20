// Video gate. Wraps MediaStreamTrack `enabled`, `clone`, `stop` and MediaStream `clone` for the
// video clones we hand to Meet. In BRB the real value is forced on so the card keeps showing even
// if Meet disables the track; Meet always reads back what it last wrote. It also notices when
// Meet has dropped every video clone, so the real camera can be released (light off).
(function () {
  const IDLE_MS = 1500;

  function createGate(overrides) {
    const d = Object.assign({
      proto: globalThis.MediaStreamTrack && MediaStreamTrack.prototype,
      streamProto: globalThis.MediaStream && MediaStream.prototype,
      setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
      clearTimeout: (id) => globalThis.clearTimeout(id),
      onIdle: () => {}, // called when Meet has held no live video clone for IDLE_MS
    }, overrides);

    const desc = Object.getOwnPropertyDescriptor(d.proto, 'enabled');
    if (!desc || !desc.get || !desc.set) throw new Error('MediaStreamTrack.enabled is not an accessor');
    const origClone = d.proto.clone;
    const origStop = d.proto.stop;
    const origStreamClone = d.streamProto.clone;

    const info = new WeakMap(); // clone -> { wanted: what Meet last set }
    const live = new Set(); // registered clones that are not stopped yet
    let brb = false;
    let idleTimer = null;

    const apply = (t) => desc.set.call(t, brb ? true : info.get(t).wanted);

    function register(track, wanted) {
      if (info.has(track)) return;
      info.set(track, { wanted: wanted === undefined ? !!desc.get.call(track) : wanted });
      live.add(track);
      if (idleTimer !== null) { d.clearTimeout(idleTimer); idleTimer = null; }
      apply(track); // a clone gets the current flag the moment it is registered
    }

    function release(track) {
      if (!live.delete(track)) return;
      if (live.size === 0 && idleTimer === null) {
        idleTimer = d.setTimeout(() => { idleTimer = null; if (live.size === 0) d.onIdle(); }, IDLE_MS);
      }
    }

    Object.defineProperty(d.proto, 'enabled', {
      configurable: true,
      enumerable: desc.enumerable,
      get() { const i = info.get(this); return i ? i.wanted : desc.get.call(this); },
      set(v) {
        const i = info.get(this);
        if (!i) { desc.set.call(this, v); return; }
        i.wanted = !!v;
        apply(this);
      },
    });

    d.proto.clone = function () {
      const c = origClone.call(this);
      const i = info.get(this);
      if (i) register(c, i.wanted);
      return c;
    };

    d.proto.stop = function () {
      release(this);
      return origStop.call(this);
    };

    // MediaStream.clone() clones every track without calling the track method.
    d.streamProto.clone = function () {
      const c = origStreamClone.call(this);
      const from = this.getTracks();
      const to = c.getTracks();
      from.forEach((t, n) => { const i = info.get(t); if (i && to[n]) register(to[n], i.wanted); });
      return c;
    };

    return {
      registerVideoClone: (t) => register(t),
      // BRB on: video clones forced on. BRB off: Meet's own values come back.
      setBrb(on) { if (brb === on) return; brb = on; live.forEach(apply); },
      liveVideoClones: () => live.size,
    };
  }

  const api = { IDLE_MS, createGate };
  globalThis.__brb = Object.assign(globalThis.__brb || {}, { gate: api });
  if (typeof module !== 'undefined') module.exports = api;
})();
