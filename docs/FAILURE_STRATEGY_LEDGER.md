# CopySelect Failure Strategy Ledger

Status: initialized 2026-10-20. This is a living engineering record, not proof that defects are resolved.

| ID | Area | Symptom/evidence | Current status | Acceptance evidence |
|---|---|---|---|---|
| CS-001 | Baseline | GitHub main manifest 3.7.9; Dropbox holds multiple v4.0 candidates | BLOCKED: reconcile source | hash-level inventory and designated immutable reference |
| CS-002 | UI | Historical profile hover geometry and spacing regressions | OPEN: reproduction needed | approved screenshots at 150% Windows scaling |
| CS-003 | Paste Format & Templates | Reconstruction and interactions not independently verified | OPEN | browser interaction and persistence QA |
| CS-004 | Storage/Collections | Summary and overlay layout issues historically reported | OPEN | visual + behavior regression cases |
| CS-005 | Runtime performance | Blocking CSS/DOM/runtime bottlenecks alleged, no measured baseline | INVESTIGATE | performance trace, benchmark, improvement without regressions |
| CS-006 | Automated tagging | Needs functional specifications, privacy model, test datasets | PLANNED | deterministic tagged-item quality evaluation |
| CS-007 | Automation | No verified GitHub agentic workflows/CI in main | OPEN | successful least-privilege workflow run and preserved logs |
| CS-008 | Dropbox/GitHub parity | Important repo assets not yet verified byte-for-byte in Dropbox | OPEN | inventory with SHA256 comparison and transfer manifest |

## Failure-review protocol
For each incident append: date, version/SHA, reproduction, expected versus actual, impact, evidence links, root-cause hypothesis, tests, rejected fix attempts, chosen change, regression coverage, outcome and rollback checkpoint.
Do not delete historical failure entries. Explicitly label unknown/unverified conditions.


## 2026-10-20 engineering-pass evidence
- CI commit `0c8b3b6762d1386f0355fbe745e3e5129fd66046`, GitHub Actions run `39396083723`: manifest/syntax validation, manifest permission inventory, HTML integrity, multilingual smart-tagging contracts, runtime-hotspot inventory, SHA256 artifact upload all **PASS**. These are static/contract gates only.
- `scripts/audit-extension-manifest.cjs`: catalogs manifest permissions and missing runtime dependencies. Broad permissions are WARN, not automatic failures; necessity requires manual privacy/functional review.
- `scripts/inventory-runtime-hotspots.cjs`: outputs `runtime-hotspots.json` in CI artifact. Counts are hypotheses only, not measured long tasks or render bottlenecks.
- `tests/smart-tagging-contract.test.cjs`: synthetic multilingual concept, existing-tag, deterministic output and mutation-safety contracts. No real user clipboard data.
- Dropbox `CopySelect_v4.0a5.2.4_WORKING/manifest.json` declares `version_name: v4.0a5.2.4`, `version: 4.0.5.24`; GitHub main declares 3.7.9. Baseline authority remains **UNRESOLVED**.
- CS-007 is **PARTIAL PASS**: deterministic CI verified; Copilot agentic workflows not authenticated/activated, no unattended AI reviewer verified.
- CS-006 is **IN PROGRESS**: tagging tests exist; no ground-truth precision/recall benchmark, no new tagging runtime release.
- CS-005 is **IN PROGRESS**: static hotspot inventory exists; actual browser performance remains unmeasured.
