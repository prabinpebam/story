# Slide layout system
- A margin and column system to define layout of a slide.
- Applied as an overlay that users can't interact with in normal edit mode
- 
- Users can manipulate this only in the Master view mode
- This is defined at a slide level and follows the same nested heirarchy of inheritance that already exists for color theme, Typography style etc
- Objects in slide can snap to the column and margin edges depending on whether layout snapping is enabled or not.

## Slide margins
- An overall margin that's shown all around the slide
- can be set to 0 and a max value allowed by the dimesion of the slide
- Margin value is set same and linked for all 4 by default
    - Margin  values for each side can be controlled separately by delinking
- Default margin value is 40px
- Margin is shown as a rectangle overlay with a border of 1px thickness and a dashed style with 5px dash and 5px gap in the border.
- 

## Column system spec
- A column system that's shown as an overly within the space left after considering the margin.
- Columns are by default uniformly distributed
- Gutters are provided between columns.
    - No gutters before 1st column and after last column. If there's a gutter, it should always be between 2 columns.
    - Gutter widths are linked for a slide, meaning you can have only 1 gutter width in a slide. If you change the value, it changes for all the gutter in that slide.
- Default gutter width is 20px
- Is applied as an overlay that's on top of everything on the slide
     - Default color: #FF0000
     - Default opacity: 10%
     - Users can change these values

## UI and UX
- "Layout guide" is a separate section shown when you are in Master view and for a slide
- UI Controls available
    - Margin [40] | linked/unlink icon
        - When the margin is unlinked
            - Left [40] | Top [40] 
            - Right [40] | Bottom [40] 
    - Column [3]
    - Gutter [20]
    - Color [#FF0000] | Opacity [10%]

    - Use the same existing Color picker control that is used for Fill/Stroke color.
    - Use the same existing Opacity control that is used for Fill/Stroke opacity.

- Use the same standard components that's been used for all other UI in the Property inspector. No new component to be created.

### UI in the viewport
In the viewport control element in the viewport, we add the "Toggle layout guide" button

"viewport-controls"

[Toggle layout guide visibility] [Snapping options] | [Fit to view] | [Zoom out] [zoom display] [Zoom in]

Use appropriate icons for the 2 new addition.


# Snapping options
- Snapping options is shown as a flyout panel component, the same that's used for color picker.
- Snapping can be enabled or disabled separately for the following elements
    - Snap to Object
    - Snap to slide, this includes slide margin, slide edges, slide center.
    - Snap to columns    - 


---

# Appendix — Refined & Completed Spec (v0.2)

This appendix refines, elaborates, and completes the spec above while keeping the original text unchanged.

## Goals

- Provide a slide margin + column guide system that helps users align content consistently.
- Render the system as a non-interactive overlay in Normal Edit mode.
- Allow users to configure the system only in Master View.
- Support inheritance via the existing hierarchy pattern (Master → Layout → Slide), consistent with Color Theme and Typography style resolution.
- Support snapping to layout guide primitives (margins + columns) via a dedicated snapping options flyout.

## Non-goals

- No new “design surface” or draggable guide editing in Normal Edit mode.
- No per-object custom grid definitions.
- No new component primitives in the Property Inspector; reuse existing components and patterns.

## Terminology

- **Layout guide**: the combination of the slide margin rectangle + column overlay + gutters.
- **Content bounds**: the rectangle remaining after margins are applied.
- **Columns**: uniform columns inside the content bounds.
- **Gutters**: uniform spacing between adjacent columns only.
- **Guide overlay**: the rendered visuals on top of the slide.

## Data model (spec-level)

The layout guide is defined at a slide level and supports inheritance. Concretely, the model must exist on:

- Master slide (`type: 'slideMasterPreset'`) — default guide settings for the master.
- Layout master (`type: 'layoutMaster'`) — optional override settings for that layout.
- Normal slide — optional override settings for that slide.

Suggested canonical shape (naming is illustrative; implementation may differ):

- `layoutGuide: {
        enabled: boolean,
        margins: { linked: boolean, all?: number, left?: number, right?: number, top?: number, bottom?: number },
        columns: { count: number, gutter: number },
        appearance: { color: string, opacity: number },
    }`

Notes:

- `enabled` represents the existence/intent of the layout guide for that entity.
- UI visibility (whether the overlay is currently shown) is a viewport/UI state and should be separate from the persisted model unless explicitly specified later.

## Inheritance rules

Inheritance must follow the same nested hierarchy used by theme/typography:

1) **Slide override** (Normal slide record)
2) **Layout master override** (the slide’s active `layoutMaster`)
3) **Master default** (the layout’s `parentMasterId`)
4) **System defaults** (only if nothing exists above)

