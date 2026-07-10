# Volume 11: Interchange and Output

> **Specification ID:** `STORY-SPEC-11`  
> **Volume:** 11 (16 volumes total, 00-15)  
> **Status:** Normative draft  
> **Version:** 2.0.0-draft  
> **Owner:** Product and Engineering  
> **Approvers:** Product, Design, Engineering, Quality, Accessibility, Security, Privacy  
> **Last reviewed:** July 10, 2026  
> **Normative responsibility:** Preservation-first PPTX/OOXML interchange, fidelity classification, compatibility reporting, and native PDF, print, video, web, SVG, raster, and clipboard output
> **Explicit non-ownership:** Canonical authored semantics, scene resolution, presentation authoring, runtime playback, quality budgets, and implementation status
> **Parent specification:** [Story Product Specification System](README.md)  
> **Governed by:** [Volume 00 - Governance and Traceability](00-governance-and-traceability.md)  
> **Supersedes:** Conflicting output, compatibility, and silent-degradation claims in active export and storage specifications where this volume is more precise

## 1. Purpose

This volume defines how Story exchanges and delivers presentations without silent loss. It treats import and export as compatibility systems with durable source preservation, semantic mapping, explicit degradation, preflight, artifact validation, and actionable reports.

The central promise is stronger than "the file opened" or "a download exists." Users must know which content remains natively editable, which content is approximated, which appearance is flattened, which source data is preserved for round trip, and which operation would cause irreversible loss before they cross that boundary.

## 2. Scope and Authority

### 2.1 In scope

- OPC package and PresentationML parsing, relationship traversal, content types, unknown-part preservation, source fingerprints, and safe ZIP/XML handling.
- PPTX import, semantic mapping, preservation envelopes, dirty-scope tracking, export, validation, round trip, and target-profile selection.
- Mapping of slides, sections, masters, layouts, themes, placeholders, text, shapes, groups, paints, effects, tables, charts, diagrams, equations, media, notes, transitions, animation, links, comments, custom shows, recordings, and accessibility metadata.
- Per-feature fidelity tiers and document-level compatibility summaries.
- Compatibility preflight, issue navigation, decisions, waivers, report attachment, and post-export verification.
- Native deck-level PDF, print, video, and web output.
- Native object/selection/slide SVG and raster output.
- Clipboard bundles for Story, SVG, image, rich text, slide, and supported presentation fragments.
- Batch output, presets, naming, overwrite, cancellation, progress, recovery, and artifact validation.

### 2.2 Normative dependencies

| Concern | Normative owner |
|---|---|
| Canonical Story entities, stable IDs, unknown-field policy, and migrations | Volume 03 |
| Import/export transactions, operation history, and deterministic hashes | Volume 04 |
| Resolved scene, surface adapters, geometry/text/media semantics, and degradation descriptors | Volume 05 |
| `.str` package, assets, atomic writes, checkpoints, storage, and recovery | Volume 06 |
| Permissions, comments, identity, sharing, and library ownership | Volume 07 |
| Design semantics and SVG/Figma clipboard import | Volume 08 |
| Presentation structure, native data objects, notes, motion, rehearsal, recording, and accessibility authoring | Volume 09 |
| Deterministic runtime timeline, rendering, clocks, captions, and media playback | Volume 10 |
| Full accessible-artifact, language, bidi, captions, and assistive-technology policy | Volume 12 |
| Package, XML, SVG, embed, link, recording, privacy, and telemetry security | Volume 13 |
| Fidelity tolerances, throughput, capacity, color, font, and media quality targets | Volume 14 |
| Golden corpora, artifact inspection, visual comparison, waivers, and release profiles | Volume 15 |

### 2.3 Adopted domain specifications

The following remain active implementation detail where consistent with this volume:

- [Native `.str` file and storage](../../specs/collaboration/storage/file-format-storage.md)
- [Asset management](../../specs/collaboration/storage/asset-management.md)
- [Shapes serialization and interoperability](../../specs/shapes/19-serialization-and-interop.md)
- [SVG support index](../../specs/slides/svg/00-index.md)
- [Property Inspector export section](../../specs/ui-system/property-inspector-v2/09-export-section.md)
- [Export taskflows](../../automation/eval-loop/taskflows/32-export-system.md)

These documents do not establish implementation completeness. In particular, an enabled format label, a baseline capture, a DOM screenshot, or a file-extension branch is not evidence that the corresponding artifact contract exists.

### 2.4 Supersession

This volume supersedes domain behavior that:

- enables PDF, PPTX, video, web, or clipboard output without a routed artifact implementation;
- treats a canvas screenshot or browser print dialog as the complete output architecture;
- rewrites an imported PPTX from only the Story-visible subset and discards unknown OOXML;
- uses ad hoc XML string replacement instead of package, relationship, and namespace-aware processing;
- claims support when content is rasterized without disclosure;
- records warnings only inside generated SVG metadata while showing unconditional success in the UI;
- continues a batch after failure without returning per-item outcomes and an aggregate report;
- interprets "copy all object properties" as sufficient unknown-feature round-trip preservation;
- uses renderer DOM, transient object URLs, cache paths, or local device fonts as durable artifact truth;
- reports success based only on file existence, nonzero bytes, or MIME type.

## 3. Product Decisions and Bounded Parity

### 3.1 Explicit implementer decisions

1. **Dual representation for imported PPTX.** Story stores an immutable source-package graph plus mapped canonical Story semantics and source mappings. Unsupported source parts do not need to become editable to survive round trip.
2. **Part ownership and dirty scopes.** Each imported semantic mapping names the OOXML parts, relationships, XML nodes, and extension payloads it owns. Editing marks the narrowest safe ownership scope dirty; untouched scopes remain preservation candidates.
3. **Preserve before transform.** Import never rewrites the original source package. Export starts from a preservation copy or an intentionally clean package profile and applies validated changes transactionally.
4. **Structured package APIs.** OPC content types, part URIs, relationships, XML namespaces, alternate content, and extension lists use structured parsers and writers. Regex and raw string replacement are forbidden for semantic OOXML edits.
5. **Feature-level fidelity.** Fidelity is classified per source feature, target feature, surface, and direction. A single document-level score cannot hide one blocked or lossy object.
6. **Loss requires a decision.** A target operation containing `F5-loss` issues is blocked by default. Proceeding requires an explicit scoped choice, preview where possible, and durable report entry.
7. **Native output adapters.** PDF, print, video, web, SVG, and raster consume the resolved scene/timeline directly. They do not scrape editor DOM or take screenshots of UI.
8. **Static outputs choose a semantic state.** PDF, print, SVG, and raster have explicit policies for builds, animation, video, code, embeds, comments, notes, hidden slides, and accessibility metadata.
9. **Deterministic artifacts.** Given the same accepted revision, profile, assets, fonts, environment contract, and clock inputs, semantic output and normalized artifact hashes are reproducible.
10. **Reports describe actual artifacts.** Compatibility issues are generated from the same mapping and rendering decisions used to write the artifact, then verified against the result.
11. **Source data is not executable.** Macros, OLE/ActiveX, scripts, external relationships, embedded packages, and active web content never execute merely because a package is opened or exported.
12. **User-visible choices are format-specific.** A familiar Export, Save As, Print, Copy As, or Publish flow is used, but Story does not copy another product's ribbon, backstage view, or dialog chrome.

### 3.2 Fidelity tiers

Every mapped feature receives one incoming and one outgoing tier:

| Tier | Name | Contract |
|---|---|---|
| `F0` | Native round trip | Semantics, editability, appearance, identity, behavior, and supported source extensions survive the declared round trip without material change. |
| `F1` | Native editable | Story and target both retain equivalent editable semantics; minor normalized serialization or declared rendering tolerance may differ. |
| `F2` | Editable approximation | Content remains editable, but one or more semantics, parameters, identities, or appearance details are substituted and reported. |
| `F3` | Appearance preserved | Declared visual/audio output is preserved through vector, raster, media, or grouped fallback, but original editability or behavior is not available in the target. |
| `F4` | Source preserved | Story cannot fully render or edit the feature, but retains its original package data and relationships for compatible round trip. A safe fallback may be shown. |
| `F5` | Unsupported loss | The selected operation cannot preserve the feature or its source data. The boundary is blocked unless the user explicitly accepts the named loss. |

`F0` is never inferred from visual similarity alone. `F3` is never marketed as editable parity. `F4` requires artifact proof that the source payload remains reachable and correctly related after export.

### 3.3 Bounded parity

| Included floor | Bounded or profile-dependent | Explicit non-goal |
|---|---|---|
| Preservation-first `.pptx` import/export; common editable PresentationML semantics; compatibility report; deck PDF/print/video/web; object/slide SVG/raster/clipboard | Legacy transitions/animations, advanced SmartArt, uncommon charts, embedded workbooks, equations, fonts, recordings, custom XML, signatures, and extension data vary by published fidelity matrix and target Office version | VBA or macro execution; ActiveX/OLE execution; perfect behavior in every Office build; byte-identical rewrites of intentionally changed XML; `.key` support; arbitrary proprietary extensions; claiming compatibility from screenshots alone |

Macro-enabled packages and encrypted packages require separate accepted profiles. Story may preserve them without execution only when the profile explicitly guarantees safe container handling.

## 4. Shared Interchange and Output Model

### 4.1 Preservation envelope

An imported package's preservation envelope contains:

```text
sourceArtifactId, sourceFormat, sourceProfile, sourceHash
immutableSourceBlob or durable source-part store
packageGraph:
  partUri, contentType, bytesHash, compression, relationships, inbound references
mappingGraph:
  source part/node/relationship identity <-> Story semantic identity
ownershipGraph:
  semantic property -> writable part/node scope
dirtyScopes:
  unchanged, semanticallyChanged, structurallyChanged, invalidated, deleted, added
preservationRecords:
  unknown parts, AlternateContent, ext payloads, unsupported relationships
securityRecords:
  active-content classification, external links, quarantine state
compatibilityBaseline:
  import issues, source app/profile, original feature inventory
```

The envelope is document data only to the extent required for future round trip; transient parsed trees, decompressed buffers, preview images, and object URLs are caches.

### 4.2 Output job state machine

`SM-11-001`:

| State | Meaning | Allowed transitions |
|---|---|---|
| `idle` | No job exists | `configuring` |
| `configuring` | Scope, format, profile, options, destination are selected | `analyzing`, `canceled` |
| `analyzing` | Source, dependencies, fidelity, security, and capacity are evaluated | `review-required`, `ready`, `blocked`, `canceled` |
| `review-required` | Nonblocking substitutions or accepted-loss choices need review | `ready`, `configuring`, `canceled` |
| `blocked` | Required resource, security, fidelity, or destination condition prevents output | `analyzing`, `configuring`, `canceled` |
| `ready` | Immutable job plan and report revision exist | `writing`, `canceled` |
| `writing` | Artifact bytes/pages/frames/package are being produced | `validating`, `canceling`, `failed` |
| `canceling` | Writer is stopping at a safe boundary | `canceled`, `failed` |
| `validating` | Structural, semantic, visual, media, and accessibility checks run | `completed`, `completed-with-issues`, `failed` |
| `completed` | Artifact and report pass the selected profile | `idle` |
| `completed-with-issues` | Artifact exists with reviewed or post-write issues | `idle`, `configuring` |
| `failed` | No valid final artifact replaced the destination | `configuring`, `analyzing`, `idle` |
| `canceled` | No partial artifact is presented as final | `idle` |

### 4.3 Compatibility issue state machine

`SM-11-002`: `detected -> located -> proposed -> decided -> applied -> verified`; alternative terminal states are `blocked`, `waived-with-reason`, `preserved-only`, `not-applicable`, and `stale`. A source or option change marks affected decisions stale and forces reanalysis.

### 4.4 Package-part state matrix

| Part state | Imported source | Story edit | Export action | Required evidence |
|---|---|---|---|---|
| Known, untouched | Parsed/mapped | None | Copy source bytes when profile permits | Same hash and relationships |
| Known, property dirty | Parsed/mapped | Owned property changed | Namespace-aware minimal rewrite or canonical part rewrite by declared policy | Semantic mapping + valid package |
| Known, structurally dirty | Parsed/mapped | Add/remove/reorder target | Rewrite owned structure and reconcile relationships/content types | No dangling refs; expected order |
| Unknown, reachable | Opaque | None | Copy bytes, content type, and relationships | Reachability and hash retained |
| Unknown, affected by known deletion | Opaque | Owner deleted | Preserve if safely reachable; otherwise require explicit disposition | Reported disposition |
| Unsafe active content | Quarantined | Never executed | Preserve only in approved profile or remove with explicit loss | Security classification/report |
| Corrupt source part | Preserved when safe | No automatic repair | Quarantine, repair copy, or block according to option | Original retained and repair logged |
| New Story semantic | None | Added | Generate target-native parts or declared fallback | Mapping and fidelity tier |

### 4.5 Output surface matrix

| Semantic | PPTX | PDF | Print | Video | Web | SVG | Raster | Clipboard |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Slides/masters/layouts/themes | Map/preserve | Resolve pages | Resolve pages | Resolve frames | Resolve runtime | Resolve selected scope | Resolve selected scope | Internal + portable flavors |
| Text/fonts | Map/embed/substitute | Live text/embed/subset | Host/printer fonts or flattened by policy | Render glyphs | Package fonts under license | Live/outline policy | Render pixels | Rich text/SVG/PNG/internal |
| Tables/charts/diagrams/equations | Native/map/fallback | Tagged/static | Static | Animate/render | Semantic/player fallback | Native SVG/group/raster policy | Render pixels | Internal + format flavors |
| Animation/transitions/Morph | Map/preserve/report | Static-state policy | Static-state policy | Deterministic execute | Execute in player | Static-state policy | Static-state policy | Internal semantics only unless target supports |
| Media/recordings | Map/embed/link/preserve | Poster/link/transcript policy | Poster/transcript policy | Mix/render | Package/play/fallback | Poster/link policy | Poster/frame policy | Internal/media/image flavors |
| Notes/comments/private data | Map only by explicit profile | Optional notes artifact | Optional notes/handout | Excluded by default | Excluded by default | Excluded | Excluded | Excluded unless explicit notes copy |
| Accessibility | Map/report | Tagged artifact | Spool semantics where available | Captions/audio description policy | Player and DOM semantics | Title/desc/roles | Alt metadata sidecar only where supported | MIME-specific semantics |
| Unknown source data | Preserve/report | Not expressible | Not expressible | Not expressible | Optional inert source attachment only by explicit policy | Metadata cannot substitute preservation | Not expressible | Internal only |

