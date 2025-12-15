# Undo/Redo UX (Shapes)

**Status**: Draft

Defines the user-facing undo/redo experience for shapes editing.

---

## 1. History labels
- Provide meaningful descriptions for shape actions.

## 2. Grouping/transactions
- Drag = one undo step
- Multi-edit = grouped undo

## 3. Consistency
- Undo returns selection and viewport context (where applicable).

Figma-class learnings (history coherence):
- Coalesce continuous gestures into single history entries (already required), and ensure the label matches user intent (e.g. “Move Point”, not generic “Update”).
- Restore context carefully:
	- selection should not jump to a different target after undo
	- deep edit mode (vector/mask/boolean) should remain consistent if the user was editing within it

## 4. Alignment
- Must remain compatible with snapshot-based history (see [11-undo-redo-and-operations.md](./11-undo-redo-and-operations.md)).

## 5. Acceptance
- Undo restores selection consistently (same target if still valid).
- Undo does not unexpectedly exit deep edit mode unless the undone action created that mode context.

## 6. Quality critique (gaps + risks)
- Snapshot history makes selection restoration tricky; without an explicit contract, undo will feel broken even if geometry is correct.
- History labels must be curated; generic labels reduce user trust and make debugging harder.
