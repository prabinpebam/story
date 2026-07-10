# R1 Preview Conformance Profile

> **Profile ID:** `PROFILE-R1-2026-01`
> **Status:** Normative draft
> **Release tier:** `R1-preview`
> **Version:** 1.0.0-draft
> **Owner:** Product and Release Governance
> **Approvers:** Product, Design, Engineering, Quality, Accessibility, Security, Privacy, Operations
> **Last reviewed:** July 10, 2026
> **Specification baseline:** `STORY-SPEC` 2.0.0-draft, Volumes 00-15
> **Purpose:** First coherent external preview profile proving Figma-familiar design authoring, PowerPoint-familiar presentation production and delivery, and Story-native governed audience editions

## 1. Profile Intent

This profile turns the end-state product specification into one executable product slice. It does not redefine, narrow, or mark complete the full Story vision. Requirements excluded from R1 remain accepted end-state scope and stay visible in traceability.

R1 proves one complete promise:

> A design-led team can open or create a presentation, establish a reusable visual and presentation system, produce two governed audience editions without copying the deck, reconcile a shared update, rehearse and present the correct edition, and exchange the work with explicit fidelity and recovery.

R1 is not a miscellaneous collection of available controls. If this workflow cannot be completed end to end, the profile does not conform even when isolated features pass.

## 2. Required Volume Set

Every numbered owner is required for this profile. A volume may contribute only the requirements selected by this profile, but it cannot be absent, contradictory, or unreviewed for those requirements.

| Volume | R1 responsibility |
|---:|---|
| 00 | Governance, identifiers, status, traceability, open decisions, and evidence |
| 01 | Fixed pillars, primary wedge, Story-native model, and benchmark outcomes |
| 02 | Canonical shell, five views, scopes, tools, focus, feedback, and adaptive W1-W3 behavior |
| 03 | Canonical document entities required by the workflows below |
| 04 | Transactions, history, deterministic replay, and local undo semantics |
| 05 | Resolved scene, readiness, editor/runtime/output surface parity |
| 06 | Native files, assets, local checkpoints, safe cloud-provider behavior, and recovery |
| 07 | Two-client editing baseline, presence, comments, editor/viewer sharing, and revocation |
| 08 | Included design-authoring workflows and exact support tiers |
| 09 | Included presentation-authoring and Story System/edition workflows |
| 10 | Preview, Rehearsal, Presentation, and Presenter surface behavior |
| 11 | PPTX preservation intake, clean PPTX subset, PDF, SVG/raster, and compatibility reports |
| 12 | Keyboard, semantic canvas, reading order, alternatives, reduced motion, captions, IME, and accessible outputs |
| 13 | Identity, file/import, active-content, sharing, recording, AI-offline, and telemetry trust boundaries |
| 14 | R1 workloads, latency, memory, readiness, collaboration, recovery, and observability gates |
| 15 | Matrix closure, headed browser rule, artifact inspection, waivers, and release decision |

An empty accepted requirement set, omitted volume, missing trust owner, or missing constitutional pillar is a blocking `missing-specification` finding.

## 3. Supported Environment Profile

### 3.1 Primary Environment

| Dimension | R1 Preview support |
|---|---|
| Operating system | Windows 11, current supported release |
| Browser | Current and previous stable Microsoft Edge and Google Chrome |
| Form factor | Desktop/laptop with hardware keyboard and pointer |
| Window tier | W4 Expansive (`>= 1440` wide and `>= 800` high) and W3 Standard (`1100-1439` wide and `>= 700` high) full authoring; W2 Compact (`760-1099` wide or `560-699` high) full only while the center stage remains at least `480 x 360`; W1 Focused is bounded and not an R1 full-authoring claim |
| Display | One display required; two displays supported for Presenter surface where host allows |
| Input | Mouse, trackpad, keyboard; touch and pen are Preview where host supports them |
| Accessibility | Keyboard-only, Windows high contrast/forced colors, 200% browser zoom, reduced motion, Narrator with Edge, and NVDA with Chrome; other Volume 12 AT cells remain Preview or not-supported as declared |
| Network | Online, offline-after-open, reconnect, provider interruption, and regional-broadband collaboration profile |
| Storage | Local `.str`; OneDrive and Google Drive through verified provider tiers; local recovery checkpoint |
| Language | English UI; authored Unicode, IME, LTR, RTL, and BCP 47 metadata supported by declared content matrix |