### 4.6 Invariants

| ID | Invariant |
|---|---|
| `INV-11-001` | Import never modifies the user's original source artifact. |
| `INV-11-002` | Every source package part and relationship is classified as mapped, preserved, quarantined, ignored-by-profile, repaired-copy, or loss-blocked. |
| `INV-11-003` | Unknown reachable parts remain byte-preserved when no accepted edit requires their rewrite and the target profile permits them. |
| `INV-11-004` | A known semantic edit cannot silently invalidate or orphan unknown source relationships. |
| `INV-11-005` | Package part URIs are normalized and cannot escape the package namespace. |
| `INV-11-006` | External entities, scripts, macros, OLE/ActiveX, and embedded executables never run during parse, preview, report, or output. |
| `INV-11-007` | Fidelity is recorded per feature, direction, target profile, and artifact revision. |
| `INV-11-008` | `F5` output is blocked unless an authorized user accepts the exact scoped loss. |
| `INV-11-009` | A compatibility report and its artifact share one immutable job-plan revision. |
| `INV-11-010` | A report never claims preservation, editability, accessibility, or behavior that artifact inspection did not verify. |
| `INV-11-011` | Output adapters consume canonical resolved scene/timeline semantics, not editor DOM or screenshots. |
| `INV-11-012` | Output preview and final artifact use the same profile, options, fonts, assets, and semantic state. |
| `INV-11-013` | Static outputs explicitly select build, media, code, embed, and animation state. |
| `INV-11-014` | Private notes, comments, credentials, provider IDs, diagnostics, hidden metadata, and recordings are excluded unless the selected artifact explicitly includes them. |
| `INV-11-015` | A canceled or failed job never replaces a valid destination artifact with a partial artifact. |
| `INV-11-016` | Output cancellation, retry, and batch continuation are idempotent at declared safe boundaries. |
| `INV-11-017` | Exported asset references are content-addressed or otherwise collision-safe and resolve within the artifact policy. |
| `INV-11-018` | Font substitution, outlining, embedding, and omission follow licensing and compatibility policy and are always reported when appearance or editability changes. |
| `INV-11-019` | Deterministic output excludes volatile timestamps, random IDs, ZIP order, and environment metadata from normalized semantic hashes. |
| `INV-11-020` | Artifact success requires structural and semantic validation appropriate to the format, not merely nonzero bytes. |
| `INV-11-021` | Batch output reports each item independently and never hides partial failure behind aggregate success. |
| `INV-11-022` | Clipboard cut deletes source only after the required clipboard representation is confirmed written. |
| `INV-11-023` | Clipboard and exported artifact metadata contains no secret or private source path by default. |
| `INV-11-024` | Temporary files, object URLs, decoded assets, worker state, and printer/video intermediates are released after completion, failure, or cancellation. |
| `INV-11-025` | The native `.str` presentation remains the authoritative editable source after output unless the user explicitly opens an imported artifact as a new source revision. |

## 5. Interchange Jobs, Fidelity, and Common Output Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-11-001` | PRE-073 | Story MUST model every import, export, publish, print, copy-as, and round-trip operation as a versioned job with immutable source revision, scope, profile, options, and destination. | All interchange/output jobs | `AC-11-001` |
| `REQ-11-002` | PRE-073 | Story MUST analyze semantic dependencies, assets, fonts, security, accessibility, fidelity, capacity, and destination capability before writing. | Job preflight | `AC-11-002` |
| `REQ-11-003` | PRE-073 | Story MUST assign `F0` through `F5` per mapped feature and direction using the published target-profile matrix. | Preflight/report | `AC-11-003` |
| `REQ-11-004` | PRE-073 | Story MUST derive document and slide summaries from the complete issue set without allowing aggregate scores to suppress severe items. | Report summary | `AC-11-004` |
| `REQ-11-005` | PRE-073 | Story MUST distinguish preservation, editability, appearance, behavior, accessibility, and security as independent compatibility dimensions. | Preflight/report | `AC-11-005` |
| `REQ-11-006` | PRE-073 | Story MUST let users filter and navigate issues by slide, object, part, feature, tier, severity, dimension, target, and required action. | Compatibility UI | `AC-11-006` |
| `REQ-11-007` | PRE-073 | Story MUST preview every material substitution, flattening, outline, rasterization, omission, crop, timing, or static-state choice before irreversible output. | Preflight/preview | `AC-11-007` |
| `REQ-11-008` | PRE-073 | Story MUST require an explicit scoped decision for every `F5` issue and retain the decision, reason, user, target profile, and source revision. | Preflight/decision | `AC-11-008` |
| `REQ-11-009` | PRE-073 | Story MUST invalidate affected compatibility decisions when source content, dependencies, target profile, options, or environment contract changes. | Job lifecycle | `AC-11-009` |
| `REQ-11-010` | PRE-073 | Story MUST generate the final report from actual writer and validator decisions and reconcile any difference from preflight. | Post-write validation | `AC-11-010` |
| `REQ-11-011` | ARC-020 | Story MUST render every output format from the canonical resolved scene or deterministic timeline at the selected authored revision. | All output adapters | `AC-11-011` |
| `REQ-11-012` | ARC-021 | Story MUST define a format-specific fallback for every canonical scene, timeline, media, data, and accessibility semantic. | Adapter support matrices | `AC-11-012` |
| `REQ-11-013` | ARC-022 | Story MUST resolve all required assets, fonts, linked data snapshots, media frames, captions, and embeds to ready or typed fallback before final writing. | Job preparation | `AC-11-013` |
| `REQ-11-014` | PRE-071 | Story MUST support presentation, custom show, section, slide range, selected slides, current slide, selected objects, and per-object preset scopes only where meaningful to the format. | Output configuration | `AC-11-014` |
| `REQ-11-015` | PRE-071 | Story MUST preserve canonical scope order and identify duplicate custom-show occurrences rather than silently deduplicate them. | Output planning | `AC-11-015` |
| `REQ-11-016` | PRE-071 | Story MUST expose hidden-slide, comments, notes, recordings, captions, metadata, accessibility, and private-data inclusion as explicit format-applicable options. | Output configuration | `AC-11-016` |
| `REQ-11-017` | PRE-071 | Story MUST support named output presets with stable IDs, format/profile/options, scope defaults, and nonsecret destination behavior. | Preset lifecycle | `AC-11-017` |
| `REQ-11-018` | PRE-071 | Story MUST show uniform, mixed, unset, and incompatible states when editing output presets across multiple selected objects. | Inspector/multi-selection | `AC-11-018` |
| `REQ-11-019` | PRE-071 | Story MUST map multi-selection preset rows by stable preset identity or disable unsafe edits when structures differ. | Inspector/history | `AC-11-019` |
| `REQ-11-020` | PRE-071 | Story MUST sanitize filenames, resolve collisions, reserve extensions, apply suffixes, and preview final names before batch writing. | Destination planning | `AC-11-020` |
| `REQ-11-021` | PRE-071 | Story MUST write to a temporary destination and atomically finalize where the host supports it, preserving any existing valid artifact on failure. | Writer/destination | `AC-11-021` |
| `REQ-11-022` | PRE-071 | Story MUST provide progress by semantic unit, bounded cancellation, retry, and per-item status without exposing content in telemetry. | Job progress/recovery | `AC-11-022` |
| `REQ-11-221` | PRE-071 | Every presentation-level output job MUST bind and verify one `SCH-10-001` runtime admission snapshot identity, including base/edition identity, resolution/show-plan hashes, variable modes, locale, readiness fallbacks, accessibility, capability, and privacy profiles. | Output planning and artifact metadata | `AC-11-221` |
| `REQ-11-222` | PRE-073 | Every compatibility report MUST identify whether findings apply to shared base content, an edition directive, an edition-local override, or an output-only policy. | Compatibility report | `AC-11-222` |
| `REQ-11-223` | PRE-071 | Batch output MAY produce multiple audience editions from one source revision only when each artifact and report retains independent edition identity and result. | Batch output | `AC-11-223` |

### 5.1 Job interaction matrix

| State | Primary action | Back/change options | Cancel behavior | Keyboard/accessibility |
|---|---|---|---|---|
| Configuring | Analyze/continue | Change scope/profile/options/destination | Close with no job | Labeled controls, dependencies, errors, preset actions |
| Analyzing | Wait | View emerging issues if stable | Cancel analysis and release workers | Progress status without focus theft |
| Review required | Resolve and continue | Navigate source, change option/profile | Cancel with decisions retained only if user saves preset/report draft | Issue tree/table, filters, previews, decision controls |
| Blocked | Repair/retry | Change profile/scope or return to source | Cancel | Blocking reason and exact action announced |
| Writing | Wait | No source-option mutation | Request safe-boundary cancellation | Determinate/indeterminate progress and current semantic unit |
| Validating | Wait | Inspect produced temporary artifact issues | Cancel finalization where safe | Validation stage/status announced |
| Completed | Open/reveal/share/report | Repeat with changed options | Close | Artifact path/name, size, report, warnings, next actions |
| Failed/canceled | Retry/change | Inspect private diagnostics/report | Close | Destination integrity and recovery status announced |

## 6. PPTX/OPC Package Intake and Preservation Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-11-023` | PRE-070 | Story MUST detect PPTX/OPC packages by validated container structure and content types rather than filename extension alone. | Import/open | `AC-11-023` |
| `REQ-11-024` | PRE-070 | Story MUST retain the original imported artifact unchanged under its source hash until the user explicitly discards preservation data. | Import/files/recovery | `AC-11-024` |
| `REQ-11-025` | PRE-070 | Story MUST parse ZIP entries with limits for compressed size, expanded size, entry count, ratio, path depth, duplicate names, and total processing budget. | Import/security | `AC-11-025` |
| `REQ-11-026` | PRE-070 | Story MUST reject or quarantine absolute, parent-traversal, device, alternate-stream, malformed, and normalization-colliding part URIs. | Import/security | `AC-11-026` |
| `REQ-11-027` | PRE-070 | Story MUST parse package and part relationship files through OPC-aware URI resolution with stable relationship identity. | Import/package graph | `AC-11-027` |
| `REQ-11-028` | PRE-070 | Story MUST parse default and override content types and preserve unknown declarations needed by retained parts. | Import/package graph | `AC-11-028` |
| `REQ-11-029` | PRE-070 | Story MUST parse XML with namespace awareness while disabling DTDs, external entities, external schemas, and parser-driven network access. | Import/security | `AC-11-029` |
| `REQ-11-030` | PRE-070 | Story MUST retain unrecognized XML elements, attributes, namespace declarations, extension lists, and alternate-content branches in owned preservation scopes. | Import/preservation | `AC-11-030` |
| `REQ-11-031` | PRE-070 | Story MUST inventory every package part, bytes hash, content type, compression, relationship, inbound reference, parser status, and security classification. | Import/report/files | `AC-11-031` |
| `REQ-11-032` | PRE-070 | Story MUST identify unreachable, multiply addressed, missing-target, duplicate-ID, and cyclic relationship anomalies without silently deleting source bytes. | Import/validation | `AC-11-032` |
| `REQ-11-033` | PRE-070 | Story MUST distinguish internal, external, missing, blocked, and malformed relationship targets and apply format/security policy per relationship type. | Import/security/report | `AC-11-033` |
| `REQ-11-034` | PRE-070 | Story MUST preserve unsupported reachable parts with content type and relationships at `F4` when safe round trip is possible. | Import/files/export | `AC-11-034` |
| `REQ-11-035` | PRE-070 | Story MUST quarantine executable, macro, ActiveX, OLE, embedded-package, and suspicious binary parts without executing or previewing active content. | Import/security | `AC-11-035` |
| `REQ-11-036` | PRE-070 | Story MUST block active-content preservation into a `.pptx` profile that would mislabel or invalidate the package and offer an approved alternate disposition. | Export profile/security | `AC-11-036` |
| `REQ-11-037` | PRE-070 | Story MUST detect encrypted or rights-managed packages before ordinary ZIP/XML parsing and route them to a supported unlock, preservation-only, or blocked flow. | Import/security | `AC-11-037` |
| `REQ-11-038` | PRE-070 | Story MUST avoid storing passwords, decryption keys, rights tokens, or plaintext recovered package bytes beyond the accepted security and retention boundary. | Import/security/storage | `AC-11-038` |
| `REQ-11-039` | PRE-070 | Story MUST validate digital-signature presence and report that any semantic rewrite may invalidate signatures before export. | Import/export/report | `AC-11-039` |
| `REQ-11-040` | PRE-070 | Story MUST preserve source application, version hints, compatibility mode, conformance class, and package properties only as metadata with explicit trust level. | Import/report | `AC-11-040` |
| `REQ-11-041` | PRE-070 | Story MUST build stable source identities from part URI, relationship identity, XML semantic identity, and deterministic fallback rather than parser object address. | Import/mapping | `AC-11-041` |
| `REQ-11-042` | PRE-070 | Story MUST map source identities to stable Story entities and retain one-to-many or many-to-one mapping provenance where conversion requires it. | Import/mapping/files | `AC-11-042` |
| `REQ-11-043` | PRE-070 | Story MUST record the exact source nodes, attributes, relationships, and parts owned by each editable Story property. | Import/ownership graph | `AC-11-043` |
| `REQ-11-044` | PRE-070 | Story MUST mark property, collection, part, and package dirty scopes from accepted Story transactions rather than broad document-dirty flags alone. | Editing/export preservation | `AC-11-044` |
| `REQ-11-045` | PRE-070 | Story MUST keep untouched source bytes eligible for direct copy even when unrelated Story content changes. | Export preservation | `AC-11-045` |
| `REQ-11-046` | PRE-070 | Story MUST retain source ordering where semantically relevant and preserve otherwise unknown sibling ordering when rewriting an owned XML scope. | Import/export preservation | `AC-11-046` |
| `REQ-11-047` | PRE-070 | Story MUST canonicalize only generated or intentionally rewritten XML and avoid whole-package normalization that destroys untouched preservation evidence. | Export writer | `AC-11-047` |
| `REQ-11-048` | PRE-070 | Story MUST retain original binary assets and embedded media at source quality unless the user selects an explicit optimization or replacement. | Import/files/export | `AC-11-048` |
| `REQ-11-049` | PRE-070 | Story MUST deduplicate imported assets internally without losing distinct source relationship identities required for round trip. | Import/assets/export | `AC-11-049` |
| `REQ-11-050` | PRE-070 | Story MUST preserve external-link targets as inert reviewed metadata and never fetch them automatically during import analysis. | Import/security/privacy | `AC-11-050` |
| `REQ-11-051` | PRE-070 | Story MUST produce an import report before the user begins editing when source corruption, quarantine, substitution, missing resources, or preservation limits exist. | Import/report | `AC-11-051` |
| `REQ-11-052` | PRE-070 | Story MUST let users open a repair copy, preservation-first copy, read-only inspection, or cancel when recoverable package anomalies exist. | Import/recovery | `AC-11-052` |
| `REQ-11-053` | PRE-070 | Story MUST keep repairs separate from the original source and record every changed part, relationship, ID, and semantic consequence. | Import/recovery/report | `AC-11-053` |
| `REQ-11-054` | PRE-070 | Story MUST support canceling import before commit without leaving partial Story entities, assets, preservation records, or recent-file claims. | Import transaction | `AC-11-054` |
| `REQ-11-055` | PRE-070 | Story MUST commit mapped semantics, preservation envelope, assets, source report, and provenance atomically as a new Story presentation revision. | Import transaction/files | `AC-11-055` |

