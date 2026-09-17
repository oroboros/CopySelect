# Devil's Advocate Audit — CopySelect 3.7.8.26

Approval criterion: do not approve because the intended class/rule exists. Approve only if rendered Chromium behavior demonstrates the requested effect and rejects the known failure modes.

## Easter egg adversarial checks

PASS — Ordinary clicks do not move the button.
Rendered button Y displacement was 0px for all tested main-story beats except 16 and 18.

PASS — The two requested button hops actually render.
Chromium bounding-box sampling detected motion on beats 16 and 18 only. This catches the v3.7.8.25 failure where the class existed but `transform !important` suppressed the animation.

PASS — `Everyone stands. Even the button.` itself does not hop.
Beat 17 renders with 0px button displacement.

PASS — Emotionally translucent starts one beat earlier.
First translucency is beat 29, not beat 30.

PASS — First translucency line does not jump.
The rendered translucent line reports `animation-name: none`; its position is fixed and only opacity transitions.

PASS — Disco moves the line, not the button.
`A tiny disco moment. 🪩` renders with `eggDiscoLineHop`; line Y changes during the animation while button Y remains 0px.

## Timeline adversarial checks

PASS — Rail X is derived from the actual first icon center.
Measured error: 0.0px.

PASS — Rail top is derived from the actual first icon center.
Measured error: 0.0px.

PASS — No rail pixel appears above the first icon.
Chromium screenshot pixel sampling at the rail X coordinate immediately above the first icon returned the page background, not the rail color.

PASS — Rail continues below the first icon.
Pixels below the icon resolve to the rail color as expected.

## Devil's Advocate decision
APPROVED for publication for the scoped issues above.

This approval is specifically stronger than the v3.7.8.25 audit because it checks rendered geometry and animation behavior, not merely source structure, class assignment, or syntax.
