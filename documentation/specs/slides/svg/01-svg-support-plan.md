# SVG Support Plan — Story Slides

**Status:** Planned
**Last updated:** Dec 13, 2025

This plan describes what needs to be built to support adding SVG objects to Story slides.

## 1) Goals

- Let users add SVG graphics onto the canvas as first-class slide objects.
- Preserve vector fidelity when possible (crisp at any zoom, export-friendly).
- Support “as much SVG as possible” while maintaining security and predictable rendering.
- Keep the first version simple: SVG behaves as a *single object* (no internal path editing).

Interpretation of “support as much as possible”:

- We aim to **accept** most SVG inputs users commonly encounter (icons, logos, simple illustrations).
- We only **guarantee** correctness for a defined baseline subset.
- Outside the baseline subset, we use **best-effort** rendering with safe degradation (strip/ignore) or raster fallback.

## 2) Non-goals (initial release)

- Editing SVG internals (selecting paths/groups, editing nodes, boolean ops).
- Running scripts or interactive SVG.
- Full SVG animation authoring (SMIL/CSS/JS timelines).
- Full CSS layout engine inside SVG (e.g., complex external stylesheets).

## 3) Primary UX flows

### 3.1 Add SVG to canvas

Supported insert routes (initial):

1) **Insert menu / toolbar action**: “Insert → SVG…”
   - Opens file picker (`.svg`).
   - Imports as a single object.

2) **Paste from clipboard**
   - If clipboard contains SVG markup (`image/svg+xml` or text that starts with `<svg`), import as SVG.
   - If clipboard contains a raster preview only, import as image (existing behavior).

3) **Drag & drop**
   - Dropping an `.svg` file into the canvas imports as SVG.

### 3.2 What the user can do with an SVG object

- Move, resize, rotate.
- Scale proportionally (default behavior; can be toggled if we support unlock).
- Change stacking order, duplicate, delete.
- Replace the SVG source (swap file) while keeping transforms.
- Export should preserve vector where feasible.

“Replace” semantics:

- Keep object transform (x/y/width/height/rotation).
- Recompute intrinsic metadata (viewBox/size).
- Keep fit mode setting.

### 3.3 What the user cannot do (initial)

- Select internal parts of the SVG.
- Directly edit path fills/strokes per sub-shape.
- Edit embedded text as Story text objects.

## 4) UI model

### 4.1 Canvas interaction

- SVG is treated like other elements: bounding box, handles, rotation.
- Hit testing uses object bounds (not per-path).
- Selection outline uses the object’s bounding box.

### 4.2 Layer Tree

- Appears as a single layer item: “SVG” (or uses filename/title if present).
- Treated as a single object for lock/hide/arrange operations.
- **Story groups / nesting:** the SVG object behaves like any other leaf element in the Story hierarchy.
  - It can be placed inside a Story group (as a child) and re-ordered within that group.
  - It cannot contain Story children itself (MVP).
  - Reordering respects the existing “front-to-back” ordering semantics used by the Layer Tree.
- **Internal SVG layers/groups:** SVG-internal nesting (e.g. `<g>` groups) is preserved in the sanitized SVG markup for rendering fidelity, but is **not** exposed as expandable children in the Layer Tree (MVP).
  - Users cannot expand/select SVG internal layers in the Layer Tree.
  - Users cannot drag-drop elements “into” internal SVG groups.
  - Future (optional): an “Explode SVG” / “Convert to shapes” feature could materialize internal structure into Story elements, but is explicitly out of scope for initial SVG support.

### 4.3 Property Inspector (PI)

SVG object PI sections (high-level):

- **Transform**: position, size, rotation (existing shared sections).
- **SVG** (new):
  - Source summary: filename (if available), intrinsic size, viewBox.
  - Actions:
    - Replace…
    - Copy SVG to clipboard (optional)
    - Reset viewBox mapping (optional)
  - Rendering:
    - Fit mode: Contain / Cover / Stretch (see detailed PI spec)
    - Preserve aspect ratio toggle (maps to fit mode behavior)
  - Color controls (limited):
    - If SVG qualifies as “single-color icon”, allow a single Tint control.
    - Otherwise show “Not editable (complex SVG)” indicator.

(Details in [03-property-inspector-svg.md](03-property-inspector-svg.md).)

## 5) Supported SVG standard/version

We should support **as much as possible**, but define a clear baseline.

- **Baseline:** SVG 1.1 (Second Edition) *static* features, rendered by the browser’s SVG engine.
- **Best-effort:** SVG 2 features that modern browsers support (no guarantees; see compat doc).
- **Explicitly disallowed:** scripting, external resource loading, and unsafe elements.

