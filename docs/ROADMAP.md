# CopySelect Roadmap

## Post-RC: Automatic Clipboard History Backups

Status: planned; not implemented in c3.7.8.13 RC.

Goal: provide automatic, local backups of CopySelect clipboard history so recent history can be recovered after corruption, accidental deletion, or migration problems.

Planned direction:
- Optional automatic backup setting; default behavior to be decided during implementation.
- Backups created without interrupting normal copying/history use.
- Rotating retention rather than unlimited accumulation.
- Start with a small number of recent snapshots (for example, 2-3) and make retention configurable if useful.
- Store backup metadata including creation time, CopySelect version, format/schema version, and item count when available.
- Never treat a backup as the live database; restore/import must be explicit and guarded.
- Preserve pinned items, metadata, rich-text data, tags/collections, and other supported history fields when those features exist.
- Validate backup before replacing an older known-good snapshot.
- Consider backup triggers such as periodic interval, browser/app startup or shutdown, and before destructive bulk history operations.
- Provide clear restore/import UX and failure reporting.
- Keep backups local unless a future explicit export/sync feature is separately designed.

Packaging note: the development/package `history-backups/` folder is a placeholder/documentation location only. c3.7.8.13 does not automatically capture the user's live browser history database.
