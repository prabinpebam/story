# Familiarity and Story-Native Benchmark Protocol

> **Protocol ID:** `BENCH-PRODUCT-001`
> **Canonical test protocol:** `TEST-01-001` (`BENCH-PRODUCT-001` remains a permanent alias)
> **Status:** Normative draft
> **Version:** 1.0.0-draft
> **Owner:** Product Research and Quality
> **Approvers:** Product, Design, Quality, Accessibility, Privacy
> **Last reviewed:** July 10, 2026
> **Applies to:** `SLO-01-001` through `SLO-01-010`, `PROFILE-R1-2026-01`

## 1. Purpose

This protocol freezes the tasks, fixtures, scoring, comparison method, and anti-gaming rules for three claims:

1. A Figma user feels at home performing professional design-authoring work.
2. A PowerPoint user feels at home performing professional presentation-authoring and delivery work.
3. Story materially improves governed multi-audience presentation work rather than merely combining familiar controls.

The benchmark evaluates transfer of knowledge and product outcomes, not pixel resemblance, remembered menu placement, feature count, participant preference, or a scripted demo.

## 2. Cohorts

| Cohort | Qualification | Summative minimum | Comparison product |
|---|---|---:|---|
| Design transfer | Uses Figma at least weekly for 12 months and has built components plus Auto Layout in production work | 12 non-employee participants | Current supported Figma desktop/web product |
| Presentation transfer | Uses PowerPoint at least weekly for 12 months and has authored masters/layouts, charts/tables, animations, notes, and Presenter View | 12 non-employee participants | Current supported Microsoft 365 desktop PowerPoint on Windows |
| Story native | Produces recurring professional presentations; no prior Story System experience required | 12 non-employee participants | Manual duplicate-deck baseline using participant's familiar presentation tool |
| Accessibility | Keyboard-only plus at least 4 participants using representative assistive technology or high-contrast/reduced-motion workflows | Included across cohorts; at least 6 dedicated sessions | Applicable comparison product and Story |

Employees, contributors who implemented the tested workflow, and participants who have seen task solutions are excluded from summative scoring. Pilot sessions may use internal participants but cannot support external claims.

## 3. Fixture Family

All cohorts use `FIX-PRODUCT-MEDIUM-01`, a versioned 24-slide product-launch presentation containing:

- four sections and three layouts under one master family;
- one alternate master/layout family;
- 180 visual elements and 30 nested groups;
- rich text, lists, links, multilingual text, and one IME-authored text run;
- one responsive card component set with three variants and nested instances;
- color, typography, effect, and spacing styles plus two variable modes;
- gradients, image/video fill, masks, booleans, effects, and one editable SVG icon;
- one native table, one column chart, one combo chart, and one process diagram;
- speaker notes on eight slides;
- transitions, Morph pair, and 18 sequenced animation steps;
- accessibility metadata, reading order, captions, and three seeded issues;
- one unsupported-but-preservable PPTX part in the interchange source;
- a base narrative candidate with semantic roles but no accepted Story System metadata;
- executive and customer audience briefs with legitimate differences;
- one compatible shared-source update and one incompatible update;
- one missing-font variant, one offline/provider-interruption variant, and one audience-window failure variant.

The fixture manifest records canonical semantic hash, source artifact hashes, expected rendered references, seeded issues, exact task starting states, and expected terminal states. Fixture content is realistic and meaningful; repeated empty shapes cannot substitute for it.

## 4. Study Controls

1. Each transfer participant completes the task once in the comparison product and once in Story using counterbalanced order.
2. Equivalent starting artifacts are prepared for each product; task semantics are equal even when product mechanics differ.
3. Participants receive a five-minute product orientation covering only document open, global undo, help, and how to end a task. Feature-specific instruction is prohibited.
4. The moderator reads exact task wording and may clarify the goal, not the method.
5. Intervention begins only after the participant explicitly asks for help or makes no meaningful progress for 90 seconds.
6. Think-aloud is optional during timed tasks and required only in retrospective replay to avoid distorting speed.
7. Screen, pointer, keyboard commands, errors, undo/reversals, help use, and terminal artifacts are captured with consent.
8. Every task has an objective semantic terminal-state validator. Moderator judgment cannot override it.
9. Task order is randomized within dependency-safe blocks.
10. A failed prerequisite does not automatically fail later tasks; the harness restores the defined starting checkpoint.

## 5. Figma-Transfer Tasks

