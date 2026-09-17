CopySelect 3.7.8.20 RC — 2026-09-08

Targeted evening correction pass

Verified items:
- General sticky note remains visible at 1200, 900, 800, and 700 CSS-pixel viewport widths in rendered layout checks.
- Storage special child margins are final-specificity 1px, down 3.5 CSS px from the prior 4.5px token; only the three requested pairs are affected.
- History metadata source line: title + smaller gray parenthesized domain at left; full formatted absolute timestamp at right; relative date/time element removed from card header.
- Timeline labels use 1/5/10/15/30/45 minute, 1/2/3 hour degradation, then Today / Yesterday / formatted date.
- Timeline rail calculation now anchors to the bottom of the first actual source icon and the top of the last actual source icon; single-entry lists suppress the rail.
- History copy-success CSS animation and JS cleanup timer are both 500ms.
- Dialog/form container focus outlines are suppressed without removing control focus styles.
- Reliability separator rendered position measured at exactly -22 CSS px from the helper-list midpoint.
- JavaScript syntax validation, manifest parsing, CSS parse sanity, and package integrity checks passed.
