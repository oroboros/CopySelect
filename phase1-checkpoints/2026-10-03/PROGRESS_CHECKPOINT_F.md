# CopySelect Phase 1 checkpoint F — 2026-10-03

This is an engineering checkpoint, not a release. IndexedDB remains shadow-only.

## New safety work since checkpoint E

### Explicit authority fence
Phase 1 now declares `PHASE1_HISTORY_AUTHORITY="legacy"` and has a regression test that fails if new HistoryStore access escapes the approved shadow-migration/synchronization/diagnostic boundary. This is intended to prevent accidental early promotion while engineering continues.

### Real-Chrome diagnostic hooks
Two internal runtime actions now support the later browser authority gate without adding visible UI:

- `phase1HistoryDiagnostics`: read-only comparison of live legacy and IndexedDB shadow digests/counts, paste-stack counts, pending-sync state, and shadow metadata.
- `phase1RunShadowValidation`: schedules the serialized validated full shadow rebuild and then returns the same diagnostics.

The diagnostic path is explicitly regression-tested as read-only.

These hooks are intended to make restart/persistence/migration checks evidence-based instead of inferred.

## Automated state
- 13/13 Phase-1 contract/regression test files PASS
- 116/116 JavaScript files pass node --check
- privacy scan: 0 personal-name/email hits
- IndexedDB authority remains legacy/shadow only
- real Chrome/Edge persistence, forced interruption, real IndexedDB performance and copy-latency gates remain NOT TESTED and still block promotion

## Rollback artifact
Local checkpoint SHA-256:
5f7c694d1382e8cad42e04a76d6e897d10af912797a0d8e02706bf4d39d6d237
