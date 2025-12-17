# Shapes / Vector System — Topic Tree & Spec Map (Source of Truth)

**Status**: Draft
**Owner**: Engineering
**Last Updated**: December 15, 2025

This is the **canonical table of contents** for building a Figma-class vector/shapes system inside Story.

- Every branch below answers: “If we were implementing this, what do we still need to decide/specify?”
- Each branch maps to a **small spec file** (or an existing Story spec) so nothing is left underspecified.
- This doc is a map only; detailed requirements live in the linked specs.

Principles: `documentation/00-product/principles.md`

---

## 0. Quality bar (required for each spec file)
Each spec linked from this map must include, at minimum:
- Current implementation alignment notes (DOM renderer + canvas overlay, modes, `.str` copy-all semantics).
- Explicit decisions (no “spec must choose one” left unresolved for v1-critical behavior).
- Non-goals (v1 boundaries).
- Acceptance criteria that can be tested (Vitest/Playwright or manual steps).
- Risks/failure modes + mitigations (especially booleans/masks).
- Integration points (files/systems in current Story).

Quality critique:
- The map is only as good as the weakest linked file. Draft stubs must be upgraded to the quality bar above before implementation begins.

---

## 1. Foundations & Core Philosophy

### 1.1 Conceptual Model
- Vector-first vs raster-first
- Parametric geometry vs freeform geometry
- Non-destructive editing principles
- Derived vs authoritative data
- Determinism and replayability

Spec: [01-system-architecture.md](./01-system-architecture.md)

### 1.2 Coordinate Systems
- Local / parent / world / viewport / screen
- DPI / device pixel ratio strategy

Spec: [03-coordinate-systems.md](./03-coordinate-systems.md)

### 1.3 Precision & Numerics
- float32 vs float64 policy
- Error accumulation and epsilon rules
- Snapping vs “true geometry”
- Degenerate geometry handling

Spec: [04-precision-and-numerics.md](./04-precision-and-numerics.md)

---

## 2. Document & Scene Graph Architecture

### 2.1 Document Model
- Lifecycle, versioning, migrations, backward compatibility

Spec: [02-data-model-and-serialization.md](./02-data-model-and-serialization.md)

### 2.2 Scene Graph
- Node identity/IDs
- Parent-child rules
- Traversal order
- Z-order vs hierarchy
- Visibility/locking

Spec: [05-scene-graph-and-node-types.md](./05-scene-graph-and-node-types.md)

### 2.3 Node Types
- Shape nodes
- Vector nodes
- Group nodes
- Frame/layout nodes (existing)
- Boolean nodes
- Mask nodes
- Effect nodes (existing effects stack)

Spec: [05-scene-graph-and-node-types.md](./05-scene-graph-and-node-types.md)

### 2.4 Transform System
- Affine transforms
- Matrix composition/inheritance
- Pivot rules
- Bounding boxes

Spec: [06-transform-system.md](./06-transform-system.md)

---

## 3. Geometry System (Mathematical core)

### 3.1 Parametric Geometry
- Rectangle/ellipse/polygon/star/line
- Corner radii and corner smoothing math

Spec: [07-parametric-geometry.md](./07-parametric-geometry.md)

### 3.2 Path Representation
- Paths vs subpaths
- Open vs closed
- Fill rules
- Winding direction
- Self-intersection rules

Spec: [08-path-representation.md](./08-path-representation.md)

### 3.2a Vector Networks (Figma-class)
- Branching topology (T-junctions)
- Region fills derived from faces
- Repair + determinism requirements

Spec: [08a-vector-networks.md](./08a-vector-networks.md)

### 3.3 Segment Types
- Line segments
- Cubic Bézier curves
- Segment split/join

Spec: [09-segments-and-beziers.md](./09-segments-and-beziers.md)

### 3.4 Control Points & Nodes
- Anchor points, handles
- Relative vs absolute handles
- Node types (corner/smooth/symmetric)

Spec: [10-control-points-and-handles.md](./10-control-points-and-handles.md)

