# CopySelect — Engineering Handoff (2026-10-21)

**What:** Chrome/Edge MV3 extension for auto-copy, History, WordWatch, Collections/tags, Paste Stack, settings and profile/site controls.

**Read first:** `AGENTS.md`, `PROJECT_STATE.md`, `DECISIONS.md`, `TEST_MATRIX.md`, `docs/FAILURE_STRATEGY_LEDGER.md`, then relevant `phase1-checkpoints/2026-10-03/*`. Historic frozen release reports are archived and must remain intact.

**Truth right now:** User uses 3.7.9 successfully; GitHub main manifest 3.7.9 at `77740904cd9fa2cb42f09daca9be3a94f2ce7a71`. Engineering branch `engineering/agent-foundation-2026-10-20` contains non-production CI and recovery docs, not the later v4 runtime. Historical verified-by-report release v4.0a21.7.10 exists in preserved archive, but not freshly revalidated; separate later v4.0a21.7.20 diagnostic and v4.1 source snapshot exist; v4.1 source-to-package identity and runtime quality unresolved. No production promotion authorized.

**Safe source locations:** GitHub `oroboros/CopySelect` branches `main`, `engineering/agent-foundation-2026-10-20`, `phase1/indexeddb-foundation-2026-10-03`. Historical v4 release integrity and page-specific UI guides reside outside the public repository; consult project owner-maintained protected archive via available connected service. Do not put private cloud paths, real clipboard content or credentials in this public repo.

**Known hazards:** Filename/manifest/branch confusion; different v4 UI build labels in the preserved v4.1 tree; original external working folder currently returns empty; prior test candidate has no real-browser functional gate; 150% UI acceptance outstanding; IndexedDB not promoted; AI permission/network and storage reset need direct audit. Static GitHub CI passing is not user runtime verification.

**Next pass exactly:**
1. Identify byte-for-byte preserved 7.10 package, v4.1 runnable source, and 7.20 diagnostic; compare package file trees/manifest identities/test reports and assign immutable hashes.
2. Select a single isolated test target only on evidence; inspect initialization, network, and clipboard logic with synthetic data. Do not change main or installed extension.
3. Run clean-profile Chrome/Edge and 150% UI test matrix, capture failure evidence and rollback proof. Only then propose a release decision or request one targeted user check.

**Agent/automation:** Deterministic static CI confirmed on existing branch for commit `5f73c62d1a601b59fa27d202f4b4de438604daa7`; a real unattended AI reviewer is NOT verified. A scheduled workflow defined on a non-default branch is not proof of active nightly execution. No new autonomous automation during reset.

**Finish each pass:** Update project state and test matrix; append failure/root-cause evidence; commit to an engineering branch; cross-check refs and hashes; archive verified artifacts externally only when transfer is supported and confirmed. Prefer GPT-6 Medium for bounded follow-ons; escalate release-critical conflicts.
