# Morph (PowerPoint-style) — Slide Transition Spec (V1)

Status: **spec complete; implementation in progress**. (Implementation status is tracked in `documentation/specs/slides/transitions/06-morph-ledger-and-gate-plan.md`.)

This document defines an implementation-oriented spec for a **Morph** slide transition.

Key product decisions (locked in):
- PowerPoint-style behavior.
- Eligibility is limited to **L0 (depth 0)** in the layer tree.
- Matching key is **layer name** (no forced uniqueness).
- Duplicate name conflicts show an indicator; matching chooses the **top-most** duplicate deterministically.
- Morph interpolates **all shared Property Inspector (PI) properties**.
- Missing properties MUST animate to a defined “zero-equivalent” state (not abruptly pop on/off).

## 0) Scope

In scope:
- A new transition type: `morph`.
- Deterministic matching by **layer name** for L0 elements.
- Property interpolation based on the **shared PI property set**.
- Clear fallback rules (cross-fade) when properties or pairings can’t be meaningfully interpolated.
- Reuse existing readiness gating / lifecycle / reduced-motion behavior.

Out of scope (V1):
- Matching elements below L0 (groups, nested children, composition children).
- Arbitrary path morphing between unrelated vector geometries.
- Glyph-by-glyph / per-character text morphing.

Non-goals:
- No changes to slide content as part of playing a Morph transition.
- No new UI patterns beyond existing transition/layer UI conventions.

## 1) Benchmarks (high-level)

This section is behavioral benchmarking only.

### 1.1 PowerPoint Morph (conceptual)

Expected behavior:
- Attempts to match “the same object” between slides, then animates transform + visual changes.
- Unmatched destination objects generally fade in; unmatched source objects fade out.

Key takeaway:
- Matching MUST be predictable, deterministic, and explainable.

### 1.2 Figma Smart Animate (conceptual)

Expected behavior:
- Matching is strongly tied to layer identity/name and hierarchy.
- For matched layers, compatible properties interpolate; incompatible changes cross-fade.

Key takeaway:
- When interpolation is ambiguous, cross-fade is preferred over “wrong” morphing.

## 2) Terminology

- **Source slide**: the currently visible slide.
- **Destination slide**: the slide navigated to.
- **L0**: an element that is rendered at depth 0 in the layer tree (no parent container).
- **Top-most**: the element with the highest stacking order (highest z) among candidates.
- **Match**: a 1:1 pairing of a source element to a destination element.
- **Unmatched**: elements that exist only on one side after matching.
- **PI property**: a property controlled by the Property Inspector UI.

## 3) Transition configuration

Canonical transition type:
- `type: 'morph'`

Common fields (same semantics as existing transitions):
- `durationMs: number`
- `easing: string`

Morph-specific fields:
- None in V1. Matching strategy is fixed to the product decisions above.

Normative requirements:
- If `prefers-reduced-motion: reduce` is active, `morph` MUST be forced to `none`.
- Legacy `'magic'` remains unsupported unless explicitly mapped to `morph`.

Compatibility requirements:
- The transition type `morph` MUST serialize/deserialize via existing file storage.
- `morph` MUST not introduce non-deterministic doc mutations (realtime collaboration safe).
- `morph` MUST be runtime-only (undo/redo compatibility).

## 4) Eligibility (L0-only)

An element is eligible for Morph matching if and only if:
- It is present in the slide’s top-level ordering (e.g., `effectiveOrder` / `elementOrder`).
- It has no parent container (`parentId` is missing/falsey).

Notes:
- Composition children that are intentionally hidden from the top-level tree (e.g., mask shape, mask content, boolean operands) are not eligible in V1.
- Groups at L0 are allowed to exist, but Morph does not recurse into children in V1; group-to-group morph is treated as unsupported (cross-fade only).

## 5) Matching model (name-based, PowerPoint-style)

### 5.1 Matching key

The matching key is the element **layer name**.

Key extraction:
- Use `element.name` when present.
- If `element.name` is empty/undefined, the element MUST be treated as **unmatchable** in V1.

