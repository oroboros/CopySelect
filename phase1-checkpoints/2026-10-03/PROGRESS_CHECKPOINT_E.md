# CopySelect Phase 1 checkpoint E — 2026-10-03

This is an engineering checkpoint, not a release. IndexedDB remains shadow-only.

## New correction since checkpoint D

An export/scale adversarial review found that the previous `iterate()` improvement still materialized the complete matching result set before yielding. That removed repeated rescans but could still consume very large memory for 100k+ histories.

The HistoryStore now advances to IndexedDB v3 with a unique compound `[ts,id]` index.

Timestamp-ordered full-result iteration now:
- reads bounded chunks;
- closes each IndexedDB transaction before yielding to the async-generator consumer;
- resumes from the exact `[ts,id]` compound cursor key;
- safely handles many clips sharing the same timestamp;
- caps sparse-filter scans per transaction so an export step cannot monopolize one long transaction.

Rare title-sorted iteration still materializes because there is no title index yet.

This specifically lays safer groundwork for Phase 2 Export Current Results, JSONL backup, HTML export and Print, all of which can consume the same canonical result iterator without building a 100k-record array.

## Automated state
- 12/12 Phase-1 contract/regression test files PASS
- 115/115 JavaScript files pass node --check
- privacy scan: 0 personal-name hits
- IndexedDB authority is still NOT promoted
- real Chrome/Edge persistence, interruption, real IndexedDB performance and copy-latency gates remain NOT TESTED and still block promotion

## Rollback artifact
Local checkpoint SHA-256:
39ed3a31e286996424c3e802424cb8c88b9ac04b3b1243a9a386e92b2f0b6421
