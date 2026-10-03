# CopySelect Phase 1 checkpoint D — 2026-10-03

This is an engineering backup/checkpoint, not a release. IndexedDB remains shadow-only.

## New corrections since checkpoint C

### Adaptive compound-query planning
The previous planner used a fixed index priority. That was safe semantically but could choose a broad Collection/tag index even when another predicate such as domain/date/pinned was much more selective.

The runtime planner now:
- builds all eligible indexed candidate sources;
- measures candidate counts;
- chooses the smallest candidate set;
- then applies the complete AND query predicate centrally.

This improves compound-query behavior without adding a SQL-like optimizer.

### Canonical index-key integrity
Two normalization issues were corrected:
- explicit domain metadata is normalized to lowercase so stored domain keys match the lowercase query/index contract;
- tags remain case-insensitive, but opaque Collection IDs are now deduplicated case-sensitively so distinct IDs are never collapsed merely because letter case differs.

## Automated state
- 11/11 Phase-1 contract/regression test files PASS
- 114/114 JavaScript files pass node --check
- privacy scan: 0 personal-name hits
- IndexedDB authority is still NOT promoted
- real Chrome/Edge persistence, interruption, real IndexedDB performance and copy-latency gates remain NOT TESTED and still block promotion

## Rollback artifact
Local checkpoint SHA-256:
61a4e40f38e9254da5479e7c4d55a20ccccee2448d2550ea22c7fe9c67b735ff
