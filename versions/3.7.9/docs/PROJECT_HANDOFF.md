# CopySelect Project Handoff / Roadmap

This is developer-only project continuity documentation. Per the current packaging rule, repackaged builds include it under `docs/`; runtime code does not load it.

## Current RC behavior: selection origin

- Mouse selection uses the normal configured Copy Delay.
- **Shift+click is mouse-assisted range selection**, not keyboard selection. On primary-button `pointerup`, a stable non-empty selection uses the normal Copy Delay even if Shift is still held.
- Pure keyboard range selection (Shift + Arrow/Home/End/Page Up/Page Down) is treated differently in editable fields because it is often followed by replacement typing.
- No automatic copy is scheduled while a pure keyboard Shift-selection is still being extended.
- On Shift release, editable fields get a 1200 ms minimum grace period.
- Pending keyboard auto-copy is cancelled by typing/`beforeinput`, Delete/Backspace/navigation input, paste, cut, pointer input, explicit Ctrl/Cmd+C, or a changed selection.
- Non-editable keyboard selection continues to use the normal Copy Delay.

## Deferred post-RC clipboard capture

- **Capture webpage Copy buttons**: consider an opt-in Advanced feature that captures site-owned copy buttons implemented with `navigator.clipboard.writeText()` and therefore do not emit the normal document `copy` event.
- Do **not** monkey-patch the Clipboard API in the RC. Any implementation needs compatibility/security review and should remain opt-in.
- Normal CopySelect auto-copy and normal browser `copy` events remain the supported RC paths.
- Keep the nearby `FUTURE` comment in `content.js` until the feature is deliberately implemented.

## Deferred post-RC visual exploration

- Consider extending the selective **monochrome section-icon treatment** used on Clipboard Storage & retention to other settings sections where an icon improves scanning.
- Keep icons semantic and consistent. Do not add decorative icons to every heading.

## Search grammar contract

All CopySelect text-search surfaces should share the same basic grammar:

- fuzzy ordinary terms
- `*` wildcard
- `+term` required term
- `-term` exclusion
- quoted exact phrases
- `AND`, `OR`, `NOT`
- parentheses for grouping

History additionally supports field/quick filters such as `site:`, `tag:`, `collection:`, `title:`, `url:`, `today`, `pinned`, `formatted`, `images`, and `repeated`.

## UI implementation note

**Current pixel convention (authoritative):** when Vito gives a UI measurement in px, implement that number directly as CSS pixels unless he explicitly asks for device/physical pixels. Do not silently translate values for Windows display scaling. Visual alignment targets still take precedence when he names the edge/control that should align.

## RC consolidation through 3.7.8.12

The uploaded 3.7.8.3.1 build remains the historical baseline for this debugging run. The current RC incorporates and documents all subsequent UI/behavior corrections made in this chat. Important current behavior:

- Historical note: older RC work sometimes translated Vito’s measurements for 150% Windows scaling. **Do not use that convention going forward; current requests use direct CSS pixels.**
- Keyboard-origin editable selections use a 1200 ms minimum grace period after a pure keyboard Shift-selection gesture and cancel on editing; Shift+click is mouse-assisted range selection and uses the normal Copy Delay.
- Search syntax is intended to be consistent across CopySelect searches: fuzzy plain terms, quoted exact phrases, `*`, `+term`, `-term`, `AND`, `OR`, `NOT`, and parentheses.
- Tag suggestions use a pre-established stop-word/contraction exclusion list in addition to concept and learned-tag scoring.
- Generic timeline favicons are deterministic colored initial circles when a site favicon is unavailable.
- Pinned History is unconditionally protected from pruning.

### Deferred / post-RC

- Optional Advanced feature: **Capture webpage Copy buttons** that write directly through `navigator.clipboard.writeText()` and do not emit a normal document `copy` event. Do not monkey-patch the page Clipboard API in the RC.
- Explore extending the selective monochrome section-icon treatment used on Clipboard Storage & retention to other appropriate settings pages. Avoid decorative icon clutter.

## 3.7.8.13 panel-review decisions

- History rich-text readability uses **preview-only contrast correction**, not outlines/strokes. When computed foreground/background contrast is below 4.5:1, the preview may recolor text to a readable dark tone. Stored Rich Text must remain untouched. A small Contrast indicator beside the timeline is shown only when this correction occurs.
- Timeline source markers are **transition-based**, not “first occurrence ever”: suppress only consecutive duplicates; show a marker when the source changes; force a marker on the final entry.
- Custom Symbol must reserve its custom-field slot at all times so changing Symbol values cannot move the Symbol control. Do not reintroduce absolute positioning for this field.
- There must be only one Restore Effects control/wrapper in Selection Feedback; static markup is authoritative and runtime consolidation must not duplicate it.
- Stylesheet consolidation is a **high-priority post-release refactor**. Do not perform a wholesale rewrite during the RC cycle. Add visual regression fixtures first, then remove superseded corrective layers component-by-component.

