# Volume 08: Figma-Class Design Authoring

> **Specification ID:** `STORY-SPEC-08`  
> **Volume:** 08 (16 volumes total, 00-15)  
> **Status:** Normative draft  
> **Version:** 2.0.0-draft  
> **Owner:** Product and Engineering  
> **Approvers:** Product, Design, Engineering, Quality, Accessibility, Security  
> **Last reviewed:** July 10, 2026  
> **Normative responsibility:** Canvas authoring, selection, transforms, vector and text editing, responsive layout, reusable design systems, paint, layers, and design clipboard interoperability
> **Explicit non-ownership:** Workspace-view taxonomy, canonical document schemas, mutation algorithms, scene rendering, presentation structure and delivery, output profiles, and implementation status
> **Parent specification:** [Story Product Specification System](README.md)  
> **Governed by:** [Volume 00 - Governance and Traceability](00-governance-and-traceability.md)  
> **Supersedes:** Conflicting design-authoring behavior in active canvas, shape, text, typography, and property specifications where this volume is more precise

## 1. Purpose

This volume defines the complete user-visible contract for professional visual design authoring in Story. It turns parent capabilities `DES-001` through `DES-073` into atomic, independently testable requirements while preserving Story's presentation-native document model.

The target is familiarity, not imitation. A designer experienced with modern collaborative vector tools should recognize the interaction grammar without Story copying another product's chrome, panel layout, visual identity, proprietary metadata, or undocumented behavior.

This volume answers:

1. What users can create and manipulate on the canvas.
2. How selection depth, direct manipulation, and editing modes behave.
3. How responsive layout, components, variables, styles, and libraries compose.
4. How design semantics survive history, collaboration, files, playback, and output.
5. How clipboard and SVG content enter and leave Story without silent loss.

## 2. Scope and Authority

### 2.1 In scope

- Canvas, pasteboard, pan, zoom, fit, rulers, guides, grids, and viewport persistence.
- Click, marquee, keyboard, layer-tree, cyclic, and deep selection.
- Move, resize, scale, rotate, skew where supported, flip, align, distribute, and snapping.
- Parametric shapes, freeform vectors, pen authoring, path operations, booleans, and masks.
- Point, auto-width, auto-height, fixed-size, and supported path/shape text.
- Rich typography, inline ranges, paragraphs, lists, columns, language, direction, OpenType, variable fonts, and font recovery.
- Auto Layout, wrapping, absolute children, sizing policies, constraints, and responsive nesting.
- Components, instances, component sets, variants, properties, nested overrides, swaps, reset, detach, and interactive state previews.
- Typed variables, collections, modes, aliases, reusable styles, publishing, updates, and libraries.
- Ordered fills, strokes, effects, media treatment, mixed-value editing, and asset replacement.
- Layer hierarchy, ordering, search, range selection, visibility, locking, isolation, and accessible tree behavior.
- Internal clipboard, system clipboard, SVG, and supported Figma-originated SVG/HTML clipboard content.

### 2.2 Normative dependencies

This volume relies on, but does not redefine, the following owners:

| Concern | Normative owner |
|---|---|
| Entity schemas, stable identity, inheritance, and override storage | Volume 03, Canonical Document Model |
| Transactions, preview/commit, undo, redo, and collaboration-safe operations | Volume 04, Mutation, History, and Determinism |
| Resolved geometry, text, paint, media, and surface adapters | Volume 05, Resolution, Scene, and Rendering |
| Native files, assets, autosave, and recovery | Volume 06, Files, Assets, and Recovery |
| Concurrent editing, permissions, libraries, and publishing authority | Volume 07, Collaboration, Identity, and Sharing |
| Keyboard, assistive technology, language, bidi, and forced-color depth | Volume 12, Accessibility and Internationalization |
| Import sanitization, external content, code fill, and library trust | Volume 13, Security, Privacy, and Trust |
| Latency, capacity, frame pacing, and fidelity tolerances | Volume 14, Quality Attributes and Observability |
| Fixtures, headed workflows, artifact inspection, and release evidence | Volume 15, Acceptance and Release Conformance |

### 2.3 Adopted domain specifications

The following domain specifications remain active detail where they do not conflict with this volume:

- [Canvas interaction](../../specs/canvas/canvas-interaction.md)
- [Shapes and vector system](../../specs/shapes/00-index.md)
- [Text editing](../../specs/text-editing/README.md)
- [Typography system](../../specs/typography-system/00-index.md)
- [Layer management](../../specs/canvas/layer-management.md)
- [Property Inspector mixed-state behavior](../../specs/ui-system/property-inspector-v2/17-multi-selection-and-mixed-state.md)
- [Figma clipboard import](../../specs/shapes/19a-figma-clipboard-import.md)
- [Column and guide system](../../specs/column-system/slide-layout-system-spec.md)

If a domain document describes current implementation rather than target behavior, this volume governs the target. Current status remains in the [Capability Audit](../capability-audit.md).

### 2.4 Supersession

This volume supersedes the design-authoring behavioral clauses in Sections 5 and 9 of [Story Product Specification](../product-spec.md) only by making them more precise. It does not narrow their scope. It also supersedes any domain-spec statement that:

- treats axis-aligned bounds as sufficient hit testing;
- treats snapshots as the required future history model;
- allows mixed-value controls to display only the first selected value without disclosure;
- treats flattened screenshots or raster output as editable parity;
- conflates presentation columns, slide layouts, groups, or UI components with Auto Layout or canvas components.

## 3. Product Decisions and Bounded Parity

### 3.1 Explicit implementer decisions

1. **One canvas model.** Slides, masters, layouts, component definitions, and isolated groups use one coordinate, selection, transform, paint, and input grammar. The active editing root changes; the interaction system does not fork.
2. **Screen-space interaction tolerance.** Handles, paths, and snap capture use CSS-pixel tolerances converted through zoom. Document geometry never changes merely because zoom changes.
3. **Preview then commit.** Continuous input updates a transient preview and commits one transaction at gesture end. Cancel restores the exact pre-gesture state.
4. **Geometry-aware targeting.** Visible fill, stroke, path, mask, clipping, opacity threshold, and stacking order determine pointer targets. Bounds are only a broad-phase accelerator.
5. **Non-destructive reuse.** Booleans, masks, components, instances, styles, variables, and media crops remain source-linked until the user explicitly flattens, detaches, outlines, or rasterizes.
6. **Override preservation.** Definition and library updates retain overrides by stable semantic identity; deletion or incompatible type changes become reviewable conflicts rather than silent resets.
7. **Object layout and slide layout are distinct.** Auto Layout arranges scene-node children. Masters, layouts, placeholders, columns, and guides provide presentation structure and may contain Auto Layout, but do not emulate it.
8. **Editability-first interoperability.** Import degrades from native semantic objects to editable vectors before considering raster fallback. Every fallback is reported.
9. **No hidden mutation from inspection.** Entering deep edit, isolation, library preview, mode preview, or outline view changes runtime state only until the user performs an authored edit.
10. **One resolved meaning.** Editor, thumbnail, audience, presenter, export, print, recording, and interchange adapters consume the same authored semantics; surface-only degradation is declared.

### 3.2 Parity boundary

Story targets behavioral familiarity for common professional design tasks. The parity claim is bounded as follows:

| Included | Bounded or deferred | Explicitly excluded |
|---|---|---|
| Common canvas navigation, direct manipulation, vector paths, rich text, Auto Layout, components, variants, variables, styles, layers, and editable SVG clipboard | Vector networks with arbitrary branching may initially import and render as canonical compound paths; unsupported blend/effect combinations may use declared fallbacks; library governance may vary by provider | Pixel-for-pixel cloning of Figma chrome; Figma private APIs or metadata; proprietary plugin compatibility; arbitrary browser SVG fidelity; CAD/NURBS; full desktop-publishing imposition; undocumented competitor quirks |

A bounded feature remains visible in compatibility and capability reporting. It cannot be labeled supported merely because Story can display a flattened image of it.

## 4. Shared Authoring Model

### 4.1 Editing roots

An **editing root** is the hierarchy boundary within which selection, insertion, ordering, and transforms operate. The root is one of:

- active slide local content;
- active slide master;
- active layout;
- component definition or component set;
- isolated group, boolean, mask, or instance subtree when explicitly entered.

Inherited or referenced content outside the root remains visible according to the current view, but direct mutation routes to its owning source or creates an explicit local override.

### 4.2 Interaction state machine

`SM-08-001` defines the mutually exclusive primary authoring state. Modal dialogs and temporary overlays are orthogonal substates that suspend canvas mutation.

| State | Entry | Pointer routing | Keyboard routing | Exit/commit |
|---|---|---|---|---|
| `idle` | No selection and Select tool active | Hit test or begin marquee | Tool shortcuts, select all, viewport commands | Select, arm tool, or open modal |
| `tool-armed` | Creation tool chosen | Click or drag creates preview | Escape returns to `idle`; tool modifiers apply | Commit one object or cancel |
| `creating` | Pointer threshold crossed | Update geometry preview | Shift/Alt/Space alter current gesture | Pointer up commits; Escape cancels |
| `object-selected` | One or more objects selected | Move, handle transform, deep-select, or marquee replace | Nudge, duplicate, arrange, enter edit | Deselect, edit, transform, or tool switch |
| `transforming` | Move/resize/rotate/scale gesture starts | Pointer owns preview until release/cancel | Modifiers alter constraint; Escape cancels | Pointer up commits one transaction |
| `text-edit` | Text edit entered | Browser/native text selection inside editor | Text, IME, caret, range formatting | Explicit commit/cancel or focus transition |
| `vector-edit` | Vector-capable object entered | Point, segment, and handle targeting | Point navigation and path commands | Done/Escape returns one depth |
| `boolean-edit` | Boolean operands entered | Operand selection and transforms | Operand commands | Done/Escape returns one depth |
| `mask-edit` | Mask shape/content entered | Active mask submode owns targets | Mask commands | Done/Escape returns one depth |
| `instance-deep-edit` | Nested instance edit entered | Exposed or overrideable descendants targetable | Traversal constrained by instance policy | Done/Escape returns one depth |
| `isolation` | Group/component isolation requested | Only isolated subtree targetable | Selection and traversal stay in subtree | Exit isolation preserves authored edits |
| `modal-suspended` | Blocking dialog opens | Canvas receives no mutation input | Dialog focus scope owns keys | Close returns to prior valid state |

Invalid transitions are no-ops with an accessible explanation when the user initiated them. Destroying or remotely removing the active target exits to the nearest surviving ancestor and preserves any accepted operations.