### 3.5 Continuity & Smoothness
- C0/C1
- Constraints enforcement
- Handle locking/breaking
- Auto-smoothing rules

Spec: [11-continuity-and-smoothness.md](./11-continuity-and-smoothness.md)

---

## 4. Vector Editing Model (User → geometry)

### 4.1 Editing Modes
- Object mode
- Vector mode
- Boolean edit mode
- Mask edit mode

Spec: [20-interaction-modes-and-state-machine.md](./20-interaction-modes-and-state-machine.md)

### 4.2 Selection System
- Hit testing
- Node/segment selection
- Multi-selection
- Lasso selection

Specs:
- Engine hit testing: [12-hit-testing.md](./12-hit-testing.md)
- UX selection states: [22-selection-and-focus-ux.md](./22-selection-and-focus-ux.md)

### 4.3 Editing Operations
- Move node/handle
- Add/remove segment
- Convert node type
- Split/join paths

Spec: [21-vector-editing-operations.md](./21-vector-editing-operations.md)

### 4.4 Constraints & Snapping
- Grid snapping
- Angle snapping
- Smart guides
- Alignment

Existing spec: `documentation/01-specs/canvas/canvas-interaction.md`
Shapes delta spec: [23-snapping-and-guides-shapes.md](./23-snapping-and-guides-shapes.md)

### 4.5 Tools & Toolbar UX (Shape creation)
- Tool slots and dropdown menu for primitives (rectangle/ellipse/line/arrow/polygon/star)
- Keyboard shortcuts aligned with design-tool muscle memory
- Minimal inspector controls for parametric primitives (polygon/star)

Spec: [39-toolbar-tools-and-creation-ux.md](./39-toolbar-tools-and-creation-ux.md)

---

## 5. Boolean Geometry System

### 5.1 Boolean Operations
- Union/subtract/intersect/exclude

### 5.2 Boolean Node Architecture
- Operand references
- Non-destructive storage
- Evaluation order
- Nested booleans

### 5.3 Boolean Algorithms
- Normalization
- Intersection detection
- Winding resolution
- Output generation

### 5.4 Failure Handling
- Degenerate results
- Empty paths
- Numeric instability
- Auto-repair strategies

Spec: [13-boolean-geometry-system.md](./13-boolean-geometry-system.md)

---

## 6. Styling & Paint System

### 6.1 Style Abstraction
- Style as first-class
- Shared styles/overrides/detachment (where applicable)

### 6.2 Fills
- Solid/gradients/image/multiple fills

### 6.3 Strokes
- Width/alignment/caps/joins/dashes
- Stroke expansion math

### 6.4 Effects
- Shadows/blur/blend/effect ordering

Specs:
- Shapes integration (no duplication): [14-style-and-paint-integration.md](./14-style-and-paint-integration.md)
- Design system compliance: [16-design-system-alignment.md](./16-design-system-alignment.md)

---

## 7. Masking & Clipping

### 7.1 Mask model
### 7.2 Nested masks
### 7.3 Mask editing + interactions

Spec: [15-masking-and-clipping.md](./15-masking-and-clipping.md)

---

## 8. Rendering Architecture

### 8.1 Rendering pipeline
### 8.2 Tessellation strategy (required)
### 8.3 Fill tessellation
### 8.4 Stroke tessellation
### 8.5 Anti-aliasing
### 8.6 GPU architecture

Specs:
- Rendering overview: [16-rendering-architecture.md](./16-rendering-architecture.md)
- Tessellation + AA (canonical): [16a-tessellation-and-aa.md](./16a-tessellation-and-aa.md)

---

## 9. Caching & Performance

### 9.1 Cache layers
### 9.2 Invalidation
### 9.3 Partial redraw
### 9.4 Large docs

Spec: [17-caching-and-performance.md](./17-caching-and-performance.md)

---

## 10. Edit Operation & History System