## AI module preparation (not shipped as functionality)

`ai-core.js` defines an inert schema/provider boundary only:

- `createRequest()` and `normalizeResult()` establish stable contracts.
- Privacy modes start with `local-only` and `explicit-provider`.
- `ProviderAdapter` has no configured provider and throws if invoked.
- `CopySelectAI.enabled` is false.
- The file is not imported by current runtime scripts/manifest and must remain network/permission/UI neutral until an explicit product decision activates an AI feature.

Future AI work should keep classification/organization contracts separate from provider-specific transport and credentials. Prefer local-first operation; any provider transmission must be explicit and clearly scoped.

## Roadmap addition: automatic clipboard-history backups
- Post-RC feature: add an optional automatic local backup system for clipboard history.
- Use rotating snapshots with validation before replacing a known-good backup.
- Restore/import must be explicit and safe; backups are not the live history store.
- See `docs/ROADMAP.md` for the current design direction.


## 3.7.8.14 UI correction pass
- Storage child gaps are standardized to 15 px for Maximum age→Delete after, Save CopySelect copies→Also save normal browser copies, and Save rich text→Save images.
- Template count tokens display as “Chars (spaces)” and “Chars (no spaces)”.
- History retention wording uses “Older, unpinned items”.
- Shield-tack is reduced 5% and vertically centered; contrast indicator is moved 5 px left and 4 px up.
- History copy-success feedback is 500 ms with a 1 px border and 2 px neon-blue outer ring.
- History toolbar separator/History/View cluster is shifted 60 px right.
- Collection Settings and WordWatch Studio now share width, tighter 15 px card rhythm, canonical toggles/checkboxes and improved field/action alignment.
- WordWatch Studio back control is next to the title and reads “<- Back to Collection Settings”.
- Site Rules keeps “Inherit global” gray only in the collapsed/selected field; menu options retain normal text. Pattern tooltip now documents domains, `*`, `^`, and regex behavior.
- Reliability & Safeguards uses two columns. A numbered, category-collapsible FAQ was added beneath it using CopySelect’s existing concise, local-first explanatory tone.
- At the 3.7.8.14 checkpoint, expand/compress runtime icons were intentionally not changed yet. `docs/EXPAND_COMPRESS_ICON_COMPARISON_3.7.8.14.png` recorded the proposal pending visual approval. The subsequent 3.7.8.15 pass installs the user-approved replacement PNGs.


## 3.7.8.15 targeted correction pass

- Baseline remains 3.7.8.14; corrections are additive/minimal, not a file rollback.
- Storage child gaps for Browser copies, Save images, and Delete after are 7.5 CSS px (50% of the prior 15 px token).
- User-visible pixel nudges continue to be interpreted at 150% Windows scaling.
- Runtime History snippet icons now use the user-supplied `snippet-expanded.png` and `snippet-compact.png`; `snippet-compact_2.png` is retained as an unused alternate.
- History copy-success is 750 ms, 1 px border + 2 px neon-blue ring. Metadata visibility is controlled only by the Metadata setting; clicking metadata does not collapse an expanded card. The History group stays at its 3.7.8.14 position; only the separator before View and the controls to its right move 60 visible px left.
- Collection Settings and WordWatch Studio share a compact 9 px card rhythm; checkboxes use the active mode accent with a white check.
- Site-rule inherited values stay gray in the closed field while dropdown option text is explicitly normal ink.
- About FAQ includes expand/collapse-all controls and expanded guidance for tags vs Collections vs Saved Views, WordWatch, History, templates, and site-pattern syntax.


## 3.7.8.16 correction notes
- Treat user-supplied pixel values as CSS pixels unless the user explicitly requests device/physical pixels.
- History expand/compress availability is based on snippet content, never metadata fields.
- Custom metadata separator must resolve `metadataCustomSeparator`; never serialize the sentinel value `custom`.
- Ctrl+Shift+V plain-text paste is handled only in editable web targets.


## 3.7.8.19 targeted correction pass

