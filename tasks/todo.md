# Task List: BRB Camera MVP

Plan: `tasks/plan.md`. Spec: `SPEC.md`. Test command: `node --test`. Each task must leave the extension loadable. Fail-closed rule applies throughout.

## Phase 1: Foundation and risk

- [x] **Task 1: Scaffold the extension and test runner** (S)
  - Acceptance:
    - `manifest.json` (MV3) has one content script, `world: "MAIN"`, `run_at: "document_start"`, `all_frames: false`, matches `https://meet.google.com/*`, and no permissions beyond that host.
    - `package.json` with a `test` script running `node --test` (no `"type": "module"`: content scripts are classic scripts; see the module question in the Task 1 report).
    - Loading unpacked in Brave shows no errors and `src/page/main.js` logs one line on a Meet tab.
  - Verify: `node --test` runs (zero tests is fine); load unpacked and check the Meet console.
  - Dependencies: none
  - Files: `manifest.json`, `package.json`, `src/page/main.js`

- [x] **Task 2: Spike: observe camera and user-activation signals on live Meet** (S, run by the user)
  - Acceptance:
    - A temporary hook logs `enumerateDevices`, each `getUserMedia` request (device id, `navigator.userActivation.isActive`), each `track.enabled` assignment and each track `stop()`.
    - Notes saved in `docs/spike-notes.md` for: picking a camera in Meet's list, turning the camera off, turning it on, plugging or unplugging a camera, changing blur, and reconnecting.
    - A clear verdict on Spec criterion 7: does `isActive` separate deliberate actions from automatic ones? Also: does a fake entry with `toJSON()` appear in Meet's list (the `instanceof MediaDeviceInfo` risk)?
  - Verify: the notes contain a row per scenario with the logged values.
  - Dependencies: Task 1
  - Files: `src/page/spike.js` (temporary, deleted after), `docs/spike-notes.md`

- [x] **Task 3: Pure state machine and request classification** (S)
  - Acceptance:
    - `state.js` exports states `LIVE`, `BRB`, `REACQUIRING` and `classifyVideoRequest` following the Spec's example and the draft's request table.
    - Every unsure input resolves to `CARD`, never to a live-camera action while in BRB.
    - A request that arrives late after entering BRB is rejected by token.
  - Verify: `node --test test/state.test.js` covers pick, auto-switch in BRB, user pick in BRB, late open.
  - Dependencies: Task 1 (independent of Task 2)
  - Files: `src/page/state.js`, `test/state.test.js`

- [x] **Checkpoint A (after 1-3)**
  - [x] `node --test` passes
  - [x] Spike verdict recorded; if negative, update `SPEC.md` (exit via toolbar and shortcut) and Task 7 before continuing
  - [x] Human review of the spike notes

## Phase 2: Core card

- [x] **Task 4: Card drawing and relay track** (M)
  - Acceptance:
    - `card.js` draws the 640x360 "Be Right Back" card once on an `OffscreenCanvas`.
    - `relay.js` creates one master `MediaStreamTrackGenerator`, writes real-camera frames in LIVE and card frames (500 ms interval) in BRB, and hands out `master.clone()` tracks with patched `getSettings`, `getCapabilities` and `applyConstraints`.
    - Switching source from camera to card stops the real camera track.
    - An error while switching leaves card frames or no frames, never the real track.
  - Verify: `node --test` (source-switch logic with fakes); manual relay-on-versus-off check moves to Checkpoint B, because it needs the Task 5 hooks.
  - Dependencies: Task 3
  - Files: `src/page/card.js`, `src/page/relay.js`, `test/relay.test.js`

- [x] **Task 5: Media hooks and the fake "BRB Camera" device** (M)
  - Acceptance:
    - `enumerateDevices` adds `brb-camera` (label "BRB Camera") after at least one real camera has a label, and fires `devicechange` once.
    - `getUserMedia` splits video and audio, sorts video requests with `classifyVideoRequest` and returns clones from the relay. Real-camera errors pass through to Meet when LIVE.
    - Picking "BRB Camera" shows the card to a second participant within about 1 second and the webcam light goes off.
  - Verify: `node --test`; manual on live Meet with a second participant.
  - Dependencies: Tasks 3, 4
  - Files: `src/page/media-hooks.js`, `src/page/main.js`, `test/media-hooks.test.js`