### 4.3 Interaction state matrix

| Context | Click object | Double-click | `Ctrl/Cmd` + click | Drag empty space | `Enter` | `Escape` |
|---|---|---|---|---|---|---|
| Idle/object mode | Select top eligible target | Enter the target's default edit depth | Select deepest eligible target at point | Marquee | Enter default edit for single selection | Clear selection or leave current root |
| Group selected | Keep/select group | Enter group and target child | Select child without changing isolation | Replace/add marquee per modifier | Enter group isolation | Step out one depth |
| Instance selected | Select instance | Enter exposed descendant or instance deep edit | Select eligible nested layer | Marquee instances | Enter instance deep edit | Step out one depth |
| Vector edit | Select point/segment | Insert/select segment point | Cycle overlapping vector targets | Point marquee | Toggle selected segment/path action where defined | Clear point selection, then exit vector edit |
| Text edit | Place caret | Select word | Platform text behavior | Select text | Insert paragraph unless modified | Cancel active composition-safe edit session |
| Transforming/creating | No retarget | No retarget | Modifier only | Gesture continues | No action | Cancel preview and restore start state |
| Modal suspended | No canvas action | No canvas action | No canvas action | No canvas action | Modal default action | Close top modal |

### 4.4 Cross-surface applicability

| Semantic family | Editor | Thumbnail | Audience | Presenter | SVG/raster | PDF/print | Video/web | PPTX interchange |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Geometry and transforms | Author + render | Render | Render | Render | Render/map | Render/map | Render | Map/preserve/report |
| Rich text and typography | Author + render | Render | Render | Render notes only where applicable | Render/map | Render/map | Render | Map/preserve/report |
| Auto Layout and constraints | Author + resolve | Resolved render | Resolved render | Resolved render | Resolved output | Resolved output | Resolved output | Map where native; preserve source/report otherwise |
| Components, variables, and styles | Author + resolve | Resolved render | Resolved render | Resolved render | Resolved output | Resolved output | Resolved output | Resolve for appearance and preserve editable Story source when possible |
| Media | Author + preview | Poster/fallback | Playback | Status/control | Poster or declared raster fallback | Poster | Playback/render | Map/preserve/report |
| Layers, selection, guides, handles | Authoring only | None | None | None | None | Optional guides only when explicitly printed | None | Structural groups where supported |

### 4.5 Invariants

| ID | Invariant |
|---|---|
| `INV-08-001` | A user gesture has at most one committed history boundary, regardless of how many preview frames it produced. |
| `INV-08-002` | Canceling a preview restores authored state and selection to the gesture-start snapshot without emitting a document operation. |
| `INV-08-003` | Selection, hover, edit depth, viewport, open panels, and temporary measurements are runtime state, not document state. |
| `INV-08-004` | Every editable element, ordered style item, path point, segment, component property, variable, and override target has stable identity. |
| `INV-08-005` | Hidden nodes do not receive canvas pointer hits; locked nodes do not mutate from canvas input. |
| `INV-08-006` | Locked nodes remain discoverable and unlockable through an authorized structural surface. |
| `INV-08-007` | An inherited or instance-owned node is never silently converted to a local copy by a normal property edit. |
| `INV-08-008` | Mixed-value controls never imply a uniform value when applicable selected values differ. |
| `INV-08-009` | Absolute edits replace applicable values; relative edits preserve each target's gesture-start differences. |
| `INV-08-010` | Snapping affects the committed transform, not the underlying source geometry or unsnapped pointer coordinates. |
| `INV-08-011` | Derived geometry, layout results, component resolution, and render caches are disposable and are not serialized as authoring truth. |
| `INV-08-012` | Definition, style, variable, and library updates preserve valid overrides by stable semantic identity. |
| `INV-08-013` | Alias graphs, component graphs, hierarchy graphs, and mask/boolean references are acyclic after every accepted transaction. |
| `INV-08-014` | Import, paste, detach, flatten, outline, and rasterize are atomic and never leave dangling references. |
| `INV-08-015` | Unsupported imported semantics are preserved, substituted with disclosure, or rejected; they are never silently discarded. |
| `INV-08-016` | The same resolved authoring state produces semantically equivalent output on every applicable surface within declared tolerances. |
| `INV-08-017` | No pointer or keyboard command mutates the canvas while a blocking modal or incompatible text/IME composition owns input. |
| `INV-08-018` | Empty, zero-area, singular-transform, missing-font, and missing-asset states remain selectable or recoverable through structural UI. |

## 5. Canvas and Viewport Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-08-001` | DES-001 | Story MUST provide pointer, middle-button, Space-drag, trackpad, and touch panning without changing authored coordinates. | Editor; runtime viewport state | `AC-08-001` |
| `REQ-08-002` | DES-001 | Story MUST zoom toward the active pointer or gesture centroid while keeping that document point visually stationary within rounding tolerance. | Editor; viewport gesture | `AC-08-002` |
| `REQ-08-003` | DES-001 | Story MUST provide fit slide, fit selection, zoom to 100 percent, zoom presets, and incremental zoom commands. | Editor; command invocation | `AC-08-003` |
| `REQ-08-004` | DES-001 | Story MUST constrain zoom and pan only by published safety bounds while retaining a usable pasteboard around every editing root. | Editor; continuous navigation | `AC-08-004` |
| `REQ-08-005` | DES-003 | Story MUST preserve geometry, text, selection overlays, and pointer mapping through zoom, pan, device-pixel-ratio, and window-resize changes. | Editor; viewport invalidation | `AC-08-005` |
| `REQ-08-006` | DES-002 | Story MUST route viewport shortcuts by focused context so canvas navigation never steals text, numeric-field, menu, or modal input. | Editor; keyboard dispatch | `AC-08-006` |
| `REQ-08-007` | DES-001 | Story MUST expose rulers, user guides, layout guides, and grid visibility as independent authoring controls with per-document or per-user persistence explicitly distinguished. | Editor; view configuration | `AC-08-007` |
| `REQ-08-008` | DES-003 | Story MUST render interaction overlays in screen-stable dimensions and keep them aligned with resolved scene geometry at every supported zoom. | Editor; render frame | `AC-08-008` |
| `REQ-08-009` | DES-001 | Story MUST restore a valid viewport after reopening, switching editing roots, deleting the viewed target, or receiving an invalid stored transform. | Editor; open/switch/recovery | `AC-08-009` |

### 5.1 Viewport edge and failure rules

- Wheel intent is classified once per gesture as pan or zoom using platform conventions and user settings; the classification does not oscillate mid-gesture.
- Pinch and browser page zoom are distinguished. Story consumes only gestures targeted at the authoring surface.
- A singular, non-finite, or corrupt viewport transform is replaced by fit-slide and logged; document coordinates remain untouched.
- Fit selection includes visual bounds for strokes and effects only when the fit command is configured for visual bounds; default fit uses geometric bounds plus stable viewport padding.
- When no selection exists, fit selection falls back to fit editing root and announces the fallback.
- Scrollbars, if exposed, describe the bounded navigation region and are not required to model an actually infinite coordinate plane.

## 6. Selection, Focus, and Deep Selection Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-08-010` | DES-010 | Story MUST select the topmost eligible visible target under a pointer using resolved paint, clipping, and stacking semantics. | Editor; pointer down | `AC-08-010` |
| `REQ-08-011` | DES-011 | Story MUST hit-test fills, strokes, open paths, text glyph regions, media bounds, masks, and clipped content with zoom-independent screen tolerances. | Editor; hover/select | `AC-08-011` |
| `REQ-08-012` | DES-010 | Story MUST support replace, additive, subtractive, toggle, and contiguous-range selection through documented pointer and keyboard modifiers. | Editor and layers; selection mutation | `AC-08-012` |
| `REQ-08-013` | DES-010 | Story MUST provide directional and containment marquee policies and visibly indicate which policy is active during the gesture. | Editor; marquee preview/commit | `AC-08-013` |
| `REQ-08-014` | DES-010 | Story MUST provide deterministic deep selection through groups, booleans, masks, components, instances, and overlapping siblings without requiring hierarchy flattening. | Editor; click/deep click | `AC-08-014` |
| `REQ-08-015` | DES-010 | Story MUST provide deterministic selection cycling at a point with a stable candidate order and reset conditions. | Editor; repeated command | `AC-08-015` |
| `REQ-08-016` | DES-010 | Story MUST synchronize selection identity and focus between canvas, layer tree, inspector, component-property surfaces, and accessibility traversal. | All authoring surfaces; selection change | `AC-08-016` |
| `REQ-08-017` | DES-010 | Story MUST distinguish selection, focused edit target, isolation root, text range, and vector sub-selection as separate runtime concepts. | Editor; all edit modes | `AC-08-017` |
| `REQ-08-018` | DES-010 | Story MUST allow keyboard traversal of eligible scene nodes in deterministic reading or layer order with an announced name, type, state, and depth. | Editor; keyboard/assistive technology | `AC-08-018` |
| `REQ-08-019` | DES-011 | Story MUST exclude hidden, clipped-out, fully transparent below-threshold, and pointer-ineligible nodes from direct canvas targeting while retaining structural access where authorized. | Editor and layers; hit-test | `AC-08-019` |
| `REQ-08-020` | DES-010 | Story MUST recover selection to the nearest surviving eligible ancestor or clear it when selected targets are deleted, hidden, moved across roots, or revoked remotely. | Editor; local/remote mutation | `AC-08-020` |

### 6.1 Selection priority

Within the current editing root, pointer candidates sort by:

1. Active edit-mode controls: vector point, handle, segment, crop handle, or layout insertion affordance.
2. Explicitly exposed descendants in the current deep-edit or isolation context.
3. Topmost painted scene node under the point.
4. Broad hit areas for open paths, thin strokes, and empty text boxes.
5. Stable layer order and stable identity as final tie-breakers.

Selection cycling enumerates the same candidate set from front to back, then ancestors from nearest to farthest. It resets when the pointer moves beyond the hit tolerance, the scene changes materially, the editing root changes, or the timeout defined by Volume 14 expires.

### 6.2 Deep-selection matrix

| Target | Normal click | Double-click/Enter | Deep-select modifier | Edit boundary |
|---|---|---|---|---|
| Group child | Select owning group | Enter group and select child | Select child directly | Group isolation or current root |
| Boolean operand | Select boolean result | Enter operand edit | Select operand if operand editing is allowed | Boolean node |
| Mask shape/content | Select mask composite | Enter configured mask submode | Select eligible mask member | Mask node |
| Component child | Select component definition or instance | Enter definition/instance edit | Select exposed override target | Component policy |
| Nested instance | Select outer instance | Enter next exposed depth | Select deepest permitted nested target | Nearest non-editable instance boundary |
| Text glyph | Select text element | Enter text edit at pointer | Select text element unless already editing | Text element |
| Vector path | Select vector element | Enter vector edit | Select vector element unless already editing | Vector element |

