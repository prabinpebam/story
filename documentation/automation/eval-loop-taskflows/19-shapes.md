# 19 — Shapes & Vector Editing

> Taskflows for all 8 shape kinds, parametric shapes, vector path editing, boolean operations, and mask composition.

## Shape Creation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SHP-01 | Create rectangle | Draw with rectangle tool (R) | Rectangle with `shapeKind: 'rectangle'`, `params.cornerRadii: [0,0,0,0]` | `ADD_ELEMENT` |
| SHP-02 | Create ellipse | Draw with ellipse tool (O) | Ellipse with `shapeKind: 'ellipse'` | `ADD_ELEMENT` |
| SHP-03 | Create line | Draw with line tool (L) | Line with `params.p1, params.p2` | `ADD_ELEMENT` |
| SHP-04 | Create polygon | Draw with polygon tool | Polygon with `params.sides: 6, params.rotation: 0` | `ADD_ELEMENT` |
| SHP-05 | Create star | Draw with star tool | Star with `params.points: 5, params.innerRadiusRatio: 0.382` | `ADD_ELEMENT` |
| SHP-06 | Constrain to square/circle | Shift+draw rectangle or ellipse | Width = height during creation | `ADD_ELEMENT` |
| SHP-07 | Draw from center | Alt+draw any shape | Shape expands from center point instead of corner | `ADD_ELEMENT` |

## Parametric Shape Editing

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SHP-08 | Change polygon sides | Edit sides NumberInput (3–20) | Polygon regenerated via `ParametricToPaths`; equally-spaced points | `UPDATE_ELEMENT({params: {sides}})` |
| SHP-09 | Change polygon rotation | Edit rotation NumberInput (±360°) | Points rotated around center | `UPDATE_ELEMENT({params: {rotation}})` |
| SHP-10 | Change star points | Edit points NumberInput (3–20) | Star regenerated with alternating outer/inner radius | `UPDATE_ELEMENT({params: {points}})` |
| SHP-11 | Change star inner radius | Edit NumberInput (0.01–0.99) | Inner vertices move radially; ratio to outer radius | `UPDATE_ELEMENT({params: {innerRadiusRatio}})` |
| SHP-12 | Set line endpoint | Drag line endpoint handle | Line p1 or p2 updated | `UPDATE_ELEMENT({params: {p1|p2}})` |
| SHP-13 | Set line arrow endcap | Toggle arrow on line end | `params.endCap = 'arrow'` or `null` | `UPDATE_ELEMENT({params: {endCap}})` |

## Rectangle Specifics

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SHP-14 | Set uniform corner radius | Edit radius NumberInput in Appearance | All 4 corners: `cornerRadii: [r,r,r,r]` | `UPDATE_ELEMENT({borderRadius})` |
| SHP-15 | Set per-corner radius | Unlink corners, edit individually | `cornerRadii: [tl,tr,br,bl]` with KAPPA-based cubic curves | `UPDATE_ELEMENT({cornerRadii})` |

## Vector Path Editing (Deep Edit Mode)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SHP-16 | Enter vector edit | Double-click shape / Enter on selected shape | Deep edit mode: path nodes, edges, handles visible | `SET_DEEP_EDIT({kind:'vector', elementId})` |
| SHP-17 | Exit vector edit | Press Escape or click outside element | Return to normal selection mode | `SET_DEEP_EDIT(null)` |
| SHP-18 | Select path node | Click on node handle | Node selected; control handles shown | — |
| SHP-19 | Multi-select nodes | Shift+click additional nodes | Multiple nodes selected | — |
| SHP-20 | Marquee select nodes | Drag on empty area in vector edit | Rubber-band selection of nodes within box | — |
| SHP-21 | Move node | Drag selected node | Node position updated; connected segments adjust | `UPDATE_ELEMENT({paths})` |
| SHP-22 | Move control handle | Drag cubic Bézier handle | Curve shape adjusted; handle moves independently or mirrored | `UPDATE_ELEMENT({paths})` |
| SHP-23 | Split segment | Click on edge between nodes | De Casteljau split: `splitVectorSegment(from, seg, t)` inserts new node | `UPDATE_ELEMENT({paths})` |
| SHP-24 | Delete node | Select node + Delete key | Node removed; adjacent segments reconnected | `UPDATE_ELEMENT({paths})` |
| SHP-25 | Convert node type | Right-click node → convert | Switch between smooth (mirrored handles) and corner (independent handles) | `UPDATE_ELEMENT({paths})` |
| SHP-26 | Close/open path | Toggle path closure | `path.closed = !path.closed` | `UPDATE_ELEMENT({paths})` |
| SHP-27 | Reverse path direction | Path op: reverse | `reverseVectorPath()` reverses winding direction | `UPDATE_ELEMENT({paths})` |

