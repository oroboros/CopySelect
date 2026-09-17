# CopySelect 3.7.8.13 RC — Expert Panel Findings

Panel roles: senior Chrome/Edge MV3 architect; senior frontend engineer; UI systems designer; UX/usability specialist; accessibility specialist; graphic/interaction designer; QA/release engineer; privacy/security engineer; performance engineer; devil's advocate.

Historical regression baseline: user-uploaded `CopySelect_c3.7.8.3.1`.

## Release decision

**Panel disposition: APPROVE AS RELEASE CANDIDATE after the fixes below and automated validation.**

No known code-level release blocker remains in the reviewed tree. Real OS/browser integration paths (system clipboard, installed voice inventory/audio output, and browser-specific page behavior) still warrant a final live Chrome/Edge smoke test before declaring the RC final.

## Findings and disposition

### 1. UI systems / Copy Confirmation — HIGH regression risk, FIXED

**Finding:** Custom Symbol layout remained vulnerable to historical high-specificity/absolute-position CSS. Selecting Custom could still move the Symbol control. A runtime consolidation path could also construct a second Restore Effects wrapper despite the approved static markup.

**Fix:** The Custom slot is permanently reserved in the Symbol row, hidden with layout-preserving visibility when unused, and the legacy translation/absolute positioning is overridden. Runtime consolidation now creates a Restore Effects wrapper only if the existing button is not already inside the approved wrapper. Customize Effects labels are normalized by one final typography contract.

### 2. UX / History readability — HIGH, FIXED

**Finding:** The prior white-text outline/stroke treatment technically increased edge contrast but materially reduced readability, especially on small text at 150% Windows scaling.

**Fix:** History rich previews now calculate effective foreground/background contrast and apply a preview-only dark text override when contrast is below 4.5:1. No glow, stroke, or halo is used. Stored/copyable Rich Text remains unchanged. A small half-black/half-white Contrast indicator appears beside the timeline only when recoloring occurred, with an explanatory tooltip.

### 3. Timeline semantics — HIGH functional/visual consistency, FIXED

**Finding:** Source markers were suppressed with a global `seenSites` model. That incorrectly hid a site's icon when the timeline returned to that site after intervening entries from another source.

**Fix:** Timeline markers are transition-based: consecutive entries from the same source share one marker; a source change receives a new marker; returning to a prior source receives a new marker. The final timeline entry always has a marker. Missing favicons fall back to a stable colored domain-initial circle.

### 4. Interaction feedback — MEDIUM, FIXED

**Finding:** The requested longer copy-success flash could not fully play because JavaScript removed the class before the new CSS duration completed.

**Fix:** Visual thickness/duration were doubled and the removal timeout was synchronized so the animation completes.

### 5. Search grammar — MEDIUM, FIXED/VERIFIED

**Finding:** Search syntax had historically differed between simple and advanced paths; tooltip text had also leaked HTML entity text (`&quot;`).

**Fix:** Supported search surfaces use the common parser contract: fuzzy ordinary terms, exact quoted phrases, `*`, `+term`, `-term`, `AND`, `OR`, `NOT`, and parentheses. History field/quick filters remain supported. Tooltip is multiline plain text with real quote characters.

### 6. Storage & retention — MEDIUM visual regression risk, FIXED

**Finding:** Multiple historical icon systems and spacing overrides made Capture/Retention/Cleanup vulnerable to duplicate icons and inconsistent vertical rhythm.

**Fix:** Each heading has exactly one inline monochrome SVG; Cleanup is a trash can. Legacy pseudo-heading icons are suppressed at the source/cascade boundary. Requested child-row spacing and Summary-to-pinned spacing are governed by final shared rules rather than independent patches.

### 7. Collection Settings — MEDIUM usability, IMPROVED

**Finding:** Quick Collection Settings still spent too much vertical space and repeated controls did not align consistently with the rest of CopySelect.

**Fix:** Quick-mode geometry was compressed, related controls were grouped horizontally where safe, repeated switch/input geometry was normalized, and advanced WordWatch configuration remains separate rather than being over-compressed.

### 8. Selection-origin logic — HIGH behavior, FIXED/VERIFIED

**Finding:** Treating every Shift-held selection as keyboard selection penalized common Shift+click range selection, which usually signals a completed range rather than an editing gesture.

**Fix:** Pure Shift+keyboard selection in editable text retains the 1200 ms smart grace/cancellation behavior. Shift+click is mouse-assisted range selection and uses the normal configured Copy Delay after pointer completion.

### 9. About easter egg — LOW but visible, FIXED

**Finding:** Late transform rules could make the emotionally-translucent phase move/twirl rather than simply fade, undermining the intended dot-by-dot disappearance.

**Fix:** The translucency sequence is anchored and opacity-only. The twirl is reserved for the contextually appropriate disco beat. Yellow story responses received additional vertical breathing room.

### 10. MV3/CSP / changelog — HIGH release engineering, VERIFIED

**Finding:** Earlier changelog loading had been blocked by MV3 inline-script policy.

**Current state:** Changelog loader uses an external script and fetches packaged `CHANGELOG.txt` only. No inline executable scripts remain in shipped HTML.

### 11. AI preparation — ARCHITECTURE ONLY, APPROVED

**Finding:** Preparing for future AI integration can create accidental permission/privacy/network scope creep if introduced directly into runtime code.

**Fix:** Added an inert `ai-core.js` contract with request/result schemas, privacy modes, and a provider-adapter boundary. It is not imported by the manifest or runtime scripts, makes no network calls, adds no permissions, stores no credentials, and exposes no unfinished UI.

### 12. Performance — ACCEPTABLE FOR RC

History contrast checks run after rendering and are scoped to displayed rich content. Search parsing is local. No new network/background polling was introduced. The panel recommends profiling very large History sets post-RC, but found no new release blocker in this pass.

### 13. Accessibility — IMPROVED / NON-BLOCKING FOLLOW-UP

Focus styling uses the CopySelect accent rather than thick black browser-style borders; version and contrast indicators have accessible labels. A post-RC accessibility sweep with keyboard-only navigation and a screen reader is recommended, especially for complex custom menus and History actions.

### 14. Devil's advocate — STRUCTURAL RISK, DEFERRED REFACTOR

**Finding:** `styles.css` has accumulated many historical corrective layers. Several recurring regressions were caused not by missing new rules, but by older higher-specificity rules defeating them.

**Decision:** Do **not** rewrite the stylesheet immediately before RC. That would create a larger regression surface. Post-release priority: consolidate final component geometry/tokens, remove superseded rules, and add visual regression fixtures for the most fragile components (Copy Confirmation, Storage, History timeline, Collection Settings).

## Panel suggestions for post-release improvement

1. Consolidate `styles.css` into component sections/tokens and delete superseded corrective layers.
2. Add deterministic UI regression tests at 100%, 125%, 150%, and 175% display-equivalent scales.
3. Add a lightweight History rendering benchmark for large local histories.
4. Add accessibility regression checks for custom menus, segmented controls, and History row actions.
5. Explore optional `Capture webpage Copy buttons` only as an opt-in Advanced feature after compatibility/security review.
6. Explore selective monochrome section icons on other settings pages, following Storage & retention rather than adding decorative icon clutter.
7. Build the future AI module behind explicit capability/provider boundaries and local-first privacy defaults; keep provider code separate from classification/organization logic.
