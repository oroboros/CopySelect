# CopySelect — Decisions and Authorization
Updated 2026-10-21. **Only USER-APPROVED rows confer product/change authorization.**

| ID | Status | Decision or proposal | Evidence / reversal gate |
|---|---|---|---|
| D01 | USER-APPROVED | Preserve the satisfactory installed 3.7.9 as daily-use fallback. | Direct user report; replace only after independently verified candidate and user acceptance. |
| D02 | USER-APPROVED | Preserve older frozen v4 references; investigate pre-UI-cleanup build rather than assume latest diagnostic is best. | User remembers satisfactory pre-cleanup build; exact version identification remains UNKNOWN. |
| D03 | USER-APPROVED | GitHub + both cloud stores maintained; frozen builds and archives never silently overwritten. | Current conversation. Hash-by-hash parity is not yet verified. |
| D04 | USER-APPROVED | UI work must preserve approved page-specific anatomy; existing Style Guide and carryover ledger are design authority. | Archived design ledger; no blanket redesign authorized. |
| D05 | HISTORICAL DOCUMENTED CHOICE, NOT RUNTIME APPROVAL | Legacy arrays remain canonical while IndexedDB operates as shadow; promote only after browser gates. | `phase1-checkpoints/2026-10-03/INDEXEDDB_AUTHORITY_READINESS.md`; rollback if persistence/latency gates fail. |
| D06 | USER-APPROVED RESET | Recover state, document sources, audit workflow; no unrelated feature development; no new credentials, agents, external automation, publishing or production mutation without approval. | Project Reset 2.0 request, 2026-10-21. |
| D07 | ENGINEERING RECOMMENDATION ONLY | Use engineering branch as documentation authority and preserve external source trees separately from public GitHub until private content and identity reviewed. | Public repo visibility confirmed; revisitable if repo privacy/publishing approval changes. |
| D08 | UNKNOWN / REQUIRES EVIDENCE | Which precise v4 version preceded UI cleanup and which v4 source should become baseline? | Compare archived candidate hashes, live manifest, complete package, test ledger and user approval. |
| D09 | NOT APPROVED | Merge to main, promote v4.1, migrate storage, install/replace extension, activate Copilot AI agent or add recurring workflow schedule. | Require explicit approval and release/security checks. |

Rejected or paused methods:
- Picking a release by the newest filename or branch label: failed because a v4-named Git branch equals main 3.7.9 and v4.1 trees carry .22 UI filenames.
- Treating CI green as functional extension validation: rejected; CI is predominantly static.
- Patching a v4 diagnostic build into production or importing real History before upgrade tests: rejected for data safety.
- Repeated layout CSS overrides without DOM/visual measurements: paused; require bounded test and approved comparison.
- Treating agent personas as independent audits: rejected; name and verify a real reviewer or label self-review.
