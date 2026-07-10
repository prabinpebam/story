# Volume 09: PowerPoint-Class Presentation Authoring

> **Specification ID:** `STORY-SPEC-09`  
> **Volume:** 09 (16 volumes total, 00-15)  
> **Status:** Normative draft  
> **Version:** 2.0.0-draft  
> **Owner:** Product and Engineering  
> **Approvers:** Product, Design, Engineering, Quality, Accessibility, Security  
> **Last reviewed:** July 10, 2026  
> **Normative responsibility:** Slide structure, masters, layouts, placeholders, themes, templates, presentation-native content, notes, motion authoring, rehearsal, recording setup, and accessibility metadata
> **Explicit non-ownership:** Workspace-view taxonomy, canonical document schemas, mutation algorithms, scene rendering, runtime playback, output mappings, and implementation status
> **Parent specification:** [Story Product Specification System](README.md)  
> **Governed by:** [Volume 00 - Governance and Traceability](00-governance-and-traceability.md)  
> **Supersedes:** Conflicting presentation-authoring behavior in active slide, theme, transition, and presentation specifications where this volume is more precise

## 1. Purpose

This volume defines how authors build, organize, prepare, rehearse, and record professional presentations in Story. It turns parent capabilities `PRE-001` through `PRE-043` into atomic behavior contracts while using the design-authoring grammar in Volume 08 rather than creating a weaker slide-only editor.

An experienced presentation author should recognize slides, sections, views, page setup, masters, layouts, placeholders, themes, templates, tables, charts, diagrams, equations, media, notes, animation sequencing, rehearsal, and recording. Familiarity does not require copying PowerPoint chrome, ribbons, icon placement, proprietary file internals, or every legacy feature.

## 2. Scope and Authority

### 2.1 In scope

- Slide creation, duplication, deletion, clipboard operations, ordering, hiding, naming, search, selection, and sections.
- Canvas, Grid, Outline, Notes, and System views projected into slide, master, layout, motion, rehearsal, and recording workflows.
- Page size, orientation, scaling policy, numbering, headers, footers, date, background, and document metadata.
- Slide master, layout, and slide inheritance; placeholders; reset, restore, detach, and reconciliation.
- Presentation themes, template packages, previews, branded resources, and safe application.
- Native editable tables, charts, structured diagrams, equations, symbols, image, audio, video, screen recording, SVG, and governed web media.
- Speaker notes and authoring-time accessibility metadata.
- Transition and object-animation authoring, the animation sequencer, triggers, timing, preview, copy, and Morph correspondence authoring.
- Rehearsal timing capture and review.
- Recording setup, permissions, narration/camera/pointer/ink configuration, slide retakes, captions, and recording review.

### 2.2 Out-of-volume ownership

| Concern | Normative owner |
|---|---|
| Canonical entity schemas, animation data identities, notes blocks, and migrations | Volume 03 |
| Transactions, history, operation replay, and collaboration-safe ordering | Volume 04 |
| Resolved scenes, text/data rendering, media readiness, and surface adapters | Volume 05 |
| Assets, recording blobs, native files, autosave, and recovery | Volume 06 |
| Concurrent authoring, comments, permissions, sharing, and library publication | Volume 07 |
| Canvas selection, transforms, vectors, text, Auto Layout, components, variables, styles, and design clipboard | Volume 08 |
| Show execution, clocks, builds, transitions, presenter/audience windows, displays, controls, kiosk, and runtime recovery | Volume 10 |
| PPTX, PDF, print, video, web, SVG, raster, and output compatibility | Volume 11 |
| Full keyboard, assistive-technology, reading-order, captions, language, and accessible-output rules | Volume 12 |
| Device consent, embeds, recording privacy, content safety, and retention | Volume 13 |
| Latency, capacity, media limits, fidelity tolerances, and diagnostics | Volume 14 |
| Release fixtures, artifact inspection, test protocols, and evidence | Volume 15 |

### 2.3 Adopted domain specifications

These specifications remain active detail where consistent with this volume:

- [Slides specification index](../../specs/slides/00-index.md)
- [Slides architecture](../../specs/slides/01-architecture.md)
- [Master presets and master mode](../../specs/slides/02-master-presets-and-master-mode.md)
- [Slide operations](../../specs/slides/04-navigation-thumbnails-and-operations.md)
- [Speaker notes](../../specs/slides/05-slide-notes.md)
- [Theme cascade](../../specs/slides/themes/color-theme-cascade-architecture.md)
- [Transitions](../../specs/slides/transitions/README.md)
- [Presentation runtime suite](../../specs/slides/presentation-mode/00-master-outline.md), for shared authoring/runtime boundaries only
- [Taskflow catalog](../../automation/eval-loop/taskflows/00-index.md), as requirements input rather than evidence

### 2.4 Supersession

This volume supersedes presentation-authoring clauses in Section 6 of [Story Product Specification](../product-spec.md) only by adding precision. It supersedes domain statements that:

- allow layout changes to discard unmatched placeholder content;
- embed reusable theme definitions independently into each slide;
- treat a decorative rectangle as a placeholder without typed lifecycle semantics;
- call a flattened picture an editable table, chart, diagram, equation, or template;
- infer a complete build sequence solely from unordered entrance metadata;
- store rehearsal or recording setup only as presenter-window runtime state;
- inject arbitrary notes HTML into presenter or output surfaces;
- apply presentation-theme values globally to unrelated slide render roots.

## 3. Product Decisions and Bounded Parity

### 3.1 Explicit implementer decisions

1. **One ordered presentation.** Slides have stable identity and a canonical order. Sections and custom shows reference slides; they do not duplicate slide content.
2. **One inheritance chain.** Effective slide semantics resolve slide override over layout over slide master over presentation theme/default. Resolution never mutates sources.
3. **Placeholders are typed contracts.** A placeholder owns identity, role, accepted content families, prompt, geometry/layout policy, accessibility defaults, and override state.
4. **Content is preservation-first.** Layout, master, theme, template, and placeholder changes reconcile by stable identity and semantics; unmatched user content is detached with provenance, never silently deleted.
5. **Data objects remain semantic.** Tables, charts, diagrams, and equations retain editable structured source. Rasterization is an explicit output or conversion choice.
6. **One motion model.** Transition authoring, object effects, media cues, builds, triggers, rehearsal, recording, runtime playback, and video export reference the same stable timeline data.
7. **Authoring preview is not playback state.** Scrubbing or previewing motion changes ephemeral preview time only; it does not alter slide navigation, accepted timings, or recording media.
8. **Recorded media is modular.** Narration, camera, ink/pointer, captions, and timing tracks have independent identities and can be retained or retaken per slide.
9. **Accessibility is authored data.** Reading order, alternative text, decorative state, language, table headers, chart summaries, captions, and equation descriptions persist with content.
10. **Presentation-native and design-native systems compose.** Masters and layouts may use Auto Layout, components, variables, and styles; those systems are not duplicated under presentation-specific names.

### 3.2 Bounded parity

| Included parity floor | Bounded or staged | Non-goal |
|---|---|---|
| Familiar slide organization, views, page setup, masters/layouts/placeholders, themes/templates, tables, charts, diagrams, equations/media, notes, common transitions/animations, sequencer, rehearsal, and recording setup | Formula breadth in tables; advanced statistical/financial chart families; diagram auto-layout breadth; equation authoring syntax; legacy animation effects; macro/media integrations are published by support tier | Pixel-identical PowerPoint chrome; VBA/macros/ActiveX; every historical transition or animation; proprietary add-ins; executable OLE objects; treating screenshots as editable feature parity |

Unsupported or preservation-only features remain represented in compatibility reports and source preservation. Story does not claim parity merely because an object can be displayed as pixels.

## 4. Shared Presentation Authoring Model

### 4.1 Structural model

```text
Presentation
  Theme and document defaults
  Slide masters[]
    Layouts[]
      Typed placeholders[]
  Sections[] -> contiguous slide identity ranges
  Slides[] -> stable canonical order
    Layout reference
    Local elements and placeholder overrides
    Notes
    Transition override
    Animation timeline
    Rehearsal timing
    Recording tracks
    Accessibility metadata
  Custom shows[] -> ordered slide identity references
```

Sections do not own slides; a slide belongs to at most one section by its position in canonical order. Custom shows may reference the same slide more than once only when the show explicitly permits repetition.

### 4.2 Authoring workflow projection

`SM-09-001`:

The presentation workflow does not add workspace-view types. It projects presentation work onto Volume 02's five canonical views, edit scopes, and focused workflows.

| Workflow state | Canonical view and scope | Primary content | Authoring allowed | Entry | Exit |
|---|---|---|---|---|---|
| `slide-authoring` | Canvas / Slide scope | Active slide canvas, slide navigator, notes/inspector as configured | Slide content and structure | Default/open slide | Switch view or start show |
| `slide-organizing` | Grid / Slide scope | Virtualized slide grid grouped by sections | Selection, reorder, section, hide, duplicate, bulk properties | Grid command | Activate slide or switch view |
| `outline-authoring` | Outline / Slide or Narrative scope | Hierarchical textual outline derived from eligible placeholders/text | Text and narrative-order editing under declared mapping | Outline command | Activate slide or switch view |
| `notes-authoring` | Notes / Slide scope | Slide plus notes-page composition | Notes content and notes-page settings | Notes command | Switch view |
| `master-authoring` | Canvas / Master or Layout scope | Master/layout hierarchy and active design root | Master, layout, placeholder, theme defaults | Edit master/layout | Done or scope breadcrumb |
| `motion-authoring` | Canvas / Slide scope plus Motion focused workflow | Slide plus sequencer/timeline and preview controls | Transition and animation authoring | Animate command | Done or close focused workflow |
| `rehearsal-review` | System / Rehearsal focused workflow | Timing summary by slide/build | Review, edit, clear, apply timings | Complete/open rehearsal | Done or start rehearsal |
| `recording-setup` | System / Recording focused workflow | Device, track, consent, and scope setup | Configuration only | Record command | Cancel or begin recording |
| `recording-review` | System / Recording focused workflow | Slide recordings and track timeline | Review, trim where supported, retake, captions | Stop/open recording | Done/export/retake |

View selection, panel dimensions, zoom, and active tab are runtime preferences. Authored changes made within a view are document transactions.

### 4.3 Cross-surface applicability

| Authoring semantic | Editor | Thumbnail/sorter | Audience | Presenter | PDF/print | Video/web | PPTX |
|---|---:|---:|---:|---:|---:|---:|---:|
| Slide order, sections, hidden state | Author | Display/author | Resolve show order | Navigate | Range/order | Order/navigation | Map/preserve |
| Master/layout/theme/template | Author/resolve | Resolve | Resolve | Resolve | Resolve | Resolve | Map/preserve/report |
| Tables/charts/diagrams/equations | Author/render | Render | Render/animate | Render preview | Render/semantics | Render/animate | Map/preserve/report |
| Notes | Author | Optional indicator | Never | Private render | Notes pages/outline when chosen | Excluded unless explicitly included | Map/preserve |
| Animation timeline | Author/preview | Status only | Execute | Control/status | Static end/start policy | Execute/render | Map/preserve/report |
| Rehearsal timing | Author/review | Optional indicator | Used only by show policy | Private status | Optional report only | Used when selected | Map where supported |
| Recording tracks | Setup/review | Status only | Playback according to policy | Private controls/status | Poster/transcript only by choice | Render/package | Map/preserve/report |
| Accessibility metadata | Author/check | Issue status | Runtime semantics | Runtime semantics | Accessible artifact | Accessible player/artifact | Map/preserve/report |

