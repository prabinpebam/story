# Selection & Hit-Testing — Agnostic Eval Loop Plan

> **Category**: 1 (Selection & Hit-Testing)  
> **Taskflows**: SEL-01 through SEL-13  
> **Framework**: The Agnostic Evaluation Loop v2.0  
> **Status**: PLAN — awaiting review before implementation

---

## Step 1: DEFINE — What the User Should See

Each taskflow is described from the user's perspective. No implementation references. If Story were rewritten in a different stack, these definitions would be identical.

### SEL-01: Single Select

**Trigger**: User clicks on an element.  
**What the user should see**:
- Any previously selected elements lose their visual selection indicators (blue bounding box, resize handles disappear).
- The clicked element gains a visible selection indicator: a colored bounding box tightly hugging its edges, with small square handles at each corner and midpoint.
- Only the clicked element looks selected. Nothing else on the canvas shows selection visuals.

**Invariants**:
- Exactly one element visually selected after the click.
- The selection indicator spatially aligns with the element's edges (no drift, no offset).
- The click does not move, resize, or alter the element in any way.

---

### SEL-02: Add to Selection

**Trigger**: User Shift+Clicks on an element that is not currently selected.  
**What the user should see**:
- Previously selected elements remain visually selected.
- The newly clicked element also gains a selection indicator.
- A combined bounding box expands to encompass all selected elements.

**Invariants**:
- Total visually selected elements = previous count + 1.
- No element loses selection that the user didn't explicitly deselect.
- The combined bounding box encloses every selected element.

---

### SEL-03: Remove from Selection

**Trigger**: User Shift+Clicks on an element that is currently selected.  
**What the user should see**:
- The clicked element loses its selection indicator.
- All other previously selected elements remain selected.
- The combined bounding box shrinks to encompass only the remaining selected elements.
- If only one element remains, the bounding box snaps to hug that single element.
- If no elements remain, all selection visuals disappear.

**Invariants**:
- Total visually selected elements = previous count − 1.
- No unrelated element gains or loses selection.

---

### SEL-04: Deselect All

**Trigger**: User clicks on empty canvas (not on any element).  
**What the user should see**:
- All selection visuals disappear: no bounding boxes, no resize handles, no highlight on any element.
- The canvas looks "clean" — no interactive selection affordances visible anywhere.

**Invariants**:
- Zero elements show any selection indicator.
- The click does not create anything new on the canvas.

---

### SEL-05: Marquee Select

**Trigger**: User clicks and drags on empty canvas area.  
**What the user should see**:
- While dragging: a translucent rectangular selection box follows the mouse, anchored at the start point, stretching to the current cursor position.
- On release: the selection box disappears. Every element that was inside or intersected by the box becomes selected. Elements outside the box are not selected.
- Selected elements gain the standard selection indicator (bounding box + handles).

**Invariants**:
- During drag: the selection rectangle is visible and tracks the cursor accurately.
- After release: elements inside the rectangle are selected, elements outside are not.
- The rectangle disappears after mouse release — it is not a persistent artifact.

---

### SEL-06: Select All

**Trigger**: User presses Ctrl+A while canvas has focus (not in text edit mode).  
**What the user should see**:
- Every element on the current slide becomes selected.
- A combined bounding box encompasses all elements.
- All elements show selection indicators.

**Invariants**:
- Count of visually selected elements = total count of elements on the slide.
- No element is left unselected.

---

### SEL-07: Deep Select Child (Ctrl+Click)

**Trigger**: User Ctrl+Clicks (or Cmd+Clicks) on a child element within a group.  
**What the user should see**:
- The specific child element under the cursor becomes selected — not the parent group.
- The selection indicator wraps the child element, not the group bounding box.

**Invariants**:
- The selected element is the child, not the group.
- The selection indicator aligns with the child element's bounds, not the group's bounds.

---

### SEL-08: Deep Select via Double-Click

**Trigger**: User double-clicks on a group.  
**What the user should see**:
- The group enters an "editing" or "entered" state — the user is now "inside" the group.
- The child element under the cursor becomes selected.
- Other children of the group may show a subtle visual distinction (e.g., dimmed or with a different outline) indicating they are siblings in the active group.

**Invariants**:
- The child, not the group, is the selected element.
- The selection indicator reflects the child's bounds.

---

### SEL-09: Sync Highlight in Layer Tree