Normalization (V1):
- Trim leading/trailing whitespace.
- Do not case-fold. Matching is case-sensitive after trim.

### 5.2 Duplicate names (conflict + deterministic resolution)

If a slide contains more than one L0 element with the same normalized name:
- The UI MUST show a non-blocking **conflict indicator** on those layers:
  - Alert icon
  - Name rendered in the **ember** color token (do not introduce new colors).
- The UI MUST use existing design system components/variants and global tokens (no local styling or hard-coded colors).
- The indicator MUST be theme-safe (works in light/dark) via tokens/variables.
- The system MUST NOT force uniqueness.

When matching a name with duplicates:
- Choose the **top-most** element for that name on each slide.
- All other duplicates with the same name are treated as **unmatched**.

Top-most definition (normative):
- Use the stacking order represented by the slide’s order array (`elementOrder` / `effectiveOrder`).
- Higher index == more front == more top-most.

### 5.3 Determinism requirements

- Matching MUST be deterministic.
- A single element MUST NOT match multiple elements.
- When multiple candidates exist for a name, tie-break is resolved solely via the “top-most” rule.

### 5.4 Matching algorithm (normative)

Given eligible L0 elements from both slides:

1. Build a `name -> [elements...]` map for source and destination.
2. For each name present in both maps:
   - pick `src = topMost(source[name])`
   - pick `dst = topMost(dest[name])`
   - emit match `(src.id -> dst.id)`
3. All non-selected elements are unmatched.

Explainability hooks (required for tests/debug):
- Expose match metadata (even if test-only) for:
  - matchKey (name)
  - whether duplicates existed on source/destination
  - chosen sourceId/destinationId

## 6) Property model (PI-driven)

### 6.1 What Morph interpolates

Morph interpolates the union of:
- Base render properties (always): `x`, `y`, `width`, `height`, `rotation`, `opacity`
- All **shared** PI properties that apply to both element types.

“Shared” means:
- The property exists in the PI inventory, and
- The property is applicable to both element types (see Table 1), and
- The property is representable in a compatible way on both sides.

### 6.2 Missing property behavior (“animate to zero”)

When a property exists on one side but not the other:
- The missing side MUST be treated as having a **zero-equivalent** value.
- The transition MUST interpolate between the real value and the zero-equivalent value.

Zero-equivalent means “no visible contribution”, not necessarily numeric 0.
Examples:
- Stroke missing on one side → treat as stroke width 0 and/or opacity 0.
- Fill missing on one side → treat as fully transparent fill.
- Shadow missing on one side → treat as opacity 0 with blur/spread 0.

### 6.3 List properties (fills/strokes/effects)

`style.fills[]`, `style.strokes[]`, `style.effects[]` are list editors in the PI.

Interpolation rule (V1, deterministic):
- Only interpolate list items index-by-index when the stacks are structurally compatible:
  - same list length
  - and per-index “type” is compatible
- Otherwise, treat the entire list as incompatible and use the finite “unmapped conversions” list (Section 8) or fall back to cross-fade snapshots.

Implementation alignment note:
- The renderer creates per-fill “layers” and may create/destroy per-layer runtime instances when the fill list shape changes. Therefore, continuity requirements (Section 12) only apply when fill stacks are structurally compatible.

## 7) Interpolation rules (by property category)

### 7.1 Numbers

- Linear interpolate numbers (with existing easing applied at the animation timeline).

### 7.2 Colors

- Interpolate RGBA (color + opacity) in linear space.

### 7.3 Enums / discrete values

- Discrete values (e.g., blend mode, fit mode, boolean operation) MUST NOT tween.
- If both sides are the same enum value, keep it constant.
- If values differ, apply the destination value at $t=1$ and cross-fade visual output if needed.

### 7.4 Text

Text is treated as a box:
- Always morph geometry (`x,y,w,h,rotation`) and opacity.
- If text styling changes (font/size/weight/fill/etc.), cross-fade rendered text snapshots while the box moves.

