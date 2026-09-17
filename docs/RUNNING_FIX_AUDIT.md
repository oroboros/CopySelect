
## v3.7.9 consolidated-base migration
- Authoritative base: stylesheet-consolidated v3.7.8.25 RC.
- Migrated only the required post-.25 History timeline geometry and final Easter-egg behavior.
- Preserved the consolidated History-hover disabled-state synchronization that the unconsolidated .27 had accidentally dropped.
- Restore Effects size change was explicitly rejected by the user for v3.7.9 and is not migrated.
- Easter-egg historical CSS is removed and replaced by one scoped authoritative component; effect triggers live in one beat table/controller.
- Release is blocked unless acceptance, runtime rendering, syntax, package, and independent audit checks pass.
# CopySelect RC audit (through 3.7.8.15)

Baseline for this RC sequence: the current 3.7.8.9 RC line, with cumulative history traced back to the first package uploaded in this chat (`c3.7.8.3.1`).

## Latest requested corrections

- Shift+click is now treated as pointer-assisted selection and uses the normal Copy Delay; pure keyboard selection retains the editable-field grace behavior.
- Background label moved left by the requested visual amount.
- Custom Symbol no longer moves the Symbol trigger; its slot is reserved, square, and control-height aligned.
- Restore Effects is explicitly pinned between Size and Duration to prevent legacy-grid regression.
- Shield+tack received the final small left adjustment without disturbing the already-approved Exclude-sensitive shield position.
- Retention copy explicitly says `entries` after the minimum count.
- Rich History previews detect very-light text on light backgrounds and apply a local readability fallback.
- History copy-success feedback is stronger and remains visible twice as long.
- Final visible History row always receives a timeline icon.
- Missing favicons fall back to stable circular domain-initial icons; domains sharing an initial receive distinct remembered colors where possible.
- Collection Settings received another layout-compression pass and Locked Collection retains the canonical toggle.
- Easter-egg translucent phase fades only; the optional twirl is used on the disco beat instead. Yellow click cards have more vertical breathing room.
- Tag suggestions use a stronger built-in stop/filler list and stale noisy suggestions are filtered when rendered.
- Simple History onboarding copy and the Clipboard toolbar alignment changes are retained.
- History items / Collections top spacing and heading typography are normalized against Profiles.
- Capture / Retention / Cleanup legacy pseudo-icons are suppressed at the source; each heading has exactly one inline black SVG and Cleanup is only a trash can.

## Search contract

History, Settings search, and Saved Site Rules search now share:

- fuzzy words
- `*` wildcard
- `+term` mandatory term
- `-term` / `NOT` exclusion
- quoted exact phrases
- `AND`, `OR`, `NOT`
- parentheses

`+term` remains required even inside a larger OR expression. History additionally retains its field and quick filters. The Search clips help tooltip reflects the real implementation and no longer exposes encoded quote text.

## Release validation

Passed on the packaged release tree:

- JavaScript syntax checks for every JS file
- Manifest JSON parse and version consistency (`3.7.8.12`)
- duplicate HTML ID audit
- MV3 inline-script/CSP audit
- local asset-reference audit
- CSS parser audit
- Search grammar regression tests
- fuzzy/wildcard/plus/minus/Boolean/exact-phrase tests
- tag-stop-list regression tests (`still` and `I'm` rejected; meaningful lexical tags retained)
- Storage heading icon cardinality check (one SVG each)
- Shift+click listener-regression assertion (duplicate mouseup scheduler removed)
- generic History icon / contrast helper presence assertions
- release-package developer-file exclusion
- ZIP CRC/integrity test

## Release packaging rule

Repackaged CopySelect builds include runtime files plus `CHANGELOG.txt`, `docs/`, and the `history-backups/` placeholder. Developer records under `docs/` are not runtime-loaded. `manifest.json` and the user-facing `CHANGELOG.txt` remain at package root.