**Trigger**: User clicks an element on the canvas.  
**What the user should see**:
- In the layer panel (list of layers), the corresponding layer entry becomes highlighted/active.
- If the layer is not currently visible in the scrollable list, the list scrolls to bring it into view.

**Invariants**:
- The highlighted layer corresponds to the element the user clicked.
- Exactly one layer shows the active/highlighted state (for single selection).

---

### SEL-10: Sync Selection from Layer Tree

**Trigger**: User clicks a layer entry in the layer panel.  
**What the user should see**:
- The corresponding element on the canvas becomes selected (selection indicator appears around it).
- Any previously selected elements are deselected (unless modifier keys are held).

**Invariants**:
- The canvas selection matches the layer tree selection.
- The selection indicator on the canvas aligns with the element identified by the clicked layer.

---

### SEL-11: Multi-Select Layers (Shift+Click in Tree)

**Trigger**: User Shift+Clicks on another layer entry in the layer panel.  
**What the user should see**:
- A contiguous range of layers from the first selected to the shift-clicked one becomes selected.
- All corresponding elements on the canvas gain selection indicators.

**Invariants**:
- Every layer in the range is highlighted.
- Every corresponding canvas element shows selection.
- The combined bounding box on canvas encompasses all selected elements.

---

### SEL-12: Toggle Layer Selection (Ctrl+Click in Tree)

**Trigger**: User Ctrl+Clicks (or Cmd+Clicks) a layer entry in the layer panel.  
**What the user should see**:
- If the layer was not selected: it becomes selected (added to current selection).
- If the layer was selected: it becomes deselected (removed from current selection).
- Other selected layers remain unchanged.

**Invariants**:
- Only the toggled layer changes state.
- Canvas selection visuals update to reflect the new set.

---

### SEL-13: Tab to Next Element

**Trigger**: User presses Tab while in text editing mode.  
**What the user should see**:
- The current text editing session ends (cursor disappears from text).
- The next element in order becomes selected (not in edit mode, just selected).
- The selection indicator appears around the next element.

**Invariants**:
- Text editing mode is exited.
- Exactly one element selected after Tab.
- The selected element is the "next" one (not the same, not random).

---

## Step 2: ENUMERATE — Detector Catalog by Failure Category

### Category A: Selection Visual Correctness

These detectors verify that what the user sees as "selected" matches what the system believes is selected.

```
DETECTOR: SELECTION_VISUAL_ABSENT
  Category: A (Selection Visual Correctness)
  Severity: critical
  Rule:     If the system believes an element is selected, the user must see
            a selection indicator around that element on the canvas.
  Check:    For each element in Store.selectedElementIds:
            interaction.selectionBounds must exist AND screenshot region
            around the element must show selection highlight pixels.
  Fires:    An element is selected in system state but has no visible 
            selection indicator on screen.
  Why:      The user cannot manipulate what they cannot see is selected.

DETECTOR: SELECTION_GHOST_VISUAL
  Category: A (Selection Visual Correctness)
  Severity: critical
  Rule:     If no element is selected, the canvas must show no selection
            indicators (no stale bounding boxes, no orphan handles).
  Check:    If Store.selectedElementIds is empty:
            interaction.selectionBounds must be null AND screenshot must 
            show no selection-colored pixels in the interaction area.
  Fires:    No element is selected but selection visuals persist on canvas.
  Why:      Ghost selections mislead the user about what will be affected 
            by their next action.

DETECTOR: SELECTION_BOUNDS_DRIFT
  Category: A (Selection Visual Correctness)
  Severity: critical
  Rule:     The selection bounding box must align with the selected 
            element's edges within 2px tolerance.
  Check:    |selectionBounds.x − element.x| ≤ 2 AND
            |selectionBounds.y − element.y| ≤ 2 AND
            |selectionBounds.width − element.width| ≤ 2 AND
            |selectionBounds.height − element.height| ≤ 2
  Fires:    The blue selection box is visibly offset from the element.
  Why:      Misaligned gizmo makes the user doubt which element is selected
            and makes handle-based operations imprecise.

DETECTOR: SELECTION_COUNT_MISMATCH
  Category: A (Selection Visual Correctness)
  Severity: critical
  Rule:     The number of visually indicated selected elements must match
            the count of elements the system believes are selected.
  Check:    Count of distinct selection indicators ≈ Store.selectedElementIds.length
            (verified via interaction layer and screenshot)
  Fires:    3 elements are selected in state but only 2 show selection visuals.
  Why:      The user doesn't know an element is part of their selection 
            and may inadvertently modify or skip it.
```

