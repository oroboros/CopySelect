# CopySelect 3.7.8.26 — Focused Expert Panel Review

Scope: Easter egg motion/fading and Clipboard History timeline rail start.

## Panel findings

### 1. Interaction / CSS animation review
Root cause of the failed v3.7.8.25 button-hop fix: the authored `egg-purposeful-jump` class was being added at the correct beats, but a later `transform: ... !important` rule on the button won the cascade and suppressed the transform animation. Source inspection therefore looked correct while the rendered button did not move.

Correction: normal button geometry is locked in place; the two authored hops use the independent CSS `translate` longhand so legacy `transform !important` centering rules cannot cancel them. The hop recreates the old tactile 3px downward press movement.

### 2. Story-state / JavaScript review
The intended motion map is now explicit:
- press 16: hop immediately before `Everyone stands. Even the button.`
- press 17: no hop on the line itself
- press 18: hop immediately after it
- all other main-story presses: no button hop

The translucency sequence now begins on press 29, one press earlier than v3.7.8.25, and runs through press 34.

### 3. Motion-design review
Root cause of the first `emotionally translucent` jump: the first translucent `<p>` was still eligible for the old generic `eggLine` entrance animation (`translateY(5px)` to rest). The opacity logic itself was stable, but the first DOM insertion physically moved the line.

Correction: `.egg-translucent-line` explicitly has no entrance animation and keeps a fixed centering transform. Only opacity changes.

The requested `A tiny disco moment` movement now applies to the whole story line/card, reproducing the old line-entry hop. It uses `translate`, so the line's centering transform remains intact. The button does not move during disco.

### 4. Timeline geometry review
Root cause of the visible rail above the first icon: vertical start was derived from the first icon center, but the rail still used a fixed horizontal `left:155px`. With layout/scaling differences, the rail could sit slightly beside the icon, so the icon could not fully mask the rail even though the rail began at its vertical midpoint.

Correction: both rail X and Y are calculated from the actual first icon center at render time. Bottom termination is also calculated from the actual last icon center. First/last icons remain above the rail and carry an opaque white masking ring.

## Panel conclusion
All four failures were caused by a mismatch between source-level intent and rendered CSS geometry/cascade. v3.7.8.26 is therefore validated using a real Chromium render harness, not only static assertions.
