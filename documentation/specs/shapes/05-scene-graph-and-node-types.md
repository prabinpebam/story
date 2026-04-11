# Scene Graph & Node Types (Shapes)

**Status**: Draft

Defines how Shapes participate in Story’s document model and element hierarchy.

Alignment anchor: [15-current-implementation-alignment.md](./15-current-implementation-alignment.md)

---

## 1. Node identity
- Nodes are elements stored in `slide.elements` keyed by `id`.
- Ordering is defined by `slide.elementOrder` and `parentId` relationships (grouping/nesting).

## 2. Visibility / locking
- `visible=false` elements are not rendered and should not be hit-testable.
- `locked=true` elements are renderable but not interactive (hit testing skips).

## 3. Node types (canonical)
- `type:'shape'` with `shapeKind` (rectangle/ellipse/line/polygon/star/vector/boolean/mask)
- `type:'group'` for containers
- `type:'svg'` for imported SVG markup (existing)

## 4. Traversal order
- Hit testing uses top-most-first (reverse draw order).
- Rendering draws back-to-front (elementOrder).

## 5. Group semantics
- Children positioned relative to group.
- Group bounds are derived (union of children), consistent with existing ElementHandlers.

Container/mode alignment:
- Node IDs are only meaningful within the active container (slide or master). Specs that reference other nodes (booleans/masks) must not cross container boundaries.
- Effective/inherited elements (from masters/layouts) may be present in “effective” views; shape operations must not mutate inherited nodes unless explicitly editing the master container.

## 6. Tests / acceptance
- Grouping and reparenting preserve visual positions.
- Locked elements cannot be selected by click or lasso.

## 7. Quality critique (gaps + risks)
- This doc under-specifies how boolean/mask nodes appear in hierarchy vs `parentId` grouping. Without explicit rules, layer tree and selection will drift from the document model.
- “Group bounds derived” must remain true even when children include masks/booleans; derived geometry must not be serialized into group bounds.