### Category B: Store ↔ DOM Sync (Applied to Selection Context)

These detectors verify the rendering layer faithfully reflects system state during selection operations.

```
DETECTOR: ELEMENT_MISSING_IN_DOM
  Category: B (Store ↔ DOM Sync)
  Severity: critical
  Rule:     Every non-hidden element in system state must have a corresponding
            visible element on screen.
  Check:    For each element where hidden ≠ true:
            a DOM element with matching identity must exist and be visible.
  Fires:    System state has an element but it doesn't appear on screen.
  Why:      An invisible element can't be clicked to select it.

DETECTOR: ELEMENT_GHOST_IN_DOM
  Category: B (Store ↔ DOM Sync)
  Severity: critical
  Rule:     Every visible element on screen must correspond to an element
            in system state.
  Check:    For each DOM element: a matching system state entry must exist.
  Fires:    Orphan element visible on canvas with no backing state.
  Why:      Clicking a ghost element produces unpredictable behavior.

DETECTOR: POSITION_DRIFT
  Category: B (Store ↔ DOM Sync)
  Severity: critical
  Rule:     Element position on screen must match system state within 1px.
  Check:    |DOM.position.left − Store.element.x| ≤ 1 AND
            |DOM.position.top − Store.element.y| ≤ 1
  Fires:    Element renders at a different location than where the system 
            thinks it is — click hit-testing would target the wrong spot.
  Why:      If the element renders offset from its state position, clicking 
            where the user sees it may miss the hit test.

DETECTOR: DIMENSION_DRIFT
  Category: B (Store ↔ DOM Sync)
  Severity: critical
  Rule:     Element dimensions on screen must match system state within 1px.
  Check:    |DOM.width − Store.element.width| ≤ 1 AND
            |DOM.height − Store.element.height| ≤ 1
  Fires:    Element renders at different size than system state.
  Why:      Selection bounding box computed from state won't match visible element.
```

### Category C: Interaction State Machine

These detectors verify the interaction state machine follows valid transitions and maintains consistency.

```
DETECTOR: INVALID_INTERACTION_STATE
  Category: C (Interaction State Machine)
  Severity: critical
  Rule:     The interaction state must be a recognized value at all times.
  Check:    interactionState ∈ {IDLE, PANNING, DRAGGING, RESIZING, CREATING, SELECTING}
  Fires:    interactionState is undefined, null, or an unrecognized string.
  Why:      Unknown state means the system can't correctly interpret user input.

DETECTOR: SELECTING_WITHOUT_VISUAL
  Category: C (Interaction State Machine)
  Severity: critical
  Rule:     When interaction state is SELECTING (marquee), a visible 
            selection rectangle must exist on screen.
  Check:    If interactionState === 'SELECTING':
            screenshot shows a translucent rectangle in the interaction area.
  Fires:    System is in SELECTING state but no marquee rectangle is visible.
  Why:      The user has no feedback about what area they're selecting.

DETECTOR: IDLE_WITH_STALE_INTERACTION
  Category: C (Interaction State Machine)
  Severity: warning
  Rule:     When interaction state is IDLE, transient interaction data 
            (dragStart, dragCurrent, activeHandle) should be cleared.
  Check:    If interactionState === 'IDLE':
            dragStart === null AND dragCurrent === null AND activeHandle === null
  Fires:    System returned to IDLE but left stale drag/handle data.
  Why:      Stale data could corrupt the next interaction.
```

### Category D: Cross-Surface Consistency (Canvas ↔ Layer Panel)

These detectors verify canvas selection and layer panel selection agree.

```
DETECTOR: LAYER_TREE_SELECTION_DESYNC
  Category: D (Cross-Surface Consistency)
  Severity: critical
  Rule:     The highlighted layers in the layer panel must correspond exactly
            to the elements selected on the canvas.
  Check:    Set of highlighted layer IDs === Set of canvas-selected element IDs
  Fires:    Canvas shows element A selected but layer panel doesn't highlight A,
            or layer panel highlights B but canvas doesn't show B selected.
  Why:      The user uses both surfaces to manage selection — 
            disagreement causes confusion about what is actually selected.

DETECTOR: LAYER_SCROLL_TO_VIEW
  Category: D (Cross-Surface Consistency)
  Severity: warning
  Rule:     When a canvas click selects an element, its layer entry should 
            be scrolled into the visible area of the layer panel (if the 
            panel is open).
  Check:    After canvas click: the layer entry's bounding rect is within 
            the layer panel's visible scroll area.
  Fires:    Selected element's layer is highlighted but scrolled off-screen.
  Why:      The user expects the layer panel to reveal the selected layer.
```

