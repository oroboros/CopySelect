# CopySelect — Verified Project State
Last reviewed: 2026-10-21. Engineering branch: `engineering/agent-foundation-2026-10-20`. **This is a status record, not a release approval.**

## Evidence classifications
- **USER-REPORTED working:** 3.7.9 is the user's currently used and satisfactory extension. Installation bytes, browser profile, extension ID and installed data have not been independently inspected (**UNKNOWN**).
- **VERIFIED repository fact:** public `oroboros/CopySelect` main manifest says `3.7.9`, source commit `77740904cd9fa2cb42f09daca9be3a94f2ce7a71`. The branch with a v4-named backup label compares **identical** to main; that branch label does not mean it contains v4.
- **VERIFIED engineering history:** historical v4.0a21.7.10 handoff, strict verification ledger and integrity document were inspected in archived project materials. Those artifacts **report** fresh-extract and browser-oriented release gates as passed in 2026-09; the current reset did not rerun them against the historical packaged source.
- **VERIFIED preserved-source evidence:** later historical source snapshot has Manifest V3 `version: 4.1.0`, `version_name: v4.1`. It also contains UI file names for 4.0a21.7.22; consequently filenames/UI names do not establish one coherent validated release identity. Its code is not checked into this repository's main or engineering branch.
- **VERIFIED archive evidence:** 4.0a21.7.18 historical archive (381 ZIP entries, CRC check OK, SHA-256 `fc1b6c8279afc64f15690d8ebebcea1137c676e68b9c68d6f69a9a8670fb078f`) contains older handoffs, test and integrity reports. It is an archive of history, **not** a fresh verified installable release.
- **VERIFIED separate diagnostic package:** v4.0a21.7.20 original diagnostic ZIP SHA-256 `d65e19a7f3889dc25cc5f20e25e00ae8aa587ad0151d697bb51d7c8a20da1359`. Isolated 2026-10-20 test derivative ZIP SHA-256 `2919142edb3dafd6ccd3c51b3255266fcce7484853260552aa34bd6d0f437b97`; no verified full extension runtime pass.
- **UNKNOWN:** exact source and SHA of the original user-liked pre-UI-cleanup v4 build; correspondence of any v4 snapshot to an installed extension; whether the preserved v4.1 tree is runnable and safe.
- **VERIFIED remote development location issue:** prior project development folder currently lists no children through the connected Drive API. Separately preserved source and design trees remain in external archives. Restore provenance instead of assuming deletion.

## Functionality and milestone
- 3.7.9: user's functional daily-use reference, not an independently verified source-to-install match.
- v4 history documents report History, Collections, WordWatch, tagging, compact/extended UI, settings and migration checks; reported prior success is not present-day QA acceptance.
- Current GitHub engineering branch adds static manifest/HTML/JS checks, synthetic multilingual tagging contracts, potential-hotspot inventory and CI. Last directly verified success: commit `5f73c62d1a601b59fa27d202f4b4de438604daa7`, baseline audit run `39396164174` and privacy lint run `39396164308` both SUCCESS. Browser smoke, user data preservation, startup and scale-specific visual checks remain unverified.
- Phase-1 indexed-store branch adds checkpoint/decision documents only relative to main; its ledger marks real-browser persistence, upgrade and latency NOT TESTED. Do not promote shadow authority.

## Known defects, blockers, and risks
1. P0: Authoritative *v4* installable package and exact source/installed identity unresolved; do not overwrite user's 3.7.9 installation.
2. P0: Real Chrome/Edge clipboard/history/restore/privacy gates missing for candidates; capture and storage could affect user data.
3. P0: Public repository cannot accept raw private source, cloud paths or clipboard test data; do not sync preserved private trees directly without security review.
4. P1: UI approval and page-specific fidelity unresolved: Profiles hover, dynamic Collections overlays, History, Paste Format and spacing; use preserved UI guide v1.5 and page carryover requirements.
5. P1: Existing advanced/semantic AI is optional and needs explicit transmission consent; prior diagnostic audit reported unexpected external navigation and storage-reset behavior, **not independently reproduced in this reset**.
6. P1: Three-way code/package byte-parity not verified; only a specific v4.0a21.7.20 derivative was copied into the secondary cloud during prior work.
7. P1: No verified autonomous Copilot AI reviewer; scheduled CI on non-default branch is not proof of recurring operation.
8. P2: IndexedDB promotion, profiling and tagging quality metrics remain unverified.

## Approved priorities / decisions
- Preserve 3.7.9 and all frozen v4 history; avoid unsupported release claims.
- Keep code, project records and approved design constraints discoverable, and maintain both cloud repositories without destructive overwrite.
- Prioritize source reconciliation, isolated test candidate, then installed-browser verification; do not initiate unrelated feature work during recovery.
- Automated independent agents and new schedules require authorization; no permissions/secrets changes.

## Immediate milestone and next three actions
1. Hash-inventory the preserved v4 trees/7.10 release ZIP and historical design source. Establish exact package ↔ source relationship and separate derivative/source mixing.
2. Build a **non-production isolated** test from the chosen byte-identified candidate with test report; check manifest permissions, unsolicited external navigation and storage reset before any installed trial.
3. Run clean-profile Chrome/Edge copying, History, settings, Collections and restart/backup/rollback plus Windows 150% UI acceptance; record pass/fail and request user confirmation only for browser-dependent steps.

**User intervention:** only a clean-profile browser run/visual confirmation or a narrowly scoped access/merge/agent-authorization action after evidence is ready.
