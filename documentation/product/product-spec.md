# Story Parent Capability Charter

> **Status:** Normative parent-capability gateway
> **Owner:** Story product and engineering
> **Last updated:** July 10, 2026
> **Scope:** Preserves the stable `DES`, `PRE`, and `ARC` parent capabilities. The complete normative product specification is [Story Product Specification System v2](specification/README.md).

## Specification v2

The exhaustive specification is divided into 16 numbered volumes so each product concept has one normative owner. Start with:

1. [Product Constitution](specification/01-product-constitution.md) for vision, users, primary wedge, Story Systems, audience editions, narrative components, bounded parity, and outcomes.
2. [Experience Architecture](specification/02-experience-architecture.md) for the canonical shell, five workspace views, scopes, tools, states, adaptive tiers, UI language, and Quiet Stagecraft direction.
3. [Figma-Class Design Authoring](specification/08-figma-class-design-authoring.md) and [PowerPoint-Class Presentation Authoring](specification/09-powerpoint-class-presentation-authoring.md) for detailed familiar capability contracts.
4. [Presentation Runtime](specification/10-presentation-runtime.md) and [Interchange and Output](specification/11-interchange-and-output.md) for deterministic delivery and preservation-first professional output.
5. [R1 Preview Profile](specification/profiles/R1-preview.md) for the first executable 24-workflow product slice.
6. [Familiarity and Story-Native Benchmark](specification/benchmarks/familiarity-and-story-native.md) for the fixed transfer and differentiation tasks.

This charter remains the immutable parent-ID registry. Numbered volumes decompose these broad capabilities into atomic `REQ-*`, `AC-*`, schema, state, flow, objective, protocol, and evidence contracts.

## 1. Product Thesis

Story is a professional presentation design environment with two equally load-bearing capabilities:

1. **Figma-class design capability.** A Figma user should feel at home creating, editing, organizing, and reusing visual design with familiar direct-manipulation tools and interaction patterns.
2. **PowerPoint-class presentation capability.** A PowerPoint user should feel at home authoring, organizing, delivering, sharing, and exporting presentations with familiar presentation workflows.

Story is not a drawing application with a slideshow button, and it is not a slide editor with a decorative vector tool. Design and presentation share one document model, one editing environment, and one fidelity contract.

Parity is the adoption floor. Story's advantage is the governed bridge: one living presentation system can produce reusable narrative components, audience editions, deterministic live runs, and professional outputs without duplicate-deck drift or silent fidelity loss.

## 2. Product Promise

Story must let a user move through this complete workflow without changing tools:

1. Create or open a presentation.
2. Establish a theme, master, layouts, and reusable design components.
3. Design slides with precise vector, text, layout, styling, and media tools.
4. Add data, diagrams, transitions, object animation, narration, and interaction.
5. Review, comment, collaborate, rehearse, and validate accessibility.
6. Present confidently to an audience on one or more displays.
7. Export or exchange the work without silent loss of content or behavior.

The canonical authored document is the source of truth. Canvas, Grid, Outline, Notes, System, thumbnail, presenter, audience, recording, print, and output surfaces are projections of the same semantic contract or declare a bounded degradation.

## 3. Target Users

| User | Existing mental model | Story must preserve | Story must improve |
|---|---|---|---|
| Visual designer | Figma, Sketch, Illustrator | Canvas navigation, selection, layers, vector editing, components, styles, constraints, shortcuts | Presentation structure, delivery, animation, and reusable narrative systems |
| Presentation author | PowerPoint, Keynote, Google Slides | Slides, sections, layouts, themes, notes, transitions, animations, presenter tools, export | Design precision, responsive systems, reusable components, and higher visual fidelity |
| Design-led team | Shared libraries and brand systems | Components, styles, review, multiplayer, permissions | One governed brand system across authoring and delivery |
| Technical creator | Code, data, interactive media | Programmability, data binding, deterministic output | Native visual editing and presentation delivery around technical content |
| Presenter | Presenter View and rehearsal tools | Predictable navigation, notes, timing, displays, recovery | Better audience control, interaction, and observability |