### 10.1 Operation model
### 10.2 Categories
### 10.3 Undo/redo
### 10.4 Collaboration readiness

Specs:
- Undo/redo compatibility (current): [11-undo-redo-and-operations.md](./11-undo-redo-and-operations.md)
- Collaboration-ready operation model (contract, even while using snapshots): [18-operation-model-collaboration-readiness.md](./18-operation-model-collaboration-readiness.md)

---

## 11. Serialization & Interop

### 11.1 Internal serialization
### 11.2 SVG export
### 11.3 Import

Spec: [19-serialization-and-interop.md](./19-serialization-and-interop.md)

### 11.3 Figma clipboard paste → editable elements
- Clipboard payload extraction (`image/svg+xml`, `text/html`, `text/plain`)
- Sanitization + limits
- SVG/HTML → IR → Story element conversion
- Text import + outline fallback
- Paint/effects mapping + deterministic degrade ladder

Spec: [19a-figma-clipboard-import.md](./19a-figma-clipboard-import.md)

---

## 12. Tooling & Developer Ergonomics

### 12.1 Debugging tools
### 12.2 Testing strategy
### 12.3 Feature flagging

Spec: [24-tooling-and-testing.md](./24-tooling-and-testing.md)

---

## 13. Product-Level Concerns

### 13.1 UX performance guarantees
### 13.2 Failure modes
### 13.3 Scalability

Spec: [25-product-level-requirements.md](./25-product-level-requirements.md)

---

# Interaction / UX System Tree (Engine + UI/UX + Interaction)

## 0. Interaction Philosophy

### 0.1 Mental model alignment
### 0.2 Direct manipulation principles
### 0.3 Discoverability vs power

Spec: [20-interaction-modes-and-state-machine.md](./20-interaction-modes-and-state-machine.md)

## 1. Canvas & Viewport UI

Existing spec: `documentation/01-specs/canvas/canvas-interaction.md`
Shapes delta spec: [26-canvas-and-viewport-shapes.md](./26-canvas-and-viewport-shapes.md)

## 2. Selection & Focus System (UX)

Spec: [22-selection-and-focus-ux.md](./22-selection-and-focus-ux.md)

## 3. Object-Level Editing UI

Spec: [27-object-editing-ux.md](./27-object-editing-ux.md)

## 4. Vector (Node-Level) Editing UI

Spec: [28-vector-editing-ux.md](./28-vector-editing-ux.md)

## 5. Continuity & Curve UX

Spec: [29-continuity-curve-ux.md](./29-continuity-curve-ux.md)

## 6. Boolean & Mask Interaction UX

Spec: [30-boolean-mask-ux.md](./30-boolean-mask-ux.md)

## 7. Styling UI

Spec: [31-styling-ui.md](./31-styling-ui.md)

## 8. Layer Panel & Hierarchy UX

Spec: [32-layer-panel-ux.md](./32-layer-panel-ux.md)

## 9. Snapping & Guides UX

Spec: [23-snapping-and-guides-shapes.md](./23-snapping-and-guides-shapes.md)

## 10. Keyboard & Gesture System

Spec: [33-keyboard-and-gestures.md](./33-keyboard-and-gestures.md)

## 11. Feedback & System Status

Spec: [34-feedback-and-status.md](./34-feedback-and-status.md)

## 12. Undo/Redo UX

Spec: [35-undo-redo-ux.md](./35-undo-redo-ux.md)

## 13. Performance & Perceived Speed

Spec: [36-perceived-performance.md](./36-perceived-performance.md)

## 14. Accessibility & Inclusivity

Spec: [37-accessibility.md](./37-accessibility.md)

## 15. Customization & Extensibility

Spec: [38-customization-and-extensibility.md](./38-customization-and-extensibility.md)

---

## Alignment artifacts

These keep the specs anchored to existing Story implementations.

- Current implementation inventory: [15-current-implementation-alignment.md](./15-current-implementation-alignment.md)
- Design system alignment: [16-design-system-alignment.md](./16-design-system-alignment.md)
