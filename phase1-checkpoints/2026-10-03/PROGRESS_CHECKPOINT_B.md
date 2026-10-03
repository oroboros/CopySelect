# CopySelect Phase 1 checkpoint — 2026-10-03

Branch purpose: backup of Phase-1 architecture decisions and engineering progress only. This is not a release branch and IndexedDB is not yet authoritative.

## Locked direction
- IndexedDB is the selected canonical History backend candidate for MV3.
- Legacy chrome.storage.local History/Pinned/Paste Stack remain authoritative until real-Chrome authority gates pass.
- All storage access remains behind HistoryStore.
- JSONL remains the planned portable backup/recovery format; HTML/JSON/CSV remain export formats.
- Full-text/semantic indexes are derived and rebuildable, not canonical.

## Implemented since the initial decision
- Canonical IndexedDB clip store with stable IDs and indexed timestamp/domain/type/pinned/tag/Collection fields.
- Pinned-only migration preservation via History + Pinned ID union.
- High-fidelity migration digest that catches lost unknown/future metadata.
- Exact-delta compatibility bridge for all runtime canonical-data mutations.
- Ordinary capture/mutations now persist legacy authority first and enqueue IndexedDB shadow work asynchronously, so copy does not wait on database open/transaction work.
- phase1ShadowSyncPending marker records interrupted queued sync; validated full startup/install migration repairs shadow state.
- Explicit v1→v2 IndexedDB upgrade rewrite populates new pinnedKey/tagKeys indexes for pre-existing rows.
- Default newest/oldest History pagination now uses the timestamp index cursor + count instead of materializing and sorting the entire database.
- Conservative full-diff recovery remains for unrecognized/external legacy writes.
- IndexedDB authority remains false.

## Automated status at this checkpoint
- 8/8 Phase-1 contract/regression test files pass.
- 111/111 JavaScript files pass node --check.
- Real Chrome persistence, forced interruption, real IndexedDB scale timing, and copy-path latency remain NOT TESTED and block promotion.

## Promotion rule
Do not promote IndexedDB until real-Chrome persistence/migration/mutation, compound-query performance, scale, interruption recovery, and copy-latency gates pass. No inferred PASSes.
