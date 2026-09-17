# CopySelect 3.7.8.23 targeted audit

Requested corrections:

- Master toggle thumb raised 1 CSS px without changing switch dimensions.
- Quick-insert tooltips use parenthetical examples without the `Example:` prefix.
- Profile Guide keeps alphabetical source order and displays column-major: top-to-bottom left column, then top-to-bottom right column.
- Selection > Unorganized label begins 13 CSS px after its checkbox.
- WordWatch action is labeled `Teach WordWatch`.
- Selection > All no longer has a hard-coded checked state; it reflects whether all currently visible clips are selected.
- Easter-egg button no longer changes transform on `:active`, removing the physical jump. Extra one-off motion effects from 3.7.8.22 are disabled; ordinary story lines are static. Emotional translucency remains opacity-only.

Regression guardrails retained: current UI remains authoritative, Copy Confirmation grid ordering retained, Simple/Advanced accents retained, History timeline grouping retained, FAQ internal-link convention retained.
