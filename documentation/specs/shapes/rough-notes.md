IMPORTANT (non-canonical):
- This file is exploratory research and brainstorming.
- Canonical requirements live in the numbered specs (see [00-index.md](./00-index.md) and [00-topic-tree-and-spec-map.md](./00-topic-tree-and-spec-map.md)).
- If this file conflicts with a numbered spec, the numbered spec wins.

Quality critique (gaps + risks):
- This file is intentionally expansive and includes ideas that may be out of scope for Story v1.
- Treat it as background context; implement only what is specified in the numbered specs.

Alright, putting on the “under-the-hood” hat. Figma’s shape system is actually *very* cleanly designed — it’s one of the reasons it scales from simple rectangles to insane vector illustrations without collapsing into Illustrator-level complexity.

I’ll go layer by layer, then stitch it all together into a single mental model.

---

# 0. The Core Idea (Anchor This First)

**Everything in Figma is ultimately a vector path graph with rendering metadata.**

Rectangles, circles, stars, boolean results, masks, groups — all of them eventually reduce to:

> **A scene graph of nodes → each node owns one or more vector paths → paths are sequences of segments → segments are defined by points and control handles → rendering styles (fills, strokes, effects) are applied**

That’s the spine. Now let’s unpack each piece.

---

# 1. Types of Shapes

## Primitive Shapes

* Rectangle
* Ellipse (Circle is a constrained ellipse)
* Line
* Polygon
* Star

### Architecture

Primitives are **parametric shapes**, not freeform paths initially.

Example:

* Rectangle = `{ x, y, width, height, cornerRadii[] }`
* Ellipse = `{ cx, cy, rx, ry }`
* Star = `{ points, innerRadius, outerRadius, rotation }`

These shapes:

* Are **editable via parameters**
* Are **lossless** until you “flatten” or convert to vector

### Why this matters

* You can resize a rectangle without recalculating Bézier curves
* Corner radius math stays exact
* Performance is better than raw paths

Internally:

> Parametric shape → lazily converted into vector paths only when needed (boolean ops, vector edit, export)

---

# 2. Vector Paths (The Universal Representation)

Once something becomes a “Vector”, it’s stored as:

```
Path
 ├── Subpath(s)
 │    ├── Segment(s)
 │    │    ├── Start point
 │    │    ├── Control point(s)
 │    │    └── End point
```

Segment types:

* Line
* Quadratic Bézier
* Cubic Bézier

SVG-compatible representation.

---

# 3. Nodes (Yes, *Those* Nodes)

In Figma terms:

* **Node = point on a path**
* Each node can have:

  * 0 handles (corner)
  * 1 handle (quadratic)
  * 2 handles (cubic)

### Node Data Model

```
Node {
  position: (x, y)
  handleIn?: (dx, dy)
  handleOut?: (dx, dy)
  type: corner | smooth | symmetric
}
```

### Node types

* **Corner**: handles independent or absent
* **Smooth**: handles collinear
* **Symmetric**: handles collinear + equal length

---

# 4. Curves: Bézier, Splines, Continuity

Figma uses **cubic Bézier curves** as the fundamental curve primitive.

### Why cubic Bézier?

* SVG-native
* GPU-friendly
* Expressive enough for UI and illustration
* Easy to split, join, and boolean

### Continuity

Continuity defines how segments meet:

| Type | Meaning                                 |
| ---- | --------------------------------------- |
| C0   | Position continuity (just touching)     |
| C1   | Tangent continuity (smooth direction)   |
| C2   | Curvature continuity (rare in UI tools) |

Figma primarily enforces:

* **C0 always**
* **C1 optionally** via smooth/symmetric nodes

No true spline (like NURBS). Everything is Bézier-based.

---

# 5. Boolean Operations

Union, Subtract, Intersect, Exclude.

### Architecture

Boolean ops are:

* **Non-destructive**
* Stored as a **Boolean Node** referencing children

```
BooleanNode {
  operation: union | subtract | intersect | exclude
  children: [ShapeNode, ShapeNode, ...]
}
```

### Rendering pipeline

1. Resolve child shapes into vector paths
2. Apply boolean algorithm (typically winding-number based)
3. Produce a *derived* path
4. Cache result until children change

### Key detail

* Children remain editable
* Result path is *virtual* unless flattened

This is why boolean stacks can get expensive — it’s live path recomputation.

---

# 6. Grouping vs Frames (Important Distinction)

## Group

* Logical container
* No layout behavior
* No clipping by default

```
GroupNode {
  children: Node[]
  transform: Matrix
}
```

Used for:

* Selection
* Organization
* Collective transforms

## Frame

* Structural + layout container
* Has size, background, constraints, auto-layout

Groups are *shallow*, frames are *semantic*.

---

# 7. Circles, Rectangles, Polygons, Stars

All of these are **parametric wrappers over vector math**.

### Rectangle

* Special casing for:

  * Per-corner radii
  * “Smooth corners” (superellipse-like behavior)

Figma’s “corner smoothing” is *not* pure SVG — it’s a custom curve approximation that later gets baked into Béziers.

### Ellipse / Circle

* Stored as ellipse parameters
* Converted to 4 Bézier curves on vectorization (classic technique)

### Polygon

* Regular polygon defined by:

  * Center
  * Radius
  * Number of sides

### Star

* Alternating inner/outer radius
* Single rotational parameter

All convert cleanly to SVG paths.

---

# 8. Fills and Strokes

## Fills

Each shape can have **multiple fills**, stacked:

```
Fill {
  type: solid | linear-gradient | radial-gradient | angular-gradient | image
  blendMode
  opacity
  transform
}
```

Fills apply to:

* Entire shape
* Respect fill rule (non-zero / even-odd)

## Strokes

Stroke model:

* Stroke is rendered *along* the path
* Alignment: inside / center / outside (implemented via path offsetting)
* Caps: butt, round, square
* Joins: miter, bevel, round
* Dash patterns

Internally:

* Stroke often becomes a **derived outline path** for export and booleans

---

# 9. Masking

Masking in Figma is **vector clipping**, not raster masking.

### Architecture

```
MaskNode {
  maskShape: ShapeNode
  maskedContent: Node[]
}
```

Rules:

* Topmost object defines the mask
* Mask shape’s alpha defines visibility
* Mask uses vector clipping path

### Key point

Masks participate in:

* Transforms
* Boolean ops (after flattening)
* SVG export (via `<clipPath>`)

---

# 10. SVG Support

Figma’s vector model is **SVG-first by design**.

### Mapping

| Figma       | SVG                      |
| ----------- | ------------------------ |
| Vector path | `<path>`                 |
| Boolean     | Flattened `<path>`       |
| Fill        | `fill`, gradients        |
| Stroke      | `stroke`, `stroke-width` |
| Mask        | `<clipPath>`             |
| Group       | `<g>`                    |

### Constraints