### 4.4 Invariants

| ID | Invariant |
|---|---|
| `INV-09-001` | Every slide, section, master, layout, placeholder, table cell, chart series, diagram node, animation step, notes block, and recording track has stable identity. |
| `INV-09-002` | Canonical slide order has each live slide exactly once; views and sections derive from that order. |
| `INV-09-003` | Section collapse and view selection never alter slide visibility in playback or output. |
| `INV-09-004` | Hidden state is authored independently from editor visibility and section collapse. |
| `INV-09-005` | Master, layout, theme, component, variable, and local overrides resolve without mutating any source record. |
| `INV-09-006` | Changing a layout, master, theme, or template never silently discards user content, notes, motion, recordings, or accessibility metadata. |
| `INV-09-007` | Placeholder prompts are authoring UI and never appear in audience or output artifacts as user content. |
| `INV-09-008` | A local override identifies its source and can be reset without removing unrelated local content. |
| `INV-09-009` | Tables, charts, diagrams, and equations remain structured unless the user explicitly converts them. |
| `INV-09-010` | Data-object source edits, visual formatting, and animation targets share stable semantic identities. |
| `INV-09-011` | Notes are private by default and are absent from audience DOM, audience messages, and content telemetry. |
| `INV-09-012` | Motion preview time, selected animation step, and sequencer scroll are runtime state. |
| `INV-09-013` | Timeline order and trigger relationships are acyclic and deterministic after every transaction. |
| `INV-09-014` | One authored animation step has one stable target set and one declared trigger/timing policy. |
| `INV-09-015` | Rehearsal timing and recording timing use the same build boundaries that the runtime executes. |
| `INV-09-016` | A recording permission denial or device loss never deletes an existing accepted recording. |
| `INV-09-017` | Retaking one slide changes only the selected slide's chosen recording tracks and declared transition overlap. |
| `INV-09-018` | Accessibility metadata follows semantic content through reorder, layout reconciliation, duplication, clipboard, and interchange. |
| `INV-09-019` | Bulk slide or animation edits commit as one transaction and never one history entry per selected item. |
| `INV-09-020` | Every destructive conversion or replacement previews content, inheritance, motion, accessibility, and fidelity consequences. |

## 5. Slides, Sections, Views, and Page Setup Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-09-001` | PRE-001 | Story MUST create a slide before, after, or at the end of the current selection using an explicitly chosen or context-default layout. | Normal/sorter; create transaction | `AC-09-001` |
| `REQ-09-002` | PRE-001 | Story MUST duplicate selected slides with new entity identities while preserving content, notes, motion, recordings, accessibility metadata, and references that remain valid. | Normal/sorter/files; duplicate transaction | `AC-09-002` |
| `REQ-09-003` | PRE-001 | Story MUST delete selected slides atomically and leave a deterministic active-slide or empty-presentation state with undo available. | Normal/sorter; delete transaction | `AC-09-003` |
| `REQ-09-004` | PRE-001 | Story MUST cut, copy, and paste slides through a portable representation that carries dependent layouts, themes, assets, and compatibility issues. | Navigator/system clipboard; clipboard transaction | `AC-09-004` |
| `REQ-09-005` | PRE-001 | Story MUST support single, toggle, additive, contiguous-range, and select-all slide selection without changing the active canvas until activation is requested. | Normal/sorter/outline; selection runtime | `AC-09-005` |
| `REQ-09-006` | PRE-001 | Story MUST reorder one or more selected slides by pointer or keyboard with a stable insertion preview and one transaction. | Navigator/sorter; reorder transaction | `AC-09-006` |
| `REQ-09-007` | PRE-001 | Story MUST rename slides with commit, cancel, validation, duplicate-name tolerance, and fallback display names. | Navigator/sorter/outline; rename transaction | `AC-09-007` |
| `REQ-09-008` | PRE-001 | Story MUST hide or unhide slides individually or in bulk while distinguishing hidden state from editor filtering and section collapse. | Normal/sorter/show setup; state transaction | `AC-09-008` |
| `REQ-09-009` | PRE-001 | Story MUST search slides by title, outline text, notes, object name, accessibility metadata, section, and issue with scoped result disclosure. | Search/navigation; query runtime | `AC-09-009` |
| `REQ-09-010` | PRE-001 | Story MUST create, rename, reorder, collapse, expand, and delete sections without duplicating or losing member slides. | Navigator/sorter; section lifecycle | `AC-09-010` |
| `REQ-09-011` | PRE-001 | Story MUST move slides within or across sections while deriving section membership deterministically from canonical slide order. | Navigator/sorter; reorder transaction | `AC-09-011` |
| `REQ-09-012` | PRE-001 | Story MUST define named custom shows as ordered stable slide references with missing-slide diagnostics and optional repetition policy. | Show setup/files; custom-show lifecycle | `AC-09-012` |
| `REQ-09-013` | PRE-002 | Story MUST provide Canvas view in Slide scope with active-slide authoring, structural navigation, inspection, and optional notes without duplicating document state. | Editor; view runtime | `AC-09-013` |
| `REQ-09-014` | PRE-002 | Story MUST provide Grid view with a virtualized slide sorter that supports section-aware selection, reorder, hide, duplicate, delete, transition, and timing operations at scale. | Grid; view runtime/transactions | `AC-09-014` |
| `REQ-09-015` | PRE-002 | Story MUST provide an outline view that maps eligible title/body placeholder structure to slide identity and source text without inventing duplicate text. | Outline; view/edit | `AC-09-015` |
| `REQ-09-016` | PRE-002 | Story MUST provide a notes view that composes the slide, speaker notes, and notes-page metadata while preserving notes privacy. | Notes view; authoring | `AC-09-016` |
| `REQ-09-017` | PRE-002 | Story MUST provide Master and Layout edit scopes inside Canvas view using the same interaction grammar with inherited content visibly nonlocal and noneditable in the wrong root. | Canvas/master/layout scopes; authoring | `AC-09-017` |
| `REQ-09-018` | PRE-002 | Story MUST restore a valid active slide, selection, scroll position, and focus target when switching canonical views or returning from master, motion, rehearsal, or recording workflows. | All authoring views; view transition | `AC-09-018` |
| `REQ-09-019` | PRE-003 | Story MUST support named standard and custom slide sizes with finite dimensions, units, orientation, and aspect ratio stored as presentation properties. | Page setup/files; configuration transaction | `AC-09-019` |
| `REQ-09-020` | PRE-003 | Story MUST preview scale-to-fit, maximize/crop, and preserve-object-size policies before a slide-size or orientation change is committed. | Page setup/editor; migration transaction | `AC-09-020` |
| `REQ-09-021` | PRE-003 | Story MUST apply page-setup changes consistently to slides, masters, layouts, placeholders, guides, backgrounds, notes pages, and output settings. | All authoring/output-preflight surfaces | `AC-09-021` |
| `REQ-09-022` | PRE-003 | Story MUST provide slide-number start, inclusion, hidden-slide counting, and per-slide suppression policies with resolved placeholder preview. | Page setup/master/layout/slide | `AC-09-022` |
| `REQ-09-023` | PRE-003 | Story MUST provide authored date/time, footer, and header fields with fixed or automatically updated values and master/layout/slide inheritance. | Page setup/master/layout/slide/output | `AC-09-023` |
| `REQ-09-024` | PRE-003 | Story MUST support presentation and slide metadata for title, subject, author, keywords, language, description, and custom approved fields without exposing private runtime identity. | Document properties/files/output | `AC-09-024` |
| `REQ-09-025` | PRE-003 | Story MUST support slide background inheritance, local override, hide-background-graphics, reset, and accessible contrast diagnostics. | Master/layout/slide/all render surfaces | `AC-09-025` |
| `REQ-09-026` | PRE-001 | Story MUST preserve slide references in sections, custom shows, links, comments, animations, recordings, and history when slides are reordered or renamed. | Document/history/collaboration | `AC-09-026` |
| `REQ-09-027` | PRE-001 | Story MUST identify broken inbound and outbound slide references after deletion, import, or collaboration and offer deterministic repair or removal. | Editor/validation/recovery | `AC-09-027` |
| `REQ-09-028` | PRE-002 | Story MUST expose every structural view and slide operation to keyboard and assistive technology with stable names, roles, positions, and selection state. | All structural views/accessibility | `AC-09-028` |

### 5.1 Slide panel interaction matrix

| Focus/selection | Arrow keys | `Shift` + arrow | `Ctrl/Cmd` + click/Space | Enter | Delete | Drag |
|---|---|---|---|---|---|---|
| One thumbnail focused | Move focus/active selection by platform convention | Extend contiguous range | Toggle focused slide | Activate slide in normal view | Delete selection after policy check | Move selected block |
| Multi-selection | Move focus without silently collapsing selection | Extend from anchor | Toggle member | Activate focused member while retaining or collapsing selection per announced command | Delete all selected atomically | Move selected block preserving relative order |
| Section header | Move among headers/slides | Extend only when command is defined | Select section's slides through explicit action | Expand/collapse | Remove section, not slides, after confirmation | Reorder section block |
| Rename field | Move caret | Select text | Platform text behavior | Commit | Delete text | No slide drag |

### 5.2 Page-size change flow

`FLOW-09-001`:

1. Select a standard/custom size and orientation.
2. Compute effects on every master, layout, slide, guide, placeholder, background, and notes-page reference.
3. Preview scale-to-fit, maximize/crop, and preserve-size outcomes on representative and issue-bearing slides.
4. List overflow, clipping, responsive-layout conflicts, media crop changes, and unsupported output implications.
5. Commit the chosen policy as one deterministic migration transaction or cancel without mutation.
6. Recompute thumbnails and preflight without serializing derived layout bounds.