Within a `layoutGuide` object, inheritance should be field-level rather than “all-or-nothing”:

- If a child defines `layoutGuide.columns.count` but not `layoutGuide.columns.gutter`, the gutter inherits.
- If margins are unlinked, missing sides inherit individually.

## Defaults

Unless overridden by inheritance:

- Margin: **40px** (linked)
- Column count: **3**
- Gutter: **20px**
- Overlay color: **#FF0000**
- Overlay opacity: **10%**

## Validation and constraints

All numeric values are in pixels.

### Margins

- Minimum: `0px`.
- Maximum: clamped so that content bounds remain valid.
    - `left + right < slideWidth`
    - `top + bottom < slideHeight`
- When margins are linked, changing the single Margin value updates all 4 sides.
- When unlinked, each side is editable independently.

### Columns

- Minimum column count: `1`.
- Maximum column count: choose a safe bound for UI + performance (e.g. `24`) and clamp input.
- Columns are uniformly distributed within content bounds.

### Gutter

- Minimum: `0px`.
- Maximum: clamp so that column widths remain non-negative.
- Gutter is a single value applied to all gutters in that slide (always linked).

## Geometry and rendering rules

### Margin overlay

- Render as a rectangle aligned to the slide bounds inset by the margins.
- Border: `1px` dashed with pattern `5px dash / 5px gap`.
- The margin overlay communicates the content bounds; it should not occlude content.

### Column overlay

- Render within the content bounds.
- Columns are visualized as filled rectangles.
- Gutters are visualized as empty space between column rectangles.
- Overlay draws on top of everything on the slide (above content and selection visuals).

### Color and opacity

- Default overlay color: `#FF0000`.
- Default overlay opacity: `10%`.
- Opacity applies to the filled column rectangles.
- The margin rectangle can be rendered using the same color at 100% opacity (for the stroke), or an equivalent readable stroke—implementation should keep the dashed rectangle clearly visible.

## Interaction model

### Normal Edit mode

- Layout guide overlay is non-interactive.
- Users cannot manipulate margins/columns/gutters directly on-canvas.
- Selection and pointer interactions target slide content as usual.

### Master View mode

- Layout guide settings are editable via Property Inspector.
- Editing targets the currently selected master context:
    - If editing a Master slide: updates that master’s `layoutGuide`.
    - If editing a Layout master: updates that layout’s `layoutGuide`.

## UI and UX (Property Inspector)

### Visibility rule

- Show a dedicated **“Layout guide”** section only when:
    - `editor.mode === 'master'`, AND
    - a slide-level entity is selected (Master slide or Layout master), AND
    - no element is selected.

### Controls (Master View)

- Margin
    - Linked/unlink icon (default: linked)
    - When linked: `Margin [40]`
    - When unlinked: show two rows:
        - `Left [40] | Top [40]`
        - `Right [40] | Bottom [40]`
- Column: `Column [3]`
- Gutter: `Gutter [20]`
- Color: `Color [#FF0000]`
- Opacity: `Opacity [10%]`

Notes:

- Reuse the same standard components already used in Property Inspector.
- Color and Opacity must reuse the same controls used for Fill/Stroke (no new components).
- Inputs must clamp to allowed ranges (see Validation).

## Viewport controls

In `viewport-controls`, add two new controls:

- **Toggle layout guide visibility** button
    - Toggles showing/hiding the overlay in the viewport.
    - Should apply to the current viewport (and may persist per session).

- **Snapping options** button
    - Opens a flyout panel component (same pattern as the color picker flyout).

Required layout:

`[Toggle layout guide visibility] [Snapping options] | [Fit to view] | [Zoom out] [zoom display] [Zoom in]`

Use appropriate icons for the two new additions.

## Snapping options (flyout)

Snapping can be enabled/disabled separately for:

- **Snap to Object**
- **Snap to slide**
    - Slide edges
    - Slide center
    - Slide margin edges
- **Snap to columns**
    - Column left/right edges
    - (Optional for v1) Column centers

Notes:

