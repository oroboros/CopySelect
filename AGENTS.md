# CopySelect Agent Instructions

## Mission
Maintain the Chrome/Edge Manifest V3 extension CopySelect. Prioritize correctness, reproducibility, accessibility, performance, and fidelity to approved visual references. Never silently declare an experimental version production-ready.

## Source-of-truth warning (2026-10-20)
Repository main currently reports manifest version 3.7.9, while Dropbox holds numerous v4.0 alpha snapshots. The authoritative working/release baseline is **UNRESOLVED**. Treat main as a historical code snapshot, not a validated current release. Do not cherry-pick features or overwrite user-approved UI until versions are reconciled.

## Required working method
1. Read this file, docs/FAILURE_STRATEGY_LEDGER.md, and relevant scoped AGENTS.md files before touching code.
2. State affected components, intended invariants, tests, risks, and rollback before changing code.
3. One behavior or UI area per PR. Keep diffs narrow and avoid opportunistic refactors.
4. Run manifest/syntax checks, extension smoke tests, affected interaction regression tests, and targeted visual screenshots at Windows 150% scaling.
5. Compare screenshots to the *approved* reference; never infer approval from a successful render or green CI.
6. Keep user data local unless explicitly authorized. Avoid leaking clipboard/history content into CI logs, analytics, screenshots, or model calls.
7. Log failures, root causes, rejected hypotheses, and regression tests in the failure ledger.
8. Do not merge to main, publish a browser extension, move release markers, delete archives, or sync over Dropbox checkpoints autonomously.
9. Agent findings go into issues or draft pull requests with evidence, reproducible steps, and a rollback path. Human approval is required for merging and releases.

## Initial engineering work queues
- Baseline audit: identify runtime build, source provenance, manifest differences, missing artifacts and documentation.
- Runtime wiring: event listeners, settings persistence, messaging, permissions, service-worker lifecycle, UI dead controls.
- Performance: profile DOM size, long tasks, forced layout, CSS blocking, redundant style rules, popup load, storage reads; make measurements before optimizations.
- UI: geometry, hover, spacing, alignment, theme and accessibility regression checks, especially 150% scaling.
- Automated tagging: define expected behavior and privacy boundaries; use offline/local deterministic tests before feature implementation.
- CI/security: deterministic lint/static checks, Playwright extension tests, dependency and permission audit, supply-chain safeguards.

## Definition of done
PR links to issue, names baseline and test environment, includes before/after evidence for UI changes, explains data migration and rollback, updates tests and ledger, and receives independent adversarial review. Failing or unexecuted checks must be clearly declared.

## Agent boundaries
Default read-only analysis. All code-writing agents use engineering branches and draft PRs. No agent may bypass CI, approve its own PR, touch credentials, or authorize its own merge.
