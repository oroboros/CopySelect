# CopySelect Phase 1 checkpoint G — 2026-10-03

Engineering checkpoint only. IndexedDB remains shadow-only and legacy runtime data remains authoritative.

## Major progress since checkpoint F

- Added backend-neutral, versioned HistoryResultSet contract for All/query/selected-ID result sets.
- Migration validation now streams real HistoryStore records by primary key rather than materializing the full store for digesting.
- Added isolated browser benchmark harness using temporary DB names for 1k/10k/100k insert/query/iterate/delete measurements.
- Added restart authority-gate harness that compares legacy/shadow clip and Paste Stack digests without promoting IndexedDB.
- Removed remaining direct UI writes of History/Pinned/Paste Stack. Restore/delete/Collection cleanup now cross background mutation actions.
- Added a UI read-boundary regression guard. Canonical runtime reads cross background runtimeData, leaving one future authority-switch point.
- Removed superseded destructive-delete ownership in Collections. Batch delete, Collection delete and Saved View delete now have one checkbox-gated authoritative handler.
- Fixed a same-millisecond recovery race by comparing pending mutation token identity instead of timestamps during full shadow rebuild.
- Restored Tiny Switch session behavior: first General visit, dismissible across navigation/reloads, re-armed on a later ON→OFF transition.
- Corrected duplicate-suppression UI units to seconds, matching stored/runtime semantics.
- Restored Hold-to-pause as Advanced-only so the Advanced Changes indicator contract is coherent.
- Reasserted Basic Presets as clickable and restored two-axis Paste Preview resizing.

## Automated state

- 28/28 Phase-1 regression/contract test files PASS
- 134/134 JavaScript files pass node --check
- 0 duplicate HTML IDs
- 0 missing local HTML dependencies
- 0 scoped privacy hits
- IndexedDB authority remains NOT promoted
- Real Chrome/Edge persistence, interruption, real IndexedDB performance and copy-latency gates remain NOT TESTED

## Rollback artifact

Local checkpoint:
CopySelect_PHASE1_WORKING_CHECKPOINT_G.zip

SHA-256:
8805eb2bb03a1ffc3598aed403d8d7de0e6599cd3133fcf7a5a914dfcb6552b4
