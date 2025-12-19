# Property Inspector - Gaps, Risks & Roadmap

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)

---

## 1. Current Implementation Gaps

### 1.1 Critical Gaps (P0)

| Gap | Description | Impact | Effort |
|-----|-------------|--------|--------|
| **Multi-selection mixed display** | Many controls still show first/active values instead of truthful mixed indicators | User confusion / accidental edits | Medium |
| **Relative-delta semantics in mixed state** | Arrow/scrub should apply per-element deltas (preserve differences) per [17](./17-multi-selection-and-mixed-state.md) | Breaks Figma-referenced parity | High |
| **Undo batching for multi-selection** | Multi-select gestures must commit as a single undo step | Unusable undo history | High |
| **List editor row mapping (fills/strokes/effects)** | Multi-select list editors need stable row addressing + row-level mixed state | Accidental overwrites | High |
| **Export preset edit scope** | Preset edits are active-only today; scope must be explicit (no silent partial edits) | Confusing / error-prone | Low |
| **Corner radius multi-select** | Radius UI is first-element-only in multi-select; needs mixed-aware structured-property handling | Visible mismatch vs spec | Medium |
| **Distribute controls** | No even spacing distribution | Workflow gap | Medium |
| **Anchor point selector** | Cannot change transform origin | Limits rotation use | High |

### 1.2 High Priority Gaps (P1)

| Gap | Description | Impact | Effort |
|-----|-------------|--------|--------|
| **Multiple shadows** | Only one drop shadow per element | Figma-referenced parity for overlapping workflows | Medium |
| **Effect styles library** | Cannot save/apply effect presets | Workflow efficiency | High |
| **Export preview** | No preview of export output | Quality assurance | Medium |
| **Constraints system** | No responsive constraints | Advanced layouts | High |

**Notes**
- “Multiple shadows” is separate from the multi-select list-editor row-mapping gap above; both can be pursued independently.

### 1.3 Medium Priority Gaps (P2)

| Gap | Description | Impact | Effort |
|-----|-------------|--------|--------|
| **Arrow heads** | No stroke start/end markers | Vector editing | Medium |
| **Pattern fills** | No repeating pattern support | Design flexibility | High |
| **Mesh gradients** | No multi-point gradients | Advanced gradients | High |
| **Character styles** | Cannot save text formatting presets | Typography workflow | High |

### 1.4 Low Priority Gaps (P3)

| Gap | Description | Impact | Effort |
|-----|-------------|--------|--------|
| **Math expressions** | No calculation in inputs | Power user feature | Low |
| **Noise/texture effects** | No grain overlay | Visual effects | Medium |
| **Motion blur** | No directional blur | Animation support | Medium |
| **Variable font axes UI** | Basic slider UI only | Typography detail | Low |

---

## 2. Technical Debt

### 2.1 Code Quality Issues

| Issue | Location | Risk | Mitigation |
|-------|----------|------|------------|
| Legacy support code | `StrokeSection.js` | Maintenance burden | Migrate all data |
| Inline styles | Various sections | Inconsistency | Move to CSS classes |
| Event listener leaks | Flyout components | Memory issues | Proper cleanup |
| Duplicate code | Fill/Stroke rows | Maintenance | Extract shared component |

### 2.2 Architecture Issues

| Issue | Description | Risk | Mitigation |
|-------|-------------|------|------------|
| Tight store coupling | Sections directly access store | Testing difficulty | Introduce data layer |
| No section base class | Each section reimplements patterns | Inconsistency | Create abstract base |
| Flyout positioning | Manual positioning logic | Edge case bugs | Use positioning library |
| Theme cascade complexity | StyleResolver in multiple places | Inconsistent resolution | Centralize |

---

## 3. UX/UI Risks

### 3.1 Usability Risks

| Risk | Description | Likelihood | Mitigation |
|------|-------------|------------|------------|
| Information overload | Too many controls visible | Medium | Smart collapse/hide |
| Discoverability | Hidden features in flyouts | High | Better visual hints |
| Inconsistent states | Different behavior per context | Low | Comprehensive testing |
| Performance on large selections | Slow with many elements | Medium | Virtualization |

### 3.2 Visual Design Risks

| Risk | Description | Likelihood | Mitigation |
|------|-------------|------------|------------|
| Dark mode only | No light mode for PI | Medium | Add theme support |
| Density too high | Small targets, hard to click | Low | Configurable density |
| Icon ambiguity | Some icons unclear | Medium | Tooltips, labels |
| Color contrast | Some text hard to read | Low | WCAG audit |

---

## 4. Feature Comparison Matrix

