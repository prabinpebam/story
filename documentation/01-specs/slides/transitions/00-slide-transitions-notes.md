# Slide Transitions — Notes (Non‑Normative)

This file is **notes / exploration**.

For Phase 1 implementation-ready specs (excluding Morph), start here:
- [README.md](README.md)
- [01-phase-1-slide-transitions-spec.md](01-phase-1-slide-transitions-spec.md)
- [02-transition-inheritance-and-property-inspector-ux.md](02-transition-inheritance-and-property-inspector-ux.md)
- [03-performance-readiness-and-caching.md](03-performance-readiness-and-caching.md)
- [04-testing-and-verification.md](04-testing-and-verification.md)
- [05-ledger-and-gate-plan.md](05-ledger-and-gate-plan.md)

## 0) Scope

Phase 1 ships **only**:

- Cross fade
- Wipe (directional)
- Push (directional)
- Cover (directional)
- Uncover (directional)

Phase 2 (separate) covers:

- Morph

Directional variants supported by Wipe/Push/Cover/Uncover:

- Left → Right
- Right → Left
- Top-left → Bottom-right
- Top-right → Bottom-left
- Bottom-left → Top-right

## 1) Shared behavior (all transitions)

### 1.1 Inputs

- From slide: current slide visual output.
- To slide: next slide visual output.

### 1.2 Timing

- Each transition has a duration in milliseconds.
- Duration MUST be clamped to a safe range (draft: `100ms..2500ms`).
- Transitions MUST respect reduced-motion preference:
    - If `prefers-reduced-motion: reduce`, playback MUST use an instant cut (or a very short fade if the product design requires it; default to instant cut).

### 1.3 Rendering model (baseline draft)

To avoid per-element jitter and to keep implementations consistent:

- Prefer composing transitions at the **slide surface level** (two rasterized slide surfaces) for Cross fade / Wipe / Push / Cover / Uncover.
- Morph is the only transition that operates at the **object level**.

Draft: the presentation renderer should be able to produce a stable “slide surface snapshot” for a given slide state:

- Snapshot output: a bitmap or offscreen canvas representing the slide’s final visual.
- During transition, animate the two surfaces using transforms/masks.

### 1.4 Audio and media (draft)

- Transitions MUST NOT disrupt audio/video playback rules.
- If the product currently treats each slide as a discrete “scene”, then:
    - Audio/video should start/stop based on slide activation rules, not on the transition effect.
    - Transition should only affect visuals.

### 1.5 Failure / fallback rules

- If a transition cannot be rendered due to resource constraints, browser limitations, or missing data, it MUST fall back to Cross fade or instant cut.
- If the transition engine detects a missed deadline (frame budget), it SHOULD shorten the remaining animation (finish early) rather than stutter.

### 1.6 Determinism

- Given the same deck state and inputs, transition visuals should be deterministic.
- No random jitter/noise.

### 1.7 Minimal test checklist (all transitions)

- Starts from correct “from” surface.
- Ends at correct “to” surface.
- Ends in an exact final state (no lingering transform/mask).
- Obeys duration.
- Obeys reduced-motion preference.

## 2) Cross fade

### 2.1 What it looks like

The current slide fades out while the next slide fades in.

### 2.2 Parameters (draft)

- Duration
- Easing curve (draft default: `easeInOutCubic`)

### 2.3 Implementation approach (draft)

- Render two slide surfaces: `fromSurface`, `toSurface`.
- Animate opacity:
    - `fromOpacity`: `1 → 0`
    - `toOpacity`: `0 → 1`

### 2.4 Edge cases

- Very short duration: should still be a single-frame or two-frame blend.
- Transparent slide backgrounds: define whether slide background is composited before fade (recommended) so the visual is stable.

### 2.5 Test checklist

- Opacity endpoints are exact (0/1).
- No unexpected gamma/alpha artifacts (at least a visual spot-check).

## 3) Wipe (directional)

### 3.1 What it looks like

The next slide is revealed by a moving edge (like a curtain), replacing the current slide.

### 3.2 Direction semantics

Direction describes where the reveal edge moves:

- Left → Right: reveal starts on the left, expands to the right.
- Right → Left: reveal starts on the right, expands to the left.
- Diagonals: reveal edge advances along the diagonal indicated.

### 3.3 Parameters (draft)

- Direction
- Duration
- Easing
- Edge softness (draft: none, hard edge; keep simple initially)

### 3.4 Implementation approach (draft)

- Render `fromSurface` below.
- Render `toSurface` above, clipped by a mask that grows over time.
- For diagonals, define the mask using a half-plane that moves across the viewport.

### 3.5 Edge cases

- Aspect ratio mismatches: mask operates in viewport coordinates after slide-fit scaling.
- If slide is letterboxed, decide whether wipe includes letterbox area (recommended: yes, entire stage).

### 3.6 Test checklist

- At `t=0`, `toSurface` visible area is 0.
- At `t=end`, `toSurface` visible area is 100%.
- Direction is correct for each variant.

## 4) Push (directional)

### 4.1 What it looks like

The next slide pushes the current slide offscreen; both move.

### 4.2 Direction semantics

Direction indicates the direction the incoming slide moves:

- Left → Right: incoming slide moves from left to right (so it starts offscreen left, ends centered).
- Right → Left: incoming slide moves from right to left.
- Diagonals follow the indicated vector.

### 4.3 Parameters (draft)

- Direction
- Duration
- Easing

### 4.4 Implementation approach (draft)