| ID | Task | Starting state | Required terminal state | Primary transfer signal |
|---|---|---|---|---|
| `BENCH-FIG-01` | Navigate to the icon area, fit selection, then return to the full slide | Slide open at 50%, no selection | Exact target selected/fit; slide subsequently fit; no geometry change | Pan/zoom/fit knowledge |
| `BENCH-FIG-02` | Select three overlapping objects, deep-select the middle icon, then select it from Layers | Overlapping group fixture | Correct object identity selected by each method | Selection depth and layer sync |
| `BENCH-FIG-03` | Move, duplicate-drag, resize from center, rotate by 15 degrees, align, and distribute a card row | Three-card fixture | Exact expected transforms and order; one undo unit per gesture | Direct manipulation/modifiers |
| `BENCH-FIG-04` | Edit the SVG icon: add one point, make a corner smooth, join an open path, and subtract a circle | Editable icon fixture | Expected path topology and boolean source remain editable | Pen/vector/boolean familiarity |
| `BENCH-FIG-05` | Fix text overflow, apply character and paragraph styles, create a list, and change one language span | Text fixture | Expected content, spans, paragraphs, list, language, sizing | Rich text/typography |
| `BENCH-FIG-06` | Build a responsive horizontal card with padding/gap, hug/fill sizing, one absolute badge, and nested layout | Unstructured card elements | Matches expected layout at 320/480/720 widths without overlap | Auto Layout transfer |
| `BENCH-FIG-07` | Create a component set with default/selected variants and expose text, boolean, and icon-swap properties | Completed card fixture | Two instances use different variants/properties; source remains reusable | Components/variants/properties |
| `BENCH-FIG-08` | Override one instance, update the source component, preserve the override, then reset only that property | Component fixture | Expected propagation/provenance/reset | Instance override model |
| `BENCH-FIG-09` | Create a color variable collection with light/dark modes, alias a semantic token, and switch modes | Theme fixture | All bound objects update; manual override remains | Variables/modes/aliases |
| `BENCH-FIG-10` | Add/reorder/toggle a gradient fill, image fill, stroke, and shadow; multi-edit opacity on three objects | Paint fixture | Ordered stacks and mixed state match expected result | Paint/effect inspector |
| `BENCH-FIG-11` | Reparent a nested layer without changing world position, range-select, isolate, rename, lock, and search | Deep hierarchy fixture | Hierarchy/world transforms/names/states exact | Layers at scale |
| `BENCH-FIG-12` | Paste editable SVG/Figma clipboard content, inspect degradation, modify geometry, and export SVG | Portable clipboard fixture | Editable import and validated SVG artifact; no silent rasterization | Interoperability/editability |

### 5.1 Figma Task Scoring

Each task receives:

- `2` complete: semantic validator passes without moderator intervention;
- `1` assisted: semantic validator passes after one or more interventions;
- `0` failed: validator fails, participant abandons, or output loses required editability.

Record time, first-error time, command-search use, help use, reversals, undo count, scope errors, and confidence. `SLO-01-001` uses unassisted completion and ease thresholds. Task substitution is prohibited without a protocol version change and a new comparison baseline.

## 6. PowerPoint-Transfer Tasks

| ID | Task | Starting state | Required terminal state | Primary transfer signal |
|---|---|---|---|---|
| `BENCH-PPT-01` | Add, duplicate, rename, hide, range-select, reorder, and section slides | Deck organization fixture | Exact canonical order, section membership, names, hidden state | Slide organization |
| `BENCH-PPT-02` | Switch among Canvas, Grid, Outline, and Notes to locate and edit specified content | Mixed content fixture | Correct source edited once; no duplicate text/state | Familiar views |
| `BENCH-PPT-03` | Change slide size from 16:9 to custom and choose scale policy after previewing consequences | Page setup fixture | Expected page dimensions and policy; seeded crop issue disclosed | Page setup/migration |
| `BENCH-PPT-04` | Create a layout with title, body, picture, chart, and footer placeholders and apply it | Master/layout fixture | Typed placeholders resolve; content remains editable | Masters/layouts/placeholders |
| `BENCH-PPT-05` | Change layout, detach one placeholder, restore it, reset another property, and preserve unmatched content | Reconciliation fixture | Exact mappings, detach provenance, no content deletion | Inheritance/reconciliation |
| `BENCH-PPT-06` | Apply a theme and template to existing slides after reviewing mapping and local overrides | Theme/template fixture | Expected resources/mappings; local override preserved | Themes/templates |
| `BENCH-PPT-07` | Create and format a 4x5 table, merge cells, add a formula, mark headers, and animate by row | Table fixture | Structured table, formula result, semantics, stable animation groups | Native tables |
| `BENCH-PPT-08` | Create a combo chart from pasted data, configure axes/labels/theme, add summary, animate by series | Chart fixture | Structured data/chart/accessibility/motion exact | Native charts |
| `BENCH-PPT-09` | Create a process diagram, reorder/promote nodes, switch layout, animate by branch, convert a copy to shapes | Diagram fixture | Source stays structured; copy conversion explicit | Diagrams |
| `BENCH-PPT-10` | Add speaker notes, search notes, and create a notes-page PDF preview | Notes fixture | Notes remain private; search and preview exact | Notes workflow |
| `BENCH-PPT-11` | Apply a transition/Morph pair and sequence entrance/emphasis/exit/media effects using all trigger types | Motion fixture | Timeline and preview event trace exact | Animation sequencer |
| `BENCH-PPT-12` | Rehearse from current slide, pause, accept timings, configure show settings, and launch Presenter View | Runtime fixture | Accepted timings, correct start/edition, private Presenter state | Rehearsal/presentation |
| `BENCH-PPT-13` | Navigate builds/slides, jump through grid/back, use black screen and laser, recover closed audience window | Live runtime fixture | Semantic position and privacy preserved; recovery under target | Presenter confidence |
| `BENCH-PPT-14` | Import PPTX, inspect compatibility, edit supported content, export PPTX and PDF, inspect reports | Interchange fixture | Source preserved; artifacts validated; issues match actual fidelity | PPTX/output familiarity |