- Phantom re-copy on return/focus is fixed at the selection-event layer: a pointer gesture captures the selection state at pointer-down and only schedules an automatic copy if the selection is genuinely new or changed at pointer-up. A stale visible selection is inert. The duplicate `mouseup` path is retained only as a fallback when `pointerup` did not just run.
- History Metadata now keeps its date/time information visible whenever the Metadata control is enabled, in both compact and expanded snippets. Relative age moves to the left and degrades through 1/5/10/15/30/45 minutes, 1/2/3 hours, then an absolute date with a special Yesterday label. The existing full timestamp format moves to the top right.
- History action-group background is 20% more transparent than the prior alpha. The expand/compress button remains white at rest.
- History copy-success remains a 1 px neon-blue border plus 2 px ring for 1 second. Root cause of the apparently fixed-short duration was a stats-only storage update re-rendering History and destroying the flashing DOM node; stats-only changes no longer rebuild the list.
- History loads 50 entries at a time and uses the existing IntersectionObserver to fetch the next batch near the end. End markers reflect the active context (Today, Formatted, Pinned, Collection, search results, or History).
- Collection Settings and WordWatch Studio received another rendered-layout audit. High-specificity legacy selectors that were overriding earlier corrections were identified and superseded. When matched uses a top-aligned three-column first row, tighter checkbox/label gaps, and an Add tags row spanning all columns with approximately 85 px additional field width at the current dialog width.
- WordWatch Studio removes the empty setup bar left behind after moving Back into the title row; the rule editor uses compact local padding/gaps and 54 px rule fields. Back to Collection Settings remains a real, right-aligned button.
- Reliability & Safeguards vertical separator is 7 CSS px farther left.
- Backup/export filenames use the calendar date, not the app version.
- General includes the sticky-note cue “Tiny switch. Surprisingly bossy.” with a curved handwritten arrow aimed at the master CopySelect toggle.

## 2026-09-08 evening visual corrections
- Treat the three Storage parent→child gaps as a rendered visual target, not as a raw CSS-token label. Current final child margin token is 1px after the user reported the previous 4.5px token rendered at about 35px and requested about 30px.
- History timeline owns relative/degrading age display; History card metadata owns the exact timestamp. Do not reintroduce a separate date/relative line above the snippet title.
- Timeline rail must not protrude above the first source icon; rail anchors to actual icon edges.
- General sticky note must remain visible at narrower desktop widths; do not restore the old <=900px `display:none` rule.
- History copy-success duration is 500ms with 1px border + 2px neon-blue ring.
- Reliability & Safeguards separator final target is 22 CSS px left of the helper-list midpoint.


## 3.7.8.21 interaction / voice / packaging rules
- Build-package filenames use `CopySelect_v<version>.zip` (for example `CopySelect_v3.7.8.21.zip`). This is distinct from in-app data/history exports, which remain date-based.
- CopySelect UI measurements supplied by the user are CSS pixels unless explicitly stated otherwise.
- General runtime consolidation must preserve/move `.general-master-sticky` before replacing the original General DOM. Do not rely on styling an element that `consolidateInterface()` later discards.
- Copy Confirmation row 2 is structurally `Size | Duration | Restore Effects`; final cascade rules must preserve that order.
- History timeline labels are adaptive and non-repeating: 1–15 minutes are granular unless the region is very dense; 15–60 minutes use 15-minute buckets; 1–3 hour regions normally use hour buckets but split into 15-minute buckets when a given hour contains more than eight visible clips; older labels use `Today` / `Yesterday` / date with quarter-hour time beneath. Only the first clip in a bucket prints the label.
- History has one `Select unorganized` action for the visible result set, not one per time/session group.
- Simple mode uses the dark menu-selection blue (`var(--accent)` under `body.simple-mode`) for active/selected/accent UI. Do not hard-code the Advanced cyan into shared states such as History copy-success.
- Easter egg navigation: Shift+Click anywhere in the egg area restarts from the beginning; Ctrl+Click goes back one story beat.
- CopySelect voice: compact, polished utility; mildly eccentric, dry, self-aware; restrained occasional absurdity; never cute, whimsical, corporate, or startup-cheesy. FAQ personality should be present but secondary to clarity.
- CopySelect FAQ/internal-navigation microcopy must format `Open ` as plain text and link/underline only the destination label.

## 3.7.8.22 interaction notes
- History bulk selection: `Unorganized` belongs in the Selection menu, not as a repeated list action. It is a toggle over the currently visible unorganized set.
- Automatic copying master toggle should retain a stronger accent-relative edge so the main switch is visually distinct in both Simple and Advanced modes.
- WordWatch teaching action uses a clean black icon with no stray glyph/spacing artifact.
- Easter-egg translucent sequence must cross-fade rather than replace/jump. Shift+Click restarts the story; Ctrl+Click goes back one beat. A few other story beats may use restrained one-off motion, but effects should remain sparse.
- Profile Guide descriptions are alphabetical.
- WordWatch Studio entry and return buttons use the same emphasized border language; the entry button is raised 17 CSS px in Quick Setup.
- Quick Insert token tooltips should show concrete examples where useful, especially URL, Domain, ISO date and Year; Time should point to its formatter below.


## 3.7.8.23 interaction notes
- Selection > All is not a persistent mode. Its check state reflects whether every currently visible clip is selected.
- Selection > Unorganized remains a toggle for the visible unorganized set.
- WordWatch action label is now `Teach WordWatch`.
- Easter-egg story text should remain static unless an effect is explicitly requested. The button must not move on click; translucency is opacity-only.
