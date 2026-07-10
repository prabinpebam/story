# Story Feature Specifications

Feature specifications define accepted or proposed behavior beneath the [Story Product Specification](../product/product-spec.md). They do not prove that a feature is implemented.

## Specification Rules

1. Every domain must identify one entry point and its normative documents.
2. Each document must declare specification maturity: `draft`, `accepted`, or `superseded`.
3. Implementation and verification status belongs in the [Capability Audit](../product/capability-audit.md) or an evidence-backed domain ledger, not in aspirational prose.
4. Domain specifications may add detail but may not weaken the product contract.
5. If production code differs from an accepted specification, record the difference as a gap.
6. Archived documents are historical and non-normative.

## Domains

| Domain | Entry point | Product responsibility |
|---|---|---|
| Core | [core/architecture-overview.md](core/architecture-overview.md) | Document state, operations, input, history, shortcuts, and foundational services |
| Canvas | [canvas/canvas-interaction.md](canvas/canvas-interaction.md) | Viewport, selection, transforms, layers, context menus, rendering, paints, and media |
| Shapes and vector editing | [shapes/00-index.md](shapes/00-index.md) | Shape schema, geometry, paths, booleans, masks, editing, interoperability, and performance |
| Text editing | [text-editing/README.md](text-editing/README.md) | Rich text interaction, selection, IME, history, sanitization, and rendering |
| Typography | [typography-system/00-index.md](typography-system/00-index.md) | Fonts, text styles, presets, OpenType behavior, and typography workflows |
| Slides | [slides/00-index.md](slides/00-index.md) | Slides, masters, layouts, placeholders, notes, themes, SVG, transitions, and presentation |
| Presentation runtime | [slides/presentation-mode/00-master-outline.md](slides/presentation-mode/00-master-outline.md) | Audience playback, presenter tools, readiness, navigation, reliability, and delivery |
| UI system | [ui-system/design-system-overview.md](ui-system/design-system-overview.md) | Tokens, controls, interaction patterns, inspector, toolbar, overlays, and accessibility |
| Collaboration and storage | [collaboration/realtime-collaboration.md](collaboration/realtime-collaboration.md) | Identity, sharing, presence, synchronization, native files, cloud providers, and recovery |
| AI | [ai/ai-copilot.md](ai/ai-copilot.md) | Optional AI-assisted workflows, safety, privacy, and deterministic fallback |
| Column system | [column-system/slide-layout-system-spec.md](column-system/slide-layout-system-spec.md) | Slide-level columns, guides, and layout behavior |

## Known Authority Cleanup

The following areas contain overlapping active documents and must be consolidated without treating either document's status claims as implementation evidence:

- `slides/presentation/` and `slides/presentation-mode/`: `presentation-mode/` is the forward normative suite; unique valid requirements from the older directory should be reconciled before it is archived.
- `collaboration/cloud-storage-abstraction.md` and `collaboration/storage/cloud-storage-abstraction.md`: storage must have one provider-abstraction authority.
- Shapes entry documents: [shapes/00-index.md](shapes/00-index.md) is the entry point; [shapes/00-topic-tree-and-spec-map.md](shapes/00-topic-tree-and-spec-map.md) is its detailed map; [shapes/README.md](shapes/README.md) is only a short redirect.
- UI system source-of-truth claims must be partitioned among overview, tokens, components, and interaction patterns rather than compete globally.

Until each cleanup is complete, use the product requirement, current production behavior, and current executable evidence to record the discrepancy explicitly. Do not choose whichever document claims the highest completion percentage.

## Cross-Cutting Contracts

Every feature domain must address the applicable contracts below:

- Canonical schema, stable IDs, and migration
- Typed transactions, undo, redo, and gesture coalescing
- Native-file serialization and asset lifecycle
- Collaboration operations and convergence
- Editor, thumbnail, presentation, presenter, export, and print semantics
- Keyboard and accessibility behavior
- Performance budgets at realistic scale
- User-observable taskflows and headed browser evidence
- Artifact validation for files, clipboard, import, export, or recording
- Security, privacy, offline, and failure behavior

See the [Definition of Done](../product/product-spec.md#9-definition-of-done) and [Delivery Roadmap](../product/delivery-roadmap.md).