## 6. Masters, Layouts, and Placeholders Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-09-029` | PRE-010 | Story MUST support multiple slide masters with stable ordered layout collections and explicit slide-to-layout references. | Master view/files/interchange | `AC-09-029` |
| `REQ-09-030` | PRE-010 | Story MUST resolve effective slide content and properties through slide override, layout, slide master, presentation theme, and system fallback in a published order. | All render/output surfaces; resolve | `AC-09-030` |
| `REQ-09-031` | PRE-010 | Story MUST let authors create, duplicate, rename, reorder, and delete masters and layouts with usage impact shown before destructive changes. | Master view; lifecycle transactions | `AC-09-031` |
| `REQ-09-032` | PRE-010 | Story MUST prevent or reconcile master/layout deletion when slides, templates, custom shows, or imported preserved content still reference it. | Master view/files; destructive transaction | `AC-09-032` |
| `REQ-09-033` | PRE-010 | Story MUST distinguish inherited, overridden, hidden, detached, restored, and orphaned master/layout values in canvas, layers, and inspector. | Master/normal views; inspect/edit | `AC-09-033` |
| `REQ-09-034` | PRE-010 | Story MUST reset a selected slide property, placeholder, background, or local inherited element to its current resolved layout/master source without affecting unrelated local content. | Normal view; reset transaction | `AC-09-034` |
| `REQ-09-035` | PRE-010 | Story MUST detach a slide or selected inherited content only through an explicit reversible command that preserves provenance and current appearance. | Normal/master views; detach transaction | `AC-09-035` |
| `REQ-09-036` | PRE-010 | Story MUST restore eligible detached content to a compatible source placeholder by stable identity, type, and author-confirmed mapping. | Normal view; restore transaction | `AC-09-036` |
| `REQ-09-037` | PRE-010 | Story MUST reconcile layout changes by stable placeholder identity, semantic role, compatibility, and deterministic order before using positional fallback. | Normal view; layout-change transaction | `AC-09-037` |
| `REQ-09-038` | PRE-010 | Story MUST preserve unmatched placeholder content as ordinary local content with origin metadata and a compatibility issue rather than delete it. | Normal view/files/interchange | `AC-09-038` |
| `REQ-09-039` | PRE-011 | Story MUST support title, subtitle, body, text, picture, media, audio, chart, table, diagram, equation, object, date, footer, and slide-number placeholder roles. | Master/layout/normal/all render surfaces | `AC-09-039` |
| `REQ-09-040` | PRE-011 | Story MUST define each placeholder's accepted content families, prompt, default style, geometry/layout behavior, replacement policy, and accessibility defaults. | Master/layout/files; placeholder authoring | `AC-09-040` |
| `REQ-09-041` | PRE-011 | Story MUST instantiate or override placeholder content on first edit without mutating the layout definition. | Normal view; placeholder edit transaction | `AC-09-041` |
| `REQ-09-042` | PRE-011 | Story MUST let authors insert compatible content into a placeholder by click, paste, drag/drop, command, or replace while retaining placeholder identity. | Normal view; content insertion | `AC-09-042` |
| `REQ-09-043` | PRE-011 | Story MUST treat empty placeholder prompts as noncontent and exclude them from audience, search results, accessibility output, and exports. | All nonauthoring surfaces | `AC-09-043` |
| `REQ-09-044` | PRE-011 | Story MUST support placeholder-level locks for position, size, content family, style inheritance, and deletion with authorized master-view editing. | Master/layout/normal views | `AC-09-044` |
| `REQ-09-045` | PRE-010 | Story MUST preview affected slides when a master or layout change alters inherited geometry, styles, placeholders, motion defaults, or accessibility metadata. | Master view; impact review | `AC-09-045` |
| `REQ-09-046` | PRE-010 | Story MUST propagate accepted master/layout changes only to nonoverridden semantics and classify conflicts for review. | All authoring surfaces/collaboration | `AC-09-046` |
| `REQ-09-047` | PRE-010 | Story MUST support Auto Layout, constraints, components, variables, styles, columns, and guides inside master/layout content through their owning Volume 08 contracts. | Master/layout/all resolved surfaces | `AC-09-047` |
| `REQ-09-048` | PRE-010 | Story MUST preserve master/layout/placeholder identities and overrides through native files, duplication, templates, collaboration, and PPTX round trips by declared tier. | Files/collaboration/interchange | `AC-09-048` |
| `REQ-09-049` | PRE-011 | Story MUST expose placeholder role, source, accepted content, override state, and accessibility defaults to keyboard and assistive technology. | Master/normal/accessibility | `AC-09-049` |
| `REQ-09-050` | PRE-010 | Story MUST reject cyclic master/layout ownership and invalid cross-master layout references before commit while retaining the last valid presentation. | Editor/import/files; validation | `AC-09-050` |

### 6.1 Placeholder state machine

`SM-09-002`:

| State | Meaning | Allowed transitions |
|---|---|---|
| `inherited-empty` | Layout placeholder resolves with prompt and no slide content | instantiate, hide locally, change layout |
| `local-empty` | Slide owns an empty override while placeholder remains addressable | add content, reset to inherited |
| `local-content` | Slide owns compatible content bound to placeholder | edit, replace, reset, detach, layout reconcile |
| `detached-content` | User content survived without a compatible target | map/restore, keep local, delete |
| `orphaned-source` | Source layout/placeholder is unavailable or preserved-only | map, keep local, select replacement layout |
| `conflicted` | Concurrent/source update cannot be reconciled automatically | choose mapping, keep local, reset, duplicate |

### 6.2 Layout-change flow

`FLOW-09-002`:

1. Resolve source and target layouts and enumerate stable placeholder identities.
2. Match exact identity, then semantic role/content compatibility, then deterministic role order.
3. Preview geometry/style changes and any content that will detach, remap, overflow, or conflict.
4. Preserve compatible user content and its semantic metadata on mapped targets.
5. Detach unmatched user content with source provenance and current world placement.
6. Create empty target placeholders without treating prompts as content.
7. Rebind valid animation and reading-order targets; classify unresolved references.
8. Validate the complete result and commit once, or cancel without mutation.

## 7. Themes and Templates Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-09-051` | PRE-012 | Story MUST define presentation themes as stable references to color, typography, effect, spacing, background, and approved variable/style resources. | Theme/master/layout/slide/files | `AC-09-051` |
| `REQ-09-052` | PRE-012 | Story MUST resolve theme assignments per render root so one slide's theme never changes unrelated slides or application chrome. | Editor/thumbnail/audience/presenter/output | `AC-09-052` |
| `REQ-09-053` | PRE-012 | Story MUST support theme assignment and reset at presentation, master, layout, slide, and eligible subtree scopes with the inheritance source visible. | Theme/master/layout/slide | `AC-09-053` |
| `REQ-09-054` | PRE-012 | Story MUST preview theme changes across representative slides and list contrast, font, effect, spacing, media, and unsupported-feature consequences before bulk commit. | Theme manager; impact review | `AC-09-054` |
| `REQ-09-055` | PRE-012 | Story MUST preserve local overrides when theme resources change and identify broken or type-incompatible bindings. | Editor/files/libraries; update resolve | `AC-09-055` |
| `REQ-09-056` | PRE-012 | Story MUST support named theme variants or modes such as light and dark without reversing semantic slot meaning or mutating source content. | Theme manager/all render surfaces | `AC-09-056` |
| `REQ-09-057` | PRE-012 | Story MUST store presentation-local custom themes and all required definitions in the native presentation or an explicit library dependency. | Files/libraries/offline | `AC-09-057` |
| `REQ-09-058` | PRE-013 | Story MUST define a template as a versioned package of masters, layouts, themes, styles, variables, components, sample slides, assets, and metadata. | Template gallery/files/libraries | `AC-09-058` |
| `REQ-09-059` | PRE-013 | Story MUST let authors preview a template's layouts, theme variants, sample content, fonts, assets, accessibility defaults, version, source, and compatibility before use. | Template gallery; preview | `AC-09-059` |
| `REQ-09-060` | PRE-013 | Story MUST create a new presentation from a template without retaining mutable links to sample content unless the template explicitly declares governed dependencies. | New presentation; materialization | `AC-09-060` |
| `REQ-09-061` | PRE-013 | Story MUST apply a template to existing content through an explicit master/layout/theme mapping and reconciliation preview rather than wholesale replacement. | Editor/template apply; migration transaction | `AC-09-061` |
| `REQ-09-062` | PRE-013 | Story MUST save a presentation or selected design system as a template after checking external assets, fonts, private data, recordings, notes, links, and unsupported content. | Save as template; preflight/artifact | `AC-09-062` |
| `REQ-09-063` | PRE-013 | Story MUST support template categories, search, favorites, recent use, organization source, version, and offline availability without changing template content. | Template gallery; runtime metadata | `AC-09-063` |
| `REQ-09-064` | PRE-013 | Story MUST update governed template or brand dependencies through reviewable versioned changes that preserve accepted local content and overrides. | Libraries/editor; update lifecycle | `AC-09-064` |
| `REQ-09-065` | PRE-013 | Story MUST preserve the last accepted materialized resources when a template library is unavailable, revoked, or newer than the client. | Offline/files/recovery | `AC-09-065` |
| `REQ-09-066` | PRE-012 | Story MUST map imported or pasted theme/template resources by stable identity or semantic role and report collisions, substitutions, and renamed resources. | Clipboard/import/interchange | `AC-09-066` |
| `REQ-09-067` | PRE-013 | Story MUST expose template provenance and governed dependency status without surfacing private provider credentials or internal source identifiers to audiences. | Editor/files/output privacy | `AC-09-067` |

### 7.1 Template-application matrix

| Target presentation state | Default action | Required review |
|---|---|---|
| Empty/new | Materialize selected template | Fonts, external assets, compatibility, privacy |
| Existing with one compatible master family | Map layouts and theme by stable/semantic identity | Unmatched layouts, local overrides, page size |
| Existing with multiple master families | Add template family or map selected family | Name/ID collisions, slide assignment, custom shows |
| Existing with recordings/animation | Preserve tracks and remap stable targets | Unmatched placeholders, timing changes, Morph pairs |
| Existing with unavailable dependencies | Keep current values or embed permitted resources | Licensing, size, offline behavior |

## 8. Native Tables Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-09-068` | PRE-020 | Story MUST create native editable tables from a size picker, command, placeholder, paste, CSV/TSV, or compatible import. | Editor/clipboard/import; create transaction | `AC-09-068` |
| `REQ-09-069` | PRE-020 | Story MUST maintain stable row, column, and cell identities independently from visible index so edits and animation targets survive reorder. | Document/history/collaboration/files | `AC-09-069` |
| `REQ-09-070` | PRE-020 | Story MUST support cell, contiguous range, discontiguous range where offered, row, column, and whole-table selection with distinct keyboard routing. | Table edit; selection runtime | `AC-09-070` |
| `REQ-09-071` | PRE-020 | Story MUST support row and column insertion, deletion, reorder, duplication, resize, distribution, and minimum-size constraints as atomic operations. | Table edit; structure transactions | `AC-09-071` |
| `REQ-09-072` | PRE-020 | Story MUST support cell merge and split only when the resulting rectangular span is valid and references can be deterministically reconciled. | Table edit; structure transaction | `AC-09-072` |
| `REQ-09-073` | PRE-020 | Story MUST support per-cell rich text, padding, vertical/horizontal alignment, fill, borders, effects subset, and number display without flattening text. | Editor/all render surfaces | `AC-09-073` |
| `REQ-09-074` | PRE-020 | Story MUST support table, header, total, first/last row, banded row/column, and conditional approved style semantics through themes and local overrides. | Editor/themes/output | `AC-09-074` |
| `REQ-09-075` | PRE-020 | Story MUST support fixed, content-driven, and fit-to-frame row/column sizing with deterministic overflow and Auto Layout interaction. | Editor/all render surfaces | `AC-09-075` |
| `REQ-09-076` | PRE-020 | Story MUST preserve copied table structure and formatting across Story, spreadsheet, plain-text, HTML, and supported PPTX clipboard flavors by declared tier. | Clipboard/interchange | `AC-09-076` |
| `REQ-09-077` | PRE-020 | Story MUST define formula support as a published function tier with stable cell references, recalculation order, errors, and preservation of unsupported formulas. | Table edit/files/interchange | `AC-09-077` |
| `REQ-09-078` | PRE-020 | Story MUST provide header-row, header-column, caption, summary, reading-order, and language metadata for accessible tables. | Editor/accessibility/output | `AC-09-078` |
| `REQ-09-079` | PRE-020 | Story MUST animate a table as one object, by row, by column, or by cell only through stable generated animation target groups. | Motion authoring/runtime/output | `AC-09-079` |
| `REQ-09-080` | PRE-020 | Story MUST preserve table semantics through resize, theme change, layout reconciliation, native save, collaboration, and supported output. | All lifecycle boundaries | `AC-09-080` |
| `REQ-09-081` | PRE-020 | Story MUST provide convert-to-shapes or rasterize only as explicit destructive copies with source retention and compatibility disclosure. | Editor; conversion transaction | `AC-09-081` |
| `REQ-09-082` | PRE-020 | Story MUST expose table structure, selection, headers, spans, values, formulas, and errors to keyboard and assistive technology. | Editor/accessibility | `AC-09-082` |

### 8.1 Table input matrix

