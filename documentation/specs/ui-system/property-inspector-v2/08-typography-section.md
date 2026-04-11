# Property Inspector - Typography Section

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Implementation:** `src/ui/properties/TextSection.js`  
> **Uses:** `Section`, `Button` (xs), `NumberInput` (scrubbable), `Dropdown`, `SegmentedControl`, `ColorInput`  
> **DO NOT** create custom font pickers, inputs, or alignment toggles. Use design system components with variants.

---

## 1. Overview

The Typography section controls text formatting properties for selected text elements. It includes font selection, spacing controls, alignment, text styles, and advanced typographic settings. This section only appears when a text element is selected.

### Section Header
- **Title:** "Typography"
- **Actions:** None (inline style selector)
- **Collapsed by Default:** No

---

## 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Typography                                                  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ Body Text            ▾]  [⋮]         <- Text Style Row      │
│  ⚠ Style has local overrides  [Reset]   <- Override Indicator  │
│                                                                 │
│  [ Inter        ▾] [ Regular  ▾] [ 16 ]  <- Font Row           │
│                                                                 │
│  [■] #000000  100%                       <- Fill Row           │
│                                                                 │
│  LH [  1.2  ]    LS [  0   ] %           <- Spacing Row        │
│                                                                 │
│  [⫷][⫶][⫸] [⊤][⊥][⊥]  [⚙]             <- Alignment Row       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Text Styles

### 3.1 Style Selector Row

| Element | Purpose |
|---------|---------|
| Style Dropdown | Select predefined text style |
| Style Menu Button | Edit/Detach options (when style applied) |

### 3.2 Style Dropdown Options

| Option | Action |
|--------|--------|
| No Style | Remove style link |
| Header 1 | Apply H1 style |
| Header 2 | Apply H2 style |
| Body | Apply body text style |
| Caption | Apply caption style |
| Create Style... | Save current properties as new style |

### 3.3 Style Override Indicator

When a style is applied but properties are locally modified:

```html
<div class="pi-style-override">
    <span>Style has local overrides</span>
    <button class="btn-reset">Reset</button>
</div>
```

### 3.4 Style Menu Options

| Option | Action |
|--------|--------|
| Edit Style | Open style editor (affects all instances) |
| Detach Style | Keep values but remove style link |
| Reset to Style | Revert local overrides |

### 3.5 Implementation

```javascript
applyTextStyle(styleId) {
    if (!styleId) {
        // Remove style
        this.updateProperty('textStyleId', null);
        return;
    }
    
    const style = getTextStyle(styleId);
    const updates = {
        textStyleId: styleId,
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        fontSize: style.fontSize,
        // ... other properties
    };
    
    this.updateMultipleProperties(updates);
}
```

---

## 4. Font Controls

### 4.1 Font Row Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [ Inter        ▾]  [ Regular  ▾]  [ 16 ]                      │
│   ^Font Family       ^Font Weight   ^Font Size                 │
│   (2fr)              (1fr)          (1fr)                      │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Font Family Dropdown

| Property | Value |
|----------|-------|
| Default | Inter |
| Options | All available system + loaded fonts |
| Behavior | Loads font on selection if needed |

### 4.3 Font Weight Dropdown

| Weight | Label |
|--------|-------|
| 100 | Thin |
| 200 | Extra Light |
| 300 | Light |
| 400 | Regular |
| 500 | Medium |
| 600 | Semi Bold |
| 700 | Bold |
| 800 | Extra Bold |
| 900 | Black |

**Note:** Available weights depend on selected font family.

### 4.4 Font Size Input

| Property | Value |
|----------|-------|
| Default | 16 |
| Range | 1 - 9999 |
| Units | px (display only, stored as number) |
| Scrubbable | Yes |

---

## 5. Text Fill

### 5.1 Fill Control

Text elements have a simplified fill control (single fill only):

```
┌─────────────────────────────────────────────────────────────────┐
│  [■] #000000  100%                                             │
│   ^Swatch     ^Hex    ^Opacity                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Fill Types Supported

| Type | Support |
|------|---------|
| Solid | ✅ Full |
| Gradient | ✅ Full |
| Image | ✅ Full |
| Video | ✅ Full |
| Code | ✅ Full |

### 5.3 Fill Flyout

Clicking the swatch opens the same Fill Flyout used in the Fill section, but:
- **Constraint:** Only one fill layer allowed
- **Default:** Solid black (#000000)

---

## 6. Spacing Controls

### 6.1 Line Height

| Property | Value |
|----------|-------|
| Label | "LH" |
| Default | 1.2 (or "Auto") |
| Range | 0.5 - 10 (as multiplier) |
| Units | Unitless multiplier of font size |
| Step | 0.1 |

### 6.2 Letter Spacing

| Property | Value |
|----------|-------|
| Label | "LS" |
| Default | 0 |
| Range | -100% to 200% |
| Units | % |
| Step | 0.1 |

### 6.3 Implementation

```javascript
this.lineHeightInput = new NumberInput({
    label: 'LH',
    value: 1.2,
    step: 0.1,
    onChange: (val) => this.updateProperty('lineHeight', val)
});