- Render both surfaces on the stage.
- Compute a translation vector `v` for the direction:
    - At `t=0`: `fromSurface` at `(0,0)`, `toSurface` at `(-v)` (offscreen opposite).
    - At `t=end`: `fromSurface` at `(v)` (offscreen), `toSurface` at `(0,0)`.

### 4.5 Edge cases

- If the stage is letterboxed, translations should be applied in stage coordinates (so both slides move as a full-frame).

### 4.6 Test checklist

- At `t=0`, `toSurface` is fully offstage.
- At `t=end`, `fromSurface` is fully offstage.
- No scaling occurs (only translation).

## 5) Cover (directional)

### 5.1 What it looks like

The next slide slides in and covers the current slide (current does not move).

### 5.2 Direction semantics

Direction indicates the direction the covering slide moves.

### 5.3 Parameters (draft)

- Direction
- Duration
- Easing

### 5.4 Implementation approach (draft)

- Render `fromSurface` fixed.
- Render `toSurface` above it, translating from offstage to center.
- No clipping required (unless needed for performance).

### 5.5 Edge cases

- Ensure no “gap” appears between surfaces during movement due to subpixel rounding.

### 5.6 Test checklist

- `fromSurface` remains stable throughout.
- `toSurface` ends exactly aligned.

## 6) Uncover (directional)

### 6.1 What it looks like

The current slide moves away, revealing the next slide underneath (next does not move).

### 6.2 Direction semantics

Direction indicates the direction the current slide moves as it uncovers.

### 6.3 Parameters (draft)

- Direction
- Duration
- Easing

### 6.4 Implementation approach (draft)

- Render `toSurface` fixed below.
- Render `fromSurface` above, translating offstage in the given direction.

### 6.5 Edge cases

- As with Cover: avoid subpixel seams.

### 6.6 Test checklist

- `toSurface` remains stable throughout.
- `fromSurface` is fully offstage at end.

## 7) Morph

Morph is the only transition that morphs **objects** from one slide to the next.

### 7.1 What it looks like

- Matching objects animate between their “from” and “to” states.
- Objects that exist only on the next slide fade/scale in.
- Objects that exist only on the current slide fade/scale out.

### 7.2 Core requirements (draft)

- MUST support morphing for:
    - Shapes
    - Text
    - Fills and strokes (including gradients)
    - Images
    - Videos
- MUST define how “matching” works between slides.
- MUST be deterministic.
- MUST have a safe fallback when matching cannot be established.

### 7.3 Object matching strategy (draft)

Initial draft matching priority (highest to lowest):

1. **Stable element ID** persisted in the document model across slides.
2. Explicit “morph link” metadata (authoring UI could set this later; not required for v1).
3. Heuristic match (only if needed):
     - Same element type + same role
     - Similar bounds (position/size)
     - Similar text content (for text)
     - Similar image asset identity (for images/videos)

If multiple candidates match, choose the one with the highest score; otherwise do not morph.

### 7.4 Interpolation rules (draft)

#### 7.4.1 Shared geometry

- Position: interpolate x/y.
- Size: interpolate width/height.
- Rotation: interpolate shortest-arc angle.
- Opacity: interpolate.

#### 7.4.2 Shapes

- If shapes are of the same primitive type (rect→rect, ellipse→ellipse), interpolate parameters.
- If shapes differ, fall back to cross-fade between the two objects (within Morph) rather than attempting complex path morphing.

#### 7.4.3 Text

- Draft: treat text as a box that moves/resizes; keep glyph-level morphing out of scope for v1.
- If font family/size/weight differs:
    - Prefer cross-fade between rendered text surfaces while interpolating the box transform.

#### 7.4.4 Fills & strokes

- Solid fill: interpolate RGBA.
- Gradient: interpolate stops (if same number of stops) else cross-fade.
- Stroke: interpolate width/color; dash patterns cross-fade.

##### Code fill (draft handling)

“Code fill” is hard because it can be dynamic/animated.

Draft v1 rule:

- For code fill surfaces, do **not** attempt to interpolate internal parameters.
- Render the “from” code fill and “to” code fill as two snapshots and cross-fade between them, while still morphing the parent shape geometry.

This keeps Morph deterministic and avoids executing code during interpolation.

#### 7.4.5 Images

- If the same image asset is used on both slides:
    - Morph geometry (pos/size/rotation/crop if supported).
    - Keep the bitmap constant.
- If different assets:
    - Cross-fade image content while morphing geometry.

#### 7.4.6 Videos

- Draft v1: treat video like an image snapshot during transition.
    - Use the last rendered frame of “from” and the first available frame of “to”.
    - Cross-fade frames while morphing geometry.
- Playback start/stop remains governed by slide activation rules.

### 7.5 Appear/disappear rules (draft)

- Unmatched objects on the next slide: fade in (optionally slight scale-in).
- Unmatched objects on the current slide: fade out.

### 7.6 Implementation approach (draft)

Suggested v1 pipeline:

1. Build a match map between slide A elements and slide B elements.
2. For each matched pair, create an animation track.
3. Render the transition frame-by-frame:
     - Draw background.
     - Draw unmatched-to (with fade in).
     - Draw matched elements (interpolated transforms + content rules).
     - Draw unmatched-from (with fade out).

If any step fails, fall back to Cross fade.

### 7.7 Performance considerations (draft)

- Avoid per-frame re-layout of complex text or re-execution of code fills.
- Cache rasterized snapshots for text/code/video when needed.

### 7.8 Test checklist

- Stable match by element ID produces expected morph.
- Different assets cross-fade without tearing.
- Text with font change uses cross-fade rule.
- Code fill uses snapshot cross-fade (no live interpolation).
- Fallback triggers safely when required.
