# Story Capability Audit

> **Audit date:** July 10, 2026  
> **Code baseline:** `244df70`  
> **Product target:** [Story Product Specification](product-spec.md)  
> **Scope:** Active source, active specifications, unit/integration tests, headed browser tests, and eval-loop taskflows. Archived documents are historical evidence only.

## 1. How to Read This Audit

This audit separates four facts that older documents often mixed together:

| Status | Meaning |
|---|---|
| **Verified core** | A production runtime path and behavior-focused tests exist for the stated core workflow. This does not imply full Figma or PowerPoint parity. |
| **Partial** | Useful production code exists, but breadth, integration, fidelity, or user workflow is incomplete. |
| **Specified only** | An active specification describes the capability, but no complete production workflow is verified. |
| **Missing** | No adequate product specification or production implementation was found. |

A filename, class, menu item, taskflow row, snapshot, or unit test in isolation does not count as product implementation. Verification requires the user action, resulting document state, and visible or artifact result to agree.

## 2. Executive Finding

Story is already a capable design-first slide editor. Its strongest areas are direct manipulation, shape primitives, non-destructive booleans and masks, layered styling, master/layout inheritance, themes, transitions, speaker notes, and the baseline presentation runtime.

Story does not yet satisfy the combined product goal. The decisive gaps are:

1. A canonical transaction, document, asset, and rendering architecture shared by history, files, collaboration, presentation, and export.
2. Figma-class Auto Layout, constraints, components, instances, variants, variables, geometry-aware hit testing, and complete vector authoring.
3. PowerPoint-class charts, tables, diagrams, animation sequencing, recording, deck organization, comments, and professional output.
4. PPTX interoperability with explicit fidelity and preservation guarantees.
5. Integrated autosave, recovery, multiplayer collaboration, accessibility, and enforceable performance gates.

The next phase should repair shared foundations before adding broad feature families. Otherwise each major capability will deepen incompatible state, history, file, and rendering paths.

## 3. Shared Foundation Audit

| Capability | Status | What exists | Material gap |
|---|---|---|---|
| Document state | **Partial** | Slides and elements use object maps and order arrays; master/layout inheritance resolves effective slides in [Store.js](../../src/core/Store.js) and [InitialState.js](../../src/core/store/InitialState.js). | Persisted document state is mixed with runtime/editor concerns, and some collaboration, file, and test paths still assume array-shaped or top-level elements. |
| Mutation model | **Partial** | Store handlers cover editor, element, slide, master, presentation, text, auth, and UI actions. | There is no single typed transaction boundary. Store snapshots, text history, collaboration operations, and some direct mutations are separate models. |
| Undo and redo | **Partial** | [HistoryManager.js](../../src/core/HistoryManager.js) and handler tests cover many core actions and gesture coalescing. | Local intent, rich-text edits, stable sub-object operations, and remote edits are not unified under one invertible operation model. |
| Scene resolution | **Partial** | Editor, live thumbnails, and presentation reuse [SlideView.js](../../src/core/renderer/SlideView.js) and [ElementFactory.js](../../src/core/renderer/ElementFactory.js). | Export and packaged preview independently reinterpret document features, preventing a general fidelity guarantee. |
| Native files | **Partial** | ZIP serialization, manifests, ordering, assets, migration, and cloud/local provider modules exist under [src/core/storage](../../src/core/storage). | Production load does not consistently map all masters/assets back into the Store and media registry. Autosave and recovery are not integrated end to end. |
| Collaboration engine | **Partial** | SignalR, presence, cursors, vector clocks, batching, and synchronization modules have isolated tests under [tests/collaboration](../../tests/collaboration). | The editor Store does not consume the same operation stream. Real two-client authoring and convergence are not proven. |
| Evaluation infrastructure | **Verified core** | Vitest, headed Playwright, DOM/store/canvas capture, semantic detectors, artifact tests, and performance scenarios are substantial. | Some eval files only capture baselines while claiming broad taskflow ranges; evidence and coverage status are not centrally tracked. |
| Performance governance | **Partial** | Benchmark and soak runners measure startup, rendering, interaction, frames, memory, and clipboard behavior. | The performance registry path is stale, some scenarios produce no data, and stable release gates are not currently enforceable. |
| Accessibility foundation | **Partial** | Named controls, focus handling, keyboard shortcuts, announcements, reduced motion, forced colors, and scoped axe checks exist. | Canvas object traversal, reading order, vector keyboard editing, alt-text workflows, data-object semantics, and accessible output remain incomplete. |

