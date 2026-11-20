# Implementation Plan: BRB Camera MVP

Spec: `SPEC.md` (approved). Tasks are tracked in `tasks/todo.md`. Architecture reference: `docs/designs/brb_camera.md` ("Technical Plan").

## Overview
Build a Manifest V3 extension that adds a fake "BRB Camera" to Meet's camera list. A relay track sits between the real camera and Meet so the card can replace live video without Meet noticing. Fail-closed rule: any error ends on the card or camera-off, never the live camera.

## Architecture Decisions
- **Risk first.** The riskiest assumption is that a deliberate camera pick can be told apart from an automatic switch (Spec Assumption 3). Task 2 is a spike that tests it on live Meet before building the exit logic. Task 7 branches on the result.
- **Pure core.** All decisions live in `src/page/state.js` and are unit tested with `node:test`. Browser-API code stays thin.
- **Vertical slices.** Each task leaves a loadable extension that does something visible: first it loads, then it logs, then the card shows, then you can leave.
- **Fallback decided.** If the spike fails, "any camera change in BRB keeps the card" plus a toolbar button and shortcut as the exit (Spec Open Question 1, approved).
- **Camera off/on during BRB** leaves BRB on (the card shows again). Camera-off detection was tried at Checkpoint C and dropped.

## Dependency Graph
```
1 scaffold ──► 2 spike ──────────────────────────┐
     │                                            ▼
     └──► 3 state.js ──► 4 card + relay ──► 5 hooks + fake device ──► 6 track gate
                                                                        │
                                              ┌─────────────────────────┤
                                              ▼                         ▼
                                   7 leave BRB (needs 2)        (8 dropped)
                                              └──────────┬──────────────┘
                                                         ▼
                                              9 pre-join + join in BRB ──► 10 docs + checklist ──► 11 live verification
```
Tasks 2 and 3 are independent and can run in parallel. Task 8 is independent of 7.

## Task List
See `tasks/todo.md` for the checklist with acceptance criteria. Summary:

### Phase 1: Foundation and risk
1. Scaffold the extension and test runner
2. Spike: live-Meet observation of camera and user-activation signals
3. Pure state machine and request classification
- Checkpoint A

### Phase 2: Core card
4. Card drawing and relay track
5. Media hooks and the fake "BRB Camera" device
6. Track gate (video forced enabled, camera release)
- Checkpoint B: pick "BRB Camera" shows the card, light off

### Phase 3: Leaving and muting
7. Leave BRB by picking a real camera
8. (dropped: muting did not work reliably on live Meet; decided after Checkpoint B)
- Checkpoint C

### Phase 4: Entry paths and ship
9. Pre-join screen and join in BRB
10. Manual checklist, README, `CLAUDE.md` commands
11. Live verification against the Spec's success criteria

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| User-activation signal does not separate picks from auto-switches | High | Spike (Task 2) before Task 7. Fallback is the toolbar and shortcut exit. |
| Meet checks `instanceof MediaDeviceInfo`, so the fake device does not show | High | Task 5 verifies on live Meet. Draft's fallback: drop the menu entry and use the toolbar only. That changes the intent, so stop and ask the user. |
| Relay degrades normal video (frame rate, resolution, blur) | High | Task 4 compares relay on and off. Task 11 repeats it. |
| Real camera exposed on an error path | High | Fail-closed unit tests in Tasks 3, 4, 5 and 7. |
| Card slows when the tab is hidden | Med | 500 ms interval per the draft. Checked for 30 minutes in Task 11. |

## Open Questions
- None blocking. If the spike result changes the exit design, update `SPEC.md` first.
