# BRB Camera for Google Meet

*   **Author:** Kartik Yadav
*   **Status:** Proposed
*   **Date:** 2026-11-11

--------------------------------------------------------------------------------

## Overview

BRB Camera is a personal Manifest V3 browser extension for Brave and Chrome on macOS. It lets you step away from a Google Meet call while other people see a "Be Right Back" card in your video tile. While the card is up, your webcam is shut off, so its light goes off, and your mic is muted.

You switch BRB on with the extension's toolbar button, a keyboard shortcut, or by picking "BRB Camera" in Meet's camera list. You switch it off with the toolbar button or the shortcut. All of them change the same on/off state, so they can't disagree.

The extension works by giving Meet a video feed that the extension itself produces. While you're live, that feed copies your real camera. During BRB it shows the card instead. Meet never sees the feed change, so its own internal camera handling can't undo BRB.

## The Problem

When you step away from a Meet call today, you have two poor choices:

*   **Leave the camera on.** People see an empty chair, or whatever is behind you, and may keep talking to you.
*   **Turn the camera off with Cmd+E.** People see your initial or profile picture. That looks the same as "camera off but still listening", so they can't tell you're gone. They ask "are you there?" and wait.

What's missing is a clear "I'm away" signal in the one place everyone is already looking: your video tile. Muting is a separate step (Cmd+D) that is easy to forget, and an open mic in an empty room is a privacy risk.

There are existing ways to show a custom image as your camera, but each has a cost:

*   **OBS Virtual Camera:** OBS has to run in the background, it keeps the webcam light on, and it doesn't touch the mic.
*   **Changing your display name to "BRB":** that can't be done in the middle of a call.

The proposed solution is a browser extension. With one action it replaces your video with a BRB card, turns the webcam off and mutes the mic. With one action it brings your camera back. The mic stays muted until you unmute it yourself, so you never go live by accident.

## Goals

*   **People see the card quickly.** Others see a readable "Be Right Back" card in your tile within about 1 second of switching on BRB.
*   **The card keeps showing in the background.** It stays visible (not frozen, black or blank) while the Meet tab is hidden or the screen is locked, for at least 30 minutes. People who join the call during BRB also see it.
*   **The webcam light is off for the whole of BRB.**
*   **The mic is muted during BRB, and the extension never fails toward an open mic.** This includes the return. The exact rules are the three guarantees in "Audio muting".
*   **One state, one way back.** The toolbar button, the keyboard shortcut and picking "BRB Camera" in Meet's camera menu all switch on the same state. Only the toolbar button and the shortcut switch it off. Nothing Meet does by itself, such as switching cameras when a dock is plugged in, can end BRB.
*   **Works when your camera was off.** If your Meet camera was off when you switch on BRB, the extension turns Meet's video on with only the card (the real camera is never opened). It turns the video back off when you return.
*   **A call can start in BRB.** If Meet remembers "BRB Camera" as your camera, the next call opens in BRB and your audio is silent from the start. The extension presses Meet's mute once. If Meet's mic button isn't drawn yet, Meet's icon may still show unmuted. The badge then shows red "!" and the `muteNotConfirmed` message appears, and you press Cmd+D to make the mute visible.
*   **Returning is safe.**
    *   Your real camera comes back within about 2 seconds.
    *   If the camera can't be reopened, for example because another app is using it, you stay on the card and see the reason.
*   **The badge shows what is actually happening, not what you last clicked.** The badge rules are defined once, in "Health checks and the badge".
*   **Live video is unchanged.** Outside BRB, video through the extension matches video without it: the same frame rate, resolution and blur/background effects. The relay is used on every call, so a fault in it would affect every meeting.
*   **No silent no-op.** Pressing the button or shortcut on a Meet tab where the extension isn't running (for example, a tab opened before you installed or updated it) shows the `reload` message. It never does nothing silently.
*   **Works on the pre-join screen.** BRB can be switched on and off on Meet's pre-join screen, with the same rules. If it's on when you click "Join", you join already in BRB.
*   **Measured CPU use.** It is checked once on your own Mac, but it does not block release.

## Non-Goals

*   **Other meeting sites:** Zoom web, Microsoft Teams web, Slack huddles and others.
*   **Native meeting apps.** These would need OBS or a macOS camera extension.
*   **Custom card content:** your own message text, a countdown, an image or a video.
*   **Turning BRB on automatically** when you go idle or lock the screen.
*   **Turning the mic back on automatically** when you return.
*   **Publishing to the Chrome Web Store**, supporting other users, and an options page.
*   **Telemetry or saved logs.**
*   **Automated end-to-end tests against live Meet.** A manual checklist replaces them.
*   **Firefox and Safari.**
*   **Choosing between Meet tabs.** With several Meet tabs open, the button and shortcut act on the active tab only. They don't look for the tab that is in a call.
*   **A sharper card in small tiles.** If Meet lowers the card's resolution in a small grid tile, that is accepted.

## Open Questions

None. Resolved during drafting:

*   **Pre-join screen:** BRB works there with the same rules (see CUJ 9).
*   **Two Meet tabs:** the button and shortcut act on the active tab only.
*   **Card size:** 640×360 with large text is accepted, even if Meet lowers the resolution in small tiles.

## Critical User Journeys (CUJs)

### CUJ 1: Step away mid-call from the toolbar

*   **Given**: You are in a Meet call with your camera on and your mic on. The extension is loaded in the tab.
*   **When**: You click the toolbar button, or press the shortcut.
*   **Then**:
    *   Within about 1 second, others see the "Be Right Back" card in your tile.
    *   Your webcam light turns off.
    *   Meet's mic icon shows muted.
    *   The badge turns green "BRB".

### CUJ 2: Come back

