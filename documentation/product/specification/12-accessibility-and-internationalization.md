# Volume 12: Accessibility and Internationalization

> **Specification ID:** `STORY-SPEC-12`  
> **Volume:** 12 (16 volumes total, 00-15)  
> **Status:** Normative draft  
> **Version:** 2.0.0-draft  
> **Owner:** Accessibility, Internationalization, Editor, Runtime, and Output Engineering  
> **Approvers:** Product, Design, Engineering, Quality, Accessibility, Internationalization, Security  
> **Last reviewed:** July 10, 2026  
> **Review cadence:** At every accepted accessibility, input, language, or accessible-output change and at least once per release train  
> **Normative scope:** Keyboard and assistive-technology operation, canvas object semantics, focus, reading order, alternatives, structured content, captions, visual access, input modalities, language, bidi, IME, localization, and accessible artifacts  
> **Explicit non-ownership:** Canonical entity storage, renderer implementation, format mapping mechanics, general trust policy, implementation status, legal certification, and release evidence  
> **Parent capabilities:** `DES-010`, `DES-031`, `DES-032`, `DES-070`, `PRE-011`, `PRE-020`, `PRE-021`, `PRE-022`, `PRE-023`, `PRE-040`, `PRE-042`, `PRE-043`, `PRE-051`, `PRE-071`, `PRE-072`, `ARC-020`, `ARC-021`  
> **Parent specification:** [Story Product Specification System](README.md)  
> **Governed by:** [Volume 00 - Governance and Traceability](00-governance-and-traceability.md)  
> **Supersedes:** Conflicting or narrower accessibility, input, language, and accessible-output claims in active domain specifications where this volume is more precise  
> **Implementation status:** Out of scope; see the dated [Capability Audit](../capability-audit.md) for evidence-backed current-state reporting

---

## 1. Authority and Scope

This volume is the sole normative owner of accessibility and internationalization behavior across Story's editor, canvas, layer tree, inspector, dialogs, comments, file and sharing surfaces, presentation runtime, Presenter View, recordings, and outputs. Volume 03 owns persistence of the semantic fields defined here; Volume 05 owns their resolved-scene representation; Volume 11 owns format-specific interchange mappings; Volume 15 owns release evidence.

This volume supersedes narrower claims that named toolbar controls, arrow-key nudging, an automated axe scan, a live region, or reduced-motion CSS alone constitute product accessibility. Those are required foundations, not completion. It also supersedes any assumption that visual z-order is automatically reading order, that a canvas bitmap is an accessibility tree, that text direction can be inferred from app locale, or that file existence proves accessible output.

The target is WCAG 2.2 Level AA for applicable web user interfaces and audience playback, plus platform accessibility conventions and applicable EN 301 549 requirements for released environments. Conformance is criterion- and surface-specific; this draft does not itself claim legal or product conformance.

### 1.1 Applicability Surfaces

| Surface | Interactive UI | Authored semantics | Output semantics | Primary users |
|---|:---:|:---:|:---:|---|
| Editor chrome, panels, dialogs | Yes | Displays/edits | No | Authors and reviewers |
| Canvas and pasteboard | Yes | Displays/edits | No | Authors |
| Layers, outline, reading order | Yes | Displays/edits | No | Authors and reviewers |
| Presentation setup and Presenter View | Yes | Displays | Private controls | Presenters |
| Audience view and web playback | Yes | Consumes | Yes | Audience |
| Comments and sharing | Yes | Comment semantics | Notifications | Collaborators |
| `.str` package | No | Persists | Source | All downstream surfaces |
| PDF, print, PPTX, web, video, captions | Format-dependent | Consumes | Yes | Recipients |

### 1.2 Normative Language

`MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, and `MAY` are normative. Every `REQ-12-*` row has one primary normative statement and one independently testable outcome.

## 2. Semantic Accessibility Model

Story must expose authored content through a semantic model parallel to, but derived from the same canonical document and resolved scene as, visual rendering.

### 2.1 Schemas

**`SCH-12-001 AccessibleDocument`**

| Field | Type | Rule |
|---|---|---|
| `defaultLanguage` | canonical BCP 47 tag | Required; inherited unless overridden. |
| `title` | plain text | Human-readable document title. |
| `description` | optional plain text | Purpose/context, not filename duplication. |
| `slides` | ordered stable slide IDs | Presentation order, including hidden/custom-show metadata. |
| `accessibilityRevision` | integer | Changes when authored accessibility semantics change. |

**`SCH-12-002 AccessibleSlide`** contains stable slide ID, title, language override, reading-order list, hidden/custom-show state, optional summary, speaker-note exposure policy, and references to semantic nodes.

**`SCH-12-003 AccessibleNode`** contains a canonical `StableAddress`, a derived semantic-node ID scoped to one resolution result, semantic role, accessible name, optional description, decorative state, language, text direction, reading-order participation, group/parent relation, content-specific metadata, and source provenance. It contains no runtime DOM ID. Persisted authored metadata addresses canonical entities or sub-entities; derived semantic IDs are adapters only.

**`SCH-12-004 ReadingOrder`** is a duplicate-free ordered list of canonical `StableAddress` values plus explicit group boundaries. It is independent from paint/z-order and excludes decorative nodes. Unknown or deleted addresses are validation errors; newly inserted meaningful nodes enter a visible unresolved state until placed by deterministic policy or the author. Resolution maps each address to zero or more derived semantic nodes with explicit occurrence context.

**`SCH-12-005 TextSemantics`** contains Unicode text, paragraphs, list hierarchy, language spans, base direction, directional isolates/overrides only when authored, links, emphasis, and heading/placeholder semantics without using visual styling as the sole semantic signal.

**`SCH-12-006 AlternativeRepresentation`** contains status (`meaningful`, `decorative`, `complex`, `needs-review`), concise alternative text, optional long description, optional data/table reference, author/revision provenance, and localization state.

**`SCH-12-007 TimedTextTrack`** contains stable track/cue IDs, kind (`captions`, `subtitles`, `descriptions`, `chapters`), BCP 47 language, label, default flag, cue start/end, text and speaker/sound semantics, provenance, and validation state.

**`SCH-12-008 DataObjectSemantics`** contains table headers/scopes or chart/diagram title, summary, series/category labels, underlying data reference, reading sequence, and fallback table/description policy.

### 2.2 Model Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-001` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Every meaningful rendered scene node **MUST** resolve to a semantic node mapped back to a canonical stable address or an explicitly declared non-semantic decoration. | `AC-12-001` |
| `REQ-12-002` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Editor, audience, presenter, export, print, and recording surfaces **MUST** consume the same resolved accessibility semantics. | `AC-12-002` |
| `REQ-12-003` | [ARC-021](../product-spec.md#73-rendering-and-fidelity) | A surface that cannot preserve a semantic feature **MUST** report the degradation before irreversible output. | `AC-12-003` |
| `REQ-12-004` | [ARC-002](../product-spec.md#71-canonical-document-model) | Persisted accessibility entities, reading-order entries, timed-text cues, and language spans **MUST** use canonical migration-safe identities or stable addresses rather than derived scene identities. | `AC-12-004` |
| `REQ-12-005` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Accessibility metadata **MUST** survive undo, collaboration, save/reopen, migration, and supported interchange. | `AC-12-005` |
| `REQ-12-006` | [ARC-003](../product-spec.md#71-canonical-document-model) | Inherited accessibility metadata **MUST** resolve without mutating masters, layouts, components, instances, or source slides. | `AC-12-006` |
| `REQ-12-007` | [PRE-011](../product-spec.md#62-masters-layouts-themes-and-templates) | Placeholders **MUST** carry semantic purpose and accessibility defaults appropriate to their content type. | `AC-12-007` |
| `REQ-12-008` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Runtime editor state such as selection, hover, cursors, and panels **MUST NOT** enter authored accessibility semantics. | `AC-12-008` |

### 2.3 Invariants

| ID | Invariant |
|---|---|
| `INV-12-001` | Visual z-order and semantic reading order may differ; changing one never silently changes the other. |
| `INV-12-002` | Every reading-order participant appears exactly once within its slide's semantic order. |
| `INV-12-003` | A node cannot be both decorative and expose a meaningful accessible name or interactive behavior. |
| `INV-12-004` | Hidden editor chrome and private Presenter View content are absent from the audience accessibility tree. |
| `INV-12-005` | A keyboard operation and its pointer equivalent commit through the same canonical transaction. |
| `INV-12-006` | IME composition text is never split into partial document operations before composition commit. |
| `INV-12-007` | Language and direction are semantic content properties, not inferred permanently from UI locale or font. |
| `INV-12-008` | Reduced-motion behavior preserves information, order, and control even when animation is removed. |
| `INV-12-009` | Forced-colors operation does not rely on author or app colors as the sole indicator of state. |
| `INV-12-010` | Accessible output is judged by parsed semantic structure and assistive-technology behavior, not visual similarity alone. |

## 3. Application UI, Focus, and Announcements

### 3.1 UI Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-009` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Every enabled application command **MUST** be operable without a pointer. | `AC-12-009` |
| `REQ-12-010` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Every interactive control **MUST** expose a correct accessible name, role, state, value, and relationship. | `AC-12-010` |
| `REQ-12-011` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Keyboard focus **MUST** remain visibly identifiable in default, themed, reduced-transparency, and forced-colors modes. | `AC-12-011` |
| `REQ-12-012` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Focus movement **MUST** follow the visual and task order of the active surface rather than DOM accidents. | `AC-12-012` |
| `REQ-12-013` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Modal surfaces **MUST** contain focus while open and restore it to the invoking control or deterministic successor when closed. | `AC-12-013` |
| `REQ-12-014` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Non-modal panels, flyouts, menus, and popovers **MUST** implement their platform-appropriate keyboard and dismissal patterns. | `AC-12-014` |
| `REQ-12-015` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Disabled, unavailable, busy, invalid, mixed, selected, expanded, and pressed states **MUST** be conveyed without color alone. | `AC-12-015` |
| `REQ-12-016` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Dynamic status changes **MUST** use appropriately prioritized, non-duplicative announcements that do not interrupt text entry. | `AC-12-016` |
| `REQ-12-017` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Error messages **MUST** identify the affected field or action and provide a keyboard-reachable correction or recovery path. | `AC-12-017` |
| `REQ-12-018` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Repeated toolbars and regions **MUST** expose unique labels and efficient bypass/navigation mechanisms. | `AC-12-018` |
| `REQ-12-019` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Keyboard shortcuts **MUST** avoid unmodified printable-character capture while text editing and support conflict discovery/remapping where platform policy requires. | `AC-12-019` |
| `REQ-12-020` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Time-limited UI **MUST** permit extension, pause, or disablement unless the limit is essential and documented. | `AC-12-020` |

### 3.2 Focus State Machine

**`SM-12-001 Editor focus`**

| State | Focus owner | `Enter` / activation | `Escape` / return |
|---|---|---|---|
| `chrome-navigation` | App control | Invokes control or enters composite | Returns from transient child |
| `canvas-navigation` | Semantic canvas proxy | Selects focused object or enters object action mode | Returns to canvas region/chrome |
| `object-action` | Selected semantic object | Opens action menu or content-specific editing | Returns to canvas navigation |
| `text-edit` | Native editing host | Inserts text/activates text command | Ends deepest text mode only when no IME composition is active |
| `vector-edit` | Vector semantic sub-object | Selects point/segment action | Returns to parent object action |
| `layers-navigation` | Accessible tree item | Selects/expands/reorders by documented keys | Returns to layers region |
| `modal` | Modal control | Context-specific | Closes when permitted and restores invoker |
| `presentation-controls` | Audience/presenter control | Invokes show command | Exits transient surface or show according to mode |

Focus context must survive benign rerender, theme change, collaboration updates, and property changes. If the focused target is deleted, focus moves to a deterministic sibling, parent, region, or invoking control and announces the deletion once.

## 4. Keyboard Canvas Object Model

The canvas exposes a semantic composite widget backed by an offscreen or DOM accessibility representation synchronized to stable scene nodes. The visual rendering technology remains an implementation choice; the semantic proxy must not create duplicate accessible content.

### 4.1 Navigation Model

**`FLOW-12-001 Keyboard canvas traversal`**

1. `Tab` enters the canvas region at its last focused object or first reading-order object.
2. `Tab` leaves the canvas to the next application region; it does not traverse every object.
3. `ArrowUp` and `ArrowDown` move through authored reading order; `Home` and `End` move to its ends.
4. `ArrowLeft` collapses an expanded semantic group or moves to its semantic parent; `ArrowRight` expands a collapsed semantic group or enters its first reading-order child. On a leaf, either key is a no-op announced only on explicit help request.
5. `Enter` selects or enters the object's action/edit mode; `Shift+F10` opens its context menu.
6. `Escape` exits the deepest mode one level at a time.
7. An explicit command moves focus between canvas, layers, inspector, and reading-order editor while preserving the same stable object target.

Arrow keys manipulate geometry only in `object-action`, `text-edit`, or `vector-edit` according to the active object's documented command map. Spatial proximity never replaces authored reading order in `canvas-navigation`.

### 4.2 Canvas Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-021` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | The canvas **MUST** expose a screen-reader-navigable object model synchronized with resolved semantic nodes and their canonical stable-address mappings. | `AC-12-021` |
| `REQ-12-022` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Canvas traversal **MUST** follow authored reading order by default. | `AC-12-022` |
| `REQ-12-023` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Canvas object focus **MUST** expose type, name, position in reading order, selection state, lock/visibility state, and available actions. | `AC-12-023` |
| `REQ-12-024` | [DES-012](../product-spec.md#52-selection-and-direct-manipulation) | Every essential object transform **MUST** have a keyboard and numeric-inspector path. | `AC-12-024` |
| `REQ-12-025` | [DES-012](../product-spec.md#52-selection-and-direct-manipulation) | Keyboard move, resize, rotate, align, distribute, reorder, reparent, duplicate, and delete **MUST** share pointer transaction and undo semantics. | `AC-12-025` |
| `REQ-12-026` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Nested groups, masks, booleans, components, instances, tables, charts, and diagrams **MUST** expose enter, traverse, and exit semantics. | `AC-12-026` |
| `REQ-12-027` | [DES-020](../product-spec.md#53-vector-and-shape-authoring), [DES-021](../product-spec.md#53-vector-and-shape-authoring) | Vector edit mode **MUST** expose points, segments, handles, continuity, and supported commands through keyboard-operable stable sub-objects. | `AC-12-027` |
| `REQ-12-028` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Multi-selection **MUST** expose selection count, mixed state, active target, and add/remove/range commands without pointer precision. | `AC-12-028` |
| `REQ-12-029` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Canvas zoom and pan **MUST** preserve semantic focus and provide focus/selection reveal commands. | `AC-12-029` |
| `REQ-12-030` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Offscreen, clipped, hidden, locked, inherited, and decorative nodes **MUST** have explicit traversal inclusion rules. | `AC-12-030` |
| `REQ-12-031` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Snap, constraint, measurement, collision, and invalid-drop feedback **MUST** have non-visual announcements or inspector equivalents. | `AC-12-031` |
| `REQ-12-032` | [DES-070](../product-spec.md#58-layers-clipboard-and-interoperability) | The layer tree **MUST** implement an accessible hierarchical tree with keyboard selection, expansion, range selection, reorder, and reparent. | `AC-12-032` |
| `REQ-12-033` | [DES-070](../product-spec.md#58-layers-clipboard-and-interoperability) | Layer, canvas, and inspector focus **MUST** remain synchronized by stable object identity without forcing focus between regions. | `AC-12-033` |
| `REQ-12-034` | [DES-013](../product-spec.md#52-selection-and-direct-manipulation) | Continuous keyboard gestures **MUST** use documented increments, acceleration policy, and one coherent history boundary. | `AC-12-034` |

## 5. Reading Order and Authored Text Alternatives

### 5.1 Reading Order

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-035` | [PRE-011](../product-spec.md#62-masters-layouts-themes-and-templates), [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Every slide **MUST** persist an author-reviewable reading order of canonical stable addresses independent from visual stacking. | `AC-12-035` |
| `REQ-12-036` | [PRE-011](../product-spec.md#62-masters-layouts-themes-and-templates) | New layouts and placeholders **MUST** provide deterministic semantic order defaults that slides may override. | `AC-12-036` |
| `REQ-12-037` | [ARC-003](../product-spec.md#71-canonical-document-model) | Group and component semantics **MUST** define whether children are flattened, nested, summarized, or hidden from reading order. | `AC-12-037` |
| `REQ-12-038` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Reorder, duplicate, paste, detach, delete, and layout reset **MUST** reconcile reading order without duplicate or dangling entries. | `AC-12-038` |
| `REQ-12-039` | [PRE-001](../product-spec.md#61-slide-and-deck-organization) | Slide sorter and outline views **MUST** expose presentation order, hidden state, sections, and custom-show inclusion accessibly. | `AC-12-039` |

### 5.2 Alternatives and Validation

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-040` | [PRE-011](../product-spec.md#62-masters-layouts-themes-and-templates), [PRE-023](../product-spec.md#63-presentation-content-primitives) | Every non-text meaningful visual **MUST** have an alternative representation or an explicit unresolved accessibility issue. | `AC-12-040` |
| `REQ-12-041` | [PRE-011](../product-spec.md#62-masters-layouts-themes-and-templates) | Authors **MUST** be able to mark a non-interactive visual decorative without entering placeholder alternative text. | `AC-12-041` |
| `REQ-12-042` | [PRE-011](../product-spec.md#62-masters-layouts-themes-and-templates) | Complex visuals **MUST** support both a concise name and a long description or structured data alternative. | `AC-12-042` |
| `REQ-12-043` | [PRE-011](../product-spec.md#62-masters-layouts-themes-and-templates) | Automatic alternative-text suggestions **MUST** remain visibly unapproved until an author accepts or edits them. | `AC-12-043` |
| `REQ-12-044` | [PRE-011](../product-spec.md#62-masters-layouts-themes-and-templates) | Generated or imported alternative text **MUST** retain provenance and language metadata. | `AC-12-044` |
| `REQ-12-045` | [PRE-011](../product-spec.md#62-masters-layouts-themes-and-templates) | Hyperlinks **MUST** expose purpose from accessible text or associated context and identify unsafe or unavailable destinations. | `AC-12-045` |
| `REQ-12-046` | [PRE-011](../product-spec.md#62-masters-layouts-themes-and-templates) | The accessibility checker **MUST** identify missing alternatives, ambiguous links, invalid order, language gaps, contrast risks, caption gaps, and data-object semantic errors. | `AC-12-046` |
| `REQ-12-047` | [PRE-011](../product-spec.md#62-masters-layouts-themes-and-templates) | Checker findings **MUST** navigate to the affected stable object and provide a keyboard-operable repair workflow. | `AC-12-047` |
| `REQ-12-048` | [PRE-011](../product-spec.md#62-masters-layouts-themes-and-templates) | Accessibility warnings **MUST** distinguish blocking output defects, review-required risks, and advisory improvements. | `AC-12-048` |

## 6. Native Tables, Charts, Diagrams, Equations, and Media

### 6.1 Structured Content Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-049` | [PRE-020](../product-spec.md#63-presentation-content-primitives) | Native tables **MUST** expose caption/title, row and column counts, header cells, scopes, merged-cell relationships, and cell content. | `AC-12-049` |
| `REQ-12-050` | [PRE-020](../product-spec.md#63-presentation-content-primitives) | Table editing **MUST** support keyboard cell navigation, selection, edit, row/column operations, and header assignment. | `AC-12-050` |
| `REQ-12-051` | [PRE-021](../product-spec.md#63-presentation-content-primitives) | Native charts **MUST** expose title, summary, series, categories, values, units, trends, and an accessible data-table alternative. | `AC-12-051` |
| `REQ-12-052` | [PRE-021](../product-spec.md#63-presentation-content-primitives) | Chart interaction **MUST** provide keyboard traversal of meaningful data points without requiring hover. | `AC-12-052` |
| `REQ-12-053` | [PRE-022](../product-spec.md#63-presentation-content-primitives) | Structured diagrams **MUST** expose node labels, relationship types, hierarchy or sequence, and a linear alternative. | `AC-12-053` |
| `REQ-12-054` | [PRE-023](../product-spec.md#63-presentation-content-primitives) | Equations **MUST** retain a machine-readable mathematical representation and a text alternative through supported outputs. | `AC-12-054` |
| `REQ-12-055` | [PRE-023](../product-spec.md#63-presentation-content-primitives) | Audio and video **MUST** support synchronized captions and identify caption availability and language before playback. | `AC-12-055` |
| `REQ-12-056` | [PRE-023](../product-spec.md#63-presentation-content-primitives) | Prerecorded audio-only and video-only content **MUST** support applicable transcripts or audio-description alternatives. | `AC-12-056` |
| `REQ-12-057` | [PRE-023](../product-spec.md#63-presentation-content-primitives) | Media controls **MUST** be keyboard and assistive-technology operable with named state, time, volume, captions, and playback rate. | `AC-12-057` |
| `REQ-12-058` | [PRE-042](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | Recording workflows **MUST** let authors review, edit, regenerate, import, export, and validate caption tracks by slide and timeline. | `AC-12-058` |
| `REQ-12-059` | [PRE-042](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | Live captions **MUST** identify language, confidence/review status, speaker policy, latency state, and retention behavior. | `AC-12-059` |

## 7. Presentation and Presenter Accessibility

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-060` | [PRE-051](../product-spec.md#66-slide-show-and-audience-runtime) | Audience playback **MUST** expose the current slide's authored semantic order without editor-only controls or private content. | `AC-12-060` |
| `REQ-12-061` | [PRE-051](../product-spec.md#66-slide-show-and-audience-runtime) | Slide and build changes **MUST** be announced with title, position, and changed content at a user-controllable verbosity. | `AC-12-061` |
| `REQ-12-062` | [PRE-051](../product-spec.md#66-slide-show-and-audience-runtime) | Audience controls **MUST** support keyboard, touch, switch/voice-compatible names, focus visibility, and non-gesture alternatives. | `AC-12-062` |
| `REQ-12-063` | [PRE-043](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | Presenter View **MUST** expose current slide, next slide, notes, timing, captions, navigation, and audience controls in a coherent private focus order. | `AC-12-063` |
| `REQ-12-064` | [PRE-043](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | Speaker notes and diagnostics **MUST** remain absent from the audience DOM, accessibility tree, messages, and output stream unless explicitly published. | `AC-12-064` |
| `REQ-12-065` | [PRE-050](../product-spec.md#66-slide-show-and-audience-runtime) | Kiosk and timed shows **MUST** provide an accessible exit, pause, and timing policy unless a documented controlled-environment exception applies. | `AC-12-065` |
| `REQ-12-066` | [PRE-051](../product-spec.md#66-slide-show-and-audience-runtime) | Laser, ink, zoom, blank screen, polls, and audience interactions **MUST** communicate equivalent state without relying on visual position or color alone. | `AC-12-066` |
| `REQ-12-067` | [PRE-051](../product-spec.md#66-slide-show-and-audience-runtime) | Presentation recovery messages **MUST** remain presenter-only when they would distract or disclose private state to the audience. | `AC-12-067` |

## 8. Visual, Motion, Touch, and Pen Accessibility

### 8.1 Visual and Motion Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-068` | [DES-003](../product-spec.md#51-canvas-and-viewport), [PRE-051](../product-spec.md#66-slide-show-and-audience-runtime) | App controls and required authored-content indicators **MUST** meet WCAG 2.2 AA contrast criteria in supported themes and states. | `AC-12-068` |
| `REQ-12-069` | [DES-003](../product-spec.md#51-canvas-and-viewport) | Selection, focus, handles, guides, collaborator indicators, errors, and mixed states **MUST** remain distinguishable without color alone. | `AC-12-069` |
| `REQ-12-070` | [DES-003](../product-spec.md#51-canvas-and-viewport), [PRE-051](../product-spec.md#66-slide-show-and-audience-runtime) | Story **MUST** remain operable at 200% browser zoom and the applicable reflow/text-spacing criteria without loss or overlap. | `AC-12-070` |
| `REQ-12-071` | [DES-003](../product-spec.md#51-canvas-and-viewport), [PRE-051](../product-spec.md#66-slide-show-and-audience-runtime) | Forced-colors mode **MUST** preserve visible controls, focus, selection, boundaries, and state using system colors or verified mappings. | `AC-12-071` |
| `REQ-12-072` | [PRE-030](../product-spec.md#64-transitions-and-object-animation), [PRE-031](../product-spec.md#64-transitions-and-object-animation) | Reduced-motion mode **MUST** replace non-essential transitions, morphs, autoplay movement, parallax, and animated feedback with immediate or low-motion equivalents. | `AC-12-072` |
| `REQ-12-073` | [PRE-030](../product-spec.md#64-transitions-and-object-animation), [PRE-031](../product-spec.md#64-transitions-and-object-animation) | Motion essential to understanding **MUST** have a static, stepped, textual, or user-controlled alternative. | `AC-12-073` |
| `REQ-12-074` | [PRE-023](../product-spec.md#63-presentation-content-primitives), [PRE-051](../product-spec.md#66-slide-show-and-audience-runtime) | Flashing content **MUST** remain below WCAG seizure thresholds or be blocked with a safe replacement. | `AC-12-074` |
| `REQ-12-075` | [DES-003](../product-spec.md#51-canvas-and-viewport) | Authoring UI **MUST** respect platform text scaling, contrast, reduced motion, reduced transparency where available, and user theme preferences independently. | `AC-12-075` |

### 8.2 Pointer, Touch, and Pen Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-076` | [DES-012](../product-spec.md#52-selection-and-direct-manipulation) | Essential actions **MUST** have a single-pointer alternative to multipoint or path-based gestures. | `AC-12-076` |
| `REQ-12-077` | [DES-012](../product-spec.md#52-selection-and-direct-manipulation) | Pointer cancellation **MUST** avoid committing destructive actions on down-event and permit abort before completion. | `AC-12-077` |
| `REQ-12-078` | [DES-012](../product-spec.md#52-selection-and-direct-manipulation) | Interactive targets **MUST** meet the applicable WCAG 2.2 target-size minimum or spacing exception. | `AC-12-078` |
| `REQ-12-079` | [DES-012](../product-spec.md#52-selection-and-direct-manipulation) | Touch manipulation **MUST** distinguish viewport gestures from object gestures and expose equivalent commands. | `AC-12-079` |
| `REQ-12-080` | [DES-012](../product-spec.md#52-selection-and-direct-manipulation) | Pen pressure, tilt, barrel button, and hover **MUST** be optional enhancements rather than the sole path to authored outcomes. | `AC-12-080` |

## 9. Language, Locale, Bidi, and IME

### 9.1 Language and Locale

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-081` | [DES-031](../product-spec.md#54-text-and-typography) | The application UI **MUST** externalize user-facing strings and format messages without concatenation-dependent grammar. | `AC-12-081` |
| `REQ-12-082` | [DES-031](../product-spec.md#54-text-and-typography) | UI locale **MUST** use canonical BCP 47 tags with deterministic fallback independent from document language. | `AC-12-082` |
| `REQ-12-083` | [DES-031](../product-spec.md#54-text-and-typography) | Dates, times, numbers, percentages, currencies, lists, plurals, and measurement display **MUST** use locale-aware formatting while persisted numeric values remain locale-neutral. | `AC-12-083` |
| `REQ-12-084` | [DES-031](../product-spec.md#54-text-and-typography) | Locale-aware inputs **MUST** parse accepted separators and digits without corrupting canonical values or formulas. | `AC-12-084` |
| `REQ-12-085` | [DES-031](../product-spec.md#54-text-and-typography) | Layout **MUST** tolerate translated expansion, contraction, font substitution, and pseudo-localization without clipping or overlap. | `AC-12-085` |
| `REQ-12-086` | [DES-031](../product-spec.md#54-text-and-typography) | Search, sort, case conversion, line breaking, word selection, and spellcheck **MUST** use declared language and locale-aware behavior. | `AC-12-086` |

### 9.2 Authored Language and Direction

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-087` | [DES-031](../product-spec.md#54-text-and-typography) | Presentation, slide, paragraph, and text-run language **MUST** be authorable, inheritable, and persisted as canonical BCP 47 tags. | `AC-12-087` |
| `REQ-12-088` | [DES-031](../product-spec.md#54-text-and-typography) | Paragraph base direction **MUST** support `ltr`, `rtl`, and `auto` independently from text alignment. | `AC-12-088` |
| `REQ-12-089` | [DES-031](../product-spec.md#54-text-and-typography) | Mixed-direction text **MUST** preserve Unicode bidi isolation, punctuation, numbers, neutrals, and inline-object placement through edit and output. | `AC-12-089` |
| `REQ-12-090` | [DES-031](../product-spec.md#54-text-and-typography) | Direction-aware controls, icons, keyboard navigation, and spatial commands **MUST** mirror only where meaning requires it. | `AC-12-090` |
| `REQ-12-091` | [DES-031](../product-spec.md#54-text-and-typography) | Vertical and complex-script text **MUST** be either supported with published shaping behavior or preserved and reported without silent corruption. | `AC-12-091` |
| `REQ-12-092` | [DES-032](../product-spec.md#54-text-and-typography) | Font fallback **MUST** select glyph-capable fonts without changing canonical text or hiding missing-glyph diagnostics. | `AC-12-092` |

### 9.3 IME and Text Editing

**`SM-12-002 IME composition`**

```text
idle -> composing -> updating* -> committed -> idle
                   -> cancelled -> idle
```

While `composing`, Story may render the browser-owned composition preview but may not split it into canonical text operations, trigger global printable shortcuts, destructively normalize the selection, or end edit mode. Commit produces one coherent text transaction with stable before/after anchors.

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-093` | [DES-031](../product-spec.md#54-text-and-typography), [DES-033](../product-spec.md#54-text-and-typography) | Text editing **MUST** preserve browser IME composition lifecycle and candidate interaction. | `AC-12-093` |
| `REQ-12-094` | [DES-033](../product-spec.md#54-text-and-typography) | IME commit **MUST** produce one canonical undoable and collaboration-safe text intent. | `AC-12-094` |
| `REQ-12-095` | [DES-031](../product-spec.md#54-text-and-typography) | Global shortcuts, save, blur, remote edits, and mode changes **MUST** defer or reconcile safely while composition is active. | `AC-12-095` |
| `REQ-12-096` | [DES-031](../product-spec.md#54-text-and-typography) | Text selection and caret movement **MUST** respect grapheme clusters, combining marks, surrogate pairs, emoji sequences, and bidi boundaries. | `AC-12-096` |
| `REQ-12-097` | [DES-031](../product-spec.md#54-text-and-typography) | Rich-text copy, paste, undo, collaboration, save/reopen, and output **MUST** preserve normalized Unicode content without lossy forced normalization. | `AC-12-097` |

## 10. Accessible Outputs

Accessible output is format-specific and may be unavailable in a release tier, but enabled output must never imply accessibility from a visual export alone.

### 10.1 Output Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-098` | [PRE-071](../product-spec.md#68-import-export-print-and-compatibility), [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Portable web output **MUST** expose document language, headings, reading order, alternatives, data semantics, captions, keyboard controls, and visible focus. | `AC-12-098` |
| `REQ-12-099` | [PRE-071](../product-spec.md#68-import-export-print-and-compatibility) | Accessible PDF output **MUST** contain a valid tagged structure tree, language, title, reading order, alternatives, tables, links, and artifact markings where supported. | `AC-12-099` |
| `REQ-12-100` | [PRE-070](../product-spec.md#68-import-export-print-and-compatibility) | PPTX interchange **MUST** map supported reading order, alternatives, language, table/chart semantics, and captions or report each degradation. | `AC-12-100` |
| `REQ-12-101` | [PRE-072](../product-spec.md#68-import-export-print-and-compatibility) | Print and handout output **MUST** preserve readable order, text alternatives or descriptions where the format permits, and non-color-only meaning. | `AC-12-101` |
| `REQ-12-102` | [PRE-071](../product-spec.md#68-import-export-print-and-compatibility) | Video output **MUST** support selectable or burned-in captions according to explicit author choice and export sidecar timed text when selected. | `AC-12-102` |
| `REQ-12-103` | [PRE-071](../product-spec.md#68-import-export-print-and-compatibility) | Raster and SVG output **MUST** expose their accessibility limitations and preserve safe metadata only where the destination contract supports it. | `AC-12-103` |
| `REQ-12-104` | [PRE-073](../product-spec.md#68-import-export-print-and-compatibility) | The preflight report **MUST** identify output-specific accessibility loss before export and link each issue to a repair or acknowledged waiver. | `AC-12-104` |
| `REQ-12-105` | [PRE-071](../product-spec.md#68-import-export-print-and-compatibility) | Output language variants **MUST** preserve stable semantic mapping and disclose untranslated or stale alternatives and captions. | `AC-12-105` |

## 11. Failure and Rescue Semantics

| Failure | Detection | Required rescue | Forbidden behavior |
|---|---|---|---|
| Semantic proxy missing/stale | Node/revision mismatch | Rebuild from canonical scene, retain focus target, announce temporary unavailability | Expose duplicate or wrong objects |
| Focused object deleted | Accepted mutation | Move to deterministic sibling/parent/region and announce once | Drop focus to body silently |
| Reading order invalid | Duplicate/dangling/new unresolved node | Preserve prior valid order, surface checker repair | Infer permanently from z-order |
| Missing alternative | Preflight/checker | Mark unresolved, navigate to object, allow decorative/description repair | Auto-approve generated text |
| Caption track unavailable | Media preflight/runtime | Expose unavailability and transcript/alternate track where present | Claim captions are on |
| Reduced-motion substitution unsupported | Runtime preflight | Replace with no transition/static state and preserve sequence | Play unsafe motion anyway |
| Forced-colors paint lost | Computed paint/hit-test check | Use system-color fallback and non-color indicator | Hide controls or focus |
| IME interrupted | Composition event/focus/network transition | Preserve browser composition or cancel visibly without partial commit | Commit fragments |
| Missing glyph/font | Shaping diagnostics | Substitute glyph-capable font, identify affected ranges | Render blank/tofu silently |
| Output semantic mapping loss | Artifact preflight/parser | Block strict profile or produce explicit compatibility report | Mark output accessible based on pixels |

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-12-106` | [ARC-021](../product-spec.md#73-rendering-and-fidelity) | Every accessibility or internationalization failure **MUST** preserve content, identify affected semantics, and offer a keyboard-operable bounded rescue. | `AC-12-106` |
| `REQ-12-107` | [ARC-021](../product-spec.md#73-rendering-and-fidelity) | A fallback **MUST NOT** silently remove authored language, alternative, reading-order, caption, or data semantics. | `AC-12-107` |
| `REQ-12-108` | [ARC-021](../product-spec.md#73-rendering-and-fidelity) | Strict accessible-output profiles **MUST** fail closed when required semantics cannot be represented or validated. | `AC-12-108` |

## 12. Accessibility Service Objectives

Volume 14 is the sole normative owner of `SLO-14-038` and `SLO-14-065` through `SLO-14-069`. This volume owns accessibility semantics, workflows, and protocol inputs; it references rather than redefines those thresholds.

## 13. Acceptance Criteria

By normative mapping, each `AC-12-NNN` evaluates exactly `REQ-12-NNN`; the shared suffix is the bidirectional requirement-to-acceptance link.

| ID | Pass condition |
|---|---|
| `AC-12-001` | Semantic fixture inventory accounts for every meaningful resolved node and decoration across editor, presentation, and output. |
| `AC-12-002` | Cross-surface semantic hashes/normalized trees agree for the same revision within declared format mappings. |
| `AC-12-003` | Unsupported output semantics appear in compatibility preflight before artifact creation. |
| `AC-12-004` | IDs survive reorder, duplicate, collaboration, migration, and reopen without aliasing. |
| `AC-12-005` | Accessibility corpus round-trips all fields through production Store and `.str`. |
| `AC-12-006` | Master/layout/component inheritance resolves deterministic metadata and preserves overrides. |
| `AC-12-007` | Every placeholder family has correct default role, prompt, language, order, and alternative policy. |
| `AC-12-008` | Selection, hover, remote cursors, cache, and panels do not change authored semantic hash. |
| `AC-12-009` | Keyboard-only users complete every enabled command in the representative workflow corpus. |
| `AC-12-010` | Accessibility-tree capture and manual AT inspection agree on names, roles, states, values, and relations. |
| `AC-12-011` | Pixel/computed-style evidence shows focus in all supported themes and forced colors. |
| `AC-12-012` | Tab and composite navigation match documented task order in LTR and RTL UI locales. |
| `AC-12-013` | Modal entry, cycle, nested action, close, deletion of invoker, and restoration cases pass. |
| `AC-12-014` | Menu, listbox, tree, tabs, toolbar, tooltip, dialog, and popover patterns pass keyboard contracts. |
| `AC-12-015` | Every listed state remains perceivable under grayscale and forced-colors checks. |
| `AC-12-016` | Announcement log contains one appropriately prioritized event per semantic state change and none per noisy pointer frame. |
| `AC-12-017` | Invalid fields are programmatically associated with precise error and recovery controls. |
| `AC-12-018` | Landmarks/regions have unique labels and bypass behavior across editor and presenter surfaces. |
| `AC-12-019` | Printable shortcuts do not fire during text/IME entry and conflicts are discoverable. |
| `AC-12-020` | Timed notifications and sessions satisfy extension/pause policy in headed workflows. |
| `AC-12-021` | NVDA, JAWS, and VoiceOver matrix can enumerate representative canvas nodes without duplicate content. |
| `AC-12-022` | Arrow traversal exactly matches authored order after reorder, group, duplicate, and delete. |
| `AC-12-023` | Focus announcements include required object metadata and update after accepted mutations. |
| `AC-12-024` | Transform fixture can be completed with keyboard/inspector and produces the same canonical values as pointer flow. |
| `AC-12-025` | Keyboard and pointer operations share transaction type, undo boundary, save/reopen, and collaboration result. |
| `AC-12-026` | Nested-content corpus supports deterministic enter, traversal, action, and escape. |
| `AC-12-027` | Vector corpus supports point/segment/handle selection and essential edits with no pointer. |
| `AC-12-028` | Multi-select announces count/mixed state and supports add/remove/range reliably. |
| `AC-12-029` | Zoom/pan/fit retains stable focused ID and reveal places it visibly in viewport. |
| `AC-12-030` | Inclusion matrix for hidden, clipped, locked, inherited, off-slide, and decorative nodes matches tree capture. |
| `AC-12-031` | Snap/constraint/error fixtures produce equivalent non-visual feedback. |
| `AC-12-032` | Layer tree passes hierarchical keyboard selection, expansion, reorder, reparent, and cancellation flows. |
| `AC-12-033` | Moving among canvas/layers/inspector preserves target without surprise focus transfer. |
| `AC-12-034` | Repeated key gestures use declared increments and one coherent undo transaction. |
| `AC-12-035` | Every non-empty slide has valid persisted order and an author-review surface. |
| `AC-12-036` | New slide/layout fixtures receive deterministic defaults and preserve explicit override. |
| `AC-12-037` | Group/component flatten/nest/summary policies match normalized accessibility trees. |
| `AC-12-038` | Mutation corpus produces no duplicate, dangling, or silently omitted reading-order node. |
| `AC-12-039` | Sorter/outline exposes sections, hidden status, order, and custom-show membership by keyboard and AT. |
| `AC-12-040` | Checker flags each meaningful image/shape/media fixture lacking an approved alternative. |
| `AC-12-041` | Decorative state removes the visual from reading order and rejects interactive/meaningful contradictions. |
| `AC-12-042` | Complex visual exposes concise and extended/structured alternatives in supported surfaces. |
| `AC-12-043` | AI/generated suggestion never reaches approved/output status without explicit author action. |
| `AC-12-044` | Import and generation provenance/language survive save, collaboration, and export preflight. |
| `AC-12-045` | Link corpus exposes meaningful purpose, safe protocol, and unavailable-state warning. |
| `AC-12-046` | Checker detector corpus triggers all named issue categories with no known false-negative fixture. |
| `AC-12-047` | Activating each finding reaches its stable target and repair control using keyboard only. |
| `AC-12-048` | Severity maps deterministically to strict-output blocking, review, or advisory result. |
| `AC-12-049` | Table tree/parser exposes caption, dimensions, headers, scopes, merges, and cells correctly. |
| `AC-12-050` | Keyboard completes cell traversal, range selection, edit, insert/delete, merge/split, and header assignment. |
| `AC-12-051` | Chart tree and data-table alternative agree with source values, labels, units, and missing data. |
| `AC-12-052` | Keyboard/AT traverses meaningful chart points with labels and values without hover. |
| `AC-12-053` | Diagram linearization preserves all labeled nodes and relationships. |
| `AC-12-054` | Equation round-trip preserves machine-readable math and spoken/text fallback. |
| `AC-12-055` | Media exposes available caption tracks/languages before and during playback. |
| `AC-12-056` | Audio-only/video-only fixtures expose required transcript/description alternatives. |
| `AC-12-057` | Media controls pass role/state/value and keyboard operation across audience and editor. |
| `AC-12-058` | Caption authoring round-trips cue timing, text, speaker, language, and edits. |
| `AC-12-059` | Live-caption UI exposes service state, latency, language, consent/retention, and review status. |
| `AC-12-060` | Audience accessibility tree contains current authored content and excludes all editor/private nodes. |
| `AC-12-061` | Slide/build navigation announcements are accurate, once-only, and respect verbosity. |
| `AC-12-062` | Audience navigation and controls complete with keyboard, touch alternative, voice naming, and switch scanning. |
| `AC-12-063` | Presenter AT workflow reaches slide, notes, timer, captions, navigation, and audience controls in task order. |
| `AC-12-064` | Automated DOM/tree/message scans find no notes or diagnostics in audience surface. |
| `AC-12-065` | Kiosk/timed-show fixture provides compliant exit/pause or records approved controlled-environment applicability. |
| `AC-12-066` | Non-visual state equivalents exist for laser, ink, zoom, blank, polls, and interactions. |
| `AC-12-067` | Failure injection displays private recovery only to presenter and safe fallback to audience. |
| `AC-12-068` | Contrast measurements pass required text, UI component, graphic, focus, and state thresholds. |
| `AC-12-069` | Grayscale/forced-colors captures preserve every named indicator. |
| `AC-12-070` | 200% zoom and text-spacing fixtures show no clipped, overlapped, or unreachable required content. |
| `AC-12-071` | Forced-colors computed-paint and interaction checks pass every supported surface. |
| `AC-12-072` | Reduced-motion media emulation removes non-essential movement and preserves final/build state. |
| `AC-12-073` | Essential-motion fixtures expose a usable static, stepped, textual, or controlled alternative. |
| `AC-12-074` | Automated flash analysis and adversarial code/video fixtures remain below threshold or are blocked. |
| `AC-12-075` | Combined OS/browser preference matrix remains usable without preference cross-coupling. |
| `AC-12-076` | Every multipoint/path gesture in inventory has and passes a single-pointer/control alternative. |
| `AC-12-077` | Pointer down/move/cancel/up injection proves cancellation before destructive commit. |
| `AC-12-078` | Target geometry scan passes minimum size/spacing or records valid exception. |
| `AC-12-079` | Touch corpus distinguishes pan/zoom/select/transform and exposes command alternatives. |
| `AC-12-080` | Pen-only metadata removal does not prevent equivalent authored result. |
| `AC-12-081` | Extraction and pseudo-localization find no required runtime user string assembled with grammar-breaking concatenation. |
| `AC-12-082` | Locale fallback corpus resolves canonical tags predictably and never changes document language. |
| `AC-12-083` | Locale matrix formats values correctly while serialized canonical values remain byte-stable. |
| `AC-12-084` | Numeric input corpus accepts declared localized forms and rejects ambiguous forms without mutation. |
| `AC-12-085` | Pseudo-locales, long labels, narrow viewport, and fallback fonts produce no overlap/truncation of required text. |
| `AC-12-086` | Search/sort/case/break/selection fixtures pass Turkish, German, Arabic, CJK, Thai, and combining-script cases. |
| `AC-12-087` | Language inheritance and run overrides round-trip through all applicable surfaces. |
| `AC-12-088` | LTR/RTL/auto base direction remains independent from alignment and persists. |
| `AC-12-089` | Unicode bidi corpus preserves visual order, logical order, caret, punctuation, numbers, and output. |
| `AC-12-090` | RTL UI audit mirrors only directional controls and preserves universal symbols/semantics. |
| `AC-12-091` | Vertical/complex-script fixtures either render/edit correctly or preserve/report without corruption. |
| `AC-12-092` | Missing-font corpus shows deterministic fallback, complete text, and actionable diagnostics. |
| `AC-12-093` | Real headed browser IME runs cover CJK, Korean, Indic, dead-key, and mobile composition lifecycles. |
| `AC-12-094` | Each composition commit produces one undo step and convergent collaboration operation. |
| `AC-12-095` | Save, blur, remote mutation, shortcut, and mode-change injection during composition loses no text. |
| `AC-12-096` | Grapheme corpus never places caret or deletion inside an extended grapheme cluster improperly. |
| `AC-12-097` | Unicode corpus round-trips without replacement characters, reordering, or unintended normalization. |
| `AC-12-098` | Parsed web output and headed AT workflow pass the complete semantic contract. |
| `AC-12-099` | Tagged-PDF validator plus manual screen-reader sample verifies structure, language, order, alternatives, tables, and links. |
| `AC-12-100` | PPTX parser/Office inspection matches mapping report for every accessibility fixture. |
| `AC-12-101` | Print/handout artifact inspection preserves readable sequence and non-color meaning. |
| `AC-12-102` | Video and sidecar timed-text artifacts match authored cues, language, and selected caption mode. |
| `AC-12-103` | SVG/raster export UI and report accurately state semantic limitations. |
| `AC-12-104` | Strict preflight blocks every fixture with an unrepresentable required semantic unless an authorized waiver applies. |
| `AC-12-105` | Localized output corpus detects stale/untranslated alternatives and captions. |
| `AC-12-106` | Each failure row has evidence for detection, preserved content, focus/state, and keyboard rescue. |
| `AC-12-107` | Failure injection never silently strips authored accessibility/i18n metadata. |
| `AC-12-108` | Strict output cannot be labeled successful when semantic parser or required manual protocol fails. |

## 14. Required Test and Evidence Protocols

| ID | Protocol | Required evidence |
|---|---|---|
| `TEST-12-001` | Schema/model tests validate semantic resolution, reading-order reconciliation, inheritance, alternatives, captions, language, bidi, and migrations. | Fixtures, normalized trees, hashes, failure cases. |
| `TEST-12-002` | Unit/integration tests exercise keyboard commands, focus transitions, announcements, checker detectors, output mappings, and rescue logic. | Production route, input trace, semantic result. |
| `TEST-12-003` | Headed Playwright workflows use real keyboard, pointer, touch, pen emulation, media preferences, forced colors, zoom, and visible hit-testable controls. | Trace, screenshots/video, DOM and accessibility snapshots, product state. |
| `TEST-12-004` | Manual assistive-technology matrix covers current supported combinations of NVDA, JAWS, Narrator, VoiceOver, TalkBack, magnification, voice control, and switch access. | AT/browser/OS versions, task observations, blockers, operator. |
| `TEST-12-005` | International input matrix uses real browser/OS IMEs and hardware/software keyboards for declared scripts. | Composition event trace, resulting Unicode, undo/collaboration/file hashes. |
| `TEST-12-006` | Artifact tests parse `.str`, web, PDF, PPTX, print, video, SVG/raster metadata, and caption sidecars. | Parsed semantic structures and compatibility report comparison. |
| `TEST-12-007` | Visual accessibility tests measure contrast, focus, clipping, overlap, target size, grayscale, flash, reduced motion, and forced colors. | Computed paint, pixels/video, thresholds, environment. |
| `TEST-12-008` | Accessibility eval capture records agenda-free document semantics, DOM/accessibility tree, canvas proxy, focus, announcements, execution, and artifacts before detectors run. | Raw timeline, detector version/results, manual review. |

Headless browser results are not accepted as headed workflow evidence. Automated axe or parser results are necessary where applicable but never replace manual AT and artifact review for release profiles that require them.

**`EVD-12-001 Accessibility conformance bundle`** must identify revision, build, environment, locale, document language, input method, AT/browser/OS versions, fixture/corpus version, requirement and criterion IDs, raw captures, parsed artifacts, screenshots/video, operator where manual, result, defects, waivers, and limitations.

## 15. Release Gate and Current Status

Volume 15 defines release tiers and waiver mechanics. For any tier claiming accessible authoring or output:

1. Every applicable `REQ-12` criterion must have current evidence for the released platform/format matrix.
2. Critical semantic, keyboard, focus, privacy, caption, language-corruption, and strict-output defects are release-blocking.
3. Automated scans must report zero serious/critical violations in the exercised scope, but that result cannot offset failed manual workflows.
4. Known unsupported output semantics must be visible before export and reflected in tier claims.
5. Evidence must use production routes and headed visible browser runs where UI behavior is claimed.

Current evidence is partial. Existing tests verify selected named controls, basic keyboard nudging, presentation announcements, HUD semantics, reduced-motion fallback, forced-colors hooks, and isolated IME state. They do not establish canvas object traversal, authored reading order, alternative-text workflows, native table/chart semantics, complete international input, or accessible output conformance.

## 16. Traceability and Source Adoption

### 16.1 Parent-Capability and Protocol Coverage

| Requirement range | Parent capabilities | Primary protocols |
|---|---|---|
| `REQ-12-001` through `REQ-12-008` | `PRE-011`, `ARC-002`, `ARC-003`, `ARC-020`, `ARC-021`, `ARC-030` | `TEST-12-001`, `TEST-12-006`, `TEST-12-008` |
| `REQ-12-009` through `REQ-12-020` | `DES-010` | `TEST-12-002` through `TEST-12-004`, `TEST-12-007`, `TEST-12-008` |
| `REQ-12-021` through `REQ-12-034` | `DES-010`, `DES-012`, `DES-013`, `DES-020`, `DES-021`, `DES-070` | `TEST-12-002` through `TEST-12-004`, `TEST-12-007`, `TEST-12-008` |
| `REQ-12-035` through `REQ-12-048` | `PRE-001`, `PRE-011`, `PRE-023`, `ARC-003`, `ARC-020`, `ARC-030` | `TEST-12-001` through `TEST-12-004`, `TEST-12-006`, `TEST-12-008` |
| `REQ-12-049` through `REQ-12-059` | `PRE-020` through `PRE-023`, `PRE-042` | `TEST-12-001` through `TEST-12-004`, `TEST-12-006`, `TEST-12-008` |
| `REQ-12-060` through `REQ-12-067` | `PRE-043`, `PRE-050`, `PRE-051` | `TEST-12-002` through `TEST-12-004`, `TEST-12-007`, `TEST-12-008` |
| `REQ-12-068` through `REQ-12-080` | `DES-003`, `DES-012`, `PRE-023`, `PRE-030`, `PRE-031`, `PRE-051` | `TEST-12-003`, `TEST-12-004`, `TEST-12-007`, `TEST-12-008` |
| `REQ-12-081` through `REQ-12-097` | `DES-031` through `DES-033` | `TEST-12-001`, `TEST-12-002`, `TEST-12-005`, `TEST-12-006`, `TEST-12-008` |
| `REQ-12-098` through `REQ-12-105` | `PRE-070` through `PRE-073`, `ARC-020` | `TEST-12-001`, `TEST-12-004`, `TEST-12-006` through `TEST-12-008` |
| `REQ-12-106` through `REQ-12-108` | `ARC-021` | `TEST-12-002` through `TEST-12-008` |

### 16.2 Source Adoption

This volume adopts and strengthens:

- [Presentation Accessibility](../../specs/slides/presentation-mode/15-accessibility.md), for audience announcements, keyboard playback, reduced motion, and visual preferences;
- [Shapes Accessibility](../../specs/shapes/37-accessibility.md), for keyboard manipulation and inspector parity;
- [Text Editing Specification](../../specs/text-editing/text-editing-interaction-comprehensive.md) and [IME Handler](../../specs/text-editing/technical/07-ime-handler.md), for browser-owned composition principles;
- [Story Evaluation Loop](../../automation/eval-loop/eval-loop-framework.md) and [DOM and Canvas Capture Guide](../../automation/eval-loop/dom-state-capture-guide.md), for multi-layer evidence;
- the current headed accessibility tests as evidence inputs, not blanket conformance proof.

## 17. Identifier Counts

| Namespace | Count | Range |
|---|---:|---|
| Requirements | 108 | `REQ-12-001` through `REQ-12-108` |
| Schemas | 8 | `SCH-12-001` through `SCH-12-008` |
| Invariants | 10 | `INV-12-001` through `INV-12-010` |
| State machines | 2 | `SM-12-001` through `SM-12-002` |
| Flows | 1 | `FLOW-12-001` |
| Adopted SLOs | 6 | `SLO-14-038`, `SLO-14-065` through `SLO-14-069` |
| Acceptance criteria | 108 | `AC-12-001` through `AC-12-108` |
| Test protocols | 8 | `TEST-12-001` through `TEST-12-008` |
| Evidence bundles | 1 | `EVD-12-001` |

The counts above describe this draft inventory and do not imply implementation or conformance.