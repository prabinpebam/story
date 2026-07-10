# Story Product Requirement Status

> **Status:** Evidence ledger  
> **Audit date:** July 10, 2026  
> **Code baseline:** `244df70`  
> **Requirement source:** [Parent Capability Charter](product-spec.md)
> **Atomic specification:** [Story Product Specification System](specification/README.md)
> **Detailed findings:** [Capability Audit](capability-audit.md)

## 1. Status Contract

This ledger is a point-in-time map of the 74 immutable parent capabilities, not a substitute for executable evidence and not a status ledger for the 1,465 atomic v2 requirements. Atomic requirement/profile status must be derived through Volumes 00 and 15.

| Field | Values | Meaning |
|---|---|---|
| Implementation | `missing`, `partial`, `implemented` | Whether the complete requirement has a routed production workflow. `Implemented` is intentionally strict. |
| Verification | `none`, `unit`, `integration`, `headed-e2e`, `artifact`, `manual` | Strongest current evidence found. Multiple values may be listed. |
| Confidence | `high`, `medium`, `low` | Confidence that the classification reflects the current production path. |

A requirement remains `partial` when its core exists but one of its explicit clauses, integrations, or output surfaces is absent. This prevents narrow implementation from being reported as full product parity.

## 2. Summary

| Pillar | Requirements | Implemented | Partial | Missing |
|---|---:|---:|---:|---:|
| Figma-class design (`DES`) | 32 | 0 | 25 | 7 |
| PowerPoint-class presentation (`PRE`) | 30 | 0 | 19 | 11 |
| Unified architecture (`ARC`) | 12 | 0 | 12 | 0 |
| **Total** | **74** | **0** | **56** | **18** |

Zero requirements are marked fully implemented because the product requirements deliberately include cross-surface, persistence, collaboration, accessibility, and fidelity clauses. Story has many verified core implementations; none yet satisfy every clause of the broader requirement. This is a product-level status, not a judgment that the existing work is absent.

## 3. Figma-Class Design Requirements

| ID | Implementation | Verification | Confidence | Current evidence or decisive gap | Next program |
|---|---|---|---|---|---|
| DES-001 | partial | unit, headed-e2e | high | Pan, zoom-to-cursor, fit, and coordinate mapping exist; publish trackpad/pinch and large-pasteboard guarantees. | DSG-101 |
| DES-002 | partial | headed-e2e | medium | Many Figma-familiar shortcuts exist; conflicts and full convention mapping are incomplete. | GOV-002, DSG-102 |
| DES-003 | partial | headed-e2e | medium | Geometry and mode-parity tests exist; realistic frame-time gates are incomplete. | GOV-005, RUN-505 |
| DES-010 | partial | headed-e2e | high | Click, marquee, multi-select, and nested boolean/mask editing exist; keyboard and component-instance traversal do not. | DSG-101 |
| DES-011 | partial | unit, headed-e2e | high | Z-order and rotated-bound hit testing exist; visible fill/stroke/path/clipping semantics are incomplete. | DSG-101 |
| DES-012 | partial | headed-e2e | high | Core transforms and modifiers exist; align/distribute, transform origin, and constraint-aware parity remain. | DSG-102 |
| DES-013 | partial | unit, headed-e2e | high | Many gestures coalesce; one canonical transaction boundary does not yet govern every editor. | TXN-001, TXN-002 |
| DES-020 | partial | unit, headed-e2e | high | Primitive and path geometry exist; complete open/closed/compound authoring is unfinished. | DSG-103 |
| DES-021 | partial | unit, headed-e2e | high | Point/edge/handle editing exists; pen, join, open/close, reverse, scissors, and richer continuity are absent. | DSG-103 |
| DES-022 | partial | unit, headed-e2e | high | Editable booleans and clip masks exist; mask modes and all-surface fidelity are incomplete. | DSG-103, SCN-005 |
| DES-023 | missing | none | high | Paths and segments are primarily addressed by indexes rather than stable collaboration-safe identities. | DOC-003 |
| DES-030 | partial | unit, headed-e2e | high | Point/autosize text exists; complete fixed-size and path/shape text behavior is absent. | DSG-104 |
| DES-031 | partial | unit, headed-e2e | high | Inline formatting, lists, paste, sanitization, and IME modules exist; columns, tabs, direction, language, and OpenType breadth remain. | DSG-104 |
| DES-032 | partial | unit, integration | medium | Font manager, presets, and typography styles exist; variable axes, substitution UX, embedding, and portability remain. | DSG-104, DSG-123 |
| DES-033 | partial | unit, headed-e2e | medium | Text persistence and history have tests, but history architecture and cross-surface/collaboration guarantees are incomplete. | TXN-002, FIL-004 |
| DES-040 | missing | none | high | No object-level Auto Layout model exists. | DSG-110 |
| DES-041 | missing | none | high | No hug/fill/min/max/nested Auto Layout sizing model exists. | DSG-110, DSG-111 |
| DES-042 | missing | none | high | No general parent constraint model exists. | DSG-111 |
| DES-043 | missing | none | high | Slide layouts and columns are not integrated with object Auto Layout. | DSG-113 |
| DES-050 | missing | none | high | No canvas component/instance/variant document model exists. | DSG-120, DSG-121 |
| DES-051 | missing | none | high | No instance override, swap, reset, or detach workflow exists. | DSG-120, DSG-121 |
| DES-052 | partial | unit, headed-e2e | medium | Color and typography reuse exists; effect, grid, spacing, and team libraries are incomplete. | DSG-123 |
| DES-053 | partial | unit | medium | Theme slots and linked properties exist; general typed variables, collections, modes, and aliases do not. | DSG-122 |
| DES-054 | partial | integration, headed-e2e | medium | Theme/master propagation exists; component propagation does not. | DOC-005, DSG-120 |
| DES-060 | partial | unit, headed-e2e | high | Ordered fill/stroke/effect stacks exist; every cross-surface and multi-edit clause is not proven. | DSG-130, SCN-005 |
| DES-061 | partial | unit, headed-e2e | high | Solid, gradient, image, video, and code fills exist; advanced pattern/gradient policy remains. | DSG-130 |
| DES-062 | partial | unit, headed-e2e | high | Crop/fit/fill/tile, filters, and playback fields exist; trim, first-class media, and full lifecycle remain. | DSG-130, PPT-213 |
| DES-063 | partial | unit, headed-e2e | medium | Mixed-state support exists for key inspector areas; it is not universal. | DSG-130 |
| DES-070 | partial | headed-e2e | high | Hierarchy, rename, visibility, locking, reorder, and reparent exist; search, range, isolation, and accessible tree behavior remain. | DSG-131 |
| DES-071 | partial | unit, headed-e2e | high | In-app copy/paste exists; Cut and a portable system representation are incomplete. | DSG-132 |
| DES-072 | partial | unit, headed-e2e | high | Editable Figma/SVG import logic exists behind a test-oriented gate; user fidelity workflow is incomplete. | DSG-133 |
| DES-073 | partial | unit, headed-e2e, artifact | high | SVG paths support many shapes and paints; complete semantic/text/effect fidelity and degradation reporting remain. | DSG-133, SCN-003 |