- If “Snap to columns” is enabled but layout guide is not visible, snapping still applies (visibility is not behavior).
- If the effective layout guide (after inheritance) is missing/disabled, “Snap to columns” should have no effect.

## Expected snapping behavior (functional)

- When dragging/resizing an element, snap candidates include:
    - Slide edges/center (if enabled)
    - Margin edges (if enabled)
    - Column edges (if enabled)
- Snapping behavior should be consistent with existing object snapping:
    - Use the same threshold distance.
    - Use the same alignment guide rendering style (if any).

## Acceptance criteria

- Layout guide can be configured in Master View using the Property Inspector section.
- Normal Edit mode does not allow interaction with layout guides.
- Layout guide inherits deterministically (Master → Layout → Slide).
- Viewport has a toggle to show/hide layout guide overlay.
- Snapping options flyout exists and can enable/disable snapping categories independently.
- Elements snap to margin and column edges when the respective snapping options are enabled.

## Test and validation notes (for implementation)

- DOM-level validation for:
    - Layout guide section visibility rules
    - Viewport controls presence
    - Flyout open/close behavior
- Store-level validation for:
    - Correct inheritance resolution of `layoutGuide` per slide
    - Correct persistence on master/layout entities


---

# Implementation plan (principles-compliant)

This plan is intentionally incremental and test-gated. It adheres to:

- Small incremental changes
- Mandatory validation with tests (Vitest + Playwright)
- Design system compliance (global CSS variables + existing common components; no duplicate components)
- Dark/Light mode correctness
- Compatibility: undo/redo, serialization, realtime collaboration

## 0) Pre-flight (discovery + touchpoints)

**Goal:** implement without introducing new UI primitives or ad-hoc styling.

Work:

- Identify existing patterns to reuse:
    - Existing PI number input rows + link/unlink control pattern (used by padding/spacing or similar).
    - Existing Fill/Stroke color picker control + opacity control (for Layout guide Color/Opacity).
    - Existing Flyout pattern used by color picker (for Snapping options).
    - Existing viewport-controls button pattern.
    - Existing snapping engine / snap target architecture.
- Identify where slide DOM root is created and where theme CSS variables are already applied.
    - The Layout guide overlay should be implemented using CSS variables (e.g. `--layout-guide-color`, `--layout-guide-opacity`) to avoid hardcoded CSS values.

Tests:

- None in this step (inspection only).

Risks / mitigations:

- Risk: creating a new, inconsistent flyout/inputs.
  - Mitigation: explicitly reuse the existing color picker flyout and existing PI row primitives.

## 1) Canonical state + resolver (data model + inheritance)

**Goal:** persist layout guide configuration with deterministic inheritance, aligned with the master/layout/slide hierarchy.

Work:

- Add `layoutGuide` to canonical entities:
    - Master slide (`slideMasterPreset`)
    - Layout master (`layoutMaster`)
    - Normal slide
- Add system defaults:
    - Margin default 40 (linked)
    - Columns default 3
    - Gutter default 20
    - Appearance: color #FF0000, opacity 10%
- Add a resolver (StyleResolver-style) to compute **effective** `layoutGuide` for:
    - A slide (Normal Edit mode)
    - A master/layout (Master mode)

Design system notes:

- Keep values in state; rendering consumes resolved model.
- Use CSS variables for runtime styling; do not hardcode new CSS colors.

Undo/redo:

- Use existing store action patterns for updating master/layout/slide properties so changes are undoable.

Serialization/collaboration:

- Ensure `layoutGuide` fields are included in the serialized presentation format.
- Ensure merges treat `layoutGuide` as plain data (no derived fields stored).

Vitest gate (mandatory):

- Unit tests for the resolver:
    - Master-only default resolution
    - Layout overrides inherit missing fields
    - Slide overrides inherit missing fields
    - Field-level inheritance for unlinked margins
- Unit tests for clamping helpers:
    - Prevent margins from collapsing content bounds
    - Prevent gutter from making column widths negative

## 2) Pure geometry calculators (margin/columns)

**Goal:** provide deterministic pixel geometry for the overlay and snapping.

Work:

- Create pure functions (no DOM) that compute:
    - Content bounds rect from slide size + margins
    - Column rects + gutter positions from content bounds + column count + gutter

Performance notes:

- Keep calculators pure and cheap; cache results per slide revision if necessary.

Vitest gate:

