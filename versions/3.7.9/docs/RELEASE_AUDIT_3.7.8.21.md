# CopySelect 3.7.8.21 — repeated-item release audit

Date: 2026-09-08
Baseline: CopySelect 3.7.8.20

## Repeated-item checks

### General
- Sticky note is not merely styled in the original markup. `consolidateInterface()` moves `.general-master-sticky` into the generated Automatic copying card before the original General DOM is replaced.
- Final cascade forces the note visible and positions its curved arrow toward the master switch.
- Automatic copying master toggle has a 1 px visible border in both unchecked and checked states.

### Copy Confirmation
- Final cascade explicitly locks row 2 to: Size (column 1) | Duration (column 2) | Restore Effects (column 3).
- This final rule occurs after the older contradictory Restore Effects rules, preventing the regression from winning by cascade order.

### Clipboard Storage
- Existing user-calibrated special spacing values are preserved.
- Delete after label/control row is explicitly top-aligned at final specificity.

### History timeline
- Timeline labels are generated once per visible bucket, not repeated for every item.
- 1–15 min uses granular labels unless that recent region is dense.
- 15–60 min uses 15-minute buckets.
- 1–3 hr uses hour buckets when sparse; an hour containing >8 visible clips subdivides to 15-minute buckets.
- Older entries use Today / Yesterday / formatted date with quarter-hour clock time on the next line.
- Executable boundary sample produced expected suppression of repeated buckets and day/date transitions.

### History organization
- `Select unorganized` has a single runtime creation path for the visible list, rather than one per timeline/session group.

### Simple mode accent
- History copy-success uses `var(--accent)`, so Simple receives the Simple-mode blue and Advanced receives its own accent.
- Final Simple-mode overrides cover selected History controls and Site Rules states that previously contained shared/Advanced-cyan styling.

### Easter egg
- Shift+Click handler runs in capture phase and resets to the beginning without also advancing the story.
- Ctrl+Click restores one saved story-state snapshot.
- Emotionally translucent sequence explicitly fades the line and button while keeping the progressive dots readable.

### FAQ
- FAQ copy rewritten in the approved compact, dry, mildly eccentric CopySelect voice while keeping functional explanations primary.
- FAQ category intros use restrained personality rather than joke-heavy copy.
- Internal navigation convention verified: `Open ` is plain text; only destination labels are links.
- Audit found 6 internal FAQ destination links and none contain the word `Open` inside the anchor.

### Naming
- Extension manifest version: 3.7.8.21.
- Build filename convention: `CopySelect_v<version>.zip`.

## Mechanical validation
- 10/10 top-level JavaScript files pass `node --check`.
- manifest.json and history-backups/backup-index.json parse successfully.
- popup.html, options.html, offscreen.html and changelog.html have no duplicate IDs.
- 14/14 targeted source/cascade/runtime assertions pass.
- ZIP is created only after this audit and is CRC-tested after packaging.