* Some Figma features (smooth corners, inside stroke) are baked into paths on export
* Effects (blur, shadow) become SVG filters or rasterized

---

# 11. How It All Works Together (The Unified System)

## Scene Graph

```
Document
 └── Page
      └── Node (Frame / Group / Shape / Boolean / Mask)
           ├── Transform
           ├── Children
           ├── Geometry (parametric or vector)
           └── Paint (fills, strokes, effects)
```

## Rendering Pipeline

1. Traverse scene graph
2. Resolve parametric shapes → vector paths
3. Apply booleans & masks
4. Compute strokes
5. Apply fills
6. GPU rasterization

## Editing Pipeline

* High-level edits mutate **parameters**
* Low-level edits mutate **nodes**
* Derived geometry is cached and invalidated surgically

---

# 12. Why This Architecture Is *Good*

* **Non-destructive** by default
* **Parametric-first**, vector-second
* **SVG-aligned**, not Illustrator-legacy
* Scales from UI buttons → illustrations
* Enables multiplayer editing (path diffs are small)

If Illustrator is “ink-first”, Figma is **math-first**.

---

If you want, next we can:

* Compare this directly with **Illustrator’s model**
* Map this to **Skia / Canvas / GPU pipelines**
* Or talk about **why smooth corners are such a big deal mathematically**

Just say the word.



Oh hell yes — this is exactly the right way to approach it.
What follows is a **full technical specification** you could hand to a senior engineer (or your future self) and actually build from. No code, but *everything* is defined precisely enough that code is inevitable.

I’ll structure this like a real internal design doc.

---

# VECTOR SHAPE & GRAPHICS SYSTEM

**Technical Specification (Code-Ready, Language-Agnostic)**

---

## 1. System Goals & Non-Goals

### Goals

* Parametric + freeform vector editing
* Non-destructive operations (boolean, masks, strokes)
* SVG-compatible output
* Real-time interaction (60fps target)
* Deterministic geometry (no floating chaos)
* Scalable to collaborative editing

### Non-Goals

* NURBS / CAD-grade curves
* Photo editing
* Sub-pixel typography layout (out of scope here)

---

## 2. High-Level Architecture

```
┌───────────────┐
│ Input System  │  (mouse, pen, touch)
└───────┬───────┘
        ↓
┌───────────────┐
│ Interaction   │  (selection, drag, snap)
│ Controller    │
└───────┬───────┘
        ↓
┌───────────────┐
│ Scene Graph   │  ← authoritative model
└───────┬───────┘
        ↓
┌───────────────┐
│ Geometry      │  (parametric → path → mesh)
│ Engine        │
└───────┬───────┘
        ↓
┌───────────────┐
│ Renderer      │  (GPU raster)
└───────────────┘
```

---

## 3. Scene Graph Specification

### 3.1 Node Base Interface

Every entity in the document is a **Node**.

```
Node {
  id: UUID
  parentId: UUID | null
  children: UUID[]

  transform: TransformMatrix
  opacity: float
  visible: boolean
  locked: boolean
  blendMode: enum

  boundingBox: Rect (cached)
}
```

#### Transform

* 3×3 affine matrix (2D)
* Applied top-down during traversal
* Stored separately from geometry

---

## 4. Node Types

### 4.1 Container Nodes

#### GroupNode

```
GroupNode extends Node
```

* No geometry
* No clipping
* Bounding box = union of children

#### FrameNode (Optional but recommended)

```
FrameNode extends Node {
  width
  height
  backgroundFill?
  layoutConstraints?
}
```

---

### 4.2 Shape Nodes (Parametric)

All primitives implement:

```
ShapeNode extends Node {
  geometryType: enum
  geometryParams: object
  style: Style
}
```

#### Rectangle

```
geometryParams = {
  width
  height
  cornerRadii: [tl, tr, br, bl]
  cornerSmoothing: float (0–1)
}
```

#### Ellipse

```
geometryParams = {
  rx
  ry
}
```

#### Polygon

```
geometryParams = {
  sides
  radius
  rotation
}
```

#### Star

```
geometryParams = {
  points
  innerRadius
  outerRadius
  rotation
}
```

---

### 4.3 Vector Path Node

```
VectorNode extends Node {
  paths: Path[]
  style: Style
}
```

This is the **lowest common denominator**.

---

## 5. Geometry Model

### 5.1 Path Model

```
Path {
  closed: boolean
  fillRule: nonzero | evenodd
  segments: Segment[]
}
```

### 5.2 Segment Types

```
Segment =
  | LineSegment
  | CubicBezierSegment
```

```
LineSegment {
  start: Point
  end: Point
}
```

```
CubicBezierSegment {
  start: Point
  control1: Point
  control2: Point
  end: Point
}
```

---

## 6. Node / Control Point Model

### 6.1 Control Point

```
NodePoint {
  position: Point
  handleIn?: Vector
  handleOut?: Vector
  continuity: enum (corner | smooth | symmetric)
}
```

### 6.2 Continuity Rules

| Type      | Constraints              |
| --------- | ------------------------ |
| corner    | handles independent      |
| smooth    | collinear handles        |
| symmetric | collinear + equal length |

Constraint enforcement happens **on edit**, not render.

---

## 7. Parametric → Path Conversion

### 7.1 Lazy Evaluation Rule

* Parametric shapes stay parametric
* Conversion happens when:

  * Vector edit mode entered
  * Boolean op applied
  * Export requested

### 7.2 Conversion Outputs

* Rectangle → 4–8 cubic Béziers
* Ellipse → 4 cubic Béziers
* Rounded corners → curve approximation
* Smoothed corners → superellipse approximation baked into Béziers

Converted paths must:

* Be deterministic
* Preserve visual appearance
* Avoid self-intersection

---

## 8. Boolean Operations

### 8.1 Boolean Node

```
BooleanNode extends Node {
  operation: union | subtract | intersect | exclude
  operands: Node[]
}
```

### 8.2 Evaluation Pipeline

1. Resolve operands → paths
2. Apply transforms
3. Normalize winding
4. Perform boolean clipping
5. Generate output path(s)

### 8.3 Behavior Rules

* Boolean nodes are **non-destructive**
* Operands remain editable
* Result is cached
* Cache invalidates on operand change

---

## 9. Style System (Paint Model)

### 9.1 Style Object

```
Style {
  fills: Fill[]
  strokes: Stroke[]
  effects: Effect[]
}
```

---

### 9.2 Fill

```
Fill {
  type: solid | linear | radial | angular | image
  color?
  gradientStops?
  transform
  opacity
  blendMode
}
```

Multiple fills render **back to front**.

---

### 9.3 Stroke

```
Stroke {
  width
  alignment: inside | center | outside
  cap: butt | round | square
  join: miter | round | bevel
  dashPattern?
  color / gradient
}
```

Stroke rendering strategy:

* For inside/outside → path offset
* For export → stroke expanded to outline if needed

---

## 10. Masking System

