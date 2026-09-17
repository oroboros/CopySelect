# CopySelect 3.7.8.25 targeted stress test

## Easter egg motion contract

Expected button jumps:
- Press 16: yes. This is the line immediately before “Everyone stands. Even the button.”
- Press 17: no. This displays “Everyone stands. Even the button.”
- Press 18: yes. This is the line immediately after it.
- All other presses, including the first emotional-translucency press (30): no.

Emotional translucency:
- Starts at press 30.
- The same `.egg-translucent-line` node is reused.
- Only line/button opacity is changed during presses 30–35.
- No purposeful jump is invoked during this phase.

Tiny disco:
- The button does not jump.
- The scene paragraph does not twirl.
- Only the displayed `.egg-line-content` performs `eggDiscoJump`, reproducing the deliberate line-jump behavior without contaminating surrounding beats.

## History timeline rail

- First icon is guaranteed for the first visible row because its site key is compared against an initial null key.
- Rail top = first icon top + 50% of first icon height, relative to the History list.
- Rail z-index is below the icon z-index.
- Therefore the rail begins behind the icon center and cannot protrude upward above the first icon.

## Regression checks

- No generic `:active` translateY survives as the final Easter-egg button rule.
- Purposeful button jump class is only applied by the press-16/18 condition.
- Emotional translucency retains opacity transition.
- Tiny disco remains visually distinct via line-only jump.
- Timeline rail bottom behavior is unchanged.
