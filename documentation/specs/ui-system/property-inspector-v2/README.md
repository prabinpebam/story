# Property Inspector Specification v2.0

> **Status:** Active  
> **Version:** 2.0  
> **Last Updated:** December 2025

---

## Overview

This folder contains the comprehensive specification for the Property Inspector (PI) component in the Story presentation editor. The PI is the right sidebar panel that displays and allows editing of properties for selected canvas elements.

---

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 00 | [Overview](./00-overview.md) | Executive summary, core principles, section visibility matrix |
| 01 | [Architecture](./01-architecture.md) | Component structure, state management, **bidirectional sync**, design system integration |
| 02 | [Position Section](./02-position-section.md) | Alignment, coordinates, rotation, flip transforms |
| 03 | [Layout Section](./03-layout-section.md) | Dimensions, constraints, text resize modes |
| 04 | [Appearance Section](./04-appearance-section.md) | Opacity, blend modes, **per-corner border radius** |
| 05 | [Fill Section](./05-fill-section.md) | Solid, gradient, image, video, code fills |
| 06 | [Stroke Section](./06-stroke-section.md) | Stroke properties, dash patterns, per-side strokes |
| 07 | [Effects Section](./07-effects-section.md) | Drop shadow, layer blur, background blur |
| 08 | [Typography Section](./08-typography-section.md) | Font, spacing, alignment, text styles |
| 09 | [Export Section](./09-export-section.md) | Export presets, formats, scales |
| 10 | [Slide Section](./10-slide-section.md) | Layout picker, theme, background, master properties |
| 11 | [Placeholder Section](./11-placeholder-section.md) | Placeholder types, master layout editing |
| 12 | [Interactions](./12-interactions.md) | Input behaviors, keyboard shortcuts, scrubbing, focus management |
| 13 | [Gaps & Roadmap](./13-gaps-and-roadmap.md) | Current gaps, technical debt, future roadmap |
| 14 | [Visual Design](./14-visual-design.md) | Layout specs, design tokens, component styling |
| 15 | [Glossary](./15-glossary.md) | Canonical terminology definitions |

---

## Key Architectural Principles

### 1. Single Source of Truth
The Store is the ONLY source of truth. Both the Property Inspector and Viewport read from and write to the Store. Neither caches element properties locally. See [01-architecture.md Section 2.4](./01-architecture.md) for the complete bidirectional synchronization specification.

### 2. Centralized Components
All UI components come from the design system library (`src/ui/components/`). **Do not create custom button, input, or control variants.** Use existing components with their variant props:
- `Button` with `variant` and `size` props (not custom IconButton)
- `NumberInput` with `scrubbable: true` for numeric values
- `Dropdown`, `ColorInput`, `SliderControl`, `SegmentedControl`

### 3. Transient Updates
During interactive operations (scrubbing, dragging), updates are marked as transient (`skipHistory: true`) to avoid polluting undo history. The final value is committed on release.

### 4. Design Token Compliance
All styles use design tokens from `styles/modules/variables.css`. No hardcoded pixel values or colors.

---

## Quick Reference

### Section Visibility by Element Type

| Section | Shape | Text | Image | Group | Slide | Master |
|---------|-------|------|-------|-------|-------|--------|
| Position | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Layout | ✅ | ✅* | ✅ | ✅ | ✅ | ✅ |
| Appearance | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Typography | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Fill | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Stroke | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Effects | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Export | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Placeholder | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

*Text has additional resize mode controls

### Component Usage by Section

Each section document has a header indicating which design system components it uses:
```
> **Uses:** `Section`, `Button` (xs), `NumberInput` (scrubbable), `Dropdown`
> **DO NOT** create custom components. Use design system components with variants.
```

---

## Implementation Files

| Spec | Implementation |
|------|----------------|
| PropertyInspector | `src/ui/properties/PropertyInspector.js` |
| PositionSection | `src/ui/properties/PositionSection.js` |
| LayoutSection | `src/ui/properties/LayoutSection.js` |
| AppearanceSection | `src/ui/properties/AppearanceSection.js` |
| FillSection | `src/ui/properties/FillSection.js` |
| StrokeSection | `src/ui/properties/StrokeSection.js` |
| EffectsSection | `src/ui/properties/EffectsSection.js` |
| TextSection | `src/ui/properties/TextSection.js` |
| ExportSection | `src/ui/properties/ExportSection.js` |
| SlideSection | `src/ui/properties/SlideSection.js` |
| PlaceholderSection | `src/ui/properties/PlaceholderSection.js` |

---

## Implementation & Testing

| Document | Purpose |
|----------|---------|
| [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) | 4-phase implementation roadmap |
| [TEST-AUTOMATION-PLAN.md](./TEST-AUTOMATION-PLAN.md) | Comprehensive test automation strategy |

### Test Coverage Status

| Section | Unit Tests | Integration | E2E | Status |
|---------|------------|-------------|-----|--------|
| Position | ⬜ | ⬜ | ⬜ | Planned |
| Layout | ⬜ | ⬜ | ⬜ | Planned |
| Appearance | ✅ | ⬜ | ⬜ | Partial |
| Typography | ✅ | ⬜ | ⬜ | Partial |
| Fill | ✅ | ⬜ | ⬜ | Partial |
| Stroke | ✅ | ⬜ | ⬜ | Partial |
| Effects | ✅ | ⬜ | ⬜ | Partial |
| PI↔Viewport Sync | ⬜ | ⬜ | ⬜ | Critical |

---

## Related Documentation

- [Component Library](../component-library.md) - Design system components
- [Design Tokens Reference](../design-tokens-reference.md) - CSS variables
- [Automation Best Practices](../../../automation/02-best-practices.md) - Testing patterns
- [Automation-Driven Debugging](../../../automation/06-automation-driven-debugging.md) - Debug workflow
- Legacy specs archived in `../property-inspector/`

---

## Specification Score

| Metric | Score |
|--------|-------|
| Completeness | 95/100 |
| Implementation Alignment | 96/100 |
| Accessibility (ARIA) | 85/100 |
| Test Documentation | 90/100 |

See [EVALUATION-REPORT.md](./EVALUATION-REPORT.md) for detailed assessment (if retained).
