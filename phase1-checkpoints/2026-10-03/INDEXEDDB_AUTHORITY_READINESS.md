# CopySelect Phase 1 — IndexedDB Authority-Readiness Ledger

Date: 2026-10-03
Rule: status is exactly PASS / FAIL / NOT TESTED. PASS requires direct evidence for the gate as worded. No inferred PASSes.

| Gate | Status | Evidence / measurement |
|---|---|---|
| HistoryStore abstraction boundary | PASS | `core/history-store.js` is the backend boundary; current Phase-1 background integration calls the store API rather than IndexedDB directly. |
| Legacy arrays remain authoritative | PASS | Phase-1 status is explicitly `authority: legacy`; shadow migration/sync does not remove or replace legacy History/Pinned/Paste Stack arrays. |
| Pinned-only migration | PASS | Contract test preserves a clip present only in Pinned; migration canonical set is the union of History + Pinned IDs. |
| High-fidelity migration validation | PASS | Validation now compares canonicalized full serializable clip payloads, including unknown/future metadata, while excluding only backend-derived fields. A deliberately lossy store is rejected by test. |
| Paste Stack migration count/order contract | PASS | Migration contract validates stack length; HistoryStore stack preserves explicit position ordering. Browser persistence still has its own separate gate below. |
| IndexedDB schema upgrade v1 → v2 in a real browser | NOT TESTED | Requires creating a real v1 DB, updating extension code to v2, reopening, then checking data/indexes. |
| Real Chrome/Edge persistence across browser restart | NOT TESTED | Container Chromium cannot complete reliable browser execution. Must be tested in a normal extension runtime. |
| Capture/edit/delete/pin/unpin/tag/Collection persistence across restart | NOT TESTED | Requires real extension runtime. |
| Shadow synchronization after legacy mutations in real extension runtime | NOT TESTED | Static path exists, including conservative fallback. Browser event ordering/persistence is not yet proven. |
| Runtime canonical-data mutations use exact shadow-sync bridge | PASS | Static mutation-routing test confirms capture, pin/unpin, clear/delete/prune, Paste Stack operations, clip edits/organization, tag rename, WordWatch reapply, undo and AI enrichment route through `phase1WriteLegacyRuntime`; no direct History/Pinned/Paste Stack writes remain inside the runtime message handler. |
| Capture-path shadow synchronization avoids full-array delta diff for normal captures | PASS | Normal capture writes legacy authority once with an exact mutation marker/pending token, then queues the precise shadow delta; `storage.onChanged` skips the O(n) fallback for marked writes. |
| Shadow IndexedDB work is not synchronously awaited by ordinary capture/mutations | PASS | `phase1WriteLegacyRuntime` persists legacy authority, queues IndexedDB work on `phase1ShadowSyncChain`, and returns `queued:true`; dedicated regression test enforces this structure. |
| Interrupted queued shadow sync has explicit recovery marker | PASS | The authoritative legacy write atomically records `phase1ShadowSyncPending`; successful matching delta clears it, while startup/install validated full migration reconstructs shadow state and clears the marker. Real forced-termination behavior remains separately NOT TESTED. |
| Unrecognized/external legacy mutations still have a recovery path | PASS | Unmarked History/Pinned/Paste Stack changes retain the conservative serialized delta-diff fallback; direct-sync failure schedules a full validated shadow migration. |
| Compound query semantics | PASS | Contract matcher covers collection + tag + domain + date + pinned and other combinations centrally. |
| Compound query indexed candidate planning | PASS | Planner chooses an indexed candidate source from IDs/Collection/tag/domain/type/pinned/date, then intersects remaining predicates centrally. |
| Compound query real IndexedDB performance | NOT TESTED | Requires browser IndexedDB benchmark with realistic cardinalities. |
| Query pagination contract | PASS | `query()` returns total/offset/limit/nextOffset consistently in contract code. Real IDB runtime still has a separate performance gate. |
| Exhaustive iteration avoids repeated full candidate rescans | PASS | `iterate()` now resolves/filter/sorts the candidate set once and yields chunks, removing the previous repeated query/resort behavior that could trend toward O(n²) for large export/migration walks. |
| 1k realistic synthetic CPU baseline | PASS | 1,000 records ≈ 1.69 MiB; build 20.93 ms; whole-array stringify median 5.93 ms; compound full scan 0.74 ms; text full scan 0.35 ms on this host. Not an IndexedDB latency measurement. |
| 10k realistic synthetic CPU baseline | PASS | 10,000 records ≈ 17.07 MiB; build 117.22 ms; whole-array stringify 57.16 ms; compound full scan 1.91 ms; text full scan 1.52 ms. |
| 100k stress CPU baseline | PASS | 100,000 records ≈ 172.34 MiB; build 764.46 ms; whole-array stringify 542.59 ms; compound full scan 21.42 ms; text full scan 23.06 ms. Confirms whole-array serialization is unsuitable as canonical mutation path. |
| 1k/10k/100k real IndexedDB capture/query/pagination/bulk-delete measurements | NOT TESTED | Real browser benchmark still required. |
| Interrupted migration cannot half-promote authority in a real browser | NOT TESTED | Design keeps legacy authoritative and promotion separate, but forced termination/restart must still be exercised. |
| Interrupted ordinary mutation recovery in a real browser | NOT TESTED | Startup full validation/recovery exists conceptually; browser kill/reload test required. |
| Quota/write failure containment | NOT TESTED | Requires browser failure simulation or injectable fault harness. |
| No material automatic-copy latency regression in real extension runtime | NOT TESTED | Critical-path design has been reduced, but only real extension timing can PASS this gate. |
| Canonical storage independent of current full-text/semantic search implementation | PASS | Search text and future semantic indexes are treated as derived/rebuildable; canonical clip payload remains the user-data source. |
| Export/Print can share one query/result-set API | PASS | `query()` + exhaustive `iterate()` provide the common result-set contract groundwork; Phase-2 consumers are not yet implemented. |

## Promotion rule

Do not promote IndexedDB from shadow to authority until every real-browser authority gate above that materially affects persistence, migration, mutation correctness, compound-query performance, and copy-path latency is PASS. A code path, static inspection, or architectural argument never substitutes for a runtime PASS.
