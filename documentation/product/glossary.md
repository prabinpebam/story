# Story Product Glossary

> **Status:** Normative terminology  
> **Last updated:** July 10, 2026

Use these terms consistently in product requirements, UI copy, schemas, tests, and implementation. Legacy field names may remain during migration, but new behavior must use the canonical meaning.

## Product and Document

| Term | Canonical meaning | Avoid or qualify |
|---|---|---|
| **Story** | The professional presentation design environment. | “Presentation Maker” when describing the full product goal. |
| **Presentation** | The complete authored document: slides, masters, layouts, themes, assets, notes, animation, and metadata. | Use “deck” only as informal user-facing shorthand. |
| **Document state** | Persisted, collaboration-relevant presentation data. | Do not include editor selection, auth tokens, presence, caches, or open panels. |
| **Runtime state** | Ephemeral editor, presentation, identity, presence, provider, and cache state that is not authored content. | Do not serialize into the presentation without an explicit document requirement. |
| **Native file** | Story’s versioned ZIP-based presentation package. The canonical extension is `.str`. | `.story` unless a product-approved migration changes the contract. |
| **Asset** | Referenced or embedded image, video, audio, font, generated media, or external resource with identity and lifecycle. | Do not treat an object URL or cache entry as the durable asset identity. |
| **Resolved scene** | Non-mutating semantic output after master, layout, theme, variable, component, instance, and local overrides are resolved. | A DOM snapshot or renderer-specific markup. |

## Slides and Presentation Structure

| Term | Canonical meaning | Avoid or qualify |
|---|---|---|
| **Slide** | An ordered presentation page containing local elements, references, notes, transition, and presentation metadata. | “Frame” when the object participates in slide navigation or playback. |
| **Slide master** | A deck-level source of inherited background, theme defaults, guides, and layout definitions. | “Theme Master” unless referring to a legacy field during migration. |
| **Layout** | A reusable structure owned by a slide master that defines placeholders, inherited elements, guides, and default arrangement for slides. | “Master preset” when referring to a user-selected slide layout. |
| **Placeholder** | A typed layout-owned insertion and inheritance contract for title, body, picture, media, chart, table, diagram, or content. | A decorative empty rectangle with no typed lifecycle. |
| **Master preset** | A packaged starter configuration that creates or configures a slide master and its layouts. | A template or layout unless it satisfies those definitions. |
| **Template** | A reusable presentation package containing masters, layouts, themes, styles, components, sample content, and metadata. | A single visual preset or flattened example slide. |
| **Section** | A named, ordered range of slides used for organization, navigation, and custom delivery. | A layer-tree group. |
| **Custom show** | A named subset and order of slides for a particular audience or delivery context. | A duplicate presentation file. |
| **Speaker notes** | Structured presenter-authored content associated with a slide. | Slide-visible body text. |

## Design and Canvas

| Term | Canonical meaning | Avoid or qualify |
|---|---|---|
| **Canvas** | The interactive authoring surface containing the slide and surrounding pasteboard. | The HTML Canvas API unless specifically discussing rendering technology. |
| **Pasteboard** | The non-presented workspace around a slide used during authoring. | Audience-visible slide content. |
| **Element** | A top-level editable document entity placed in a slide, layout, master, component, or group. | “Node” when referring specifically to a vector point. |
| **Scene node** | Any entity participating in hierarchy and resolved rendering, including elements, groups, booleans, masks, and component instances. | DOM node. |
| **Shape** | An element whose appearance is driven by parametric or path geometry and paint. | Every visual element; text, charts, and media have distinct semantics. |
| **Vector path** | One or more open or closed contours made of stable points and segments. | A serialized SVG string as the canonical editable model. |
| **Vector point** | A stable editable point with position and continuity/handle semantics. | “Node” without context. |
| **Group** | A hierarchy container that preserves child semantics and relative transforms without imposing layout. | Auto Layout container or component. |
| **Mask** | A non-destructive relationship where one or more nodes control visibility of other nodes. | Destructive crop. |
| **Boolean** | A non-destructive union, subtract, intersect, or exclude relationship over editable operands. | A flattened path unless the user explicitly flattens it. |
| **Auto Layout** | Object-level responsive layout that arranges children using direction, wrapping, padding, gap, alignment, and sizing rules. | Slide columns, guides, or master layouts. |
| **Constraint** | A rule describing how an object responds when its parent bounds change. | Snapping guide. |

