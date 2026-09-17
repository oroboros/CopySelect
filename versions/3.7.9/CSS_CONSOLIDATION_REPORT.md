# CopySelect 3.7.8.25 stylesheet consolidation

## Authoritative source

- Source: `CopySelect_v3.7.8.25.zip`
- SHA-256: `BF480A6FF29E890F567176B25DA22A8EFB78200AF363408E11A8FBEBBF3F1F39`
- The supplied archive was preserved unchanged in `Archive`.
- No application JavaScript, HTML, settings defaults, or feature behavior was replaced from an older version.

## Cascade consolidation

| Metric | Supplied RC | Consolidated | Change |
|---|---:|---:|---:|
| Total CSS bytes | 419,315 | 329,040 | -90,275 (-21.5%) |
| Component stylesheet bytes | 419,315 | 317,028 | -102,287 (-24.4%) |
| CSS rules | 3,595 | 2,968 | -627 (-17.4%) |
| `!important` declarations | 4,861 | 3,569 | -1,292 (-26.6%) |
| Conflicting redeclarations | 1,931 | 109 | -1,822 (-94.4%) |
| Duplicate selectors | 864 | 760 | -104 (-12.0%) |
| Media-query blocks | 104 | 98 | -6 |

The cleanup removed only exact duplicate rules, declarations provably shadowed by later declarations in the same selector/context, and empty rules. A five-environment computed-style/geometry comparison after that cleanup reported zero differences. The generic terminal foundation was then mechanically separated into owned `responsive.css` and `accessibility.css` modules; a before/after modular comparison also reported zero differences.

## Foundation and consistency work

- Preserved the supplied 3.7.8.25 desktop UI as the authoritative visual baseline.
- Normalized primary section headings to the established 14 px/600 treatment.
- Added one final keyboard-focus contract that wins over historical `outline:none` rules.
- Added target-area treatment for small help controls, range fields, and position controls.
- Synchronized the History auto-expand delay with the native `disabled` property and retained the visual disabled treatment.
- Added a final reduced-motion contract after all component animations.
- Improved meaningful low-contrast text in navigation, History, Site Rules, Advanced mode, and About/FAQ.
- Preserved decorative brand/effect colors and documented them as non-text visual exceptions.
- Preserved intentional special positioning, including the History end treatment and product-specific card geometry.

## Responsive policy

- Desktop geometry stays authoritative while space is sufficient.
- Read Aloud, feedback, Metadata, Site Rules, backup, and other multi-column layouts stack only when content pressure requires it.
- At 800 CSS px and below, navigation becomes part of normal flow and page/card widths are bounded to the viewport.
- At 480 CSS px and below, controls and cards use a complete one-column reflow.
- History toolbars stack without clipping; the narrow-screen snippet action cluster now flows below snippet text instead of overlaying it.
- At large displays, forms retain readable widths instead of stretching across the entire canvas.

## Verification

- JavaScript syntax: 10 root JavaScript files passed `node --check`.
- Manifest: valid JSON; version 3.7.8.25.
- Render matrix: 18 pages/views across eight environments, including exact 480, 800, and 1100 CSS-pixel boundaries, 1280x720, narrow 900x900, 2560x1440, 3840x2160, and 400% reflow; zero page errors or horizontal overflow.
- Interaction states: 16 exercised states; zero horizontal-overflow states.
- Accessibility: zero keyboard-focus failures, zero unresolved target-size failures, zero visually-disabled-but-focusable failures.
- Contrast: all meaningful text passed the automated solid-background check. The meaningful rainbow preview word was darkened while retaining its color sequence; remaining detections are two redundant effect-preview glyphs and the brand slash.
- Popup: loads the component, responsive, and accessibility stylesheets in order; 390px render has no horizontal overflow, all 16 visible focus targets pass, reduced motion resolves to 0.01ms, and no page errors occur.
- Reduced motion and forced-colors screenshots were generated and reviewed.
- The visible Chrome browser surface was unavailable to computer control, and the in-app browser blocks local `file://` pages. Automated rendering used the installed Chrome executable. The user separately loaded and visually inspected the extracted 3.7.8.25 build in Chrome at their normal environment and reported no visible problems.
- Final independent review verdicts: visual-system panel **GO**, accessibility panel **GO**, and devil’s-advocate release gate **GO**. No unresolved visual, responsive, accessibility, architectural, or packaging blocker remains.
- Package verification: 84 expected files, 84 packaged files, with zero missing, extra, or byte-mismatched entries.

## Intentional exceptions

- The visual toggle track remains compact; its usable target is supplied by its associated label or surrounding spacing.
- Decorative brand colors are retained even where a text-only contrast scanner flags the isolated glyph.
- Large screens keep readable content widths and open canvas rather than stretching every form control.
- Idiosyncratic product treatments are retained unless they caused clipping, overlap, inaccessible focus, or viewport overflow.