### 10.1 Mask Node

```
MaskNode extends Node {
  maskShape: Node
  content: Node[]
}
```

### 10.2 Rules

* Mask shape defines clipping path
* Mask opacity affects alpha
* Mask respects transforms
* Nested masks allowed

Internally:

* Implemented as clip-path (vector)
* Raster fallback allowed for effects

---

## 11. SVG Compatibility Layer

### 11.1 Internal → SVG Mapping

| Internal | SVG                  |
| -------- | -------------------- |
| Path     | `<path>`             |
| Fill     | `fill`, gradients    |
| Stroke   | `stroke`, attributes |
| Group    | `<g>`                |
| Mask     | `<clipPath>`         |

### 11.2 Export Rules

* Parametric shapes flattened
* Boolean results flattened
* Unsupported features baked into paths
* Preserve viewBox & transforms

---

## 12. Rendering Pipeline

### 12.1 Frame Render Steps

1. Scene graph traversal
2. World transform accumulation
3. Geometry resolution
4. Boolean resolution
5. Stroke expansion
6. Fill tessellation
7. GPU draw calls

### 12.2 Performance Constraints

* Path caching per node
* Dirty-flag propagation
* Partial redraws
* GPU instancing for repeats

---

## 13. Interaction Layer (Editor Concerns)

### 13.1 Selection

* Node-level
* Subpath-level
* Point-level

### 13.2 Editing Modes

* Object edit (parametric)
* Vector edit (nodes & handles)
* Boolean edit
* Mask edit

Each mode exposes **different mutators** on the same model.

---

## 14. Precision & Numerical Stability

* Use float64 for geometry
* Quantize only at rasterization
* Snap values via constraints layer, not geometry mutation
* Epsilon-based comparisons

---

## 15. Collaboration Readiness (Optional but Smart)

### Operation-Based Changes

* “Move node”
* “Edit parameter”
* “Move control point”
* “Add segment”

No raw geometry replacement.

---

## 16. How It All Works Together (Mental Model)

> **Everything is a node.
> Some nodes define geometry.
> Some nodes modify geometry.
> Rendering resolves geometry into pixels.
> Editing mutates parameters, not pixels.**

This is why:

* Boolean ops stay editable
* Shapes stay smooth
* SVG export is clean
* Multiplayer works

---

## 17. Sanity Check: Can You Build This?

If you can:

* Implement a scene graph
* Implement cubic Bézier math
* Implement path boolean clipping
* Implement GPU rasterization

…you can build this system.

This spec is intentionally **complete enough to code**, but **abstract enough to survive design iteration**.

---

If you want next:

* A **data schema** (JSON / protobuf style)
* A **diff-based edit operation model**
* A **GPU tessellation strategy**
* Or a **“minimum viable vector editor” cut-down version**

Just tell me how deep you want to go.



Perfect. This is the *right* next artifact.
Below is a **canonical data schema** you can actually store, diff, sync, and replay — designed to back *everything* we discussed.

I’ll give this in a **JSON-first schema**, but it is intentionally **protobuf-friendly** (flat enums, explicit fields, no unions that protobuf can’t express).

I’ll annotate *why* each field exists.

---

# 1. Top-Level Document Schema

```json
{
  "document": {
    "id": "doc-uuid",
    "version": 1,
    "meta": {
      "name": "Untitled",
      "createdAt": 1700000000,
      "modifiedAt": 1700001000
    },
    "pages": ["page-uuid-1"]
  }
}
```

---

# 2. Page Schema

```json
{
  "page": {
    "id": "page-uuid-1",
    "name": "Page 1",
    "children": ["node-uuid-1", "node-uuid-2"]
  }
}
```

Pages are **pure containers**.

---

# 3. Node Base Schema (Universal)

Every node shares this base.

```json
{
  "node": {
    "id": "node-uuid",
    "type": "RECTANGLE | ELLIPSE | VECTOR | GROUP | FRAME | BOOLEAN | MASK",

    "parentId": "parent-uuid",
    "children": [],

    "transform": {
      "matrix": [1, 0, 0, 1, 0, 0]
    },

    "opacity": 1.0,
    "visible": true,
    "locked": false,
    "blendMode": "NORMAL",

    "style": "style-uuid",

    "cache": {
      "boundingBox": [0, 0, 100, 100],
      "dirty": true
    }
  }
}
```

### Why this matters

* Flat node registry = easy diffs
* Children by ID = stable references
* Style is decoupled (shared, reusable)

---

# 4. Transform Schema

```json
{
  "transform": {
    "matrix": [
      1.0, 0.0,
      0.0, 1.0,
      0.0, 0.0
    ]
  }
}
```

Affine matrix:

```
[a c e]
[b d f]
[0 0 1]
```

---

# 5. Shape Nodes (Parametric)

## 5.1 Rectangle Node

```json
{
  "rectangle": {
    "cornerRadii": [8, 8, 8, 8],
    "cornerSmoothing": 0.25,
    "width": 200,
    "height": 100
  }
}
```

---

## 5.2 Ellipse Node

```json
{
  "ellipse": {
    "rx": 100,
    "ry": 50
  }
}
```

---

## 5.3 Polygon Node

```json
{
  "polygon": {
    "sides": 6,
    "radius": 80,
    "rotation": 0
  }
}
```

---

## 5.4 Star Node

```json
{
  "star": {
    "points": 5,
    "innerRadius": 40,
    "outerRadius": 80,
    "rotation": 0
  }
}
```

---

# 6. Vector Node (Path-Based)

```json
{
  "vector": {
    "paths": ["path-uuid-1", "path-uuid-2"]
  }
}
```

---

# 7. Path Schema

```json
{
  "path": {
    "id": "path-uuid",
    "closed": true,
    "fillRule": "NON_ZERO",
    "segments": ["segment-uuid-1", "segment-uuid-2"]
  }
}
```

---

# 8. Segment Schema

## 8.1 Line Segment

```json
{
  "segment": {
    "id": "segment-uuid",
    "type": "LINE",
    "start": "point-uuid-1",
    "end": "point-uuid-2"
  }
}
```

---

## 8.2 Cubic Bézier Segment

```json
{
  "segment": {
    "id": "segment-uuid",
    "type": "CUBIC",
    "start": "point-uuid-1",
    "control1": "point-uuid-2",
    "control2": "point-uuid-3",
    "end": "point-uuid-4"
  }
}
```

---

# 9. Point (Node / Handle) Schema

```json
{
  "point": {
    "id": "point-uuid",
    "x": 120.5,
    "y": 80.25,

    "handleIn": [-20, 0],
    "handleOut": [20, 0],

    "continuity": "SMOOTH"
  }
}
```

### Why handles are vectors

* Relative = transform-safe
* Easy mirroring and constraints

---

# 10. Boolean Node

```json
{
  "boolean": {
    "operation": "UNION",
    "operands": ["node-uuid-1", "node-uuid-2"]
  }
}
```