| Focus | Arrow | Tab/Shift+Tab | Enter | Delete | Paste |
|---|---|---|---|---|---|
| Table object selected | Nudge object | Traverse objects | Enter cell edit | Delete table | Replace/create table according to payload |
| Cell selected | Move cell focus | Next/previous cell; optional row append at final cell | Enter text edit | Clear content by default | Fill selected range or expand after preview |
| Text editing in cell | Move caret | Next/previous cell unless list/tab context owns key | Paragraph or commit by configured command | Edit text | Rich/plain text into cell |
| Row/column selected | Move selection | Traverse controls | Enter first eligible cell | Delete content; structural delete requires command | Fill matching region with shape preview |
| Resize boundary active | Adjust boundary with keyboard alternative | No traversal until commit/cancel | Commit | No action | No action |

## 9. Native Charts Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-09-083` | PRE-021 | Story MUST create native editable charts from a chart gallery, chart placeholder, tabular selection, paste, or compatible import. | Editor/clipboard/import; create transaction | `AC-09-083` |
| `REQ-09-084` | PRE-021 | Story MUST retain structured chart data with stable series, category, point, axis, and annotation identities independent of rendered marks. | Document/history/collaboration/files | `AC-09-084` |
| `REQ-09-085` | PRE-021 | Story MUST provide an embedded data editor with range selection, paste, row/column operations, type parsing, undo integration, and validation errors. | Chart data editor; edit transaction | `AC-09-085` |
| `REQ-09-086` | PRE-021 | Story MUST support a published baseline of column, bar, line, area, pie, doughnut, scatter, bubble, radar, combo, and approved statistical chart families. | Editor/all render/output surfaces | `AC-09-086` |
| `REQ-09-087` | PRE-021 | Story MUST allow compatible chart-family changes while previewing data loss, axis changes, unsupported encodings, and animation remapping before commit. | Chart inspector; conversion transaction | `AC-09-087` |
| `REQ-09-088` | PRE-021 | Story MUST support series/category assignment, plot orientation, aggregation policy, missing values, hidden data, and filtered data with explicit defaults. | Data editor/chart inspector | `AC-09-088` |
| `REQ-09-089` | PRE-021 | Story MUST support value, category, date, and logarithmic axes where applicable with scale, bounds, units, crossing, reversal, tick, gridline, and label controls. | Chart inspector/all render surfaces | `AC-09-089` |
| `REQ-09-090` | PRE-021 | Story MUST support titles, legends, data labels, data tables, trendlines, error bars, reference lines, and approved annotations by chart-family capability. | Chart inspector/output | `AC-09-090` |
| `REQ-09-091` | PRE-021 | Story MUST apply theme colors, typography, effects, and chart styles through semantic series slots while preserving explicit point overrides. | Themes/editor/output | `AC-09-091` |
| `REQ-09-092` | PRE-021 | Story MUST provide direct mark/series/axis/legend selection that maps deterministically to semantic chart parts rather than renderer DOM. | Editor; chart sub-selection | `AC-09-092` |
| `REQ-09-093` | PRE-021 | Story MUST support linked external data only under an explicit refresh, credential, cache, offline, privacy, and snapshot policy. | Editor/files/security; data lifecycle | `AC-09-093` |
| `REQ-09-094` | PRE-021 | Story MUST preserve the last accepted data snapshot and identify staleness or refresh failure without blanking the chart. | Editor/runtime/output; failure/recovery | `AC-09-094` |
| `REQ-09-095` | PRE-021 | Story MUST animate charts as one object, by series, category, or element through stable generated groups whose order is previewable. | Motion authoring/runtime/video | `AC-09-095` |
| `REQ-09-096` | PRE-021 | Story MUST support chart title, concise alternative text, long description or data summary, reading order, and decorative state. | Editor/accessibility/output | `AC-09-096` |
| `REQ-09-097` | PRE-021 | Story MUST provide accessible source-data inspection and keyboard navigation of chart parts without relying only on visual marks. | Editor/accessibility | `AC-09-097` |
| `REQ-09-098` | PRE-021 | Story MUST preserve chart data and semantics through themes, layout changes, files, collaboration, clipboard, and supported PPTX mapping. | All lifecycle boundaries | `AC-09-098` |
| `REQ-09-099` | PRE-021 | Story MUST convert charts to shapes or raster only as explicit copies with data-source retention and named editability loss. | Editor; conversion transaction | `AC-09-099` |

### 9.1 Chart data states

`SM-09-003`: `valid-current`, `valid-stale`, `refreshing`, `validation-error`, `refresh-error`, `source-unavailable`, and `preserved-only`. Rendering always uses the last accepted valid snapshot. A provisional data edit does not replace that snapshot until validation succeeds and the transaction commits.

## 10. Diagrams, Equations, Symbols, and Media Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-09-100` | PRE-022 | Story MUST create structured hierarchy, process, cycle, relationship, matrix, pyramid, list, and timeline diagrams from a gallery or compatible outline. | Editor; create transaction | `AC-09-100` |
| `REQ-09-101` | PRE-022 | Story MUST retain stable diagram node and edge identities, semantic order, hierarchy, text, and layout role independently from generated shapes. | Document/history/collaboration/files | `AC-09-101` |
| `REQ-09-102` | PRE-022 | Story MUST support add, delete, reorder, promote, demote, reconnect, and relabel diagram nodes through canvas, outline, and keyboard operations. | Diagram edit; transactions | `AC-09-102` |
| `REQ-09-103` | PRE-022 | Story MUST reflow structured diagrams deterministically under content, size, direction, theme, and layout changes while preserving manual overrides explicitly marked as such. | Editor/all render surfaces | `AC-09-103` |
| `REQ-09-104` | PRE-022 | Story MUST preview compatible diagram-layout changes and classify semantic, manual-position, style, and animation consequences before commit. | Diagram gallery; conversion transaction | `AC-09-104` |
| `REQ-09-105` | PRE-022 | Story MUST animate diagrams as one object, by level, branch, node, or edge using stable generated target groups. | Motion authoring/runtime/output | `AC-09-105` |
| `REQ-09-106` | PRE-022 | Story MUST expose diagram structure, logical order, connections, node text, and alternative description to keyboard and assistive technology. | Editor/accessibility/output | `AC-09-106` |
| `REQ-09-107` | PRE-022 | Story MUST convert a diagram to shapes only as an explicit reversible transaction that preserves a source copy or declared provenance. | Editor; conversion transaction | `AC-09-107` |
| `REQ-09-108` | PRE-023 | Story MUST create native equations from approved linear syntax, visual structures, handwriting conversion where offered, paste, or compatible import. | Editor/clipboard/import; create/edit | `AC-09-108` |
| `REQ-09-109` | PRE-023 | Story MUST preserve equation semantic source, display/inline mode, typography, numbering, and accessibility description independently from rendered glyph paths. | Document/all render/output surfaces | `AC-09-109` |
| `REQ-09-110` | PRE-023 | Story MUST report unsupported equation constructs and retain their source rather than silently replacing them with incorrect notation. | Editor/import/interchange/output | `AC-09-110` |
| `REQ-09-111` | PRE-023 | Story MUST provide searchable symbols and special characters with font coverage, recent use, semantic name, and insertion-context behavior. | Editor; insert | `AC-09-111` |
| `REQ-09-112` | PRE-023 | Story MUST create first-class image, SVG, audio, and video objects with stable asset identity, metadata, replacement, and non-destructive treatment. | Editor/files/all render surfaces | `AC-09-112` |
| `REQ-09-113` | PRE-023 | Story MUST support media trim, poster, captions, volume, fade, loop, autoplay, click, bookmark, and playback-range authoring by applicable media type. | Editor/runtime/video/web | `AC-09-113` |
| `REQ-09-114` | PRE-023 | Story MUST support screen recording as a consented media-capture workflow whose output becomes a normal editable media asset. | Editor/device/files; capture lifecycle | `AC-09-114` |
| `REQ-09-115` | PRE-023 | Story MUST permit embedded web content only through an explicit trust, permission, network, offline, fallback, privacy, and presentation-interaction policy. | Editor/runtime/web output/security | `AC-09-115` |
| `REQ-09-116` | PRE-023 | Story MUST show deterministic posters or named fallbacks for unavailable, blocked, corrupt, or unsupported media while retaining source references. | All render/output surfaces; failure | `AC-09-116` |
| `REQ-09-117` | PRE-023 | Story MUST expose media title, alternative text, decorative state, captions, transcript, language, playback behavior, and warning state to authoring and accessibility surfaces. | Editor/accessibility/output | `AC-09-117` |
| `REQ-09-118` | PRE-023 | Story MUST preserve equation, symbol, diagram, and media semantics through files, collaboration, duplication, clipboard, runtime, and supported output mappings. | All lifecycle boundaries | `AC-09-118` |

## 11. Speaker Notes and Accessibility Metadata Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-09-119` | PRE-040 | Story MUST store speaker notes as a versioned structured rich-text document associated with stable slide identity rather than arbitrary executable HTML. | Editor/files/presenter/output | `AC-09-119` |
| `REQ-09-120` | PRE-040 | Story MUST support notes paragraphs, headings, lists, links, emphasis, language, and approved presenter cues with safe rendering. | Notes editor/presenter/notes output | `AC-09-120` |
| `REQ-09-121` | PRE-040 | Story MUST preserve an active notes edit across slide navigation by committing the old slide before loading the new slide. | Notes panel/view; navigation | `AC-09-121` |
| `REQ-09-122` | PRE-040 | Story MUST search notes with explicit scope and result privacy so note snippets never appear on audience surfaces. | Search/editor/presenter | `AC-09-122` |
| `REQ-09-123` | PRE-040 | Story MUST support notes-page layout, slide image placement, page metadata, headers/footers, and print/export selection without changing speaker-note content. | Notes view/print/export | `AC-09-123` |
| `REQ-09-124` | PRE-040 | Story MUST exclude notes from audience DOM, audience-window messages, public web output, logs, and telemetry unless an author explicitly selects a notes-bearing artifact. | Audience/runtime/output/privacy | `AC-09-124` |
| `REQ-09-125` | PRE-040 | Story MUST migrate legacy notes through a safe deterministic converter that reports discarded unsupported semantics. | Open/import/files; migration | `AC-09-125` |
| `REQ-09-126` | PRE-011 | Story MUST provide a presentation reading-order editor independent from visual z-order with a command to initialize from semantic layout order. | Editor/accessibility; metadata edit | `AC-09-126` |
| `REQ-09-127` | PRE-011 | Story MUST let authors set alternative text, decorative state, title, description, language, pronunciation hint where supported, and artifact inclusion for eligible objects. | Editor/accessibility/output | `AC-09-127` |
| `REQ-09-128` | PRE-011 | Story MUST provide an accessibility checker that identifies missing metadata, reading-order, contrast, table/chart, caption, link, language, and flashing/motion issues with object navigation. | Editor; checker runtime | `AC-09-128` |
| `REQ-09-129` | PRE-011 | Story MUST distinguish error, warning, manual-review, fixed, ignored-with-reason, and not-applicable accessibility issue states. | Checker/files/collaboration | `AC-09-129` |
| `REQ-09-130` | PRE-011 | Story MUST preserve accessibility metadata and issue resolutions through layout reconciliation, duplication, clipboard, files, collaboration, and supported outputs. | All lifecycle boundaries | `AC-09-130` |

