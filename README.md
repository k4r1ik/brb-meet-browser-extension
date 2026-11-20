# BRB Camera for Google Meet

A personal browser extension for Brave and Chrome on macOS. In Google Meet you pick "BRB Camera" in the camera list and everyone sees a "Be Right Back" card in your tile. Your real webcam is released, so its light goes off. You leave by picking your real camera in the same list.

It does not touch your mic: use Meet's own mute. It is a single-user tool and is not published to the Chrome Web Store.

## Install
1. Open `brave://extensions` (or `chrome://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose this folder (the one containing `manifest.json`).
4. Open or reload a tab at `https://meet.google.com`. Tabs that were open before you installed or updated the extension need a reload.

After changing any file, click the reload icon on the extension's card, then reload the Meet tab.

## Use
- **Step away:** open Meet's camera menu and pick **BRB Camera**. Others see the card and your webcam light goes off.
- **Come back:** pick your real camera in the same menu.
- **Camera off and on** during BRB does not end BRB; the card shows again. Pick your real camera to leave.
- **Join in BRB:** if Meet still remembers "BRB Camera", the pre-join preview and the call start in BRB.

If anything goes wrong, you fall back to the card or your initial, never your live camera.

## Develop
```bash
npm test
```
Runs the unit tests (Node 20 or newer). `docs/manual-checklist.md` covers what only live Meet can show.

- `SPEC.md`: the approved spec. `tasks/`: plan and task list.
- `docs/designs/brb_camera.md`: the original design. Parts of it (badge, health checks, toolbar, shortcut, muting) are not built.
- `src/page/`: everything runs in the page: `state.js` (pure decisions), `relay.js` and `card.js` (the video Meet receives), `track-gate.js`, `media-hooks.js` (the fake camera and request handling), `main.js` (wiring).

## Limits
- Meet's own blur and background effects are applied to the card too, because Meet treats the video as your camera. The card may look blurred or replaced. Turn effects off in Meet before going BRB if you want it crisp. The extension cannot see or bypass Meet's effects. Your camera still never shows.
- Meet remembers "BRB Camera" as your selected camera after you leave BRB, and the menu keeps showing it.
- It relies on Meet using the standard camera APIs in the main frame. If Meet stops doing that, BRB stops working.
- It needs Chromium's `MediaStreamTrackGenerator`. If that is missing, the extension installs nothing and Meet runs untouched.