## 4. PowerPoint-Class Presentation Requirements

| ID | Implementation | Verification | Confidence | Current evidence or decisive gap | Next program |
|---|---|---|---|---|---|
| PRE-001 | partial | unit, headed-e2e | high | Add/duplicate/delete/reorder exist; slide clipboard, sections, search, rename, hide UI, and custom shows are incomplete. | PPT-201 |
| PRE-002 | partial | headed-e2e | medium | Normal, grid, master, notes, and presentation surfaces exist in varying depth; outline and complete view taxonomy do not. | PPT-201 |
| PRE-003 | partial | unit | medium | Slide dimensions exist in data; complete orientation, numbering, header/footer, date, and page setup workflows are absent. | PPT-201 |
| PRE-010 | partial | unit, headed-e2e | high | Master-layout-slide inheritance, overrides, reset/detach/restore, and reconciliation are strong; complete requirement integration remains. | PPT-202 |
| PRE-011 | partial | unit, headed-e2e | high | Text/picture placeholder lifecycles exist; chart/table/diagram/content families and accessibility metadata are incomplete. | PPT-202, PPT-210 through PPT-212 |
| PRE-012 | partial | unit, headed-e2e | high | Color and typography themes exist; effect and spacing governance is incomplete. | DSG-122, DSG-123 |
| PRE-013 | missing | none | high | Presets exist, but no complete template package, gallery, distribution, or save-as-template workflow exists. | PPT-203 |
| PRE-020 | missing | none | high | No native editable table model and renderer exists. | PPT-210 |
| PRE-021 | missing | none | high | No native editable chart model, data editor, and renderer exists. | PPT-211 |
| PRE-022 | missing | none | high | No native structured diagram system exists. | PPT-212 |
| PRE-023 | partial | unit, headed-e2e | high | Images, video fills, and SVG exist; audio, equations, screen recording, and secure embedded web content are absent or incomplete. | PPT-213 |
| PRE-030 | partial | unit, headed-e2e | high | Core transitions, inheritance, readiness, and reduced motion exist; full deterministic output and compatibility breadth remain. | PPT-222 |
| PRE-031 | partial | unit, headed-e2e | medium | Entrance build metadata exists; emphasis, exits, motion paths, media cues, and authoring are incomplete. | PPT-220 |
| PRE-032 | missing | none | high | No complete animation sequencer authoring workflow exists. | PPT-221 |
| PRE-033 | partial | unit, headed-e2e | high | Morph matching and playback exist; stable identity and recording/video parity remain incomplete. | DOC-003, PPT-222 |
| PRE-040 | partial | unit, headed-e2e | high | Structured notes persist and render in Presenter View; search, print, and export remain incomplete. | PPT-223 |
| PRE-041 | partial | unit, headed-e2e | high | Per-slide and total rehearsal timing modules exist; complete review/edit/show-policy UX remains. | PPT-223 |
| PRE-042 | missing | none | high | No integrated narration, camera, pointer/ink, caption, and retake recording workflow exists. | PPT-224 |
| PRE-043 | partial | unit, headed-e2e | high | Current/next, notes, timers, navigation, display swap, and recovery exist; physical display and complete tool parity remain. | RUN-502 |
| PRE-050 | partial | unit, headed-e2e | high | Fullscreen/windowed, current/beginning, presenter, and kiosk foundations exist; selected/custom/recorded modes are incomplete. | RUN-501 |
| PRE-051 | partial | unit, headed-e2e | high | Keyboard navigation, grid/back, blank screens, laser, and media behavior exist; remote, ink, zoom, captions, and touch breadth remain. | RUN-503 |
| PRE-052 | partial | unit, headed-e2e | medium | Hidden slide, looping, and autoplay foundations exist; complete visible show settings and narration/timing policy remain. | RUN-501 |
| PRE-053 | missing | none | high | Audience interaction appears only as ideas/checklists, not an accepted product model. | RUN-504 |
| PRE-060 | missing | none | high | Commenter permissions exist, but no anchored comment-thread product exists. | COL-403 |
| PRE-061 | partial | unit | high | Presence, cursor, SignalR, and synchronization modules exist; production multi-client editing and convergence are not integrated. | COL-401, COL-402 |
| PRE-062 | partial | unit, integration | medium | Sharing roles and provider UI exist; complete provider-independent semantics and access lifecycle remain. | COL-404 |
| PRE-070 | missing | none | high | No OOXML parser/writer, preservation layer, compatibility mapping, or golden corpus exists. | OUT-301 through OUT-304 |
| PRE-071 | partial | unit, headed-e2e, artifact | high | Element raster/SVG export and web runtime exist; deck PDF, video, and portable web output are incomplete. | OUT-310 through OUT-312 |
| PRE-072 | missing | none | high | No complete print preview, notes pages, outline, or handout workflow exists. | OUT-310 |
| PRE-073 | missing | none | high | No general compatibility report or preservation guarantee exists. | SCN-003, OUT-303 |