## 12. Transition and Object Animation Authoring Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-09-131` | PRE-030 | Story MUST author slide transitions through a normalized type, duration, easing, direction, parameters, inheritance source, and reduced-motion fallback contract. | Normal/motion/master/layout/slide | `AC-09-131` |
| `REQ-09-132` | PRE-030 | Story MUST preview transitions using resolved outgoing and incoming slides without changing the active slide, accepted show state, or rehearsal timing. | Editor; preview runtime | `AC-09-132` |
| `REQ-09-133` | PRE-030 | Story MUST apply, reset, or bulk-apply transitions at master, layout, slide, or selected-slide scope as one transaction with mixed state shown truthfully. | Editor/sorter; authoring transaction | `AC-09-133` |
| `REQ-09-134` | PRE-033 | Story MUST author Morph correspondence using stable explicit match identity first and deterministic semantic fallback only when no explicit match exists. | Motion authoring/files/interchange | `AC-09-134` |
| `REQ-09-135` | PRE-033 | Story MUST expose duplicate, ambiguous, unsupported, and unmatched Morph candidates with author-controlled match, unmatch, and fallback choices. | Motion authoring; diagnostics | `AC-09-135` |
| `REQ-09-136` | PRE-031 | Story MUST author entrance, emphasis, exit, motion-path, media, state-change, and approved custom object effects through one normalized effect model. | Motion authoring/runtime/output | `AC-09-136` |
| `REQ-09-137` | PRE-031 | Story MUST target one or more stable objects, semantic table/chart/diagram parts, component states, or media cues without binding to renderer-specific nodes. | Motion authoring/files/runtime | `AC-09-137` |
| `REQ-09-138` | PRE-031 | Story MUST provide effect parameters for duration, delay, easing, direction, amount, path, repeat, auto-reverse, sound policy, and after-effect only where the selected effect supports them. | Sequencer/inspector; edit | `AC-09-138` |
| `REQ-09-139` | PRE-031 | Story MUST provide editable motion paths with local/world coordinate behavior, orientation-to-path, lock-origin, reverse, and end-position preview. | Canvas/motion view; path edit | `AC-09-139` |
| `REQ-09-140` | PRE-032 | Story MUST represent animation order as stable sequencer items grouped into deterministic build steps and parallel timing groups. | Document/sequencer/files | `AC-09-140` |
| `REQ-09-141` | PRE-032 | Story MUST support On Click, With Previous, After Previous, absolute media/bookmark, and approved object-trigger starts with explicit trigger ownership. | Sequencer/runtime/video | `AC-09-141` |
| `REQ-09-142` | PRE-032 | Story MUST prevent cyclic trigger and timing dependencies before commit and identify the complete dependency chain. | Sequencer/import/files; validation | `AC-09-142` |
| `REQ-09-143` | PRE-032 | Story MUST let authors select, multi-select, rename, reorder, group, ungroup, duplicate, delete, enable, and disable sequencer items through pointer and keyboard. | Sequencer; transactions | `AC-09-143` |
| `REQ-09-144` | PRE-032 | Story MUST provide timeline scale, zoom, horizontal navigation, playhead, markers, snapping, and list/timeline synchronization as runtime authoring state. | Motion view; preview runtime | `AC-09-144` |
| `REQ-09-145` | PRE-032 | Story MUST preview one effect, selected effects, current build, or the full slide from a deterministic start state with stop, pause, scrub, and replay. | Motion view; preview runtime | `AC-09-145` |
| `REQ-09-146` | PRE-032 | Story MUST define copy/paste of animation as a versioned target-aware payload that previews target mapping and unsupported effects before commit. | Clipboard/sequencer; copy/paste transaction | `AC-09-146` |
| `REQ-09-147` | PRE-032 | Story MUST retain animation target references through object rename, reorder, grouping, component updates, chart/table/diagram edits, and compatible layout reconciliation. | Document/history/collaboration | `AC-09-147` |
| `REQ-09-148` | PRE-032 | Story MUST classify missing animation targets as unresolved steps that remain editable, visible, and excluded or substituted by explicit runtime policy. | Sequencer/runtime/interchange | `AC-09-148` |
| `REQ-09-149` | PRE-033 | Story MUST use identical normalized sequence, target identity, and timing semantics in authoring preview, rehearsal, audience runtime, recording, and video export. | All motion surfaces | `AC-09-149` |
| `REQ-09-150` | PRE-030 | Story MUST expose transition and animation readiness risks for fonts, assets, media, code, data, and embeds before rehearsal, recording, or presenting. | Motion/rehearsal/recording preflight | `AC-09-150` |
| `REQ-09-151` | PRE-030 | Story MUST preserve source motion semantics and report substitutions when a surface, reduced-motion mode, or interchange target cannot execute an effect. | All output/interchange surfaces | `AC-09-151` |
| `REQ-09-152` | PRE-032 | Story MUST expose sequencer item type, target, order, trigger, timing, enabled state, issue state, and group relation to keyboard and assistive technology. | Motion view/accessibility | `AC-09-152` |
| `REQ-09-153` | PRE-031 | Story MUST provide a no-motion semantic end-state for every authored effect so reduced-motion and static outputs never omit required content. | Runtime/static output/accessibility | `AC-09-153` |
| `REQ-09-154` | PRE-032 | Story MUST commit sequencer drags, timing scrubs, path edits, and bulk changes as one transaction per gesture with exact cancel behavior. | Sequencer/history/collaboration | `AC-09-154` |
| `REQ-09-155` | PRE-033 | Story MUST preserve transition, Morph, effect, trigger, sequence, and target data through native save, collaboration, duplication, templates, clipboard, and declared PPTX tiers. | All lifecycle boundaries | `AC-09-155` |

### 12.1 Sequencer interaction matrix

| State | Pointer | Keyboard | Preview behavior | Commit boundary |
|---|---|---|---|---|
| Item selected | Drag to reorder or move timing | Traverse/select/reorder/nudge timing | Optional selected-effect preview | Drop or explicit numeric commit |
| Timing edge selected | Drag duration edge | Adjust by step/fine/large increment | Live deterministic preview | Release/Enter; Escape restores start |
| Motion path edit | Edit points/handles/end | Point traversal/nudge/path commands | Object shown at playhead position | End gesture or Done |
| Multi-selection | Move timing as group or set property | Bulk command | Preview selected set preserving offsets | One transaction |
| Full-slide preview | Playhead controls only | Play/pause/stop/scrub | No document mutation | None until authored edit |
| Unresolved target | Open mapping control | Navigate issue/actions | Substitute preview only after choice | Map/remove/disable transaction |

### 12.2 Animation state machine

`SM-09-004`: `idle -> preparing -> previewing <-> paused -> stopped`; authoring edits during `previewing` stop or deterministically restart preview according to the edited property. Runtime execution state belongs to Volume 10 and never shares mutable state with this authoring preview.

## 13. Rehearsal and Recording Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-09-156` | PRE-041 | Story MUST start rehearsal from the beginning, current slide, selected slide, or custom show with an explicit policy for hidden slides, builds, media, narration, and loops. | Rehearsal setup/runtime | `AC-09-156` |
| `REQ-09-157` | PRE-041 | Story MUST capture per-slide, per-build, transition, pause, and total elapsed timings from the deterministic runtime clock rather than wall-clock callbacks alone. | Rehearsal/runtime/files | `AC-09-157` |
| `REQ-09-158` | PRE-041 | Story MUST exclude paused, readiness-blocked, recovery, and configuration time from accepted rehearsal timing unless the author explicitly includes it. | Rehearsal; timing capture | `AC-09-158` |
| `REQ-09-159` | PRE-041 | Story MUST present a rehearsal review with current, recorded, average, target, variance, skipped, and issue states by slide and build. | Rehearsal review | `AC-09-159` |
| `REQ-09-160` | PRE-041 | Story MUST let authors accept, edit, clear, retry, or merge rehearsal timings at slide, section, custom-show, or presentation scope. | Rehearsal review; transactions | `AC-09-160` |
| `REQ-09-161` | PRE-041 | Story MUST preserve separate rehearsal sessions until the author chooses which timing set becomes the presentation's recorded-timing source. | Files/rehearsal review | `AC-09-161` |
| `REQ-09-162` | PRE-042 | Story MUST provide recording setup for scope, start point, narration, camera, screen, pointer, ink, timing, captions, teleprompter/notes policy, and retake mode. | Recording setup | `AC-09-162` |
| `REQ-09-163` | PRE-042 | Story MUST enumerate available microphones, cameras, and capture sources with permission, selected device, level/preview, availability, and privacy state before recording. | Recording setup/devices | `AC-09-163` |
| `REQ-09-164` | PRE-042 | Story MUST obtain informed permission immediately before first use of each recording device or capture source and allow recording without denied optional tracks. | Recording setup/security | `AC-09-164` |
| `REQ-09-165` | PRE-042 | Story MUST run a readiness check for devices, storage, fonts, assets, media, embeds, captions, and timeline issues before recording begins. | Recording setup/preflight | `AC-09-165` |
| `REQ-09-166` | PRE-042 | Story MUST capture narration, camera, slide/build timing, pointer/laser, ink, and caption-source events as independently identifiable synchronized tracks. | Recording runtime/files | `AC-09-166` |
| `REQ-09-167` | PRE-042 | Story MUST support stop, pause, resume, discard provisional take, and recover accepted chunks after device loss or interrupted capture. | Recording runtime/recovery | `AC-09-167` |
| `REQ-09-168` | PRE-042 | Story MUST retake a selected slide while preserving unselected slides and explicitly handling transition overlap and shared media boundaries. | Recording review; retake transaction | `AC-09-168` |
| `REQ-09-169` | PRE-042 | Story MUST provide recording review for take selection, per-track mute/visibility, trim where supported, caption edit, playback, issue navigation, and delete. | Recording review; edit transactions | `AC-09-169` |
| `REQ-09-170` | PRE-042 | Story MUST preserve accepted recording tracks, consent metadata, captions, timing links, asset references, and edit history through save, recovery, collaboration policy, and output preflight. | Files/recovery/output/collaboration | `AC-09-170` |

### 13.1 Recording setup state machine

`SM-09-005`:

| State | Meaning | Allowed transition |
|---|---|---|
| `unconfigured` | No current setup | choose scope/devices |
| `configuring` | Author edits options and sees previews | request permissions, run check, cancel |
| `permission-pending` | Platform prompt owns relevant input | granted/denied returns to configuring |
| `checking` | Readiness validates devices/assets/storage/timeline | ready, ready-with-warnings, blocked |
| `ready` | Required checks pass | begin recording, change setup |
| `ready-with-warnings` | Nonblocking issues acknowledged | begin recording, repair, change setup |
| `blocked` | Required device/storage/security condition fails | repair, change scope, cancel |
| `recording` | Volume 10 runtime captures synchronized tracks | pause, stop, recover |
| `review` | Accepted/provisional takes available | retake, edit, accept, delete |

### 13.2 Rehearsal flow

`FLOW-09-003`:

1. Choose scope and show policy.
2. Run runtime readiness without counting blocked time.
3. Execute the same slide/build sequence and clocks as audience playback.
4. Capture navigation, build, transition, pause, media, and recovery events.
5. Close the final active interval deterministically.
6. Present a review without overwriting prior accepted timings.
7. Accept all or selected timing scopes as one authored transaction.

### 13.3 Recording flow

`FLOW-09-004`:

1. Choose recording scope and tracks.
2. Enumerate devices and display live privacy-safe previews/meters.
3. Request missing permissions only for enabled tracks.
4. Run readiness and resolve blocking failures.
5. Start a deterministic runtime session with a countdown that is excluded from authored timing unless selected.
6. Persist capture in recoverable chunks while tracks remain synchronized to slide/build events.
7. Stop or recover into review without replacing an accepted take automatically.
8. Review, caption, trim, choose, retake, or delete tracks.
9. Commit accepted recording metadata and asset references atomically.

## 14. Keyboard and Accessibility Hooks

