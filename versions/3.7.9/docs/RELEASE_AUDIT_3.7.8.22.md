# CopySelect 3.7.8.22 release audit

Baseline: CopySelect_v3.7.8.21.zip.

## Requested corrections

- [x] Automatic copying master toggle has a stronger 2 px accent-relative border in both Simple and Advanced modes.
- [x] Select unorganized is no longer rendered as a standalone History-list action; it lives in Selection and toggles the visible unorganized set on/off.
- [x] Teach WordWatch from these uses one black SVG icon and no legacy glyph/NBSP artifact.
- [x] Emotionally translucent easter-egg phase reuses the same line node and transitions opacity over 420 ms, avoiding per-click DOM replacement jumps.
- [x] Additional restrained easter-egg line effects are present for look-back, paper-airplane, rainbow, plus the existing disco beat.
- [x] Profile Guide source order is alphabetical; runtime alphabetical guard remains.
- [x] Open Advanced WordWatch Studio is raised exactly 17 CSS px and receives the same stronger border language as Back to Collection Settings.
- [x] Quick Insert tooltips provide examples for URL, Domain, ISO date, Year; Time points to formatting controls below.

## Regression checks

- Selection menu bulk actions remain available.
- Unorganized toggle is excluded from actions requiring an existing selection.
- Pinned view reports no unorganized bulk target.
- WordWatch teaching still opens Collection Settings and drafts terms from selected clips.
- Shift+Click restart and Ctrl+Click previous-line easter-egg controls remain intact.
- FAQ tone/link formatting and the prior History/metadata hotfixes were not removed.
