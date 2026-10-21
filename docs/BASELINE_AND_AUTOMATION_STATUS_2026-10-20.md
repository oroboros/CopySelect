# CopySelect Baseline and Automation Status — 2026-10-20

## Do not infer authority from filenames
This repository and the external archive historical materials are divergent. The GitHub default branch reports manifest version **3.7.9** and the external archive loose legacy snapshot reports **3.7.8.14**, while historical ZIP names identify much later **v4** candidates. A name alone does not validate the installed extension or indicate which UI was accepted.

## GitHub branch evidence
| Branch | Relationship to main | Interpretation |
|---|---|---|
| `main` | baseline | manifest 3.7.9 |
| `backup/github-v4.0a21.7.19-2026-10-02` | identical to main by commit comparison | branch name is not proof that it contains a v4 build |
| `phase1/indexeddb-foundation-2026-10-03` | 8 commits ahead | adds phase-1 decision and checkpoint files; do not assume storage promotion |
| `engineering/agent-foundation-2026-10-20` | draft PR #1 | agent rules, failure ledger, deterministic baseline audit |

## IndexedDB design already exists
The 2026-10-03 Phase-1 decision chooses IndexedDB as canonical **future** History backend, with legacy arrays authoritative during shadow migration. The readiness ledger explicitly states that real browser restart persistence, forced termination, interrupted migration, IDB latency, and capture path performance are **NOT TESTED**. Do not promote IndexedDB on the strength of static tests alone.

## CI evidence
Baseline Audit and Privacy lint both returned successful GitHub Actions runs for engineering commit `0e4cc9709aa96f13268a354c59d5174dad55178c`. This is positive static-check evidence, not browser QA.

## external archive organization
Project home: `[private project archive root]`
- `01_ACTIVE_SOURCE`: reserved for a promoted, verified baseline.
- `03_CHECKPOINTS`: multiple original working/rebuild/ZIP/checkpoint variants, historical source snapshot.
- `04_QA_AND_TESTS`: diagnostics and QA-only variants.
- `05_UI_AND_ASSETS`: UI references and prior stylesheet work.
- `06_HANDOFFS`: handoff materials.
- `Archive`: original deep historical archive pending reduction.

## Work queues
- #2 Reconcile and hash-lock authoritative source and external archive mirror
- #3 Real-browser IndexedDB authority gates
- #4 Visual/runtime QA and performance suite
- #5 Automatic tagging evaluation
- #6 Blocking CSS/DOM/runtime audit

## Agent architecture
Conventional Actions for deterministic tests. For reasoning tasks, use `gh-aw` Markdown workflows compiled to `.lock.yml`, with default read-only scope and only validated safe outputs. Never publish uncompiled source as though it were runnable. Token and repo-scoped authentication must be explicitly verified. For unattended runs allow reading, test logs, triage, drafts and isolated PRs; prohibit merge, publish and checkpoint deletion.

## Release gate
Choose a canonical baseline only after hashes, file trees, manifest, dependency closure, known functioning browser behavior and approved visual references agree. Never replace older frozen builds until an independently verified release exists.