## 5. Unified Architecture Requirements

| ID | Implementation | Verification | Confidence | Current evidence or decisive gap | Next program |
|---|---|---|---|---|---|
| ARC-001 | partial | unit | high | Production state has clear regions, but persisted and runtime concerns are not consistently separated across Store, files, and collaboration. | DOC-001 |
| ARC-002 | partial | unit | high | Shapes, slides, storage, and migrations have schemas; stable identity and validation are not universal. | DOC-002 through DOC-004 |
| ARC-003 | partial | unit, integration, headed-e2e | high | Master/layout/theme resolution exists; variables, components, and a universal resolved scene do not. | DOC-005, SCN-001 |
| ARC-010 | partial | unit | high | Store handlers cover many mutations; direct, text, collaboration, and file paths do not share one typed boundary. | TXN-001 |
| ARC-011 | partial | unit | high | History and some operation modules exist; universal JSON-safe replay/inversion and coalescing are incomplete. | TXN-002, TXN-003 |
| ARC-012 | partial | unit | high | Collaboration operations and local history both exist in isolation; local undo under integrated remote editing is not proven. | TXN-004, COL-401 |
| ARC-020 | partial | unit, headed-e2e | high | Editor, thumbnails, and presentation share SlideView; export, print, and recording do not share complete scene semantics. | SCN-001, SCN-002 |
| ARC-021 | partial | unit, artifact | medium | Some exporter fallbacks exist; a systematic observable degradation and compatibility contract does not. | SCN-003 |
| ARC-022 | partial | unit, headed-e2e | high | Presentation readiness, prefetch, input buffering, and fallbacks exist; all asset families and output paths are not covered. | SCN-004, RUN-505 |
| ARC-030 | partial | unit | high | ZIP serialization and migrations exist; production master/asset hydration and full semantic round trip are incomplete. | FIL-001 through FIL-004 |
| ARC-031 | partial | unit | high | Autosave, cache, and cross-tab modules exist; they are not integrated into the complete production lifecycle. | FIL-005, COL-405 |
| ARC-032 | partial | unit, artifact | high | `.str` ZIP format code exists; active documentation and end-to-end contract remain inconsistent. | FIL-001, GOV-001 |

## 6. Update Rules

1. Change a status only after identifying the production route and current evidence.
2. Record the revision and audit date whenever this ledger changes.
3. Never upgrade a requirement because a narrower sub-feature passed.
4. `implemented` requires every explicit clause in the product requirement plus the applicable Definition of Done gates.
5. Keep granular test coverage outside this file; link to stable evidence rather than embedding transient pass counts.
6. If evidence becomes stale or the production route changes, downgrade confidence or status until it is reverified.