this.letterSpacingInput = new NumberInput({
    label: 'LS',
    value: 0,
    step: 0.1,
    units: '%',
    onChange: (val) => this.updateProperty('letterSpacing', val + '%')
});
```

---

## 7. Alignment Controls

### 7.1 Alignment Row Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [⫷][⫶][⫸]  [⊤][⊥][⊥]  [⚙]                                    │
│   ^H-Align    ^V-Align   ^Settings                             │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Horizontal Alignment

| Button | Value | Description |
|--------|-------|-------------|
| Align Left | `left` | Text aligns to left edge |
| Align Center | `center` | Text centers horizontally |
| Align Right | `right` | Text aligns to right edge |

### 7.3 Vertical Alignment

| Button | Value | Description |
|--------|-------|-------------|
| Align Top | `top` | Text aligns to top of box |
| Align Middle | `middle` | Text centers vertically |
| Align Bottom | `bottom` | Text aligns to bottom of box |

### 7.4 Alignment as Resize Anchor

For text elements in Auto Size or Fixed Width mode:
- Horizontal alignment determines horizontal anchor point
- Vertical alignment determines vertical anchor point

**See:** Layout Section § Alignment-Based Anchoring

---

## 8. Type Settings Flyout

### 8.1 Opening

Click the Settings icon (⚙) in the alignment row.

### 8.2 Flyout Tabs

| Tab | Content |
|-----|---------|
| Basics | Common formatting options |
| Details | Advanced typography (OpenType) |
| Variable | Variable font axes (when applicable) |

### 8.3 Basics Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Basics  |  Details  |  Variable                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Justify Alignment:  [⫷⫶⫸▤]                                    │
│                                                                 │
│  Text Decoration:    [T̲] Underline  [T̶] Strikethrough         │
│                                                                 │
│  Letter Case:        [aA] [A] [a] [Aa]                         │
│                      SmCap Upper Lower Title                    │
│                                                                 │
│  Vertical trim:      [ Cap Height    ▾]                        │
│                                                                 │
│  Paragraph spacing:  [   10   ]                                │
│                                                                 │
│  Paragraph indent:   [    0   ]                                │
│                                                                 │
│  Lists:              [•≡] [1≡]                                 │
│                      Bullet Numbered                            │
│                                                                 │
│  List spacing:       [   10   ]                                │
│                                                                 │
│  Truncate text:      [ OFF ]                                   │
│                                                                 │
│  Max lines:          [  —  ] (disabled when truncate off)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 Details Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Basics  |  Details  |  Variable                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NUMERALS                                                       │
│  Figure Style:       [ Proportional  ▾]                        │
│  Position:           [ Normal        ▾]                        │
│  Fractions:          [ OFF ]                                   │
│                                                                 │
│  OPENTYPE FEATURES                                             │
│  Ligatures:          [ Standard      ▾]                        │
│  Stylistic Sets:     [ None          ▾]                        │
│  Contextual Alts:    [ ON  ]                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.5 Variable Tab

Only visible when a variable font is selected:

```
┌─────────────────────────────────────────────────────────────────┐
│  Basics  |  Details  |  Variable                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Weight:             [═══════●═════]  500                      │
│  Width:              [═══════●═════]  100                      │
│  Slant:              [●════════════]   0                       │
│  Grade:              [═════●═══════]   0                       │
│  Optical Size:       [═════════●═══]  14                       │
│                                                                 │
│  (Axes vary by font)                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Text Properties Data Model

### 9.1 Element Structure

```javascript
textElement = {
    id: 'text-1',
    type: 'text',
    x: 100, y: 200,
    width: 300, height: 150,
    resizing: 'fixedWidth',     // autoSize, fixedWidth, fixed
    style: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 1.2,
        letterSpacing: '0%',
        textAlign: 'left',      // left, center, right, justify
        verticalAlign: 'top',   // top, middle, bottom
        fills: [{ type: 'solid', color: '#000000', opacity: 100 }],
        textDecoration: 'none', // none, underline, line-through
        textTransform: 'none',  // none, uppercase, lowercase, capitalize
        paragraphSpacing: 10,
        paragraphIndent: 0,
        truncate: false,
        maxLines: null
    },
    textStyleId: 'body-text',   // Optional style reference
    content: 'Hello World'
};
```

