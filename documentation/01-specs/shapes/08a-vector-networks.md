# Vector Networks (Figma-class) — Data Model + Resolution

**Status**: Draft
**Owner**: Engineering
**Last Updated**: December 15, 2025

This spec defines **Vector Networks**: a graph-based vector representation that supports **branching topology** (T-junctions, forks) and region fills derived from the graph. This is required for **Figma-parity vector editing**.

This spec complements (and does not replace) the path specs:
- Path representation: [08-path-representation.md](./08-path-representation.md)
- Segments: [09-segments-and-beziers.md](./09-segments-and-beziers.md)
- Editing operations: [21-vector-editing-operations.md](./21-vector-editing-operations.md)

---

## 0. Current Implementation Alignment (Must Match)
- Persistence is `.str` copy-all-properties JSON; the network model must be JSON-safe and losslessly round-trip (see [02-data-model-and-serialization.md](./02-data-model-and-serialization.md)).
- DOM-first renderer remains supported; networks must be resolvable to SVG paths for rendering/export (see [16-rendering-architecture.md](./16-rendering-architecture.md)).
- Undo/redo uses snapshot bracketing; edits must update only authoritative fields (see [11-undo-redo-and-operations.md](./11-undo-redo-and-operations.md)).

---

## 1. Definitions
- **Vector network**: an embedded planar graph of nodes and edges in local space.
- **Node**: a vertex with a position (anchor). Nodes can have degree ≥ 1 (branching).
- **Edge**: a directed connection between two nodes with optional Bézier controls per endpoint.
- **Half-edge**: an oriented edge instance used for deterministic face traversal.
- **Face**: a bounded region in the planar embedding; used to derive filled contours.

---

## 2. Non-Goals
- 3D/mesh modeling.
- Boolean ops on the network directly. Booleans operate on resolved paths (see [13-boolean-geometry-system.md](./13-boolean-geometry-system.md)).
- Non-planar networks (networks are 2D in local space).

---

## 3. Canonical Data Model

### 3.1 Storage location
A vector element may be represented as either:
- `shapeKind:'vector'` with `geometry.path` (path model), OR
- `shapeKind:'vector'` with `geometry.network` (network model).

**Rule**: Only one representation is authoritative at a time. If both exist, `geometry.network` wins.

### 3.2 Node schema
- `id` (string, stable)
- `x`, `y` (number, local space)
- Optional: `flags` (locked, hidden)

### 3.3 Edge schema
Edges are stored as **directed edges** but conceptually represent an undirected connection.

Each edge stores per-endpoint controls so branching tangents can differ by edge.

- `id` (string, stable)
- `from` (nodeId)
- `to` (nodeId)
- `kind`: `'line' | 'cubic'`
- If `kind:'cubic'`:
  - `c1`: `{ dx, dy }` control vector relative to `from` node
  - `c2`: `{ dx, dy }` control vector relative to `to` node
- `styleHints` (optional): reserved for styling metadata; must round-trip losslessly

**Hard rules**:
- Controls are stored as vectors relative to their endpoint nodes (transform-safe).
- Edge IDs and node IDs must be stable across edits that do not semantically replace them.

### 3.4 Deterministic ordering
- `nodes[]` are stored in stable order by `id`.
- `edges[]` are stored in stable order by `id`.
- Any derived adjacency lists must be computed deterministically.

---

## 4. Geometry Resolution (Network → Paths)

Vector networks must be resolvable into:
- **Stroke paths**: open polylines/curves suitable for stroke rendering.
- **Fill contours**: closed contours derived from faces.

### 4.1 Edge curve evaluation
- For `line`: segment from node position to node position.
- For `cubic`:
  - `P0 = from.position`
  - `P1 = P0 + c1`
  - `P3 = to.position`
  - `P2 = P3 + c2` (note: `c2` is relative to `to`)