### 7.5 Shapes

- Geometry always morphs at the wrapper level.
- Shape-parameter properties (polygon/star params) interpolate when both sides are compatible.
- Otherwise cross-fade the shape appearance.

## 8) Unmapped conversions (finite list, V1)

These are “bridge” cases where we define a deterministic mapping even when the raw property schemas differ.

- Stroke present ↔ no stroke
  - Map missing stroke to zero-equivalent: width 0, opacity 0, visible false.
- Fill present ↔ no fill
  - Map missing fill to a fully transparent fill.
- Solid fill ↔ gradient fill
  - Cross-fade fill content (do not attempt stop re-mapping in V1).
- Media fill (image/video/code) ↔ solid/gradient
  - Cross-fade fill content (do not execute code fills per-frame).
- Media fill ↔ media fill
  - If the media identities differ, cross-fade fill content.
  - If video/code identities match, preserve runtime state (Section 12).
- Text fill ↔ shape fill
  - Treat text fill as a synthetic “solid fill” for interpolation, otherwise cross-fade.

If a case is not listed here and stacks are incompatible, the system MUST cross-fade snapshots.

## 9) Tables (required)

### 9.1 Table 1 — PI properties × element types (applicability)

Element types used for Morph planning:
- **Shape**: `type:'shape'` (including legacy `rect/circle`), shapeKind in { rectangle, ellipse, line, polygon, star, vector }
- **Text**: `type:'text'`
- **Image**: `type:'image'`
- **SVG**: `type:'svg'`
- **Group**: `type:'group'`
- **Mask**: `type:'shape'` with `shapeKind:'mask'` (single-selection PI section)
- **Boolean**: `type:'shape'` with `shapeKind:'boolean'` (single-selection PI section)
- **Placeholder**: `type:'placeholder'` (note: renderer maps some placeholders to TextElement/ShapeElement)

Legend:
- ✅ applicable in PI
- ⚠️ applicable but morphing is constrained (see notes)
- ❌ not applicable
- 🚫 excluded from morph (not a visual property)

| PI property / path | Shape | Text | Image | SVG | Group | Mask | Boolean | Placeholder |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `x`, `y` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `width`, `height` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `rotation` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `opacity` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `flipX`, `flipY` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `blendMode` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `hidden` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `borderRadius`, `cornerRadii.*` | ⚠️ (rect only) | ❌ | ❌ | ❌ | ⚠️ (if style applies) | ❌ | ❌ | ⚠️ |
| `resizing` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ (text placeholders) |
| `style.fills[]` | ✅ | ❌ (text uses Typography) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `style.strokes[]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `style.effects[]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `textStyleId` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ (text placeholders) |
| `fontFamily` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ (text placeholders) |
| `fontWeight` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ (text placeholders) |
| `fontSize` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ (text placeholders) |
| Text fill / color / opacity | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ (text placeholders) |
| `lineHeight` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ (text placeholders) |
| `letterSpacing` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ (text placeholders) |
| `textAlign`, `verticalAlign` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ (text placeholders) |
| `fitMode` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `params.*` (polygon/star) | ⚠️ (polygon/star only) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| Mask `invert` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Boolean `operation` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `exportPresets[]` | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

Notes:
- Mask/Boolean have PI properties but are not meaningfully interpolated in Morph V1 (see pairing matrix). They are included for completeness.
- Placeholders are editor-level constructs; in runtime Morph, matching is expected to operate on effective rendered elements.

### 9.2 Table 2 — element-type pairing matrix

Legend:
- **Shared**: non-empty shared morphable property set beyond base geometry.
- **Base-only**: only base geometry/opacity is meaningful; other differences cross-fade.
- **Unsupported**: Morph matching exists (by name) but interpolation is not meaningful; cross-fade the entire element.