---

## 10. Multi-Selection Behavior

Canonical mixed-state display + edit semantics are defined in:
- [17-multi-selection-and-mixed-state.md](./17-multi-selection-and-mixed-state.md)

This section uses the **Baseline vs Target** model from 17.

### 10.1 Same Properties

Display shared values, edits apply to all.

### 10.2 Mixed Properties

#### 10.2.1 Baseline (Current Story, non-breaking)

- Some fields MAY display the first/active element value when mixed.
- Editing a control MUST NOT silently apply to only the active element unless explicitly labeled “active only”.
- Alignment controls remain editable for multi-selection and for text linked to typography styles (intentional Story UX).

#### 10.2.2 Target (Figma-referenced parity for overlapping interactions)

| Property | Display when mixed | Edit behavior |
|----------|-------------------|---------------|
| Font family/weight | “Mixed” | Picking a value sets all (absolute set) |
| Font size/line height/letter spacing | `—` | Typing sets all (absolute); arrows/scrub apply relative delta (per-element start values) |
| Text alignment (H/V) | No button highlighted | Clicking an option sets all (absolute set) |
| Text fill (color/opacity) | Mixed indicator for text value; swatch visually mixed | Picking a color sets all (absolute); drag is transient; release commits |

**Known gap:** Text fill controls are implemented with a combination of raw DOM inputs and fill flyouts. Mixed display/edit semantics for multi-selection are not consistently implemented and must be validated against 17.

### 10.3 Non-Text in Selection

- Typography section hidden
- Or shows "Mixed selection" message

---

## 11. Text Editing Integration

### 11.1 Inline Editing Mode

When text is being edited inline (on canvas):
- PI reflects cursor position styles
- Changes apply to selection within text
- Pending styles tracked for next typed character

### 11.2 Pending Styles

```javascript
// User changes font to Bold while cursor is positioned
this.pendingStyles = { fontWeight: '700' };

// Next typed character inherits pending styles
textEditManager.applyPendingStyles(this.pendingStyles);
```

---

## 12. CSS Specifications

### 12.1 Style Row

```css
.pi-style-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

.pi-style-row .dropdown {
    flex: 1;
}
```

### 12.2 Override Indicator

```css
.pi-style-override {
    display: none;
    padding: 4px 8px;
    background: var(--color-warning-subtle);
    border-radius: 4px;
    font-size: 11px;
    color: var(--color-warning);
}

.pi-style-override.visible {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
```

### 12.3 Font Row Grid

```css
.pi-grid-row.cols-2-1-1 {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 8px;
}
```

### 12.4 Alignment Row

```css
.pi-align-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

.pi-btn-group {
    display: flex;
    gap: 2px;
}

.pi-btn-group .icon-button.active {
    background: var(--color-accent-subtle);
}
```

---

## 13. Industry Benchmark Comparison

| Feature | Story | Figma | Sketch | Adobe XD |
|---------|-------|-------|--------|----------|
| Font Family | ✅ | ✅ | ✅ | ✅ |
| Font Weight | ✅ | ✅ | ✅ | ✅ |
| Font Size | ✅ | ✅ | ✅ | ✅ |
| Line Height | ✅ | ✅ | ✅ | ✅ |
| Letter Spacing | ✅ | ✅ | ✅ | ✅ |
| Text Styles | ✅ | ✅ | ✅ | ✅ |
| Vertical Align | ✅ | ✅ | ✅ | ✅ |
| Variable Fonts | ✅ | ✅ | ✅ | ❌ |
| OpenType Features | ✅ | ✅ | ✅ | ❌ |
| Text Fills | ✅ (Single) | ✅ (Multiple) | ✅ | ✅ |
| Mixed Selection Styling | 🔮 | ✅ | ✅ | ❌ |

---

## 14. Accessibility (ARIA)

### 14.1 ARIA Attributes by Control