- [x] **Task 6: Track gate (video forced enabled, camera release)** (M)
  - Acceptance:
    - `enabled` and `clone` are wrapped for registered tracks, and `MediaStream.prototype.clone` as well.
    - In BRB, video clones are forced `true`. On exit, Meet's own last value is restored. (Audio silencing was built, did not mute reliably at Checkpoint B, and was removed.)
    - Live video clones are counted. When Meet has held none for 1.5 s while LIVE, the relay stops the real camera, so the light goes off after "camera off" in Meet (the relay alone keeps the camera open).
  - Verify: `node --test test/track-gate.test.js` with fake tracks; manual: the card stays up after Meet disables video, and the webcam light goes off after turning the camera off in Meet.
  - Dependencies: Task 5
  - Files: `src/page/track-gate.js`, `src/page/main.js`, `test/track-gate.test.js`

- [x] **Checkpoint B (after 4-6)**
  - [x] Tests pass
  - [x] Pick "BRB Camera": card visible to a second participant, light off
  - [x] Relay on versus off: same frame rate and resolution
  - [x] Human review before continuing

## Phase 3: Leaving and muting

- [x] **Task 7: Leave BRB by picking a real camera** (M)
  - Note: camera-off detection, a menu-click workaround and reopening the camera on re-ask were built and then dropped at Checkpoint C (Meet keeps showing "BRB Camera" selected). Camera off/on during BRB leaves BRB on; you pick your real camera to leave.
  - Acceptance:
    - With the spike signal (or the fallback chosen at Checkpoint A): a deliberate pick of a real camera ends BRB. Automatic switches keep the card.
    - Real camera reopens within about 2 seconds with Meet's last video constraints, using a token so a late open is discarded.
    - If the real camera cannot be opened, Meet shows the card or your initial, never a stale live track.
    - Fallback path only: toolbar button and shortcut (`background.js`, manifest `commands`) end BRB.
  - Verify: `node --test`; manual: plug and unplug a camera in BRB (card stays), pick real camera (live returns).
  - Dependencies: Tasks 2, 5, 6
  - Files: `src/page/state.js`, `src/page/media-hooks.js`, `test/state.test.js` (plus `src/background.js` and `manifest.json` on the fallback path)

- [x] **Task 8: dropped.** Muting (pressing Meet's mute button, silencing audio tracks) did not mute reliably on live Meet at Checkpoint B and was removed, along with the Meet adapter and bridge. Use Meet's own mute.

- [x] **Checkpoint C (after 7)**
  - [x] Tests pass
  - [x] Full cycle works: pick BRB, automatic re-asks ignored (blur change, reconnect), leave by picking the real camera
  - [x] Human review before continuing

## Phase 4: Entry paths and ship

- [x] **Task 9: Pre-join screen and join in BRB** (S)
  - Acceptance:
    - BRB works on the pre-join screen with the same rules.
    - If Meet remembers "BRB Camera", the first video request of a call opens in BRB and you join showing the card.
  - Verify: `node --test` (join flows replayed in `test/media-hooks.test.js`); manual: pre-join in BRB, then join; start a call with BRB remembered.
  - Dependencies: Task 7
  - Files: `src/page/state.js`, `src/page/media-hooks.js`, `test/state.test.js`

- [x] **Task 10: Manual checklist, README, `CLAUDE.md` commands** (S)
  - Acceptance:
    - `docs/manual-checklist.md` lists every live-Meet check from the Spec's Testing Strategy, plus camera off then on during BRB (the card shows again) and the kill-the-extension test.
    - `README.md` explains loading unpacked and the one limit worth knowing (tabs opened before install need a reload).
    - `CLAUDE.md` Commands and Status sections match reality.
  - Verify: read-through; every command in the README runs.
  - Dependencies: Task 9
  - Files: `docs/manual-checklist.md`, `README.md`, `CLAUDE.md`

- [x] **Task 11: Live verification against the Spec's success criteria** (S, run by the user)
  - Acceptance:
    - Every item in `SPEC.md` "Success Criteria" is ticked in `docs/manual-checklist.md` or has a recorded failure with a follow-up task.
    - 30-minute hidden-tab run passes with a second participant who joins during BRB.
  - Verify: filled-in checklist.
  - Dependencies: Task 10
  - Files: `docs/manual-checklist.md`

- [x] **Checkpoint D: Complete**
  - [x] All Spec success criteria met, except plug/unplug of a second camera (skipped: one camera)
  - [x] `node --test` passes
  - [x] Ready for review
