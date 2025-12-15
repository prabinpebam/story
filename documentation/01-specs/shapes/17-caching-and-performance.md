# Caching & Performance (Shapes)

**Status**: Draft

Defines cache layers, invalidation, and performance guarantees for shapes.

---

## 1. Performance targets
- Interactive edits should feel instantaneous (target 60fps).
- Degrade gracefully (preview quality during drag) only if needed.

Figma-class learning to incorporate:
- Expensive operations (booleans, stroke expansion) must not run synchronously on every pointer-move.
- If needed for responsiveness, allow progressive refinement:
	- fast preview during drag
	- refine on pointer-up

## 2. Cache layers
- Parametric → path cache
- Boolean output cache
- Stroke outline cache (where needed)
- Tessellation mesh cache (fill + stroke) keyed by geometry hash + LOD
- Bounds cache
- Hit-test acceleration cache (optional)

Tessellation requirements:
- Tessellation is required (not optional/future). Canonical: [16a-tessellation-and-aa.md](./16a-tessellation-and-aa.md)
- Mesh caches must bucket by LOD to avoid re-tessellation on tiny zoom deltas.

Current-implementation alignment notes:
- DOM rendering already provides some implicit caching; avoid introducing caches that require serializing derived artifacts.
- Code fills (canvas via `CodeRunner`) and media fills (image/video) can be expensive; caches/invalidation must treat style changes (fills/filters) as first-class invalidation causes.
- Mode switches (`edit`/`master`/`presentation`) must not invalidate document geometry; only viewport-dependent caches (e.g. screen-space tolerances) may change.

## 3. Invalidation matrix
- Geometry param change → invalidate param path + dependents
- Transform change → invalidate bounds + hit-test structures
- Operand change (boolean/mask) → invalidate derived outputs
- Zoom/scale LOD bucket change → invalidate view-dependent caches (mesh LOD, hit-test tolerances)

## 4. Partial redraw
- Prefer dirty-region rendering in overlay.
- DOM layers should minimize layout thrash.

## 5. Large document handling
- Viewport culling where appropriate.
- Background recomputation of heavy booleans.

## 6. Tests / acceptance
- Stress tests with many shapes do not lock UI.

Additional acceptance:
- Worst-case boolean edits do not freeze the UI; they either refine progressively or compute in the background with a safe preview.

## 7. Quality critique (gaps + risks)
- Without an explicit cache key policy (what fields affect which caches), invalidation bugs will be common and hard to diagnose.
- Any caching that depends on DOM layout measurements risks layout thrash; prefer geometry-derived caches.
