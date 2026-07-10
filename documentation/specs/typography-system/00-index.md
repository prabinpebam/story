# Typography System Specification

This documentation defines the specifications for the typography system in the Story project. It is designed to mirror the **Color Theme System** in architecture and behavior, ensuring a consistent "Theme -> Master -> Slide -> Element" cascade.

## Design System Alignment

This specification strictly separates **Application UI** (Editor chrome) from **Canvas Content** (User slides).
- **Editor UI**: Must use Design System tokens (`--font-ui`, `--font-size-sm`) and standard components (`Dropdown`, `NumberInput`).
- **Canvas Content**: Uses the `FontPresets` system with raw pixel values and dynamic font loading.

## Contents

1. **[System Architecture](./01-architecture.md)**
   - The 4-Layer Cascade (Theme -> Master -> Slide -> Element)
   - **UI vs. Content** distinction
   - Active Linking & Reactivity

2. **[Font Management Spec](./02-font-management.md)**
   - Font loading strategy & performance requirements
   - `FontManager` API surface
   - Fallback and System Font stacks

3. **[Presets & Style Data Model](./03-presets-and-styles.md)**
   - Schema for `FontPresets` and `TextStyles`
   - Semantic hierarchy (Title, Body, etc.)
   - Linked vs. Overridden states

4. **[UI Component Specifications](./04-ui-components.md)**
   - **Design System Compliance** (Tokens & Components)
   - `TypographyStyleManager` (Panel) requirements
   - `TextSection` (Property Inspector) with Override indicators
   - **UX Principle**: "Edit with the styles you have"

5. **[UX Workflows & Task Flows](./08-ux-workflows.md)**
   - Detailed Property Inspector behavior
   - Happy Path vs. Override Path
   - Visual States (Linked, Modified, Detached)

6. **[Property Inspector: Typography Linking UX (Strict)](./11-property-inspector-typography-linking-ux.md)**
   - Comprehensive expected UX behavior (Slide mode + Text selected)
   - Correct Heading/Body labels in Slide Typography row
   - Strict linking: style dictates properties; detach to edit locally

6. **Implementation status:** See the [Product Requirement Status](../../product/requirement-status.md) and current typography tests; no separate maintained status document exists.
   - Current state vs. Specification
   - Known gaps and technical debt

6. **[Roadmap & Priorities](./06-roadmap.md)**
   - Phased implementation plan
   - Critical path items

7. **[Principles Alignment](./09-principles-alignment.md)**
   - Compliance with App Integrity, Theming, and Performance
   - Undo/Redo & Collaboration requirements

8. **[Detailed Implementation Plan](./10-implementation-plan.md)**
   - Step-by-step execution guide
   - Principles checklist for every PR

9. **[Competitive Analysis](./07-competitive-analysis.md)**
   - Benchmarks (Figma, Canva, Pitch)
   - Best practices adopted