## 7. Transform, Alignment, and Snapping Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-08-021` | DES-012 | Story MUST move single and multiple selections by pointer, keyboard nudge, numeric input, and duplicate-drag using one transform contract. | Editor; preview/commit | `AC-08-021` |
| `REQ-08-022` | DES-012 | Story MUST resize from edges, corners, center, opposite anchor, or explicit transform origin with documented aspect and modifier behavior. | Editor; resize gesture | `AC-08-022` |
| `REQ-08-023` | DES-012 | Story MUST distinguish resize, which can reflow content, from scale, which proportionally changes supported geometry, text, strokes, effects, and layout values. | Editor; transform command | `AC-08-023` |
| `REQ-08-024` | DES-012 | Story MUST rotate around a visible configurable pivot using pointer, numeric, and increment commands with continuous and constrained angles. | Editor; rotate gesture/command | `AC-08-024` |
| `REQ-08-025` | DES-012 | Story MUST flip selections horizontally or vertically around the active transform origin without changing hierarchy or identity. | Editor; command transaction | `AC-08-025` |
| `REQ-08-026` | DES-012 | Story MUST compute multi-selection transforms in a stable common coordinate space and preserve each child's relative transform, including nested and rotated content. | Editor; multi-transform | `AC-08-026` |
| `REQ-08-027` | DES-012 | Story MUST expose truthful mixed transform values and apply absolute versus relative numeric edits according to the control's declared semantics. | Inspector; multi-edit | `AC-08-027` |
| `REQ-08-028` | DES-012 | Story MUST align selected objects to selection bounds, key object, slide, parent, or layout region through an explicitly chosen reference. | Editor/inspector; command transaction | `AC-08-028` |
| `REQ-08-029` | DES-012 | Story MUST distribute three or more eligible objects by centers or gaps with deterministic ordering and support tidy-up behavior for compatible two-dimensional sets. | Editor; command transaction | `AC-08-029` |
| `REQ-08-030` | DES-012 | Story MUST preserve transform correctness for negative dimensions, flips, rotations beyond one turn, fractional coordinates, and near-zero sizes. | Editor and all render surfaces; mutation/render | `AC-08-030` |
| `REQ-08-031` | DES-013 | Story MUST preview every continuous transform at interaction frame rate and commit or cancel it as one atomic transaction. | Editor/history/collaboration; gesture lifecycle | `AC-08-031` |
| `REQ-08-032` | DES-012 | Story MUST snap transforms to eligible object geometry, slide geometry, guides, grids, layout regions, spacing patterns, and vector targets using deterministic priorities. | Editor; move/resize/rotate/create | `AC-08-032` |
| `REQ-08-033` | DES-012 | Story MUST use sticky snap capture and hysteresis so nearby candidates do not cause oscillation during a continuous gesture. | Editor; snap lifecycle | `AC-08-033` |
| `REQ-08-034` | DES-012 | Story MUST display snap guides, distances, angles, and equal-spacing evidence in screen-stable non-interactive overlays. | Editor; transform preview | `AC-08-034` |
| `REQ-08-035` | DES-012 | Story MUST allow temporary snap suppression and constraint inversion through documented modifiers without changing saved preferences. | Editor; active gesture | `AC-08-035` |

### 7.1 Transform modifier matrix

| Gesture | No modifier | `Shift` | `Alt/Option` | `Shift` + `Alt/Option` | `Ctrl/Cmd` where supported |
|---|---|---|---|---|---|
| Move | Free move with snapping | Axis or canonical-angle constraint | Duplicate-drag after threshold | Constrained duplicate-drag | Temporary deep targeting before drag |
| Corner resize | Free resize | Preserve start aspect ratio | Resize around center | Centered aspect resize | Ignore Auto Layout participation for explicit absolute conversion only when command is offered |
| Edge resize | One-axis resize | Symmetric or ratio policy announced by cursor/help | Resize opposite edge equally | Symmetric constrained resize | Context-specific; never silently detaches layout |
| Rotate | Continuous angle | Canonical angle increments | Rotate around alternate origin if exposed | Alternate origin with increments | No conflicting default |
| Nudge | 1 document unit | Large nudge | Fine nudge where platform permits | Reserved if conflict-free | Platform shortcut routing applies |

Modifier names adapt to platform. A shortcut ledger supplies discoverable bindings; this volume owns the behavior, not a hard-coded physical key.

### 7.2 Snap resolution

Each snap candidate has stable identity, axis, category, target position, source feature, distance, and eligibility. Resolution sorts by:

1. smallest screen-space distance;
2. active vector or layout edit target;
3. object geometry;
4. equal spacing;
5. layout region or column;
6. user guide;
7. slide edge or center;
8. grid;
9. stable target identity.

An owning domain may change category priority for a specialized mode, but the active priority is deterministic and testable.

## 8. Shapes, Vectors, Pen, Booleans, and Masks Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-08-036` | DES-020 | Story MUST create rectangles, ellipses, lines, arrows, polygons, stars, and supported custom primitives by click or drag with parametric editability retained. | Editor; create/commit | `AC-08-036` |
| `REQ-08-037` | DES-020 | Story MUST preserve per-shape parameters such as corner radii, smoothing, sides, points, inner radius, arc, endpoint, and arrowhead settings until explicit conversion. | Editor/files/collaboration; edit/round trip | `AC-08-037` |
| `REQ-08-038` | DES-020 | Story MUST convert parametric shapes, text outlines, strokes, and supported objects to canonical vector paths only through explicit undoable commands. | Editor; conversion transaction | `AC-08-038` |
| `REQ-08-039` | DES-021 | Story MUST provide a pen workflow for placing straight and curved segments, continuing open paths, closing contours, and starting independent contours. | Editor; pen state machine | `AC-08-039` |
| `REQ-08-040` | DES-021 | Story MUST support point, segment, handle, contour, and whole-path selection with additive, subtractive, and marquee operations in vector edit mode. | Editor; vector selection | `AC-08-040` |
| `REQ-08-041` | DES-021 | Story MUST support insertion, deletion, movement, and numeric positioning of vector points while preserving valid adjacent geometry. | Editor; vector transaction | `AC-08-041` |
| `REQ-08-042` | DES-021 | Story MUST support line-to-curve and curve-to-line conversion plus corner, smooth, symmetric, and disconnected handle continuity. | Editor; segment/point transaction | `AC-08-042` |
| `REQ-08-043` | DES-021 | Story MUST support join, split, open, close, reverse, scissors, and contour-combination operations with deterministic endpoint and winding rules. | Editor; path transaction | `AC-08-043` |
| `REQ-08-044` | DES-020 | Story MUST support open and closed contours, compound paths, even-odd and nonzero fill rules, and self-intersection without corrupting editable source geometry. | Editor/all render surfaces; author/render | `AC-08-044` |
| `REQ-08-045` | DES-022 | Story MUST create union, subtract, intersect, and exclude relationships as non-destructive ordered booleans whose operands remain editable. | Editor/all render surfaces; create/resolve | `AC-08-045` |
| `REQ-08-046` | DES-022 | Story MUST preserve a last-known-valid boolean result and actionable diagnostics when derived geometry cannot be recomputed. | Editor/all render surfaces; failure/recovery | `AC-08-046` |
| `REQ-08-047` | DES-022 | Story MUST create clip, alpha, and luminance masks where supported using one nested non-destructive relationship model for shapes, text, and media. | Editor/all render surfaces; create/resolve | `AC-08-047` |
| `REQ-08-048` | DES-022 | Story MUST provide explicit mask-shape and mask-content edit modes, inversion where meaningful, and deterministic nested-mask composition. | Editor; mask edit lifecycle | `AC-08-048` |
| `REQ-08-049` | DES-022 | Story MUST flatten booleans, outline strokes or text, and rasterize content only after naming the editability loss and offering cancel. | Editor; destructive conversion | `AC-08-049` |
| `REQ-08-050` | DES-023 | Story MUST retain stable identities for paths, contours, points, segments, handles, operands, masks, and derived-result provenance across edits and round trips. | Document/history/collaboration/files | `AC-08-050` |

### 8.1 Pen state machine

`SM-08-002` governs pen authoring:

| State | Pointer action | Result | Keyboard action |
|---|---|---|---|
| `pen-ready` | Click empty | Start path with corner point | Escape returns to Select |
| `path-open` | Click empty | Add straight segment | Enter finishes open path |
| `path-open` | Drag empty | Add point with curve handles | Escape finishes, second Escape selects path |
| `path-open` | Click first endpoint | Close contour | Backspace removes last uncommitted point |
| `path-open` | Click eligible endpoint | Join/continue according to endpoint policy | Modifier temporarily breaks or mirrors handles |
| `editing-last-point` | Drag handle | Adjust outgoing/incoming handle preview | Space repositions point before release where supported |

A pen session may create multiple contours in one vector object only through an explicit continue/add-contour command. Tool completion commits one transaction per intentional path creation, not one transaction per point.

### 8.2 Vector failure policy

- Non-finite input is rejected before mutation.
- A point deletion that would make a closed contour invalid either converts it to a valid open contour under the documented rule or is refused with an explanation.
- Boolean and mask evaluation failure never deletes operands.
- Near-zero segments remain editable and can be located in outline or layer structure even when not directly visible.
- Imported unsupported arc or quadratic commands normalize to cubic segments without changing the source import report.
- Derived caches are invalidated by semantic dependencies, not broad document changes.