| From \ To | Shape | Text | Image | SVG | Group | Mask | Boolean | Placeholder |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Shape | Shared | Base-only | Shared | Shared | Base-only | Unsupported | Unsupported | Base-only |
| Text | Base-only | Shared | Base-only | Base-only | Base-only | Unsupported | Unsupported | Shared (text placeholder) |
| Image | Shared | Base-only | Shared | Base-only | Base-only | Unsupported | Unsupported | Base-only |
| SVG | Shared | Base-only | Base-only | Shared | Base-only | Unsupported | Unsupported | Base-only |
| Group | Base-only | Base-only | Base-only | Base-only | Unsupported | Unsupported | Unsupported | Base-only |
| Mask | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported |
| Boolean | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported |
| Placeholder | Base-only | Shared (text placeholder) | Base-only | Base-only | Base-only | Unsupported | Unsupported | Base-only |

Interpretation notes:
- “Shared” does not imply every PI property applies; it means the intersection (Table 1) is non-empty and compatible.
- For any cell marked Unsupported/Base-only, the runtime still MUST avoid blank stage; it simply uses cross-fade for the element’s visual content.

## 10) Rendering & orchestration

### 10.1 Core invariant

During an animated Morph transition:
- Both source and destination slides MUST be present in the DOM simultaneously.
- The stage MUST NOT show an empty/blank frame.

### 10.2 Recommended implementation approach (V1)

1. Render destination slide and complete readiness gating.
2. Build match map (Section 5).
3. For each matched element:
   - Animate base geometry + opacity.
   - Interpolate shared PI properties when compatible, else cross-fade.
4. For unmatched elements:
   - Fade out source-only elements.
   - Fade in destination-only elements.
5. Complete transition:
   - Leave destination slide as the only active slide.

Implementation alignment note:
- Presentation navigation commonly mounts a new slide view and unmounts the old one after the transition completes. Morph continuity for stateful fills (Section 12) therefore requires explicit orchestration (instance reuse or state transfer) and cannot be achieved by asset prefetch alone.

### 10.3 Slide background behavior (required)

During Morph, the slide background MUST cross-fade as part of the transition, independent of per-element matching.

Normative requirements:
- The source slide background and destination slide background MUST both exist in the DOM during the transition window (supports no-blank-stage).
- The transition MUST cross-fade background opacity from source→destination for all background fill categories:
  - solid
  - gradient
  - image
  - video
  - code

Stateful background rule:
- When the background fill is `code` or `video`, Morph MUST additionally apply the continuity rules in Section 12.

## 11) Readiness gating & lifecycle

Morph MUST reuse the existing readiness model:
- The destination slide MUST be fully rendered and asset-ready before starting Morph.

Alignment to current transition system:
- Morph MUST rely on the shared readiness utility (`waitForSlideAssetsReady`) and MUST NOT introduce per-transition readiness code.
- If readiness is delayed, the system MUST NOT show loading UI on the audience surface (presenter-only loading indicators are allowed).

Timeout behavior:
- Navigation blocking MUST be bounded by the renderer-level bounded wait (default **2000ms**).
- If readiness does not complete within the bounded wait budget, navigation MUST proceed with a safe fallback (`none`) and MUST still avoid a blank stage.
- On bounded-wait timeout, the incoming slide MUST be marked with `slide-view--readiness-fallback`.
- Telemetry MUST record a fallback event with reason `readiness-timeout`.

## 12) Animated fill state continuity (Video + Code)

This section captures a special-case requirement:
- **Video** and **Code** fills are stateful/animated at runtime.
- When the destination would otherwise restart a stateful fill that is effectively “the same”, Morph MUST preserve the runtime state across the transition.

Applies to:
- Slide background fills (Section 10.3), and
- Matched element fills (when/if element-level continuity is implemented).

This is distinct from presentation-mode caching:
- Prefetch/readiness can warm assets (e.g., decode images, preload video first frame), but it **does not** preserve runtime instances (e.g., an `HTMLVideoElement` playback position or a `CodeRunner` timebase).
- Therefore, state continuity MUST be implemented by Morph’s orchestration (instance reuse or explicit state transfer).

### 12.1 When continuity applies (normative)

