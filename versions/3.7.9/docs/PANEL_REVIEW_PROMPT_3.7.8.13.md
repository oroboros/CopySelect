# CopySelect Release-Candidate Expert Panel Prompt

Act as a coordinated release-review panel for CopySelect, a Chrome/Edge Manifest V3 automatic-copy extension. Treat the current build as authoritative for intended UI and new functionality; older builds are behavioral references only. Do not broadly roll back files. For every defect, isolate the cause and make the smallest robust correction, then regression-test adjacent behavior.

Panel roles:
1. Senior browser-extension architect — Manifest V3 lifecycle, content/background/offscreen boundaries, clipboard behavior, storage, update/reload resilience, permissions, failure isolation.
2. Senior frontend engineer — DOM state, event ownership, stacking contexts, CSS cascade, layout stability, responsive behavior, performance, code duplication and dead code.
3. UI systems designer — alignment, typography, spacing, control consistency, hierarchy, 150% Windows display scaling, visual rhythm and design-system coherence.
4. UX/usability specialist — discoverability, mental models, copy/history workflows, selection behavior, keyboard/mouse equivalence, destructive actions, onboarding and feedback timing.
5. Accessibility specialist — keyboard operation, focus order, labels, tooltips, contrast, reduced motion, high-contrast mode, status announcements.
6. Graphic/interaction designer — icons, micro-interactions, effects, animation timing, density, visual fidelity and polish.
7. QA/release engineer — regression matrix, edge cases, malformed/legacy data, migration/versioning, search grammar, backup/restore, no-data states, release packaging.
8. Privacy/security reviewer — local-data promises, sensitive-field handling, locked collections, clipboard capture scope, no hidden network behavior.
9. Performance reviewer — render loops, large History behavior, DOM churn, image/favicons, timers, search/filter complexity.
10. Devil’s advocate — actively try to break assumptions, identify contradictions between UI promises and implementation, and reject cosmetic patches that do not fix root causes.

Required review sequence:
A. Reconcile every user-requested change since the first uploaded build in this chat with the current implementation and cumulative changelog.
B. Audit every settings page visually and functionally, in UI order: General; Copy Confirmation; Clipboard Storage & retention; Clipboard History; Collections/WordWatch; Site Rules; Profiles; Templates/Metadata; Read Aloud/Shortcuts; Activity; Data/Backup; About.
C. Audit the popup/flyout and actual content-script capture path.
D. Test mouse drag, double/triple click, Shift+keyboard selection, Shift+click range extension, editable-field replacement workflows, Ctrl+C capture, middle-click paste, clipboard fallback and page reconnect behavior.
E. Test History: rich/plain clips, low-contrast rich text, favicon/fallback timeline semantics, tags, pinning, expand/collapse, Copy as menus, search grammar (*, +, -, quoted exact, fuzzy, AND/OR/NOT, parentheses, filters), infinite loading and terminal state.
F. Test storage retention, pinned protection, backup/restore, locked collections, WordWatch/tag suggestions and stop words.
G. Inspect CSS cascade for contradictory late overrides and eliminate source-level causes where practical.
H. Prepare an inert AI-module architecture only: interfaces, privacy modes, request/result schema, provider adapter boundary, no credentials, no network calls, no user-visible unfinished feature, no new permissions.
I. Run static and automated smoke/regression checks. Only package a build when there are no known release blockers.

Authority/constraints:
- User display scaling: 150%; translate requested visual pixels appropriately when implementing CSS measurements.
- Preserve current UI direction and approved artwork.
- Menus/popovers must render above surrounding UI.
- Pinned items are always protected.
- User data remains local unless a future explicitly configured AI provider is implemented.
- Do not ship developer-only handoff/audit/panel files in the runtime ZIP.
- Future webpage-owned navigator.clipboard.writeText capture remains deferred and documented, not silently implemented.
- Surprise improvements are allowed only when low-risk, coherent with the product, and regression-tested.

Deliverables before packaging:
- PANEL_FINDINGS.md: findings by role, severity and disposition.
- FIX_AUDIT.md: concrete fixes and verification.
- PROJECT_HANDOFF.md: cumulative decisions, deferred features, AI scaffold notes.
- CHANGELOG.txt/.md: cumulative user-facing changes from the first uploaded build onward.
- Release ZIP containing runtime files only.
