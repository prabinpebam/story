# 13 — Snapping & Alignment

> Taskflows for snap-to-object, snap-to-slide, snap-to-column, spacing snap, and measurement guides.

## Move Snapping

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SNP-01 | Snap to slide center (X) | Drag element near slide horizontal center | Element snaps to slide center X; vertical guide shown | — |
| SNP-02 | Snap to slide center (Y) | Drag element near slide vertical center | Element snaps to slide center Y; horizontal guide shown | — |
| SNP-03 | Snap to slide edge | Drag element near slide left/right/top/bottom | Element snaps to slide boundary | — |
| SNP-04 | Snap to other element edge | Drag element near another element's edge | Snaps to target's left, right, top, or bottom edge | — |
| SNP-05 | Snap to other element center | Drag element near another element's center | Snaps to target's center X or Y | — |
| SNP-06 | Snap threshold | Element within 5/zoom px of snap target | Snap activates at `threshold = 5 / currentZoom` | — |
| SNP-07 | No snap with Ctrl held | Ctrl+drag element | Snapping temporarily disabled | — |
| SNP-08 | Deep edit snap awareness | Drag inside deep-edit (boolean/mask) | Snap targets limited to sibling elements within composite | — |

## Resize Snapping

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SNP-09 | Resize snap to other element | Resize handle near another element's edge | Resized edge snaps to target edge/center | — |
| SNP-10 | Resize snap to slide edge | Resize handle near slide boundary | Edge snaps to slide boundary | — |
| SNP-11 | Resize snap to column | Resize handle near column guide edge | Snaps to column guide boundaries | — |

## Spacing Snap

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SNP-12 | Equal horizontal spacing | Drag element between two others | Snaps when gap matches gap between other pair; pink spacing guides shown | — |
| SNP-13 | Equal vertical spacing | Drag element above/below others | Same for vertical gaps | — |
| SNP-14 | Triple spacing snap | 3+ elements in row/column | Snaps to make all gaps equal | — |

## Column Guide Snapping

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SNP-15 | Snap to column edge | Drag/resize near column guide boundary | Snaps to column left/right edges | — |
| SNP-16 | Snap to margin | Drag near layout margin | Snaps to margin boundary | — |

## Measurement Guides

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SNP-17 | Show snap guide lines | Element snaps to a target | Colored guide line drawn between snap points | — |
| SNP-18 | Show spacing labels | Spacing snap active | Pink measurement labels show gap distance in pixels | — |
| SNP-19 | Guides clear on drop | Mouseup after drag | All snap guides and labels removed | — |
