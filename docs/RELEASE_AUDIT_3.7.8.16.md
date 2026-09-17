# CopySelect 3.7.8.16 RC — Release Audit

## Senior-dev implementation review
- Confirmed 3.7.8.15 remained the runtime baseline and changes were targeted rather than broad file restoration.
- Pixel instructions in this pass are treated as CSS pixels. No Windows-scaling conversion is applied.
- Confirmed metadata separator bug root cause: `metadataSeparator === "custom"` was joined literally instead of resolving `metadataCustomSeparator`.
- Confirmed History metadata visibility does not participate in the `expandable` calculation; expansion is content-driven. Removed the stale `full.length > 160` trigger because the excerpt is not truncated until 340 characters, so 161–340 character snippets previously showed a control that could not visibly expand.
- Confirmed metadata-visible History cards had a more-specific shadow overriding the 2px copy-success outer ring; fixed with a state-specific rule.
- Confirmed When matched DOM order now matches the requested 3-column visual order.
- Confirmed Studio Back control remains a real `<button>`, not a text link.

## Devil's-advocate regression review
- Storage override touches only the same three requested child-gap selectors.
- No expand/compress button is appended in `makeHistoryItem` unless `expandable` is true.
- Copy-success timeout and CSS duration both equal 1000 ms.
- Metadata-on and metadata-off flash both retain the 2px neon ring.
- Ctrl+Shift+V intercepts only editable INPUT/TEXTAREA/contenteditable targets and does not alter ordinary page shortcuts elsewhere.
- Custom separator fallback uses a newline if Custom is selected but the custom separator field is empty, preventing accidental literal sentinel output.
- FAQ uses one toggle control and line-only glyphs; no History arrow assets are reused there.
- Studio local margins/padding in the new override stay well below 30px.