## 4. Product Principles

### 4.1 Familiar Before Novel

Figma-familiar and PowerPoint-familiar behavior is the default. Story may extend those models, but it must not rename, relocate, or subtly alter established behavior without a measurable benefit. When the two products use different conventions, Story must choose a coherent mode-aware behavior and document it.

### 4.2 One Document, Many Surfaces

The same semantic scene drives editing, thumbnails, presentation, presenter view, export, print, and collaboration. A feature is incomplete if it exists on only one rendering surface without an explicit degradation policy.

### 4.3 Presentation Is a First-Class Runtime

Playback is not a preview of the editor. It is a reliable runtime with asset readiness, deterministic sequencing, input handling, reduced-motion support, multi-display behavior, recovery, and performance budgets.

### 4.4 Non-Destructive by Default

Components, masks, booleans, effects, themes, masters, layouts, animation, and media edits remain editable. Destructive operations require an explicit user action and an undoable transaction.

### 4.5 Power Without Fragmentation

Advanced capability must use shared controls, tokens, terminology, selection rules, history, serialization, and accessibility patterns. A new feature must not create a parallel editor, renderer, or state model.

### 4.6 Evidence Over Status Labels

Documentation maturity, implementation maturity, and verification maturity are separate facts. A specification being accepted does not mean the feature is implemented. A module or test filename does not prove a user workflow.

## 5. Figma-Class Design Capability

### 5.1 Canvas and Viewport

**DES-001** Story must provide low-latency pan, zoom-to-cursor, fit selection, fit slide, zoom presets, trackpad/pinch input, and a large pasteboard around slides.

**DES-002** Canvas navigation and tool shortcuts must follow common Figma conventions unless a presentation-specific conflict is explicitly resolved.

**DES-003** Rendering must stay visually stable while zooming, panning, editing vectors, and manipulating large multi-selection bounds.

### 5.2 Selection and Direct Manipulation

**DES-010** Users must be able to select by click, marquee, layer, keyboard traversal, and deep selection through nested groups, masks, booleans, components, and instances.

**DES-011** Hit testing must use visible fill, stroke, path, clipping, and z-order semantics rather than only axis-aligned bounds.

**DES-012** Move, resize, rotate, flip, align, distribute, duplicate-drag, center-resize, constrained transforms, and numeric transforms must work consistently for single and multiple selections.

**DES-013** Continuous gestures must preview in real time and commit as one undoable transaction.

### 5.3 Vector and Shape Authoring

**DES-020** Story must support primitive shapes, lines, arrows, polygons, stars, editable vector paths, compound paths, open and closed contours, and parametric-to-vector conversion.

**DES-021** Vector editing must include pen creation, node and segment selection, add/delete points, bend segments, corner/smooth/mirrored handles, join, open, close, reverse, and scissors operations.

**DES-022** Boolean operations and masks must remain editable, support nesting, and render consistently in editor, presentation, and export.

**DES-023** Geometry, points, segments, operands, fills, and strokes must have stable identities suitable for undo, serialization, and collaboration.

### 5.4 Text and Typography

**DES-030** Users must be able to create point text, auto-width text, auto-height text, fixed-size text, and text on supported paths or shapes.

**DES-031** Rich text must support selection-scoped character and paragraph formatting, lists, tabs, columns, language, direction, OpenType controls, and robust IME input.

**DES-032** Text styles, variable fonts, local and web fonts, missing-font handling, substitution, and font embedding policy must be explicit and portable.

**DES-033** Text editing must preserve selection and content across undo, collaboration, save/load, presentation, and export.

### 5.5 Layout and Responsive Design

**DES-040** Story must provide Auto Layout for horizontal, vertical, wrapped, and nested containers.

**DES-041** Auto Layout must support padding, gap, alignment, distribution, order, absolute children, hug content, fill container, fixed size, min/max size, and nested resizing rules.

**DES-042** Objects must support constraints to parent bounds, aspect-ratio behavior, and predictable resizing across slide sizes and responsive components.