## Boolean Operations

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SHP-28 | Create boolean union | Select 2+ shapes → Union button | Combined shape: all areas merged via martinez-polygon-clipping | `CREATE_BOOLEAN({operation: 'union'})` |
| SHP-29 | Create boolean subtract | Select 2+ shapes → Subtract | Top shape subtracted from bottom | `CREATE_BOOLEAN({operation: 'subtract'})` |
| SHP-30 | Create boolean intersect | Select 2+ shapes → Intersect | Only overlapping area retained | `CREATE_BOOLEAN({operation: 'intersect'})` |
| SHP-31 | Create boolean exclude | Select 2+ shapes → Exclude | XOR: overlapping area removed | `CREATE_BOOLEAN({operation: 'exclude'})` |
| SHP-32 | Change boolean operation | PI dropdown: Union/Subtract/Intersect/Exclude | Operation changed; paths recomputed from cache | `SET_BOOLEAN_OPERATION({operation})` |
| SHP-33 | Enter boolean operand edit | PI "Edit Operands" button | Deep edit: individual operand shapes selectable/moveable | `SET_DEEP_EDIT({kind:'boolean', elementId, mode:'operands'})` |
| SHP-34 | Exit boolean operand edit | Click "Done" | Return to composite view | `SET_DEEP_EDIT(null)` |
| SHP-35 | Nested boolean | Boolean of booleans | Fold-left over operands; supported | `CREATE_BOOLEAN` |
| SHP-36 | Boolean cache hit | Unchanged operand geometry | LRU cache (MAX=200 booleans, 800 pairs) returns pre-computed result | — |
| SHP-37 | Boolean interactive preview | Drag operand during interaction | Returns last-known-good paths while `isInteracting=true` | — |
| SHP-38 | Reorder boolean operands | Drag operands in layer tree | Operand order changed; result recomputed | `REORDER_BOOLEAN_OPERANDS` |

## Mask Composition

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SHP-39 | Create mask | Select shapes → Create Mask | Mask node created with `maskShapeId` + `contentIds` | `CREATE_MASK` |
| SHP-40 | Enter mask shape edit | PI "Edit Mask Shape" button | Deep edit: mask shape editable | `SET_DEEP_EDIT({kind:'mask', mode:'shape'})` |
| SHP-41 | Exit mask shape edit | Click "Done" | Return to composite view | `SET_DEEP_EDIT(null)` |
| SHP-42 | Toggle mask invert | PI invert switch | Subtracts mask from full-rect bounding polygon | `SET_MASK_INVERT({invert})` |
| SHP-43 | Multiple masks on element | Element in multiple mask contentIds | Masks intersected via `intersectClips`; unified `clip-path` CSS applied | — |
| SHP-44 | Mask alpha mode | Set mask mode to alpha | `mode: 'alpha'` (vs `'clip'`) | `UPDATE_ELEMENT({mode})` |
| SHP-45 | Reorder mask content | Layer tree drag within mask | Mask children reordered | `REORDER_MASK_CONTENT` |

## Legacy & Rendering

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SHP-46 | Legacy type migration | Load element with `type:'rect'` | Adapted to `{type:'shape', shapeKind:'rectangle'}` via `ShapeElementAdapter` | — |
| SHP-47 | SVG geometry rendering | Shape renders on canvas | Inline `<svg class="geometry-layer">` with `<path>`, fill/stroke layers, gradient defs | — |
| SHP-48 | Shape with gradient fill | Apply gradient to shape | SVG `<linearGradient>` or `<radialGradient>` defs rendered | — |
| SHP-49 | Shape with dashed stroke | Apply dashed stroke to shape | SVG `stroke-dasharray`, `stroke-linecap`, `stroke-linejoin` attributes | — |