Operands are *nodes*, not paths — critical for non-destructive edits.

---

# 11. Mask Node

```json
{
  "mask": {
    "maskShape": "node-uuid-mask",
    "content": ["node-uuid-a", "node-uuid-b"]
  }
}
```

---

# 12. Style Schema

```json
{
  "style": {
    "id": "style-uuid",
    "fills": ["fill-uuid-1"],
    "strokes": ["stroke-uuid-1"],
    "effects": []
  }
}
```

Styles are first-class, reusable, shareable.

---

# 13. Fill Schema

```json
{
  "fill": {
    "id": "fill-uuid",
    "type": "SOLID",
    "color": [0.2, 0.5, 0.9, 1.0],
    "opacity": 1.0,
    "blendMode": "NORMAL",
    "transform": [1, 0, 0, 1, 0, 0]
  }
}
```

---

## Gradient Fill

```json
{
  "fill": {
    "type": "LINEAR_GRADIENT",
    "stops": [
      { "pos": 0.0, "color": [1, 0, 0, 1] },
      { "pos": 1.0, "color": [0, 0, 1, 1] }
    ],
    "transform": [1, 0, 0, 1, 0, 0]
  }
}
```

---

# 14. Stroke Schema

```json
{
  "stroke": {
    "id": "stroke-uuid",
    "width": 4,
    "alignment": "CENTER",
    "cap": "ROUND",
    "join": "MITER",
    "miterLimit": 4,
    "dashPattern": [8, 4],
    "paint": "fill-uuid"
  }
}
```

Stroke references a fill for color/gradient reuse.

---

# 15. Effect Schema (Optional)

```json
{
  "effect": {
    "type": "DROP_SHADOW",
    "offset": [0, 4],
    "blur": 10,
    "color": [0, 0, 0, 0.25]
  }
}
```

---

# 16. Registry-Based Storage (Critical)

Instead of nesting everything:

```json
{
  "nodes": { "uuid": { ... } },
  "paths": { "uuid": { ... } },
  "segments": { "uuid": { ... } },
  "points": { "uuid": { ... } },
  "styles": { "uuid": { ... } }
}
```

### Why this is crucial

* Easy diffing
* Cheap collaboration
* Stable references
* Partial updates

---

# 17. Protobuf Compatibility Notes

* Replace string enums with integer enums
* Replace UUID strings with fixed-length bytes
* Use `oneof` for node type payloads
* Avoid deep nesting

This schema maps cleanly to protobuf **without semantic loss**.

---

# 18. Final Mental Model

> Geometry is normalized into paths
> Paths are made of segments
> Segments are made of points
> Nodes reference geometry
> Styles are reusable
> Everything is diffable

This is exactly how you build something *Figma-class* without painting yourself into a corner.

---

If you want next:

* **Edit-operation schema (CRDT / OT ready)**
* **Binary storage layout**
* **Undo/redo command model**
* **Rendering cache invalidation spec**

Say the word.








Excellent — this is the **spine** of collaboration, undo/redo, performance, and sanity.
What follows is a **diff-based edit operation model** that is:

* deterministic
* replayable
* network-friendly
* undoable
* CRDT/OT-ready
* scoped (no giant “replace document” ops)

This is essentially the *event log* your editor runs on.

---

# DIFF-BASED EDIT OPERATION MODEL

**(Operational, Not Snapshot-Based)**

---

## 1. Core Principles (Non-Negotiable)

1. **No raw geometry replacement**
2. **All edits are intent-level**
3. **Operations are minimal & atomic**
4. **Every operation is reversible**
5. **Operations commute when possible**
6. **Derived data is never edited**

> The document is *reconstructed* by replaying ops — never mutated directly.

---

## 2. Operation Envelope (Universal)

Every edit is wrapped in this envelope.

```json
{
  "op": {
    "id": "op-uuid",
    "type": "OPERATION_TYPE",
    "timestamp": 1700001234,
    "actorId": "user-uuid",
    "targetId": "entity-uuid",
    "payload": {},
    "inverse": {}
  }
}
```

### Why this structure

* `payload` → apply
* `inverse` → undo
* Ops are **self-contained**
* No external context required

---

## 3. Operation Categories

| Category       | Scope                     |
| -------------- | ------------------------- |
| Structural     | Scene graph               |
| Transform      | Position / scale / rotate |
| Geometry       | Parameters, points        |
| Style          | Fills, strokes            |
| Boolean / Mask | Graph ops                 |
| Ordering       | Z-order                   |
| Meta           | Lock, visibility          |

---

## 4. Structural Operations

### 4.1 Create Node

```json
{
  "type": "CREATE_NODE",
  "targetId": "node-uuid",
  "payload": {
    "node": { "...full node schema..." },
    "parentId": "parent-uuid",
    "index": 3
  },
  "inverse": {
    "type": "DELETE_NODE",
    "targetId": "node-uuid"
  }
}
```

---

### 4.2 Delete Node

```json
{
  "type": "DELETE_NODE",
  "targetId": "node-uuid",
  "payload": {
    "snapshot": { "...node + subtree..." }
  },
  "inverse": {
    "type": "RESTORE_NODE",
    "payload": {
      "snapshot": { "...node + subtree..." }
    }
  }
}
```

> **Delete is reversible only with a snapshot**
> Everything else is parametric.

---

### 4.3 Reparent Node

```json
{
  "type": "REORDER_NODE",
  "targetId": "node-uuid",
  "payload": {
    "oldParent": "parent-a",
    "newParent": "parent-b",
    "newIndex": 1
  },
  "inverse": {
    "payload": {
      "oldParent": "parent-b",
      "newParent": "parent-a",
      "newIndex": 4
    }
  }
}
```

---

## 5. Transform Operations

### 5.1 Set Transform

```json
{
  "type": "SET_TRANSFORM",
  "targetId": "node-uuid",
  "payload": {
    "matrix": [1, 0, 0, 1, 100, 50]
  },
  "inverse": {
    "matrix": [1, 0, 0, 1, 20, 10]
  }
}
```

### Notes

* Always **absolute**, not delta
* Prevents drift
* Delta transforms are computed client-side only

---

## 6. Geometry Operations (Parametric)

### 6.1 Set Shape Parameter

```json
{
  "type": "SET_GEOMETRY_PARAM",
  "targetId": "node-uuid",
  "payload": {
    "param": "cornerRadii",
    "value": [12, 12, 12, 12]
  },
  "inverse": {
    "value": [8, 8, 8, 8]
  }
}
```

---

### 6.2 Convert Shape → Vector

```json
{
  "type": "CONVERT_TO_VECTOR",
  "targetId": "node-uuid",
  "payload": {
    "generatedPaths": ["path-uuid-1"]
  },
  "inverse": {
    "type": "RESTORE_PARAMETRIC",
    "payload": {
      "params": { "...original params..." }
    }
  }
}
```