### 6.1 Package intake flow

`FLOW-11-001`:

1. Read signature and container directory under compressed-data limits.
2. Validate package root, content types, presentation relationship, and path normalization.
3. Build a complete part and relationship inventory without executing active content or fetching external targets.
4. Classify encryption, signatures, macros, embedded binaries, corruption, and unsupported parts.
5. Parse known XML through namespace-aware schemas and retain preservation fragments.
6. Build stable source identities, ownership scopes, and semantic mapping proposals.
7. Resolve embedded assets and fonts under security/licensing policy.
8. Generate feature-level fidelity and import issues.
9. Offer repair/read-only/preservation-first/cancel choices when needed.
10. Commit canonical Story semantics and the preservation envelope atomically.

### 6.2 Package failure matrix

| Condition | Default outcome | User choices | Preservation requirement |
|---|---|---|---|
| Bad extension but valid package | Open with format confirmation | Continue/cancel | Full source |
| Valid ZIP, missing presentation root | Block ordinary import | Inspect/repair copy/cancel | Original bytes |
| ZIP bomb/path traversal | Reject | None beyond secure diagnostics | No unsafe extraction |
| Missing relationship target | Open repair/preservation flow | Keep placeholder, repair mapping, cancel | Relationship record/source bytes |
| Unknown reachable part | Open at `F4` | Keep/discard only through explicit cleanup | Part + content type + relationships |
| Macro/ActiveX/OLE | Quarantine | Preserve in approved profile, remove with loss, cancel | Source part never executes |
| Encrypted package | Block until supported unlock | Unlock/read-only/cancel | No leaked key/plaintext |
| Invalid signature | Report trust failure | Open read-only/continue untrusted/cancel | Signature evidence |
| Parser budget exceeded | Stop safely | Increase approved profile limit/offline conversion/cancel | Original source |
| Corrupt XML in one slide | Isolate slide/part | Repair copy, preserve-only, skip with loss, cancel | Original part and repair log |

## 7. PPTX Semantic Mapping and Round-Trip Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-11-056` | PRE-070 | Story MUST map presentation properties, slide size, slide order, hidden state, sections where represented, custom shows, and document metadata by stable slide identity. | PPTX import/export | `AC-11-056` |
| `REQ-11-057` | PRE-070 | Story MUST map slide masters, layouts, themes, placeholders, inheritance, local overrides, background graphics, and reset semantics without flattening the chain. | PPTX import/export | `AC-11-057` |
| `REQ-11-058` | PRE-070 | Story MUST preserve multiple master families, layout relationships, placeholder roles, and source ordering through supported round trips. | PPTX round trip | `AC-11-058` |
| `REQ-11-059` | PRE-070 | Story MUST map theme colors, font schemes, effect styles, background styles, and compatible extension data with source/local-override provenance. | PPTX import/export | `AC-11-059` |
| `REQ-11-060` | PRE-070 | Story MUST map slide and shape transforms, groups, rotation, flips, coordinate spaces, anchors, and z-order using deterministic unit conversion. | PPTX import/export/render | `AC-11-060` |
| `REQ-11-061` | PRE-070 | Story MUST map preset geometry, freeform paths, connectors, line endpoints, arrows, booleans where expressible, clipping, and source geometry preservation by fidelity tier. | PPTX import/export | `AC-11-061` |
| `REQ-11-062` | PRE-070 | Story MUST map solid, gradient, image, pattern, and supported advanced fills with transparency, transforms, stops, tiling, crop, and theme binding where the target permits. | PPTX import/export | `AC-11-062` |
| `REQ-11-063` | PRE-070 | Story MUST map strokes, joins, caps, dashes, compounds, alignment approximations, arrowheads, opacity, and theme binding with explicit substitution tiers. | PPTX import/export | `AC-11-063` |
| `REQ-11-064` | PRE-070 | Story MUST map opacity, blend, shadow, reflection, glow, soft edge, bevel, blur, and supported effects without silently dropping unsupported parameters. | PPTX import/export | `AC-11-064` |
| `REQ-11-065` | PRE-070 | Story MUST map text bodies, paragraphs, runs, fields, line breaks, tabs, lists, levels, spacing, alignment, columns, direction, language, and vertical anchoring. | PPTX import/export | `AC-11-065` |
| `REQ-11-066` | PRE-070 | Story MUST map font family, theme font, face, size, weight, style, decoration, baseline, case, spacing, kerning, OpenType support tier, and fallback metadata. | PPTX import/export/fonts | `AC-11-066` |
| `REQ-11-067` | PRE-070 | Story MUST preserve requested font identity and report substitution, embedding restriction, outline conversion, and metric-driven reflow per affected text range. | PPTX import/export/report | `AC-11-067` |
| `REQ-11-068` | PRE-070 | Story MUST map images with original asset, crop, transparency, rotation, recolor/filter support tier, compression intent, alternative text, and source relationship. | PPTX import/export | `AC-11-068` |
| `REQ-11-069` | PRE-070 | Story MUST map native tables with stable cells, spans, rows, columns, text, borders, fills, sizing, style options, headers, and accessibility metadata. | PPTX import/export | `AC-11-069` |
| `REQ-11-070` | PRE-070 | Story MUST map native charts with chart type, series, categories, points, axes, labels, legends, styles, formulas, caches, and embedded-data provenance by published tier. | PPTX import/export | `AC-11-070` |
| `REQ-11-071` | PRE-070 | Story MUST preserve embedded chart workbooks or external data relationships when Story edits only mapped chart semantics and safe rewrite is possible. | PPTX round trip | `AC-11-071` |
| `REQ-11-072` | PRE-070 | Story MUST map structured diagrams where supported and otherwise preserve source diagram parts with an editable or visual fallback and explicit tier. | PPTX import/export | `AC-11-072` |
| `REQ-11-073` | PRE-070 | Story MUST map equations between supported semantic representations while preserving unsupported source equation markup and fallback appearance. | PPTX import/export | `AC-11-073` |
| `REQ-11-074` | PRE-070 | Story MUST map SVG, icons, symbols, and vector images using native parts where target profiles support them and declared vector/raster fallbacks otherwise. | PPTX import/export | `AC-11-074` |
| `REQ-11-075` | PRE-070 | Story MUST map audio, video, posters, trim, volume, loop, autoplay, bookmarks, captions, narration, and media relationships by target capability. | PPTX import/export | `AC-11-075` |
| `REQ-11-076` | PRE-070 | Story MUST map speaker notes, notes masters, notes-page fields, links, language, and safe rich text without exposing notes to audience artifacts. | PPTX import/export | `AC-11-076` |
| `REQ-11-077` | PRE-070 | Story MUST map comments, authors, replies, anchors, status, and modern/legacy comment representations only through the permissions and review contracts in Volume 07. | PPTX import/export/collaboration | `AC-11-077` |
| `REQ-11-078` | PRE-070 | Story MUST map hyperlinks and actions to slides, custom shows, URLs, files, email, media, and approved commands with trust and broken-target reporting. | PPTX import/export/runtime | `AC-11-078` |
| `REQ-11-079` | PRE-070 | Story MUST map slide transitions, direction, duration, advance, sound policy, and Morph identity by published target-version support. | PPTX import/export/runtime | `AC-11-079` |
| `REQ-11-080` | PRE-070 | Story MUST map object animation sequence, stable targets, build groups, trigger type, delay, duration, repeat, effect parameters, motion paths, media cues, and unresolved targets by tier. | PPTX import/export/runtime | `AC-11-080` |
| `REQ-11-081` | PRE-070 | Story MUST retain unsupported transition and animation source data at `F4` when a safe round trip is possible even if Story uses a fallback preview. | PPTX import/round trip | `AC-11-081` |
| `REQ-11-082` | PRE-070 | Story MUST map reading order, alternative text, decorative state, language, table headers, chart descriptions, captions, and document accessibility properties by target support. | PPTX import/export/accessibility | `AC-11-082` |
| `REQ-11-083` | PRE-070 | Story MUST map embedded and linked assets through stable package relationships without writing transient file paths, object URLs, cache keys, or credentials. | PPTX export/assets | `AC-11-083` |
| `REQ-11-084` | PRE-070 | Story MUST classify unsupported embedded packages, custom XML, add-in data, controls, signatures, and proprietary extensions as preserved, quarantined, removed, or blocked per profile. | PPTX import/export/security | `AC-11-084` |
| `REQ-11-085` | PRE-070 | Story MUST let users select a target Office/profile version whose feature matrix controls native mapping, fallback, extension use, and validation. | PPTX export configuration | `AC-11-085` |
| `REQ-11-086` | PRE-070 | Story MUST support preservation-first round trip from the imported package and clean compatible export from canonical Story semantics as distinct export modes. | PPTX export configuration | `AC-11-086` |
| `REQ-11-087` | PRE-070 | Story MUST copy eligible untouched source parts and relationships without reparsing or reserializing their payload bytes. | PPTX preservation export | `AC-11-087` |
| `REQ-11-088` | PRE-070 | Story MUST rewrite dirty known scopes with namespace-aware writers while preserving allowed unknown siblings and extension payloads. | PPTX writer | `AC-11-088` |
| `REQ-11-089` | PRE-070 | Story MUST create new parts, relationship IDs, shape IDs, and package names deterministically without colliding with preserved source identities. | PPTX writer | `AC-11-089` |
| `REQ-11-090` | PRE-070 | Story MUST update content types, relationships, presentation lists, slide IDs, master/layout IDs, notes, comments, and asset references atomically when structure changes. | PPTX writer | `AC-11-090` |
| `REQ-11-091` | PRE-070 | Story MUST remove known source parts only when the corresponding semantic deletion is accepted and all inbound relationships and preservation dependencies are reconciled. | PPTX writer | `AC-11-091` |
| `REQ-11-092` | PRE-070 | Story MUST preserve unknown parts affected by deletion when safely possible or block/report their loss when dependency semantics are unknown. | PPTX writer/report | `AC-11-092` |
| `REQ-11-093` | PRE-070 | Story MUST preserve source extension data inside a rewritten known scope only when the edit does not make that extension semantically stale or unsafe. | PPTX writer/report | `AC-11-093` |
| `REQ-11-094` | PRE-070 | Story MUST mark invalidated extension or signature data as stale and require preserve, remove, or blocked disposition according to profile. | PPTX writer/report | `AC-11-094` |
| `REQ-11-095` | PRE-070 | Story MUST validate output ZIP integrity, content types, part naming, relationships, required roots, XML well-formedness, IDs, references, and target-profile rules before finalization. | PPTX validation | `AC-11-095` |
| `REQ-11-096` | PRE-070 | Story MUST reopen the temporary PPTX through the production importer and compare semantic, preservation, and compatibility expectations before reporting success. | PPTX validation/round trip | `AC-11-096` |
| `REQ-11-097` | PRE-070 | Story MUST compare normalized package graph, mapped semantics, preserved-part hashes, visual fixtures, and behavior traces against the job plan. | PPTX validation/evidence | `AC-11-097` |
| `REQ-11-098` | PRE-070 | Story MUST attach or colocate a machine-readable compatibility report without altering the PPTX in a way that reduces compatibility unless the user chooses embedded metadata. | PPTX output/report | `AC-11-098` |
| `REQ-11-099` | PRE-070 | Story MUST preserve the Story source presentation independently from the exported PPTX and never make a lossy target package the only recovery source. | Files/output/recovery | `AC-11-099` |
| `REQ-11-100` | PRE-070 | Story MUST support reimporting an exported PPTX as a comparison or new revision without silently replacing the current Story source. | Import/versioning | `AC-11-100` |

### 7.1 PPTX fidelity mapping matrix