### 3.2 Explicitly Not Supported in R1

- Phone authoring.
- Linux or macOS support claims.
- Safari or Firefox support claims.
- Automatic physical-display placement where the browser cannot guarantee it.
- Secure unattended kiosk escape on hosts without an approved host adapter.
- Organization federation, SSO administration, or regulated-data residency claims.
- R3 high-assurance, legal certification, or physical-printer completion claims.

These exclusions are profile boundaries, not product non-goals.

## 4. R1 Capability Tiers

### 4.1 Design Authoring Tier

R1 includes:

- Pan, zoom-to-cursor, fit slide/selection, pasteboard, and stable high-DPI rendering.
- Click, marquee, deep, layer, and keyboard selection.
- Move, resize, rotate, flip, align, distribute, duplicate-drag, numeric transforms, and snapping.
- Rectangle, ellipse, line, arrow, polygon, star, pen-created paths, point/segment/handle editing, open/close/join/reverse, booleans, and clip masks.
- Point, auto-width, auto-height, and fixed-size text; character/paragraph formatting, lists, links, language, direction, IME, text styles, and missing-font diagnostics.
- Horizontal, vertical, and wrapped Auto Layout, nested layout, padding, gap, alignment, distribution, fixed/hug/fill sizing, min/max, absolute children, deterministic line behavior, and parent constraints.
- Components, instances, nested instances, component sets, variant selection, text/boolean/instance-swap properties, overrides, reset, swap, and detach.
- Color, typography, effect, grid, and spacing styles; typed color/number/string/boolean/dimension variables, collections, aliases, and two modes. Team-library publishing is Preview; document libraries are required.
- Ordered solid, linear/radial/angular/diamond gradient, image, video, deterministic code, and approved image-tile/repeat pattern fills; ordered strokes; drop/inner shadow and layer/background blur. Mesh-gradient and arbitrary vector-pattern authoring are excluded from R1. Live code animation remains disabled until the Volume 13 sandbox gate passes; static deterministic code rendering and preservation are required.
- Layer hierarchy, search, rename, visibility, lock, range selection, reorder, reparent, and isolation.
- Portable Story clipboard, editable SVG/Figma clipboard intake by declared tier, SVG export, PNG/JPEG/WebP export, and explicit degradation reporting.

### 4.2 Presentation Authoring Tier

R1 includes:

- Slide create, duplicate, delete, cut/copy/paste, reorder, rename, hide, search, sections, Grid, Outline, Notes, and Canvas views.
- Standard 16:9 and 4:3 plus custom page size; orientation, slide numbering, date/footer, background, and scale-to-fit/maximize preview.
- Multiple masters, layouts, typed title/body/picture/media/chart/table/diagram placeholders, detach/restore/reset, and content-preserving layout reconciliation.
- Presentation themes for color, typography, effects, spacing, and backgrounds; template preview, create-from-template, save-as-template, and apply-with-reconciliation.
- Native tables with rows/columns, range selection, merge/split, sizing, borders/fills/text, header semantics, banding, and paste. R1 formula tier is arithmetic, `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, and same-table cell/range references; no cross-table references.
- Native charts for column, bar, line, area, pie, doughnut, scatter, bubble, radar, combo, histogram, and box-and-whisker; embedded data editor, axes, legends, labels, theme styling, and accessible summaries. Linked external data refresh is excluded.
- Structured hierarchy, process, cycle, relationship, matrix, pyramid, list, and timeline diagrams; conversion to shapes is explicit and preserves provenance.
- Images, SVG, audio, and video as first-class objects; trim, poster, captions, volume, loop, autoplay/click, replacement, and declared fallbacks. Embedded live web content is excluded from R1.
- Structured speaker notes, notes search, Presenter rendering, and notes-page PDF/print preview.
- None, cross-fade, wipe, push, cover, uncover, and Morph transitions.
- Entrance, emphasis, exit, motion-path, media-cue, and state-change animation; On Click, With Previous, After Previous, media/bookmark, and object-trigger starts; delay, duration, easing, direction, amount, repeat, auto-reverse, sound/after-effect policy, reorder, grouping, preview, copy, and unresolved-target repair.
- Rehearsal timings and review. Narration and camera recording are required; screen recording and advanced recording editing are Preview.

### 4.3 Story-Native Tier

R1 requires:

- Adopt an existing presentation into a Story System without visual mutation.
- Define one base narrative with stable semantic roles.
- Create at least two audience editions over shared source content.
- Include, exclude, reorder, substitute, and select variable modes per edition.
- Create at least one narrative component with semantic slots, visual mapping, notes, motion, and accessibility defaults.
- Display inherited, overridden, conflicted, orphaned, blocked, and detached states.
- Propagate one compatible source update while preserving an intentional edition override.
- Reconcile one incompatible source update through explicit source-versus-edition actions.
- Generate a deterministic edition-resolution hash.
- Bind runtime admission and every presentation-level artifact to the selected base or edition.
- Prohibit custom-show aliases and copied presentation roots from satisfying edition conformance.

### 4.4 Collaboration and Review Tier

R1 includes:

- Editor and viewer roles; commenter role for comment operations.
- Two simultaneous editing clients plus additional presence-only viewers.
- Presence, cursors, selections, typed operation acceptance, local pending state, reconnect, deterministic convergence, and local undo that preserves remote work.
- Slide, object, and text-range comments; replies, mentions, resolve/reopen, filtering, navigation, orphan handling, and notification retry.
- Direct invite, revocable link sharing, access review, role change, and revocation.
- Offline local queue and explicit fork/copy/discard after incompatible epoch change.

Organization groups, co-owner transfer, regional multi-writer failover, audience Q&A/polls/reactions, and advanced audit administration are excluded from R1.

### 4.5 Runtime Tier

R1 includes:

- Preview, Rehearsal, and Presentation modes. Recording mode includes narration; Kiosk is Preview.
- Audience and Presenter surface roles; fullscreen, windowed, embedded-preview, and explicit external-display placement.
- Start from beginning, current, selected, named custom show, or selected audience edition.
- Linear slide/build navigation, first/last, numeric jump, grid, back stack, hidden-slide policy, custom-show order, and links.
- Black/white screen, laser, transient ink, zoom, captions, media control, and help.
- Immutable runtime admission snapshot; mutable session state; privacy-safe recovery checkpoint.
- Required-resource preflight, stable last frame, declared fallback, audience-window reopen, role privacy barrier, and editor restoration.
- Reduced-motion behavior preserving content and build count.

Phone remote, network audience services, automated secure kiosk, live translation, and saved ink synchronization are excluded from R1.

### 4.6 Interchange and Output Tier

R1 includes:

- Safe PPTX/OPC intake with source preservation, unknown-part inventory, active-content quarantine, and per-feature fidelity reporting.
- Editable mapping for supported slides, masters, layouts, themes, text, basic shapes/groups, images, tables, included charts, notes, common transitions, and included animations.
- Preservation-only handling for unsupported OOXML parts and features.
- Clean PPTX export for the included mapping subset; unsupported features block or use explicit accepted fallback.
- Deck PDF, slide/notes-page print plan, SVG, PNG/JPEG/WebP, and portable web output.
- Video output is Preview and does not count toward R1 conformance.
- Compatibility reports classify preservation, editability, appearance, behavior, accessibility, and security independently.
- Every presentation-level artifact records base/edition identity and resolution hash.

## 5. Required End-to-End Workflows

Each workflow has a stable profile ID. Workflow conformance requires the functional path, undo/history where applicable, native save/reopen, accessibility, failure/recovery, and artifact or multi-client evidence named below.

| ID | Workflow | Required terminal outcome |
|---|---|---|
| `R1-WF-01` | Create from blank and save locally | Reopened `.str` is semantically equivalent and visually conforming. |
| `R1-WF-02` | Open, edit, autosave, crash, and recover | Latest acknowledged local boundary is restored with differences disclosed. |
| `R1-WF-03` | Navigate, select, transform, align, and undo objects | Figma-transfer fixture reaches exact geometry with one transaction per gesture. |
| `R1-WF-04` | Create and edit vector icon with pen/booleans/mask | Editable geometry survives reopen and SVG output. |
| `R1-WF-05` | Author rich multilingual text and styles | Text, selection behavior, IME, language/direction, and output remain correct. |
| `R1-WF-06` | Build responsive card with Auto Layout and constraints | Card resizes across three widths without overlap or detached semantics. |
| `R1-WF-07` | Create component set and edit two instances | Source update propagates while one valid override remains. |
| `R1-WF-08` | Create variables/styles and switch presentation mode | Bound design changes consistently without hard-coded residue. |
| `R1-WF-09` | Build layered fills/strokes/effects/media | Ordered semantics match editor, thumbnail, presentation, and SVG/raster policy. |
| `R1-WF-10` | Organize slides and sections in Grid/Outline | Canonical order, sections, hidden state, selection, and undo remain correct. |
| `R1-WF-11` | Author master, layouts, and typed placeholders | Layout change preserves content and classifies detach/conflict correctly. |
| `R1-WF-12` | Create, save, preview, and apply a theme/template to an existing deck | Mapping preview predicts result, saved template excludes private dependencies, and local overrides survive. |
| `R1-WF-13` | Create/edit native table and chart | Structured data, accessibility, theme, animation target, and output survive reopen. |
| `R1-WF-14` | Create a structured diagram and equation, then convert a diagram copy to shapes | Diagram/equation sources remain semantic and conversion loss is explicit. |
| `R1-WF-15` | Add transition, Morph, and sequenced object builds | Preview, rehearsal, audience runtime, and output event traces agree. |
| `R1-WF-16` | Author notes, rehearse, record narration/camera, accept timings, and present | Presenter sees private notes/timing/recording controls; audience remains clean. |
| `R1-WF-17` | Create a Story System and narrative component from an existing deck | Base narrative/roles and one narrative component are added without visual mutation or slide duplication. |
| `R1-WF-18` | Create executive and customer editions | Both editions resolve from one base and contain at least three legitimate differences. |
| `R1-WF-19` | Propagate and reconcile shared update | Compatible update propagates; incompatible update remains reviewable; override survives. |
| `R1-WF-20` | Present the correct audience edition | Admission, Presenter surface, audience pixels, notes, order, modes, and recovery bind the selected edition. |
| `R1-WF-21` | Two-client edit, comment, reconnect, and local undo | Replicas converge; acknowledged work persists; local undo preserves remote intent. |
| `R1-WF-22` | Share, downgrade, and revoke access | Service enforcement matches UI and revocation blocks new protected actions. |
| `R1-WF-23` | Import preservation PPTX and review compatibility | Source remains unchanged; included semantics edit; unknown content is preserved/reported. |
| `R1-WF-24` | Export edition to PPTX, PDF, and portable web | All artifacts identify the edition; validators and reports match actual fidelity and accessibility policy. |

## 6. Defaults in Force

| Decision | R1 default |
|---|---|
| Canonical document identity | Lowercase UUIDv7 text for authored entities; content-addressed SHA-256 for assets |
| Edition inheritance | Every edition derives directly from one base narrative; edition chaining is forbidden |
| Collaboration algorithm | Algorithm may vary by operation family but must satisfy Volumes 04/07 deterministic operation and convergence corpus; no implementation is accepted without that corpus |
| Durable authority | One fenced server-side accepted-operation authority per document epoch, immutable snapshots, append-only accepted log |
| Save As | Explicit **Move location**, **Create linked fork**, or **Create independent copy**; filename change alone never changes lineage |
| Native package | Immutable copy-on-write revision publication; no in-place append to sole live ZIP |
| Comment storage | Canonical content/anchors in Volume 03; service chronology/subscriptions/notifications in Volume 07 |
| Runtime | Admission snapshot immutable; session state mutable; recovery checkpoint reconstructive |
| Runtime axes | Mode, surface role, placement, timing, and interaction policy remain orthogonal |
| Table formulas | Arithmetic plus `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`; same-table references only |
| Charts | Column, bar, line, area, pie, doughnut, scatter, combo |
| Equations | Linear UnicodeMath-compatible input and visual editing for included construct matrix; unsupported source preserved |
| Presentation theme modes | Two named modes minimum; semantic slots retain meaning across modes |
| PPTX target | Office Open XML Transitional `.pptx`; validated against current supported Microsoft 365 desktop PowerPoint on Windows for the published subset |
| PDF | Tagged PDF when accessible PDF is claimed; otherwise report accessibility degradation explicitly |
| Video | Preview only in R1 |
| AI | Disabled without loss of any R1 workflow; suggestions never auto-commit |

## 7. Profile Exclusions

R1 excludes, without removing from the end-state specification:

- Full team-library publication/update governance.
- General plugin ecosystem and automation API.
- Generic prompt-to-deck generation.
- Mesh gradient authoring and arbitrary pattern editor.
- Vector networks and Illustrator-class path edge cases beyond the included corpus.
- Cross-table formulas, spreadsheet parity, advanced chart/statistical families, and live linked data refresh.
- SmartArt-perfect import/editing, every equation construct, every legacy transition/effect, macros, ActiveX, executable OLE, and add-ins.
- Camera/screen capture as Supported; advanced video editing; HDR/wide-gamut/alpha video.
- Audience links, polls, Q&A, reactions, analytics, live translation, and webinar features.
- Organization federation/groups, enterprise key management, regional active-active collaboration, and regulated-data certification.
- macOS/Linux/mobile full-authoring support claims.
- Keynote, legacy `.ppt`, editable PDF import, and proprietary plugin formats.

Excluded features remain preserved or blocked/reportable at interchange boundaries where source data can contain them.

## 8. R1 Release Gates

R1 can reach Preview only when:

1. All 24 workflows pass on the exact candidate build and profile.
2. Every frozen benchmark task has a functioning semantic validator, the pilot gate passes, and the summative gate passes before any external claim that Figma or PowerPoint users “feel at home.” A Preview may ship before summative completion only when that claim is explicitly suppressed in product and release language.
3. Every included durable workflow has parsed artifact evidence.
4. Every included browser workflow has visible headed evidence; headless Playwright provides zero release credit.
5. The requirement/profile ledger contains every selected atomic requirement and no unreviewed omission.
6. All included parent capabilities identify included, deferred, excluded, and unsupported child outcomes.
7. Volume 13 critical trust boundaries and Volume 12 critical accessibility workflows pass with no waiver.
8. No acknowledged-operation loss, semantic-hash divergence, notes/private-state leak, silent unsupported-content loss, wrong-edition launch/output, or unrecoverable file corruption occurs.
9. Volume 14 hard ceilings/floors pass for Tiny, Small, and Medium; Large is degraded-safe or passing as declared.
10. Active limitations and permitted R1 waivers are visible before user commitment and in the release record.

## 9. Profile Traceability

The editable disposition and workflow mapping is [R1-selection.json](R1-selection.json). The generated [R1 atomic ledger](R1-ledger.md) and [machine-readable ledger](R1-ledger.json) classify all 1,465 atomic requirements and bind all 24 workflows to same-suffix acceptance criteria. The generated profile ledger includes:

- all selected `REQ-*`, `AC-*`, `TEST-*`, fixture, environment, and evidence IDs;
- every R1 workflow and terminal outcome;
- all explicit exclusions and their parent capabilities;
- exact support matrices and defaults;
- open decisions that do not alter R1 behavior because a default is in force;
- release candidate, build, specification, and quality-registry hashes.

The profile is invalid if its selected set is empty, omits a required volume, or claims a capability not represented by at least one required workflow and criterion.