| Control | Role | ARIA Attributes | Notes |
|---------|------|-----------------|-------|
| Text Style Dropdown | `combobox` | `aria-label="Text style"`, `aria-expanded`, `aria-haspopup="listbox"` | Style selection |
| Style Menu Button | `button` | `aria-label="Text style options"`, `aria-haspopup="menu"` | Edit/Detach menu |
| Reset Button | `button` | `aria-label="Reset to style"` | Clears overrides |
| Font Family | `combobox` | `aria-label="Font family"`, `aria-expanded`, `aria-haspopup="listbox"` | Font selection |
| Font Weight | `combobox` | `aria-label="Font weight"`, `aria-expanded`, `aria-haspopup="listbox"` | Weight selection |
| Font Size | `spinbutton` | `aria-label="Font size"`, `aria-valuenow`, `aria-valuemin="1"` | Pixels |
| Color Swatch | `button` | `aria-label="Text color: #000000"`, `aria-haspopup="dialog"` | Opens color picker |
| Opacity Input | `spinbutton` | `aria-label="Text opacity"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` | Percentage |
| Line Height | `spinbutton` | `aria-label="Line height"`, `aria-valuenow` | Multiplier |
| Letter Spacing | `spinbutton` | `aria-label="Letter spacing"`, `aria-valuenow` | Percentage |
| Align Left | `radio` | `aria-label="Align left"`, `aria-checked` | Part of radio group |
| Align Center | `radio` | `aria-label="Align center"`, `aria-checked` | Part of radio group |
| Align Right | `radio` | `aria-label="Align right"`, `aria-checked` | Part of radio group |
| Align Top | `radio` | `aria-label="Align top"`, `aria-checked` | Part of radio group |
| Align Middle | `radio` | `aria-label="Align middle"`, `aria-checked` | Part of radio group |
| Align Bottom | `radio` | `aria-label="Align bottom"`, `aria-checked` | Part of radio group |
| Settings Button | `button` | `aria-label="Typography settings"`, `aria-haspopup="dialog"` | Opens flyout |

### 14.2 Section Container

```html
<section 
  aria-labelledby="typography-section-heading"
  class="pi-section"
>
  <h3 id="typography-section-heading" class="pi-section-header">Typography</h3>
  
  <!-- Text Style Row -->
  <div class="pi-style-row">
    <div role="combobox" aria-label="Text style" aria-expanded="false">
      Body Text
    </div>
    <button aria-label="Text style options" aria-haspopup="menu">⋮</button>
  </div>
  
  <!-- Override Indicator (when visible) -->
  <div role="alert" aria-live="polite" class="pi-style-override">
    Style has local overrides
    <button aria-label="Reset to style">Reset</button>
  </div>
  
  <!-- Alignment Groups -->
  <div role="radiogroup" aria-label="Horizontal alignment">...</div>
  <div role="radiogroup" aria-label="Vertical alignment">...</div>
</section>
```

### 14.3 Alignment Button Groups

```html
<!-- Horizontal Alignment -->
<div role="radiogroup" aria-label="Horizontal text alignment">
  <button role="radio" aria-checked="true" aria-label="Align left">⫷</button>
  <button role="radio" aria-checked="false" aria-label="Align center">⫶</button>
  <button role="radio" aria-checked="false" aria-label="Align right">⫸</button>
</div>

<!-- Vertical Alignment -->
<div role="radiogroup" aria-label="Vertical text alignment">
  <button role="radio" aria-checked="true" aria-label="Align top">⊤</button>
  <button role="radio" aria-checked="false" aria-label="Align middle">⊥</button>
  <button role="radio" aria-checked="false" aria-label="Align bottom">⊥</button>
</div>
```

### 14.4 Keyboard Navigation

| Key | Behavior |
|-----|----------|
| Tab | Move between control groups |
| Arrow Left/Right | Navigate within alignment groups |
| Arrow Up/Down | Adjust numeric values |
| Enter | Open dropdowns, confirm selection |
| Escape | Close dropdown/flyout |

### 14.5 Screen Reader Announcements

- **Style applied:** "Body Text style applied"
- **Override detected:** "Style has local overrides"
- **Reset:** "Style reset to Body Text"
- **Alignment change:** "Horizontal alignment: Center"
- **Font change:** "Font family: Inter"
- **Size change:** "Font size: 16 pixels"

### 14.6 Focus Management

- Font family dropdown opens with focus on search input
- Alignment buttons can be navigated with arrow keys within group
- Settings flyout traps focus until closed

---

## 15. Test Scenarios & Acceptance Criteria

> **Reference:** [TEST-AUTOMATION-PLAN.md](./TEST-AUTOMATION-PLAN.md) §4.5