## 9. Text and Typography Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-08-051` | DES-030 | Story MUST create point/auto-width, auto-height, and fixed-size text using click, drag, placeholder activation, and paste entry paths. | Editor; create/edit | `AC-08-051` |
| `REQ-08-052` | DES-030 | Story MUST make resize, scale, overflow, clipping, truncation, and auto-fit behavior explicit for each text sizing mode. | Editor/all render surfaces; resize/render | `AC-08-052` |
| `REQ-08-053` | DES-030 | Story MUST support text on approved paths or shapes with editable source text, path offset, side, direction, alignment, and detach behavior. | Editor/output; author/resolve | `AC-08-053` |
| `REQ-08-054` | DES-031 | Story MUST support character-range formatting for family, face, size, variable axes, weight, style, decoration, case, baseline, color, spacing, and approved OpenType features. | Editor/all text surfaces; range edit | `AC-08-054` |
| `REQ-08-055` | DES-031 | Story MUST support paragraph formatting for alignment, indentation, first-line and hanging indent, spacing, line height, tabs, lists, columns, and vertical alignment. | Editor/output; paragraph edit | `AC-08-055` |
| `REQ-08-056` | DES-031 | Story MUST support Unicode text, grapheme-safe navigation, IME composition, language tagging, spellcheck policy, bidi direction, and vertical-writing degradation rules. | Editor/files/output; text lifecycle | `AC-08-056` |
| `REQ-08-057` | DES-031 | Story MUST route browser-native caret and range behavior inside text edit mode while suppressing conflicting canvas commands. | Editor; text-edit state | `AC-08-057` |
| `REQ-08-058` | DES-033 | Story MUST preserve caret or range intent through inspector interaction, undo, redo, collaboration reconciliation, and recoverable focus loss. | Editor/history/collaboration; edit session | `AC-08-058` |
| `REQ-08-059` | DES-033 | Story MUST sanitize rich paste into the supported text model while preserving safe content and reporting removed or substituted semantics. | Editor/clipboard; paste transaction | `AC-08-059` |
| `REQ-08-060` | DES-032 | Story MUST resolve local, embedded, approved web, and substitute fonts through a deterministic font policy that preserves requested family metadata. | All render/output surfaces; load/render | `AC-08-060` |
| `REQ-08-061` | DES-032 | Story MUST identify missing fonts before irreversible output and provide replace, locate, embed where licensed, keep requested, or outline-copy choices as applicable. | Editor/export/interchange; preflight | `AC-08-061` |
| `REQ-08-062` | DES-032 | Story MUST provide reusable typography styles with linked properties, local overrides, reset, reapply, and update review. | Editor/libraries/files; style lifecycle | `AC-08-062` |
| `REQ-08-063` | DES-033 | Story MUST preserve text content, ranges, paragraph structure, style bindings, language, and sizing semantics across save, collaboration, presentation, and supported output. | All surfaces and persistence boundaries | `AC-08-063` |
| `REQ-08-064` | DES-031 | Story MUST expose text semantics to keyboard and assistive technology without requiring users to manipulate raw markup. | Editor/accessibility/output | `AC-08-064` |

### 9.1 Text sizing matrix

| Mode | Width | Height | Manual side resize | Content overflow | Auto Layout mapping |
|---|---|---|---|---|---|
| Auto width | Hugs content | Hugs content | Converts to auto height or fixed according to handle | No width wrap unless explicit line break | Hug/hug |
| Auto height | Fixed/user or fill | Hugs wrapped content | Changes width, retains auto height | Vertical growth | Fixed or fill/hug |
| Fixed size | Fixed/user or fill | Fixed/user or fill | Changes corresponding dimension | Visible, clipped, truncated, or auto-fit as explicitly selected | Fixed/fixed or fill/fill |
| Path text | Path-derived | Glyph-derived | Edits path or offset by dedicated controls | Follows documented path overflow policy | Absolute child unless container explicitly supports it |

Changing sizing mode preserves the current visible bounds where possible, then applies the new policy. It does not silently scale font size.

### 9.2 Text edit lifecycle

`FLOW-08-001`:

1. Resolve the editable text owner, including placeholder instantiation or permitted instance override.
2. Enter `text-edit` without changing document content.
3. Let the platform text engine own caret, range, grapheme, and IME behavior inside the editable surface.
4. Route range formatting and text operations through typed preview/commit operations.
5. Keep composition text provisional until composition end.
6. Commit on explicit completion or compatible focus transition; cancel restores the session start when the chosen command means cancel.
7. Reconcile selection to stable text anchors after accepted remote operations.
8. Delete a newly created empty non-placeholder only under the documented empty-creation rule.

## 10. Auto Layout and Constraints Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-08-065` | DES-040 | Story MUST create horizontal, vertical, and wrapped Auto Layout containers from new content or an eligible selection without changing visual order unexpectedly. | Editor; create/wrap transaction | `AC-08-065` |
| `REQ-08-066` | DES-040 | Story MUST support nested Auto Layout with stable child order, direction, wrap, line behavior, alignment, distribution, gap, and per-side padding. | Editor/all render surfaces; author/resolve | `AC-08-066` |
| `REQ-08-067` | DES-041 | Story MUST support fixed, hug-content, and fill-container sizing independently on each eligible axis with deterministic parent-child resolution. | Editor/all render surfaces; layout resolve | `AC-08-067` |
| `REQ-08-068` | DES-041 | Story MUST support minimum and maximum dimensions that constrain fixed, hug, fill, text, media, and nested layout results without cyclic resolution. | Editor/all render surfaces; layout resolve | `AC-08-068` |
| `REQ-08-069` | DES-041 | Story MUST support per-child alignment, grow or fill weight where offered, margin where offered, order, visibility, and absolute positioning inside an Auto Layout parent. | Editor/all render surfaces; child edit/resolve | `AC-08-069` |
| `REQ-08-070` | DES-041 | Story MUST provide canvas insertion, reordering, nesting, extraction, and absolute-child gestures with unambiguous previews and atomic commits. | Editor; drag/drop lifecycle | `AC-08-070` |
| `REQ-08-071` | DES-041 | Story MUST resolve wrapped lines deterministically from available inner size, child sizing, gaps, order, and writing direction. | All render/output surfaces; layout resolve | `AC-08-071` |
| `REQ-08-072` | DES-042 | Story MUST provide left, right, top, bottom, center, scale, and stretch constraints for eligible non-Auto-Layout children when a parent resizes. | Editor/all render surfaces; parent resize | `AC-08-072` |
| `REQ-08-073` | DES-042 | Story MUST define aspect-ratio locking independently from parent constraints and resolve conflicts through a published priority order. | Editor/all render surfaces; resize/resolve | `AC-08-073` |
| `REQ-08-074` | DES-042 | Story MUST preview responsive results while parent, component, placeholder, or slide bounds change and commit only authored property changes. | Editor; resize preview/commit | `AC-08-074` |
| `REQ-08-075` | DES-043 | Story MUST allow Auto Layout within slides, masters, layouts, placeholders, groups, components, and instances under each owner's inheritance and override rules. | Editor/all render surfaces; author/resolve | `AC-08-075` |
| `REQ-08-076` | DES-043 | Story MUST keep slide columns and guides as snap/reference systems unless the user explicitly converts or binds content to an Auto Layout structure. | Editor; authoring | `AC-08-076` |
| `REQ-08-077` | DES-041 | Story MUST detect layout dependency cycles and preserve the last valid result while identifying the exact conflicting nodes and properties. | Editor/files/import; validation/recovery | `AC-08-077` |
| `REQ-08-078` | DES-040 | Story MUST expose Auto Layout structure, computed size, overflow, and constraint state to keyboard and assistive-technology users. | Editor/accessibility; inspect/edit | `AC-08-078` |

### 10.1 Layout resolution order

The deterministic layout solver follows this order:

1. Resolve source properties, variables, component values, and visibility.
2. Establish externally constrained parent size, including min/max bounds.
3. Measure intrinsic children, including text and media aspect ratio.
4. Resolve fixed and hug dimensions that do not depend on fill allocation.
5. Allocate remaining inner space to fill children using stable order and weights.
6. Form wrapped lines and repeat measurement only within a bounded convergence algorithm.
7. Apply alignment, distribution, gaps, and padding.
8. Resolve absolute children and non-layout constraints.
9. Produce computed bounds and overflow diagnostics without mutating source properties.

Priority for conflicting rules is: explicit min/max clamp, fixed external size, aspect policy, Auto Layout sizing, then legacy constraint. A conflict warning identifies the rule that did not win.

### 10.2 Auto Layout interaction matrix

| Action | Layout child | Absolute child | Non-layout child |
|---|---|---|---|
| Drag within parent | Preview reorder/insertion | Move freely with optional snapping | Normal move |
| Drag across parent edge | Preview reparent if eligible | Reparent while preserving world transform | Reparent/group rules |
| Resize main axis | Changes fixed size or fill policy through explicit gesture affordance | Normal resize | Normal resize |
| Resize cross axis | Changes fixed/hug/fill policy through explicit gesture affordance | Normal resize | Normal resize |
| Delete parent | Prompt/command policy preserves children or deletes subtree atomically | Same | Same |
| Remove Auto Layout | Preserve current resolved child positions as authored coordinates | Preserve coordinates | No effect |

## 11. Components, Instances, Variants, and Properties Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-08-079` | DES-050 | Story MUST create a component definition from an eligible selection while preserving hierarchy, layout, names, style bindings, and stable descendant identity. | Editor/files/libraries; create transaction | `AC-08-079` |
| `REQ-08-080` | DES-050 | Story MUST place component instances as source-linked references whose resolved appearance combines definition state, property values, and tracked overrides. | Editor/all render surfaces; place/resolve | `AC-08-080` |
| `REQ-08-081` | DES-050 | Story MUST support nested instances without cyclic component references and provide an actionable cycle error before commit. | Editor/import/libraries; insert/validate | `AC-08-081` |
| `REQ-08-082` | DES-050 | Story MUST organize compatible components into component sets with named variant axes, values, defaults, and deterministic combination identity. | Editor/libraries; set authoring | `AC-08-082` |
| `REQ-08-083` | DES-050 | Story MUST switch variants while preserving compatible descendant overrides, animation targets, and semantic identity. | Editor/runtime preview; variant mutation | `AC-08-083` |
| `REQ-08-084` | DES-050 | Story MUST support typed text, boolean, instance-swap, variant, and supported numeric component properties with defaults and validation. | Editor/libraries/files; property lifecycle | `AC-08-084` |
| `REQ-08-085` | DES-051 | Story MUST expose selected nested properties through explicit author-controlled mappings rather than unrestricted descendant mutation. | Component authoring/instance inspector | `AC-08-085` |
| `REQ-08-086` | DES-051 | Story MUST track overrides by stable semantic target and property path with states for inherited, overridden, orphaned, conflicted, and reset. | Editor/files/collaboration/libraries | `AC-08-086` |
| `REQ-08-087` | DES-051 | Story MUST reset one override, a subtree, a property category, or an entire instance without affecting unrelated overrides. | Editor; reset transaction | `AC-08-087` |
| `REQ-08-088` | DES-051 | Story MUST swap an instance's component source through a compatibility mapping that previews retained, remapped, orphaned, and dropped overrides before commit. | Editor/libraries; swap transaction | `AC-08-088` |
| `REQ-08-089` | DES-051 | Story MUST detach an instance into ordinary editable content while preserving current resolved appearance, hierarchy, assets, variables, and animation targets where representable. | Editor; detach transaction | `AC-08-089` |
| `REQ-08-090` | DES-054 | Story MUST propagate component definition changes deterministically without erasing valid instance overrides or changing unrelated instance state. | Editor/collaboration/libraries; update resolve | `AC-08-090` |
| `REQ-08-091` | DES-054 | Story MUST surface orphaned or incompatible overrides after source updates and offer map, keep local, reset, or detach resolutions as applicable. | Editor/libraries; conflict review | `AC-08-091` |
| `REQ-08-092` | DES-050 | Story MUST provide authoring previews for component states and interactions without treating preview navigation as document mutation. | Editor; preview state | `AC-08-092` |
| `REQ-08-093` | DES-050 | Story MUST preserve component and instance semantics through native save, collaboration, duplicate, clipboard, slide duplication, templates, and supported interchange. | Files/collaboration/clipboard/interchange | `AC-08-093` |

