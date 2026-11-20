# BRB Camera

## Problem Statement
How might we let you pick "BRB Camera" in Meet so a card always shows while you're away, and any failure shows your initial, never your live camera?

## Recommended Direction
Card-first with a relay. The extension gives Meet a video feed it controls. Live, it copies your camera. In BRB, it shows the card. Picking "BRB Camera" turns it on. A deliberate pick of a real camera, or turning the camera off, turns it off. Meet switching cameras on its own never ends BRB. Mic is muted as a best-effort convenience.

## Key Assumptions to Validate
- [ ] A page hook can tell a deliberate pick from an automatic switch (spike on live Meet).
- [ ] The relay leaves normal video unchanged (compare frame rate and resolution with it on and off).
- [ ] "Fail closed" holds when the extension is broken (kill it mid-call, check Meet shows your initial).

## MVP Scope
In: fake "BRB Camera" device, relay, card, stick-until-I-act, best-effort mute.
Out: badge, health checks, toolbar and shortcut, pre-join and join-in-BRB.

## Not Doing (and Why)
- Toolbar/shortcut as primary controls: you use the camera list.
- Verified mute and the red "!": the mic is a convenience.
- Other sites, custom card text, auto-BRB, Web Store: out of scope.
- Camera-off-as-base state (variation 6): not chosen.

## Open Questions
- Should joining a call in BRB (and the pre-join screen) be in the first version?
- Does "turn camera off" in Meet end BRB, or does it just show your initial?