### Category E: Element Integrity During Selection

These detectors verify that selection operations don't accidentally mutate elements.

```
DETECTOR: ELEMENT_MUTATED_ON_SELECT
  Category: E (Element Integrity)
  Severity: critical
  Rule:     Clicking to select an element must not change the element's 
            position, size, rotation, opacity, or any visual property.
  Check:    After selection action:
            element.x, y, width, height, rotation, opacity are identical 
            to their pre-action values (±0 tolerance).
  Fires:    An element moved 3px after being clicked for selection.
  Why:      Selection is a read-only operation — it must never modify content.

DETECTOR: UNRELATED_ELEMENT_CHANGED
  Category: E (Element Integrity)
  Severity: critical
  Rule:     A selection operation must not change any element that wasn't 
            the target of the selection action.
  Check:    After selection action:
            for every element NOT involved in the selection change,
            all properties remain identical to pre-action values.
  Fires:    Selecting element A caused element B to shift position.
  Why:      Selection is scoped to selection state only — side effects 
            on unrelated elements are bugs.
```

---

## Step 3: PLAN RECORDING — How to Capture the Evidence

Technology enters here — how we observe what the user sees.

### Layer 1: Store State

Read via `page.evaluate()` on `window.__TEST_STORE__`:
- `editor.selectedElementIds` — what the system believes is selected
- `editor.editingElementId` — whether text editing is active
- `editor.mode` — current editor mode
- Element properties (x, y, width, height, rotation, opacity, hidden) for all elements on the active slide
- `elementOrder` — z-ordering

### Layer 2: DOM State

Read via `page.evaluate()` querying the rendered DOM:
- All `.slide-element[data-element-id]` elements: their computed position, size, visibility, opacity
- Layer panel entries: which are highlighted/active, their scroll position within the panel
- `#zoom-display` text

### Layer 3: Interaction State

Read via `page.evaluate()` on `window.__TEST_CANVAS_MANAGER__`:
- `interactionState` (IDLE, SELECTING, etc.)
- `selectionBounds` (the geometry driving the gizmo)
- `activeHandle`, `dragStart`, `dragCurrent`
- `hoveredElementId`
- `activeGuides`

### Layer 4: Screenshots

Captured via Playwright `page.screenshot()`:
- **Full-page screenshot** at each capture point
- **Region-of-interest screenshots** cropped around specific elements (with 16px padding for gizmo handles)
- Used for: semantic evaluation of selection visual alignment, marquee visibility, ghost detection

### Combined Snapshot

Every capture produces a single `EvalSnapshot` containing all four layers. Snapshots are collected into an ordered timeline (array) per scenario run.

### Capture Points Per Scenario

| Moment | Label | Why |
|---|---|---|
| Before user action | `pre-action` | Baseline: what did the canvas look like before? |
| After action + settle (100–150ms) | `post-action` | Result: what changed? |
| During drag (for SEL-05) | `mid-drag` at intervals | Marquee rectangle tracking |
| After mouse release | `post-release` | Final state after marquee |

### Mutation Timeline

Built automatically by diffing consecutive snapshots:
- Selection changes (which IDs added/removed)
- Interaction state transitions
- Element property changes (position, size, etc.)
- Each mutation tagged with its snapshot index and interaction state

---

## Step 4: CAPTURE — Scenario Design

Each scenario drives the real app with real mouse/keyboard actions via Playwright. No store dispatches. No mocking. The app is loaded, elements are created through the UI (or via a minimal seeding setup), and then the evaluation exercises the taskflow through user actions only.

### Prerequisite: Canvas With Elements

Before selection scenarios can run, the canvas needs elements to interact with. This will use whatever the app's standard method is — either:
- **Seeded fixture**: Load a known slide state through the app's own API/store initialization (this is the only place store access is acceptable — setting up the initial scene, NOT evaluating the result)
- **UI-driven creation**: Use Playwright to create elements by clicking the creation tool and drawing on canvas