*   **Given**: BRB is on.
*   **When**: You click the toolbar button or press the shortcut again. (Picking a camera in Meet's camera list does not end BRB; it keeps the card.)
*   **Then**:
    *   Within about 2 seconds, your real camera is back in your tile and the light is on.
    *   The badge clears.
    *   The `back` message appears (see "Messages on the page").

### CUJ 3: Step away by picking "BRB Camera" in Meet

*   **Given**: You are in a call with your real camera selected.
*   **When**: You open Meet's video settings and pick "BRB Camera".
*   **Then**: The result is the same as CUJ 1, and the toolbar badge shows BRB.

### CUJ 4: Step away while your camera is already off

*   **Given**: You are in a call with your Meet camera turned off, so others see your initial.
*   **When**: You click the toolbar button.
*   **Then**:
    *   Meet's video turns on showing only the card. Your real camera never opens and the light stays off.
    *   Your mic is muted.
    *   When you return, Meet's video turns back off.
    *   If Meet's video doesn't turn on within about 2 seconds, the mic is still muted and the badge shows the "card not showing" state from the badge table.

### CUJ 5: Away for a long time with the tab hidden

*   **Given**: BRB is on.
*   **When**: You switch to another tab or app, or lock your Mac, for 30 minutes. Someone new joins the call.
*   **Then**:
    *   The card stays visible to everyone, including the new person.
    *   The mic stays muted.
    *   When you unlock, BRB is still on. It does not switch off by itself.

### CUJ 6: Join a call that opens in BRB

*   **Given**: Meet remembered "BRB Camera" from your last call.
*   **When**: You open a new Meet link.
*   **Then**:
    *   Your tile shows the card from the start and the real camera never opens.
    *   Your audio is silent. Meet's mic icon shows muted, unless its button wasn't ready yet.
    *   The badge shows green BRB, or red "!" with `muteNotConfirmed` if Meet's icon still shows unmuted. Pressing Cmd+D then turns the badge green.
    *   Coming back follows CUJ 2 and uses the system's default camera.

### CUJ 7: Camera can't be reopened

*   **Given**: BRB is on, and another app (for example FaceTime or Zoom) has taken the webcam.
*   **When**: You try to come back.
*   **Then**:
    *   The card stays up and the mic stays muted.
    *   The badge shows red "!".
    *   A message on the page says "Camera in use by another app". You can retry.

### CUJ 8: The extension isn't running in this tab

*   **Given**: A Meet tab that was opened before you installed or updated the extension.
*   **When**: You click the toolbar button.
*   **Then**: The badge shows grey "?", and the `reload` message appears. Nothing else changes.

### CUJ 9: Switch on BRB before joining

*   **Given**: You are on Meet's pre-join screen, and the camera preview shows your real camera.
*   **When**: You click the toolbar button, then click "Join now".
*   **Then**:
    *   Before you join, the preview switches to the card, the webcam light turns off, and the pre-join mic toggle shows muted.
    *   After you join, others see the card and you are muted from your first moment in the call.
    *   The badge shows BRB throughout.

## Technical Plan (Architecture)

### How the pieces fit

The extension has three parts, each running in a different place:

| Part | Where it runs | What it owns |
|---|---|---|
| **Page hook** | Inside the Meet page, in the same JavaScript world as Meet's code (`world: "MAIN"`, `run_at: "document_start"`) | All call state: the BRB state machine, the relay video track, the BRB card, muting audio, and health checks. It uses standard browser APIs only and contains no Meet-specific code. |
| **Meet adapter and bridge** | Inside the Meet page, in the extension's isolated world (an ordinary content script) | Everything that touches Meet's own buttons (mic and camera), the on-page messages and pill overlay, and passing messages between the page hook and the background worker. |
| **Background worker** | The MV3 service worker | Toolbar button clicks, the keyboard shortcut, and the per-tab badge. It holds no state, so it can be shut down at any time without losing anything. |

```text
 Meet's code
    │  getUserMedia() / enumerateDevices() / track.enabled = …
    ▼
┌────────────────────── Page hook (MAIN world) ───────────────────────┐
│                                                                     │
│  media hooks ──► state machine (LIVE / BRB / REACQUIRING)           │
│      │                 │ effects                                    │
│      ▼                 ▼                                            │
│  relay track ◄── source: real camera frames  OR  BRB card frames   │
│  (clones handed to Meet)                                            │
│  track gate: mic silence, video clones kept enabled in BRB          │
│  health check ──► status every 2 s and after every change           │
└──────────────┬──────────────────────────────────▲───────────────────┘
               │ window.postMessage (status)      │ commands (toggle)
┌──────────────▼────── Meet adapter + bridge (isolated world) ────────┐
│  clicks Meet's mic/camera buttons and reads their state;            │
│  shows on-page messages and the BRB pill overlay                    │
└──────────────┬──────────────────────────────────▲───────────────────┘
               │ chrome.runtime messages          │ chrome.tabs.sendMessage
┌──────────────▼────── Background worker (stateless) ─────────────────┐
│  toolbar click / shortcut ──► "toggle" to the active tab            │
│  status from a tab ──► badge text and colour for that tab           │
│  no answer from a tab ──► badge "?" and inject "Reload this tab"    │
└─────────────────────────────────────────────────────────────────────┘
```

### Relay video track

Whenever Meet asks for video, the page hook gives Meet a video track that the extension produces itself, instead of the real camera track.

*   **The master track.** A single, hidden "master" `MediaStreamTrackGenerator` (kind `video`) is created as soon as the page hook loads. That way the card can start before Meet has asked for any video. Meet never receives this master track. It only receives clones made with `master.clone()`.
    *   Every clone receives the frames written to the master.
    *   When Meet switches devices, it stops the old clone. That ends only that clone, and the master keeps running.
*   **The source changes, the track doesn't.** What gets written into the master depends on the state:
    *   **LIVE:** frames come from the real camera. The page hook opens the real camera with Meet's own video request and reads its frames with a `MediaStreamTrackProcessor`. Each frame is written into the master and then closed. The camera drives the timing, so no timer is involved.
        *   When the relay switches to a new real camera, it stops the previous one.
        *   **Matching Cmd+E:** when Meet has held no live video clone for 1.5 s while LIVE (`noClonesForMs` ≥ 1500, see "Track gate"), the relay stops the real camera, so the light goes off just as it would without the extension. The next video request opens the camera again. The 1.5 s wait stops the light from blinking when Meet drops an old clone just before asking for a new one, which happens on device switches, blur changes and reconnects.
    *   **BRB:** frames come from the card. The real camera track is stopped, which turns the light off. A `setInterval` of 500 ms draws the card from a 640×360 `OffscreenCanvas` that was drawn once. Each tick writes it into the master as a new `VideoFrame` with an increasing timestamp. Timers keep running at about once a second in hidden tabs, so a 500 ms interval gives at least 1 frame per second even under throttling.
*   **Answering Meet's questions about the track.** Each clone handed to Meet is patched so Meet gets sensible answers:
    *   `getSettings()` reports the `deviceId` the clone was handed out for, fixed when it is created, plus the frame width and height. So a toolbar entry doesn't change the camera Meet shows as selected, and only a menu pick of "BRB Camera" makes Meet see `brb-camera`.
    *   `getCapabilities()` passes through to the real camera when there is one.
    *   `applyConstraints()` is forwarded to the real camera track and always resolves.

    Meet uses these answers to show which camera is selected.
*   **Keeping the card visible if Meet disables video.** Meet may turn the camera off by setting `track.enabled = false` on its clone instead of stopping it. During BRB the track gate forces every video clone's real value to `true`, so the card is never sent as black frames. When BRB ends, it restores the value Meet last set.

### Fake "BRB Camera" device

*   **Adding the entry.** The `MediaDevices.prototype.enumerateDevices` wrapper adds one more `videoinput` entry to the end of the real list:
    *   `deviceId: "brb-camera"`
    *   `groupId: "brb-camera"`
    *   `label: "BRB Camera"`

    The ID is fixed, so Meet's remembered choice survives a reload.
*   **When it appears.** The entry is added only after at least one real camera has a label. Real cameras have blank labels until camera permission is granted, and a single labelled fake entry would look wrong next to them.
*   **Telling Meet the list changed.** When the entry first appears, the wrapper fires a `devicechange` event so Meet refreshes its list.
*   **Shape of the entry.** It is a plain object with a `toJSON()` method, not a real `MediaDeviceInfo`, because the browser doesn't allow scripts to construct one.
    *   **Risk:** if Meet checks `instanceof MediaDeviceInfo`, the entry won't appear. The first build must confirm it does. If it doesn't, the fallback is to switch only from the toolbar button and drop the menu entry.

### What happens when Meet asks for the camera

The `MediaDevices.prototype.getUserMedia` wrapper splits each request into its video part and its audio part.

*   **Video part.** The page hook remembers `lastLiveRequestId`: the device Meet asked for in its most recent request made while LIVE, or `null` before the first one. Each request is sorted by the pure helper `classifyVideoRequest(state, lastLiveRequestId, requestedDeviceId)` in `state.js`:
    *   **`brb-camera` in LIVE, when `lastLiveRequestId` is not `brb-camera`:** `PICK_BRB`. No real camera is opened. This is a menu pick, or the first request of a call that opens in BRB.
    *   **`brb-camera` in LIVE, when `lastLiveRequestId` is already `brb-camera`:** `SWITCH_CAMERA` to `savedDeviceId`, or to the default camera if that is `null`. This is Meet re-asking for its remembered device after a BRB entered from the menu has ended (a blur change, a reconnect, a dock plugged in). It must not put you back into BRB.
    *   **A real or default camera in LIVE:** `SWITCH_CAMERA`. The relay's source switches to that camera.
    *   **After sorting a LIVE request,** `lastLiveRequestId` is set to the requested device. Requests in BRB and REACQUIRING don't change it.
    *   **A camera open that finishes too late.** Every `SWITCH_CAMERA` open takes a token first, the same way "Reopening the camera" numbers its attempts. When the track arrives, it is used only if the state is still LIVE and the token is still the latest. Otherwise the track is stopped at once and Meet gets a card clone. So pressing BRB while Meet is still opening a camera (on the pre-join screen, after a blur change, during a reconnect) can't bring live video back.
    *   **Any request in BRB or REACQUIRING:** `CARD`. Meet gets a card clone and nothing changes. This covers Meet re-asking for the same camera (when BRB turns Meet's video on, when you change blur, or when the call reconnects), Meet switching devices by itself (a dock, Continuity Camera, an unplugged camera), and you picking a camera in Meet's menu. Only the toolbar button and the shortcut end BRB.
    *   **Meet's video settings.** Every real-camera request also records Meet's video constraints as `lastVideoConstraints`, even requests answered with the card. Reopening the camera on return reuses them with `deviceId` replaced, so resolution and frame rate match what Meet asked for.
    *   **In every case,** Meet gets a fresh clone of the master track, which reports the device Meet asked for (or `savedDeviceId` when Meet asked for the default).
*   **Audio part:** the wrapper passes the request to the original `getUserMedia` and registers every audio track it returns (see the next section).
*   **Return value:** a `MediaStream` holding the clone and the audio tracks. Errors from the real camera, such as permission denied or camera busy, are passed on to Meet unchanged when in LIVE.

### Track gate

The page hook wraps the `enabled` property on `MediaStreamTrack.prototype` and the `MediaStreamTrack.prototype.clone` method. It applies them only to the tracks it has registered:

*   **Audio tracks** returned by Meet's `getUserMedia` calls, and their clones.
*   **Video clones** handed out by the relay, and any clones Meet makes of those (for example for self-view).

Tracks can be cloned two ways, and the gate covers both:

*   `MediaStreamTrack.prototype.clone()`: the clone gets the same kind as its source.
*   `MediaStream.prototype.clone()`: this clones every track in the stream without calling the track method, so it is wrapped too. Each new audio track is registered as audio if the source stream held a registered audio track, and each new video track as a video clone if the source stream held a registered video clone.

`new MediaStream(tracks)` needs no wrapper: it holds the same track objects, which are already registered. Iframes are not covered, because the page hook runs in the main frame only (`all_frames: false`) and Meet's media runs there; see "Known limits".

For each registered track the gate remembers **what Meet wants**: the last value Meet assigned to `track.enabled`. When Meet reads `track.enabled`, it gets that value back, so its UI logic is not confused. The real value is decided by the gate:

*   **Audio:** Meet's value, unless the silence flag is on, in which case it is `false`.
*   **Video clone:** Meet's value, unless BRB is on, in which case it is `true`. This keeps the card visible (see "Relay video track").

A track gets the gate's current flags the moment it is registered. So audio tracks that arrive while BRB is already on start silent. An example is the new tracks Meet requests after you click "Join" from a pre-join screen in BRB.

The gate also counts live video clones (`liveVideoClones`). It records the time the count last dropped to 0, which gives `noClonesForMs`: 0 while any clone is live. Both the relay's camera stop and the badge use this value.

### Audio muting

**Entering BRB (`silenceAudio`):** sets the silence flag, so every registered audio track goes silent.

**Meet's mic state.** The bridge watches Meet's mic button (its `data-is-muted` attribute) and sends `micState { muted: true | false | null }` to the page hook whenever the state changes. It also checks once a second, in case the button is replaced. The gate keeps the latest value.

**The one release rule.** The silence flag clears only when one of these holds:

*   BRB is off and the latest `micState` is `muted: true`;
*   BRB is off and you press **Release mic**. Pressing it during BRB does nothing.

The gate checks this rule whenever BRB ends (`releaseAudio`) and whenever a new `micState` arrives. Nothing else clears the flag. That includes Meet setting `enabled` by itself, and Meet's button being redrawn or temporarily missing (`null`).

What this means when you return:

*   **Meet's mic shows muted:** the flag clears at once. Meet's own mute keeps you silent, and pressing unmute in Meet works as normal.
*   **Meet's mic shows unmuted:** the flag stays on, and the page shows the "mic held" message. Press Meet's mic button once: it shows muted, so the flag clears. Press it again to talk.
*   **Meet's mic button can't be found:** the flag stays on, and the page shows the "mic held" message with a **Release mic** button.

**The mic guarantees.** These are referred to elsewhere in this document:

1.  **BRB always silences the mic,** whatever Meet does, because the silence flag makes the real value false.
2.  **Returning never unmutes by itself.** The flag clears only under the release rule above.
3.  **Meet's own unmute keeps working after you return.** Once the flag is cleared, Meet's value is used again.

**The visible mute.** On entering BRB, the Meet adapter clicks Meet's mic button if it shows unmuted, then reads its state again 500 ms later.

*   **How the button is found:** a button carrying Meet's `data-is-muted` attribute, telling mic and camera apart by their `aria-label`.
*   **Two screens:** the pre-join screen and the in-call toolbar have different buttons, so the adapter has a separate selector for each.
*   **If the button can't be found or doesn't confirm muted:** the audio is still silent (guarantee 1). The page shows the "mute not confirmed" message, and the badge turns red "!". The return itself relies on the release rule, not on this result.

### State machine

This section is the **single definition** of the state machine. `src/page/state.js` implements it and the tests check it row by row; neither restates it.

A single pure function makes every state decision: `next({ state, ctx }, event) → { state, ctx, effects[] }`. It has no browser calls, so it can be unit-tested in Node. The page hook carries out the returned effects in order. An event not listed for the current state changes nothing and has no effects (for example, `TOGGLE` during `REACQUIRING`).

The state is `LIVE` from the moment the page hook loads, with an empty context. There is no separate "starting" state.

*   **States:**
    *   `LIVE`: the real camera feeds the relay, or there's no source because Meet's video is off.
    *   `BRB`: the card feeds the relay.
    *   `REACQUIRING`: reopening the real camera.
*   **Context (what it remembers):**
    *   `savedDeviceId`: the camera to go back to.
    *   `videoWasOff`: whether Meet's camera was off when BRB started.
*   **Events:**
    *   `TOGGLE { meetVideoOff, currentDeviceId }`: toolbar button or shortcut.
        *   `meetVideoOff` comes from Meet's camera button (`data-is-muted="true"`), read by the adapter. If the button isn't found, it falls back to `liveVideoClones === 0`.
        *   `currentDeviceId` is the real camera feeding the relay, or `null`.
    *   `PICK_BRB { currentDeviceId }`: Meet asked for `brb-camera` while LIVE.
    *   `REACQUIRE_OK`: the reopened camera is ready.
    *   `REACQUIRE_FAIL { reason }`: also sent when no camera arrives within 3 s.
*   **Effects.** Each relay effect has the same name as the relay method that carries it out.
    *   `startCard`, `stopCard`.
    *   `stopRealCamera`.
    *   `openRealCamera { deviceId | null }`: see "Reopening the camera" below.
    *   `useRealCamera`: point the relay at the reopened camera.
    *   `silenceAudio`: set the silence flag.
    *   `releaseAudio`: apply the release rule in "Audio muting".
    *   `clickMeetMicMute`.
    *   `setMeetCamera { on }`: bring Meet's camera button to the given state. The adapter reads the button first and clicks only if it shows the other state, so this never toggles blindly.
    *   `message { id }`: show one of the messages in "Messages on the page".

| # | From | Event | To | Context change | Effects (in order) |
|---|---|---|---|---|---|
| 1 | LIVE | `TOGGLE{meetVideoOff:false}` or `PICK_BRB` | BRB | `savedDeviceId` = current camera, `videoWasOff` = false | `startCard`, `stopRealCamera`, `silenceAudio`, `clickMeetMicMute` |
| 2 | LIVE | `TOGGLE{meetVideoOff:true}` | BRB | `savedDeviceId` = null, `videoWasOff` = true | `startCard`, `silenceAudio`, `clickMeetMicMute`, `setMeetCamera(on)`. Meet then asks for video and gets a card clone; the real camera is never opened. |
| 3 | BRB | `TOGGLE`, `videoWasOff` = false | REACQUIRING | — | `openRealCamera(savedDeviceId)` |
| 4 | BRB | `TOGGLE`, `videoWasOff` = true | LIVE | `videoWasOff` = false | `setMeetCamera(off)`, `stopCard`, `releaseAudio`, `message(back)`. No real camera is opened. |
| 5 | REACQUIRING | `REACQUIRE_OK` | LIVE | — | `useRealCamera`, `releaseAudio`, `message(back)` |
| 6 | REACQUIRING | `REACQUIRE_FAIL{reason}` | BRB | — | `message(cameraFailed)` with the reason |

`videoWasOff` = true means the extension turned Meet's camera on, so only then does the return turn it off. Because `setMeetCamera(off)` reads the button first, row 4 does nothing to the camera if you already turned it off yourself with Cmd+E during BRB, or if Meet never turned it on.

Row 4 never reopens the camera. When Meet's video is later turned back on, Meet asks for video again, and the LIVE path in "What happens when Meet asks for the camera" opens the real camera.

*   **Starting in BRB.** If Meet's first video request on a page is for `brb-camera`, `classifyVideoRequest` returns `PICK_BRB`, and row 1 runs as usual:
    *   the card starts;
    *   the mic is silenced;
    *   Meet's mute is pressed;
    *   `stopRealCamera` does nothing, because no camera was opened.

    `savedDeviceId` is `null`, so returning uses the default camera. The same applies on the pre-join screen, where Meet makes its first camera request.
*   **Toolbar before any video request.** If you press the toolbar before Meet has asked for video, for example after joining with your camera off, the state is LIVE and the press follows row 2. The master track already exists, so the card has somewhere to go.
*   **Reloads.** State lives only in the page. Reloading the tab resets everything, and Meet's remembered device decides what the first request is.

**Reopening the camera (`openRealCamera`).**

1.  Each reopen gets an attempt number.
2.  The page hook calls the original `getUserMedia` with `lastVideoConstraints`, with `deviceId` set to the target (or removed for the default camera).
3.  If the track arrives within 3 s and the attempt is still current, the hook keeps it as `pendingTrack` and dispatches `REACQUIRE_OK`. `useRealCamera` then hands `pendingTrack` to the relay.
4.  If 3 s pass first, the hook dispatches `REACQUIRE_FAIL`. The attempt is no longer current, so a track that arrives late is stopped at once and the light doesn't come on during BRB.

### Health checks and the badge

The page hook builds a status object every 2 seconds and 700 ms after every state change:

```text
{ state, realCameraLive, audioSilenced, cardFramesDelta, liveClones, noClonesForMs, clonesEnabled, meetMicMuted, error }
```

Every field is a local fact the extension can read directly. No hook into Meet's call connection is used.

| Field | Meaning |
|---|---|
| `realCameraLive` | The relay holds a real camera track whose `readyState` is `"live"`. |
| `audioSilenced` | Every live registered audio track has a real `enabled` value of `false`. It is `true` when there are no audio tracks. |
| `cardFramesDelta` | Card frames written since the last status. |
| `liveClones`, `noClonesForMs`, `clonesEnabled` | From the track gate, counting clones Meet made of relay clones. `clonesEnabled` is true when every live clone's real value is `true`. |
| `meetMicMuted` | The latest `micState`: `true`, `false` or `null` (button not found). The bridge adds it. |
| `error` | The id of the last error message (`cameraFailed`). It is set by row 6 and cleared by the next state change. |

**Not covered:** what other people actually receive. That is checked by hand in `chrome://webrtc-internals` (see the manual checklist).

This table is the **single definition** of the badge. The Goals and `background.js` refer to it. Rows are checked from top to bottom, and the first match wins.

| Badge | When |
|---|---|
| grey "?" | No status from the page hook for 5 s, or the toolbar's message got no reply. The background worker then injects the `reload` message with `chrome.scripting.executeScript`. |
| red "!" | `error` is set. |
| none | LIVE. |
| grey "…" | REACQUIRING. |
| red "!" titled "Card not showing: turn camera on" | BRB and `noClonesForMs` > 2000. |
| green "BRB" | BRB, and all of these hold: `realCameraLive` is false, `audioSilenced` is true, `cardFramesDelta` > 0, `liveClones` > 0, `clonesEnabled` is true, and `meetMicMuted` is `true`. |
| red "!" | BRB, with any of the green conditions not met. This includes `meetMicMuted` being `false` or `null`. |

**The pill.** The adapter shows a small pill inside Meet whenever the latest status has `state === "BRB"`. Its text is defined only here: **"BRB · mic silenced · camera off"**.

### Messages on the page

This table is the **single definition** of every message the extension shows. The bridge looks up each `message { id }` here.

| id | Text | Level | Button |
|---|---|---|---|
| `back` | "Back from BRB. Mic still muted (Cmd+D)" | info, disappears after 5 s | — |
| `muteNotConfirmed` | "Mic silenced by BRB, but Meet's mic icon may look on" | warning, stays until clicked | — |
| `micHeld` | "Mic held silent by BRB. Press Meet's mic button once, then again to talk." | warning, stays until the hold clears | **Release mic** (only shown when Meet's mic button can't be found) |
| `cameraFailed` | "Couldn't get your camera back: {reason}" | error, stays until clicked | **Retry**, which sends `toggle` to the page |
| `reload` | "Reload this Meet tab to use BRB" | error, stays | — |

Only `cameraFailed` has **Retry**. In BRB, Retry is the same as pressing the toolbar, so it tries the return again. No other message can end BRB.

### Messages between the parts

Page hook ↔ bridge messages use `window.postMessage(msg, location.origin)`, where `msg = { source: "brb-ext", dir: "to-page" | "to-content", type, payload }`. Each side accepts only its own `dir` and ignores everything else. Meet's own scripts could in principle fake these messages. That is accepted, because Meet already has full access to your camera and mic. Bridge ↔ background worker messages use `chrome.tabs.sendMessage` and `chrome.runtime.sendMessage` with `{ type, payload }`. All message types are written in lower camelCase:

| type | From → to | payload |
|---|---|---|
| `toggle` | worker → bridge | none. The reply is `{ ok: boolean, reason? }`. |
| `toggle` | bridge → page | `{ meetVideoOff: boolean \| null }` |
| `micState` | bridge → page | `{ muted: boolean \| null }` |
| `releaseMic` | bridge → page | none |
| `clickMeetMicMute` | page → bridge | none |
| `setMeetCamera` | page → bridge | `{ on: boolean }` |
| `message` | page → bridge | `{ id, reason? }` |
| `status` | page → bridge | the status object above |
| `status` | bridge → worker | `{ status: object \| null }` (`null` means stale) |

On the page side, an incoming `toggle` becomes the state machine's `TOGGLE` event.

### Permissions

*   **Manifest:** `"permissions": ["scripting"]`, `"host_permissions": ["https://meet.google.com/*"]`, and `"commands"` with `toggle-brb`. The suggested shortcut is Alt+Shift+B; you can change it in `brave://extensions/shortcuts`.
*   **Not needed:** no camera or microphone permission. The extension uses Meet's existing permission, because all requests go through Meet's page.

### Known limits

*   **Tabs opened before install or update** get no hook. The grey "?" covers this.
*   **Meet stops calling the standard camera API.** If Meet moves camera capture somewhere these wrappers can't see, the extension stops working. The badge shows "?" or "!" rather than failing silently.
*   **Meet's mic and camera buttons** are the parts most likely to break when Meet's UI changes. Their selectors live in one adapter file so they are easy to update.
*   **Hidden pre-join screen.** Pages with a call connection are spared Chrome's strongest timer throttling, but the pre-join screen has no connection yet. If it stays hidden for more than about 5 minutes, the card may slow to about one frame a minute. Nobody sees the card before you join, so this is accepted. The manual checklist includes a hidden pre-join test, and a Web Worker timer is the fallback if it turns out to matter.
*   **After returning from a menu entry,** Meet's camera menu still shows "BRB Camera" as selected, because that is what Meet asked for. Meet's later requests for it in the same call open your camera instead (see "What happens when Meet asks for the camera"). Pick your camera in the menu once you're back, or the next call opens in BRB. To enter BRB from the menu again in the same call, pick your camera first and then "BRB Camera", or use the toolbar button.
*   **Iframes** get no hook (`all_frames: false`). Meet's media runs in the main frame, and the manual checklist confirms this.

## Alternatives Considered

### Alternative A: Use Meet's own shortcuts (Cmd+E and Cmd+D)

*   **Pros**:
    *   No code at all.
    *   The camera light goes off and the mic mutes.
    *   Never breaks.
*   **Cons**:
    *   Others see your initial, which looks the same as "camera off, still listening".
    *   It takes two separate key presses, and it's easy to forget the mic.
*   **Reason for Rejection**: It doesn't send the "I'm away" signal, which is the whole problem. It stays the fallback if the extension is broken.

### Alternative B: OBS Studio virtual camera with a BRB scene

*   **Pros**:
    *   Already exists and is free.
    *   Works in every app, including the Zoom and Teams desktop apps.
    *   Meet updates can't break it.
*   **Cons**:
    *   OBS has to stay running and uses CPU all the time.
    *   It keeps the webcam open, so the light stays on during BRB.
    *   It doesn't mute the mic.
    *   It doesn't help when Meet's camera is off.
*   **Reason for Rejection**: It fails two hard requirements: light off and mic muted. You chose a browser-only tool.

### Alternative C: A native macOS camera extension (Swift and CoreMediaIO)

*   **Pros**:
    *   It's a real system camera, so every app sees it.
    *   No dependence on Meet's page code.
*   **Cons**:
    *   Needs a signed and notarized app and approval in System Settings.
    *   It's a different language and toolchain.
    *   Still no mic control.
*   **Reason for Rejection**: Far more work than a single-user tool needs, and it rebuilds part of OBS.

### Alternative D: Change your display name or show a page overlay

*   **Pros**: Very little code, and no media hooks.
*   **Cons**:
    *   Meet doesn't let you rename yourself in the middle of a call.
    *   An overlay on your own page is visible only to you.
*   **Reason for Rejection**: Other people never see it.

### Alternative E: Swap the video Meet is sending (`RTCRtpSender.replaceTrack`)

*   **Pros**:
    *   Simpler while you're live: Meet keeps the real camera track, so frames aren't copied.
    *   Lower CPU when not in BRB.
*   **Cons**:
    *   Meet calls `replaceTrack` itself when effects are toggled, the resolution changes or the call reconnects. Each call silently undoes BRB and puts you back on camera.
    *   Meet may hold copies of the real camera track, so stopping one doesn't turn off the light.
*   **Reason for Rejection**: Its typical failure is an unannounced return to the live camera, the worst outcome for this tool. You accepted the CPU cost of the relay track to avoid it.

### Alternative F: Click Meet's camera menu to switch devices

*   **Pros**: Meet does all the media work itself.
*   **Cons**:
    *   Takes several clicks in a dialog that changes with Meet updates.
    *   Labels are translated and class names are obfuscated.
    *   Slow, and it flashes UI on screen.
*   **Reason for Rejection**: It is the most fragile approach available. The extension clicks Meet's UI only for the mic button and the camera on/off button, which are simpler and more stable.

### Alternative G: Produce the card with `canvas.captureStream()` driven by `requestAnimationFrame`, or a looping `<video>`

*   **Pros**: The most common technique, with many examples online.
*   **Cons**:
    *   `requestAnimationFrame` stops entirely in hidden tabs.
    *   `captureStream()` produces no frame when the canvas hasn't changed, so latecomers see a blank tile.
    *   A hidden `<video>` can pause, and decoding it costs CPU.
*   **Reason for Rejection**: It freezes exactly when you step away. A `MediaStreamTrackGenerator` fed by a 500 ms timer doesn't depend on painting. Keep `captureStream(0)` plus `requestFrame()` as a fallback only if the generator turns out to be missing in Brave.

### Alternative H: Mute only by pausing the audio inside the extension, or only by clicking Meet's mute button

*   **Pros**:
    *   Pausing only: reliable.
    *   Clicking only: Meet's icon stays accurate.
*   **Cons**:
    *   Pausing only: Meet's mic icon stays "on" for everyone, so people keep talking to you.
    *   Clicking only: if Meet's button changes, the click silently fails and your mic stays live while the card says you're away.
*   **Reason for Rejection**: Each fails on its own. The design uses both. The extension's own pause guarantees silence, and the button click makes the mute visible to others.

### Alternative I: Fork an existing open-source virtual-camera extension (e.g. `spite/virtual-webcam`)

*   **Pros**: Its hook into the camera API on Meet has already been tried.
*   **Cons**:
    *   It's built around swapping the whole camera for a different effect.
    *   It has no BRB state, no mic handling and no health checks.
    *   Forking means inheriting code and build tooling that the plan doesn't need.
*   **Reason for Rejection**: Little of it would survive. Read its hook code for reference while building, but don't fork it.

--------------------------------------------------------------------------------

## Non-Functional Requirements

*   **Privacy:**
    *   No network requests, no storage of camera or mic data, no telemetry.
    *   The extension asks for no camera or mic permission of its own.
    *   Mute fails toward silence (see Audio muting).
*   **Performance:**
    *   While live, there is one extra copy per camera frame. Measure it once in Activity Monitor; it doesn't block release.
    *   During BRB, 2 card frames per second.
    *   Every `VideoFrame` is closed right after it is written, so memory stays flat over a long call.
*   **Rollout and rollback:**
    *   Load it unpacked in Brave.
    *   **Rollback:** turn the extension off and reload the Meet tab. Meet then fails to find `brb-camera` and falls back to your default camera.
    *   Check the manual checklist after Brave or Meet updates.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

### Ground rules

*   **Plain JavaScript and a Node test runner only.**
    *   No bundler, no TypeScript and no npm dependencies.
    *   The only tool is Node 20+ for `node --test`.
*   **Why:** MV3 content scripts can't be ES modules, but several files listed in one `content_scripts` entry share one global scope, so files can talk to each other through a single namespace object.
*   **Namespaces:**
    *   Page-hook files attach to one namespace, `globalThis.__brbExt`, created by the first file.
    *   Isolated-world files attach to `globalThis.brbContent`.
*   **Testable logic.** `state.js` contains only pure functions, and ends with a CommonJS `module.exports` guard so Node tests can `require` it.
*   **Constants:**
    *   `BRB_DEVICE_ID = "brb-camera"`
    *   `CARD_SIZE = 640×360`
    *   `CARD_INTERVAL_MS = 500`
    *   `STATUS_INTERVAL_MS = 2000`
    *   `SELF_CHECK_DELAY_MS = 700`
    *   `REACQUIRE_TIMEOUT_MS = 3000`
    *   `STALE_STATUS_MS = 5000`

    All of them are defined once, in `src/page/state.js`.

### Target Files to Create/Modify

#### 1. `manifest.json` (Create)

*   **Type / Scope**: Extension manifest (MV3).
*   **Proposed Changes**: Declares the following.
    *   **Metadata:** `manifest_version: 3`, `name: "BRB Camera for Meet"`, `version: "0.1.0"`, and `minimum_chrome_version: "110"` (the generator, processor and `world: "MAIN"` content scripts are all available by then).
    *   **Permissions:** `permissions: ["scripting"]` and `host_permissions: ["https://meet.google.com/*"]`.
    *   **Background:** `background.service_worker: "src/background.js"`.
    *   **Toolbar:** `action` with a default title of "BRB Camera" and the icons.
    *   **Shortcut:** `commands.toggle-brb` with `suggested_key: { default: "Alt+Shift+B", mac: "Alt+Shift+B" }` and the description "Toggle Be Right Back".
    *   **Content script 1 (page hook):**
        *   `matches: ["https://meet.google.com/*"]`, `run_at: "document_start"`, `world: "MAIN"`, `all_frames: false`.
        *   `js` (in this order): `src/page/state.js`, `src/page/card.js`, `src/page/relay.js`, `src/page/track-gate.js`, `src/page/health.js`, `src/page/media-hooks.js`, `src/page/main.js`.
    *   **Content script 2 (adapter and bridge):**
        *   Same `matches`, `run_at: "document_start"`, isolated world.
        *   `js`: `src/content/meet-adapter.js`, `src/content/ui.js`, `src/content/bridge.js`.
*   **Why**: These are the three parts from the Technical Plan. The page hook must run at `document_start`, before Meet's code saves its own references to the camera functions.

#### 2. `src/page/state.js` (Create)

*   **Type / Scope**: Pure state machine plus constants. No browser APIs. Loaded in the page and by Node tests.
*   **Proposed Changes**:
    *   **`START = { state: "LIVE", ctx: { savedDeviceId: null, videoWasOff: false } }`**: the state when the page loads.
    *   **`next({ state, ctx }, event) → { state, ctx, effects[] }`** implements the events, effects and rows 1–6 of the table in "State machine" (Technical Plan), which is the only place they are defined.
        *   Events and effects are plain objects: `{ type: "<name>", ...fields }`.
    *   **`classifyVideoRequest(state, lastLiveRequestId, requestedDeviceId)`** returns one of `"PICK_BRB"`, `"SWITCH_CAMERA"` or `"CARD"`, following the rules in "What happens when Meet asks for the camera".
*   **Why**: One pure function owns every decision, so the rules are tested without a browser. Every other file only carries out its effects.

#### 3. `src/page/card.js` (Create)

*   **Type / Scope**: Page hook, frames for the BRB card.
*   **Proposed Changes**:
    *   **`createCardSource(writer)`** returns `{ start(), stop() }`.
    *   **Drawing:** the card is drawn once on a 640×360 `OffscreenCanvas`:
        *   a dark background;
        *   "Be Right Back" centred in a white system sans-serif font at about 72 px bold.
    *   **`start()`:**
        *   Writes one frame at once.
        *   Then a `setInterval` of `CARD_INTERVAL_MS` writes `new VideoFrame(canvas, { timestamp: performance.now() * 1000 })` into the writer, then calls `frame.close()`.
        *   A failed write is counted, not thrown.
    *   **`stop()`:** clears the interval. This is used for the `stopCard` effect.
    *   **Write counter:** a `framesWritten` counter is exposed for health checks.
*   **Why**: Driving frames from a timer is the only approach that keeps running in hidden tabs (see Alternative G).

#### 4. `src/page/relay.js` (Create)

*   **Type / Scope**: Page hook, the relay track.
*   **Proposed Changes**:
    *   **`createRelay()`:**
        *   Builds the master `new MediaStreamTrackGenerator({ kind: "video" })` and gets its writer.
        *   Owns the card source from `card.js`.
        *   Keeps the current real camera track and its processor reader.
    *   **API:**
        *   `cloneForPage(reportDeviceId)`: returns `master.clone()`.
            *   The clone's `getSettings`, `getCapabilities` and `applyConstraints` are patched as described in the Technical Plan. `getSettings` always reports `reportDeviceId`.
            *   The clone is registered with the track gate as a video clone. The gate counts it, together with any clones Meet makes from it.
        *   The method names match the effect names in "State machine".
        *   `useRealCamera(track)`:
            *   stops the card, and stops the previous real track if there is one;
            *   then pumps frames with `MediaStreamTrackProcessor({ track }).readable.getReader()`, using `read → writer.write(frame)`.
            *   A source generation number makes an old pump exit when the source changes.
            *   It is used both for the `useRealCamera` effect and for camera switches while LIVE.
        *   `startCard()`: ends the camera pump, then starts the card.
        *   `stopCard()`: stops the card. The relay then has no source until Meet asks for video again.
        *   `stopRealCamera()`: stops the real track. This is the step that turns the light off. It does nothing if there is no real track.
        *   **Idle check:** a 500 ms timer stops the real camera when the state is LIVE and `gate.noClonesForMs() >= 1500`.
        *   `realCameraLive()`, `currentDeviceId()`, `framesWritten()`.
    *   **Created at load:** `main.js` calls `createRelay()` as soon as the page hook loads, not on the first video request.
*   **Why**: Meet only ever sees clones of one track that the extension owns. This stops Meet's own track swaps and copies from undoing BRB (see Alternative E).

#### 5. `src/page/track-gate.js` (Create)

*   **Type / Scope**: Page hook. Controls the real `enabled` value of audio tracks (mic silence) and of video clones (keeping the card visible).
*   **Proposed Changes**:
*   **Note:** this file puts into practice the "Track gate" and "Audio muting" sections of the Technical Plan, which are the only place the rules are defined.
    *   **Bookkeeping:** a `WeakMap<track, { kind: "audio" | "video", pageWants: boolean }>` records registered tracks, and a set of weak references allows iterating over them.
    *   **`registerAudio(track)`, `registerVideoClone(track)`:** add a track and apply the current flags to it right away.
    *   **The `enabled` property.** The page hook replaces the `enabled` property on the prototype with a wrapper around the original getter and setter.
        *   **Getter:** for registered tracks, returns `pageWants`.
        *   **Setter:** stores `pageWants`, then applies the real value:
            *   audio: `pageWants && !silenced`;
            *   video clone: `pageWants || brbActive`.

            It never changes the silence flag.
        *   Unregistered tracks are passed straight through.
    *   **`clone()`:** the prototype's `clone` is wrapped so that a clone of any registered track is registered with the same kind. This covers clones of clones.
    *   **`MediaStream.prototype.clone()`:** also wrapped. After the original runs, each new track is registered by kind if the source stream held a registered track of that kind, as described in "Track gate".
    *   **`silence()`:** sets the silence flag and `brbActive`, then reapplies the real values.
    *   **`release()`:** clears `brbActive`, applies the release rule, then reapplies the real values. It takes no argument.
    *   **`setMicState(muted)`:** stores the latest `micState`, then applies the release rule.
    *   **The release rule:** if `!brbActive && micMuted === true`, clear the silence flag. That is the only rule that clears it apart from `releaseMic()`.
    *   **`releaseMic()`:** clears the silence flag if `brbActive` is false. Used by the **Release mic** button.
    *   **`isSilenced()`:** true when every live registered audio track has a real value of `false`, or when there are none.
    *   **`liveVideoClones()`, `noClonesForMs()` and `allClonesEnabled()`:** used for the badge, the relay's idle check and the `meetVideoOff` fallback.
    *   **Testability:** `installTrackGate(trackProto, streamProto)` patches whichever prototypes it is given: `MediaStreamTrack.prototype` and `MediaStream.prototype` in the page, or fake classes' prototypes in tests. The file ends with the same `module.exports` guard as `state.js`.
*   **Why**: This puts into practice the three mic guarantees in "Audio muting", and the rule in "Relay video track" that the card is never sent as black frames.

#### 6. `src/page/health.js` (Create)

*   **Type / Scope**: Page hook, status and self-check.
*   **Proposed Changes**:
    *   **`collectStatus()`** returns the status object defined in "Health checks and the badge", built from the relay, the track gate and the last effect error. `meetMicMuted` is added later by the bridge.
    *   **No hook into Meet's call connection.** The `RTCPeerConnection` constructor is not wrapped.
*   **Why**: The badge must report what is actually happening, not what was last clicked.

#### 7. `src/page/media-hooks.js` (Create)

*   **Type / Scope**: Page hook, wrappers around the browser's camera API.
*   **Proposed Changes**:
    *   **`installMediaHooks({ onVideoRequest, onAudioTracks })`** wraps `MediaDevices.prototype.getUserMedia` and `MediaDevices.prototype.enumerateDevices`. It saves the originals first and wraps on the prototype, so references Meet takes later still go through the wrappers.
    *   **`getUserMedia`:**
        *   Splits the request into video and audio parts.
        *   Audio goes to the original function, and the resulting tracks are passed to `onAudioTracks`.
        *   Video goes to `onVideoRequest(videoConstraints)`, which returns the clone.
        *   It then builds `new MediaStream([clone, ...audioTracks])`.
        *   If the audio part fails, the error is passed on.
    *   **`enumerateDevices`:**
        *   Calls the original.
        *   If any real `videoinput` has a non-empty label, it appends `{ deviceId: BRB_DEVICE_ID, groupId: BRB_DEVICE_ID, kind: "videoinput", label: "BRB Camera", toJSON() }`.
        *   The first time the entry appears, it dispatches `new Event("devicechange")` on `navigator.mediaDevices`.
    *   **`requestedDeviceId(constraints)`** reads `deviceId` from all its forms: a plain string, `{ exact }` and `{ ideal }`.
*   **Why**: These are standard browser APIs, the most stable place to hook in. The file has no Meet-specific code.

#### 8. `src/page/main.js` (Create)

*   **Type / Scope**: Page hook, wiring and effect runner.
*   **Proposed Changes**:
    *   **Setup:** when the page hook loads, it creates the track gate and the relay, installs the media hooks, and sets the state to `START` (LIVE).
    *   **`onVideoRequest(constraints)`:**
        *   **Record:** if the request names a real camera, or the default camera, it stores `constraints` as `lastVideoConstraints`.
        *   **Classify** with `classifyVideoRequest`, then act on the result:
            *   `PICK_BRB`: dispatch `PICK_BRB`.
            *   `CARD`: do nothing.
            *   `SWITCH_CAMERA`:
                *   Increment `switchToken` and keep its value.
                *   Open the camera with the original `getUserMedia({ video: constraints })`. For a repeated `brb-camera` request, use `{ ...lastVideoConstraints, deviceId: savedDeviceId }` instead (no `deviceId` if `savedDeviceId` is `null`).
                *   When the track arrives: if the state is still LIVE and `switchToken` is unchanged, call `relay.useRealCamera(track)`. Otherwise stop the track and return a card clone.
                *   If the open fails, throw Meet's error back unchanged.
        *   **Update** `lastLiveRequestId` to the requested device if the state was LIVE.
        *   **Return** `relay.cloneForPage(reportedId)`. `reportedId` is the device Meet asked for. If Meet asked for the default, it is `relay.currentDeviceId()` in LIVE and `ctx.savedDeviceId` otherwise.
    *   **`dispatch(event)`:** calls `next`, runs the effects in order, then posts `status`. After `SELF_CHECK_DELAY_MS` it posts `status` again.
    *   **Effects:**
        *   **`openRealCamera`:** follows "Reopening the camera" in the Technical Plan.
            *   It increments `attempt`.
            *   It calls the original `getUserMedia({ video: { ...lastVideoConstraints, deviceId } })`, or `{ video: true }` if nothing has been recorded. A `null` deviceId removes the field.
            *   It races that call against `REACQUIRE_TIMEOUT_MS`.
            *   **If the camera wins and `attempt` is still current:** it sets `pendingTrack` and dispatches `REACQUIRE_OK`.
            *   **If the timeout wins:** it dispatches `REACQUIRE_FAIL`. A track that resolves later for an old attempt is stopped right away.
            *   **Reason text:** the error name is mapped to plain text, e.g. `NotReadableError` becomes "camera in use by another app".
        *   **`useRealCamera`:** calls `relay.useRealCamera(pendingTrack)`, then clears `pendingTrack`.
        *   **Card and camera:** `startCard`, `stopCard` and `stopRealCamera` call the relay methods of the same name.
        *   **Mic:** `silenceAudio` calls `gate.silence()`, and `releaseAudio` calls `gate.release()`.
        *   **To the bridge:** `clickMeetMicMute`, `setMeetCamera` and `message` are posted to the bridge.
    *   **`TOGGLE` from the bridge:** it carries `meetVideoOff` as read from Meet's camera button. If the bridge sends `null` (button not found), `main.js` uses `gate.liveVideoClones() === 0` instead. `main.js` adds `currentDeviceId: relay.currentDeviceId()`.
    *   **`micState` from the bridge:** calls `gate.setMicState(muted)`.
    *   **`releaseMic` from the bridge:** calls `gate.releaseMic()`.
    *   **Error field:** the `error` field is set to `"cameraFailed"` by row 6 and cleared on the next dispatch that changes the state.
    *   **Status:** a `setInterval` of `STATUS_INTERVAL_MS` posts status.
    *   **Messages:** uses the shapes in "Messages between the parts". It sends with `dir: "to-content"` and accepts only `dir: "to-page"`.
*   **Why**: All call state is kept in one place, inside the page, which is the only part that lives as long as the call.

#### 9. `src/content/meet-adapter.js` (Create)

*   **Type / Scope**: Isolated world. The only file with Meet DOM selectors.
*   **Proposed Changes**:
    *   **`findMicButton()` and `findCameraButton()`:**
        *   Look for buttons with a `data-is-muted` attribute.
        *   Tell mic from camera by an `aria-label` match on /microphone|mic/i or /camera|video/i.
        *   Cover the in-call toolbar first, then the pre-join screen.
        *   Return `null` if nothing is found.
    *   **`isMuted(button)`:** reads `data-is-muted === "true"`.
    *   **`ensureMicMuted()`:**
        *   If the button exists and shows unmuted, clicks it.
        *   Waits 500 ms, then resolves with `{ confirmed: boolean }`.
    *   **`setCamera(on)`:** reads the camera button. If it already shows the requested state, or can't be found, it does nothing. Otherwise it clicks once. It resolves with `{ clicked: boolean }`.
    *   **`micMutedState()` and `cameraOffState()`:** each returns `true`, `false` or `null` (button not found).
    *   **`watchMic(callback)`:**
        *   Puts a `MutationObserver` on the mic button's `data-is-muted` attribute.
        *   Re-finds the button every second in case Meet replaced it.
        *   Calls `callback(muted)` whenever the value changes, including changes to or from `null`.
*   **Why**: Selectors break when Meet changes, so they are kept in one small file. If Meet changes, this is the one file to edit.

#### 10. `src/content/ui.js` (Create)

*   **Type / Scope**: Isolated world, messages shown on the page.
*   **Proposed Changes**:
    *   **`showMessage(id, reason?)`:**
        *   Looks up the text, level and button in the "Messages on the page" table.
        *   Shows the message as a fixed-position toast in a closed Shadow DOM, so Meet's CSS can't affect it.
        *   **Retry** sends `toggle` to the page.
        *   **Release mic** sends `releaseMic` to the page.
    *   **`hideMessage(id)`:** removes a message. Used when the `micHeld` condition ends.
    *   **`setPill(visible)`:** shows or hides the pill at the top centre of the page. Its text is defined in "Health checks and the badge".
    *   **Accessibility:** both use `role="status"`, or `role="alert"` for errors.
*   **Why**: Every failure has to be visible on the page, and these messages are how it shows.

#### 11. `src/content/bridge.js` (Create)

*   **Type / Scope**: Isolated world, passes messages between the page hook and the background worker.
*   **Proposed Changes**:
    *   **From the background worker, `{ type: "toggle" }`:**
        *   Forwards `toggle` to the page with `meetVideoOff: adapter.cameraOffState()`.
        *   Replies `{ ok: true }` if a status arrived within the last `STALE_STATUS_MS`. Otherwise replies `{ ok: false, reason: "no-hook" }`.
    *   **From the page:**
        *   `clickMeetMicMute` calls `adapter.ensureMicMuted()`. If the mute isn't confirmed, it shows `muteNotConfirmed`.
        *   `setMeetCamera { on }` calls `adapter.setCamera(on)`.
        *   `message` calls `ui.showMessage(id, reason)`.
        *   `status`:
            *   adds `meetMicMuted` from the latest mic state;
            *   calls `ui.setPill(status.state === "BRB")`;
            *   shows `micHeld` when the state is LIVE and `audioSilenced` is true, and hides it otherwise. The **Release mic** button appears only when `meetMicMuted` is `null`.
            *   sends `{ type: "status", payload: { status } }` to the background worker.
    *   **Mic state to the page:** `adapter.watchMic` sends `micState { muted }` to the page on every change, and once when the bridge starts.
    *   **Stale check:** a 1 s timer checks for a stale status. If the status is stale, it sends `{ type: "status", status: null }`.
*   **Why**: The page hook can't use extension APIs, and the background worker can't see the page. This file is the link between them.

#### 12. `src/background.js` (Create)

*   **Type / Scope**: MV3 service worker. It holds no state.
*   **Proposed Changes**:
    *   **Toolbar click and shortcut:** `chrome.action.onClicked` and `chrome.commands.onCommand("toggle-brb")` both get the active tab.
        *   If the tab is not on `meet.google.com`, they do nothing.
        *   Otherwise they call `chrome.tabs.sendMessage(tabId, { type: "toggle" })`.
    *   **When the toggle doesn't land:** if that call throws (no receiver) or returns `{ ok: false }`:
        *   it sets the badge to grey "?";
        *   it injects, with `chrome.scripting.executeScript({ target: { tabId }, func })`, a small script that shows the `reload` message (see "Messages on the page") as a fixed banner.
    *   **`runtime.onMessage` `status`:** sets this tab's badge text and title by applying the badge table in "Health checks and the badge" (a `null` status means "?"). Colours: green #1e8e3e, red #d93025, grey #5f6368.
*   **Why**: The service worker can be shut down at any time, so it only forwards clicks and draws badges from the tab's reports.

#### 13. `icons/icon-16.png`, `icons/icon-32.png`, `icons/icon-48.png`, `icons/icon-128.png` (Create)

*   **Type / Scope**: Static assets.
*   **Proposed Changes**: A plain "BRB" monogram on a dark rounded square, generated once and kept in the repo.
*   **Why**: The manifest's `action` and `icons` entries need these.

#### 14. `test/state.test.js` and `test/track-gate.test.js` (Create)

*   **Type / Scope**: Unit tests using `node:test` and `node:assert`.
*   **Proposed Changes**: One test per numbered row (1–6) of the table in "State machine", plus these checks:
    *   starting from `START`, a `PICK_BRB` follows row 1, and a `TOGGLE{meetVideoOff:true}` follows row 2;
    *   unlisted events, such as `TOGGLE` during `REACQUIRING`, change nothing;
    *   rows 2 and 4 never emit `openRealCamera`;
    *   row 2 emits `setMeetCamera(on)` and row 4 emits `setMeetCamera(off)`; no other row touches Meet's camera;
    *   rows 1 and 2 emit `silenceAudio`, and nothing releases the silence except rows 4 and 5;
    *   `classifyVideoRequest`: in LIVE, `brb-camera` returns `"PICK_BRB"` when `lastLiveRequestId` is anything else (including `null`) and `"SWITCH_CAMERA"` when it is already `brb-camera`; any other device or the default returns `"SWITCH_CAMERA"`; in BRB and REACQUIRING, every request returns `"CARD"`.
*   **Track gate tests in `test/track-gate.test.js`:** the gate's logic runs against a fake track object with a plain `enabled` field. It checks the three mic guarantees in "Audio muting":
    *   a release when the mic state isn't `true` keeps the mic silent, even after the page sets `enabled = true`;
    *   the flag clears only when BRB is off and the mic state becomes `true`, or on `releaseMic()` while BRB is off. Changes from `false` to `null` and from `null` to `false` do not clear it, and `releaseMic()` during BRB does nothing;
    *   tracks registered during BRB start silent;
    *   audio tracks from `MediaStream.prototype.clone()` of a stream holding a registered audio track are registered and silenced;
    *   `noClonesForMs` is 0 while a clone is live and grows after the last one ends;
    *   clones of registered video clones are registered and counted;
    *   video clones read `enabled = true` during BRB and get Meet's value back after.
*   **Why**: The mic guarantees and the camera-off path are decisions made in `next()` and the track gate, so they can be proved without a browser.

#### 15. `package.json` (Create)

*   **Type / Scope**: Project metadata.
*   **Proposed Changes**: `{ "name": "brb-meet-extension", "private": true, "type": "commonjs", "scripts": { "test": "node --test test/" } }`. It has no dependencies.
*   **Why**: It gives `npm test` a home. This file is not part of the extension package.

#### 16. `docs/manual-checklist.md` (Create)

*   **Type / Scope**: Manual regression checklist.
*   **Proposed Changes**: Checkbox steps that mirror CUJs 1–9. Each step names what to watch: the tile from a second account or device, the camera light, Meet's mic icon, the badge, and `chrome://webrtc-internals` `framesSent`. It also covers:
    *   a 30-minute hidden-tab test with the screen locked;
    *   BRB switched on at the pre-join screen with the tab hidden for 10 minutes, then joining: the card must be moving again within a few seconds of joining;
    *   toggling Meet's background blur during BRB, which must not undo it;
    *   pressing BRB while the pre-join camera preview is still starting: the light must not come on;
    *   entering BRB from Meet's menu, returning with the toolbar button, then toggling blur: you must stay live;
    *   picking another camera in Meet's camera menu during BRB, and plugging in or unplugging a camera during BRB: the card must stay;
    *   entering BRB with the camera off, pressing Cmd+E during BRB, then returning: the camera must stay off;
    *   unplugging the camera during REACQUIRING;
    *   CPU in Activity Monitor while live.
*   **Why**: This replaces automated tests against live Meet. Run it after Brave or Meet updates.

#### 17. `README.md` (Create)

*   **Type / Scope**: Docs.
*   **Proposed Changes**:
    *   What the extension does.
    *   Loading it unpacked in Brave (`brave://extensions`, Developer mode, Load unpacked).
    *   Setting the shortcut.
    *   What the badge colours mean.
    *   How to roll back: turn the extension off and reload Meet.
    *   A link to the checklist.
*   **Why**: You'll need these steps again after a reinstall or on a new machine.

### Build order (each step is runnable)

1.  `state.js` with `state.test.js`. `npm test` passes.
2.  Manifest, `media-hooks.js`, `relay.js` and `card.js`, wired by a minimal `main.js` in which `TOGGLE` swaps the card on and off. Check in Meet with a second account:
    *   the card shows;
    *   the light goes off;
    *   the card survives 10 minutes in a hidden tab. The full 30-minute screen-locked test is in the manual checklist. If timers turn out to be throttled below one tick per second, the fallback is to drive the card timer from a Web Worker.
    *   "BRB Camera" appears in Meet's list. This confirms or rules out the `MediaDeviceInfo` risk.
    *   live video matches video with the extension turned off: frame rate and resolution in `chrome://webrtc-internals`, and background blur still works;
    *   turning Meet's camera off with Cmd+E shows how Meet does it: by stopping the track or by disabling it;
    *   turning blur on and off during BRB, and toggling Wi-Fi to force a reconnect, keep the card. This checks the camera-request rule in "What happens when Meet asks for the camera".
3.  `track-gate.js`, `meet-adapter.js` (mic and camera state) and the bridge and background worker for the toolbar button and shortcut. Check that the camera-button reading matches Meet's camera state, and that the mic state is reported on every change.
4.  The camera-off path (`setCamera`), starting in BRB, and the pre-join screen.
5.  `health.js`, the badge states, `ui.js` messages and the "?" injection.
6.  Icons, README and the checklist. Run the full checklist once.

### Verification Plan

*   **Compilation/Build**: no build step. Loading the extension unpacked in Brave must show no errors on the `brave://extensions` card.
*   **Unit Tests**: `npm test` runs `node --test test/`, and every test in `state.test.js` and `track-gate.test.js` must pass.
*   **Static Analysis & Linting**: `node --check` on every `.js` file. No linter dependency is added.
*   **Test Coverage Requirement**: every row of the transition table and every mic guarantee has a test. Coverage is not measured in percent.
*   **E2E/Integration**: the manual run through `docs/manual-checklist.md`, with a second Google account or a phone joined to the same call as the observer. The pass criteria are the Goals section: the card within 1 s, the camera back within 2 s, no frozen card after 30 minutes hidden, the light off, and the mic silent with Meet's icon muted.

--------------------------------------------------------------------------------

*Drafted with EGM*