- Unit tests for geometry:
    - Default 3 columns / 20 gutter within a known slide size
    - Edge cases: 1 column, 0 gutter, large margins, clamped margins

## 3) Overlay rendering (non-interactive)

**Goal:** render margin rectangle + columns overlay above slide content.

Work:

- Add a dedicated overlay layer inside the slide viewport that:
    - Is always `pointer-events: none`
    - Sits above slide content
    - Is toggled by the viewport “Toggle layout guide visibility” state
- Render:
    - Margin rectangle (1px dashed 5/5)
    - Column fills at 10% opacity using `--layout-guide-opacity`
- Styling constraints:
    - Define CSS in module/global stylesheet using only global tokens.
    - Use CSS custom properties:
        - `--layout-guide-color`
        - `--layout-guide-opacity`
    - Do not introduce new hard-coded color tokens beyond the user-configurable default value.

Dark/Light:

- Overlay color is user-defined; ensure it stays visible in both app themes.
- Dashed border must remain legible (use existing border tokens where possible).

Playwright gate:

- DOM assertions:
    - Overlay layer exists and is non-interactive
    - Margin rectangle exists
    - Column overlays count matches the configured column count

## 4) Property Inspector section (Master View only)

**Goal:** allow configuration only in Master View using existing controls.

Work:

- Add “Layout guide” section to PI with visibility rules:
    - Only in Master View
    - Only when a slide-level entity is selected (Master slide or Layout master)
    - Hidden when any element is selected
- Implement controls:
    - Margin (linked/unlinked)
    - Left/Top/Right/Bottom when unlinked
    - Column count
    - Gutter
    - Color + Opacity
        - Reuse the existing Fill/Stroke color picker control
        - Reuse the existing Fill/Stroke opacity control
- Ensure inputs clamp values and update state via existing store actions.

Undo/redo:

- Each user change should be undoable (same expectations as other PI numeric inputs).

Playwright gate:

- In Master View, verify:
    - Section appears for Master slide and Layout master
    - Section hides when selecting an element
    - Editing margin/columns/gutter updates the correct entity in store
    - Editing Color/Opacity uses existing controls (same DOM structure/testids as Fill/Stroke)

## 5) Viewport controls: “Toggle layout guide visibility” + “Snapping options”

**Goal:** add two controls without new UI primitives.

Work:

- Add buttons to `viewport-controls`:
    - Toggle layout guide visibility
    - Snapping options (opens flyout)
- Store the viewport visibility toggle in UI/editor state (not in the persisted slide model).

Playwright gate:

- DOM assertions for both buttons.
- Toggle changes overlay visibility without mutating slide/master records.

## 6) Snapping options flyout + snapping integration

**Goal:** snapping can be enabled/disabled separately for object/slide/columns.

Work:

- Flyout contents:
    - Snap to Object
    - Snap to slide (edges/center/margin edges)
    - Snap to columns (column left/right edges)
- Integrate into existing snapping engine:
    - When dragging/resizing, include snap targets derived from effective layout guide:
        - Margin edges
        - Column edges
    - Keep existing snap threshold behavior.

Performance:

- Compute snap targets once per drag start if possible.

Playwright gate:

- Toggle snapping options and validate behavior:
    - With Snap to columns ON, dragging a rectangle near a column edge snaps.
    - With Snap to columns OFF, the same drag does not snap to column edges.
    - Snap to slide continues to work.

## 7) Final compatibility + regression gates

**Goal:** ensure app integrity and no regressions.

Work:

- Serialization:
    - Save/load round-trip for `layoutGuide` fields
- Collaboration:
    - Verify updates merge as plain object updates (no derived fields persisted)
- Undo/redo:
    - Ensure PI edits and toggle operations behave as expected

Test gates:

- Vitest: resolver + geometry + clamp + serialization unit tests
- Playwright: end-to-end flow tests for PI + viewport controls + snapping

## Risks, dependencies, mitigation

- Risk: violating design system by introducing new controls.
  - Mitigation: reuse existing Fill/Stroke color + opacity controls and existing flyout pattern.

- Risk: overlay blocks interaction.
  - Mitigation: overlay layer must be `pointer-events: none` and tested.

- Risk: performance regressions while dragging due to snap target computation.
  - Mitigation: cache geometry and snap lines; compute once per drag.

- Dependency: existing snapping engine must support additional snap targets.
  - Mitigation: implement snap targets as an extension of the existing target list, not a parallel system.