| Feature condition | Import default | Story editability | Preservation-first export | Clean export |
|---|---|---|---|---|
| Direct native equivalent | `F0/F1` semantic mapping | Full declared editability | Rewrite only dirty owned scope | Generate target-native semantic |
| Compatible but parameter mismatch | `F2` mapping and issue | Editable approximation | Preserve source until affected edit; then write approximation | Write approximation |
| Visual effect without target semantic | `F3` visual fallback plus source mapping | Fallback editable as image/vector as declared | Preserve original effect data if unaffected | Flatten with report |
| Unsupported safe source feature | `F4` preserved part plus safe fallback | Inspect/source-preserved only | Copy untouched source | Omit only with `F5` acceptance or package attachment policy |
| Unsafe executable source | Quarantine | No execution/edit | Preserve only in approved safe profile | Remove/block with report |
| Story-only semantic | Native Story | Full | Add target native/fallback | Add target native/fallback |
| No preservation or fallback possible | `F5` | Source remains in original artifact | Block unless accepted loss | Block unless accepted loss |

### 7.2 Preservation-first export flow

`FLOW-11-002`:

1. Lock the accepted Story revision, source package hash, target profile, and preservation mode.
2. Recompute ownership and dirty scopes from accepted transactions.
3. Classify each source part and Story semantic by target fidelity and security disposition.
4. Review all stale extensions, signature effects, quarantined content, substitutions, and `F5` loss.
5. Clone the source package graph into a temporary writer.
6. Copy untouched eligible parts byte-preserved.
7. Rewrite dirty scopes and generate new target-native parts deterministically.
8. Reconcile relationships, content types, IDs, ordering, and unreachable parts.
9. Validate package and reopen through production import.
10. Compare semantics, preserved hashes, visuals, behavior, and report decisions.
11. Atomically finalize the artifact and immutable report.

## 8. Compatibility Report Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-11-101` | PRE-073 | Story MUST give every compatibility issue a stable ID, source identity, target profile, direction, dimension, tier, severity, location, disposition, and evidence status. | Report model | `AC-11-101` |
| `REQ-11-102` | PRE-073 | Story MUST summarize issues by presentation, slide, object, feature family, package part, fidelity tier, and blocking status. | Report UI/artifact | `AC-11-102` |
| `REQ-11-103` | PRE-073 | Story MUST distinguish imported-source limitations, Story editing changes, target-format limitations, missing dependencies, security removals, and post-write validation failures. | Report model/UI | `AC-11-103` |
| `REQ-11-104` | PRE-073 | Story MUST locate an issue on the authoring canvas, slide, notes, sequencer, data editor, source package part, or output preview when that surface exists. | Report navigation | `AC-11-104` |
| `REQ-11-105` | PRE-073 | Story MUST show expected source, Story, and target outcomes side by side or through an equivalent accessible comparison for material visual or behavioral changes. | Report preview | `AC-11-105` |
| `REQ-11-106` | PRE-073 | Story MUST propose only deterministic applicable resolutions such as substitute, outline, rasterize, preserve-only, embed, relink, remove, change profile, or cancel. | Report resolution | `AC-11-106` |
| `REQ-11-107` | PRE-073 | Story MUST preview the consequences of a proposed resolution across all affected uses before applying it. | Report resolution/preview | `AC-11-107` |
| `REQ-11-108` | PRE-073 | Story MUST apply a resolution to one issue, one source identity, selected uses, a feature family, or all equivalent issues only through an explicit scope choice. | Report resolution/history | `AC-11-108` |
| `REQ-11-109` | PRE-073 | Story MUST route source-changing resolutions through normal authored transactions with undo, collaboration, save, and reanalysis semantics. | Editor/history/collaboration | `AC-11-109` |
| `REQ-11-110` | PRE-073 | Story MUST keep output-only resolutions inside the immutable job plan and avoid changing the Story source unless requested. | Output job | `AC-11-110` |
| `REQ-11-111` | PRE-073 | Story MUST require a nonempty reason and authorized identity for waived blocking loss, security downgrade, accessibility failure, or unverified preservation. | Report waiver | `AC-11-111` |
| `REQ-11-112` | PRE-073 | Story MUST make waivers target-profile and source-revision specific and never apply them silently to later changed content. | Report waiver lifecycle | `AC-11-112` |
| `REQ-11-113` | PRE-073 | Story MUST include import baseline, source changes, selected options, user decisions, writer outcomes, validator outcomes, environment contract, and artifact hashes in the final report. | Report artifact | `AC-11-113` |
| `REQ-11-114` | PRE-073 | Story MUST provide human-readable and machine-readable report forms with the same issue identities and dispositions. | Report output | `AC-11-114` |
| `REQ-11-115` | PRE-073 | Story MUST keep private notes, slide text, embedded data, filenames, paths, and user identities out of diagnostic summaries unless required and explicitly included. | Report privacy | `AC-11-115` |
| `REQ-11-116` | PRE-073 | Story MUST support keyboard and assistive-technology navigation, filtering, comparison, decision, waiver, and return-to-source workflows. | Report accessibility | `AC-11-116` |
| `REQ-11-117` | PRE-073 | Story MUST mark every issue as preflight-confirmed, writer-confirmed, validator-confirmed, manually verified, waived, or unverified. | Report evidence | `AC-11-117` |
| `REQ-11-118` | PRE-073 | Story MUST prevent a completed-success label when any nonwaived blocking issue, artifact validation failure, or missing required evidence remains. | Job completion/report | `AC-11-118` |

### 8.1 Compatibility report interaction matrix

| Issue state | Available actions | Source mutation | Output mutation | Completion effect |
|---|---|---:|---:|---|
| Informational `F0/F1` | Inspect, hide resolved | No | No | Does not block |
| Substitution `F2` | Preview, accept, change profile, edit source | Optional | Yes | Review required by profile |
| Flattening `F3` | Preview, raster/vector choice, edit source, cancel | Optional | Yes | Explicit acceptance required when editability matters |
| Preservation-only `F4` | Inspect source/fallback, keep, choose clean loss | No by default | Preservation copy | Blocks clean export unless disposition exists |
| Loss `F5` | Repair, change scope/profile, explicit waiver, cancel | Optional | Yes | Blocked by default |
| Security quarantine | Remove, preserve in approved profile, cancel | No execution | Profile-dependent | Blocked until safe disposition |
| Validation failure | Retry, inspect, change option, save diagnostic copy | No | Rebuild | Cannot report success |
| Stale decision | Reanalyze | No | No | Cannot continue on old decision |

## 9. PDF Output Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-11-119` | PRE-071 | Story MUST generate deck-level PDF through a native page writer that consumes resolved scene semantics rather than browser screenshots or editor DOM. | PDF output | `AC-11-119` |
| `REQ-11-120` | PRE-071 | Story MUST support slides, selected slides, ranges, sections, custom shows, notes pages, handout pages where selected, and outline pages as explicit PDF scopes. | PDF configuration | `AC-11-120` |
| `REQ-11-121` | PRE-071 | Story MUST preserve scope order, repeated custom-show occurrences, hidden-slide policy, page labels, and selected numbering policy in PDF pages. | PDF planning/writer | `AC-11-121` |
| `REQ-11-122` | PRE-071 | Story MUST derive PDF page size, orientation, crop, bleed where supported, background, margins, and scaling from the selected page/output profile. | PDF configuration/writer | `AC-11-122` |
| `REQ-11-123` | PRE-071 | Story MUST support tagged accessible PDF as a declared profile with document language, title, reading order, headings, lists, links, alternative text, decorative state, tables, and artifact semantics. | PDF accessibility | `AC-11-123` |
| `REQ-11-124` | PRE-071 | Story MUST report every semantic that cannot be represented in the selected PDF accessibility profile before writing. | PDF preflight/report | `AC-11-124` |
| `REQ-11-125` | PRE-071 | Story MUST embed or subset fonts only when technically available and licensed, otherwise substitute or outline according to an explicit range-level policy. | PDF fonts | `AC-11-125` |
| `REQ-11-126` | PRE-071 | Story MUST preserve searchable/selectable text when the selected font and effect policy permit and report every outlined or rasterized text range. | PDF text | `AC-11-126` |
| `REQ-11-127` | PRE-071 | Story MUST preserve vector geometry, clipping, masks, gradients, images, transparency, blends, and effects natively where supported and flatten only declared unsupported groups. | PDF rendering | `AC-11-127` |
| `REQ-11-128` | PRE-071 | Story MUST select an explicit static state for builds, transitions, object animation, components, video, code, embeds, and live data in PDF. | PDF static-state policy | `AC-11-128` |
| `REQ-11-129` | PRE-071 | Story MUST render video, audio, recording, and animated media as selected posters with optional accessible link or transcript rather than implying playback. | PDF media policy | `AC-11-129` |
| `REQ-11-130` | PRE-071 | Story MUST preserve approved internal and external hyperlinks with sanitized targets, link annotations, and broken-link reporting. | PDF links/security | `AC-11-130` |
| `REQ-11-131` | PRE-071 | Story MUST support document metadata, bookmarks from slides/sections, page labels, initial-view hints, and approved security options under explicit privacy policy. | PDF metadata/navigation | `AC-11-131` |
| `REQ-11-132` | PRE-071 | Story MUST support RGB and other published color profiles with embedded profile intent, transparency-flattening policy, and color-conversion reporting. | PDF color | `AC-11-132` |
| `REQ-11-133` | PRE-071 | Story MUST exclude notes, comments, hidden slides, private metadata, recordings, and compatibility data unless the selected PDF scope/profile includes them. | PDF privacy | `AC-11-133` |
| `REQ-11-134` | PRE-071 | Story MUST preview PDF pages from the same page plan and rendering decisions used by the final writer. | PDF preview | `AC-11-134` |
| `REQ-11-135` | PRE-071 | Story MUST validate page count, page boxes, object bounds, fonts, links, tags, metadata, image resolution, and file structure before finalization. | PDF validation | `AC-11-135` |
| `REQ-11-136` | PRE-071 | Story MUST reopen or inspect the temporary PDF with an independent parser and compare its normalized page/semantic inventory to the job plan. | PDF validation/evidence | `AC-11-136` |
| `REQ-11-137` | PRE-071 | Story MUST produce a PDF compatibility report that identifies each flattened, substituted, outlined, omitted, posterized, inaccessible, or unverified feature. | PDF report | `AC-11-137` |
| `REQ-11-138` | PRE-071 | Story MUST support deterministic PDF generation by normalizing volatile metadata and stable ordering under the selected reproducibility profile. | PDF determinism | `AC-11-138` |
| `REQ-11-139` | PRE-071 | Story MUST expose PDF configuration, preview, issue resolution, progress, cancellation, and completion to keyboard and assistive technology. | PDF accessibility/UI | `AC-11-139` |

### 9.1 PDF static-state matrix

| Dynamic semantic | Choices | Default | Report condition |
|---|---|---|---|
| Click builds | Initial, final, one page per build, selected build | Final semantic state | Any omitted intermediate state or page expansion |
| Transition/Morph | Incoming final, outgoing final, optional transition contact sheet | Incoming final | Motion omitted |
| Video/audio | Poster at authored/selected time, link, transcript attachment where permitted | Authored poster | Poster/link/transcript substitution |
| Code/live data | Deterministic captured frame/snapshot | Authored static fallback or time zero | Capture time/data revision |
| Interactive component/embed | Default/selected state plus optional link | Authored default state | Interaction omitted or link blocked |
| Captions | Visible at selected time, transcript, omitted | Transcript only when explicitly selected | Inclusion and privacy status |

## 10. Print Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-11-140` | PRE-072 | Story MUST build print output from a deterministic print page plan before invoking a host print service or producing a printable artifact. | Print configuration/preview | `AC-11-140` |
| `REQ-11-141` | PRE-072 | Story MUST support full-page slides, notes pages, outline, and configurable handouts with one, two, three, four, six, nine, or published custom arrangements. | Print layouts | `AC-11-141` |
| `REQ-11-142` | PRE-072 | Story MUST support presentation, custom show, section, selected slides, range, current slide, hidden-slide inclusion, and repetition-aware scope. | Print scope | `AC-11-142` |
| `REQ-11-143` | PRE-072 | Story MUST support paper size, orientation, margins, scale-to-fit, frame slides, handout order, notes area, and blank annotation lines where applicable. | Print configuration | `AC-11-143` |
| `REQ-11-144` | PRE-072 | Story MUST support print-specific headers, footers, date, page number, slide number, presentation title, and approved custom fields without mutating slide content. | Print page plan | `AC-11-144` |
| `REQ-11-145` | PRE-072 | Story MUST support color, grayscale, and pure black-and-white modes with format-specific mapping and preview rather than CSS-filter approximation alone. | Print color | `AC-11-145` |
| `REQ-11-146` | PRE-072 | Story MUST apply the same explicit static-state and media-poster policy as PDF unless the print profile overrides it visibly. | Print rendering | `AC-11-146` |
| `REQ-11-147` | PRE-072 | Story MUST preserve notes privacy by showing notes content only in selected notes or approved handout layouts and never in full-slide output. | Print privacy | `AC-11-147` |
| `REQ-11-148` | PRE-072 | Story MUST display print preview page count, page boundaries, clipping, margins, order, headers/footers, and color mode from the final page plan. | Print preview | `AC-11-148` |
| `REQ-11-149` | PRE-072 | Story MUST query host printer capabilities only through a host adapter and distinguish unavailable, unsupported, driver-controlled, and application-controlled options. | Print host integration | `AC-11-149` |
| `REQ-11-150` | PRE-072 | Story MUST pass copies, collation, duplex, tray, quality, and other printer-specific settings only when the host exposes them and leave unsupported controls disabled with explanation. | Print host integration | `AC-11-150` |
| `REQ-11-151` | PRE-072 | Story MUST preserve the configured print job when the host dialog is canceled and avoid reporting cancellation as output failure. | Print lifecycle | `AC-11-151` |
| `REQ-11-152` | PRE-072 | Story MUST detect and report printable-area clipping, missing fonts/assets, low-resolution images, inaccessible notes/outline structure, and host capability conflicts before print. | Print preflight | `AC-11-152` |
| `REQ-11-153` | PRE-072 | Story MUST generate a spool-ready PDF or equivalent immutable page artifact when required so host rendering cannot reinterpret editor DOM. | Print writer | `AC-11-153` |
| `REQ-11-154` | PRE-072 | Story MUST validate generated page count, dimensions, orientation, order, content bounds, and private-data inclusion before invoking the printer. | Print validation | `AC-11-154` |
| `REQ-11-155` | PRE-072 | Story MUST provide keyboard and assistive-technology access to print scope, layout, page setup, color, preview navigation, host options, and cancellation. | Print accessibility/UI | `AC-11-155` |
| `REQ-11-156` | PRE-072 | Story MUST return a private print summary with host acceptance, page count, selected options, issues, and report reference without claiming physical completion the host cannot verify. | Print completion/report | `AC-11-156` |