## 3.7.8.14 UI correction pass
- Storage child spacing: requested three pairs use 15 px.
- Shield-tack reduced 5% and optically centered.
- History copy-success: 500 ms, 1 px border, 2 px neon-blue outer ring.
- Contrast indicator: -5 px X, -4 px Y.
- History toolbar History/View cluster shifted +60 px.
- Collection Settings and WordWatch Studio width/toggles/checkboxes/card rhythm normalized.
- Site Rules Inherit global dropdown-option color and pattern tooltip corrected.
- Reliability card made two-column; numbered collapsible FAQ added.


## 3.7.8.15 senior-dev + devil's-advocate audit

Checklist to verify against the packaged tree:
- [x] Storage: only the three requested parent/child gaps changed, each by exactly -50%.
- [x] Contrast indicator: +1 visible px right / +2 visible px down at 150% scaling.
- [x] User-provided runtime expand/compact icons installed; compact_2 retained but unused.
- [x] History flash: 750 ms, 1 px border, 2 px neon-blue ring; JS removal timeout also 750 ms.
- [x] Expanded/Metadata bug: global toggle controls metadata in both open/closed cards; metadata-area click cannot collapse.
- [x] Separator before View and everything to its right moved 60 visible px left from 3.7.8.14; History itself remains at the 3.7.8.14 position.
- [x] Collection/Studio card gaps match left inset; Duration aligns to Feedback; When matched is reorganized; checkboxes have mode accent + white check; Studio Back is a real button.
- [x] Site Rules: inherited closed-field gray, menu options normal ink; tooltip and FAQ explain *, ^, and \.
- [x] Reliability card has a vertical column separator.
- [x] FAQ has expand/collapse-all controls and the additional requested organization guidance.
- [x] History action-cluster background is subtle translucent blue-gray, lighter than metadata background.


### 3.7.8.15 validation notes

Senior-dev review pass:
- 3.7.8.14 remained the code/UI baseline; no runtime files were broadly restored.
- Runtime changes are confined to the requested settings/history/site-rule/Collection/FAQ surfaces plus versioning and the three supplied icon assets.
- The Site Rules tint fix includes programmatic rule-load/reset paths, not only user `change` events.
- The Expanded History metadata regression was traced to `open()` forcing metadata visible and metadata-area clicks collapsing the card; both causes are corrected at their source.

Devil's-advocate regression pass:
- Confirmed the History group itself remains at its 3.7.8.14 position; only the separator before View and controls to its right move left.
- Confirmed the 750 ms success class timeout matches the 750 ms CSS animation.
- Confirmed the success selector is the base `.history-item`, so compact/expanded and metadata on/off share the same treatment.
- Confirmed the three Storage spacing overrides are the only new 3.7.8.15 Storage layout selectors.
- Confirmed custom Collection/Studio checks render a white tick on `var(--accent)`, preserving Simple/Advanced mode accent differences.
- Confirmed Duration uses the same 110 px label/control grid as Feedback and stretches the number+unit control through the same field column.
- Confirmed FAQ deep links use the existing `openPage()` navigation function and expand/collapse-all controls have labels/titles.
- Confirmed supplied expand/compact PNG bytes are preserved exactly and `snippet-compact_2.png` is packaged but not referenced by runtime code.

Static release checks passed: all top-level JavaScript syntax, manifest/backup JSON parsing, duplicate-ID audit, CSS parser audit, local asset-reference audit, required selector/behavior assertions, supplied-icon byte equality/transparency checks, and package integrity/CRC after ZIP creation.


## 3.7.8.16 follow-up audit
- Confirmed 3.7.8.15 remained the runtime baseline and changes were targeted rather than broad file restoration.
- Pixel instructions in this pass are treated as CSS pixels. No Windows-scaling conversion is applied.
- Confirmed metadata separator bug root cause: `metadataSeparator === "custom"` was joined literally instead of resolving `metadataCustomSeparator`.
- Confirmed History metadata visibility does not participate in the `expandable` calculation; expansion is content-driven.
- Confirmed metadata-visible History cards had a more-specific shadow overriding the 2px copy-success outer ring; fixed with a state-specific rule.
- Confirmed When matched DOM order now matches the requested 3-column visual order.
- Confirmed Studio Back control remains a real `<button>`, not a text link.

