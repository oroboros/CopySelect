# CopySelect v3.7.9 migration audit

**Base:** stylesheet-consolidated v3.7.8.25 RC.

| Post-.25 delta | Decision | v3.7.9 |
|---|---|---|
| History rail center-derived X/Y geometry | Migrate | Implemented |
| Easter egg second stand-up jump on “Everyone stands…” | Migrate | Implemented |
| No jump on “A sparrow brings…” | Migrate | Implemented |
| “Hey stop!” jump-out | Migrate | Implemented |
| Emotionally translucent starts immediately after Hey-stop phase | Migrate | Implemented |
| Translucency opacity-only / no entry jump | Migrate | Implemented |
| Tiny Disco line positional hop, no bow/rotation | Migrate | Implemented |
| Fail-closed release gate | Migrate | Implemented |
| Restore Effects 20% size reduction | Reject | User explicitly said not necessary |
| .27 removal of native disabled state for History hover-delay | Reject | Consolidated-base accessibility behavior preserved |
| .27 wholesale stylesheet/HTML overlay | Reject | Would undo consolidated architecture |

No other application-code delta between the live consolidated .25 and live .27 was accepted for migration.
