# CopySelect 3.7.8.15 RC — Release Audit

Baseline: **3.7.8.14 RC**. The current version remains authoritative for UI, layout, styling, and intended features. This pass uses minimal targeted overrides/fixes rather than restoring old files.

## Senior-dev review

1. **Clipboard Storage Settings** — PASS
   - The three requested 15 px child gaps are now 7.5 px, exactly 50% smaller.
   - No other new 3.7.8.15 Storage spacing/layout selector was added.

2. **Clipboard History** — PASS
   - Contrast indicator nudged +1 visible px right / +2 visible px down, translated for the established 150% Windows display geometry.
   - User-supplied `snippet-expanded.png` and `snippet-compact.png` are the runtime assets. `snippet-compact_2.png` is retained but unused.
   - Copy-success effect is 750 ms with a 1 px neon-blue border and 2 px neon-blue outer ring. JavaScript removal timeout is also 750 ms.
   - Metadata visibility no longer gets overridden by expanding a card, and clicking metadata no longer collapses the item.
   - History remains at its 3.7.8.14 position; the separator before View and all View-side controls move 60 visible px left.
   - Snippet action controls use a subtle translucent blue-gray background, intentionally lighter than metadata.

3. **Collection Settings / WordWatch Studio** — PASS
   - Inter-card gap equals the 9 px left form inset.
   - Duration uses the same 110 px label/control alignment as Feedback and fills the same field column.
   - Non-toggle checkboxes use the active mode accent with a white check.
   - When matched places the three binary actions together and Add tags in a full-width aligned row.
   - Studio receives the same card/check/duration/action rules.
   - `<- Back to Collection Settings` remains a real bordered CopySelect button beside the Studio title.

4. **Site Rules** — PASS
   - `Inherit global` is gray in the closed selected field. Dropdown options, including `Inherit global`, are forced to normal ink.
   - Tint is re-synchronized after rule editor reset and after loading an existing rule, not just after a manual change.
   - Tooltip explains plain domains, `*`, regex activation with `^`, and escaping with `\`, and points to the FAQ.

5. **Reliability & Safeguards / FAQ** — PASS
   - Two-column Reliability card now has a vertical separator.
   - FAQ has expand-all and collapse-all icon controls.
   - FAQ includes tags vs Collections vs Saved Views, templates, History/metadata/backups, WordWatch, site patterns, and recurring setup/reliability questions from project discussions.

## Devil's-advocate regression checks

- **Metadata toggle edge case:** Expanded mode + Metadata off remains off after automatic/manual expansion.
- **Metadata click edge case:** Clicking the metadata area no longer changes expansion state or creates stale metadata visibility.
- **Flash coverage:** One base `.history-item.copy-flash` rule covers compact/expanded, metadata on/off, rich/plain, pinned/recent.
- **Toolbar interpretation:** Did not move History left. Only View separator/right-side controls were moved, matching the latest wording.
- **Site-rule stale tint:** Programmatically loading/resetting a rule now updates the closed-field tint immediately.
- **Mode-color regression:** checkbox fill remains `var(--accent)`, rather than hard-coded black/blue; checkmark is explicitly white.
- **Icon regression:** runtime assets are exact copies of the supplied PNG files; alternate compact asset is retained but not referenced.
- **Packaging regression:** root `manifest.json` and `CHANGELOG.txt` remain at root; `docs/` and `history-backups/` remain packaged.

## Static validation

Passed: JavaScript syntax checks, manifest/JSON parsing, duplicate HTML IDs, CSS parse, local asset references, required source assertions, exact icon-byte/transparency checks. ZIP CRC/integrity is recorded after packaging.