### 4.1 vs. Figma

| Feature | Story | Figma | Gap |
|---------|-------|-------|-----|
| Position/Alignment | ✅ | ✅ | ⚠️ Target gaps: X/Y delta semantics + undo batching |
| Layout (Dimensions) | ✅ | ✅ | ⚠️ Target gaps: mixed display + per-element constrain ratios |
| Auto Layout | ❌ | ✅ | ❌ Major gap |
| Constraints | ❌ | ✅ | ❌ Major gap |
| Multiple Fills | ✅ | ✅ | ⚠️ Target gaps: multi-select list row mapping + mixed row state |
| Code Fills | ✅ | ❌ | ✅ Advantage |
| Video Fills | ✅ | ❌ | ✅ Advantage |
| Multiple Strokes | ✅ | ✅ | ⚠️ Target gaps: multi-select list row mapping + mixed row state |
| Multiple Effects | Partial | ✅ | ⚠️ Target gaps: stacking parity + list row mapping |
| Effect Styles | ❌ | ✅ | ❌ Gap |
| Variables/Modes | Partial | ✅ | ⚠️ Partial |
| Export Presets | ✅ | ✅ | ⚠️ Target gap: explicit scope strategy for multi-select |

### 4.2 vs. Keynote/PowerPoint

| Feature | Story | Keynote/PPT | Gap |
|---------|-------|-------------|-----|
| Slide Layouts | ✅ | ✅ | ✅ Parity |
| Master Editing | ✅ | ✅ | ✅ Parity |
| Placeholder System | ✅ | ✅ | ✅ Parity |
| Theme Colors | ✅ | ✅ | ✅ Parity |
| Light/Dark Mode | ✅ | Limited | ✅ Advantage |
| Typography Styles | ✅ | ✅ | ✅ Parity |
| Transitions | ❌ | ✅ | ❌ Major gap |
| Animations | ❌ | ✅ | ❌ Major gap |

---

## 5. Roadmap

### 5.1 Phase 1: Foundation (Current)

**Goal:** Stable, well-documented Property Inspector

- [x] All section implementations
- [x] Basic interactions
- [x] Theme integration
- [ ] Comprehensive spec documentation (this document)
- [ ] Test coverage to 90%

### 5.2 Phase 2: Parity (Q1 Next)

**Goal:** Match Figma core capabilities

| Feature | Priority | Effort | Status |
|---------|----------|--------|--------|
| Multi-select mixed display + semantics (core) | P0 | 2–4 weeks | Planned |
| Undo batching for multi-select gestures | P0 | 1–2 weeks | Planned |
| List editor row mapping (fills/strokes/effects) | P0 | 3–6 weeks | Planned |
| Export preset scope strategy | P0 | 1 week | Planned |
| Corner radius multi-select (structured property) | P0 | 1–2 weeks | Planned |
| Multiple shadows | P1 | 2 weeks | Planned |
| Distribute controls | P0 | 1 week | Planned |
| Effect styles | P1 | 3 weeks | Planned |
| Export preview | P1 | 2 weeks | Planned |

### 5.3 Phase 3: Advanced (Q2 Next)

**Goal:** Advanced layout and styling

| Feature | Priority | Effort | Status |
|---------|----------|--------|--------|
| Auto Layout | P0 | 8 weeks | Research |
| Constraints | P1 | 4 weeks | Research |
| Pattern fills | P2 | 3 weeks | Backlog |
| Arrow heads | P2 | 2 weeks | Backlog |

### 5.4 Phase 4: Polish (Q3 Next)

**Goal:** Professional polish and performance

| Feature | Priority | Effort | Status |
|---------|----------|--------|--------|
| Light mode theme | P2 | 2 weeks | Backlog |
| Math expressions | P3 | 1 week | Backlog |
| Performance optimization | P1 | 3 weeks | Backlog |
| Accessibility audit | P1 | 2 weeks | Backlog |

---

## 6. Testing Gaps

### 6.1 Unit Test Coverage

| Section | Current | Target | Status |
|---------|---------|--------|--------|
| PositionSection | ~80% | 95% | ⚠️ Needs work |
| LayoutSection | ~85% | 95% | ⚠️ Needs work |
| AppearanceSection | ~90% | 95% | ✅ Good |
| FillSection | ~70% | 95% | ⚠️ Needs work |
| StrokeSection | ~70% | 95% | ⚠️ Needs work |
| EffectsSection | ~75% | 95% | ⚠️ Needs work |
| TextSection | ~80% | 95% | ⚠️ Needs work |
| ExportSection | ~85% | 95% | ✅ Good |
| SlideSection | ~60% | 95% | ❌ Major gap |
| PlaceholderSection | ~70% | 95% | ⚠️ Needs work |