### 10.1 Print layout matrix

| Layout | Slide image | Notes/outline | Typical orientation | Reading order |
|---|---|---|---|---|
| Full-page slide | One, fit within printable area | None | Match slide/paper policy | Slide semantics |
| Notes page | One slide plus structured notes | Notes included | Usually portrait, configurable | Slide title, image, notes, footer |
| Outline | Optional thumbnails | Eligible outline text | Portrait | Canonical slide/heading order |
| 1/2/4 handout | Grid of slides | Optional header/footer | Auto/configurable | Page order then grid order |
| 3 handout | Three slides plus writing lines | Optional metadata | Portrait | Slide then associated lines |
| 6/9 handout | Dense thumbnail grid | Optional metadata | Auto/configurable | Selected horizontal/vertical fill order |

## 11. Video Output Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-11-157` | PRE-071 | Story MUST render video from the deterministic Volume 10 runtime timeline using an offline or controlled frame clock rather than real-time screen capture by default. | Video output | `AC-11-157` |
| `REQ-11-158` | PRE-071 | Story MUST support presentation, custom show, section, range, and selected-slide scopes with hidden-slide and repetition policy. | Video planning | `AC-11-158` |
| `REQ-11-159` | PRE-071 | Story MUST support recorded, rehearsed, authored per-slide/build, or explicit default timings and identify unmapped or missing timing boundaries. | Video timing | `AC-11-159` |
| `REQ-11-160` | PRE-071 | Story MUST support published container, video codec, audio codec, resolution, aspect, frame rate, quality/bitrate, color, and hardware/software profiles. | Video configuration | `AC-11-160` |
| `REQ-11-161` | PRE-071 | Story MUST sample frames at deterministic rational timestamps and evaluate transitions, builds, Morph, media, code, data, captions, and camera tracks against the same timeline. | Video renderer | `AC-11-161` |
| `REQ-11-162` | PRE-071 | Story MUST render all authored supported transitions and animations or substitute their declared no-motion/static fallback with report entries. | Video renderer/report | `AC-11-162` |
| `REQ-11-163` | PRE-071 | Story MUST decode and composite embedded video and animated media at timeline-correlated playheads with trim, loop, rate, crop, opacity, and blend policy. | Video media rendering | `AC-11-163` |
| `REQ-11-164` | PRE-071 | Story MUST mix narration, media audio, recording audio, and approved sound cues with explicit volume, mute, fade, ducking, channel, sample-rate, and normalization policy. | Video audio rendering | `AC-11-164` |
| `REQ-11-165` | PRE-071 | Story MUST synchronize audio, video, captions, animation, transitions, camera, pointer, and ink to the canonical timeline within published drift tolerance. | Video renderer/validation | `AC-11-165` |
| `REQ-11-166` | PRE-071 | Story MUST support camera tracks as inset, full-frame, cropped, masked, hidden, or omitted according to selected recording composition. | Video camera rendering | `AC-11-166` |
| `REQ-11-167` | PRE-071 | Story MUST support pointer, laser, and ink tracks only when selected and preserve their slide-coordinate mapping across resolution and aspect changes. | Video overlay rendering | `AC-11-167` |
| `REQ-11-168` | PRE-071 | Story MUST support captions as burned-in text, embedded track where container permits, sidecar file, transcript, or omitted with explicit language and style policy. | Video captions | `AC-11-168` |
| `REQ-11-169` | PRE-071 | Story MUST preserve caption text, language, speaker, cue timing, line breaks, and accessibility metadata through the selected caption output. | Video captions/accessibility | `AC-11-169` |
| `REQ-11-170` | PRE-071 | Story MUST render code fills, live data, and embeds from deterministic approved snapshots or authored fallbacks without live network dependence by default. | Video rendering/security | `AC-11-170` |
| `REQ-11-171` | PRE-071 | Story MUST identify missing decoders, unsupported codecs, unavailable frames, corrupt tracks, font fallback, and snapshot failures before encoding. | Video preflight | `AC-11-171` |
| `REQ-11-172` | PRE-071 | Story MUST preview representative frames, motion segments, audio levels, captions, crop, and total duration from the same immutable render plan. | Video preview | `AC-11-172` |
| `REQ-11-173` | PRE-071 | Story MUST estimate output duration, frame count, resolution, file-size range, temporary storage, and required capabilities before writing. | Video preflight/configuration | `AC-11-173` |
| `REQ-11-174` | PRE-071 | Story MUST encode to a temporary artifact with progress by timeline range, bounded cancellation, and recoverable segment checkpoints where the profile supports resume. | Video writer/recovery | `AC-11-174` |
| `REQ-11-175` | PRE-071 | Story MUST avoid presenting a partial container as final and preserve previously valid destination content after encode, mux, or finalization failure. | Video writer/destination | `AC-11-175` |
| `REQ-11-176` | PRE-071 | Story MUST validate container structure, duration, frame count, dimensions, frame rate, audio tracks, caption tracks, key metadata, and decodability. | Video validation | `AC-11-176` |
| `REQ-11-177` | PRE-071 | Story MUST sample visual frames and compare canonical timeline events, audio duration, and caption cues against the render plan. | Video validation/evidence | `AC-11-177` |
| `REQ-11-178` | PRE-071 | Story MUST report every omitted, substituted, static, missing, clipped, desynchronized, inaccessible, or unverified video feature. | Video report | `AC-11-178` |
| `REQ-11-179` | PRE-071 | Story MUST exclude notes, presenter UI, diagnostics, device labels, consent UI, and unselected recordings from video frames and tracks. | Video privacy | `AC-11-179` |
| `REQ-11-180` | PRE-071 | Story MUST expose video configuration, preflight, preview, audio/caption choices, progress, cancellation, retry, and completion to keyboard and assistive technology. | Video accessibility/UI | `AC-11-180` |

### 11.1 Video timing matrix

| Timing source | Slide duration | Build boundaries | Transition overlap | Missing timing |
|---|---|---|---|---|
| Accepted recording | Recording event trace | Recorded stable IDs | Recorded/authored transition | Report and use configured fallback |
| Accepted rehearsal | Accepted slide/build intervals | Accepted stable IDs | Authored transition inside interval policy | Report and use fallback |
| Authored automatic | Authored timeline | Authored triggers/times | Authored transition | Invalid values block |
| Manual default | Configured duration | Even/default or authored automatic effects | Authored transition included/excluded by policy | Use declared default |
| Static per slide | One frame or configured hold | Final/selected build | No motion or static contact | Not applicable |

## 12. Portable Web Output Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-11-181` | PRE-071 | Story MUST publish web output as a versioned portable player package whose runtime consumes exported resolved semantics and normalized timeline data. | Web output | `AC-11-181` |
| `REQ-11-182` | PRE-071 | Story MUST support folder, ZIP, hosted bundle, and bounded single-file profiles with explicit size, browser, origin, and offline constraints. | Web configuration | `AC-11-182` |
| `REQ-11-183` | PRE-071 | Story MUST package or safely reference all required scenes, assets, fonts, media, captions, thumbnails, manifests, and player code with integrity metadata. | Web writer | `AC-11-183` |
| `REQ-11-184` | PRE-071 | Story MUST preserve slide order, custom show, hidden policy, builds, transitions, Morph, links, media, captions, and supported interactions through the web player profile. | Web player | `AC-11-184` |
| `REQ-11-185` | PRE-071 | Story MUST provide responsive fit, fullscreen, windowed, keyboard, pointer, touch, grid, progress, captions, media, and reduced-motion behavior consistent with the exported runtime profile. | Web player | `AC-11-185` |
| `REQ-11-186` | PRE-071 | Story MUST expose semantic slide content, reading order, alternative text, language, tables, chart descriptions, links, controls, focus, and live announcements to browser accessibility APIs. | Web accessibility | `AC-11-186` |
| `REQ-11-187` | PRE-071 | Story MUST exclude speaker notes, presenter diagnostics, comments, credentials, source paths, collaboration tokens, and private recordings from public web bundles by default. | Web privacy | `AC-11-187` |
| `REQ-11-188` | PRE-071 | Story MUST disable analytics, audience tracking, external requests, and third-party services by default and require explicit configured consent for any enabled service. | Web privacy/security | `AC-11-188` |
| `REQ-11-189` | PRE-071 | Story MUST enforce a published content security policy and sanitize SVG, HTML, links, embeds, captions, metadata, and player configuration before packaging. | Web security | `AC-11-189` |
| `REQ-11-190` | PRE-071 | Story MUST sandbox or replace code fills and interactive embeds according to the selected web trust profile without granting implicit network, storage, camera, or microphone access. | Web security/runtime | `AC-11-190` |
| `REQ-11-191` | PRE-071 | Story MUST package fonts only when licensing permits and provide deterministic substitution, outlining, or system-stack fallback otherwise. | Web fonts | `AC-11-191` |
| `REQ-11-192` | PRE-071 | Story MUST support offline playback through content-addressed assets and an optional versioned service worker/cache manifest without trapping users on stale versions. | Web offline | `AC-11-192` |
| `REQ-11-193` | PRE-071 | Story MUST make hosted and local-origin requirements explicit and provide a useful fallback page when browser security prevents direct file execution. | Web deployment | `AC-11-193` |
| `REQ-11-194` | PRE-071 | Story MUST generate deterministic deep links and navigation anchors without exposing private Story entity IDs unless the profile explicitly permits stable public IDs. | Web links/privacy | `AC-11-194` |
| `REQ-11-195` | PRE-071 | Story MUST preserve selected caption tracks, transcripts, poster frames, audio descriptions, and media fallbacks under browser capability detection. | Web media/accessibility | `AC-11-195` |
| `REQ-11-196` | PRE-071 | Story MUST validate bundle manifest, integrity hashes, internal links, asset reachability, CSP, player startup, offline profile, accessibility semantics, and representative playback traces. | Web validation | `AC-11-196` |
| `REQ-11-197` | PRE-071 | Story MUST report unsupported effects, substitutions, external dependencies, browser-profile gaps, font changes, inaccessible semantics, and unverified host behavior. | Web report | `AC-11-197` |
| `REQ-11-198` | PRE-071 | Story MUST expose web profile, privacy, security, offline, font, caption, validation, progress, cancellation, and deployment guidance to keyboard and assistive technology. | Web accessibility/UI | `AC-11-198` |

### 12.1 Web package profiles

| Profile | Assets | Network | Offline | Active content | Typical use |
|---|---|---|---|---|---|
| Self-contained folder | Relative content-addressed files | None required | Yes | Sandboxed approved player only | Local hosting/archive |
| ZIP bundle | Same as folder after extraction | None required | Yes after extraction | Same | Transfer/download |
| Hosted optimized | Hashed chunks and media variants | Host required | Optional cache | Same plus explicitly configured services | Production web delivery |
| Single file | Embedded assets under size limits | None required | Yes | Restricted; large media/embeds may degrade | Small portable preview |
| Static web | Final slide/build states only | None required | Yes | No timeline/interactions | Maximum compatibility/security |

## 13. SVG, Raster, and Clipboard Output Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-11-199` | DES-073 | Story MUST export an object, selection, component, slide, or approved root to SVG from resolved scene semantics with deterministic bounds and viewBox. | SVG output | `AC-11-199` |
| `REQ-11-200` | DES-073 | Story MUST preserve stable visual stacking, groups, transforms, geometry, paths, fill rules, clipping, masks, paint, strokes, effects, opacity, and blend by published SVG tier. | SVG output | `AC-11-200` |
| `REQ-11-201` | DES-073 | Story MUST support live text, outlined text, or dual-source metadata policy with explicit font, editability, accessibility, and portability consequences. | SVG configuration/output | `AC-11-201` |
| `REQ-11-202` | DES-073 | Story MUST embed, package, or explicitly link image/font assets under a selected external-reference and privacy policy. | SVG assets/security | `AC-11-202` |
| `REQ-11-203` | DES-073 | Story MUST render video, animation, code, live data, embeds, tables, charts, diagrams, and equations through declared native SVG, grouped vector, poster, raster, or metadata fallback. | SVG output/report | `AC-11-203` |
| `REQ-11-204` | DES-073 | Story MUST include safe title, description, language, roles, links, and approved metadata while excluding private source paths and executable content. | SVG accessibility/security | `AC-11-204` |
| `REQ-11-205` | DES-073 | Story MUST generate deterministic XML, IDs, definitions, references, ordering, numeric precision, and whitespace under a reproducible SVG profile. | SVG determinism | `AC-11-205` |
| `REQ-11-206` | DES-073 | Story MUST validate SVG well-formedness, reference closure, sanitization, bounds, text policy, assets, accessibility, and representative rendering before completion. | SVG validation | `AC-11-206` |
| `REQ-11-207` | PRE-071 | Story MUST export PNG, JPEG, WebP, and other published raster formats from the canonical resolved scene with format-appropriate transparency and color policy. | Raster output | `AC-11-207` |
| `REQ-11-208` | PRE-071 | Story MUST support multiplier, fixed width, fixed height, exact dimensions, DPI, slide size, geometric bounds, visual bounds, padding, and background options with aspect policy. | Raster configuration | `AC-11-208` |
| `REQ-11-209` | PRE-071 | Story MUST support quality, lossless/lossy, chroma, color profile, metadata, alpha, matte, and image-resolution policy only where the selected raster codec supports them. | Raster configuration/output | `AC-11-209` |
| `REQ-11-210` | PRE-071 | Story MUST handle maximum canvas/encoder dimensions through validated limits, tiled rendering, downscale choice, or blocked output without silent clipping. | Raster writer/recovery | `AC-11-210` |
| `REQ-11-211` | PRE-071 | Story MUST render rotation, flips, nested transforms, strokes, effects, masks, text, media posters, data objects, code snapshots, and static animation state consistently with the resolved scene. | Raster rendering | `AC-11-211` |
| `REQ-11-212` | PRE-071 | Story MUST support batch raster/SVG output per slide, object, selection, or stable preset with collision-safe names and per-item results. | Batch output | `AC-11-212` |
| `REQ-11-213` | DES-071 | Story MUST write a clipboard bundle containing the richest safe Story-internal representation plus applicable SVG, PNG, HTML, rich text, plain text, and presentation-fragment flavors. | Clipboard output | `AC-11-213` |
| `REQ-11-214` | DES-071 | Story MUST order clipboard flavors by editability and target usefulness while allowing recipients to choose only formats they understand. | Clipboard output/interoperability | `AC-11-214` |
| `REQ-11-215` | DES-071 | Story MUST confirm the required clipboard write before deleting source in a cut transaction and leave source unchanged on permission or write failure. | Clipboard/history | `AC-11-215` |
| `REQ-11-216` | DES-071 | Story MUST support Copy as PNG, Copy as SVG, Copy as Text, Copy as Slide, and Copy with Story Editability only when the selected scope can produce that flavor. | Clipboard UI/output | `AC-11-216` |
| `REQ-11-217` | DES-071 | Story MUST strip secrets, local paths, credentials, private comments/notes, diagnostics, and unselected hidden metadata from portable clipboard flavors. | Clipboard privacy | `AC-11-217` |
| `REQ-11-218` | DES-071 | Story MUST enforce clipboard size, item-count, asset, complexity, timeout, and permission limits with a file-export fallback when appropriate. | Clipboard limits/recovery | `AC-11-218` |
| `REQ-11-219` | DES-071 | Story MUST validate written clipboard flavors where the platform permits read-back or use deterministic pre-write artifact validation otherwise. | Clipboard validation | `AC-11-219` |
| `REQ-11-220` | PRE-071 | Story MUST expose SVG, raster, batch, and clipboard scope, format, quality, fidelity, privacy, preview, progress, errors, and completion to keyboard and assistive technology. | Output accessibility/UI | `AC-11-220` |