## 4. Figma-Class Design Audit

| Product area | Status | Verified or present today | Required to reach the goal |
|---|---|---|---|
| Canvas and viewport | **Verified core** | Pan, zoom-to-cursor, fit behavior, coordinate mapping, and edit/presentation transform separation exist in [ViewportController.js](../../src/core/canvas/ViewportController.js) and [CanvasManager.js](../../src/core/CanvasManager.js). | Publish trackpad/pinch behavior, large-pasteboard limits, and frame-time gates at realistic document sizes. |
| Selection | **Partial** | Click, marquee, Shift toggle, z-order tie breaking, deep editing for booleans/masks, and multi-selection have browser coverage. | Replace rotated-bounds hit testing with visible fill/stroke/path/clipping semantics; add accessible object traversal and complete nested selection rules. |
| Transforms and snapping | **Verified core** | Move, eight-handle resize, rotation, modifier keys, multi-selection scaling, nested transforms, guides, and snapping are implemented and tested. | Complete align/distribute workflows, transform origin, constraints-aware resizing, and consistent large-selection performance. |
| Primitive shapes | **Verified core** | Rectangle, ellipse, line, arrow, polygon, and star creation is covered at model and rendered-geometry levels. | Complete all declared parametric handles and property parity across inspector, keyboard, files, and export. |
| Vector editing | **Partial** | Node, edge, and handle hit testing; marquee; move; nudge; delete; insertion; and corner/smooth behavior exist. | Build pen creation, open/close/join/reverse/scissors, cubic insertion, segment conversion, continuity controls, compound-path UX, and stable point/segment IDs. |
| Booleans and masks | **Verified core** | Union, subtract, intersect, exclude, editable operands, flatten, nested drill-in, and clip masks are real and tested. | Complete alpha/luminance masks, geometry-accurate interaction, cross-surface fidelity, and collaboration-safe operand operations. |
| Text editing | **Partial** | Content editing, inline formatting, lists, rich paste, sanitization, IME modules, placeholders, autosize, and history bridges exist. | Replace deprecated formatting commands, complete fixed-size wrapping, recovery, tabs/columns/direction/language/OpenType, font portability, and headed IME coverage. |
| Typography system | **Partial** | Theme typography, presets, linked properties, font management, and inspector controls are substantial. | Complete variable-font axes, missing-font workflows, style libraries, selection-scoped parity, export embedding policy, and document-wide audits. |
| Auto Layout | **Missing** | Presentation columns, guides, and slide layouts exist, but they are not an object-level responsive layout model. | Implement horizontal/vertical/wrapped containers, nested layout, padding, gap, alignment, hug/fill/fixed sizing, min/max, absolute children, reorder, inspector, and migration. |
| Responsive constraints | **Missing** | Basic object transforms and slide placeholders exist. | Implement parent-edge constraints, scaling rules, aspect behavior, resize previews, and interoperability with Auto Layout, components, masters, and slide-size changes. |
| Components and instances | **Missing** | Existing “component system” documents UI widgets, not canvas components. | Define component definitions, instances, component sets, variants, properties, overrides, nested instances, swap, reset, detach, libraries, stable IDs, and propagation rules. |
| Variables and design styles | **Partial** | Color themes, typography styles, linked properties, presets, and theme slots exist. | Generalize to typed variables, collections, modes, aliases, spacing/effect/grid styles, team libraries, and safe propagation across components and slides. |
| Fills, strokes, and effects | **Verified core** | Ordered solid/gradient/image/video/code fills, layered strokes, theme-linked colors, shadows, and blurs have production UI and tests. | Complete advanced gradient/pattern policy, all multi-edit mappings, effect styles, arrowhead breadth, asset lifecycle, and output parity. |
| Layers | **Verified core** | Hierarchy, rename, visibility, locking, order, reparenting, and boolean/mask child order exist. | Add search/filter, range selection, isolation, auto-scroll, component semantics, and full accessible tree behavior. |
| Clipboard and Figma import | **Partial** | A substantial editable SVG/Figma importer has corpus tests and fallback warnings. | Enable the supported path for real users, add portable object cut/copy/paste, publish fidelity tiers, inspect artifacts, and expose every degradation. |
| SVG and image export | **Partial** | Element and multi-selection PNG/JPG/WebP/SVG paths support many shapes, paints, booleans, masks, and media fallbacks. | Unify with resolved scene semantics, complete text/effect/media fidelity, support clipboard image output, and report unsupported features. |
| Multiplayer design | **Partial** | Presence and sync building blocks exist. | Integrate with canonical transactions; prove selection, text, ordered collections, vector points, components, offline edits, local undo, and convergence in real clients. |