Details in [02-supported-svg-and-compat.md](02-supported-svg-and-compat.md).

## 6) Technical architecture (high level)

### 6.1 Element type

Introduce a new element kind (conceptually):

- `type: 'svg'`
- Stores sanitized SVG markup plus metadata needed for layout/render.

### 6.2 Rendering strategy

Preferred strategy:

- Render SVG using **native inline SVG** in the DOM layer (browser handles parsing + painting).

Fit mode mapping is defined in the PI spec:

- Contain → `preserveAspectRatio="xMidYMid meet"`
- Cover → `preserveAspectRatio="xMidYMid slice"`
- Stretch → `preserveAspectRatio="none"`

Fallback strategy:

- If SVG cannot be safely inlined (or hits unsupported constraints), rasterize to an image for display/export while preserving the original SVG source in the model.

### 6.3 Sanitization gate

All imported SVG must be sanitized before storing or rendering.

- Strip scripts, event handlers (`on*` attributes), external references.
- Block risky elements (e.g. `foreignObject`).
- Enforce size limits and complexity limits (path count / node count) to protect performance.

Details in [05-security-sanitization.md](05-security-sanitization.md).

### 6.4 Export

- For Story native export: keep SVG markup embedded in the document.
- For PDF: prefer vector embedding if the pipeline supports it; otherwise render at high DPI.
- For PNG: rasterize at export resolution.

### 6.5 Principles alignment (must)

- **Design system:** PI and any UI for SVG uses existing components and global CSS variables.
- **Undo/redo:** insert/replace/fit-mode/paint overrides are store actions, compatible with existing history.
- **Serialization:** SVG must round-trip through `.str` save/load without loss.
  - Prefer asset-based storage for SVG sources (dedupe, performance).
  - See: [06-serialization-and-str-format.md](06-serialization-and-str-format.md)
- **Collaboration:** storage choices must avoid large repeated payloads; asset hashing and references enable efficient sync.
- **Security:** persist sanitized SVG only; block scripts/external references.
- **Performance:** enforce size/complexity limits; fall back safely.

## 6.6 Risks & mitigations (short)

| Risk | What can go wrong | Mitigation (MVP) |
|---|---|---|
| Performance (render + edit) | Large/complex SVGs cause slow parse/layout/paint, sluggish selection/drag, thumbnail stalls | Enforce size + complexity limits; cache sanitized markup; deterministic raster fallback; avoid per-frame re-parse; cap filters/nodes/paths (see data-model doc limits) |
| Asset dedupe correctness | SVG assets get duplicated across slides/files; hashing bugs cause wrong asset reuse; uncontrolled asset growth | Content-hash sanitized SVG bytes; store once under `assets/vectors/<sha>.svg`; reference from element; validate hash on load; keep element-level metadata separate from asset |
| Collaboration payload growth | Shipping raw SVG strings in ops bloats network/DB; repeated updates create large diffs | Use asset references in ops (hash + metadata); upload asset once then reference; chunk/stream asset transfer; avoid embedding SVG markup in per-slide JSON deltas |

## 7) Phased delivery plan

### Phase 1 — MVP (safe + useful)

- Insert SVG via file/paste/drop.
- Store sanitized SVG + metadata.
- Render inline SVG on canvas.
- Transform + arrange like other objects.
- Basic PI: Replace + fit mode + (optional) tint for single-color icons.
- Thumbnail support.
- A small test corpus of SVG fixtures is added and exercised by Playwright.

### Phase 2 — Better fidelity + theming hooks

- More robust “tint/multi-tint” detection (limited palette mapping).
- Better handling of fonts/text in SVG (fallback rules).
- Improved caching and perf controls.

### Phase 3 — Advanced (optional)

- Convert SVG shapes into native Story vector shapes (if we ever add a vector shape model).
- Rich per-element controls.

## 8) Acceptance criteria

- User can insert a common SVG (icons and illustrations) and see it rendered correctly on canvas.
- SVG persists through save/load.
- SVG thumbnails update and render.
- No scripts execute; no network fetches occur from imported SVG.
- Worst-case SVGs fail safely (import warning + raster fallback or rejection).

## 9) Test plan (minimum)

- Add Playwright coverage for:
  - Insert via file picker (happy path)
  - Paste SVG markup (happy path)
  - Sanitization: scripts removed, external URLs blocked
  - Raster fallback path (a purposely “too complex” SVG)
  - Fit modes: contain/cover/stretch visually stable
- Maintain an SVG corpus under tests/fixtures (icons, text, gradients, clips, filters, huge paths).
