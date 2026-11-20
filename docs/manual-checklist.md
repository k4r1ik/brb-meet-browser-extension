# Manual checklist (live Meet)

Run in Brave or Chrome on macOS after loading the extension (see `README.md`). Reload the extension and the Meet tab before each run. Use a test call with a second person or a second device so you can see what others see. Tick a box only after you watched it happen; write a note for any failure.

Run date: ____  Browser/version: ____

## Basics
- [x] Console shows `[BRB] hooks installed` on a Meet tab, and no errors from the extension.
- [x] The camera menu lists "BRB Camera" after your real camera (once camera permission has been granted).
- [x] Picking "BRB Camera": the second participant sees the "Be Right Back" card within about 1 second, and the webcam light goes off.
- [x] Picking your real camera: your live video is back for the second participant within about 2 seconds, and the light comes on.
- [x] Repeat the pick in and out three times in a row. No stuck card, no flash of your live camera while in BRB.

## Safety (the failure that matters: your camera must never show while in BRB)
- [x] While in BRB, the second participant never sees your live camera, including at the moment you pick BRB.
- [x] (known limit) While in BRB, change blur or background effects: the card stays. Result: the card stays up, but Meet applies the effect to the card itself (it processes our video like a camera feed). Safe (your camera never shows) but the card can be blurred or replaced. See Results.
- [x] While in BRB, briefly turn Wi-Fi off and on so the call reconnects: the card stays.
- [ ] SKIPPED (one camera) While in BRB, plug in or unplug another camera, if you have one: the card stays.
- [x] While in BRB, turn your camera off and on in Meet: BRB stays on and the card shows again. (To leave BRB, pick your real camera.)
- [x] Disable the extension at `brave://extensions` while in BRB, then reload the tab: your live camera is not shown to the second participant. Note: after the reload Meet will no longer find "BRB Camera" and uses your real camera; this is expected, so check what the participant sees *before* you reload as well.

## Pre-join and joining in BRB
- [x] On the pre-join screen with your real camera showing, pick "BRB Camera": the preview shows the card and the light goes off. Click Join: you join showing the card.
- [x] Start a call with "BRB Camera" still remembered from before: the pre-join preview shows the card (light off). Join: others see the card.
- [x] On the pre-join screen in BRB, pick your real camera and join: you join live.

## Long run
- [x] In BRB, switch to another tab for 30 minutes (or lock the screen). The card stays visible to the second participant, not frozen, black or blank.
- [x] A participant who joins during BRB sees the card.
- [x] Back on the tab, BRB is still on. It does not switch off by itself.

## Normal calls are unaffected (the relay runs on every call)
- [x] With the extension on and BRB never used, frame rate and resolution look the same as with the extension disabled (compare `chrome://webrtc-internals` or the tile quality). Blur and background effects work.
- [x] Turn your camera off in a normal call: the webcam light goes off within about 2 seconds.
- [x] Muting and unmuting in Meet works as usual, in and out of BRB. The extension never changes your mic.

## Known limits (not failures)
- A Meet tab that was open before the extension was installed or updated needs a reload.
- After you leave BRB, Meet's camera menu keeps showing "BRB Camera" as selected. Pick your real camera to leave.
- Turning the camera off and on during BRB does not leave BRB.
- Meet's blur/background effects apply to the card (see the README). Turn them off before going BRB for a crisp card.
- A hidden pre-join tab can slow the card after roughly 5 minutes. Nobody sees the card before you join.
- With several Meet tabs open, only the tab running the call matters.

## Results
Notes on failures and follow-ups:
- Blur/background effects are applied by Meet to the card, because Meet treats our video as your camera. The extension cannot see or bypass Meet's own effects. Workaround: turn effects off in Meet before going BRB. Decision: accepted as a known limit.