### 13.1 SVG and raster policy matrix

| Semantic | SVG default | Raster default | Required report |
|---|---|---|---|
| Vector geometry/paint | Native SVG | Pixels | Any unsupported effect/paint flattening |
| Text | Live text when portable profile permits; otherwise explicit outline choice | Pixels | Font substitution/outline |
| Auto Layout/components/variables | Resolved appearance; optional safe Story metadata | Pixels | Loss of reusable semantics |
| Table/chart/diagram/equation | Native/grouped vector when valid, otherwise raster | Pixels | Loss of data/structure/editability |
| Video/recording | Authored poster | Selected frame/poster | Time and playback loss |
| Code/live data/embed | Deterministic snapshot | Deterministic snapshot | Snapshot revision/time and interactivity loss |
| Animation/build | Selected static state | Selected static state | Omitted states/motion |
| Accessibility | Title/desc/roles/links where supported | Sidecar/report only unless codec metadata profile supports more | Unsupported semantics |

### 13.2 Clipboard flow

`FLOW-11-003`:

1. Resolve focus, selected scope, requested Copy/Copy As/Cut command, and permission.
2. Build the internal versioned representation with dependencies and portable privacy filtering.
3. Produce applicable SVG, PNG, HTML, rich text, plain text, slide, and media flavors from the same semantic revision.
4. Validate each flavor and enforce clipboard limits.
5. Write one atomic platform clipboard bundle or use the declared platform fallback.
6. Confirm required flavor success.
7. For Cut only, commit source deletion as one authored transaction.
8. Report omitted or degraded flavors privately without claiming total success when required flavor failed.

## 14. Keyboard and Accessibility Hooks

Volume 12 owns complete accessibility conformance. This volume requires every interchange and output path to expose equivalent nonpointer operation and truthful artifact semantics:

| Surface | Required keyboard workflow | Required accessible state and output |
|---|---|---|
| Import/open | Choose artifact, inspect trust/profile, navigate package findings, select repair/preservation/read-only/cancel, return to source | File type, profile, source hash summary, progress, issue severity, quarantine, repair consequence, completion |
| Compatibility report | Traverse groups and issues, filter, locate source/output, open comparison, choose resolution scope, waive with reason, reanalyze | Stable issue ID, source/target, dimension, tier, severity, disposition, evidence, stale/blocking state |
| PPTX export | Choose preservation/clean mode and target profile, inspect unknown/active/signature dispositions, start/cancel/retry | Source package status, dirty scope, preserved/rewritten/lost parts, validation and round-trip state |
| PDF | Choose scope/profile/static state/fonts/color/privacy/accessibility, navigate page preview, resolve issues, export | Page count/label, tag profile, font state, flattened ranges, media policy, validation result |
| Print | Choose scope/layout/page/color/host options, navigate preview, invoke/cancel host dialog | Page plan, clipping, printable area, host capability, spool acceptance versus physical completion |
| Video | Choose timing/container/codec/quality/audio/camera/captions/privacy, inspect representative preview, cancel/retry | Duration, frame count, tracks, levels, drift, caption form, encoder capability, progress/checkpoints |
| Web | Choose package/trust/offline/privacy/font/caption profile, inspect validation and deployment guidance | Bundle inventory, CSP, external requests, accessibility status, offline/startup result, host requirement |
| SVG/raster | Choose semantic scope, bounds, scale/size, text/assets/static state, quality/color/privacy, preview/batch | Output dimensions/viewBox, alpha/profile, fallback tier, item progress, per-item result |
| Clipboard | Choose Copy As flavor, review unavailable/degraded flavors, retry permission failure | Requested and written MIME flavors, size/permission state, cut safety, portable privacy filtering |
| Progress/completion | Pause where supported, request cancellation, move job to background only explicitly, open/reveal artifact and report | Current semantic unit, completed/remaining work, cancel-pending boundary, destination integrity, final status |

Focus remains on the initiating control while analysis updates unless a blocking issue requires deliberate navigation. Progress announcements are throttled and stage-based; they never narrate every page or frame. Preview canvases and images have names that identify format, scope, page/frame/item, and issue state, with a structured nonvisual equivalent for material comparisons. Color-only fidelity, warning, and completion cues are forbidden.

## 15. Edge and Failure Contracts

| Condition | Required behavior |
|---|---|
| Imported package contains ZIP bomb/path collision | Reject before extraction; preserve no unsafe temporary files |
| Unknown OOXML part is untouched | Preserve bytes, type, and relationships under preservation profile |
| Unknown part depends on deleted known shape | Preserve safely if possible; otherwise block or require exact loss decision |
| Signature exists and any signed scope changes | Mark signature invalidation before export and apply selected profile disposition |
| Macro/OLE/ActiveX exists | Quarantine; never execute; preserve only in approved format/profile or remove with explicit report |
| Font unavailable or embedding forbidden | Preserve requested identity, preview substitute/outline, report affected ranges |
| External link unavailable | Do not fetch during import; preserve inert target or remove by explicit policy |
| Embedded workbook corrupt | Preserve source at `F4`, retain chart fallback/cache, block unsafe rewrite |
| Target version lacks feature | Change profile, editable approximation, appearance fallback, source preservation, or blocked loss per matrix |
| Writer crashes or quota fills | Leave destination unchanged, retain resumable plan/intermediates by policy, offer retry/new destination |
| Batch item fails | Record item failure, continue only if batch policy says so, never label aggregate fully successful |
| Preview differs from final writer plan | Invalidate preview and job plan; reanalyze before writing |
| Post-write validation differs from preflight | Update report, withhold success, offer rebuild or retain diagnostic copy |
| PDF tag generation fails | Fail accessible profile or require explicit nonaccessible profile choice; never silently strip tags |
| Printer dialog canceled | Return to configured job without error or mutation |
| Printer capability changes | Revalidate settings and page plan; do not send stale unsupported options |
| Video decoder/encoder unavailable | Offer supported profile or block; do not silently change container/codec |
| Video media frame missing | Use authored poster/fallback only after report decision; preserve timeline duration policy |
| Web bundle loaded from restricted local origin | Show safe guidance/fallback page; no hidden network workaround |
| Web service worker version stale | Activate versioned update policy without serving mixed asset revisions |
| SVG external resource blocked | Embed, preserve safe link by policy, substitute, or block with report |
| Raster exceeds encoder dimensions | Tile, resize with consent, or block; never crop silently |
| Clipboard permission denied | Keep source intact, offer keyboard/event paste or file export where applicable |
| Clipboard bundle exceeds platform limit | Offer lower-fidelity flavor or file export with exact disclosure |
| User closes job UI during writing | Continue only if explicitly backgrounded; otherwise request safe cancellation and preserve destination |

## 16. Acceptance Criteria

All artifact criteria require structural inspection. Visual similarity alone is insufficient for editable or preserved tiers. Browser workflows use headed Playwright; print hardware, codecs, Office versions, and host integrations follow Volume 15's declared matrix.

### 16.1 Common jobs and package preservation

| ID | Pass condition |
|---|---|
| `AC-11-001` | Every job artifact records immutable source revision, scope, format/profile, options, destination class, and job-plan revision. |
| `AC-11-002` | Preflight finds all seeded semantic/dependency/font/security/accessibility/capacity/destination issues before writing. |
| `AC-11-003` | Fidelity corpus receives the expected per-feature incoming/outgoing `F0` through `F5` tiers. |
| `AC-11-004` | Aggregate summaries retain every severe issue and reconcile exactly to issue rows. |
| `AC-11-005` | Preservation/editability/appearance/behavior/accessibility/security dimensions differ correctly in nondegenerate fixtures. |
| `AC-11-006` | Every report filter and next/previous navigation reaches the correct stable source/output location. |
| `AC-11-007` | Material substitution previews match final geometry, text, timing, media, and accessibility outcomes. |
| `AC-11-008` | `F5` cannot proceed without a scoped recorded decision and can proceed only for that exact revision/profile. |
| `AC-11-009` | Source/option/profile/environment changes mark only affected decisions stale and prevent stale-plan writing. |
| `AC-11-010` | Final report dispositions and counts match actual writer and validator records. |
| `AC-11-011` | Instrumentation proves adapters consume resolved scene/timeline APIs and no editor screenshot/DOM scrape path. |
| `AC-11-012` | Every canonical semantic has a declared native/fallback/block result in each applicable adapter matrix. |
| `AC-11-013` | Required dependency fixtures reach ready or typed fallback before final writing begins. |
| `AC-11-014` | Every meaningful scope outputs exact selected stable entities in canonical order. |
| `AC-11-015` | Repeated custom-show occurrences remain repeated and ordered in applicable artifacts. |
| `AC-11-016` | Hidden/notes/comments/recordings/captions/metadata/accessibility/private options affect only applicable artifact content. |
| `AC-11-017` | Presets round-trip stable IDs/options and contain no secret destination credentials. |
| `AC-11-018` | Multi-selection controls display truthful uniform/mixed/unset/incompatible states. |
| `AC-11-019` | Stable preset rows edit intended targets and structurally mixed rows cannot be unsafely edited. |
| `AC-11-020` | Filename corpus sanitizes reserved/invalid/colliding names and preview equals final names. |
| `AC-11-021` | Fault injection during writing/finalization leaves previous destination bytes unchanged. |
| `AC-11-022` | Progress/cancel/retry/batch status is accurate, bounded, idempotent, and privacy-safe. |
| `AC-11-023` | Valid-package/wrong-extension and fake-PPTX/right-extension fixtures are classified by structure. |
| `AC-11-024` | Imported original artifact hash remains unchanged through editing, failed export, and preservation round trip. |
| `AC-11-025` | ZIP size/count/ratio/path/depth/budget corpus rejects every over-limit package before unsafe expansion. |
| `AC-11-026` | Path traversal, absolute, device, stream, malformed, and normalization-collision entries never escape/quasi-duplicate package paths. |
| `AC-11-027` | Relationship graph resolves valid relative targets and identifies malformed/missing/external targets deterministically. |
| `AC-11-028` | Unknown content-type declarations required by preserved parts remain in round-trip package. |
| `AC-11-029` | DTD/entity/schema/network attack fixtures trigger no external access or entity expansion. |
| `AC-11-030` | Unknown XML/ext/alternate-content fixtures survive untouched-scope round trip with expected hashes/semantics. |
| `AC-11-031` | Part inventory reconciles every ZIP entry, type, hash, relationship, inbound edge, parser state, and security class. |
| `AC-11-032` | Unreachable/multiple/missing/duplicate/cyclic anomalies are all reported and source bytes retained as policy declares. |
| `AC-11-033` | Relationship classifications and policy actions match internal/external/missing/blocked/malformed fixtures. |
| `AC-11-034` | Unsupported reachable part corpus reexports byte-identical payloads with valid content types and relationships. |
| `AC-11-035` | Macro/ActiveX/OLE/embedded/suspicious fixtures execute no active behavior and remain quarantined. |
| `AC-11-036` | Incompatible active-content profile blocks or uses the explicitly selected safe alternate disposition. |
| `AC-11-037` | Encrypted/rights-managed fixtures are detected before ordinary parsing and follow unlock/preserve/block policy. |
| `AC-11-038` | Memory/storage/log scans find no retained password, key, rights token, or out-of-policy plaintext package. |
| `AC-11-039` | Signature fixtures report exact signed-scope invalidation before any semantic rewrite. |
| `AC-11-040` | Source-app/version/conformance properties are retained with trust status and never treated as executable truth. |
| `AC-11-041` | Stable source identities reproduce across repeated parses and do not depend on object address/order accidents. |
| `AC-11-042` | One-to-one, one-to-many, and many-to-one mappings retain complete provenance through round trip. |
| `AC-11-043` | Every mapped editable property resolves to exact owned source nodes/attributes/relationships/parts. |
| `AC-11-044` | Representative edits mark only expected property/collection/part/package dirty scopes. |
| `AC-11-045` | Unrelated edits leave untouched preserved-part hashes identical. |
| `AC-11-046` | Semantically relevant and unknown sibling ordering remains correct after owned-scope rewrites. |
| `AC-11-047` | Untouched XML bytes remain unchanged while generated/rewritten XML meets canonical writer policy. |
| `AC-11-048` | Original binary/media hashes survive import/export unless explicit optimization/replacement was selected. |
| `AC-11-049` | Internal asset dedup retains distinct source relationship identities and valid exported references. |
| `AC-11-050` | External-link corpus causes no import-time fetch and retains inert reviewed targets as selected. |
| `AC-11-051` | Import report appears before editable commit for all seeded corruption/quarantine/substitution/missing/preservation issues. |
| `AC-11-052` | Repair/preservation/read-only/cancel choices produce their exact previewed document and source state. |
| `AC-11-053` | Repair log lists every changed part/relationship/ID/semantic and original remains intact. |
| `AC-11-054` | Canceled import leaves no entities, assets, preservation records, or false recent-file entry. |
| `AC-11-055` | Successful import commits semantics/envelope/assets/report/provenance together and undo/open behavior follows source policy. |

