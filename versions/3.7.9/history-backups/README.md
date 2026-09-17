# Clipboard History Backups

Reserved for exported CopySelect clipboard-history snapshots.

Keep a small rolling set here when packaging a development checkpoint, for example the two most recent known-good exports. Runtime browser history is not embedded automatically in the extension build and no live history data was available when c3.7.8.13 RC was repackaged, so this folder intentionally contains no fabricated snapshot.

Suggested names:
- `clipboard-history_YYYY-MM-DD_HHMM.json`
- `clipboard-history_YYYY-MM-DD_HHMM.json`

Do not store sensitive/private clipboard data here unless the package is being kept privately.
