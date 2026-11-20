(function () {
  const B = globalThis.__brb;
  try {
    const relay = B.relay.createRelay({ card: B.card.createCard() });
    let hooks;
    const gate = B.gate.createGate({
      // Meet dropped every video clone while LIVE (camera off): release the real camera, light off.
      onIdle: () => { if (hooks && hooks.getState().mode === 'LIVE') relay.stop(); },
    });
    hooks = B.hooks.install({ relay, gate });
    console.log('[BRB] hooks installed');
  } catch (e) {
    // Fail closed: without the relay, install nothing. Meet runs untouched and no fake camera appears.
    console.warn('[BRB] not installed:', e && e.message);
  }
})();