### 11.1 Override resolution

Instance resolution applies, in order:

1. component definition and selected variant;
2. component property values;
3. nested instance source and property values;
4. valid structural overrides explicitly permitted by the definition;
5. local property overrides;
6. runtime-only preview state.

An override does not copy the full descendant. It stores the stable target, property path, value or operation, source revision context, and conflict state. Reordering a definition does not orphan an override when the target identity survives.

### 11.2 Instance edit matrix

| User action | Definition | Instance | Nested instance |
|---|---|---|---|
| Edit exposed text/property | Changes default or mapping | Creates/updates property value or override | Routes to exposed nested mapping |
| Move internal child | Changes definition structure | Disallowed unless structural override is explicitly supported | Disallowed across nested ownership boundary |
| Change fill | Changes definition default | Creates property override if eligible | Creates nested override only when exposed/permitted |
| Delete child | Deletes from definition after impact review | Hides/removes only through supported boolean/slot property or structural override | Same boundary rule |
| Reset | Not applicable | Removes selected override scope | Removes selected nested override scope |
| Detach | Converts definition only through explicit ordinary-content command | Materializes resolved content | Can detach nested instance if policy permits |

## 12. Variables, Styles, and Libraries Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-08-094` | DES-053 | Story MUST support typed color, number, string, boolean, dimension, and other approved variable kinds with type-safe property binding. | Editor/files/libraries; variable lifecycle | `AC-08-094` |
| `REQ-08-095` | DES-053 | Story MUST organize variables into named collections with stable identities, ordered modes, one default mode, and explicit mode inheritance or fallback. | Editor/files/libraries; collection lifecycle | `AC-08-095` |
| `REQ-08-096` | DES-053 | Story MUST support same-type variable aliases with cycle prevention, dependency diagnostics, and deterministic fallback for missing targets. | Editor/files/import/libraries; alias lifecycle | `AC-08-096` |
| `REQ-08-097` | DES-053 | Story MUST resolve variable modes from document, slide, subtree, component, and preview context using a published precedence order. | All render/output surfaces; resolve | `AC-08-097` |
| `REQ-08-098` | DES-052 | Story MUST provide reusable color, typography, effect, grid, and spacing styles with stable identity, description, grouping, and usage discovery. | Editor/files/libraries; style lifecycle | `AC-08-098` |
| `REQ-08-099` | DES-052 | Story MUST distinguish linked style values from local overrides and provide reapply, reset, detach, and promote-to-style actions. | Editor; style edit lifecycle | `AC-08-099` |
| `REQ-08-100` | DES-054 | Story MUST preview document-wide consequences before changing or deleting a published variable, mode, style, component, or library asset. | Editor/libraries; destructive review | `AC-08-100` |
| `REQ-08-101` | DES-052 | Story MUST publish library changes as versioned reviewable updates with permissions, dependency metadata, release notes, and immutable source identity. | Library/collaboration; publish lifecycle | `AC-08-101` |
| `REQ-08-102` | DES-054 | Story MUST let consumers review, accept, defer, or selectively apply compatible library updates without silent document-wide change. | Editor/libraries/files; consume lifecycle | `AC-08-102` |
| `REQ-08-103` | DES-054 | Story MUST preserve last-resolved values and source metadata when a library is offline, revoked, deleted, or unavailable. | Editor/files/output; failure/recovery | `AC-08-103` |

### 12.1 Variable precedence

For a bound property, resolution uses:

1. explicit preview mode selected for the editing surface;
2. nearest component or subtree mode override;
3. slide or custom-show edition mode override;
4. document mode selection;
5. collection default mode;
6. typed fallback stored with the binding or owning property.

Aliases resolve within the selected mode at each hop. A missing mode value falls back through declared mode inheritance, then the collection default, then the binding fallback. Cycles fail validation before commit.

### 12.2 Library update states

`SM-08-003`: `unpublished-local -> publishing -> published-current -> update-available -> review -> applied|deferred|partially-applied`; failures return to the last durable state with diagnostics. Revocation changes source availability, not the document's last accepted authored values.

## 13. Fills, Strokes, Effects, and Media Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-08-104` | DES-060 | Story MUST support ordered stable-identity fill, stroke, and effect stacks with per-item visibility, opacity, blend mode, reorder, duplicate, and delete. | Editor/files/collaboration/all render surfaces | `AC-08-104` |
| `REQ-08-105` | DES-061 | Story MUST support solid, linear, radial, angular, diamond, image, video, code, and approved pattern paints under an explicit per-surface support matrix. | Editor/all output surfaces; author/resolve | `AC-08-105` |
| `REQ-08-106` | DES-061 | Story MUST provide editable gradient geometry, stable ordered stops, midpoint where supported, interpolation space, spread, opacity, and transform. | Editor/output; gradient edit | `AC-08-106` |
| `REQ-08-107` | DES-060 | Story MUST support stroke width, alignment, cap, join, miter, dash pattern, endpoint decoration, paint, opacity, and blend with geometry-valid fallbacks. | Editor/all output surfaces; author/resolve | `AC-08-107` |
| `REQ-08-108` | DES-060 | Story MUST support ordered drop shadow, inner shadow, layer blur, background blur, and approved effects with visible bounds and clipping rules. | Editor/all output surfaces; author/resolve | `AC-08-108` |
| `REQ-08-109` | DES-062 | Story MUST support non-destructive media crop, fit, fill, tile where applicable, focal point, rotation, filters, replacement, and reset. | Editor/all output surfaces; media edit | `AC-08-109` |
| `REQ-08-110` | DES-062 | Story MUST support video and animated-media poster, trim, loop, mute, volume, autoplay, click behavior, and presentation playback policies without coupling editor preview time to authored time. | Editor/runtime/video/web; media lifecycle | `AC-08-110` |
| `REQ-08-111` | DES-062 | Story MUST preserve media treatment and placement when replacing an asset unless the user explicitly chooses replacement defaults. | Editor/files; replace transaction | `AC-08-111` |
| `REQ-08-112` | DES-063 | Story MUST provide truthful uniform, mixed, unset, and not-applicable states for scalar and structured paint properties across multi-selection. | Inspector; selection/edit | `AC-08-112` |
| `REQ-08-113` | DES-063 | Story MUST map multi-selection stack edits by stable item identity or disable unsafe row operations when stacks cannot be aligned. | Inspector/history; multi-edit transaction | `AC-08-113` |
| `REQ-08-114` | DES-060 | Story MUST preserve paint source data and report the exact fallback when a renderer, interchange target, or output format cannot reproduce a paint or effect. | All output/interchange surfaces | `AC-08-114` |

### 13.1 Structured mixed-state matrix

| Stack relation across selection | Display | Safe operations | Unsafe operations |
|---|---|---|---|
| Same item IDs and order, same values | Normal rows | All edits | None |
| Same item IDs/order, differing values | Row-level mixed indicators | Absolute edits, relative deltas, reorder | None when mapping is complete |
| Same semantic items, differing order | Mixed-order summary | Normalize order after preview, add item | Implicit reorder |
| Different item sets or counts | List-level mixed summary | Add to all, replace entire stack after confirmation | Edit/remove/reorder an unmapped row |
| Partially inapplicable selection | Explicit partial scope or disabled section | Opt-in applicable-subset edit | Silent partial edit |

### 13.2 Paint and media direct-edit contract

| Paint/content | On-canvas interaction | Inspector and keyboard alternative | Preview, commit, and failure rule |
|---|---|---|---|
| Solid | Eyedropper and direct target sampling where permitted | Color model, channels, hex, opacity, theme/variable binding | Sampling is provisional until accepted; inaccessible or protected pixels return a typed failure without changing paint |
| Linear gradient | Drag start/end points to position, rotate, and scale the axis; drag stops along the axis | Numeric endpoints/angle, reverse, rotate by canonical increment, stop list | One axis or stop gesture is one transaction; zoom changes handle size, not gradient geometry |
| Radial/diamond gradient | Drag center, radius/extent, focal point where supported, and perpendicular aspect handle | Numeric center, extents, aspect, rotation, spread, and stop list | Invalid or zero extents clamp only by declared numeric policy and retain the last valid preview |
| Angular gradient | Drag center and angular start/orientation handle | Numeric center, start angle, sweep/spread, and stop list | Angle normalization does not reorder stable stop identities |
| Gradient stop | Select, drag, add on ramp/axis, duplicate, edit color/opacity/midpoint, or remove | Ordered accessible stop list with position and all paint bindings | Add samples the current interpolation at that position; equal-position stops retain stable order; removal cannot cross the published minimum stop count |
| Image/animated image fill | Enter crop/treatment mode to pan, scale, rotate, set focal point, or choose fit/fill/stretch/tile without moving the host element | Numeric transform, nine-point alignment, scale mode, filter controls, reset treatment, reset intrinsic size | Crop/treatment preview is nondestructive; reset names whether it changes treatment, host bounds, or both; unavailable animation uses its poster without discarding source |
| Video fill or media object | Crop as image; scrub preview playhead; set trim handles, poster, bookmark, loop, mute, volume, rate, and start policy | Timecode fields, transport controls, track/caption controls, numeric treatment | Editor playhead and playback are runtime state; accepted trim/poster/settings are authored; decode failure retains source and last valid poster |
| Code fill | Interact only through the declared input contract and deterministic preview clock; edit source in the governed code surface | Source editor, parameters, time/frame controls, pause/reset, fallback selection | Code executes only in the Volume 13 sandbox; preview time is runtime state; timeout/error retains code and renders the authored fallback |
| Text glyph paint | Manipulate compatible gradient/image/video/code geometry against the text paint bounds while text remains editable | Text paint stack, gradient/media/code controls, fallback text color | Paint clips to resolved glyph coverage rather than replacing text with outlines; empty/transparent glyph paint does not make the text structurally unreachable |

