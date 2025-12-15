# Path Representation (SVG-first)

**Status**: Draft

Defines the canonical internal path model and SVG mapping rules.

---

## 1. Path model
- Path is a sequence of segments.
- Path may be open or closed.
- Path has a fill rule: nonzero/evenodd.

## 2. Subpaths
- Support multiple subpaths per vector shape.
- Define how holes are represented (fill rule + winding).

## 3. Winding and canonicalization
- Define canonical winding direction conventions.
- Define output ordering for deterministic derived results.

Figma-class learning to incorporate:
- Path canonicalization is not optional: it is required for boolean stability, export stability, and reliable tests.
- The spec must define how we normalize:
	- winding direction
	- duplicate/near-duplicate points
	- tiny segments
	- self-intersections (at least in derived outputs)

Minimum canonicalization steps (v1):
- Remove zero-length segments and collapse near-duplicate consecutive points within epsilon.
- Normalize fill-rule metadata and ensure derived outputs use a stable winding convention.
- Ensure stable ordering of subpaths and segments (deterministic traversal, no iteration over object keys).
- For derived boolean outputs: prune micro-loops below epsilon and merge nearly collinear segments where safe.

## 4. Self-intersection rules
- Define how self-intersecting paths behave under fill rules.

## 5. SVG mapping
- Path maps to SVG `d` commands.
- Fill-rule maps to `fill-rule`.

## 6. Tests / acceptance
- Same path data renders identically in DOM/SVG and exporter.

Additional acceptance:
- Canonicalization is idempotent within tolerance.
- Exported `d` strings are stable under repeated export (golden tests).

## 7. Quality critique (gaps + risks)
- “Canonicalization” is a common hand-wave that hides complexity; the minimal steps above must be implemented and tested, or booleans/export will be flaky.
- The path spec must stay consistent with the segment schema chosen in [02-data-model-and-serialization.md](./02-data-model-and-serialization.md); divergence will create migrations and editor bugs.
