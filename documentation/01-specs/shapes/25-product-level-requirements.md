# Product-Level Requirements (Shapes)

**Status**: Draft

Defines non-functional requirements and failure-mode behaviors for shapes.

---

## 1. UX performance guarantees
- Interaction latency budgets
- Frame-time targets
- Progressive refinement rules (only if needed)

Minimum targets (v1):
- Pointer move → visible feedback should feel immediate under normal loads.
- Heavy geometry (booleans, stroke expansion) must not block pointer-move rendering; use progressive refinement per [36-perceived-performance.md](./36-perceived-performance.md).

## 2. Failure modes
- Corrupt geometry recovery
- Partial load handling
- Boolean instability fallback behavior

Failure-handling rules (must be non-destructive):
- Never delete user-authored operands/content as a fallback.
- If derived geometry fails (boolean/mask), keep last-known-good preview and surface non-blocking status.
- On load, if a node is invalid (cycle, missing referenced IDs), degrade gracefully:
	- render operands/content unmasked/unbooleaned
	- mark node as invalid for UI display

## 3. Scalability
- File size growth
- Memory ceilings
- Cache eviction policy

## 4. Security & privacy
- Sanitization for imported content
- No execution of untrusted code via shapes

Security constraints aligned to current features:
- Imported SVG must be sanitized (no scripts, no event handlers, no external URLs).
- Figma clipboard paste import MUST apply the same sanitization and MUST not fetch external resources (see [19a-figma-clipboard-import.md](./19a-figma-clipboard-import.md)).
- Code fills are authored content; do not execute any code sourced from untrusted imports.
- Export must not leak local file paths or machine-specific identifiers.

Import safety requirements (Figma paste):
- Paste import MUST be a total function (no crashes, no partial commits).
- Paste import MUST enforce payload size/node-count guardrails.
- Unsupported features MUST degrade safely and emit non-blocking warnings.

## 5. Acceptance
- Large presentations remain usable.

Additional acceptance:
- Worst-case boolean documents remain editable (progressive refinement or background compute; no UI freeze).
- Mode safety: `presentation` mode never mutates document state.

Quality critique (gaps + risks)
- Without explicit degrade policies for invalid references, the editor will either crash or silently drop content; both are unacceptable.
- Performance targets must be validated with a reproducible stress scene and tracked over time (see [24-tooling-and-testing.md](./24-tooling-and-testing.md)).
