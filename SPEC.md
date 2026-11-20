# Spec: BRB Camera MVP

Sources: `docs/intent/brb_camera.md` (confirmed intent), `docs/ideas/brb_camera.md` (chosen direction), `docs/designs/brb_camera.md` (architecture: page hook, relay track, fake device, track gate). Where the intent and the draft disagree, the intent wins and the difference is listed under "Changes from the draft".

## Objective
A personal Manifest V3 extension for Brave/Chrome on macOS. In Google Meet you pick "BRB Camera" in the camera list and other people see a "Be Right Back" card in your tile. You leave BRB by picking your real camera in Meet's camera list. Turning the camera off and on does not end BRB: Meet re-asks for "BRB Camera" and the card shows again.

User: you alone. Success is defined by one asymmetry: if anything goes wrong, others see your initial, never your live camera.

Acceptance:
1. Picking "BRB Camera" shows the card to others within about 1 second, and the webcam light goes off.
2. While in BRB, a camera change that Meet makes by itself (dock plugged in, camera unplugged, reconnect, blur change) keeps the card.
3. Picking a real camera in Meet's list returns your real camera within about 2 seconds. Turning the camera off and on in Meet does not end BRB (the card shows again); to get your camera back, pick it in the menu.
4. If the extension fails or the real camera cannot be opened, Meet shows your initial or the card, never your live camera.
5. Outside BRB, video through the relay matches video without the extension (frame rate, resolution, blur/background effects).
6. Muting is not part of this tool: BRB does not touch your mic. Use Meet's own mute (Cmd+D). A first attempt (press Meet's mute button, silence the audio tracks) did not mute reliably on live Meet and was dropped.
7. BRB works on the pre-join screen, and a call can start in BRB (Meet remembers "BRB Camera"): you join already showing the card.

## Assumptions (correct these before planning)
1. Plain JavaScript, no framework, no build step. Manifest content scripts are classic scripts, so each file is an IIFE that registers itself on one namespace, `globalThis.__brb`, and ends with `if (typeof module !== 'undefined') module.exports = ...` so `node:test` can `require` it. Files are listed in the manifest in dependency order.
2. Meet's media goes through standard `getUserMedia` / `enumerateDevices` in the main frame, so the page hook can wrap them (this is the central bet; see Success Criteria 7).
3. A deliberate camera pick can be told from an automatic switch by a real click or key press shortly before Meet's `getUserMedia` call (verified in the spike for picks). Unproven; needs a spike on live Meet.
4. The gate handles video only: in BRB it keeps the video clones enabled so the card shows, and it releases the real camera when Meet drops every clone. It does not handle audio.
5. The MVP has no badge and no health checks. The toolbar button and shortcut are not built unless the spike fails (see Open Questions 1); then they become the way to leave BRB.
6. If your Meet camera is off when you pick "BRB Camera", Meet makes no video request, so BRB takes effect the next time Meet asks for video. The extension does not turn your camera on for you.
7. Tests use Node's built-in `node:test` for pure logic. Live Meet behaviour is checked by a manual checklist.

## Tech Stack
- JavaScript (classic scripts, CommonJS-compatible for tests), Manifest V3, Chromium (Brave and Chrome) on macOS.
- Browser APIs only: `MediaStreamTrackGenerator`, `MediaStreamTrackProcessor`, `OffscreenCanvas`.
- No runtime dependencies. Node 20+ for tests only.

## Commands
- Test: `node --test`
- Load for manual testing: `brave://extensions` (or `chrome://extensions`) → Developer mode → Load unpacked → this folder. Reload the Meet tab after each change.
(`package.json` with a `test` script is created in the first task.)

## Project Structure
```
manifest.json            MV3 manifest; one content script, world "MAIN", document_start,
                         matches https://meet.google.com/*, all_frames false
src/page/state.js        pure state machine and classifyVideoRequest (unit tested)
src/page/card.js         draws the 640x360 "Be Right Back" card
src/page/relay.js        master MediaStreamTrackGenerator, source switching, clones
src/page/track-gate.js   video clones forced enabled in BRB; releases the camera when Meet drops its clones
src/page/media-hooks.js  wraps enumerateDevices and getUserMedia
src/page/main.js         wires the parts together
test/state.test.js       state machine and request classification
test/track-gate.test.js  gate behaviour with fake tracks
docs/manual-checklist.md live-Meet checks
README.md                how to load it
```
No `background.js`, badge or `ui.js` in the MVP. If the spike fails, `background.js` returns with the toolbar button and shortcut only.

