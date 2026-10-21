# CopySelect — AI Engineering Rules

## Scope
Maintain CopySelect, a Chrome/Edge Manifest V3 extension for automatic selection copying, clipboard History, tags/Collections, WordWatch, Paste Stack, site rules, profiles, feedback and settings. This file is operational policy; see PROJECT_STATE.md for facts.

## Authority and evidence
1. User-observed real behavior and reproducible installed-browser tests.
2. Byte-identified working packages and corresponding source.
3. Current approved requirements and release records.
4. Source-control history, frozen archives and handoffs.
5. Historical narrative; then explicitly labeled inference.
Tag claims VERIFIED / USER-REPORTED / INFERRED / UNKNOWN. Never infer installed identity from a filename, screenshot title, branch name or manifest alone.

## Layout and provenance
- Repo: main holds a 3.7.9 source snapshot; engineering changes on reviewable branches. No promotion by renaming branches.
- Current engineering instructions: this file; snapshot: PROJECT_STATE.md; approvals: DECISIONS.md; acceptance: TEST_MATRIX.md; resumption: HANDOFF.md.
- Historical CI and previous Phase-1 indexed-store checkpoint documents remain intact. Preserve the approved UI Style Guide and page-specific carryover ledger held with the archived design references.
- Keep external archives separate from runtime source. Never insert private storage paths, URLs, user data, credentials, or sensitive local context into this public repository.

## Architecture invariants
- MV3 service worker, content scripts, popup/options, background messaging, canonical settings, offscreen clipboard support.
- Local deterministic capture remains functional without network or optional AI. Never transmit clipboard content without explicit configured consent.
- Protect installed 3.7.9 data; compare exact extension ID, storage schema and migration path before importing or upgrading.
- IndexedDB remains experimental/shadow until all real-browser authority gates pass; legacy arrays remain authoritative where applicable.

## Working protocol
1. Identify exact source ref, manifest/version fields, file SHA-256 inventory, user approval and rollback source.
2. Specify one bounded behavior or UI change, expected invariants and tests. Do not silently redesign frozen visuals.
3. Add a regression case before or with each fix. Avoid repeating a failed hypothesis twice without changing diagnostic strategy.
4. Run static/lint, manifest/resource, unit/contract, installed Chrome/Edge behavior, persistence/restart, clipboard latency, and screenshots at Windows scaling 150% as appropriate. CI syntax PASS is NOT runtime PASS.
5. Require adversarial security/data-loss review for manifest permissions, clipboard/network, storage migrations, installers, destructive actions, and release candidates; document review evidence and reviewer identity/type (never roleplay an independent agent).
6. Record failed approaches in docs/FAILURE_STRATEGY_LEDGER.md and update PROJECT_STATE.md, TEST_MATRIX.md, DECISIONS.md and HANDOFF.md at milestones.

## Release, agents and rollback
- No merge to main, published extension, installed-system mutation, secret/permission change, scheduled external automation, or archive deletion without explicit approval.
- No agent can approve/merge its own work. Use least privilege, draft PRs and synthetic fixture data; no user clipboard or private folder contents in remote workflows.
- A release requires reproducible freshly extracted ZIP checks, functional browser tests, restoration/import rollback, matching manifest identity and package hashes, and user acceptance.
- Preserve last working install and immutable checkpoint; reversible changes only on engineering branches. Rollback is restore prior package plus verified settings/history backup, never destructive reset.
- Batch safe independent operations to minimize interruptions. For mundane work use bounded reasoning and deterministic tools; escalate hard regressions for deeper review.