### 6.2 Integration Test Gaps

| Scenario | Tested | Priority |
|----------|--------|----------|
| Multi-selection editing | ❌ | P0 |
| Flyout interaction | Partial | P1 |
| Drag reorder | ❌ | P1 |
| Theme cascade | Partial | P0 |
| Master mode editing | ❌ | P1 |

### 6.3 E2E Test Gaps

| Flow | Tested | Priority |
|------|--------|----------|
| Create shape → Edit properties | ❌ | P0 |
| Add fill → Change color | ❌ | P1 |
| Export element | ❌ | P1 |
| Edit master layout | ❌ | P1 |

---

## 7. Documentation Gaps

### 7.1 Spec Documentation

| Document | Status | Priority |
|----------|--------|----------|
| Overview (this) | ✅ Complete | - |
| Architecture | ✅ Complete | - |
| Position Section | ✅ Complete | - |
| Layout Section | ✅ Complete | - |
| Appearance Section | ✅ Complete | - |
| Fill Section | ✅ Complete | - |
| Stroke Section | ✅ Complete | - |
| Effects Section | ✅ Complete | - |
| Typography Section | ✅ Complete | - |
| Export Section | ✅ Complete | - |
| Slide Section | ✅ Complete | - |
| Interactions | ✅ Complete | - |
| Gaps & Roadmap | ✅ Complete | - |

### 7.2 Developer Documentation

| Document | Status | Priority |
|----------|--------|----------|
| Component API reference | ❌ Missing | P1 |
| Contribution guide | ❌ Missing | P2 |
| Testing guide | ❌ Missing | P1 |
| Style guide | Partial | P2 |

---

## 8. Performance Metrics

### 8.1 Current Performance

| Metric | Current | Target |
|--------|---------|--------|
| Initial render time | ~50ms | <30ms |
| Update on selection change | ~20ms | <10ms |
| Flyout open time | ~30ms | <20ms |
| Large selection (100 elements) | ~200ms | <100ms |

### 8.2 Performance Risks

| Risk | Trigger | Impact |
|------|---------|--------|
| DOM bloat | Many fills/strokes | Slow render |
| Excessive re-renders | Frequent state changes | UI lag |
| Memory leaks | Long sessions | Browser slowdown |
| Large canvas render | Export preview | Memory spike |

---

## 9. Dependency Risks

### 9.1 Internal Dependencies

| Dependency | Risk | Mitigation |
|------------|------|------------|
| Store.js | Breaking changes | Version lock |
| StyleResolver | Complexity | Documentation |
| FontManager | Loading delays | Async handling |
| ThemePresets | Data structure changes | Migration scripts |

### 9.2 External Dependencies

| Dependency | Risk | Mitigation |
|------------|------|------------|
| Browser APIs | Compatibility | Polyfills |
| EyeDropper API | Chrome-only | Fallback |
| Web Fonts API | Loading issues | Timeout handling |

---

## 10. Success Criteria

### 10.1 For Phase 2 Completion

- [ ] All P0 gaps addressed
- [ ] Test coverage > 90%
- [ ] No critical bugs in production
- [ ] Figma-referenced parity for core overlapping PI behaviors

### 10.2 For V2.0 Release

- [ ] All spec documents complete
- [ ] All P1 gaps addressed
- [ ] Performance targets met
- [ ] Accessibility audit passed
- [ ] User acceptance testing complete

---

## 11. Archive Reference

The following legacy spec files are superseded by this specification:

| Old File | Superseded By |
|----------|---------------|
| `property-inspector-ui.md` | `00-overview.md`, `01-architecture.md` |
| `property-inspector-position.md` | `02-position-section.md` |
| `property-inspector-layout-appearance.md` | `03-layout-section.md`, `04-appearance-section.md` |
| `property-inspector-fill.md` | `05-fill-section.md` |
| `property-inspector-stroke.md` | `06-stroke-section.md` |
| `property-inspector-effects.md` | `07-effects-section.md` |
| `property-inspector-typography.md` | `08-typography-section.md` |
| `property-inspector-export.md` | `09-export-section.md` |
| `property-inspector-slide.md` | `10-slide-section.md` |

These files should be moved to an archive folder.

---

## Document End

This comprehensive specification provides the foundation for Property Inspector development. Regular updates should be made as features are implemented and gaps are addressed.

**Next Review Date:** 2025 Q1  
**Document Owner:** Design System Team