### 6.1 PowerPoint Task Scoring

Scoring is identical to Section 5.1. `SLO-01-002` is evaluated over the fixed 14-task set. A participant cannot pass by completing only slide editing while failing masters, data objects, motion, Presenter View, or output.

## 7. Story-Native Differentiation Tasks

These tasks compare Story with a duplicate-and-manually-edit baseline. The baseline uses the participant's familiar presentation tool and two explicit deck copies. The task content and audience briefs are identical.

| ID | Task | Required Story terminal state | Failure conditions |
|---|---|---|---|
| `BENCH-STORY-01` | Adopt the existing deck into a Story System | Base narrative and roles accepted; rendered slides unchanged | Visual mutation, copied root, hidden automatic decisions |
| `BENCH-STORY-02` | Create executive and customer editions | Two editions share one base and contain at least three differences each | Copied presentations, custom-show-only alias, lost provenance |
| `BENCH-STORY-03` | Create one narrative component and use it in both editions | Shared semantic slots/identity with approved visual mappings | Repeated group with no source linkage |
| `BENCH-STORY-04` | Add one intentional customer-edition override | Source, target, scope, provenance, and reset visible | Override indistinguishable from accidental drift |
| `BENCH-STORY-05` | Apply a compatible source update | Both editions update; intentional override survives | Manual duplicate update, override loss, silent divergence |
| `BENCH-STORY-06` | Apply an incompatible source update | Every edition classified; user explicitly reconciles conflict | Silent last-writer, dropped content, automatic retarget |
| `BENCH-STORY-07` | Validate executive edition readiness and launch | Admission binds executive edition/hash; Presenter/audience content exact | Wrong edition, stale hash, private-state leak |
| `BENCH-STORY-08` | Export both editions to PPTX and PDF | Four artifacts identify correct edition and pass actual compatibility validation | Identity leakage, wrong notes/settings, aggregate success hiding failure |

### 7.1 Differentiation Measures

| Measure | Story target | Baseline comparison |
|---|---|---|
| First edition creation | Median <= 7 minutes after base acceptance | Record duplicate/manual time |
| Second edition creation | Median <= 5 minutes and <= 35% of duplicate/manual baseline | `SLO-01-005` |
| Shared compatible update | Median <= 2 minutes to both ready dispositions | Baseline must manually inspect/update two copies |
| Incompatible update | >= 90% correct conflict/orphan classification and override preservation | Baseline measured for missed drift |
| Unintended copies | 0 | Baseline necessarily creates two copies |
| Silent seeded differences lost | 0 | Compare missed or overwritten baseline differences |
| Correct-edition launch/output | >= 95% | Compare wrong-file/wrong-version errors |
| Source/scope prediction | >= 90% correct before commit | `SLO-01-004` |

## 8. Emotional and Confidence Measures

At defined checkpoints, record 7-point responses:

| Checkpoint | Prompt | Target |
|---|---|---|
| After first canvas task | “I could predict what my next action would do.” | Median >= 5.5 |
| After first presentation task | “This behaved like a professional presentation tool I can trust.” | Median >= 5.5 |
| After edition creation | “I understand what is shared and what differs for this audience.” | Median >= 5.5 |
| Before launch | “I know exactly what the audience will see.” | Median >= 6.0 |
| After recovery | “I remained in control when the presentation was interrupted.” | Median >= 5.5 |
| After compatibility review | “I understand what will remain editable and what will change.” | Median >= 5.5 |