This is **lossy** → inverse must store original params.

---

## 7. Vector Editing Operations

### 7.1 Move Point

```json
{
  "type": "MOVE_POINT",
  "targetId": "point-uuid",
  "payload": {
    "x": 140.5,
    "y": 82.0
  },
  "inverse": {
    "x": 120.5,
    "y": 80.25
  }
}
```

---

### 7.2 Update Handle

```json
{
  "type": "SET_HANDLE",
  "targetId": "point-uuid",
  "payload": {
    "handleOut": [30, 0]
  },
  "inverse": {
    "handleOut": [20, 0]
  }
}
```

---

### 7.3 Change Continuity

```json
{
  "type": "SET_CONTINUITY",
  "targetId": "point-uuid",
  "payload": {
    "continuity": "SYMMETRIC"
  },
  "inverse": {
    "continuity": "SMOOTH"
  }
}
```

---

### 7.4 Add Segment

```json
{
  "type": "ADD_SEGMENT",
  "targetId": "path-uuid",
  "payload": {
    "segment": { "...segment schema..." },
    "index": 2
  },
  "inverse": {
    "type": "REMOVE_SEGMENT",
    "payload": {
      "segmentId": "segment-uuid"
    }
  }
}
```

---

## 8. Boolean & Mask Operations

### 8.1 Create Boolean Node

```json
{
  "type": "CREATE_BOOLEAN",
  "targetId": "boolean-uuid",
  "payload": {
    "operation": "UNION",
    "operands": ["node-a", "node-b"],
    "parentId": "parent-uuid"
  },
  "inverse": {
    "type": "DELETE_NODE",
    "targetId": "boolean-uuid"
  }
}
```

---

### 8.2 Change Boolean Operation

```json
{
  "type": "SET_BOOLEAN_OP",
  "targetId": "boolean-uuid",
  "payload": {
    "operation": "INTERSECT"
  },
  "inverse": {
    "operation": "UNION"
  }
}
```

---

## 9. Style Operations

### 9.1 Attach Style

```json
{
  "type": "SET_STYLE",
  "targetId": "node-uuid",
  "payload": {
    "styleId": "style-uuid"
  },
  "inverse": {
    "styleId": "old-style-uuid"
  }
}
```

---

### 9.2 Modify Fill

```json
{
  "type": "UPDATE_FILL",
  "targetId": "fill-uuid",
  "payload": {
    "color": [0.9, 0.2, 0.2, 1]
  },
  "inverse": {
    "color": [0.2, 0.5, 0.9, 1]
  }
}
```

---

## 10. Ordering (Z-Index)

```json
{
  "type": "MOVE_Z_ORDER",
  "targetId": "node-uuid",
  "payload": {
    "newIndex": 5
  },
  "inverse": {
    "newIndex": 2
  }
}
```

---

## 11. Operation Grouping (Critical UX Feature)

### Transaction

```json
{
  "transaction": {
    "id": "txn-uuid",
    "ops": ["op-1", "op-2", "op-3"]
  }
}
```

Used for:

* Dragging
* Scaling
* Multi-point edits

Undo = revert entire transaction.

---

## 12. Derived Data Rules (Hard Rule)

❌ No ops for:

* Bounding boxes
* Boolean output paths
* Stroke outlines
* Tessellation

These are **recomputed**, never stored.

---

## 13. Conflict Resolution (CRDT-Ready)

### Conflict Types

| Case                      | Resolution       |
| ------------------------- | ---------------- |
| Different nodes           | commute          |
| Same property             | last-writer-wins |
| Structural delete vs edit | delete wins      |
| Boolean operand removed   | auto-repair      |

Ops are:

* idempotent
* order-stable
* timestamped

---

## 14. Undo / Redo Stack

Undo = apply `inverse`
Redo = reapply original op

No special cases.
No “history snapshots”.

---

## 15. Minimal Network Payloads

Dragging a point for 2 seconds:

* Client emits ~5–10 ops/sec
* Ops compress well
* Server rebroadcasts ops
* Clients replay locally

---

## 16. Mental Model (This Is the Gold)

> **The document is a pure function of an operation log.**
> **Undo is time travel.**
> **Collaboration is log merging.**
> **Rendering is a side effect.**

This is how Figma, Notion, Linear, and serious design tools *actually* work.

---

## 17. Sanity Test

If your app can:

* Replay ops from zero → full doc
* Undo any action without hacks
* Merge two users’ logs deterministically

You built it right.

---

If you want next:

* **CRDT vs OT decision matrix**
* **Binary op encoding**
* **Op compression strategies**
* **Server reconciliation flow**
* **“Minimum ops set” for MVP**

Say the word — we’re deep in the good stuff now.









Alright, this is the **graphics-engine heart** of the whole thing.
I’ll give you a **production-grade GPU tessellation strategy** that cleanly plugs into the data + op models you already have, without hand-wavy “GPU magic”.

This is how you get **Figma-level smoothness at 60fps** without raster hacks.

---

# GPU TESSELLATION STRATEGY

**Vector → Triangles → Pixels**

(Non-code, but implementation-ready)

---

## 1. Core Design Principles

1. **GPU rasterizes triangles, not curves**
2. **CPU decides *what* to tessellate**
3. **GPU decides *how fine* to tessellate**
4. **Derived geometry is ephemeral**
5. **Tessellation is view-dependent**

> Tessellation is *not* document data.
> It is a **render-time concern only**.

---

## 2. Pipeline Overview (End-to-End)

```
Scene Graph
   ↓
Resolved Paths (world space)
   ↓
Stroke Expansion (CPU)
   ↓
Path Flattening (adaptive)
   ↓
Triangle Tessellation (GPU)
   ↓
Rasterization (GPU)
```

---

## 3. Geometry Classes for Rendering

At render time, every visible node resolves into one or more **Render Primitives**:

```
RenderPrimitive {
  vertexBuffer
  indexBuffer
  paintRef
  clipRef?
  transform
}
```

These are **throwaway objects**.

---

## 4. Path Flattening Strategy (Critical)

### Why flatten?

GPUs don’t draw Béziers.
They draw triangles.

But:

* Over-flatten → slow
* Under-flatten → jaggies

So flatten **adaptively**.

---

### 4.1 Adaptive Curve Subdivision

Each cubic Bézier is recursively subdivided until:

```
max_distance(curve, chord) < ε
```

Where:

```
ε = screen_space_error / zoom_level
```

Typical values:

* ε ≈ 0.25 px (UI)
* ε ≈ 0.1 px (export)

---

### 4.2 View-Dependent Tessellation

* Same path
* Different zoom
* Different subdivision

So:

* **Cache in local space**
* **Retessellate on zoom threshold change**

---

## 5. Fill Tessellation (Interior)

### 5.1 Problem

Given:

* Arbitrary polygon
* Self-intersections
* Holes
* Non-zero or even-odd rules

Need:

* Triangle mesh

