# CopySelect Phase 1 — Canonical History Backend Decision

Date: 2026-10-03
Decision status: LOCKED FOR IMPLEMENTATION, subject to real-Chrome verification before authority switch

## Decision

Use **IndexedDB as the canonical live/master History database** for CopySelect Phase 1.

SQLite remains an architecturally valid future option, but it does not clear the agreed MV3 acceptance bar for this release strongly enough to justify the extra persistence/lifecycle layer.

## Why this is the correct exception to the SQLite preference

SQLite WASM persistence in the browser is built around OPFS. The official SQLite WASM OPFS VFS requires Worker context, and its common implementations add worker/proxy coordination and browser-specific persistence constraints. In CopySelect, the central runtime is an ephemeral Manifest V3 extension service worker. Making SQLite the live master therefore requires an extra coordinator layer (dedicated/offscreen page and/or worker), bundled WASM, CSP allowances, DB-open/reopen coordination, failure recovery, and additional lifecycle coupling.

IndexedDB is directly supported in extension service workers and provides the properties CopySelect actually needs:

- transactional writes
- stable key-based point reads/updates
- secondary and multi-entry indexes
- pagination/cursors
- persistent extension-origin storage
- no whole-History rewrite per clip
- no WASM runtime or SQLite worker proxy
- no persistent offscreen document just to keep the DB available
- coverage by the extension's existing unlimitedStorage permission

The product requirement was not “SQLite at any cost”; it was “SQLite unless the Chrome extension architecture makes it technically inferior or unnecessarily complex and the alternative can demonstrate equivalent indexing, query performance, reliability and scalability.” IndexedDB satisfies that exception more cleanly for this architecture.

## Superpowers / adversarial gate

Attack the decision from six angles:

1. **Performance:** Current chrome.storage.local arrays are O(history-size) for common mutations. IndexedDB makes normal clip updates incremental. SQLite could also do this, but adds a cross-worker database service.
2. **MV3 restart:** IndexedDB can be reopened directly by the service worker after suspension. SQLite/OPFS would require re-establishing its worker/proxy stack before DB access.
3. **Atomicity:** IndexedDB transactions cover clip/relation/meta writes. Migration keeps legacy arrays intact until validation passes.
4. **Failure containment:** IndexedDB failure can fall back to the untouched legacy backend during migration. A SQLite coordinator failure introduces another independent runtime component to diagnose.
5. **Packaging/security:** IndexedDB needs no WASM/CSP expansion. SQLite would increase packaged code and CSP/worker surface.
6. **Portability:** Chrome and Edge both support the same extension IndexedDB model. User portability is handled by JSONL/JSON/CSV/HTML in Phase 2 rather than by exposing the live database file.

No adversarial finding presently overturns the IndexedDB decision.

## Important boundary

This decision does **not** make IndexedDB authoritative immediately. Phase 1 first uses a non-destructive shadow migration and validation path. The proven legacy arrays remain authoritative until capture, mutation, query, restart and migration tests pass.

## Semantic AI groundwork

Derived semantic/index data will not become canonical user data. The store reserves stable IDs, schema versioning and derived-index metadata hooks, while any later semantic index can be rebuilt from canonical clips.
