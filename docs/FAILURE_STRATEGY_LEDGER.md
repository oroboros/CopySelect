# CopySelect Failure Strategy Ledger

Status: initialized 2026-10-20. This is a living engineering record, not proof that defects are resolved.

| ID | Area | Symptom/evidence | Current status | Acceptance evidence |
|---|---|---|---|---|
| CS-001 | Baseline | GitHub main manifest 3.7.9; external archive holds multiple v4.0 candidates | BLOCKED: reconcile source | hash-level inventory and designated immutable reference |
| CS-002 | UI | Historical profile hover geometry and spacing regressions | OPEN: reproduction needed | approved screenshots at 150% Windows scaling |
| CS-003 | Paste Format & Templates | Reconstruction and interactions not independently verified | OPEN | browser interaction and persistence QA |
| CS-004 | Storage/Collections | Summary and overlay layout issues historically reported | OPEN | visual + behavior regression cases |
| CS-005 | Runtime performance | Blocking CSS/DOM/runtime bottlenecks alleged, no measured baseline | INVESTIGATE | performance trace, benchmark, improvement without regressions |
| CS-006 | Automated tagging | Needs functional specifications, privacy model, test datasets | PLANNED | deterministic tagged-item quality evaluation |
| CS-007 | Automation | No verified GitHub agentic workflows/CI in main | OPEN | successful least-privilege workflow run and preserved logs |
| CS-008 | external archive/GitHub parity | Important repo assets not yet verified byte-for-byte in external archive | OPEN | inventory with SHA256 comparison and transfer manifest |

## Failure-review protocol
For each incident append: date, version/SHA, reproduction, expected versus actual, impact, evidence links, root-cause hypothesis, tests, rejected fix attempts, chosen change, regression coverage, outcome and rollback checkpoint.
Do not delete historical failure entries. Explicitly label unknown/unverified conditions.


## 2026-10-20 engineering-pass evidence
- CI commit `0c8b3b6762d1386f0355fbe745e3e5129fd66046`, GitHub Actions run `39396083723`: manifest/syntax validation, manifest permission inventory, HTML integrity, multilingual smart-tagging contracts, runtime-hotspot inventory, SHA256 artifact upload all **PASS**. These are static/contract gates only.
- `scripts/audit-extension-manifest.cjs`: catalogs manifest permissions and missing runtime dependencies. Broad permissions are WARN, not automatic failures; necessity requires manual privacy/functional review.
- `scripts/inventory-runtime-hotspots.cjs`: outputs `runtime-hotspots.json` in CI artifact. Counts are hypotheses only, not measured long tasks or render bottlenecks.
- `tests/smart-tagging-contract.test.cjs`: synthetic multilingual concept, existing-tag, deterministic output and mutation-safety contracts. No real user clipboard data.
- external archive `CopySelect_v4.0a5.2.4_WORKING/manifest.json` declares `version_name: v4.0a5.2.4`, `version: 4.0.5.24`; GitHub main declares 3.7.9. Baseline authority remains **UNRESOLVED**.
- CS-007 is **PARTIAL PASS**: deterministic CI verified; Copilot agentic workflows not authenticated/activated, no unattended AI reviewer verified.
- CS-006 is **IN PROGRESS**: tagging tests exist; no ground-truth precision/recall benchmark, no new tagging runtime release.
- CS-005 is **IN PROGRESS**: static hotspot inventory exists; actual browser performance remains unmeasured.

## Project Reset 2.0 adversarial self-audit — 2026-10-21
Reviewer: **structured self-review**; no separate independent reviewer or subagent was launched.

| ID / severity | What went wrong and evidence | Root cause | Correction and verification |
|---|---|---|---|
| CS-009 P0 | 3.7.9 is used successfully by the user, but speculative newer v4 labels were promoted as better. Historical v4.0a21.7.10 release reports were inspected, not fresh-rerun. | INFERRED: confusing archived release claims with current installed behavior. | **Records corrected:** 3.7.9 USER-REPORTED daily driver, newer v4 candidate NOT TESTED. Match actual installed source hash before promoting. |
| CS-010 P0 | v4-named backup branch is byte-identical by commit to main 3.7.9. Phase-1 branch has only 8 added docs even though ledger describes runnable store integration. | INFERRED: code and checkpoint documentation diverged. | **Records corrected:** neither branch is independent proof of v4 runtime code. Require complete file tree and runnable source verification. |
| CS-011 P1 | Later archived v4.1 tree manifest declares 4.1.0 while some UI assets are named 4.0a21.7.22. | INFERRED: layered UI carryover/version drift. | **OPEN:** inventory identity surfaces and compare byte-level candidate before release. |
| CS-012 P0 | Original connected working folder presently lists no children; preserved external source and UI lab trees still exist elsewhere; cloud parity unknown. | UNKNOWN: could be movement, synchronization, or indexing. | **PARTIAL:** locations established; find actual source packages and verify SHA256 parity before claiming restoration. |
| CS-013 P0 | v4 diagnostic ZIP passed syntax/ZIP checks but was not tested for installed-browser clipboard, History, upgrade and network/privacy behavior. | INFERRED: static tests were mistaken for runtime confidence. | **Corrected in TEST_MATRIX:** release-blocking runtime cases NOT TESTED; clean-profile inspection required. |
| CS-014 P1 | A daily-scheduled audit exists only on the engineering branch, while independent AI reviewer activation was never verified. | VERIFIED GitHub workflow and successful branch CI, no separate agent run. | **Corrected:** CI is active for branch events; no proven nightly schedule or AI reviewer. |
| CS-015 P1 | User-approved page-specific anatomy at risk from repeated CSS overlays; preserved Style Guide v1.5 and page carryover record were found. | INFERRED: missing authority reconciliation in prior UI passes. | **Corrected instructions:** screenshot and DOM inspection at Windows 150%; no generic refactor without per-page acceptance. |
| CS-016 P1 | Original diagnostic and separately prepared test ZIP have different verified SHA256 hashes, and full three-system sync was claimed before parity existed. | VERIFIED different bytes; incomplete transfer. | **PARTIAL:** hashes recorded; destination hashes and readback are required for full parity. |
| CS-017 P1 | Raw private source or private storage references could be accidentally disclosed through a public repository. | VERIFIED: GitHub repository is public. | **Corrected:** recovery docs exclude private storage paths and clipboard content; gate publication of external source. |
| CS-018 P2 | Historical tests reported prior false-green UI geometry, overflow and modal criteria. | HISTORICAL REPORT; no fresh reproduction. | **Process correction:** require rendered interactions and fresh ZIP extraction, not static CSS or old assertion alone. |

Rollback: all reset commits are documentation-only on engineering/agent-foundation-2026-10-20; revert individual commits before any approval if necessary. No frozen or installed source modified.