The scores supplement objective outcomes and cannot turn a failed semantic task into a pass.

## 9. Anti-Gaming Rules

1. The fixed task set cannot be reduced after seeing results.
2. A task can change only through a versioned protocol revision and re-baselining in the comparison product.
3. Participants cannot be trained on task-specific solutions before summative testing.
4. A visual match does not pass when editability, semantics, accessibility, history, or artifact fidelity fails.
5. A feature label, menu presence, or successful click does not pass a task without the terminal semantic validator.
6. Moderator intervention is recorded and prevents unassisted credit.
7. Time excludes environment setup but includes feature discovery, errors, correction, and compatibility review.
8. Comparison-product tasks use currently supported product versions and equivalent capabilities; unsupported comparison behavior is documented, not scored as user failure.
9. Failed, abandoned, blocked, or wrong-scope outcomes remain in distributions.
10. Outliers can be excluded only for documented environmental invalidation unrelated to product behavior, with the original record retained.
11. Every task includes at least one negative or recovery condition across the study, not only happy-path execution.
12. Raw captures and validators are reviewed before aggregate scores are calculated.

## 10. Pilot and Summative Gates

### 10.1 Pilot Gate

Before external Preview:

- 5 qualified participants per cohort complete the full relevant task set.
- 100% of the 34 frozen tasks have a functioning objective semantic validator and at least one task-relevant negative validator.
- No task has more than 20% invalid runs due to harness ambiguity.
- Every P0 comprehension or wrong-scope defect is corrected and rerun.
- The exact fixture/protocol versions are frozen for summative testing.

Pilot results cannot support external “feels at home” claims.

### 10.2 Summative Gate

- Minimum 12 qualified non-employee participants per cohort.
- `SLO-01-001` through `SLO-01-010` evaluated exactly as written.
- Results reported by task and cohort, not only aggregate.
- Confidence intervals, assistance, abandonment, errors, and environment invalidations disclosed.
- Accessibility sessions reported separately and included in release decision.
- Any task-family failure remains a bounded parity gap even when aggregate completion passes.

## 11. Product Outcome Targets

The first 90 days after R1 external Preview use privacy-safe cohort metrics with explicit denominators:

| ID | Outcome | Cohort and horizon | Target |
|---|---|---|---|
| `OUTCOME-001` | Recurring-family adoption | Preview teams that create >= 2 presentations in 30 days | >= 30% establish one base narrative and one edition |
| `OUTCOME-002` | Edition repeat use | Teams that create a first edition | >= 50% create or deliver a second edition within 30 days |
| `OUTCOME-003` | Source-update leverage | Edition families with a shared-source update | Median update-to-reviewed-ready <= 10 minutes for two editions |
| `OUTCOME-004` | Unintended copy drift | Benchmark plus opted-in diagnostic studies | 0 silent seeded differences; production incidents tracked per 100 edition updates |
| `OUTCOME-005` | Override resolution | Update-review sessions containing conflict/orphan states | >= 90% end in explicit resolved, intentionally deferred, or blocked disposition; no silent winner |
| `OUTCOME-006` | Correct-edition delivery | Opted-in readiness/run diagnostics without content or labels | >= 99.5% admitted runs bind the user-selected edition and resolution hash |
| `OUTCOME-007` | Presentation reliability | R1 runs reaching audience reveal | >= 99.5% no product-caused unrecovered termination; blank/private-frame hard zero |
| `OUTCOME-008` | Compatibility trust | Output jobs with material issues | >= 90% users inspect or act on the report before irreversible F5 loss; 0 undisclosed loss incidents |

If privacy-safe measurement cannot establish a denominator, the metric remains “unknown” and is measured through consented diary/research studies; it is never reported as passing by assumption.

## 12. Evidence Package

Each benchmark run records:

- protocol, fixture, product, comparison-product, and environment versions;
- participant qualification and pseudonymous cohort ID;
- task order and starting checkpoint hashes;
- commands, timings, errors, intervention, help, undo, and terminal validator result;
- visible headed capture where browser-based;
- artifact and semantic-validator reports;
- post-task and checkpoint responses;
- exclusions and invalidation reasons;
- raw and aggregate results with immutable hashes.

Raw participant data follows Volume 13 consent, minimization, access, retention, and deletion policy. Product telemetry is not a substitute for this controlled study.