Gradient stop positions are normalized to the declared range but preserve authored precision. Reverse exchanges the ramp direction and stop positions without changing stop IDs; rotating or moving gradient geometry does not rewrite stop colors. A direct stop insertion derives its initial color, opacity, and variable/style provenance from the evaluated ramp, then becomes independently editable.

Image and video may appear as a paint layer on any eligible geometry or as a first-class media object from Volume 09. Both forms share one asset identity, crop/treatment schema, readiness policy, and output fallback; implementations cannot create separate media lifecycles merely because the insertion command differed. Entering crop, gradient, or media-preview mode changes selection controls and input routing, not hierarchy or authored content, until a property gesture commits.

## 14. Layers and Structural Navigation Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-08-115` | DES-070 | Story MUST display the active editing root as a virtualized accessible hierarchy whose visual order corresponds deterministically to scene stacking order. | Layer tree; render/update | `AC-08-115` |
| `REQ-08-116` | DES-070 | Story MUST synchronize canvas and layer-tree selection, including additive, toggle, and contiguous-range selection. | Editor/layers; selection lifecycle | `AC-08-116` |
| `REQ-08-117` | DES-070 | Story MUST support inline rename with validation, commit, cancel, duplicate-name tolerance, and deterministic default naming. | Layers; rename transaction | `AC-08-117` |
| `REQ-08-118` | DES-070 | Story MUST support reorder and reparent by pointer and keyboard with drop previews, cycle prevention, world-transform preservation, and one atomic commit. | Layers/editor; drag/drop transaction | `AC-08-118` |
| `REQ-08-119` | DES-070 | Story MUST support visibility and locking for individual nodes and subtrees with inherited/effective state shown separately from local state. | Layers/editor/all render surfaces | `AC-08-119` |
| `REQ-08-120` | DES-070 | Story MUST support search and filters by name, type, state, source, property, and issue while retaining hierarchy context and match navigation. | Layers; query lifecycle | `AC-08-120` |
| `REQ-08-121` | DES-070 | Story MUST support expand, collapse, reveal selection, auto-scroll during drag, and temporary solo or isolation without authoring hidden structural changes. | Layers/editor; runtime navigation | `AC-08-121` |
| `REQ-08-122` | DES-070 | Story MUST distinguish local, inherited, instance-owned, masked, boolean-operand, absolute-layout, hidden, and locked nodes through names, roles, states, and non-color cues. | Layers/accessibility; inspect | `AC-08-122` |

### 14.1 Reparent rules

A reparent operation:

1. validates target ownership and rejects cycles;
2. computes the source node's current world transform;
3. inserts at a stable target position;
4. derives a new local transform that preserves visual placement;
5. reconciles Auto Layout participation, constraints, masks, booleans, and component ownership;
6. previews any semantic conversion before commit;
7. commits order and parent change atomically.

Dropping into an Auto Layout parent creates a layout child by default. A documented modifier may create an absolute child. Dropping into an instance cannot bypass its override policy.

## 15. Clipboard, Figma-Originated Content, and SVG Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-08-123` | DES-071 | Story MUST encode copied Story content in a versioned portable internal clipboard representation containing hierarchy, stable semantic links, assets, styles, variables, and plain or visual fallbacks. | Editor/system clipboard; copy | `AC-08-123` |
| `REQ-08-124` | DES-071 | Story MUST perform cut as copy verification followed by one atomic deletion transaction so failed clipboard writes never remove source content. | Editor/system clipboard/history; cut | `AC-08-124` |
| `REQ-08-125` | DES-071 | Story MUST paste internal content with new document-unique entity identities while preserving valid internal references and source provenance. | Editor/files/assets; paste transaction | `AC-08-125` |
| `REQ-08-126` | DES-071 | Story MUST provide normal paste, paste in place, paste into selection or container, and duplicate with deterministic placement and selection results. | Editor; paste/duplicate | `AC-08-126` |
| `REQ-08-127` | DES-071 | Story MUST route clipboard input to text editing, property fields, canvas objects, or media replacement according to focused context and explicit command. | Editor; paste dispatch | `AC-08-127` |
| `REQ-08-128` | DES-072 | Story MUST recognize supported Figma-originated SVG, HTML, text, and image clipboard payloads through public clipboard formats without depending on private metadata. | Editor/system clipboard; import | `AC-08-128` |
| `REQ-08-129` | DES-072 | Story MUST sanitize external clipboard markup, block active content and external fetches, enforce complexity limits, and leave the document unchanged on rejection. | Editor/security; import validation | `AC-08-129` |
| `REQ-08-130` | DES-072 | Story MUST convert supported external content through a deterministic intermediate representation before creating Story entities. | Import pipeline; parse/convert | `AC-08-130` |
| `REQ-08-131` | DES-072 | Story MUST degrade imported content in the order native semantic object, editable vector, preserved embedded source with substitute, then raster fallback. | Editor/interchange; import conversion | `AC-08-131` |
| `REQ-08-132` | DES-072 | Story MUST present a structured import report for every substituted, outlined, expanded, sanitized, preserved-only, rejected, or rasterized feature. | Editor; post-import/report | `AC-08-132` |
| `REQ-08-133` | DES-073 | Story MUST import the published SVG subset with geometry, transforms, groups, text, paint, strokes, masks, clipping, and effects mapped by declared fidelity tier. | Editor/files; SVG import | `AC-08-133` |
| `REQ-08-134` | DES-073 | Story MUST export selected objects or roots to SVG with stable bounds, viewBox, hierarchy, geometry, transforms, paint, masks, text policy, metadata policy, and compatibility report. | SVG artifact; export | `AC-08-134` |
| `REQ-08-135` | DES-073 | Story MUST preserve the editable source and user choice when SVG text is exported as live text, outlined paths, or both through metadata-supported packaging. | Editor/SVG artifact; export choice | `AC-08-135` |
| `REQ-08-136` | DES-071 | Story MUST retain clipboard and import assets through undo, redo, save, collaboration, and garbage collection until no accepted history or document reference needs them. | Assets/history/files/collaboration | `AC-08-136` |

### 15.1 Clipboard flavor precedence

| Focus/context | Preferred flavor | Fallback order |
|---|---|---|
| Story canvas with Story payload | Story internal object MIME | SVG, HTML containing SVG, image, plain text |
| Story canvas with external design payload | SVG | HTML containing SVG, image, plain text |
| Text edit | Safe rich text/HTML | Plain text; images require explicit insertion command |
| Property input | Plain text valid for field | No canvas import |
| Media replace command | Compatible media blob/file | Image URL only under explicit trusted import policy |

The first valid flavor wins. Failure to parse a richer flavor may fall through only when doing so cannot conceal a materially different result; otherwise Story asks whether to use the lower-fidelity fallback.

### 15.2 Import flow

`FLOW-08-002`:

1. Capture available clipboard flavors and insertion context.
2. Select a flavor using deterministic precedence.
3. Validate size, count, type, and permission limits before expensive parsing.
4. Sanitize markup and resolve only embedded, local, or explicitly approved resources.
5. Parse into a renderer-neutral import IR.
6. Map semantics by the published fidelity table and accumulate structured issues.
7. Validate the complete proposed subtree, references, assets, and transaction.
8. Preview or ask for consent if rasterization, outlining, expansion, or material substitution is required.
9. Commit all entities and asset references atomically.
10. Select top-level imported content, announce the result, and make the report available.

## 16. Keyboard and Accessibility Hooks

Volume 12 owns the full accessibility contract. This volume requires these authoring hooks:

| Context | Required keyboard affordance | Required semantic hook |
|---|---|---|
| Canvas object mode | Traverse objects, select/toggle, nudge, arrange, open actions, enter edit depth, escape depth | Current object name, type, position, size, state, hierarchy, and selection count |
| Transform | Numeric alternative for every pointer-only transform; modifier state announced on request | Live value announcement throttled to avoid speech flooding; final committed values announced |
| Vector edit | Traverse points/segments, select, nudge, add/delete, change continuity, open path actions | Point index/stable label, coordinates, segment type, continuity, selected count |
| Text edit | Platform caret/range keys, formatting commands, list indentation, composition-safe escape | Editable text role, language, direction, formatting state, errors |
| Auto Layout | Reorder child, move into/out of container, change sizing/alignment via controls | Parent direction, child order, sizing policy, computed size, overflow/conflict |
| Components | Enter/leave instance depth, edit exposed properties, reset override | Source component, variant, property value, override/conflict state |
| Layers | Tree navigation, expand/collapse, range/toggle select, reorder/reparent, rename, lock, hide | Accessible tree/treeitem roles, level, position, expanded, selected, checked/mixed states |
| Paint stacks | Add, remove, reorder, toggle, edit each stable item | List/listitem semantics, item type, visibility, mixed state, validation issue |

Pointer gestures that lack a direct keyboard analogue require an inspector or command-based alternative. Focus returns to the initiating object or nearest surviving control after dialogs, imports, destructive conversions, and errors.

## 17. Edge Cases and Failure Contracts

| Condition | Required behavior |
|---|---|
| Selected entity deleted remotely | End incompatible preview, preserve accepted local operations, select nearest surviving eligible ancestor, announce change |
| Editing root revoked or made read-only | Cancel uncommitted preview, retain accepted state, switch to inspect mode, explain permission change |
| Zero-size or invisible object | Keep structural selection and numeric editing available; show a minimum-size selection affordance |
| Singular transform | Refuse the operation that would make inverse mapping impossible or normalize through an explicit repair command |
| Missing font | Preserve requested font metadata, render deterministic substitute, mark affected ranges, preflight output |
| Missing media | Preserve asset reference and treatment, render named placeholder/poster, offer locate/replace/retry |
| Layout cycle | Reject the cycle-forming edit atomically, preserve last valid layout, focus conflicting control |
| Component cycle | Reject insertion/swap before commit and identify the source chain |
| Orphaned override | Preserve value and provenance, show conflict state, permit map/keep/reset/detach |
| Library offline | Use last accepted local snapshot and defer update checks without blocking authoring |
| Boolean evaluation failure | Render last valid result or diagnostic shell, retain operands and edit access |
| Clipboard permission denied | Keep document unchanged and offer supported event-paste or file-import route |
| Oversized external paste | Reject before commit, state the limit category, retain clipboard and document state |
| Partial asset import failure | Abort the atomic paste or use a consented placeholder for every failed asset; never silently omit children |
| Renderer lacks paint/effect | Use declared fallback, retain source semantics, emit surface-specific compatibility issue |
| Save during preview | Save last committed document state; preview remains runtime-only and is not serialized |
| Collaboration update during gesture | Rebase preview against accepted remote state when targets survive; otherwise cancel with explanation |