Either way, the eval loop begins AFTER elements exist. The evaluation never evaluates the creation — only the selection behaviors.

### Scenario: SEL-01 (Single Select)

```
1. Ensure canvas has ≥2 elements (e.g., a rectangle and a text box)
2. Capture snapshot [pre-action]
3. Click the center of Element A (via mouse click at calculated screen coordinates)
4. Wait 150ms for render settle
5. Capture snapshot [post-select-A]
6. Click the center of Element B
7. Wait 150ms
8. Capture snapshot [post-select-B]
9. Click on empty canvas area
10. Wait 150ms
11. Capture snapshot [post-deselect]
```

Detection runs on: all snapshots + mutation timeline + screenshots.

### Scenario: SEL-02 + SEL-03 (Add/Remove from Selection)

```
1. Ensure canvas has ≥3 elements (A, B, C)
2. Capture snapshot [baseline]
3. Click Element A → capture [select-A]
4. Shift+Click Element B → capture [add-B]
5. Shift+Click Element C → capture [add-C]
6. Shift+Click Element B (remove) → capture [remove-B]
7. Shift+Click Element A (remove) → capture [remove-A]
```

### Scenario: SEL-04 (Deselect All)

```
1. Select multiple elements (click A, shift+click B)
2. Capture [pre-deselect]
3. Click empty canvas
4. Capture [post-deselect]
```

### Scenario: SEL-05 (Marquee Select)

```
1. Ensure canvas has ≥4 elements, some clustered, some separate
2. Capture [baseline]
3. Mouse down on empty canvas area above the cluster
4. Capture [drag-start] — verify interactionState, marquee presence
5. Mouse move (dragging) across the cluster — capture [mid-drag] 2-3 times
6. Mouse up (encompassing 2 of 4 elements)
7. Wait 150ms
8. Capture [post-marquee]
```

### Scenario: SEL-06 (Select All)

```
1. Ensure canvas has ≥3 elements
2. Capture [baseline]
3. Press Ctrl+A
4. Capture [post-select-all]
```

### Scenario: SEL-07 + SEL-08 (Deep Select)

```
Prerequisite: Canvas has a group element containing ≥2 children
1. Capture [baseline]
2. Click on group → capture [group-selected] — verify group is selected, not child
3. Ctrl+Click on a child → capture [deep-select-ctrl] — verify child is selected
4. Click empty canvas → capture [deselected]
5. Double-click on group → capture [deep-select-dblclick] — verify child is selected
```

### Scenario: SEL-09 + SEL-10 (Canvas ↔ Layer Tree Sync)

```
Prerequisite: Layer panel is visible
1. Click Element A on canvas → capture [canvas-select]
   → Verify: Layer panel highlights A's layer
2. Click layer B in layer panel → capture [tree-select]
   → Verify: Canvas shows B selected
```

### Scenario: SEL-11 + SEL-12 (Layer Tree Multi-Select)

```
Prerequisite: Layer panel visible, ≥4 layers
1. Click layer A in panel → capture [base]
2. Shift+Click layer C → capture [range-select] — layers A-C highlighted
3. Ctrl+Click layer B → capture [toggle-off] — layer B deselected, A+C remain
```

### Scenario: SEL-13 (Tab to Next)

```
Prerequisite: ≥2 text elements, one is in editing mode
1. Capture [editing-state] — verify one element in edit mode
2. Press Tab
3. Capture [after-tab] — verify editing exited, next element selected
```

---

## Step 5: DETECT — What Runs on the Captured Data

### Heuristic Detectors (on every snapshot)

Run the full detector catalog from Step 2 on every captured snapshot:

| Detector | Applies to Scenarios |
|---|---|
| SELECTION_VISUAL_ABSENT | All |
| SELECTION_GHOST_VISUAL | SEL-04, post-deselect in all |
| SELECTION_BOUNDS_DRIFT | All (when elements are selected) |
| SELECTION_COUNT_MISMATCH | SEL-02, SEL-03, SEL-05, SEL-06, SEL-11 |
| ELEMENT_MISSING_IN_DOM | All |
| ELEMENT_GHOST_IN_DOM | All |
| POSITION_DRIFT | All |
| DIMENSION_DRIFT | All |
| INVALID_INTERACTION_STATE | All |
| SELECTING_WITHOUT_VISUAL | SEL-05 (during drag) |
| IDLE_WITH_STALE_INTERACTION | All (post-action) |
| LAYER_TREE_SELECTION_DESYNC | SEL-09, SEL-10, SEL-11, SEL-12 |
| LAYER_SCROLL_TO_VIEW | SEL-09 |
| ELEMENT_MUTATED_ON_SELECT | All |
| UNRELATED_ELEMENT_CHANGED | All |