Volume 12 owns full conformance. This volume requires these hooks:

| Surface | Keyboard contract | Required semantics |
|---|---|---|
| Slide navigator/sorter | Traverse, select/toggle/range, activate, reorder, section, hide, rename, context actions | Slide number/title, hidden, section, selected, issue, transition/timing/recording indicators |
| Outline | Tree/text navigation with explicit edit mode | Slide/placeholder source, heading level, reading order, hidden state |
| Master/layout view | Traverse hierarchy, activate root, edit, reset, inspect impact | Master/layout/placeholder role, source, use count, override state |
| Table editor | Cell/range navigation, selection, edit, row/column commands, resize alternatives | Coordinates, headers, span, value/formula/error, selection extent |
| Chart editor | Traverse chart parts and source data; open data editor and formatting | Chart type, series/category/point identity, value, trend/annotation, alt summary |
| Diagram editor | Traverse logical nodes/edges, reorder/promote/demote, edit text | Role, level/order, connection, layout, alt description |
| Motion sequencer | Traverse items/groups, multi-select, reorder, adjust timing, preview, resolve issues | Effect, target, build/order, trigger, timing, enabled/issue state |
| Rehearsal review | Traverse slide/build timing rows, compare, edit, accept/clear | Current/recorded/target/variance/status |
| Recording setup/review | Choose devices/tracks, inspect levels, operate capture/review without pointer | Permission/device/privacy state, elapsed time, track status, caption state |
| Accessibility checker | Navigate issues to objects, fix, ignore with reason, recheck | Severity, rule, object, status, remediation |

Every pointer-only edit has a command, numeric field, outline/data editor, or inspector alternative. Focus returns to the initiating slide/object/sequence item after dialogs and destructive confirmations.

## 15. Edge and Failure Contracts

| Condition | Required behavior |
|---|---|
| Last slide deleted | Enter a deliberate empty-presentation state or create one blank slide according to the configured product rule; never retain a dangling active ID |
| Section becomes empty | Retain or remove the empty section according to the user's command; never absorb unrelated slides silently |
| Custom show references deleted slide | Mark missing reference, skip safely at runtime, offer repair/remove |
| Layout/master unavailable | Preserve last-resolved slide appearance and local content, mark source orphaned, offer remap |
| Layout change has no compatible placeholder | Detach content with provenance and preview its position; do not delete |
| Master update conflicts with local override | Preserve local value and expose source conflict review |
| Template page size differs | Require explicit scale/maximize/preserve policy before application |
| Theme font missing | Preserve requested family, substitute deterministically, preflight affected ranges |
| Table paste shape mismatch | Preview fill/expand/repeat/replace policy; cancel leaves table unchanged |
| Invalid table formula | Preserve expression and show typed error without corrupting dependent cells |
| Chart data invalid | Keep last valid rendered snapshot and show data-editor diagnostics |
| Linked chart source offline | Use accepted snapshot, mark stale, never expose credentials in artifact or telemetry |
| Diagram text overflows | Reflow under declared policy or show overflow; never drop text |
| Equation parser fails | Preserve source and show localized parse position; do not replace with misleading output |
| Media unavailable/corrupt | Preserve reference and treatment, show deterministic poster/placeholder, offer locate/replace |
| Web embed blocked/offline | Show authored fallback with reason; never bypass trust policy |
| Notes conversion strips content | Report exact unsupported block/mark classes and retain source in migration preservation data where allowed |
| Animation target deleted | Keep unresolved sequencer item visible and nonexecuting until remapped/removed/disabled |
| Trigger cycle imported | Quarantine invalid sequence, preserve source, prevent execution, offer repair |
| Preview asset not ready | Bound wait, show editor-only readiness state, permit cancel, never change accepted timeline |
| Rehearsal closes unexpectedly | Recover completed intervals; mark open interval incomplete rather than guessing duration |
| Recording permission denied | Disable only affected optional track or block when required; preserve existing takes |
| Device disconnects mid-recording | Finalize recoverable chunks, mark gap, continue eligible tracks, offer retake |
| Storage threshold reached | Stop safely before corruption, retain accepted chunks, identify required space/action |
| Collaboration changes active slide during review | Keep review bound to stable identities and classify deleted/remapped targets |

## 16. Acceptance Criteria

All criteria use production paths. Visual workflows require headed browser evidence. Native files, clipboard, data objects, notes, recordings, and exported/interchanged artifacts require structural inspection in addition to screenshots.

### 16.1 Slides, views, and page setup

| ID | Pass condition |
|---|---|
| `AC-09-001` | Before/after/end creation produces the selected/default layout, expected order, active state, and one undoable transaction. |
| `AC-09-002` | Duplicate artifacts have unique identities and equivalent content, notes, motion, recording, accessibility, and valid dependencies. |
| `AC-09-003` | Single/multi/last-slide deletion follows the declared fallback, leaves no dangling references, and fully undoes. |
| `AC-09-004` | Slide clipboard artifacts carry required dependencies and paste with correct mapping/report across presentations. |
| `AC-09-005` | All selection modes produce deterministic selected IDs and activation behavior in normal, sorter, and outline views. |
| `AC-09-006` | Pointer and keyboard reorder preserve selected-slide relative order, sections, references, and one history step. |
| `AC-09-007` | Rename commit/cancel/invalid/empty/duplicate scenarios produce the declared title and accessible name. |
| `AC-09-008` | Hidden and editor-filter/collapse states remain semantically and visually distinct through save/reopen and show preflight. |
| `AC-09-009` | Search corpus returns correct scoped matches without leaking notes into audience-visible results. |
| `AC-09-010` | Section create/rename/reorder/collapse/delete preserves canonical slides and expected membership. |
| `AC-09-011` | Cross-section moves derive the expected contiguous membership and undo exactly. |
| `AC-09-012` | Custom shows preserve stable order/repetition policy and identify deleted or inaccessible references. |
| `AC-09-013` | Normal view edits the same document entities rendered by other surfaces and stores no duplicate view model. |
| `AC-09-014` | Large-deck sorter virtualizes while selection, reorder, sections, hide, transitions, and timing remain correct. |
| `AC-09-015` | Outline edits update source placeholder/text identities once and preserve unsupported slide content. |
| `AC-09-016` | Notes view changes notes/page metadata without adding any notes content to audience DOM. |
| `AC-09-017` | Master/layout inherited content is visible but cannot be directly edited from an ineligible root. |
| `AC-09-018` | View switches restore valid active slide, selection, scroll, and focus after target deletion and normal use. |
| `AC-09-019` | Every standard/custom size round-trips dimensions, units, orientation, and aspect ratio. |
| `AC-09-020` | Scale/maximize/preserve previews match committed geometry and cancel leaves semantic hashes unchanged. |
| `AC-09-021` | Page setup updates masters, layouts, slides, guides, backgrounds, notes pages, and output preflight consistently. |
| `AC-09-022` | Numbering start/count/suppress policies resolve correctly in placeholders and output fixtures. |
| `AC-09-023` | Fixed/automatic date, header, and footer inheritance resolves and resets at each supported scope. |
| `AC-09-024` | Document metadata round-trips and private runtime identity is absent from public artifacts. |
| `AC-09-025` | Background inherit/override/hide/reset and contrast diagnostics match each render surface. |
| `AC-09-026` | Reorder/rename leaves all stable slide references semantically intact. |
| `AC-09-027` | Delete/import fault fixtures list every broken reference and each repair action produces the previewed result. |
| `AC-09-028` | Keyboard/assistive workflows reach every view and operation with correct role, position, selection, and state. |

### 16.2 Masters, themes, templates, and placeholders

| ID | Pass condition |
|---|---|
| `AC-09-029` | Multiple master families and layout order round-trip with every slide resolving the intended layout. |
| `AC-09-030` | Resolution fixtures prove slide-over-layout-over-master-over-theme/system precedence without source mutation. |
| `AC-09-031` | Master/layout create/duplicate/rename/reorder/delete workflows show impact and produce one reversible transaction. |
| `AC-09-032` | In-use deletion is blocked or reconciled exactly as previewed with no dangling references. |
| `AC-09-033` | Inherited/overridden/hidden/detached/restored/orphaned states are truthful in canvas, layer, inspector, and semantics. |
| `AC-09-034` | Scoped reset restores only selected source semantics and preserves unrelated local content. |
| `AC-09-035` | Detach preserves appearance/provenance, removes only selected links, and fully undoes. |
| `AC-09-036` | Restore maps compatible detached content by identity/type/confirmed choice without losing metadata. |
| `AC-09-037` | Layout reconciliation corpus follows identity, role/compatibility, deterministic order, then position fallback. |
| `AC-09-038` | Every unmatched user-content fixture survives as local content with origin metadata and issue. |
| `AC-09-039` | Every placeholder role can be authored, instantiated, resolved, rendered, and round-tripped. |
| `AC-09-040` | Placeholder contracts validate accepted content, prompt, style, layout, replacement, and accessibility defaults. |
| `AC-09-041` | First slide edit creates an override without changing layout semantic hash. |
| `AC-09-042` | Click/paste/drop/command/replace insert compatible content while retaining placeholder identity. |
| `AC-09-043` | Empty prompts are absent from audience, search content, accessibility tree, and output artifacts. |
| `AC-09-044` | Each placeholder lock blocks only its declared slide-level mutation and remains editable in authorized root. |
| `AC-09-045` | Master/layout impact review enumerates every materially affected slide and issue before commit. |
| `AC-09-046` | Propagation changes only nonoverridden semantics and classifies all conflicts. |
| `AC-09-047` | Volume 08 responsive/reuse systems resolve identically inside master/layout and slide contexts. |
| `AC-09-048` | Master/layout/placeholder IDs and overrides survive files, duplication, template, collaboration, and declared PPTX fixtures. |
| `AC-09-049` | Keyboard/assistive inspection reports role, source, accepted content, override state, and defaults. |
| `AC-09-050` | Direct/indirect cycles and invalid cross-master references are rejected with no partial mutation. |
| `AC-09-051` | Theme artifacts contain stable references for every declared resource family. |
| `AC-09-052` | Slides with different themes render concurrently in editor, thumbnails, transitions, and output without cross-root leakage. |
| `AC-09-053` | Assign/reset at each scope shows and resolves the correct inheritance source. |
| `AC-09-054` | Theme impact preview and final commit agree for contrast, fonts, effects, spacing, media, and issues. |
| `AC-09-055` | Theme updates retain local overrides and identify every broken/type-incompatible binding. |
| `AC-09-056` | Theme modes change resolved values without changing semantic slots or source content. |
| `AC-09-057` | Custom themes render offline after native reopen with no local-storage-only dependency. |
| `AC-09-058` | Template artifact inspection finds every declared resource family, version, source, and metadata. |
| `AC-09-059` | Template preview accurately reports layouts, modes, samples, fonts, assets, accessibility, version, and compatibility. |
| `AC-09-060` | New-from-template materializes unique presentation content and only declared governed links remain. |
| `AC-09-061` | Existing-content template application follows approved mappings and preserves all unmatched content. |
| `AC-09-062` | Save-as-template preflight catches external assets, fonts, private data, recordings, notes, links, and unsupported content. |
| `AC-09-063` | Search/category/favorite/recent/source/version/offline gallery states do not mutate templates. |
| `AC-09-064` | Versioned dependency updates change only accepted resources and preserve local content/overrides. |
| `AC-09-065` | Offline/revoked/newer-source fixtures retain last accepted resources and actionable status. |
| `AC-09-066` | Import/paste collision corpus maps or renames deterministically and reports every substitution. |
| `AC-09-067` | Provenance is available to authors while audience artifacts/messages contain no private provider credentials. |

