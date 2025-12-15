# Hit Testing (Shapes)

**Status**: Draft

Defines engine-level hit testing rules for shapes, paths, points, and handles.

Existing baseline: `src/core/canvas/HitTesting.js`.

---

## 0. Current implementation alignment (must match)

- Hit testing is mediated by the Canvas/viewport system; tolerances are defined in screen pixels and must be converted using the active mode’s mapping.
- `edit`/`master` use pan+zoom; `presentation` uses `PresentationManager` scale/offset and suppresses editing UI (hit testing for editing should be disabled there).
- Shapes must coexist with existing bbox/handle hit testing and selection rules.

## 1. Hit target priority
Vector edit targets (vector mode):
- Handles
- Nodes
- Edges
- Faces

Object mode targets:
- Transform handles/bbox handles (existing)
- Stroke
- Fill

## 1.1 Deterministic tie-break (required)
If multiple candidates match the pointer location, the chosen hit target MUST be deterministic and MUST NOT depend on iteration order.

Selection order:
1) Prefer higher-priority hit target class (Section 1).
2) Within the same class, prefer the smallest screen-space distance to the target geometry.
	- For fill hits, distance is treated as `0`.
	- For stroke hits, distance is the point-to-stroke centerline distance.
	- For point/handle hits, distance is the point-to-anchor/handle center distance.
3) If distances tie, prefer the top-most element by render order (z-order).
	- Use the resolved scene traversal order as the canonical z-order (see [05-scene-graph-and-node-types.md](./05-scene-graph-and-node-types.md)).
4) If still tied, tie-break by a stable `hitKey` string.

Stable hit keys:
- Each candidate MUST provide a stable `hitKey` string so behavior is repeatable.
- Canonical format: `class:type:elementId:subId`
  - Examples:
	 - `point:anchor:elem-123:pt-7`
	 - `handle:out:elem-123:pt-7`
	 - `edge:segment:elem-123:edge-12`
	 - `face:region:elem-123:face-3`
	 - `stroke:layer:elem-123:stroke-0`
	 - `fill:layer:elem-123:fill-2`

Note:
- This is intentionally parallel to the snapping `targetKey` concept in `documentation/01-specs/canvas/canvas-interaction.md`, so both selection and snapping share the same determinism philosophy.

## 2. Tolerances
- Tolerances are defined in screen pixels and scaled by zoom.

Figma-class learnings (make hit testing feel stable):
- Use hysteresis for hover/handle targeting near boundaries to prevent flicker.
- Once a target is captured on pointer-down, keep it until pointer-up.
- Prefer stable priority rules over “closest by epsilon” if multiple candidates overlap.

## 3. Shape hit testing
- Rectangle/ellipse/line hit tests
- Path hit tests (fill rule aware)

Minimum algorithm requirements (v1):
- Fill hit test:
	- Use evenodd/nonzero fill rule as stored on the path.
	- For parametric shapes, resolve to a path for hit testing (do not maintain separate hit-test math per primitive unless proven necessary).
- Stroke hit test:
	- Compute distance from point to path centerline and compare against half stroke width + tolerance.
	- Respect `style.strokes[].position` when possible; if unsupported in hit test, document the approximation.
- Point/handle hit test:
	- Use screen-pixel slop scaled by zoom (and presentation scale where relevant).

Vector Network hit testing (required):
- Node hit test:
	- distance-to-node-center <= node slop
- Handle hit test:
	- distance-to-handle-endpoint <= handle slop
- Edge hit test:
	- distance-to-edge centerline <= edge slop
- Face hit test:
	- point-in-face test using the derived face polygon(s) and the effective fill rule

Note:
- “Face” here refers to faces derived from Vector Networks (see [08a-vector-networks.md](./08a-vector-networks.md)). Faces are not independent stored objects; they are derived.

Mode gating:
- In `presentation`, editing hit testing must be disabled (no handle/point targets).

## 4. Integration points
- Must coexist with bbox + handle hit testing already in use.

## 5. Tests / acceptance
- Clicking near a handle selects it reliably across zoom.
- Clicking inside a hollow stroke-only shape selects stroke when expected.

Additional acceptance:
- When fill and stroke overlap, the priority rules in section 1 produce consistent results (no “random” selection).
- Hover target does not flicker when cursor sits near boundaries (hysteresis).

## 6. Quality critique (gaps + risks)
- Stroke hit testing can be expensive on complex paths; if we rely on flattening, we must cap subdivision deterministically and consider acceleration structures.