### Temporal Rules (across mutation timeline)

| Rule | What It Checks |
|---|---|
| SELECTION_FOLLOWS_CLICK | After clicking an element, it must appear in selected set within the next snapshot. Fires if click occurred but selection didn't update. |
| IDLE_AFTER_MOUSEUP | After mouseup, interaction state must return to IDLE within 100ms / next snapshot. Fires if stuck in SELECTING or DRAGGING. |
| NO_ELEMENT_DISAPPEARANCE | An element present in snapshot N must exist in snapshot N+1 (no element vanishes during selection operations). |
| INTERACTION_STATE_MONOTONICITY | Interaction state transitions must follow valid graph: IDLE→SELECTING or IDLE→DRAGGING are valid, SELECTING→DRAGGING is not. |
| SELECTION_MUTATION_ISOLATION | When selection changes between snapshots, only selection-related state should change — element properties (x, y, width, height, rotation) must remain constant. |

### Semantic Evaluation (screenshots)

For each scenario, compile the screenshot series and findings into a structured narrative for visual analysis:

| What to Evaluate | How |
|---|---|
| **Selection highlight alignment** | Compare before/after screenshots — the selection box should tightly hug the element edges. No visible gap, no overlap with other elements. |
| **Marquee rectangle tracking** | In SEL-05 mid-drag screenshots, the translucent rectangle should be visible, anchored at drag start, stretching to current position. |
| **Ghost selection artifacts** | After deselect, screenshot should show clean canvas with no lingering selection pixels. |
| **Multi-selection bounding box** | When multiple elements are selected, a combined box should enclose all of them without cutting through any. |
| **Layer panel highlighting** | Screenshot of layer panel should show the correct layer entry with distinct active/highlight styling. |

---

## Step 6: CONVERGE — When Is It Clean?

### Run Protocol

1. Each scenario runs **independently** — failure in one does not block others.
2. Each scenario runs **3 times minimum** (to surface non-deterministic issues).
3. All findings are aggregated into a single anomaly report per run.

### Clean Criteria

| Finding Level | Threshold for "Clean" |
|---|---|
| Critical | **0** — any critical finding means the feature has a bug |
| Warning | **0** — all warnings must be explained or resolved |
| Info | Documented and accepted at discretion |

### Anomaly Report Format

```json
{
  "category": "Selection & Hit-Testing",
  "scenarios": ["SEL-01", "SEL-02/03", "SEL-04", "SEL-05", "SEL-06", "SEL-07/08", "SEL-09/10", "SEL-11/12", "SEL-13"],
  "runs": 3,
  "summary": {
    "critical": 0,
    "warning": 0,
    "info": 2
  },
  "findings": [
    {
      "code": "SELECTION_BOUNDS_DRIFT",
      "severity": "critical",
      "scenario": "SEL-01",
      "snapshot": "post-select-A",
      "run": 2,
      "detail": "Selection bounds x=102 but element x=100, drift=2px",
      "screenshotRef": "sel-01/run-2/post-select-A.png"
    }
  ],
  "screenshotArtifacts": "test-results/selection-eval/..."
}
```

### The Loop

```
Run all scenarios → Collect findings → 
  If critical/warning > 0:
    Diagnose root cause from findings + screenshots + mutation timeline
    Fix the code
    Re-run
  Else:
    Clean. Category complete.
```

---

## What This Plan Does NOT Do

1. **No `expect().toBe()` assertions.** Findings have severity, not pass/fail.
2. **No store dispatches as user actions.** All interactions are real mouse/keyboard via Playwright.
3. **No reading store state as evaluation criteria.** Store state is captured as ONE layer — divergence between store, DOM, interaction state, and screenshots is what reveals bugs.
4. **No implementation knowledge in what we evaluate.** "The user sees a selection box around the element" — not "Immer store has selectedElementIds containing the ID."
5. **No mocking.** Real app, real rendering, real canvas.