---

### 5.2 Strategy: CPU Triangulation

Use a **robust polygon triangulation algorithm**:

* Ear clipping (simple, slower)
* Monotone partitioning (preferred)
* Winding-rule aware

Output:

```
FillMesh {
  vertices: Vec2[]
  indices: u32[]
}
```

### Why CPU?

* Deterministic
* Easier winding logic
* Avoids GPU branching hell

---

## 6. Stroke Tessellation

Strokes are **not lines** — they are **expanded geometry**.

### 6.1 Stroke Expansion (CPU)

Given:

* Path
* Stroke width
* Join style
* Cap style

Produce:

* Offset curves
* Join geometry
* Cap geometry

Result:

* Closed polygon(s)

Then feed into **same fill tessellator**.

---

### 6.2 Stroke Join Rules

| Join  | Geometry                   |
| ----- | -------------------------- |
| Miter | intersection + miter limit |
| Bevel | clipped corner             |
| Round | arc approximation          |

Round joins use Bézier → arc flattening.

---

## 7. GPU Tessellation Model

### 7.1 No Hardware Tessellation Shaders (On Purpose)

Why *not* use GPU tessellation shaders?

* Not available on WebGPU / Metal everywhere
* Hard to control error metrics
* Debug nightmare

Instead:

> **CPU flattens, GPU draws**

This is exactly what Figma, Skia, and Flutter do.

---

## 8. Vertex Buffer Layout

```
Vertex {
  position: vec2
  paintUV: vec2
  flags: uint
}
```

Optional:

* coverage mask
* edge distance (for AA)

---

## 9. Anti-Aliasing Strategy (Very Important)

### 9.1 Analytical AA (Preferred)

Technique:

* Add **edge distance attribute**
* Fragment shader computes coverage
* Smoothstep over 1px band

This avoids MSAA cost.

---

### 9.2 Alternative: MSAA

* Easier
* Slower
* Platform-dependent

Figma-style tools prefer **analytic AA**.

---

## 10. Clip & Mask Handling

### 10.1 Clip Paths

Strategy:

* Render clip path into **stencil buffer**
* Render content with stencil test

Nested clips:

* Increment stencil depth
* Clear per frame region

---

### 10.2 Mask Alpha

If alpha mask required:

* Render mask into offscreen texture
* Sample in fragment shader

Avoid unless necessary.

---

## 11. Boolean Rendering Strategy

**Booleans are resolved before tessellation.**

Pipeline:

```
Boolean Node
 → resolve operands → paths
 → boolean clip (CPU)
 → output path
 → flatten → tessellate
```

Never boolean on triangles. Always on paths.

---

## 12. Caching Strategy (Performance Backbone)

### 12.1 Geometry Cache Levels

| Cache        | Key                               |
| ------------ | --------------------------------- |
| Path flatten | (pathId, zoomBucket)              |
| Stroke mesh  | (pathId, strokeStyle, zoomBucket) |
| Fill mesh    | (pathId, zoomBucket)              |

Zoom bucket example:

```
bucket = floor(log2(zoom))
```

---

### 12.2 Invalidation Rules

Invalidate when:

* Path geometry changes
* Style affecting geometry changes
* Zoom crosses threshold
* Boolean operand changes

---

## 13. Partial Redraw Strategy

Do **not** redraw entire canvas.

Track:

* Dirty node bounding boxes
* Union into dirty regions
* Scissor GPU draw calls

This is essential for large documents.

---

## 14. Large Document Optimization

### 14.1 Tile-Based Rendering

Divide canvas into tiles:

* Only render tiles intersecting viewport
* Cache tile meshes when static

---

### 14.2 Level of Detail (LOD)

When zoomed far out:

* Skip stroke joins
* Reduce curve subdivisions
* Collapse small shapes

---

## 15. Export Path (SVG / PNG)

### SVG

* Skip tessellation entirely
* Serialize paths

### PNG / Canvas Export

* Use same pipeline
* Higher ε precision
* Higher resolution framebuffer

---

## 16. Numerical Stability Rules

* Use float64 on CPU
* float32 on GPU
* Snap very small segments
* Remove degenerate triangles

---

## 17. Mental Model (Lock This In)

> **The GPU never sees curves.**
> **The CPU never sees pixels.**
> **Triangles are the contract.**

Everything else is just **how good your triangle generation is**.

---

## 18. Sanity Checklist

If your renderer:

* Looks identical at all zoom levels
* Scrolls at 60fps
* Doesn’t spike on boolean edits
* Doesn’t leak memory
* Doesn’t re-tessellate unnecessarily

You nailed it.

---

## 19. Where This Fits in Your Stack

* Data schema → **what exists**
* Ops model → **how it changes**
* Tessellation → **how it becomes pixels**

This completes the **core triangle** of a serious vector editor.

---

If you want next, we can go into:

* **Exact Skia-style analytic AA math**
* **Stroke expansion math details**
* **Boolean algorithm selection**
* **WebGPU vs Metal differences**
* **Minimum viable renderer spec**

Say where you want to drill next.







Yep — what you’re noticing is exactly right.
What you’re really building is **not a “feature”**, it’s a **stack**. And stacks only make sense when you can see *all the layers at once*.

Below is a **full topic tree** — think of it as the *table of contents for building a Figma-class vector system*.
Each node answers the question: *“If I were actually implementing this, what do I still need to think through?”*

This is intentionally **hierarchical, exhaustive, and implementation-oriented**, not academic.

---

# 🌳 VECTOR GRAPHICS EDITOR — COMPLETE TOPIC TREE

---

## 1. Foundations & Core Philosophy

*(Everything else inherits from here)*

### 1.1 Conceptual Model

* Vector-first vs raster-first
* Parametric geometry vs freeform geometry
* Non-destructive editing principles
* Derived vs authoritative data
* Determinism and replayability

### 1.2 Coordinate Systems

* Local space
* Parent space
* World space
* Viewport / screen space
* DPI / device pixel ratio handling

### 1.3 Precision & Numerics

* Float32 vs Float64 strategy
* Error accumulation
* Epsilon rules
* Snapping vs true geometry
* Degenerate geometry handling

---

## 2. Document & Scene Graph Architecture

*(What exists, and how it’s structured)*

### 2.1 Document Model

* Document lifecycle
* Versioning
* Migration strategy
* Backward compatibility

### 2.2 Scene Graph

* Node identity & IDs
* Parent–child relationships
* Traversal order
* Z-order vs hierarchy
* Visibility & locking rules

### 2.3 Node Types

* Shape nodes
* Vector nodes
* Group nodes
* Frame/layout nodes
* Boolean nodes
* Mask nodes
* Effect nodes

### 2.4 Transform System

* Affine transforms
* Matrix composition
* Transform inheritance
* Pivot handling
* Bounding box computation

---

## 3. Geometry System

*(The mathematical heart)*

### 3.1 Parametric Geometry