### 16.3 Tables, charts, diagrams, equations, and media

| ID | Pass condition |
|---|---|
| `AC-09-068` | Picker, command, placeholder, paste, CSV/TSV, and import produce native editable table fixtures. |
| `AC-09-069` | Row/column/cell identities survive insert/delete/reorder, animation targeting, collaboration replay, and round trip. |
| `AC-09-070` | Every table selection mode returns expected stable identities and keyboard context. |
| `AC-09-071` | Structural row/column operations preserve content/references, enforce minimums, and undo atomically. |
| `AC-09-072` | Valid merges/splits preserve rectangular spans; invalid operations are blocked before mutation. |
| `AC-09-073` | Rich text, padding, alignment, fill, border, effect, and number display match semantic and visual fixtures. |
| `AC-09-074` | Table style options resolve through themes while explicit cell overrides remain intact. |
| `AC-09-075` | Fixed/content/fit sizing produces deterministic bounds and overflow in standalone and Auto Layout contexts. |
| `AC-09-076` | Story/spreadsheet/text/HTML/PPTX clipboard corpus preserves declared structure and reports degradation. |
| `AC-09-077` | Formula-tier corpus recalculates deterministically, shows typed errors, and preserves unsupported formulas. |
| `AC-09-078` | Header/caption/summary/order/language metadata appears correctly in editor and accessible outputs. |
| `AC-09-079` | Table animation grouping produces stable expected build targets after structural edits. |
| `AC-09-080` | Table semantics survive every declared lifecycle and surface fixture. |
| `AC-09-081` | Shape/raster conversion names loss, retains source/provenance, and fully undoes. |
| `AC-09-082` | Keyboard/assistive table workflows expose coordinates, headers, spans, values, formulas, selections, and errors. |
| `AC-09-083` | Gallery, placeholder, table selection, paste, and import produce native editable chart fixtures. |
| `AC-09-084` | Series/category/point/axis/annotation IDs survive data and chart edits, animation, collaboration, and round trip. |
| `AC-09-085` | Data editor selection/paste/structure/type/error/undo matrix matches expected accepted snapshot. |
| `AC-09-086` | Every published chart family renders its supported data/encoding corpus or reports an exact unsupported case. |
| `AC-09-087` | Family-change preview classifications exactly match committed data, axes, encodings, and animation mappings. |
| `AC-09-088` | Plot orientation, aggregation, missing/hidden/filtered data policies produce deterministic marks and summaries. |
| `AC-09-089` | Axis capability matrix validates scales, bounds, units, crossing, reversal, ticks, gridlines, and labels. |
| `AC-09-090` | Titles, legends, labels, data tables, trendlines, error bars, reference lines, and annotations match family support. |
| `AC-09-091` | Theme/style updates preserve explicit point overrides and semantic series-color identity. |
| `AC-09-092` | Direct sub-selection resolves to stable semantic chart parts, never renderer DOM identities. |
| `AC-09-093` | Linked data requires explicit policy and stores no reusable credential in presentation artifacts. |
| `AC-09-094` | Refresh/offline failures retain the last accepted chart and expose stale/error state. |
| `AC-09-095` | Chart animation grouping remains stable after data reorder and compatible family changes. |
| `AC-09-096` | Chart alt text, long description/data summary, reading order, and decorative state round-trip and export. |
| `AC-09-097` | Keyboard/assistive users can inspect chart source data and every semantic chart part. |
| `AC-09-098` | Chart data/semantics survive all declared lifecycle and PPTX-tier fixtures. |
| `AC-09-099` | Chart shape/raster conversion discloses loss, retains data source/provenance, and fully undoes. |
| `AC-09-100` | Every baseline diagram family can be created from gallery and compatible outline as structured content. |
| `AC-09-101` | Diagram node/edge identities, order, hierarchy, text, and roles survive reflow and round trip. |
| `AC-09-102` | Canvas/outline/keyboard structural edits produce equivalent deterministic diagram operations. |
| `AC-09-103` | Diagram reflow corpus is deterministic and preserves declared manual overrides. |
| `AC-09-104` | Diagram-layout preview matches final semantic, position, style, and animation mapping. |
| `AC-09-105` | Diagram grouping modes generate expected stable build targets. |
| `AC-09-106` | Keyboard/assistive users can traverse structure, connections, text, order, and description. |
| `AC-09-107` | Convert-to-shapes preserves appearance/provenance and reverses to structured source through undo. |
| `AC-09-108` | Linear, visual, handwriting where offered, paste, and import paths create editable semantic equations. |
| `AC-09-109` | Equation source/display/typography/numbering/description survive all declared surfaces and files. |
| `AC-09-110` | Unsupported equation corpus retains source and reports exact constructs without misleading render. |
| `AC-09-111` | Symbol search/recents/name/font coverage/insertion-context matrix produces expected characters and metadata. |
| `AC-09-112` | Image/SVG/audio/video objects retain stable assets, metadata, replacement, and treatments through round trip. |
| `AC-09-113` | Media-authoring property matrix matches runtime and video/web behavior. |
| `AC-09-114` | Screen recording requests consent and yields a normal asset with recoverable metadata. |
| `AC-09-115` | Web embeds obey trust/network/offline/fallback/privacy/interaction policies in editor and runtime. |
| `AC-09-116` | Missing/blocked/corrupt/unsupported media renders deterministic fallback and retains reference. |
| `AC-09-117` | Media accessibility and playback metadata is complete, keyboard-editable, and output-visible as declared. |
| `AC-09-118` | Equation/symbol/diagram/media semantics survive every declared lifecycle and output fixture. |

### 16.4 Notes, accessibility, motion, rehearsal, and recording

| ID | Pass condition |
|---|---|
| `AC-09-119` | Notes artifacts use the versioned structured model and contain no executable arbitrary HTML. |
| `AC-09-120` | Supported notes blocks/marks/links/language/cues render safely and equivalently in editor, presenter, and notes output. |
| `AC-09-121` | Rapid slide navigation flushes each notes edit to the correct stable slide without cross-slide leakage. |
| `AC-09-122` | Notes search is accurate and no note snippet appears on an audience surface. |
| `AC-09-123` | Notes-page layout and metadata change output composition without changing notes semantic hash. |
| `AC-09-124` | Audience DOM/messages/public web/log/telemetry inspection contains no notes unless an explicit notes artifact was selected. |
| `AC-09-125` | Legacy migration corpus yields deterministic safe notes and an exact discarded-feature report. |
| `AC-09-126` | Reading-order initialization/editing is independent from z-order and persists through output. |
| `AC-09-127` | Object accessibility metadata validates, round-trips, and maps to supported artifacts. |
| `AC-09-128` | Checker corpus finds every seeded issue and navigates to the correct stable object. |
| `AC-09-129` | Issue states error/warning/manual/fixed/ignored/not-applicable remain distinct and persisted as declared. |
| `AC-09-130` | Accessibility metadata and issue resolutions survive all declared lifecycle fixtures. |
| `AC-09-131` | Transition authoring normalizes every supported type/parameter/source and reduced-motion fallback. |
| `AC-09-132` | Transition preview matches runtime start/end semantics and leaves active slide, show state, and timing unchanged. |
| `AC-09-133` | Scope/bulk/reset operations show truthful mixed/source state and create one transaction. |
| `AC-09-134` | Morph fixtures match explicit IDs before deterministic fallback on every applicable surface. |
| `AC-09-135` | Duplicate/ambiguous/unsupported/unmatched candidates are all surfaced and author choices persist. |
| `AC-09-136` | Every published effect family validates and renders through the one normalized model. |
| `AC-09-137` | Object and semantic subobject targets remain stable and contain no renderer-specific identity. |
| `AC-09-138` | Effect controls appear only when supported and accepted values match preview/runtime. |
| `AC-09-139` | Motion-path edit/orientation/origin/reverse/end preview match runtime geometry and undo. |
| `AC-09-140` | Sequencer stable order, build grouping, and parallel groups round-trip deterministically. |
| `AC-09-141` | Every trigger type starts at the documented event and ownership boundary. |
| `AC-09-142` | Direct and indirect trigger/timing cycles are rejected with complete dependency diagnostics. |
| `AC-09-143` | Pointer/keyboard item lifecycle operations produce equivalent sequence state and one transaction. |
| `AC-09-144` | Timeline viewport/playhead/markers/snapping/list sync work without document mutation. |
| `AC-09-145` | Effect/selection/build/full preview starts deterministically and stop/pause/scrub/replay leave authored state unchanged. |
| `AC-09-146` | Animation clipboard mapping preview exactly predicts retained, remapped, disabled, and unsupported steps. |
| `AC-09-147` | Rename/reorder/group/component/data/layout edits retain every compatible stable animation target. |
| `AC-09-148` | Deleted-target fixtures leave visible editable unresolved steps and follow explicit runtime policy. |
| `AC-09-149` | Preview, rehearsal, audience, recording, and video produce identical sequence/timing event logs for one fixture. |
| `AC-09-150` | Preflight finds every seeded font/asset/media/code/data/embed readiness risk before entry. |
| `AC-09-151` | Reduced-motion/surface/interchange substitutions retain source and match compatibility reports. |
| `AC-09-152` | Keyboard/assistive sequencer traversal exposes complete item/group/trigger/timing/issue semantics. |
| `AC-09-153` | Every effect fixture has a no-motion end state containing all semantically required content. |
| `AC-09-154` | Drag/scrub/path/bulk gestures create one transaction and Escape restores exact start state. |
| `AC-09-155` | Complete motion data survives files, collaboration, duplication, templates, clipboard, and declared PPTX tiers. |
| `AC-09-156` | Every rehearsal start scope follows configured hidden/build/media/narration/loop policy. |
| `AC-09-157` | Rehearsal event logs and computed slide/build/transition/total timings agree with deterministic clock fixtures. |
| `AC-09-158` | Paused/readiness/recovery/configuration intervals are excluded or included exactly by selected policy. |
| `AC-09-159` | Review rows accurately show current/recorded/average/target/variance/skipped/issue values. |
| `AC-09-160` | Accept/edit/clear/retry/merge at each scope changes only selected timings in one transaction. |
| `AC-09-161` | Multiple sessions remain independently reviewable until one timing set is explicitly accepted. |
| `AC-09-162` | Recording setup persists and displays every scope/track/timing/caption/notes/retake choice. |
| `AC-09-163` | Device enumeration and meters/previews accurately expose selected, available, and permission states. |
| `AC-09-164` | First-use consent is requested per enabled source and denied optional tracks can be omitted safely. |
| `AC-09-165` | Recording preflight catches seeded device/storage/font/asset/media/embed/caption/timeline failures. |
| `AC-09-166` | Captured narration/camera/timing/pointer/ink/caption tracks have stable IDs and synchronized event anchors. |
| `AC-09-167` | Stop/pause/resume/discard/device-loss fixtures retain accepted chunks and never corrupt prior takes. |
| `AC-09-168` | Slide retake changes only selected tracks/scope and handles overlap exactly as previewed. |
| `AC-09-169` | Review supports take choice, track controls, trim tier, captions, playback, issues, and delete with undo policy. |
| `AC-09-170` | Accepted tracks, consent, captions, timing, assets, and history survive save/recovery and output preflight. |

## 17. Required Evidence and Traceability

### 17.1 Story-Native Narrative and Edition Authoring

The Story-native bridge is a required presentation-authoring workflow, not an optional system-layer abstraction.

#### System-view information hierarchy