## Code Style
Small pure functions for decisions, side effects at the edges. Example of the intended shape:
```js
// state.js: pure, no browser APIs
function classifyVideoRequest({ state, lastLiveRequestId, requestedDeviceId, userActive }) {
  if (state === 'BRB') {
    if (requestedDeviceId !== 'brb-camera' && userActive) return { action: 'LEAVE_BRB' };
    return { action: 'CARD' };           // automatic switch or re-ask: stay on the card
  }
  if (requestedDeviceId === 'brb-camera' && lastLiveRequestId !== 'brb-camera') return { action: 'PICK_BRB' };
  return { action: 'SWITCH_CAMERA' };
}
```
Conventions: each file is one IIFE, the only global is `globalThis.__brb`, files end with the `module.exports` guard, and every unsure branch resolves to the card or camera-off, never to the live camera.

## Testing Strategy
- Unit (`node --test`): `state.js` transitions and `classifyVideoRequest` for every row of the request table (pick, auto-switch in BRB, user pick in BRB); `track-gate.js` with fake track objects (video forced enabled in BRB, Meet's own `enabled` value restored on exit, camera released when clones are dropped).
- Fail-closed tests: each error path (camera open fails, relay throws, late camera open after entering BRB) must end with the card or no video, never the real track.
- Unit also covers: a late camera open after entering BRB is discarded, and the join-in-BRB path (the first request of a call with the remembered fake camera enters BRB).
- Manual (`docs/manual-checklist.md`) on live Meet: pre-join screen in BRB, join in BRB, pick "BRB Camera", webcam light, auto-switch while in BRB (plug/unplug a camera), pick real camera, 30 minutes with the tab hidden, new participant joining during BRB, frame-rate and resolution with the relay on and off, kill the extension mid-call.
- No automated tests against live Meet (non-goal).

## Boundaries
- Always: fail toward the card or camera off; keep decisions in `state.js`; run `node --test` before declaring a task done; keep Meet-specific assumptions in `media-hooks.js`.
- Ask first: adding any dependency or build step; adding permissions beyond `host_permissions` for `https://meet.google.com/*`; changing the message contracts in `docs/designs/brb_camera.md`; adding anything from the "later" list in Assumption 5.
- Never: pass the real camera track to Meet while the state is BRB or while its state is unknown; commit unless asked; add telemetry, other sites, custom card content, auto-BRB, auto-unmute, or Web Store packaging.

## Changes from the draft
1. Picking a real camera ends BRB (draft: only toolbar/shortcut ends it). Camera off/on does not.
2. Toolbar button, shortcut, badge, health checks, and all mic muting (verified mute, the red "!", pressing Meet's mute button, silencing audio tracks) are dropped from the MVP.
3. Pre-join screen and join-in-BRB stay in, as in the draft.
4. No Meet adapter, bridge, content script or Meet-specific selector. Everything runs in the page hook.
5. Camera-off detection, a menu-click workaround for re-picking "BRB Camera", and reopening the real camera when Meet re-asks for a remembered "BRB Camera" were tried at Checkpoint C and dropped: Meet keeps showing "BRB Camera" as selected and ignores what the video reports. To leave BRB you pick your real camera in Meet's menu.
5. The draft's "Step away while your camera is already off" journey (CUJ 4) is dropped: BRB does not turn your camera on.

## Success Criteria
1. `node --test` passes, including every fail-closed case.
2. On live Meet, picking "BRB Camera" shows the card to a second participant within about 1 second and the webcam light goes off.
3. Plugging or unplugging a camera while in BRB does not change what the second participant sees.
4. Picking a real camera restores live video within about 2 seconds. Picking a real camera is the only exit.
5. Killing the extension (disable it and reload) mid-call never shows your live camera to the second participant when it was in BRB.
6. The card stays visible for 30 minutes with the tab hidden, and a participant who joins during BRB sees it.
7. Spike result recorded: whether `userActivation.isActive` reliably separates a menu pick from an automatic switch on live Meet. If not, apply the fallback in Open Questions 1.
8. Relay on versus off: same frame rate and resolution within normal variation, with blur/background effects working.
9. (dropped at Checkpoint C) Turning the camera off and on in Meet while in BRB leaves BRB on: the card shows again.
10. Entering and leaving BRB does not change your mic in any way.

## Decisions made
- Joining in BRB and the pre-join screen are in the MVP.
- Camera off/on does not end BRB; picking a real camera does.
- Muting is dropped (decided after Checkpoint B: it did not mute reliably on live Meet).

## Open Questions
1. Recommended fallback if the spike in criterion 7 fails: keep "any camera change in BRB keeps the card" and add the toolbar button and keyboard shortcut as the exit. It is the smallest change that keeps your camera from being exposed, and it brings back about 30 lines (`background.js` plus the manifest `commands` entry). Confirm or choose something else.
2. (resolved) Camera off then on in BRB shows the card again; the checklist covers it.