## 5. PowerPoint-Class Presentation Audit

| Product area | Status | Verified or present today | Required to reach the goal |
|---|---|---|---|
| Slide operations | **Partial** | Add, duplicate, delete, reorder, thumbnails, and core navigation exist. | Complete slide cut/copy/paste, rename, hide UI, sections, search, outline, selected-slide start, and custom shows; repair menu actions that do not reach valid Store handlers. |
| Masters, layouts, placeholders | **Verified core** | Master-layout-slide hierarchy, master mode, inheritance, presets, safe deletion, detach/restore, and reconciliation have meaningful tests. | Add data/diagram/media placeholder families, complete accessible placeholder metadata, and integrate object Auto Layout and components. |
| Themes and templates | **Partial** | Color and typography cascades, linked properties, overrides, and reset behavior are strong. | Build real deck templates, layout families, previews, save-as-template, brand distribution, effects/spacing themes, and compatibility mapping. |
| Speaker notes | **Verified core** | Structured notes, sanitization, editor panel, persistence, and Presenter View rendering exist. | Add search, links and richer formatting parity, notes-page layout, printing/export, and collaboration behavior. |
| Slide transitions | **Verified core** | None, cross-fade, Morph, wipe, push, cover, uncover, directions, duration, inheritance, readiness, and reduced motion are implemented. | Finish the declared compatibility matrix, deterministic video/export behavior, transition gallery polish, and large-deck performance gates. |
| Object animations | **Partial** | Entrance metadata can become ordered click builds during playback. | Build the authoring model and UI for entrance, emphasis, exit, motion path, media cues, state changes, trigger targets, repeat, and copy/paste. |
| Animation sequencer | **Missing** | Timing concepts exist in specs, but no complete authoring timeline is routed in the product. | Implement ordering, On Click, With Previous, After Previous, delay, duration, trigger, grouping, preview, undo, serialization, collaboration, and deterministic playback. |
| Tables | **Missing** | Placeholder names may mention tables, but there is no native editable table model and renderer. | Build cells, rows/columns, selection, merge/split, sizing, styles, formulas policy, paste/import, animation, accessibility, and PPTX mapping. |
| Charts | **Missing** | No native editable chart element and data model is routed by ElementFactory. | Build data editing, common chart families, axes, legends, labels, themes, animation, accessibility, paste/import, and PPTX mapping. |
| Diagrams | **Missing** | No native hierarchy/process/relationship diagram system exists. | Build structured diagram models, layouts, styles, editing, conversion to shapes, accessibility, animation, and compatibility behavior. |
| Media | **Partial** | Image/video fills, asset metadata, deduplication, serialization modules, filters, autoplay, loop, and poster extraction exist. | Add first-class audio/video objects, trim, captions, playback timeline, recording integration, media controls, offline policy, and output fidelity. |
| Presenter View | **Verified core** | Separate presenter window, current/next previews, notes, timer, progress, rehearsal, display swap, recovery, and message validation have direct tests. | Add notes resizing/editing/search, remaining time, richer navigation, physical-display/hotplug handling, and presenter customization. |
| Rehearsal timings | **Partial** | Per-slide and total timing modules exist and are tested. | Add complete review/edit/clear UX, recorded-timing show policy, animation/media timing integration, and export. |
| Recording | **Missing** | No integrated narration/camera/pointer recording workflow exists. | Build capture permissions, narration, camera, ink/pointer, per-slide retake, captions, editing, playback, storage, and video export. |
| Slide show modes | **Partial** | Fullscreen/windowed viewer, start modes, presenter popup, navigation, grid/back stack, hidden-slide skipping, blank screens, laser, and feature-flagged kiosk behavior exist. | Complete show settings, selected/custom shows, recorded timings, narration policy, touch/remote behavior, ink persistence, zoom, and recovery. |
| Audience interaction | **Missing** | Ideas appear in checklists but no accepted model or implementation exists. | Specify and prioritize shared viewing, remote control, polls, Q&A, reactions, captions, moderation, privacy, latency, and offline degradation. |
| Comments and review | **Missing** | A commenter permission label exists, not a comment system. | Build anchored slide/object threads, mentions, replies, resolve/reopen, filters, navigation, notifications, permissions, and file persistence. |
| Multiplayer presentation | **Partial** | Collaboration building blocks and sharing UI exist. | Integrate live editing, comments, presenter/audience roles, follow mode, conflict policy, and multi-client semantic tests. |
| PPTX import/export | **Missing** | There is no OOXML package parser/writer or fidelity corpus. | Build a preservation-first OOXML architecture, feature mapping, unsupported-content storage, compatibility report, golden corpus, and visual/semantic round-trip gates. |
| PDF, video, and web output | **Partial** | Raster/SVG element export and web presentation runtime exist. Some UI/specs claim broader formats. | Implement deck-level PDF, video with timings/media/narration/captions, portable web package, font policy, accessibility, and artifact inspection. |
| Print and handouts | **Specified only** | Presentation documents mention print/handouts; no complete runtime path exists. | Build print preview, slides, notes pages, outlines, configurable handouts, headers/footers, ranges, and color/grayscale policies. |
| Presentation accessibility | **Partial** | Keyboard navigation, live announcements, reduced motion, forced colors, and scoped audits exist. | Add reading order, alt text/decorative metadata, checker, language, accessible tables/charts, captions, accessible PDF/PPTX, and full audience/presenter audits. |
| Reliability and performance | **Partial** | Prefetch, readiness checks, input buffering, fallback, telemetry, benchmark, and soak infrastructure exist. | Integrate autosave/recovery, enforce memory eviction and 10/50/100-slide gates, test missing assets/fonts, and recover from display/window/provider failures. |