#### Slide background continuity

Continuity applies when all of the following are true:
- The transition type is `morph`.
- The effective background fill on the source slide and destination slide is a stateful type (`code` or `video`).
- The background fill identity matches (Section 12.2).

If identity does not match:
- Morph MUST cross-fade the two backgrounds.
- Morph MUST NOT stop or pause either background at transition start; both are allowed to continue running during the cross-fade window.
- After the transition completes, only the destination slide remains active; the source slide background may then be stopped/removed as part of unmount.

#### Matched element fill continuity

Continuity applies only when all of the following are true:
- The source element and destination element are a Morph **match** (Section 5).
- The relevant fill positions are structurally compatible (Section 6.3): same fill stack length and compatible fill types index-by-index.
- The matching fill on both sides is a **video** or **code** fill, and its identity matches (Section 12.2).

If any of the above is not true, Morph MUST fall back to the standard media behavior (cross-fade snapshots).

Continuity priority:
- Continuity MUST NOT violate the core invariant (no blank stage).
- If continuity cannot be applied safely within readiness/transition budgets, Morph MUST fall back per-fill to cross-fade while still morphing base geometry.

### 12.2 Fill identity (normative)

#### Video fill identity

A video fill is considered “the same” if:
- `fill.type === 'video'` on both sides, and
- one of the following identities matches:
  - `fill.assetId` is present on both sides and exactly equal, OR
  - (if `assetId` is missing) the effective `fill.value` (URL/string) matches exactly.

Video fill settings reconciliation (normative):
- Identity matching is based on `assetId` only.
- If identity matches, Morph MUST preserve runtime playback state (position + play/pause).
- Non-identity settings (e.g., `muted`, `loop`, `playbackRate`, `volume`) MUST resolve to the destination fill’s values by $t=1$.
- Applying destination settings MUST NOT reset playback position.

If the identity is the same, Morph MUST attempt to preserve at least:
- playback position (`currentTime`)
- playing/paused state

If identity differs, Morph MUST treat it as different media and cross-fade.

#### Code fill identity

A code fill is considered “the same” if:
- `fill.type === 'code'` on both sides (or the legacy single-fill `style.fillType === 'code'` on both sides), and
- the effective code string is equal after the V1 normalization below.

Code normalization (V1):
- Replace Windows newlines (`\r\n`) with `\n`.
- Trim leading/trailing whitespace of the full string.

If identity is the same, Morph MUST preserve the code animation timebase such that the destination continues the animation without restarting.

Implementation alignment note:
- Code fill updates commonly restart execution/timebase when the code string is set. Morph continuity therefore requires comparing the *normalized* effective code strings before triggering any restart-like update.

### 12.3 Expected runtime behavior (normative)

When continuity applies:
- Morph MUST NOT restart the underlying animated fill loop.
  - For video: do not destroy/recreate the playing element in a way that resets playback.
  - For code: do not call APIs that restart execution/timebase (e.g., “stop then play” semantics).

Resource lifecycle requirements (normative):
- After Morph completes, there MUST be exactly one active runtime instance per visible destination fill (no double-running videos/CodeRunners).
- Any preserved/reused instance MUST be detached/stopped when its destination element is removed from the DOM.

Allowed implementation strategies (non-normative guidance):

V1 implementation strategy (normative):
- Continuity MAY be implemented via **instance reuse** (e.g., DOM reparenting) OR **state transfer**.
  - Video: preserve playback position + play/pause state best-effort (autoplay policies apply).
  - Code: preserve the animation timebase (no restart) and handle resize/bounds updates.

Note:
- Instance reuse is acceptable in V1 as long as it remains deterministic and does not violate cleanup guarantees.

Note:
- Prefetching video to first frame is still valuable for avoiding black/blank frames, but it does not satisfy continuity by itself.

### 12.4 Browser/platform constraints (normative)