## Devil's-advocate regression review
- Storage override touches only the same three requested child-gap selectors.
- No expand/compress button is appended in `makeHistoryItem` unless `expandable` is true.
- Copy-success timeout and CSS duration both equal 1000 ms.
- Metadata-on and metadata-off flash both retain the 2px neon ring.
- Ctrl+Shift+V intercepts only editable INPUT/TEXTAREA/contenteditable targets and does not alter ordinary page shortcuts elsewhere.
- Custom separator fallback uses a newline if Custom is selected but the custom separator field is empty, preventing accidental literal sentinel output.
- FAQ uses one toggle control and line-only glyphs; no History arrow assets are reused there.
- Studio local margins/padding in the new override stay well below 30px.


## 3.7.8.19 — repeated-item verification / hard-bug pass

### Senior-dev findings
- **Phantom re-copy:** previous pointer handlers treated “selection exists” as “selection was just made.” New pointer-down baseline + pointer-up comparison proves the selection changed before an automatic copy can be queued.
- **Copy-success duration:** the animation itself was not the hard bug. Re-copy increments `stats`; the `chrome.storage.onChanged` listener re-rendered History on that stats update, replacing the flashing element. History is now re-rendered only for history/pinned/PasteStack-shaped changes; stats refresh usage counters only.
- **Repeated Collection/Studio spacing failures:** earlier low-specificity rules were being beaten by legacy `:has()`/dialog selectors. Final corrections use equivalent-or-higher specificity and were checked from computed styles, not merely source presence.
- **Studio whitespace:** the moved Back button left an empty `.wordwatch-setup-bar` with legacy min-height/padding. Studio now hides that obsolete row entirely.

### Devil's-advocate checks
- Old visible selection + pointer down/up: no copy.
- Changed selection during pointer gesture: one copy.
- Fresh selection during pointer gesture: one copy.
- `mouseup` immediately following `pointerup`: ignored as a duplicate event path.
- Metadata ON + collapsed History card: relative and full timestamp remain displayed; Metadata OFF hides the metadata wrapper.
- Relative-time bucket boundaries follow 1/5/10/15/30/45 min, 1/2/3 hr, then date/Yesterday fallback.
- Stats-only History copy update cannot destroy the active copy-flash node.
- Flash class timeout and CSS animation are both 1000 ms; border/ring remain 1 px + 2 px neon blue.
- History paging batch is 50 and the next batch is observer-driven.
- When matched computed first-row alignment is top/start; checkbox-to-label gap is 3 px after the higher-specificity correction; Add tags field measures ~85 px wider than the prior rendered layout.
- Studio empty setup row computes `display:none`; rule textareas are 54 px and local spacing is below the requested 30 px ceiling.
- Date-based export names contain no app version token.
- Metadata hotfix and Ctrl+Shift+V raw CopySelect paste logic from the prior hotfix remain present.

## 3.7.8.20 — evening visual correction pass (2026-09-08)
- General sticky note: removed the <=900px hide condition at final specificity; rendered visible at 1200/900/800/700 CSS-pixel viewport tests.
- Storage child spacing: reduced only Browser copies, Save images, and Delete after final margin-top from 4.5px to 1px as a visual calibration from the user's measured ~35px toward ~30px.
- History timeline: left marker now uses degrading relative age (1/5/10/15/30/45 min, 1/2/3 hr), then Today / Yesterday / formatted date; no stacked day+clock marker. Rail top/bottom anchor to actual first/last icon edges; single-entry rail hidden.
- History metadata: removed the separate relative/date line above the title; title and smaller gray parenthesized domain share the left side of the header; full formatted absolute timestamp is right-aligned on the same header line; character/formatted metrics remain below.
- History copy-success: JS cleanup timer and CSS animation both 500ms; 1px neon-blue border + 2px outer ring retained.
- Dialog black focus ring: container/form focus outline suppressed; form controls retain existing focus styling.
- Reliability separator: final computed left position verified exactly 22 CSS px left of helper-list midpoint.
- Syntax/JSON/CSS/package validation passed.