### 15.1 Display Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| TXT-01 | Font family shows current font | Text with Inter font shows "Inter" in dropdown | P0 |
| TXT-02 | Font weight shows current weight | Bold text shows "Bold" in weight dropdown | P0 |
| TXT-03 | Font size shows current size | 16px text shows "16" in size input | P0 |
| TXT-04 | Line height shows value | Line height 1.5 shows "1.5" in input | P1 |
| TXT-05 | Letter spacing shows value | Letter spacing 2% shows "2" in input | P1 |
| TXT-06 | Text color shows in swatch | Red text shows red color swatch | P0 |

### 15.2 Font Selection Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| TXT-10 | Open font family dropdown | Click dropdown → font list appears with search | P0 |
| TXT-11 | Search filters fonts | Type "Inter" → list filters to matching fonts | P1 |
| TXT-12 | Select font applies change | Click "Roboto" → text changes to Roboto | P0 |
| TXT-13 | Font weight shows available | Select "Roboto" → weight shows available weights | P1 |
| TXT-14 | Change weight applies | Select "Bold" → text becomes bold | P0 |

### 15.3 Size & Spacing Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| TXT-20 | Type font size | Enter "24" in size → text becomes 24px | P0 |
| TXT-21 | Scrub font size | Drag on size label → size changes live | P1 |
| TXT-22 | Set line height | Enter "1.5" → line height applies | P1 |
| TXT-23 | Set letter spacing | Enter "5" → letters spaced apart | P1 |
| TXT-24 | Negative letter spacing | Enter "-2" → letters compressed | P2 |

### 15.4 Alignment Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| TXT-30 | Click align left | Click left button → text left-aligned | P0 |
| TXT-31 | Click align center | Click center button → text centered | P0 |
| TXT-32 | Click align right | Click right button → text right-aligned | P0 |
| TXT-33 | Click align top | Click top button → text top-aligned | P0 |
| TXT-34 | Click align middle | Click middle button → text vertically centered | P0 |
| TXT-35 | Click align bottom | Click bottom button → text bottom-aligned | P0 |
| TXT-36 | Alignment buttons exclusive | Click center → only center is active | P1 |

### 15.5 Text Style Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| TXT-40 | Select text style | Select "Header 1" → applies H1 styling | P1 |
| TXT-41 | Override shows indicator | Change font after style → "Override" badge appears | P1 |
| TXT-42 | Reset clears override | Click "Reset" → text reverts to style definition | P1 |
| TXT-43 | Detach removes style link | Click "Detach" → keeps values, removes link | P2 |
| TXT-44 | Create style from current | Click "Create Style" → dialog opens | P2 |

### 15.6 Advanced Settings Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| TXT-50 | Open settings flyout | Click gear icon → flyout opens | P2 |
| TXT-51 | Toggle bold | Click B button → text toggles bold | P1 |
| TXT-52 | Toggle italic | Click I button → text toggles italic | P1 |
| TXT-53 | Toggle underline | Click U button → text toggles underline | P2 |
| TXT-54 | Set uppercase | Click case → text transforms to uppercase | P2 |
| TXT-55 | Enable bullet list | Click bullet → text becomes bulleted list | P2 |

### 15.7 Sync Tests (PI ↔ Viewport)

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| TXT-60 | Font change updates canvas | Change font in PI → canvas text updates | P0 |
| TXT-61 | Canvas edit updates PI | Edit text on canvas → PI reflects changes | P0 |
| TXT-62 | Multi-select shows mixed | Select texts with different fonts → "–" shown | P1 |
| TXT-63 | Multi-select apply works | Select 3 texts → change font → all update | P0 |
| TXT-64 | Undo restores text | Undo font change → PI and canvas revert | P1 |

### 15.8 Edge Cases

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| TXT-70 | Empty text element | Empty text shows default/placeholder values | P2 |
| TXT-71 | Very long font name | Long font name truncates with ellipsis | P2 |
| TXT-72 | Font not available | Missing font shows warning indicator | P2 |
| TXT-73 | Character-level selection | Selected text range shows character styles | P2 |
| TXT-74 | Mixed character styles | Selected range with mixed styles shows "–" | P2 |

---

## 16. Future Enhancements

### 16.1 Planned
- [ ] **Rich text spans:** Different styles within single text element
- [ ] **Multiple text fills:** Match Figma's capability

### 16.2 Considered
- [ ] **Character styles:** Save character-level formatting
- [ ] **Auto-kerning adjustments:** Manual kern pair tuning
- [ ] **Baseline shift:** Sub/superscript positioning

---

## Next Section: [09 - Export Section](./09-export-section.md)
