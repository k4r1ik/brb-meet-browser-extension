# Spike notes (Task 2)

Run 1: Brave on macOS, one built-in camera, solo test call. Source: console output pasted by the user.

## Results
| Question | Result |
|---|---|
| Does a plain-object fake entry with `toJSON()` appear in Meet's camera list and get picked? | **Yes.** Meet requested `{"exact":"brb-camera"}` twice. The `instanceof MediaDeviceInfo` risk did not materialise. |
| Is `userActivation.isActive` true on deliberate picks? | **Yes.** All three picks logged `active: true` (BRB Camera, real camera, BRB Camera). |
| Does `isActive` separate deliberate from automatic changes? | **Not shown.** No automatic event was captured (no plug/unplug, blur change or reconnect: only one camera was available and no `devicechange` fired). Also, transient activation lasts about 5 s after any click, and every line after the first pick logged `active: true`, so a stray switch within 5 s of any click would look deliberate. |
| Is `track.enabled = false` a usable "camera turned off" signal? | **No.** Meet sets `enabled` on video tracks dozens of times, often in bursts of `false`, with `true` interleaved, even when nothing was clicked. It is noise. |
| What happens on a switch? | `getUserMedia` for the new device, then the old track gets `enabled=false` and `track.stop()`. |

## Consequences
1. Task 7 camera-off detection must not rely on `enabled`. Use Meet's camera button instead (the adapter observes a trusted click on it, or its pressed state), then end BRB.
2. `userActivation.isActive` is too loose on its own. Proposed signal: a trusted click or key press within about 1.5 s before the `getUserMedia` call (`msSinceInput` in the updated spike).
3. Verdict for Spec criterion 7: **unproven, not disproven.** Run 2 needed.

## Run 2 (no second camera available)
Source: console output pasted by the user, with the `msSinceInput` signal.

| Event | `msSinceInput` |
|---|---|
| Page load: Meet asks for `{"exact":"brb-camera"}` (remembered from run 1) | `null` (no input at all) |
| Deliberate pick of the real camera in Meet's list | **63 ms** (`active: true`) |
| Meet's follow-up `enabled` and `stop()` calls on that switch | 18 to 823 ms |

- Join in BRB is detectable: the cold-start request for the remembered fake camera arrives with no input and gets `userInitiated: false`, so it enters BRB as designed.
- A deliberate pick arrives within about 0.1 s of the click, far inside the proposed 1.5 s window.
- **Not captured:** blur change, reconnect, and any plug/unplug or dock case. This machine has one camera, so those were not tested. The automatic cases are therefore unproven, not disproven.

## Verdict (Spec criterion 7)
Accept the signal: a trusted click or key press within 1.5 s before the request counts as deliberate. Everything else stays on the card.

- A wrong guess in the common direction fails closed: a missed pick leaves you on the card (you are never exposed).
- The one exposure path is an automatic switch within 1.5 s of an unrelated click. That is narrow and cannot be tested here.
- Camera-off must use Meet's camera button, not `track.enabled` (see Consequences).
- Revisit if, in daily use, you get stuck on the card (add the toolbar and shortcut exit then) or if a stray switch ever shows your camera.
