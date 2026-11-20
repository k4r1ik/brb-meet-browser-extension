# BRB Camera: Statement of Intent

Confirmed by the user on 2026-11-18, based on `docs/designs/brb_camera.md`.

- **Outcome:** Picking "BRB Camera" in Meet's camera list puts a "Be Right Back" card in your tile, so people see you're away.
- **User:** You alone, on Meet in Brave or Chrome on macOS.
- **Why now:** Your initial and an empty chair both look like "still listening", so people keep asking "are you there?".
- **Success:** The card shows reliably. If anything fails, you fall back to your initial and never to your live camera. Showing your camera is the one failure that would make you stop using it.
- **Constraint:** Leaving BRB is your deliberate pick of a real camera or turning your camera off in Meet. Meet switching cameras on its own, such as with a dock, must never end BRB or expose your camera (stay on the card). The mic is muted as a convenience, so a brief open mic is a small problem, not a failure. The toolbar button and shortcut are optional extras.
- **Out of scope:** Other meeting sites, native apps, custom card content, auto-BRB on idle, auto-unmute, the Web Store, other users, telemetry, and automated tests against live Meet.

## Differences from `docs/designs/brb_camera.md`
1. Picking a real camera ends BRB (the design says it doesn't).
2. The toolbar button and shortcut become optional.
3. The three mic guarantees and the red "!" for an unconfirmed mute can be loosened.
4. Open design question: how to tell a deliberate camera pick from an automatic switch.