**DES-043** Presentation columns, guides, placeholders, and masters must interoperate with object-level Auto Layout rather than forming a separate layout system.

### 5.6 Components, Styles, and Variables

**DES-050** Users must be able to create components, instances, nested instances, component sets, properties, variants, and interactive states.

**DES-051** Instances must support property overrides, nested overrides, instance swap, reset, expose nested properties, and explicit detach.

**DES-052** Reusable color, typography, effect, grid, and spacing styles must be shareable across a document and team library.

**DES-053** Variables must support typed values, collections, modes, aliases, theme binding, and use in design and presentation properties.

**DES-054** Component and style changes must propagate deterministically without erasing valid instance or slide overrides.

### 5.7 Paint, Effects, and Media

**DES-060** Objects must support ordered fill, stroke, and effect stacks with visibility, opacity, blend mode, reorder, and per-layer editing.

**DES-061** Paints must include solid, gradient, image, video, code, and explicitly supported advanced gradient or pattern types.

**DES-062** Media must support crop, fit, fill, tile where applicable, filters, trim, poster frame, playback behavior, replacement, and asset lifecycle management.

**DES-063** Mixed values and multi-editing must be available for every property where a common operation is meaningful.

### 5.8 Layers, Clipboard, and Interoperability

**DES-070** The layer tree must support hierarchy, naming, search, range selection, visibility, locking, reordering, reparenting, focus isolation, and accessible keyboard operation.

**DES-071** Cut, copy, paste, duplicate, and paste-in-place must use a portable clipboard representation and preserve editability when possible.

**DES-072** Story must import supported Figma/SVG clipboard content through a documented fidelity tier, expose degradations, and never silently rasterize editable content.

**DES-073** SVG import and export must preserve supported geometry, transforms, paint, masks, effects, text, and semantic grouping.

## 6. PowerPoint-Class Presentation Capability

### 6.1 Slide and Deck Organization

**PRE-001** Story must support slide creation, duplication, deletion, reorder, cut/copy/paste, hide/unhide, rename, search, sections, section collapse, and reusable custom shows.

**PRE-002** Users must be able to work in normal, grid/slide-sorter, outline, notes, master, and presentation-oriented views.

**PRE-003** Slide size, orientation, numbering, headers/footers, date, and page setup must be explicit deck properties with migration-safe behavior.

### 6.2 Masters, Layouts, Themes, and Templates

**PRE-010** Story must provide a master-layout-slide inheritance model with editable placeholders, safe overrides, reset, detach, restore, and deterministic reconciliation.

**PRE-011** Layouts must support text, picture, media, chart, table, diagram, and content placeholders with authoring guidance and accessibility metadata.

**PRE-012** Themes must govern colors, fonts, effects, spacing, and background behavior while preserving local overrides.

**PRE-013** Users must be able to create, save, distribute, preview, and apply templates and branded libraries without flattening their content.

### 6.3 Presentation Content Primitives

**PRE-020** Story must provide native editable tables with cell selection, merge/split, sizing, styles, formulas where supported, and accessible header semantics.

**PRE-021** Story must provide native editable charts with a data editor, common chart families, axes, legends, labels, themes, animation, and accessible descriptions.

**PRE-022** Story must provide diagrams for hierarchy, process, relationship, cycle, and timeline use cases with editable structure and conversion to shapes.

**PRE-023** Story must support images, video, audio, SVG, equations, symbols, screen recordings, and embedded web content under explicit security and offline policies.

### 6.4 Transitions and Object Animation

**PRE-030** Slide transitions must support timing, direction, inheritance, reduced motion, readiness gating, and deterministic rendering.

**PRE-031** Object animation must support entrance, emphasis, exit, motion path, media, and state-change effects.

**PRE-032** A sequencer must expose On Click, With Previous, After Previous, duration, delay, repeat, trigger target, grouping, reorder, preview, and copy behavior.

**PRE-033** Animation and Morph matching must use stable identities and produce the same sequence in rehearsal, audience playback, recording, and video export.