## 3.7.8.21 — repeated-item stress pass
- Sticky note: traced the repeated invisibility to runtime DOM consolidation discarding the original General card. Fix moves the existing note into the generated Automatic copying card before `general.replaceChildren()`. Final CSS keeps it displayed and gives the master toggle a 1 px border.
- Copy Confirmation: found/guarded against a legacy high-specificity rule that put Restore Effects in column 2. Final cascade explicitly assigns Size column 1, Duration column 2, Restore Effects column 3.
- Storage: Delete after is top-aligned with its fields while the existing three visual-gap calibrations remain untouched.
- Timeline: executable boundary tests cover granular 1–15 min, 15-minute buckets, sparse hour buckets, >8-item dense-hour subdivision, Today/Yesterday/date labels, and duplicate suppression within a bucket.
- Select unorganized: source audit confirms a single runtime creation path for the visible list.
- Simple accent: shared copy-flash now uses `var(--accent)`; all remaining literal Advanced-cyan shared-state occurrences are superseded by final Simple-mode overrides.
- Easter egg: modifier navigation is capture-phase so Shift/Ctrl actions cannot also advance the story; state snapshots permit one-beat backtracking. Translucency now affects the story line and the button independently.
- FAQ: rewritten for the approved CopySelect voice. Link audit confirms no `data-faq-page` anchor includes the word `Open`; only destination labels are clickable.

## 3.7.8.22 — selection menu / WordWatch / easter-egg correction pass
- Automatic copying master toggle final override is 2 px and uses the active mode accent family; checked state uses `var(--accent)` directly.
- `Select unorganized` moved into the Selection menu and now toggles the currently visible unorganized set on and off. The repeated standalone History-list control is removed.
- `Teach WordWatch from these…` no longer uses the legacy squiggle/NBSP prefix. It ships with one clean inline SVG, forced to black at final cascade specificity.
- Emotionally translucent easter-egg phase reuses the same DOM line and transitions both line/button opacity over 420 ms. No line-node replacement occurs between translucency clicks.
- Additional restrained story effects are attached to the look-back, paper-airplane and rainbow beats; the existing disco beat remains.
- Profile Guide preset descriptions are alphabetically ordered in source and retain the runtime alphabetical guard.
- Open Advanced WordWatch Studio is raised 17 CSS px and shares a stronger 2 px accent-family border with Back to Collection Settings.
- Template Quick Insert tooltips now include examples for URL, Domain, ISO date and Year; Time points users to the formatting controls below.

## 3.7.8.23 — selection-state / optical-centering / egg-motion correction
- Master toggle: final `:before` top offset is 1 px.
- Profile Guide: column-major CSS placement with five rows, preserving alphabetical DOM order.
- Selection menu: All starts unselected and is recalculated from currently visible clips on every render.
- Unorganized: label margin-left is exactly 13 CSS px.
- Easter egg: legacy `:active` transform was the concrete source of the button jump; final override preserves the centered transform and ordinary lines have no animation.

## 3.7.8.25 — Easter egg / first timeline icon
- Button movement allow-list is exactly press 16 and press 18. Press 17 displays “Everyone stands. Even the button.”, so movement occurs immediately before and after that line only.
- Press 30 starts emotional translucency and contains no button-jump call. Presses 30–35 reuse the same translucent line and vary opacity only.
- Tiny disco is a post-button finale line; the parent `p` animation is disabled and only `.egg-line-content` receives `eggDiscoJump`.
- Timeline rail top is computed as first icon top + half its rendered height relative to the History list. Rail z-index remains below the icon, so its start is masked by the icon.
