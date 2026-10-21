# CopySelect — Test Matrix and Release Gates
Updated 2026-10-21. PASS must cite a specific build/commit, environment and result; otherwise NOT TESTED.

| Gate | Environment / action | Status and evidence | Blocker? |
|---|---|---|---|
| Repo 3.7.9 syntax and manifest dependencies | CI Node 22 on engineering branch | VERIFIED PASS at `5f73c62d...`, audit run `39396164174` | No, static only |
| Privacy lint | GitHub Actions | VERIFIED PASS run `39396164308` | No, does not prove runtime privacy |
| HTML ID/dependency integrity | CI checker | VERIFIED PASS in audit run; detector is not a rendered browser | No |
| Multilingual synthetic tagging contract | CI node:test | VERIFIED PASS in audit run; not precision/recall | No |
| Historical 7.10 release identity/integrity/interaction | Historical report against packaged source | REPORTED PASS in archived `docs/HANDOFF_V4.0a21.7.10.md` and ledger; **not rerun now** | Yes before re-promotion |
| Candidate archive ZIP CRC | Local ZIP parser (historical archive) | VERIFIED PASS, 381 members, 2026-10-21 | No, not install validation |
| Installability (fresh Chrome/Edge extension profile) | Manifest load; console errors | NOT TESTED for newest v4.1 | YES |
| Automatic selection copy, copy delay, Ctrl+C and Ctrl+V grace windows | Synthetic selections plus clipboard observation; do not use sensitive text | NOT TESTED on v4 candidate | YES |
| History create/search/pin/delete/duplicate/session/export | Isolated browser profile, realistic repeated data | NOT TESTED | YES |
| Tags, Collections, WordWatch, Find Similar | Workflow roundtrip and reopen | NOT TESTED | YES |
| Settings, profiles, site rules, shortcut override | Change, reopen, restart, effective-rule check | NOT TESTED | YES |
| Storage init, upgrade, old History preserve, restore and rollback | Fresh install vs upgrade in disposable profile and backup | NOT TESTED; prior audit warned of fresh-install clears | YES |
| Optional AI and unexpected navigation/network | Cold start with AI disabled, consent enabled case, monitor requests; verify no unsolicited site | NOT TESTED; prior review concerns require reproduction | YES |
| 150% Windows scaling / Simple, Advanced, flyout | Screenshots + DOMRect/keyboard accessibility | NOT TESTED; compare preserved Style Guide v1.5 and carryover ledger | YES for visual promotion |
| IndexedDB restart, kill recovery, quota failure, latency | Actual Chrome/Edge extension | NOT TESTED per phase-1 ledger | YES for authority promotion |
| 1k/10k History latency and capture-path regressions | Profiling with synthetic data | NOT TESTED in current environment | YES for performance claims |
| Package checksum / rollback | SHA-256 manifest, zip-extract, startup with previous version + separate backup | Partial: individual package hashes available, cross-source match not done | YES |

Acceptance: NO RELEASE if loss of History/settings, unconsented network transfer, nonworking copy, duplicate controllers, critical console failures, broken upgrade/rollback, or demonstrably unapproved UI occurs. Parsing, compilation, static scripts and ZIP CRC are never sufficient.

Rollback procedure: retain untouched known-working package + a user-controlled export of settings/history; test rollback in disposable profile, never clear or overwrite installed data automatically. Capture reproducible failure details in `docs/FAILURE_STRATEGY_LEDGER.md`.