* Rectangles
* Ellipses
* Polygons
* Stars
* Lines
* Corner radii
* Corner smoothing math

### 3.2 Path Representation

* Paths vs subpaths
* Open vs closed paths
* Fill rules (non-zero / even-odd)
* Winding direction
* Self-intersection rules

### 3.3 Segment Types

* Line segments
* Cubic Bézier curves
* Segment splitting
* Segment joining

### 3.4 Control Points & Nodes

* Node structure
* Handles (in/out)
* Relative vs absolute handles
* Node types (corner / smooth / symmetric)

### 3.5 Continuity & Smoothness

* C0 / C1 continuity
* Enforcing constraints
* Handle locking logic
* Auto-smoothing rules

---

## 4. Vector Editing Model

*(How users manipulate geometry)*

### 4.1 Editing Modes

* Object mode
* Vector mode
* Boolean edit mode
* Mask edit mode

### 4.2 Selection System

* Hit testing
* Node selection
* Segment selection
* Multi-selection rules
* Lasso selection

### 4.3 Editing Operations

* Move node
* Move handle
* Add/remove segment
* Convert node type
* Split paths
* Join paths

### 4.4 Constraints & Snapping

* Grid snapping
* Angle snapping
* Smart guides
* Alignment logic

---

## 5. Boolean Geometry System

*(Constructive geometry)*

### 5.1 Boolean Operations

* Union
* Subtract
* Intersect
* Exclude

### 5.2 Boolean Node Architecture

* Operand references
* Non-destructive storage
* Evaluation order
* Nested booleans

### 5.3 Boolean Algorithms

* Path normalization
* Intersection detection
* Winding resolution
* Output path generation

### 5.4 Failure Handling

* Degenerate results
* Empty paths
* Numerical instability
* Auto-repair strategies

---

## 6. Styling & Paint System

*(Visual appearance)*

### 6.1 Style Abstraction

* Style as first-class entity
* Shared styles
* Overrides
* Detachment rules

### 6.2 Fills

* Solid fills
* Linear gradients
* Radial gradients
* Angular gradients
* Image fills
* Multiple stacked fills

### 6.3 Strokes

* Stroke width
* Alignment (inside/center/outside)
* Caps
* Joins
* Dash patterns
* Stroke expansion math

### 6.4 Effects

* Drop shadows
* Inner shadows
* Blur
* Blend modes
* Effect ordering

---

## 7. Masking & Clipping

*(Visibility control)*

### 7.1 Mask Model

* Mask node structure
* Mask shape rules
* Alpha masking vs clipping

### 7.2 Nested Masks

* Evaluation order
* Performance implications
* Edge cases

### 7.3 Mask Editing

* Enter/exit mask mode
* Mask transforms
* Mask + boolean interactions

---

## 8. Rendering Architecture

*(How math becomes pixels)*

### 8.1 Rendering Pipeline

* Scene traversal
* Geometry resolution
* Style application
* Draw ordering

### 8.2 Tessellation Strategy

* Curve flattening
* Error metrics
* Zoom-dependent tessellation
* LOD strategies

### 8.3 Fill Tessellation

* Polygon triangulation
* Holes & winding
* Robustness requirements

### 8.4 Stroke Tessellation

* Offset curves
* Join geometry
* Cap geometry

### 8.5 Anti-Aliasing

* Analytical AA
* Edge distance fields
* MSAA tradeoffs

### 8.6 GPU Architecture

* Vertex buffers
* Index buffers
* Shader responsibilities
* State batching
* Draw call minimization

---

## 9. Caching & Performance

*(Why it runs fast)*

### 9.1 Cache Layers

* Geometry cache
* Tessellation cache
* Render primitive cache

### 9.2 Invalidation Rules

* Geometry changes
* Style changes
* Transform changes
* Zoom thresholds

### 9.3 Partial Redraw

* Dirty region tracking
* Scissoring
* Tile-based rendering

### 9.4 Large Document Handling

* Viewport culling
* Lazy evaluation
* Background recomputation

---

## 10. Edit Operation & History System

*(Time, undo, collaboration)*

### 10.1 Operation Model

* Atomic ops
* Intent-level diffs
* Idempotency

### 10.2 Operation Categories

* Structural
* Transform
* Geometry
* Style
* Boolean
* Mask

### 10.3 Undo / Redo

* Inverse ops
* Transactions
* Grouped edits

### 10.4 Collaboration Readiness

* Operation ordering
* Conflict resolution
* Last-writer-wins rules
* Delete-vs-edit semantics

---

## 11. Serialization & Interop

*(Persistence & exchange)*

### 11.1 Internal Serialization

* JSON schema
* Protobuf schema
* Binary encoding

### 11.2 SVG Export

* Path serialization
* Gradient mapping
* Mask mapping
* Boolean flattening

### 11.3 Import

* SVG path parsing
* Style reconstruction
* Unsupported feature handling

---

## 12. Tooling & Developer Ergonomics

*(So humans can actually build this)*

### 12.1 Debugging Tools

* Geometry visualizers
* Control point overlays
* Cache inspectors

### 12.2 Testing Strategy

* Geometry correctness tests
* Boolean stress tests
* Rendering diffs
* Determinism tests

### 12.3 Feature Flagging

* Experimental geometry
* Rendering paths
* Performance toggles

---

## 13. Product-Level Concerns (Often Forgotten)

*(But critical)*

### 13.1 UX Performance Guarantees

* Interaction latency budgets
* Frame time targets

### 13.2 Failure Modes

* Corrupt geometry recovery
* Partial load handling

### 13.3 Scalability

* File size growth
* Operation log growth
* Memory ceilings

---

## 🧠 How to Read This Tree (Important)

* **Depth ≠ optionality**
  If it’s here, you *will* hit it.
* You don’t implement top-down — you **spiral**
* Every box connects to 2–3 others
* Missing any major branch creates long-term debt

This tree is basically:

> *“What Figma’s vector team learned the hard way.”*

---

If you want next, we can:

* Collapse this into a **phased implementation roadmap**
* Mark **MVP vs V1 vs V2**
* Or zoom into **one branch** and explode it further (e.g., Boolean math, stroke joins, AA)

Just point to a branch 🌿




Yes — this is the missing half.
Up to now we’ve been designing the **engine**. Now we wire it to **human hands and eyes**.

Below is an **expanded topic tree** that *integrates UI & UX as a first-class system*, not a skin on top of geometry. This is how you avoid the classic trap of “great math, terrible tool”.

Think of this as the **interaction architecture** layered on top of the engine tree you already have.

---

# 🌳 VECTOR EDITOR — COMPLETE SYSTEM TREE

### (Engine + UI/UX + Interaction)

---

## 0. Interaction Philosophy (Root Layer)

### 0.1 Mental Model Alignment

* Objects vs paths vs points
* Parametric vs freeform editing
* “What am I editing right now?”
* Visual affordances vs modes