### 6.5 Notes, Rehearsal, Recording, and Presenter Tools

**PRE-040** Speaker notes must support structured rich text, links, search, per-slide persistence, presenter display, print, and export.

**PRE-041** Rehearsal must capture per-slide and total timings and let authors review, edit, clear, and use recorded timings.

**PRE-042** Recording must support narration, camera, pointer/ink, slide and animation timing, retake by slide, playback, captions, and export.

**PRE-043** Presenter View must provide current and next slide, notes, elapsed and remaining time, navigation, audience-screen controls, display swap, recovery, and privacy-safe state.

### 6.6 Slide Show and Audience Runtime

**PRE-050** Story must support start from beginning, current slide, selected slide, custom show, windowed, fullscreen, presenter, kiosk, and recorded-timing modes.

**PRE-051** Playback must support keyboard, pointer, touch, remote control, grid navigation, history/back, black/white screen, laser, ink, zoom, captions, and media control.

**PRE-052** Hidden-slide rules, loop behavior, narration policy, timing policy, and end-of-show behavior must be configurable and visible before presenting.

**PRE-053** Audience interaction may include shared viewing, polls, Q&A, reactions, and live captions only when privacy, moderation, latency, and graceful degradation are specified.

### 6.7 Review and Collaboration

**PRE-060** Users must be able to comment on slides and objects, mention people, reply, resolve, reopen, filter, and navigate comment threads.

**PRE-061** Multiplayer editing must provide presence, selections, cursors, conflict-safe operations, offline queues, permissions, and convergence across clients.

**PRE-062** Sharing must support viewer, commenter, and editor roles, link settings, access review, revocation, and provider-independent semantics.

### 6.8 Import, Export, Print, and Compatibility

**PRE-070** PPTX import and export must be a first-class compatibility system with documented fidelity tiers, unsupported-feature preservation, warnings, and a golden round-trip corpus.

**PRE-071** Story must export deck-level PDF, images, SVG where meaningful, video, and web playback with explicit animation, media, font, accessibility, and color policies.

**PRE-072** Printing must support slides, notes pages, outlines, configurable handouts, headers/footers, color/grayscale, page range, and print preview.

**PRE-073** Import or export must never silently discard unsupported content. The user must receive an actionable compatibility report before loss becomes irreversible.

## 7. Unified Architecture Requirements

### 7.1 Canonical Document Model

**ARC-001** Persisted document state must be separated from editor, authentication, presence, cache, playback, and other runtime state.

**ARC-002** Every editable entity and ordered collection must have stable identity, schema versioning, validation, and deterministic migration.

**ARC-003** Master, layout, component, theme, variable, and instance resolution must produce one resolved scene without mutating source data.

### 7.2 Transactions, History, and Collaboration

**ARC-010** Every document mutation must pass through one typed transaction or operation boundary.

**ARC-011** Transactions must be atomic, JSON-safe, replayable, invertible or explicitly snapshot-backed, and capable of coalescing continuous gestures.

**ARC-012** Undo must reverse local intent without restoring over accepted remote edits. Collaboration must consume the same operation stream as local editing.

### 7.3 Rendering and Fidelity

**ARC-020** Editor, thumbnail, presentation, presenter, export, print, and recording must consume common resolved scene semantics.

**ARC-021** Any surface-specific degradation must be declared, observable, tested, and included in compatibility reporting.

**ARC-022** Asset readiness and fallback behavior must prevent blank slides, flashes, reordered builds, and silent media loss.

### 7.4 Storage and Recovery

**ARC-030** Save, close, reopen, migration, and render must preserve semantics, order, stable IDs, assets, notes, themes, masters, components, animation, and unknown compatible fields.

**ARC-031** Autosave, crash recovery, cross-tab coordination, and conflict handling must be integrated into the production app lifecycle.

**ARC-032** The native file extension and format contract must be singular and versioned. Until a deliberate migration is approved, `.str` is canonical.

## 8. Quality Requirements