```text
System view
  1. Story System status
    theme, masters/layouts, components, variables, narrative readiness
  2. Base narrative
    ordered narrative items, semantic roles, source slides/components
  3. Audience editions
    audience, inclusion/order/substitution/modes, local overrides, readiness
  4. Update review
    upstream change, affected editions, conflict/orphan status, accept/reset/keep local
  5. Delivery profiles
    runtime snapshot status, output profiles, compatibility and accessibility findings
```

The first success state is reached when an existing or new presentation has one named base narrative, at least one validated audience edition, and a source change can propagate to that edition without copying the presentation or losing an intentional override.

#### Adoption flow

`FLOW-09-005` converts an existing presentation into a Story System:

1. Inventory slides, sections, layouts, components, repeated structures, notes, and custom shows without mutating the presentation.
2. Propose a base narrative order and semantic roles using existing slide identity; proposals remain unapproved until the author accepts them.
3. Identify reusable narrative-component candidates and visual-system dependencies without flattening or auto-replacing content.
4. Preview exactly which metadata and references will be added; no slide pixels or authored text change merely by adoption.
5. Commit accepted narrative roles, order, and system metadata as one transaction, or cancel with byte-equivalent canonical authored content.
6. Offer creation of the first audience edition from the accepted base narrative.

#### Edition creation and update-review flow

`FLOW-09-006`:

1. Name the audience and choose a base narrative revision.
2. Include, exclude, reorder, repeat where allowed, substitute, localize, and select variable modes through stable edition directives.
3. Preview inherited versus edition-specific content, notes, motion, accessibility, and output consequences.
4. Commit the edition without duplicating slides or severing source identity.
5. When base or shared sources change, classify each edition outcome as unaffected, updated, conflicted, orphaned, or blocked.
6. Review changes by source item and edition with explicit **Accept source**, **Keep edition**, **Reset**, **Map**, **Promote to base**, and **Detach** actions where semantically valid.
7. Produce a validated edition-resolution hash used by runtime and output admission.

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-09-171` | PRE-001 | Story MUST let an author establish a base narrative from existing or new slides without duplicating slide content or changing visual appearance merely by adoption. | System/Outline/Grid; adoption transaction | `AC-09-171` |
| `REQ-09-172` | PRE-001 | Story MUST store narrative-item order and semantic roles through stable identities independently from canonical slide order. | System/Outline/files/collaboration | `AC-09-172` |
| `REQ-09-173` | DES-054 | Story MUST let authors create and place narrative components with semantic slots, visual mapping, notes, motion, and accessibility defaults while preserving source identity. | System/Canvas/libraries | `AC-09-173` |
| `REQ-09-174` | PRE-001 | Story MUST create an audience edition as stable non-destructive directives over one base narrative revision rather than as a copied presentation or custom-show alias. | System/Grid/Outline/files | `AC-09-174` |
| `REQ-09-175` | PRE-001 | Story MUST let an edition include, exclude, reorder, substitute, localize, and select variable modes with inherited and local state visible before commit. | System and projected authoring views | `AC-09-175` |
| `REQ-09-176` | DES-054 | Story MUST classify every shared-source update per affected edition as unaffected, updated, conflicted, orphaned, or blocked. | System/update review | `AC-09-176` |
| `REQ-09-177` | DES-054 | Story MUST provide explicit source-versus-edition reconciliation actions that preserve both sides until the author commits one outcome. | System/update review/history | `AC-09-177` |
| `REQ-09-178` | ARC-003 | Story MUST produce a deterministic edition-resolution hash from base revision, directives, variable modes, overrides, locale, and narrative-component versions. | Resolver/runtime/output admission | `AC-09-178` |
| `REQ-09-179` | PRE-040 | Story MUST scope notes, rehearsal timings, recording tracks, accessibility metadata, and show settings to base or edition according to an explicit inheritance source. | Notes/rehearsal/recording/System | `AC-09-179` |
| `REQ-09-180` | PRE-001 | Story MUST let an author preview and navigate every difference between an edition and its base by narrative item, slide occurrence, object, and governed property. | System/Grid/Outline/Canvas | `AC-09-180` |

| ID | Pass condition |
|---|---|
| `AC-09-171` | Adopting and canceling an existing fixture leaves canonical content and rendered output unchanged; accepting adds only stable narrative/system semantics. |
| `AC-09-172` | Reordering a narrative item leaves canonical slide order unchanged unless the author separately commits a slide-order operation. |
| `AC-09-173` | Narrative-component fixtures preserve semantic slots, visual mapping, notes, motion, accessibility, source updates, and local overrides across save/reopen. |
| `AC-09-174` | The first edition contains directives and shared references, no duplicated presentation root or slides, and cannot be represented solely as a custom show. |
| `AC-09-175` | Every supported edition difference previews and commits through stable directives with inherited/local provenance visible in all projected views. |
| `AC-09-176` | A seeded shared-source change produces the expected unaffected, updated, conflicted, orphaned, and blocked classifications across five edition fixtures. |
| `AC-09-177` | Each reconciliation action preserves unchosen source/local data until commit and produces one undoable transaction with deterministic reset. |
| `AC-09-178` | Equivalent edition inputs produce equal hashes; changing any semantic input changes the hash; UI-only state does not. |
| `AC-09-179` | Base and edition note/timing/recording/accessibility/show-setting fixtures resolve the declared source and never leak another edition's private content. |
| `AC-09-180` | Headed workflows navigate every seeded edition difference to the exact source and target while unchanged content is not falsely reported. |

Conformance requires:

1. A mapping from every `REQ-09-*` to parent capability, implementation owner, evidence revision, and applicable release profile.
2. Headed browser taskflows for slide management, masters/layouts, themes, transitions, notes, property editing, keyboard, file operations, and presentation entry.
3. Native semantic fixtures for tables, charts, diagrams, equations, notes, animation timelines, rehearsal sessions, and recording tracks.
4. Artifact inspection of `.str`, clipboard payloads, media/recording assets, template packages, PPTX, notes/PDF/print, video, and web outputs where applicable.
5. Cross-surface event-log comparison proving one motion sequence in authoring preview, rehearsal, audience runtime, recording, and video export.
6. Negative gates for placeholder-content deletion, global theme leakage, flattened data-object parity, arbitrary notes HTML, unstable animation targets, timing divergence, notes exposure, recording replacement without consent, edition-as-custom-show aliases, copied edition documents, missed source propagation, and wrong-edition launch.

## 18. Non-Goals and Open Boundaries

The following are outside the conformance floor unless promoted by an ADR:

- Pixel-identical ribbon, pane, gallery, or dialog chrome.
- VBA, macros, ActiveX, arbitrary OLE execution, proprietary add-ins, or embedded executable documents.
- Every legacy table formula, chart subtype, diagram layout, equation construct, transition, animation, or sound effect.
- Real-time external data refresh without explicit credentials, snapshot, offline, privacy, and failure policy.
- Treating a screenshot, video, or group of shapes as editable table/chart/diagram/equation parity.
- Automatic camera, microphone, screen, or cloud use without immediate informed consent.
- Making online services or AI necessary for core slide, data, motion, rehearsal, or recording authoring.

Open decisions are controlled by the following defaults. An ADR and published support matrix may expand a tier, but implementation and conformance use the default in force until both are accepted.

| ID | Decision/question | Default in force | Owner | Review trigger | Affected requirements/contracts | Blocking class |
|---|---|---|---|---|---|---|
| `OD-09-001` | Which table formulas and references form the supported baseline? | R1 supports unary `+`/`-`, binary `+`, `-`, `*`, `/`, parentheses, and `SUM`, `AVERAGE`, `MIN`, `MAX`, and `COUNT`, with references limited to cells and ranges in the same table. Cross-table references and all other operators/functions are preserved as unsupported source expressions and are not recalculated. | Presentation Data and Document Architecture | Before implementing formula evaluation or enabling any additional operator, function, or reference scope | `REQ-09-069`, `REQ-09-072`, `REQ-09-077`, `REQ-09-080`, `REQ-09-082`; `R1-WF-13` | `R1-blocking` |
| `OD-09-002` | Which chart families and linked-data connectors are supported? | R1 supports column, bar, line, area, pie, doughnut, scatter, and combo charts backed by an embedded accepted data snapshot. Bubble, radar, statistical/financial families, external connectors, and linked-data refresh are excluded; imported unsupported chart data is preserved and receives a named fallback/report outcome. | Presentation Data, Rendering, and Security | Before implementing the chart gallery/data editor or onboarding an external data connector | `REQ-09-083` through `REQ-09-099`; `R1-WF-13` | `R1-blocking` |
| `OD-09-003` | Which structured diagram layouts and manual overrides are supported? | R1 supports hierarchy, process, cycle, relationship, matrix, list, and timeline layouts. Layout owns generated positions by default; a direct node-position edit creates an explicit stable-node manual override that survives compatible reflow. An incompatible layout change must preview reset, keep where representable, or convert-copy outcomes. | Presentation Structure and Rendering Engineering | Before implementing diagram layout/reflow or adding another diagram family | `REQ-09-100` through `REQ-09-107`; `R1-WF-14` | `R1-blocking` |
| `OD-09-004` | Which equation input syntaxes and handwriting paths are supported by platform? | R1 accepts linear UnicodeMath-compatible input and visual editing for the published included construct matrix. Other syntax is preserved as source and reported rather than guessed. Handwriting conversion is unavailable unless a platform adapter and accuracy/accessibility corpus are separately accepted; it is not required for R1. | Equation Authoring and Accessibility | Before implementing equation parsing or enabling handwriting on any host | `REQ-09-108` through `REQ-09-111`, `REQ-09-118`; `PROFILE-R1-2026-01` Sections 4.2 and 7 | `R1-blocking` |
| `OD-09-005` | Which transitions, effects, and effect-attached sounds are supported? | R1 transitions are None, cross-fade, wipe, push, cover, uncover, and Morph. R1 object motion supports entrance, emphasis, exit, motion-path, and media-cue effects with On Click, With Previous, and After Previous timing. Legacy/custom effects and effect-attached sounds are preservation-only; ordinary authored audio and media cues remain supported. | Motion Authoring and Runtime Engineering | Before implementing the motion gallery/sequencer or adding an effect, transition, or attached-sound type | `REQ-09-131` through `REQ-09-155`; `R1-WF-15` and `R1-WF-16` | `R1-blocking` |
| `OD-09-006` | How much recording editing and camera composition is supported? | R1 requires narration recording, take review/selection, per-slide retake, track mute/delete, and caption editing. Camera and screen recording plus advanced trim, compositing, background, and multi-camera editing remain Preview and cannot count toward R1; when unavailable their controls are absent and accepted source tracks are retained unchanged. | Recording, Media, Privacy, and Accessibility | Before implementing recording review or enabling camera/screen capture for a release profile | `REQ-09-162` through `REQ-09-170`; `R1-WF-16` | `R1-blocking` |
| `OD-09-007` | How do governed template updates relate to independently published components, styles, and libraries? | Creating from or applying an R1 template materializes versioned document-local resources. Any governed dependency is explicit and version-pinned; template, component, style, and variable updates are reviewed independently by stable identity and never cascade merely because another dependency was accepted. Team-library publication/update governance remains Preview. | Template and Library Systems | Before implementing template dependency updates or team-library publication | `REQ-09-051` through `REQ-09-067`; `R1-WF-12` | `pre-implementation` |

None of these boundaries may disable base narratives, audience editions, narrative components, source-update review, or edition-aware runtime/output identity; those are part of the constitutional product model.

Each default is implementable without the future ADR. Unsupported semantics follow preservation-first compatibility behavior and cannot be silently flattened.