## 18. Acceptance Criteria

Each criterion is pass/fail and requires production paths. Visual interactions use headed browser evidence; clipboard, SVG, files, and assets also require artifact inspection.

### 18.1 Canvas and selection

| ID | Pass condition |
|---|---|
| `AC-08-001` | Every supported pan input moves the viewport while semantic hashes of document state remain unchanged. |
| `AC-08-002` | A sampled document point under the zoom centroid remains within the Volume 14 screen-pixel tolerance across zoom steps. |
| `AC-08-003` | Each fit or preset command reaches the documented scale and center and remains undo-neutral. |
| `AC-08-004` | Navigation reaches published bounds without losing the slide or preventing return to fit-slide. |
| `AC-08-005` | Coordinate probes, handles, and rendered geometry remain aligned after zoom, pan, DPR, and resize changes. |
| `AC-08-006` | Viewport shortcuts work on canvas and do not fire from text edit, fields, menus, or modals. |
| `AC-08-007` | Each guide/grid control changes only its declared view or document property and restores at the declared scope. |
| `AC-08-008` | Overlay handles remain within declared CSS-pixel size and alignment tolerance at minimum, 100 percent, and maximum zoom. |
| `AC-08-009` | Corrupt or obsolete viewport state recovers to a usable deterministic view without document mutation. |
| `AC-08-010` | Overlap fixtures select the frontmost eligible painted target rather than a bounds-only false positive. |
| `AC-08-011` | Fill, stroke, open-path, text, media, mask, and clip fixtures pass positive and negative hit probes at multiple zooms. |
| `AC-08-012` | Pointer and keyboard modifiers produce replace, add, subtract, toggle, and range results with one selection event each. |
| `AC-08-013` | Directional/containment marquees visibly declare and produce their documented inclusion policy. |
| `AC-08-014` | Nested group, boolean, mask, component, and instance fixtures reach each eligible depth without flattening. |
| `AC-08-015` | Repeated cycle commands enumerate a stable candidate sequence and reset only under documented conditions. |
| `AC-08-016` | Canvas, layer tree, inspector, and accessibility focus report identical stable selected identities. |
| `AC-08-017` | Captured runtime state distinguishes object selection, edit target, isolation root, text range, and vector sub-selection. |
| `AC-08-018` | Keyboard-only traversal reaches every eligible fixture node in deterministic order with accurate announcements. |
| `AC-08-019` | Hidden, clipped-out, transparent-below-threshold, and ineligible nodes fail direct hit tests but remain structurally recoverable. |
| `AC-08-020` | Local and simulated remote invalidations leave no dangling selection and choose the documented fallback. |

### 18.2 Transforms and geometry

| ID | Pass condition |
|---|---|
| `AC-08-021` | Pointer, nudge, numeric, and duplicate-drag produce equivalent transforms for equivalent input and one undo step. |
| `AC-08-022` | Every resize anchor/modifier combination matches the preview, committed bounds, and undo result. |
| `AC-08-023` | Resize reflows a text/layout fixture while scale proportionally changes all supported fixture properties. |
| `AC-08-024` | Pivot, free rotation, constrained rotation, numeric rotation, and multi-turn normalization remain deterministic. |
| `AC-08-025` | Double flip restores semantic geometry within tolerance and retains IDs and hierarchy. |
| `AC-08-026` | Rotated nested multi-selection fixtures preserve relative transforms through resize, rotate, undo, and redo. |
| `AC-08-027` | Mixed inputs show truthful states; absolute and relative edits produce the declared per-target values. |
| `AC-08-028` | Each alignment reference produces expected world bounds and no unintended reparent or resize. |
| `AC-08-029` | Distribution and tidy fixtures produce deterministic ordering and equal gaps within tolerance. |
| `AC-08-030` | Negative, flipped, fractional, tiny, and multi-turn fixtures remain finite and render consistently on all applicable surfaces. |
| `AC-08-031` | A transform with many preview updates creates exactly one accepted transaction, and Escape creates none. |
| `AC-08-032` | Snap corpus chooses the documented winner for object, spacing, layout, guide, slide, grid, angle, and vector candidates. |
| `AC-08-033` | Pointer motion around competing targets does not oscillate before the release threshold is crossed. |
| `AC-08-034` | Visible guides and measurements match the actual snap result and are not present in document or output artifacts. |
| `AC-08-035` | Temporary modifiers suppress/invert snapping only for the active gesture and leave preferences unchanged. |
| `AC-08-036` | Every primitive creation path produces the expected parametric type, defaults, geometry, selection, and undo result. |
| `AC-08-037` | Parametric edits survive native save/reopen and remain editable without path conversion. |
| `AC-08-038` | Conversion commands preserve appearance within tolerance, create editable paths, disclose loss, and undo to source semantics. |
| `AC-08-039` | Pen scenarios create straight, curved, open, closed, continued, and independent paths using the defined state transitions. |
| `AC-08-040` | Point, segment, handle, contour, whole-path, modifier, and marquee selection scenarios return expected stable IDs. |
| `AC-08-041` | Insert/delete/move/numeric point operations preserve valid adjacency, stable unaffected IDs, and one transaction. |
| `AC-08-042` | Segment and continuity conversions produce expected handles and tangent constraints and survive undo/redo. |
| `AC-08-043` | Join/split/open/close/reverse/scissors corpus matches canonical point order, winding, and geometry hashes. |
| `AC-08-044` | Open, compound, alternate fill-rule, and self-intersecting fixtures remain editable and cross-surface equivalent. |
| `AC-08-045` | All four boolean operations preserve ordered operands and match golden resolved geometry. |
| `AC-08-046` | Fault-injected boolean evaluation retains operands and last valid output and exposes an actionable issue. |
| `AC-08-047` | Clip, alpha, and luminance fixtures mask shape, text, image, and video sources according to the support matrix. |
| `AC-08-048` | Mask modes target only the declared shape/content and nested composition remains deterministic. |
| `AC-08-049` | Every destructive conversion requires explicit confirmation when loss exists and round-trips through undo. |
| `AC-08-050` | Stable IDs for geometry subobjects and relationships survive edit, replay, collaboration simulation, and native round trip. |

### 18.3 Text and responsive layout

| ID | Pass condition |
|---|---|
| `AC-08-051` | Click, drag, placeholder, and paste create the declared text sizing mode and enter the correct edit state. |
| `AC-08-052` | Resize, scale, overflow, clip, truncate, and auto-fit fixtures visibly and semantically differ as specified. |
| `AC-08-053` | Path-text fixtures retain editable text/path controls and follow declared output degradation. |
| `AC-08-054` | Character formatting applies only to selected grapheme-safe ranges and persists every declared property. |
| `AC-08-055` | Paragraph, list, tab, column, spacing, and vertical-alignment fixtures match captured document and render state. |
| `AC-08-056` | Unicode, CJK IME, combining marks, emoji graphemes, RTL, mixed direction, and language fixtures edit without corruption. |
| `AC-08-057` | Caret and range keys change text selection while canvas transforms remain unchanged in text-edit state. |
| `AC-08-058` | Inspector use, history, remote text operations, and recoverable focus loss restore a valid stable text selection. |
| `AC-08-059` | Rich paste corpus preserves allowed semantics, strips unsafe content, reports changes, and commits atomically. |
| `AC-08-060` | Font source and fallback fixtures resolve deterministically on every applicable surface. |
| `AC-08-061` | Missing-font preflight lists every affected range and each offered resolution produces the previewed artifact result. |
| `AC-08-062` | Typography style apply, override, reset, reapply, and update review preserve unrelated range formatting. |
| `AC-08-063` | Text semantic hashes and declared visual tolerances survive file, collaboration, playback, and output fixtures. |
| `AC-08-064` | Keyboard and assistive-technology inspection/editing exposes text content, language, formatting, and errors. |
| `AC-08-065` | Creating Auto Layout around eligible content preserves expected visual order and produces one reversible transaction. |
| `AC-08-066` | Nested direction, wrap, line, alignment, distribution, gap, and padding matrix matches golden computed bounds. |
| `AC-08-067` | Fixed/hug/fill combinations resolve deterministically for text, media, primitive, and nested-container fixtures. |
| `AC-08-068` | Min/max fixtures clamp without cycles and expose the winning constraint. |
| `AC-08-069` | Per-child alignment, weight, margin, order, visibility, and absolute behavior match resolved-scene assertions. |
| `AC-08-070` | Canvas insert/reorder/nest/extract/absolute gestures match their preview and create one transaction. |
| `AC-08-071` | Wrapped layout resolves identically across repeated runs, writing directions, and applicable surfaces. |
| `AC-08-072` | Every horizontal/vertical constraint combination produces expected child bounds under parent resize. |
| `AC-08-073` | Aspect and constraint conflicts follow the published priority and expose a diagnostic. |
| `AC-08-074` | Parent and slide resize previews update computed layout without serializing derived bounds as authored properties. |
| `AC-08-075` | Auto Layout resolves correctly in slide, master, layout, placeholder, group, component, and instance fixtures. |
| `AC-08-076` | Columns/guides influence snapping only until the user performs an explicit bind/convert action. |
| `AC-08-077` | Cycle-forming imports and edits are rejected atomically while the last valid result stays visible. |
| `AC-08-078` | Keyboard/assistive workflows can inspect and change layout order, sizing, alignment, overflow, and conflicts. |

### 18.4 Reuse, paint, layers, and interoperability