### 0.2 Direct Manipulation Principles

* Immediate feedback
* No hidden state
* Predictable constraints
* Reversible actions

### 0.3 Discoverability vs Power

* Progressive disclosure
* Tool hints & ghost UI
* Keyboard-first vs mouse-first balance

---

## 1. Canvas & Viewport UI

### 1.1 Canvas

* Infinite canvas model
* Background grid / dot / none
* Canvas origin & rulers
* Zoom center behavior
* Pixel snapping toggles

### 1.2 Viewport Navigation

* Pan (mouse, trackpad, spacebar)
* Zoom (scroll, pinch, keyboard)
* Fit to selection
* Zoom to cursor

### 1.3 Coordinate Feedback

* Cursor coordinates
* Distance measurements
* Angle readouts
* Inline numeric feedback

---

## 2. Selection & Focus System (UI Layer)

### 2.1 Hit Testing UX

* Shape fill hit
* Stroke hit
* Control point hit
* Handle hit
* Priority resolution rules

### 2.2 Selection States

* Hovered
* Selected
* Multi-selected
* Focused (active edit target)

### 2.3 Selection Visualization

* Bounding boxes
* Outline highlights
* Anchor point visibility
* Z-order indicators

---

## 3. Object-Level Editing UI

### 3.1 Bounding Box Handles

* Resize handles (8-way)
* Rotation handle
* Aspect ratio locking
* Center vs corner scaling

### 3.2 Transform Feedback

* Live preview during drag
* Modifier keys (shift / alt)
* Snapping indicators
* Transform origin visualization

### 3.3 Parametric Controls (Contextual)

* Corner radius handles
* Star inner/outer radius handles
* Polygon side count steppers
* Inline sliders

---

## 4. Vector (Node-Level) Editing UI

### 4.1 Mode Switching

* Object mode
* Vector edit mode
* Boolean edit mode
* Mask edit mode

### 4.2 Node Visualization

* Anchor points
* Handle lines
* Handle endpoints
* Smooth vs corner indicators

### 4.3 Node Interaction

* Click to select node
* Drag to move node
* Drag handle to adjust curve
* Double-click to convert node type

### 4.4 Segment Operations

* Click to insert node
* Split segment
* Delete node
* Join endpoints

---

## 5. Continuity & Curve UX

### 5.1 Continuity Indicators

* Corner icon
* Smooth icon
* Symmetric icon

### 5.2 Continuity Controls

* Toolbar toggles
* Context menu
* Modifier-key gestures

### 5.3 Handle Constraint UX

* Linked handle movement
* Handle break gesture
* Auto-smoothing behavior

---

## 6. Boolean & Mask Interaction UX

### 6.1 Boolean Creation Flow

* Multi-select shapes
* Boolean toolbar actions
* Visual preview of result

### 6.2 Boolean Editing

* Boolean node selection
* Operand highlighting
* Reordering operands
* Changing operation type

### 6.3 Mask UX

* “Use as mask” action
* Mask boundary visualization
* Edit mask vs content toggle

---

## 7. Styling UI

### 7.1 Fill UI

* Fill list
* Enable/disable fills
* Color picker
* Gradient editor (on-canvas + panel)

### 7.2 Stroke UI

* Width control
* Alignment toggles
* Cap & join selectors
* Dash pattern editor

### 7.3 Effects UI

* Effect stack
* Drag reorder
* Live preview toggles

---

## 8. Layer Panel & Hierarchy UX

### 8.1 Layer List

* Node tree visualization
* Expand/collapse
* Visibility toggles
* Lock toggles

### 8.2 Drag & Drop

* Reparenting
* Z-order changes
* Boolean operand rearrangement

### 8.3 Breadcrumbs / Drill-In

* Current editing context
* Mask / boolean depth indicator

---

## 9. Snapping & Guides UX

### 9.1 Smart Guides

* Alignment lines
* Spacing hints
* Center alignment

### 9.2 Grid & Rulers

* Toggle grid
* Grid size control
* Ruler dragging to create guides

### 9.3 Snap Feedback

* Visual snap indicators
* Override snapping temporarily

---

## 10. Keyboard & Gesture System

### 10.1 Keyboard Shortcuts

* Tool switching
* Mode toggles
* Common operations
* Customizable shortcuts

### 10.2 Modifier Semantics

* Shift = constrain
* Alt = from center / duplicate
* Cmd/Ctrl = additive selection

### 10.3 Touch / Pen Input (Optional)

* Pressure sensitivity
* Tilt handling
* Gesture mapping

---

## 11. Feedback & System Status

### 11.1 Cursor States

* Tool cursor changes
* Hover affordances
* Drag states

### 11.2 Inline Feedback

* Temporary labels
* Ghost previews
* Dimension overlays

### 11.3 Error Handling UX

* Invalid boolean warnings
* Geometry repair prompts
* Silent auto-fixes vs explicit warnings

---

## 12. Undo / Redo UX

### 12.1 History Model

* Atomic vs grouped actions
* Descriptive history labels

### 12.2 Interaction Consistency

* Drag = one undo step
* Multi-edit = grouped undo
* Predictable redo behavior

---

## 13. Performance & Perceived Speed (UX Critical)

### 13.1 Interaction Latency

* Immediate visual feedback
* Speculative rendering
* Deferred heavy computation

### 13.2 Progressive Refinement

* Low-res preview during drag
* Final quality on release

---

## 14. Accessibility & Inclusivity

### 14.1 Keyboard-Only Editing

* Node manipulation via keyboard
* Focus navigation

### 14.2 Visual Accessibility

* High contrast mode
* Hit target sizing
* Colorblind-safe indicators

---

## 15. Customization & Extensibility

### 15.1 UI Preferences

* Handle size
* Snap sensitivity
* Grid defaults

### 15.2 Tool Extensibility

* Plugin hooks (future)
* Custom shape tools

---

## 🧠 How This Connects to the Engine

| UI Action         | Engine Effect                      |
| ----------------- | ---------------------------------- |
| Drag handle       | MOVE_POINT op                      |
| Resize shape      | SET_TRANSFORM + SET_GEOMETRY_PARAM |
| Change continuity | SET_CONTINUITY                     |
| Boolean union     | CREATE_BOOLEAN                     |
| Edit mask         | Enter mask node context            |
| Undo              | Apply inverse ops                  |

The UI **never mutates geometry directly**.
It emits **intent-level operations** into the op system you already defined.

---

## 🧩 Final Mental Model

> The engine defines *what is possible*.
> The UI defines *what is discoverable*.
> The interaction layer defines *what feels right*.

If any one of those is under-designed, the whole product feels broken — even if the math is perfect.

---

If you want next:

* A **state machine diagram for interaction modes**
* A **gesture → operation mapping table**
* A **minimal UI for MVP vs pro**
* Or a **Figma vs Illustrator UX philosophy comparison**

Point at a branch — we can explode it further 🌿
