# BRB Camera for Google Meet

Personal Manifest V3 extension (Brave/Chrome, macOS). In Meet you pick "BRB Camera" in the camera list and others see a "Be Right Back" card. The real webcam is released. The mic is not touched (use Meet's own mute). You leave by picking a real camera in Meet's menu. Single-user; never published to the Web Store. Meet only.

Core rule: fail closed. On any error, show the card or your initial, never the live camera.

## Status
Implemented through Task 9 (unit-tested, checked live through Checkpoint C and the join flows). Remaining: `tasks/todo.md` Task 10 (docs) and Task 11 (live verification with `docs/manual-checklist.md`).

## Where to look (load only what the task needs)
- `SPEC.md`: approved MVP spec. It wins over the design where they disagree (see its "Changes from the draft").
- `tasks/plan.md` and `tasks/todo.md`: plan, risks and the task checklist with acceptance criteria.
- `docs/designs/brb_camera.md`: original full design (architecture, state machine, request table). It is large (~890 lines); read the relevant section only. Parts of it are out of scope for the MVP (badge, health checks, toolbar, shortcut, verified mute).
- `docs/intent/brb_camera.md` and `docs/ideas/brb_camera.md`: confirmed intent and chosen direction.

## Layout
`manifest.json`, `package.json`, `src/page/` (state, card, relay, track-gate, media-hooks, main), `test/`, `docs/manual-checklist.md`, `README.md`.

## Conventions
- Plain JavaScript, no framework, no build step; MV3 only. Content scripts are classic scripts: each file is an IIFE that registers on `globalThis.__brb` and ends with `if (typeof module !== 'undefined') module.exports = ...` so tests can `require` it. List files in the manifest in dependency order.
- Keep decisions in `src/page/state.js` as pure functions so they are unit-testable.
- Everything runs in the page hook (`src/page/`): no content script, message bridge or Meet-specific selectors. You leave BRB by picking a real camera in Meet's menu; camera off/on does not end it.

## Commands
- Test: `npm test` (runs `node --test`).
- Manual: `brave://extensions` → Developer mode → Load unpacked → this folder, then reload the Meet tab.

## Boundaries
- Do not add Web Store, multi-site, backend, telemetry, custom card content, auto-BRB or auto-unmute.
- Ask before adding a dependency, a build step, or permissions beyond `https://meet.google.com/*`.
- Never hand the real camera track to Meet while in BRB or when state is unknown.
- If code and spec conflict, surface it and ask; update `SPEC.md` first when a decision changes.
- Do not commit unless asked.
