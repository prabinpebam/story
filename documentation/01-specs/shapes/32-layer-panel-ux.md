# Layer Panel & Hierarchy UX (Shapes)

**Status**: Implemented (v1, partial)
**Last Updated**: December 17, 2025

Defines how shapes/booleans/masks appear and behave in the layer tree.

---

## 0. Current implementation alignment (must match)

- The layer tree is driven by existing UI (`src/ui/LayerTree.js`) and current document structure.
- `edit` vs `master` mode show different element containers (active slide vs active master).
- The UI may show “effective” / inherited elements (theme/layout/master) distinct from slide-local elements; shapes UX must not break this mental model.
- Hierarchy is represented via `parentId` grouping; new nodes (boolean/mask) must integrate with this without inventing a parallel hierarchy system.

## 1. Node display
- Clear naming for boolean/mask nodes
- Operand nesting visuals

Required representations:
- `shapeKind: 'boolean'`: show a boolean node with child operands (even if operands are also regular elements elsewhere).
- `shapeKind: 'mask'`: show a mask node with:
	- mask shape
	- masked content list

V1 implementation notes:
- The layer tree is rendered by `src/ui/LayerTree.js`.
- Boolean nodes render their `operands[]` as nested child items.
- Mask nodes render `maskShapeId` and `contentIds[]` as nested child items.
- Operands/content are hidden from the top-level layer list and shown under their composition node to keep the tree readable.

The tree must remain stable under reorder/undo and must reflect the actual serialization order.

## 2. Drag/drop
- Reparenting
- Z-order
- Boolean operand reorder (required)

V1 implementation notes:
- Boolean operand reorder is supported via drag/drop within the nested operand list (updates `operands[]`).
- Mask content reorder is supported via drag/drop within the nested content list (updates `contentIds[]`).

## 3. Breadcrumb/drill-in
- Show current edit context (mask/boolean depth)

V1 non-goal:
- Breadcrumb/drill-in UI for composition depth is not shipped in v1.

## 4. Integration points
- `src/ui/LayerTree.js`

## 5. Acceptance
- Layer tree remains coherent and consistent.

## 6. Figma-class UX learnings (layers + complex shapes)
- Keep the tree stable: avoid re-parenting/re-ordering side effects from edits unless the user explicitly performs a hierarchy action.
- Make boolean/mask nodes explicit and discoverable; users should always be able to answer “what is masking what?” and “what are the operands?” from the tree.
- Do not hide failures: if a boolean/mask is in a degraded/preview state (e.g. progressive refinement), show a small non-blocking indicator rather than silently changing output.
- Preserve non-destructive intent: avoid auto-flattening/merging operands as a side effect of styling or minor edits.

## 7. Quality critique (gaps + risks)
- The doc should define how operands appear when they already have a `parentId` (grouped elsewhere). Without a rule, the tree can appear duplicated or contradictory.