### 16.2 PPTX semantic mapping and round trip

| ID | Pass condition |
|---|---|
| `AC-11-056` | Presentation properties/order/hidden/sections/custom shows/metadata map by stable slide identity in corpus. |
| `AC-11-057` | Master/layout/theme/placeholder/override/reset fixtures remain source-linked and unflattened. |
| `AC-11-058` | Multiple master/layout families retain ordering, relationships, roles, and stable references. |
| `AC-11-059` | Theme/font/effect/background/extension mappings produce expected values, provenance, and tiers. |
| `AC-11-060` | Transform/group/rotation/flip/anchor/z-order corpus stays within numeric and visual tolerance. |
| `AC-11-061` | Geometry/connectors/arrows/booleans/clipping corpus maps or preserves with exact declared tiers. |
| `AC-11-062` | Fill corpus maps stops/transparency/transforms/tile/crop/theme bindings or reports exact fallback. |
| `AC-11-063` | Stroke corpus maps all supported properties and classifies every alignment/compound/arrow substitution. |
| `AC-11-064` | Effect corpus preserves supported parameters and reports every unsupported parameter without silent drop. |
| `AC-11-065` | Text body/paragraph/run/field/tab/list/column/direction/language/anchor corpus survives semantic round trip. |
| `AC-11-066` | Font/run/OpenType corpus maps exact supported semantics and retains unsupported source metadata. |
| `AC-11-067` | Missing/restricted font report identifies every affected range and preview matches reflow/outline result. |
| `AC-11-068` | Image original/crop/transparency/rotation/filter/compression/alt/source relationships survive declared round trip. |
| `AC-11-069` | Native table cells/spans/order/text/style/header/accessibility survive semantic and package round trip. |
| `AC-11-070` | Chart type/data/series/axes/labels/style/formula/cache/provenance meet the published corpus tier. |
| `AC-11-071` | Untouched embedded workbook/external-data relationships survive chart-only mapped edits when declared safe. |
| `AC-11-072` | Diagram corpus maps structured cases and byte-preserves unsupported source parts with correct fallback. |
| `AC-11-073` | Equation corpus maps supported semantics and preserves unsupported source markup/fallback. |
| `AC-11-074` | SVG/icon/symbol fixtures use target-native vector or exact reported fallback by profile. |
| `AC-11-075` | Media/narration/caption relationship and property corpus maps by target capability without missing assets. |
| `AC-11-076` | Notes/notes-master/field/link/language corpus maps and remains absent from audience artifacts. |
| `AC-11-077` | Comment mapping honors permissions/anchors/status and preserves unsupported representations. |
| `AC-11-078` | Link/action corpus maps targets and reports trust/broken-target issues accurately. |
| `AC-11-079` | Transition/Morph/duration/direction/advance/sound corpus maps by selected target version. |
| `AC-11-080` | Animation sequence/target/build/trigger/timing/effect/path/media corpus meets declared semantic/event tier. |
| `AC-11-081` | Unsupported motion payloads survive preservation round trip while Story preview uses declared fallback. |
| `AC-11-082` | Accessibility metadata maps and report lists every target-profile gap. |
| `AC-11-083` | Exported relationships contain no transient path/URL/cache/credential and all assets resolve. |
| `AC-11-084` | Embedded/custom/add-in/control/signature/extension fixtures receive exact profile dispositions. |
| `AC-11-085` | Changing target profile changes only matrix-governed mappings/fallbacks and reanalysis is mandatory. |
| `AC-11-086` | Preservation-first and clean export produce deliberately different unknown/source behavior and reports. |
| `AC-11-087` | Untouched eligible parts in preservation export retain byte hashes. |
| `AC-11-088` | Dirty rewrites are namespace-valid and retain allowed unknown siblings/extensions. |
| `AC-11-089` | Generated parts/relationships/shape IDs/names are deterministic and collision-free against source corpus. |
| `AC-11-090` | Structural edits leave content types/lists/IDs/relationships/comments/notes/assets internally consistent. |
| `AC-11-091` | Known deletions remove only accepted semantics and leave no inbound dangling relationships. |
| `AC-11-092` | Unknown deletion dependencies are preserved or block with exact report; none disappear silently. |
| `AC-11-093` | Extensions survive only when semantically valid and otherwise receive stale/disposition issues. |
| `AC-11-094` | Invalidated signatures/extensions cannot pass without selected profile disposition. |
| `AC-11-095` | Structural validator catches every seeded ZIP/type/name/relation/root/XML/ID/reference/profile defect. |
| `AC-11-096` | Production reimport succeeds and mapped semantics/preservation expectations match the job plan. |
| `AC-11-097` | Package graph, semantics, preserved hashes, visual samples, and behavior traces meet selected tolerances. |
| `AC-11-098` | Human/machine reports are colocated or attached by policy without reducing PPTX compatibility. |
| `AC-11-099` | Export failure or user deletion of PPTX leaves recoverable `.str` source intact. |
| `AC-11-100` | Reimport comparison/new revision never silently replaces current source and shows semantic differences. |

### 16.3 Compatibility report, PDF, and print

| ID | Pass condition |
|---|---|
| `AC-11-101` | Every issue has complete stable identity, source, target, dimension, tier, severity, location, disposition, and evidence. |
| `AC-11-102` | All summaries reconcile exactly to issue rows across every grouping. |
| `AC-11-103` | Seeded source/edit/target/dependency/security/validation issues classify into distinct causes. |
| `AC-11-104` | Issue navigation focuses the correct slide/object/note/sequence/data/part/output location. |
| `AC-11-105` | Accessible comparisons accurately expose material source/Story/target visual or behavioral changes. |
| `AC-11-106` | Proposed resolutions are applicable, deterministic, and absent when unsafe or impossible. |
| `AC-11-107` | Resolution impact preview enumerates every affected use and matches final result. |
| `AC-11-108` | One/source/selected/family/all scoping changes exactly intended issues and nothing else. |
| `AC-11-109` | Source resolutions are authored transactions with undo/save/collaboration/reanalysis. |
| `AC-11-110` | Output-only resolutions leave Story semantic hash unchanged. |
| `AC-11-111` | Blocking/security/accessibility/unverified waivers require authorized identity and nonempty reason. |
| `AC-11-112` | Waivers do not apply to changed revisions or other target profiles. |
| `AC-11-113` | Final report contains baseline/changes/options/decisions/writer/validator/environment/hashes. |
| `AC-11-114` | Human and machine reports contain the same issue IDs, tiers, dispositions, and totals. |
| `AC-11-115` | Default report scans contain no private notes/text/data/paths/identities beyond allowlisted metadata. |
| `AC-11-116` | Keyboard/assistive workflow completes filter, inspect, compare, decide, waive, and return-to-source. |
| `AC-11-117` | Every issue carries one accurate evidence status and immutable evidence reference when verified. |
| `AC-11-118` | Any nonwaived blocker/validation failure/missing evidence prevents full-success completion. |
| `AC-11-119` | PDF production uses native page semantics and remains independent of editor DOM visibility/layout. |
| `AC-11-120` | Every PDF scope produces exact pages and selected composition. |
| `AC-11-121` | Page order/repetition/hidden/page labels/numbering match the immutable PDF plan. |
| `AC-11-122` | Page boxes/orientation/crop/bleed/background/margins/scaling match selected profile. |
| `AC-11-123` | Tagged PDF inspection finds correct language/title/order/headings/lists/links/alt/decorative/tables/artifacts. |
| `AC-11-124` | Accessibility preflight finds every seeded unrepresentable semantic before writing. |
| `AC-11-125` | Font embedding/subsetting/substitution/outline follows license/capability and report per range. |
| `AC-11-126` | Search/select tests find live text where permitted and every outlined/raster range is reported. |
| `AC-11-127` | Vector/transparency/effect corpus remains native or flattens only the exact declared group. |
| `AC-11-128` | Build/motion/media/code/embed/data fixtures render the chosen static state. |
| `AC-11-129` | Media outputs use selected poster/link/transcript and contain no implied playback. |
| `AC-11-130` | PDF links are sanitized, actionable, and broken targets appear in report. |
| `AC-11-131` | Metadata/bookmarks/page labels/view/security match options and privacy policy. |
| `AC-11-132` | Color profile/conversion/transparency behavior matches profile and report. |
| `AC-11-133` | Excluded notes/comments/hidden/private/recording/compatibility data is absent from PDF bytes/tags/attachments. |
| `AC-11-134` | Preview page pixels/semantics and final artifact agree within declared tolerance. |
| `AC-11-135` | Validator catches seeded page/font/link/tag/metadata/resolution/structure defects. |
| `AC-11-136` | Independent PDF parser inventory matches normalized job plan. |
| `AC-11-137` | PDF report matches every actual flatten/substitute/outline/omit/poster/accessibility/unverified result. |
| `AC-11-138` | Repeated reproducible-profile generation yields equal normalized PDF hashes. |
| `AC-11-139` | Keyboard/assistive workflow completes PDF setup, preview, issue resolution, progress, cancel, and completion. |
| `AC-11-140` | Print host invocation receives an immutable deterministic page plan/artifact. |
| `AC-11-141` | Full/notes/outline/1/2/3/4/6/9/custom handout layouts produce expected pages. |
| `AC-11-142` | Print scopes include exact slides/order/repetitions/hidden policy. |
| `AC-11-143` | Paper/orientation/margins/scale/frame/order/notes/lines match preview and spool artifact. |
| `AC-11-144` | Print fields render in page furniture only and leave slide semantic hash unchanged. |
| `AC-11-145` | Color/grayscale/black-white corpus uses semantic color mapping and matches preview. |
| `AC-11-146` | Print static-state/media policy matches PDF or visible override exactly. |
| `AC-11-147` | Notes appear only in selected notes/handout scope and never full-slide pages. |
| `AC-11-148` | Preview accurately shows page count/bounds/clipping/margins/order/furniture/color. |
| `AC-11-149` | Host options reflect adapter capabilities and unsupported states accurately. |
| `AC-11-150` | Printer-specific options are passed only when supported and never fabricated. |
| `AC-11-151` | Host cancel returns to configured job with no error, mutation, or completion claim. |
| `AC-11-152` | Print preflight detects clipping/fonts/assets/resolution/accessibility/host conflicts. |
| `AC-11-153` | Spool artifact inspection proves output is independent from editor DOM/browser CSS state. |
| `AC-11-154` | Page count/dimensions/orientation/order/bounds/privacy validate before host invocation. |
| `AC-11-155` | Keyboard/assistive workflow covers all print setup, preview, host, and cancel controls. |
| `AC-11-156` | Summary reports host acceptance, not unverifiable physical completion, with exact options/pages/issues. |

### 16.4 Video and web

| ID | Pass condition |
|---|---|
| `AC-11-157` | Video event/frame trace comes from controlled Volume 10 clock and not real-time screen capture. |
| `AC-11-158` | Each video scope yields exact show items/order/hidden/repetition policy. |
| `AC-11-159` | Recorded/rehearsed/authored/default timing maps to stable boundaries and reports missing targets. |
| `AC-11-160` | Every enabled container/codec/resolution/fps/quality/color/hardware profile is capability-backed and valid. |
| `AC-11-161` | Rational frame timestamps reproduce identical semantic timeline samples. |
| `AC-11-162` | Motion corpus renders or uses exact reported no-motion/static fallback. |
| `AC-11-163` | Embedded media frames match trim/loop/rate/crop/opacity/blend at sampled timestamps. |
| `AC-11-164` | Audio mix matches volume/mute/fade/duck/channel/rate/normalization plan without clipping beyond tolerance. |
| `AC-11-165` | Audio/video/caption/animation/camera/pointer/ink drift remains within published tolerance. |
| `AC-11-166` | Camera composition modes match selected inset/full/crop/mask/hide/omit policy. |
| `AC-11-167` | Pointer/laser/ink tracks map correctly at all output resolutions/aspects and only when selected. |
| `AC-11-168` | Burned/embedded/sidecar/transcript/omit captions produce exact selected track form. |
| `AC-11-169` | Caption semantic inspection preserves text/language/speaker/cues/line breaks/accessibility. |
| `AC-11-170` | Code/data/embed frames use deterministic snapshots with no unexpected network access. |
| `AC-11-171` | Video preflight catches every seeded decoder/codec/frame/track/font/snapshot issue. |
| `AC-11-172` | Representative preview frames/motion/audio/captions/crop/duration match final render plan. |
| `AC-11-173` | Duration/frame/resolution/size/storage/capability estimate reconciles within published bounds. |
| `AC-11-174` | Progress/cancel/resume checkpoints operate at safe timeline/segment boundaries. |
| `AC-11-175` | Encode/mux/finalization faults leave no partial final and preserve prior destination. |
| `AC-11-176` | Independent media parser verifies container/duration/frames/dimensions/fps/audio/captions/metadata/decoding. |
| `AC-11-177` | Visual samples, canonical event trace, audio duration, and caption cues match job plan. |
| `AC-11-178` | Video report lists every actual omission/substitution/static/missing/clip/drift/accessibility/unverified result. |
| `AC-11-179` | Frame/track/metadata scans contain no notes/presenter UI/diagnostics/device/consent/unselected recordings. |
| `AC-11-180` | Keyboard/assistive workflow covers full video setup, preflight, preview, tracks, progress, cancel, retry, completion. |
| `AC-11-181` | Web package uses versioned exported semantics/timeline and starts without editor code/state. |
| `AC-11-182` | Folder/ZIP/hosted/single-file profiles enforce exact size/browser/origin/offline constraints. |
| `AC-11-183` | Manifest inventory and integrity checks cover every required scene/asset/font/media/caption/thumbnail/player file. |
| `AC-11-184` | Web runtime event trace matches selected slide/show/build/transition/Morph/link/media/caption/interaction plan. |
| `AC-11-185` | Responsive/fullscreen/windowed/keyboard/pointer/touch/grid/progress/caption/media/reduced-motion matrix passes supported browsers. |
| `AC-11-186` | Accessibility-tree tests expose correct slide semantics, order, alt, language, tables, chart descriptions, links, controls, focus, announcements. |
| `AC-11-187` | Bundle scan contains no notes/diagnostics/comments/credentials/paths/tokens/private recordings. |
| `AC-11-188` | Default bundle makes no analytics/tracking/third-party requests and enabled services require recorded consent config. |
| `AC-11-189` | CSP and sanitizer corpus blocks unsafe SVG/HTML/link/embed/caption/metadata/config behavior. |
| `AC-11-190` | Code/embed profiles receive only declared sandbox capabilities and no implicit network/storage/camera/mic. |
| `AC-11-191` | Fonts package only under license and fallback/outline/substitute matches report. |
| `AC-11-192` | Offline package loads correct version, all required assets, and updates without mixed revisions. |
| `AC-11-193` | Restricted local-origin launch shows useful safe guidance with no hidden network bypass. |
| `AC-11-194` | Deep links are deterministic and expose no private IDs under default public profile. |
| `AC-11-195` | Captions/transcripts/posters/audio descriptions/media fallbacks adapt correctly to browser capability. |
| `AC-11-196` | Validator catches seeded manifest/hash/link/asset/CSP/startup/offline/a11y/playback failures. |
| `AC-11-197` | Web report matches all actual effects/substitutions/dependencies/browser/font/a11y/host verification outcomes. |
| `AC-11-198` | Keyboard/assistive workflow covers web profile/privacy/security/offline/font/caption/validation/progress/deployment controls. |