### 4.2 Planarity and intersection constraints
For a network to produce stable faces:
- Edges MUST NOT self-intersect or mutually intersect except at shared nodes.
- If intersections occur, the system MUST repair deterministically by inserting nodes at intersection points and splitting edges.

Repair is a required part of the model contract:
- Detect intersections under the shared epsilon policy (see [04-precision-and-numerics.md](./04-precision-and-numerics.md)).
- Insert new node(s) with stable IDs derived from `(edgeIdA, edgeIdB, tA, tB)` canonicalized.
- Split affected edges into sub-edges with stable IDs derived from the parent edge ID.

### 4.3 Face extraction (fill regions)
Fill contours are derived from the planar embedding using a half-edge traversal:

1) Build half-edges for each directed edge in both directions.
2) For each node, compute a deterministic cyclic ordering of outgoing half-edges by angle.
3) Traverse unvisited half-edges to form face cycles.

#### 4.3.1 Angle ordering at nodes
For each outgoing half-edge `(node -> neighbor)`:
- Compute the outgoing tangent direction vector at the node:
  - For `line`: `dir = normalize(neighbor - node)`.
  - For `cubic`: `dir = normalize((P1 - P0))` for the half-edge direction.
- Compute `angle = atan2(dir.y, dir.x)`.
- Sort ascending by `angle`, tie-break by `(edgeId, neighborNodeId)`.

#### 4.3.2 Next-half-edge rule
When traversing face boundaries, at each node:
- You arrive along an incoming half-edge.
- Choose the next outgoing half-edge that is the **previous** edge in cyclic order (i.e., “turn right” rule) to trace consistent faces.

This produces a deterministic set of cycles.

#### 4.3.3 Outer vs inner classification
- Compute signed area of each cycle (using a flattened approximation under a fixed tolerance).
- Orientation convention:
  - Positive area = CCW.
  - Negative area = CW.
- For `fillRule:'nonzero'`:
  - Outer contours are CCW; holes are CW.
- For `fillRule:'evenodd'`:
  - Alternate nesting parity determines hole vs filled.

### 4.4 Output to path model
Resolved outputs are emitted as standard path structures (see [08-path-representation.md](./08-path-representation.md)):
- Stroke output: a set of open subpaths.
- Fill output: a set of closed contours with hole assignments.

**Rule**: The derived path output must be canonicalized (stable segment order/winding) per [08-path-representation.md](./08-path-representation.md).

---

## 5. Editing Semantics (Minimum Figma-parity)

Required operations (authoritative edits):
- Add node / delete node.
- Add edge / delete edge.
- Drag node (moves all incident edges).
- Drag edge endpoint control (per-edge handle).
- Split edge at parameter $t$.
- Join nodes (merge) with deterministic ID retention.
- Disconnect edge from node (creates a new node at the same position).

Selection identity requirements:
- Nodes and edges must be selectable by stable IDs.
- Hit testing must surface sub-IDs (nodeId/edgeId) in vector mode.

---

## 6. Rendering + Tessellation Integration

- DOM/SVG rendering uses resolved paths, not the network directly.
- Tessellation operates on resolved paths. Canonical: [16a-tessellation-and-aa.md](./16a-tessellation-and-aa.md)

---

## 7. Tests / Acceptance

Determinism:
- Given identical `nodes[]` and `edges[]`, resolved fill/stroke paths must be byte-identical (after canonicalization).

Robustness corpus:
- Include branching networks (T and Y junctions), nested faces, and near-collinear edges.
- Verify face extraction stability under small drags.

Interop:
- Exported SVG must match the resolved path output (within tolerance for arc conversions).

---

## 8. Quality critique (gaps + risks)
- Face extraction is where vector networks usually break; without deterministic angle ordering + a repair strategy for intersections, users will see fill regions flicker.
- Per-edge controls are required for true network semantics; per-node handles are insufficient in branching graphs.
- Repair strategies must preserve editing identity as much as possible; otherwise selection will “jump” after repairs.