- Autoplay policies may prevent programmatic playback from continuing.
- If a preserved/transferred video cannot continue playing due to browser policy, Morph MUST preserve best-effort playback position and fall back to a paused state rather than resetting to 0.
- Errors from blocked playback MUST be handled deterministically and must not break the transition.

## 13) Fallbacks, errors, telemetry

### 13.1 Fallback policy

- If Morph cannot run (unsupported environment), fall back to `none`.
- If interpolation is unsupported for a matched pair, fall back to per-element cross-fade (not full-slide).

### 13.2 Telemetry (privacy-safe)

Emit the same privacy-safe transition telemetry as other transitions:
- `transition_started` (type `morph`)
- `transition_completed`
- `transition_fallback_to_none`
- `transition_unsupported`
- `transition_blocked_for_readiness` (duration bucket)
- `transition_ready_latency` (time from nav request to readiness)
- `transition_animation_duration` (requested vs actual)

Payload constraints:
- Telemetry MUST NOT include slide content, speaker notes, URLs, or asset identifiers.

State continuity telemetry constraints:
- Continuity-related telemetry MUST NOT include `assetId` or code content.
- If instrumented, only emit coarse booleans/counters (e.g., “video_continuity_applied”).

## 14) Performance constraints

- Morph SHOULD prioritize GPU-friendly animation (transform/opacity).
- Morph MUST avoid per-frame heavy DOM queries; any measurement SHOULD be bounded and cached.
- Morph SHOULD cap the number of simultaneously animated elements (e.g., degrade to cross-fade for long-tail elements) to protect frame rate.

Continuity performance constraints:
- Morph MUST NOT decode the same video twice simultaneously when continuity applies.
- Morph MUST NOT run two CodeRunner loops for the “same” fill at once.

## 15) Accessibility & reduced motion

- Reduced motion MUST force `none`.
- Morph MUST NOT create focus traps or leave tabbable remnants from source slide after completion.

## 16) Testing & verification

### 16.1 Unit tests (required)

Unit tests MUST cover:
- Matching determinism (stable IDs, explicit links, heuristic tie-breaks)
- Property interpolation math (rotation shortest-arc, opacity endpoints)
- Fallback decisions (unsupported types, ambiguous match)

Test framework requirement:
- Unit tests MUST use Vitest (not Jest).

### 16.2 Playwright E2E (required)

Playwright MUST enforce:
- No blank stage frames during Morph.
- Both slides present in DOM during transition.
- Correct cleanup: destination becomes the only active slide.

Continuity assertions (when applicable):
- For same-identity video fills, playback position MUST not reset to 0 at transition start.
- For same-identity code fills, the animation timebase MUST not restart at transition start.
- After transition completion, there MUST NOT be duplicated running instances.

### 16.3 Fixture decks

A deterministic fixture deck MUST include:
- Simple shape morph (rect moves + resizes)
- Text box move + font change (cross-fade text content)
- Image same-asset vs different-asset cases
- Video same-asset continuity case (assert playback continuity)
- Code same-code continuity case (assert timebase continuity)
- Unmatched enter/exit
- A heavy slide to validate element-cap fallback

### 16.4 Gaps, risks & mitigations (required)

Gaps/risks relative to current implementation:
- Presentation readiness/prefetch is asset-level and does not preserve runtime instances.
- Video continuity is sensitive to autoplay policies, reparenting semantics, and seek artifacts.
- Code continuity is sensitive to string normalization differences and resize/re-init behaviors.
- Incorrect lifecycle handling can cause leaked/duplicated media instances and performance regressions.

Mitigation plan (normative):
- Ship continuity only for narrow, deterministic cases (Section 12.1) and fall back per-fill when unsafe.
- Prefer “no blank stage” over continuity; never block navigation solely to preserve state.
- Require E2E coverage to lock in both “no blank stage” and “no duplicated instances” invariants.

Dependencies (required):
- Continuity depends on renderer-level support for instance reuse or state transfer of video/code runtime instances.
- Continuity depends on fill-layer lifecycle correctness (create/update/destroy) so there are no leaked canvases, RAF loops, or media decoders.
