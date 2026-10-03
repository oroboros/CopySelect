# CopySelect Phase 1 checkpoint C — 2026-10-03

This is an engineering backup/checkpoint, not a release. IndexedDB is still shadow-only.

## New correction since checkpoint B
A recovery race was found and fixed: a full shadow rebuild triggered after a failed IndexedDB delta could previously run concurrently with a later queued delta. The rebuild could then finish last and leave the shadow database stale even though legacy storage remained safe.

All full shadow rebuilds now serialize on the same `phase1ShadowSyncChain` as incremental deltas:
- install/update rebuild
- startup rebuild
- conservative delta-recovery rebuild
- direct-delta-recovery rebuild

This preserves one ordered shadow-write stream without moving IndexedDB work back onto the capture critical path.

## Regression protection
A dedicated `phase1-shadow-serialization.test.js` fails if lifecycle/recovery code bypasses the serialized full-resync scheduler.

Current automated state:
- 9/9 Phase-1 contract/regression test files PASS
- 112/112 JavaScript files pass syntax validation
- real-Chrome persistence/interruption/performance gates remain NOT TESTED and still block authority promotion

## UI reference preservation
Two user-provided compress/expand glyph images are preserved in the working tree as reference-only assets. They must not automatically replace current UI icons. During later site/UI verification, explicitly ask whether to use them instead.