| ID | Pass condition |
|---|---|
| `AC-08-079` | Component creation preserves hierarchy, layout, bindings, names, and descendant identities and is reversible. |
| `AC-08-080` | Instances resolve from source, properties, and overrides without materializing duplicate source content. |
| `AC-08-081` | Direct and indirect component cycles are blocked before mutation with the complete source chain identified. |
| `AC-08-082` | Variant axes, defaults, combinations, and stable IDs survive reorder and native round trip. |
| `AC-08-083` | Variant switches retain all compatible overrides and targets and classify incompatible ones. |
| `AC-08-084` | Every component property type validates, resolves, edits, resets, and round-trips. |
| `AC-08-085` | Only explicitly exposed nested properties are instance-editable through the property surface. |
| `AC-08-086` | Override fixtures display and persist inherited, overridden, orphaned, conflicted, and reset states accurately. |
| `AC-08-087` | Scoped reset removes only the selected override scope and is one undoable transaction. |
| `AC-08-088` | Swap preview classifications match the final retained, remapped, orphaned, and dropped override artifact. |
| `AC-08-089` | Detach preserves resolved appearance and representable semantics while removing the instance link and supporting undo. |
| `AC-08-090` | Definition updates propagate to all instances while valid local overrides and unrelated state remain unchanged. |
| `AC-08-091` | Source update conflicts remain visible and every offered resolution produces its previewed result. |
| `AC-08-092` | State previews produce no document operations until an explicit authoring command is committed. |
| `AC-08-093` | Component semantics survive files, collaboration replay, clipboard, duplication, templates, and declared interchange fixtures. |
| `AC-08-094` | Every variable type binds only to compatible properties and invalid bindings are rejected before commit. |
| `AC-08-095` | Collections and modes retain stable IDs, order, default, and fallback through all persistence boundaries. |
| `AC-08-096` | Alias chains resolve deterministically, cycles are blocked, and missing targets use the declared fallback. |
| `AC-08-097` | Context fixtures produce exactly the published mode-precedence result on every surface. |
| `AC-08-098` | Each style family can be created, applied, found by usage, updated, and round-tripped. |
| `AC-08-099` | Linked, overridden, reset, reapplied, detached, and promoted states are visibly and semantically distinct. |
| `AC-08-100` | Delete/change impact preview enumerates all affected bindings and accepted action matches the preview. |
| `AC-08-101` | Publish artifacts include version, permissions, dependencies, notes, stable source IDs, and accepted content. |
| `AC-08-102` | Accept, defer, and selective update workflows change only chosen compatible dependencies. |
| `AC-08-103` | Offline, revoked, and deleted library fixtures retain last-resolved values and source diagnostics. |
| `AC-08-104` | Stack add/edit/toggle/reorder/duplicate/delete retains stable item IDs and matches all surfaces. |
| `AC-08-105` | Every paint type passes its declared editor/output support or produces the exact documented fallback issue. |
| `AC-08-106` | Gradient stop, midpoint, interpolation, spread, opacity, and transform edits match golden values and pixels. |
| `AC-08-107` | Stroke feature matrix renders or degrades exactly as declared and preserves editable source. |
| `AC-08-108` | Effect ordering, bounds, clipping, and visibility match resolved-scene and output fixtures. |
| `AC-08-109` | Crop/fit/fill/tile/focal/rotate/filter/replace/reset operations remain non-destructive and reversible. |
| `AC-08-110` | Media poster, trim, loop, mute, volume, autoplay, click, and runtime policies match authored settings deterministically. |
| `AC-08-111` | Replacing media preserves treatment by default and applies defaults only after explicit choice. |
| `AC-08-112` | Scalar and structured multi-selection fixtures show accurate uniform, mixed, unset, and not-applicable states. |
| `AC-08-113` | Stable mapped stack rows edit all intended targets; unmapped rows cannot be unsafely edited. |
| `AC-08-114` | Every paint/effect fallback retains source semantics and appears in the correct compatibility report. |
| `AC-08-115` | A large hierarchy virtualizes without changing accessible order or scene stacking correspondence. |
| `AC-08-116` | Canvas and layer selection remain identical for click, toggle, additive, and range workflows. |
| `AC-08-117` | Rename commit/cancel/validation/default/duplicate scenarios produce the documented name and one transaction. |
| `AC-08-118` | Reorder/reparent pointer and keyboard workflows preserve world transform, block cycles, and undo atomically. |
| `AC-08-119` | Local and inherited visibility/lock states resolve, render, target, and announce correctly. |
| `AC-08-120` | Every search/filter category returns correct matches with ancestors and supports next/previous navigation. |
| `AC-08-121` | Expand/collapse/reveal/auto-scroll/solo/isolation alter only declared runtime state. |
| `AC-08-122` | Every structural ownership/state distinction is perceivable without color and exposed semantically. |
| `AC-08-123` | Clipboard artifact inspection finds versioned Story data plus declared portable fallbacks and dependencies. |
| `AC-08-124` | Forced clipboard-write failure during cut leaves source content and history unchanged. |
| `AC-08-125` | Pasted entities receive unique IDs while all valid internal references and provenance remain correct. |
| `AC-08-126` | Normal, in-place, into-container, and duplicate workflows produce documented positions and selection. |
| `AC-08-127` | Focus-context matrix routes identical paste input to the correct text, field, canvas, or media action. |
| `AC-08-128` | Public-format Figma-originated corpus imports without private metadata dependencies. |
| `AC-08-129` | Malicious, external-reference, and over-limit payloads execute no active content and produce no partial mutation. |
| `AC-08-130` | Repeated conversion of identical payload and context produces identical canonical IR and semantic output hash. |
| `AC-08-131` | Each unsupported fixture follows the exact semantic-to-vector-to-preserved-substitute-to-raster degradation order. |
| `AC-08-132` | Import reports enumerate and locate every actual substitution, outline, expansion, sanitization, preservation, rejection, and raster fallback. |
| `AC-08-133` | Published SVG import corpus meets semantic, visual, warning, and editability expectations for each fidelity tier. |
| `AC-08-134` | SVG export artifacts have stable bounds, structure, geometry, paint, mask, text policy, and matching compatibility reports. |
| `AC-08-135` | Live-text, outline, and dual-policy SVG exports preserve the selected policy and source metadata where declared. |
| `AC-08-136` | Clipboard/import assets remain available through undo/redo/save/collaboration and are collected only after all retained references expire. |

## 19. Required Evidence and Traceability

Release conformance for this volume includes:

1. Atomic mapping from every `REQ-08-*` to parent capability, implementation owner, test or inspection protocol, revision, and evidence record.
2. Headed taskflows covering selection, viewport, creation, movement, resize, rotation, text, layers, inspector, numeric input, snapping, fills, strokes, effects, typography, color, shapes, columns, shortcuts, cursor, and export categories in the [taskflow catalog](../../automation/eval-loop/taskflows/00-index.md).
3. Semantic fixtures for Auto Layout, constraints, component resolution, variant swaps, overrides, variables, styles, and library updates.
4. Artifact inspection for `.str`, clipboard flavors, SVG import/export, fonts, and media assets.
5. Cross-surface visual and semantic comparison for editor, thumbnail, audience, presenter, raster/SVG, PDF/print, video/web, and PPTX compatibility output where applicable.
6. Negative gates for bounds-only false hits, multi-edit first-item leakage, layout/component cycles, silent rasterization, missing warnings, unstable IDs, partial paste, and preview state serialized as authored content.

## 20. Non-Goals and Open Boundaries

The following do not block conformance to this volume unless separately promoted:

- Pixel-identical competitor interface placement or styling.
- Compatibility with proprietary Figma file formats, private APIs, plugins, or unpublished clipboard metadata.
- Arbitrary branching vector-network editing beyond the published canonical path/network tier.
- CAD constraints, NURBS, 3D solids, mesh editing, or desktop-publishing imposition.
- Executing untrusted scripts, remote SVG resources, or active clipboard content.
- Guaranteeing editable native semantics in an output format that lacks them; preservation and disclosure remain required.
- Making collaboration, AI, or a network connection necessary for core local authoring.

Open boundaries are controlled by the following defaults. An ADR may expand a boundary, but implementation and conformance use the default in force until that ADR and its support matrix are accepted.

| ID | Decision/question | Default in force | Owner | Review trigger | Affected requirements/contracts | Blocking class |
|---|---|---|---|---|---|---|
| `OD-08-001` | Which advanced gradient and pattern authoring types extend the named paint baseline? | R1 supports solid, linear, radial, angular, diamond, image, video, and code fills. Mesh-gradient and arbitrary-pattern authoring are excluded; imported unsupported paints are preserved when possible and otherwise use a named reported fallback. | Product Design and Rendering Engineering | Before enabling any additional gradient or pattern type for authoring or claiming it in a release profile | `REQ-08-104` through `REQ-08-106`, `REQ-08-114`; `PROFILE-R1-2026-01` Sections 4.1 and 7 | `non-blocking` |
| `OD-08-002` | Are arbitrary branching vector networks first-class authoring data or import-only content? | R1 authors canonical open/closed paths and compound paths only. Arbitrary branching networks may import as equivalent canonical paths when lossless; otherwise Story preserves the source and exposes an editable-vector or declared visual fallback with a compatibility issue. | Design Authoring and Document Architecture | Before adding network-specific authoring operations or claiming editable vector-network support | `REQ-08-039` through `REQ-08-050`, `REQ-08-128` through `REQ-08-135`; `PROFILE-R1-2026-01` Section 7 | `non-blocking` |
| `OD-08-003` | Which instance structural overrides are allowed beyond mapped properties and visibility? | R1 permits only definition-exposed typed property mappings and visibility controlled by an exposed boolean property. Adding, deleting, reparenting, or freely moving definition-owned descendants in an instance is blocked; the user must edit the definition or explicitly detach the instance. | Component Systems and Document Architecture | Before implementing the instance override store or proposing any structural-override operation | `REQ-08-084` through `REQ-08-093`; `R1-WF-07` | `R1-blocking` |
| `OD-08-004` | Which font-embedding paths are legally and technically available by platform and output? | Story embeds font bytes only when an inspected license/embedding permission and the target adapter both allow it. Otherwise it preserves requested-family metadata, uses the deterministic substitute, and reports the degradation; outlining is available only as an explicit copy/output choice that names editability and accessibility loss. | Typography, Output Engineering, and Legal | Before enabling embedding for a new font source, platform, or output adapter | `REQ-08-054`, `REQ-08-060` through `REQ-08-064`, `REQ-08-134`, `REQ-08-135`; `R1-WF-05` and `R1-WF-24` | `R1-blocking` |
| `OD-08-005` | Which SVG metadata profile carries both live text and editable source? | Portable R1 SVG exposes exactly two text policies: standards-based live text or outlined paths. Dual live-text/editable-source metadata export is disabled, and R1 emits no Story-private editable-source metadata. The selected standard representation and its editability/accessibility consequences are recorded in the compatibility report. | Interchange Engineering and Document Architecture | Before enabling dual-source export, claiming dual-source interoperability, or accepting a Story SVG metadata schema | `REQ-08-133` through `REQ-08-135`; `R1-WF-04` and `R1-WF-09` | `pre-implementation` |

Each default is implementable without the future ADR and remains subject to this volume's preservation, fallback, and compatibility-report contracts.