### 8.1 Performance

Performance gates must cover realistic decks at small, medium, and large scales. At minimum, gates must measure startup, pan/zoom, selection, transform preview, text editing, vector editing, slide navigation, animation frame stability, save/load, export, collaboration convergence, and memory after prolonged use.

No user interaction may synchronously trigger unrelated indexing, network, serialization, or full-document work. Heavy work must be incremental, cached, worker-backed where appropriate, and outside interaction hot paths.

### 8.2 Reliability

Story must prevent data loss under refresh, crash, interrupted save, expired authentication, provider failure, malformed import, unavailable font, missing asset, display disconnect, and presentation-window failure.

Every destructive or lossy boundary must be explicit, recoverable where practical, and covered by artifact-level tests.

### 8.3 Accessibility

The editor, canvas, layers, inspector, dialogs, presenter view, audience view, and exported artifacts must meet WCAG 2.2 AA where applicable. Requirements include keyboard operation, focus visibility, names and roles, canvas object traversal, reading order, alt text and decorative state, captions, reduced motion, forced colors, contrast, language, and accessible tables and charts.

### 8.4 Security and Privacy

Authentication tokens, cloud files, collaboration sessions, external media, embedded web content, code fills, SVG, imports, share links, recording devices, AI requests, and telemetry require explicit trust boundaries and least-privilege behavior. User content must not be sent to an external service without informed consent and a documented retention policy.

### 8.5 Offline and Browser Support

The supported browser, operating-system, input, and offline matrix must be published per release. Core local authoring and native-file access must degrade predictably when authentication or cloud providers are unavailable.

## 9. Definition of Done

A capability is not complete until all applicable conditions are satisfied:

1. Accepted user workflow and edge-case specification.
2. Canonical data model and migration path.
3. Typed transaction behavior with undo and redo.
4. Native-file save, close, and reopen fidelity.
5. Collaboration operation and convergence behavior.
6. Editor, thumbnail, presentation, presenter, export, and print parity or declared degradation.
7. Keyboard and accessibility behavior.
8. Performance budget and realistic benchmark.
9. Unit or integration coverage for deterministic logic.
10. Headed browser validation of visible, hit-testable behavior.
11. Artifact inspection for saved files, imports, exports, recordings, or clipboard data.
12. Documentation status backed by dated evidence from the current code revision.

## 10. Scope and Prioritization Rules

1. Repair shared foundations before adding features that would create a second state, history, rendering, or persistence path.
2. Complete coherent workflows before broadening the number of controls.
3. Prioritize authoring and delivery parity over novelty.
4. Preserve unsupported imported content before attempting lossy conversion.
5. Treat collaboration, serialization, accessibility, and performance as feature requirements, not later hardening phases.
6. Experimental AI and audience features must not block deterministic core workflows or become required for document fidelity.

## 11. Explicit Non-Goals

- Pixel-for-pixel cloning of Figma or PowerPoint chrome.
- Supporting every legacy PowerPoint feature before a reliable modern core exists.
- Treating screenshots or flattened media as parity for editable content.
- Shipping controls whose state cannot survive undo, save/load, collaboration, presentation, and export.
- Using AI-generated output as a substitute for deterministic authoring tools.
- Claiming implementation completeness from documentation or module presence alone.

## 12. Governing Success Criteria

Story reaches the product goal when all of the following are true:

1. Experienced Figma users can complete representative design-system, vector, responsive-layout, and reusable-component tasks without relearning core interactions.
2. Experienced PowerPoint users can complete representative deck organization, master/layout, data-content, animation, rehearsal, presentation, and export tasks without leaving Story.
3. A deck can move from design through live delivery and professional output without silent semantic or visual loss.
4. The same document can be edited collaboratively, reopened from the native format, and rendered across all product surfaces with deterministic results.
5. Performance, accessibility, reliability, and interoperability gates pass on published benchmark decks and supported environments.

This specification is the top-level product contract. Domain specifications may add detail but may not weaken these requirements without an explicit product decision recorded here.