## 6. Documentation and Product Contradictions Found

1. The former product specification was a stale catalog with broken links and used “Active” as if it meant implemented.
2. [slides/00-index.md](../specs/slides/00-index.md) points to an older presentation suite while [slides/presentation-mode](../specs/slides/presentation-mode) contains the detailed active delivery specification.
3. Presentation parity and readiness documents disagree about Presenter View and completion.
4. Shape alignment documents still describe booleans and masks as absent despite current production code and browser tests.
5. Auto Layout appears in context-menu documentation even though there is no Auto Layout document model or implementation.
6. Collaboration and several eval taskflows describe end-to-end behavior while current E2E files only capture baselines.
7. PDF appears in UI/spec claims although the exporter implements PNG, JPG, WebP, and SVG.
8. Runtime and storage code use `.str`; several active documents use `.story`.
9. Performance scripts point to a removed documentation path, so the documented gate cannot currently be reproduced.
10. Automation documentation contains a duplicated stale index, and taskflow inventory is presented as test coverage.

## 7. Audit Conclusions

### Preserve and Extend

- Direct manipulation and transform behavior.
- Primitive and vector geometry foundations.
- Non-destructive boolean and mask architecture.
- Layered fills, strokes, effects, themes, and linked properties.
- Master/layout inheritance and reconciliation.
- Transition, notes, presenter, readiness, and prefetch foundations.
- Eval-loop capture and semantic validation approach.

### Repair Before Expansion

- Canonical document schema and state boundaries.
- Typed transaction/history/collaboration model.
- Native-file and asset round trips through the production Store.
- Shared scene resolution for all output surfaces.
- Performance registry and executable release gates.
- Honest evidence-backed documentation status.

### Build as Major Product Programs

- Auto Layout, constraints, components, variants, variables, and libraries.
- Complete vector and text authoring.
- Tables, charts, diagrams, and first-class media.
- Animation sequencer and recording.
- PPTX, PDF, video, print, and compatibility reporting.
- Comments, integrated collaboration, accessibility, and recovery.

The dependency order and acceptance gates are defined in the [Delivery Roadmap](delivery-roadmap.md).