## Reuse, Styles, and Themes

| Term | Canonical meaning | Avoid or qualify |
|---|---|---|
| **Component** | A reusable design definition whose changes propagate to instances. | A JavaScript UI class; call those “UI components” in technical docs. |
| **Instance** | A placed reference to a component with tracked overrides. | A detached copy. |
| **Variant** | A named combination of component property values organized in a component set. | An unrelated component with a similar appearance. |
| **Component property** | A typed author-controlled input such as text, boolean, instance swap, or variant selection. | Any arbitrary style override. |
| **Style** | A reusable named design value for color, typography, effect, grid, or spacing behavior. | An inline CSS declaration. |
| **Variable** | A typed reusable value with collections, modes, and aliases that can bind to document properties. | A JavaScript variable. |
| **Presentation theme** | The authored color, font, effect, and spacing system applied through masters, layouts, and slides. | App theme. |
| **App theme** | Story interface appearance such as light/dark mode, UI accent, typography, and density. | Presentation theme. |
| **Template library** | A distributable collection of templates and brand resources. | Component library unless it contains reusable components/styles specifically. |

## Motion and Delivery

| Term | Canonical meaning | Avoid or qualify |
|---|---|---|
| **Presentation Mode** | The family of audience playback modes and their runtime behavior. | Presenter View. |
| **Audience view** | The clean output shown to viewers. | Presenter View or editor preview. |
| **Presenter View** | A private presenter surface with current/next slides, notes, timing, navigation, and audience controls. | Presentation Mode as a whole. |
| **Transition** | A timed visual change between slides. | Object animation. |
| **Object animation** | A timed effect applied to an element within a slide. | Transition. |
| **Build** | A playback step that reveals or changes one or more objects, usually advanced by click or timing. | Any CSS animation. |
| **Animation sequencer** | The authoring surface and model for animation order, trigger, delay, duration, grouping, and repetition. | A decorative timeline with no document semantics. |
| **Morph** | A transition that matches stable semantic objects across slides and interpolates supported properties. | Generic cross-fade. |
| **Rehearsal timing** | Recorded slide/build timing gathered while practicing a show. | Narration recording. |
| **Recording** | Captured narration, camera, pointer/ink, and presentation timing associated with the presentation. | Video export alone. |
| **Kiosk mode** | Restricted unattended or self-running presentation behavior configured by the author. | Any fullscreen show. |

## Collaboration and Compatibility

| Term | Canonical meaning | Avoid or qualify |
|---|---|---|
| **Operation** | A validated, JSON-safe, replayable document mutation with stable targets and deterministic semantics. | Arbitrary state replacement. |
| **Transaction** | One atomic user intent containing one or more operations and one history boundary. | Every pointer-move preview event. |
| **Presence** | Ephemeral information about connected collaborators, cursors, selections, and activity. | Persisted document content. |
| **Local undo** | Reversal of the user’s own accepted intent without removing accepted remote work. | Restoring an old whole-document snapshot over collaborators. |
| **Convergence** | Replicas produce equivalent document state after receiving the same accepted operations. | Merely reconnecting to the server. |
| **Fidelity tier** | A published level describing which semantics remain editable, rendered, preserved-only, substituted, or unsupported during interchange. | “Supported” without qualification. |
| **Compatibility report** | An actionable account of content that will be preserved, substituted, rasterized, or lost before an irreversible boundary. | A generic success notification. |
| **Preservation** | Retaining unsupported source data for future round trip even when Story cannot edit or render it fully. | Silent deletion or flattening. |

## Specification and Evidence

| Term | Canonical meaning | Avoid or qualify |
|---|---|---|
| **Product requirement** | An ID-addressable outcome or invariant in the product specification. | A menu inventory. |
| **Domain specification** | Detailed accepted or draft behavior and architecture for a product domain. | Implementation proof. |
| **Taskflow** | A user action, context, and expected observable result. | Test coverage. |
| **Evaluation capture** | Agenda-free evidence from the real running workflow, including relevant document, DOM, canvas, execution, and artifact state. | A screenshot alone when state or behavior matters. |
| **Detector** | A post-capture rule that identifies a defined anomaly. | Logic that shapes or filters capture around expected results. |
| **Verified** | Supported by identified current evidence at a known revision. | A green label with no test, artifact, date, or revision. |
| **Implemented** | A routed production workflow exists. | A spec, module, mock, control label, or test filename. |
