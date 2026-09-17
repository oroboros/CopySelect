# CopySelect 2026-09-08 — Release Audit

## Baseline and method
- Runtime baseline: the confirmed working 2026-09-08 metadata-hotfix tree (3.7.8.18 internally).
- Current manifest version: 3.7.8.19.
- Corrections are targeted; no broad rollback/replacement from older versions was performed.
- Pixel convention: user-provided px values are direct CSS px unless explicitly stated otherwise.

## Senior developer review
1. **General** — sticky note exists in the Core behavior card and its curved arrow targets the master Enable CopySelect switch.
2. **Clipboard Storage Settings** — previously requested three special gaps remain 4.5 CSS px; no new global storage-spacing change was introduced.
3. **Clipboard History / selection capture** — pointer-down snapshots current selection state; pointer-up copies only a genuinely changed/new selection. `mouseup` cannot immediately re-run the pointer-up path.
4. **History Metadata** — Metadata ON renders both relative and full timestamps regardless of snippet expansion. Relative time is left; full timestamp is top-right with its existing formatter.
5. **History action group** — group alpha is .288, exactly 20% lower than .36; expand/compress button is white in its resting state.
6. **History copy-success** — duration is 1000 ms in JS and CSS; 1 px border + 2 px neon-blue ring. Stats-only storage changes no longer call `renderHistory()`, eliminating the DOM-replacement duration bug.
7. **History loading/end** — 50-item initial batches; IntersectionObserver increments by 50; contextual end marker reflects current History mode/filter.
8. **Collection Settings** — remaining requested top margins reduced again; When matched first row uses three top-aligned columns; Add tags spans all columns and has approximately 85 px more rendered room.
9. **WordWatch Studio** — obsolete empty setup row is hidden; rule editor is compact; Back to Collection Settings remains a real right-aligned button.
10. **Reliability & Safeguards** — separator is another 7 CSS px left, now `calc(50% - 22px)`.
11. **Exports** — complete/settings/history/selected/visible export filenames use `YYYY-MM-DD`.
12. **Prior hotfix retention** — unwanted metadata-state repair and Ctrl+Shift+V CopySelect raw-text recovery remain in the tree.

## Devil's-advocate review
- Verified the focus-return fix does not rely on duplicate-suppression timing: an unchanged selection is rejected before the normal copy queue.
- Verified the metadata fields are not used to decide whether an expand/compress button exists.
- Verified flash duration cannot be shortened by the known stats-only History re-render path.
- Verified final Collection/Studio corrections against rendered/computed styles after discovering legacy selector specificity had defeated earlier source-level changes.
- Verified Studio no longer reserves a hidden button row with min-height/padding.
- Verified the direct-CSS-pixel convention is documented in the living handoff to prevent future 150% scaling reinterpretation.

## Release checks
The packaging pass reruns JavaScript syntax checks, manifest/JSON validation, duplicate HTML ID checks, required-selector/behavior assertions, selection-state integration tests, asset existence checks, and ZIP CRC/integrity verification.


## Final verification results
- Targeted source/package assertions: **74/74 passed**.
- Real content-script pointer-selection integration test: unchanged old selection → 0 copies; changed selection → exactly 1 new copy; fresh selection → exactly 1 new copy.
- Rendered/computed-style audit: three When matched controls share the same top; checkbox-label gap computes to 3 px; Add tags field computes to 259.48 px at the audited dialog width (about 85 px wider than the prior 174.5 px render); Studio setup row computes `display:none`; Studio rule textareas compute to 54 px; Metadata relative/full timestamps are visible and left/right aligned; action group alpha derives from `.288`; expand/compress button is white; copy-flash animation computes to 1 s.
- JavaScript syntax: all top-level JS files passed `node --check`.
- JSON parsing: manifest and history-backup index passed.
- CSS parser: no top-level parse errors.
- Duplicate HTML ID audit: passed.
- Final ZIP: CRC/integrity and extracted-tree equality checked during packaging.