### 16.5 SVG, raster, and clipboard

| ID | Pass condition |
|---|---|
| `AC-11-199` | Object/selection/component/slide/root SVG has deterministic expected bounds/viewBox and semantic scope. |
| `AC-11-200` | SVG geometry/group/transform/path/fill/clip/mask/paint/stroke/effect/opacity/blend corpus meets declared tier. |
| `AC-11-201` | Live/outline/dual text choices produce exact font/editability/accessibility/portability outcomes and reports. |
| `AC-11-202` | Embed/package/link policies produce valid assets and no unintended external/private references. |
| `AC-11-203` | Dynamic/data-object/equation corpus uses exact native/vector/poster/raster/metadata fallback. |
| `AC-11-204` | SVG title/description/language/roles/links are safe and no private path/executable content exists. |
| `AC-11-205` | Repeated reproducible SVG output yields equal normalized XML and stable IDs/references/precision/order. |
| `AC-11-206` | Independent parser/sanitizer/render checks validate structure, closure, bounds, text, assets, accessibility, and pixels. |
| `AC-11-207` | PNG/JPEG/WebP/published codecs render from the resolved scene with correct alpha/color behavior. |
| `AC-11-208` | Scale/fixed/exact/DPI/slide/geometric/visual/padding/background/aspect combinations yield exact dimensions/bounds. |
| `AC-11-209` | Codec-specific quality/loss/chroma/profile/metadata/alpha/matte options are enabled only when supported and inspect correctly. |
| `AC-11-210` | Over-limit raster fixtures tile/resize/block exactly by policy and never clip silently. |
| `AC-11-211` | Transform/stroke/effect/mask/text/media/data/code/static-state pixels match canonical scene tolerances. |
| `AC-11-212` | Batch per-slide/object/selection/preset names, item artifacts, failures, and aggregate status are exact. |
| `AC-11-213` | Clipboard inspection finds richest internal flavor plus every applicable validated portable flavor. |
| `AC-11-214` | Receiving fixtures choose the highest understood useful flavor without format interference. |
| `AC-11-215` | Forced clipboard failure during cut leaves source and history unchanged; success deletes once. |
| `AC-11-216` | Copy-as commands appear only for producible flavors and write the requested primary flavor. |
| `AC-11-217` | Portable flavor scans contain no secrets/paths/credentials/private notes/comments/diagnostics/hidden metadata. |
| `AC-11-218` | Clipboard limit/timeout/permission corpus yields exact fallback and no partial cut. |
| `AC-11-219` | Read-back or deterministic pre-write validation confirms every claimed flavor structure and hash. |
| `AC-11-220` | Keyboard/assistive workflow completes SVG/raster/batch/clipboard setup, preview, progress, errors, and completion. |
| `AC-11-221` | Every presentation-level artifact manifest/report binds a verified `SCH-10-001` snapshot ID and its expected base/edition semantics; wrong-edition, stale-readiness, changed-fallback, or tampered-snapshot fixtures fail finalization. |
| `AC-11-222` | Seeded compatibility findings are attributed to the exact base, directive, local override, or output policy and navigate to that source. |
| `AC-11-223` | A three-edition batch produces three independently validated artifacts/reports with no identity, notes, settings, or issue leakage between editions. |

## 17. Required Evidence and Traceability

Release conformance for this volume requires:

1. A mapping from every `REQ-11-*` to parent capability, source/target profile, mapping/writer/validator owner, test protocol, artifact corpus, revision, and evidence record.
2. Versioned synthetic and real-world PPTX corpora covering all mapped feature families, malformed packages, unknown extensions, active content, external relationships, signatures, encryption detection, multiple Office versions, and round-trip preservation.
3. Package-graph, semantic, preserved-byte, visual, behavioral, accessibility, and security assertions rather than file-existence checks.
4. Headed user workflows for import review, compatibility navigation, resolution, export configuration, preview, cancellation, failure, completion, print, copy-as, and batch output.
5. Independent parser validation for PPTX, PDF, video containers, web manifests, SVG, raster headers/profiles, and clipboard flavors.
6. Canonical resolved-scene and runtime-event comparison proving output adapters do not reinterpret source semantics independently.
7. Hardware/host matrices for Office target applications, printers, codecs, browsers, clipboard APIs, filesystem capabilities, and accessibility tools where claimed.
8. Negative gates for unknown-part loss, global success on partial batch failure, enabled unrouted formats, silent rasterization, untagged accessible-PDF claims, notes leakage, DOM screenshots, placeholder clipboard PNG, stale compatibility decisions, wrong-edition output, and edition identity loss.

## 18. Non-Goals and Open Boundaries

This volume does not require:

- Executing or editing VBA, macros, ActiveX, OLE, embedded executable packages, or untrusted scripts.
- Byte-identical PPTX output after an owned source scope is intentionally changed.
- Perfect fidelity in every historical or future Office build without a declared target profile.
- Treating a raster image as native editable table, chart, diagram, equation, text, component, animation, or media parity.
- Supporting Keynote `.key`, legacy binary `.ppt`, arbitrary PDF-to-editable import, or proprietary plugin formats in this release contract.
- Sending content to cloud conversion, font, caption, analytics, or media services without explicit consent and retention policy.
- Claiming physical printer completion when the host only confirms spool acceptance.
- Shipping an output option before its writer, validator, report mapping, accessibility policy, and artifact tests exist.

Open decisions are controlled by the following defaults. An ADR and published profile matrix may expand a target, but implementation and conformance use the default in force until both are accepted.

| ID | Decision/question | Default in force | Owner | Review trigger | Affected requirements/contracts | Blocking class |
|---|---|---|---|---|---|---|
| `OD-11-001` | Which Office/PPTX versions, conformance class, and extension namespaces are targeted? | R1 writes Office Open XML Transitional `.pptx` and validates the published subset against the current supported Microsoft 365 desktop PowerPoint on Windows. Clean export emits only required Transitional namespaces plus documented Microsoft extension namespaces needed by an included mapped feature; unknown imported namespaces are preservation candidates, not new clean-export dependencies. Strict OOXML and other Office-version claims are unavailable. | Interchange Engineering and Quality | Before implementing the PPTX writer or claiming another Office application/version or conformance class | `REQ-11-023` through `REQ-11-034`, `REQ-11-040`, `REQ-11-056` through `REQ-11-100`; `R1-WF-23` and `R1-WF-24` | `R1-blocking` |
| `OD-11-002` | How are macro-enabled, encrypted, rights-managed, signed, and embedded-package inputs preserved or exported? | R1 accepts ordinary unencrypted `.pptx`. Macros, ActiveX, OLE, and embedded executable packages are quarantined and never executed. Encrypted or rights-managed packages are blocked before ordinary parsing because R1 has no unlock adapter. Signed packages may be inspected preservation-first, but any semantic edit invalidates the signature and clean `.pptx` export omits it with disclosure. R1 does not emit `.pptm`, encryption, rights management, or signatures. | Interchange Engineering, Security, Privacy, and Legal | Before implementing package admission or adding any active-content, decryption, rights, or signing profile | `REQ-11-035` through `REQ-11-039`, `REQ-11-084`, `REQ-11-092` through `REQ-11-095`; `R1-WF-23` | `R1-blocking` |
| `OD-11-003` | What are the advanced chart-workbook, SmartArt, equation, legacy-motion, and recording/narration tiers? | R1 maps only the Volume 09 included chart families and embedded accepted data snapshot; unedited source workbooks may be preservation-only, but workbook editing and external refresh are unavailable. Supported structured diagrams and the included UnicodeMath-compatible equation matrix map where the target permits; unsupported SmartArt/equation source is preserved with a visual fallback. Only included transitions/animations and narration map natively; legacy motion and other recording tracks use preservation or declared fallback. | Presentation Data, Motion, Media, and Interchange Engineering | Before implementing PPTX semantic mapping or promoting any additional feature family | `REQ-11-069` through `REQ-11-081`; `R1-WF-13` through `R1-WF-16`, `R1-WF-23`, and `R1-WF-24` | `R1-blocking` |
| `OD-11-004` | Which tagged PDF version, archival/print profiles, security features, and color spaces are supported? | R1 deck PDF targets PDF 1.7 in sRGB. When accessible PDF is claimed, tagged structure is mandatory; otherwise the compatibility report explicitly records accessibility degradation. PDF/A, PDF/X, encryption, digital signing, spot colors, CMYK, and wide-gamut output are unavailable and their controls are absent. | PDF, Accessibility, Color, and Security Engineering | Before implementing the PDF writer or exposing an archival, print-production, security, or non-sRGB profile | `REQ-11-119` through `REQ-11-139`; `R1-WF-24` | `R1-blocking` |
| `OD-11-005` | Which video containers/codecs and advanced encoding capabilities are supported by each host? | No video-export profile is enabled for R1 conformance because video is Preview and provides no R1 credit. The R1 UI does not offer video export unless an explicitly experimental host profile publishes and validates its exact container/video/audio tuple. HDR, wide gamut, alpha video, 4K, hardware-only encoding, and cross-session resumable final encoding remain disabled in that experimental tier; a partial container is never exposed as final. | Video, Media, Runtime, and Quality Engineering | Before enabling video export on a host or publishing its first container/codec tuple | `REQ-11-157` through `REQ-11-180`; `PROFILE-R1-2026-01` Sections 4.6 and 7 | `pre-implementation` |
| `OD-11-006` | Which web packaging, hosting, analytics, service-worker, single-file, code, and embed profiles are supported? | R1 portable web output is a self-contained folder or ZIP player package with content-addressed local assets. It contains no service worker, analytics, audience service, external request, active embed, or network-enabled code path. Code and embed content render authored static fallbacks. Hosted deployment automation and single-file packaging are unavailable; local-origin restrictions are disclosed by the generated fallback page. | Web Output, Runtime, Security, Privacy, and Accessibility | Before implementing portable web output or enabling hosting, service workers, code, embeds, analytics, or audience services | `REQ-11-181` through `REQ-11-198`; `PROFILE-R1-2026-01` Sections 4.6 and 7 | `R1-blocking` |
| `OD-11-007` | Which SVG dual-source metadata, filters/patterns, font packaging, and external references are supported? | R1 SVG uses the Volume 08 live-text or outline policy and emits no Story-private editable-source metadata. It emits the published basic geometry/paint/mask subset; unsupported filters and patterns use a grouped-vector or raster fallback with a report entry. Assets are embedded when licensed and within limits; otherwise the output is blocked or uses an explicitly selected substitute. External network references and executable content are forbidden. | SVG, Design Authoring, Typography, and Security Engineering | Before implementing SVG output or claiming a new filter, pattern, font-package, metadata-consumer, or external-reference tier | `REQ-11-199` through `REQ-11-206`; `REQ-08-133` through `REQ-08-135`; `R1-WF-04` and `R1-WF-09` | `R1-blocking` |
| `OD-11-008` | Which slide-fragment clipboard MIME conventions and external interoperability targets are supported? | R1 writes the versioned Story-internal object flavor plus applicable validated SVG, PNG/image, safe HTML or rich text, and plain text flavors. No public external slide-fragment MIME or application-specific clipboard contract is claimed; **Copy as Slide** uses the Story-internal flavor and is disabled when that flavor cannot be written. A new external flavor requires a named receiving application/version, parser/writer contract, privacy filter, size limits, and round-trip corpus. | Clipboard, Interchange, Security, and Quality Engineering | Before implementing Copy as Slide or claiming clipboard interoperability with a non-Story presentation application | `REQ-11-213` through `REQ-11-220`; `REQ-08-123` through `REQ-08-132` | `pre-implementation` |

Each default is implementable without the future ADR. Any option outside these defaults remains disabled or explicitly experimental and cannot count toward compatibility or output conformance.