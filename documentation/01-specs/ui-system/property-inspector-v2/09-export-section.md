# Property Inspector - Export Section

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Implementation:** `src/ui/properties/ExportSection.js`  
> **Uses:** `Section`, `Button` (xs, primary), `NumberInput`, `Dropdown`  
> **DO NOT** create custom buttons or dropdowns. Use design system components with variants.

---

## 1. Overview

The Export section configures output settings for selected elements, allowing users to export elements in various formats, scales, and configurations. Multiple export presets can be defined to export the same element in different formats simultaneously.

### Section Header
- **Title:** "Export"
- **Actions:** Add Preset (+)
- **Collapsed by Default:** Yes (unless custom presets exist)

---

## 2. Layout Structure

### 2.1 With Presets

```
┌─────────────────────────────────────────────────────────────────┐
│  Export                                                 [+]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ 1x  ▾]  [         ]  [ PNG  ▾]  [−]   <- Preset Row 1       │
│  [ 2x  ▾]  [ @2x     ]  [ PNG  ▾]  [−]   <- Preset Row 2       │
│  [ 1x  ▾]  [         ]  [ SVG  ▾]  [−]   <- Preset Row 3       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Export Rectangle 19                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Default State

When no custom presets are defined, show one default preset:

```
┌─────────────────────────────────────────────────────────────────┐
│  Export                                                 [+]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ 1x  ▾]  [         ]  [ PNG  ▾]  [−]   <- Default preset     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Export Rectangle 19                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Export Preset Row

### 3.1 Row Elements (Left to Right)

| Element | Purpose | Type |
|---------|---------|------|
| Scale | Output resolution scale | Dropdown |
| Suffix | Filename suffix | Text input |
| Format | File format | Dropdown |
| Remove | Delete preset | Icon button |

### 3.2 Scale Options

| Value | Description |
|-------|-------------|
| 0.5x | Half resolution |
| 0.75x | Three-quarter resolution |
| 1x | Original size (default) |
| 1.5x | 1.5× resolution |
| 2x | Double resolution |
| 3x | Triple resolution |
| 4x | Quadruple resolution |
| 512w | Fixed width of 512px |
| 512h | Fixed height of 512px |

### 3.3 Format Options

| Format | Extension | Use Case |
|--------|-----------|----------|
| PNG | .png | Lossless with transparency |
| JPG | .jpg | Compressed photos |
| SVG | .svg | Vector graphics |
| PDF | .pdf | Documents, print |
| WEBP | .webp | Modern web format |

### 3.4 Suffix Behavior

| Scale | Auto-Suffix | Example Output |
|-------|-------------|----------------|
| 1x | (empty) | `icon.png` |
| 2x | @2x | `icon@2x.png` |
| 3x | @3x | `icon@3x.png` |
| Custom | User-defined | `icon-large.png` |

---

## 4. Export Button

### 4.1 Specification

| Property | Value |
|----------|-------|
| Label | "Export [Element Name]" |
| Variant | Secondary |
| Size | Medium |
| Width | Full width |
| Position | Below preset list |

### 4.2 Dynamic Label

```javascript
// Single selection
exportBtn.setLabel(`Export ${element.name || 'Layer'}`);

// Multi-selection
exportBtn.setLabel(`Export ${selection.length} Layers`);
```

### 4.3 Export Behavior

1. Click triggers export for **all** configured presets
2. Opens system file save dialog (or downloads directly)
3. Multiple presets → multiple files (or zipped)

---

## 5. Preset Data Structure

### 5.1 Single Preset

```javascript
preset = {
    scale: '1x',        // Scale factor
    format: 'png',      // Output format
    suffix: ''          // Filename suffix
};
```

### 5.2 Element Storage

```javascript
element.exportPresets = [
    { scale: '1x', format: 'png', suffix: '' },
    { scale: '2x', format: 'png', suffix: '@2x' },
    { scale: '1x', format: 'svg', suffix: '' }
];
```

---

## 6. Implementation Details

### 6.1 Adding Presets

```javascript
addPreset() {
    this.section.setCollapsed(false);
    const newPreset = { scale: '1x', format: 'png', suffix: '' };
    const newPresets = [...this.presets, newPreset];
    this.savePresets(newPresets);
}

savePresets(presets) {
    const state = store.getState();
    const elementId = this.selection[0];
    
    store.dispatch('UPDATE_ELEMENT', {
        id: elementId,
        exportPresets: presets
    });
}
```

### 6.2 Removing Presets

```javascript
removePreset(index) {
    const newPresets = this.presets.filter((_, i) => i !== index);
    this.savePresets(newPresets);
}
```

### 6.3 Updating Preset Property

```javascript
updatePreset(index, property, value) {
    const newPresets = [...this.presets];
    newPresets[index] = { ...newPresets[index], [property]: value };
    this.savePresets(newPresets);
}
```

---

## 7. Export Execution

### 7.1 Export Flow

```
User clicks "Export"
    │
    ├── Gather all presets
    │
    ├── For each preset:
    │   ├── Render element at specified scale
    │   ├── Convert to specified format
    │   └── Generate filename with suffix
    │
    ├── If single file:
    │   └── Open save dialog or download
    │
    └── If multiple files:
        ├── Option A: Open save dialog for each
        ├── Option B: Save all to selected folder
        └── Option C: Create zip archive
```

### 7.2 Rendering Pipeline

```javascript
async exportElement(element, preset) {
    // 1. Calculate dimensions
    const scale = this.parseScale(preset.scale, element);
    const width = element.width * scale;
    const height = element.height * scale;
    
    // 2. Render to canvas
    const canvas = await renderer.renderElement(element, { width, height });
    
    // 3. Convert to format
    const blob = await this.canvasToFormat(canvas, preset.format);
    
    // 4. Generate filename
    const filename = this.generateFilename(element, preset);
    
    return { blob, filename };
}
```

### 7.3 Format-Specific Options

| Format | Quality Option | Transparency |
|--------|----------------|--------------|
| PNG | Compression level | ✅ Supported |
| JPG | Quality (0-100%) | ❌ White background |
| SVG | N/A (vector) | ✅ Supported |
| PDF | N/A | ✅ Supported |
| WEBP | Quality (0-100%) | ✅ Supported |

---

## 8. Advanced Options

### 8.1 More Options Menu (Future)

Accessed via "..." button on each preset row:

| Option | Description |
|--------|-------------|
| Ignore overlapping layers | Export only selected layer content |
| Include bounding box | Add padding around element |
| Color Profile | sRGB / Display P3 |
| Background | Transparent / White / Custom |
| Compression | PNG optimization level |

### 8.2 Quality Setting (JPG/WEBP)

```javascript
// When format is JPG or WEBP
formatSelect.onChange = (format) => {
    if (format === 'jpg' || format === 'webp') {
        this.showQualitySlider(preset, index);
    } else {
        this.hideQualitySlider();
    }
};
```

---

## 9. Preview Section (Future)

### 9.1 Overview

Optional collapsible preview showing export result:

```
┌─────────────────────────────────────────────────────────────────┐
│  Preview                                                     ▼  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │   │
│  │  ▓▓▓▓▓▓▓▓ (Rendered Preview) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  256 × 256 px  •  1.2 KB                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Preview Features

| Feature | Description |
|---------|-------------|
| Live render | Updates as settings change |
| Checkerboard | Shows transparency |
| Dimensions | Actual pixel output size |
| File size | Estimated file size |
| Zoom/Pan | Navigate large previews |

---

## 10. Section Visibility

### 10.1 Auto-Collapse Logic

```javascript
update(selection) {
    const element = this.getElement(state, selection[0]);
    
    // Check if user has defined custom presets
    const hasCustomPresets = element.exportPresets && 
                             element.exportPresets.length > 0;
    
    // Collapse if no custom presets
    this.section.setCollapsed(!hasCustomPresets);
    
    // Always show at least default preset
    this.presets = element.exportPresets || [
        { scale: '1x', format: 'png', suffix: '' }
    ];
}
```

---

## 11. CSS Specifications

### 11.1 Preset Row

```css
.pi-row.export-row {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 8px;
    align-items: center;
}

.export-row .dropdown {
    min-width: 64px;
}

.export-row .text-input {
    flex: 1;
}
```

### 11.2 Export Button

```css
.export-btn {
    margin-top: var(--pi-spacing-row);
    width: 100%;
}
```

---

## 12. Edge Cases

### 12.1 No Selection

- Section hidden when no element selected

### 12.2 Group Selection

- Export renders entire group
- Nested elements included in output

### 12.3 Empty Element

- Transparent/white output
- May show warning

### 12.4 Very Large Elements

- Scale may be limited
- Memory warning for huge outputs

### 12.5 SVG Limitations

- Raster effects may not export cleanly
- Code fills may need special handling

---

## 13. Industry Benchmark Comparison

| Feature | Story | Figma | Sketch | Adobe XD |
|---------|-------|-------|--------|----------|
| Multiple Presets | ✅ | ✅ | ✅ | ✅ |
| Scale Options | ✅ | ✅ | ✅ | ✅ |
| Fixed Size (w/h) | ✅ | ✅ | ✅ | ❌ |
| PNG | ✅ | ✅ | ✅ | ✅ |
| JPG | ✅ | ✅ | ✅ | ✅ |
| SVG | ✅ | ✅ | ✅ | ✅ |
| PDF | ✅ | ✅ | ✅ | ✅ |
| WEBP | ✅ | ✅ | ✅ | ❌ |
| Preview | 🔮 | ❌ | ❌ | ❌ |
| Batch Export | 🔮 | ✅ | ✅ | ✅ |

---

## 14. Accessibility (ARIA)

### 14.1 ARIA Attributes by Control

| Control | Role | ARIA Attributes | Notes |
|---------|------|-----------------|-------|
| Add Preset (+) | `button` | `aria-label="Add export preset"` | Creates new row |
| Preset List | `list` | `aria-label="Export presets"` | Container for rows |
| Preset Row | `listitem` | `aria-label="Export preset 1: 1x PNG"` | Dynamic label |
| Scale Dropdown | `combobox` | `aria-label="Export scale"`, `aria-expanded`, `aria-haspopup="listbox"` | Scale selection |
| Suffix Input | `textbox` | `aria-label="Filename suffix"` | Text input |
| Format Dropdown | `combobox` | `aria-label="Export format"`, `aria-expanded`, `aria-haspopup="listbox"` | Format selection |
| Remove Button | `button` | `aria-label="Remove export preset"` | Destructive action |
| Export Button | `button` | `aria-label="Export Rectangle 19"` | Dynamic element name |

### 14.2 Section Container

```html
<section 
  aria-labelledby="export-section-heading"
  class="pi-section"
>
  <h3 id="export-section-heading" class="pi-section-header">
    Export
    <button aria-label="Add export preset">+</button>
  </h3>
  
  <div role="list" aria-label="Export presets">
    <!-- Preset rows -->
  </div>
  
  <button 
    class="export-btn"
    aria-label="Export Rectangle 19"
  >
    Export Rectangle 19
  </button>
</section>
```

### 14.3 Preset Row Accessibility

```html
<div 
  role="listitem" 
  aria-label="Export preset 1: 2x PNG with suffix @2x"
  class="pi-row export-row"
>
  <div role="combobox" aria-label="Export scale" aria-expanded="false">2x</div>
  <input type="text" aria-label="Filename suffix" value="@2x" />
  <div role="combobox" aria-label="Export format" aria-expanded="false">PNG</div>
  <button aria-label="Remove export preset">−</button>
</div>
```

### 14.4 Keyboard Navigation

| Key | Behavior |
|-----|----------|
| Tab | Move between presets and controls |
| Enter | Open dropdown, trigger export |
| Escape | Close dropdown |
| Arrow Up/Down | Navigate dropdown options |
| Delete | Remove focused preset (with confirmation) |
| Ctrl/Cmd+Shift+C | Copy selection as PNG to clipboard |

### 14.5 Screen Reader Announcements

- **Preset added:** "Export preset added. 2 presets total"
- **Preset removed:** "Export preset removed. 1 preset remaining"
- **Scale change:** "Export scale: 2x"
- **Format change:** "Export format: SVG"
- **Export started:** "Exporting Rectangle 19..."
- **Export complete:** "Export complete. 3 files saved"

### 14.6 Multi-Selection Export

When multiple elements are selected:

```html
<button 
  aria-label="Export 5 elements"
  aria-describedby="export-description"
>
  Export 5 elements
</button>
<span id="export-description" class="visually-hidden">
  This will export Rectangle 19, Circle 3, Text 7, Image 2, Group 1
</span>
```

---

## 15. Clipboard Export

### 15.1 Copy as PNG (Ctrl+Shift+C)

Quick clipboard export for pasting into other applications:

```javascript
async copySelectionAsPNG() {
    const selection = store.getState().editor.selection;
    if (!selection || selection.length === 0) return;
    
    try {
        // Render at 2x for high quality
        const canvas = await ExportPreviewRenderer.renderExportPreview(
            selection.map(id => this.getElement(state, id)),
            { scale: 2, maxWidth: 4096, maxHeight: 4096 }
        );
        
        // Convert to blob
        const blob = await new Promise(resolve => 
            canvas.toBlob(resolve, 'image/png')
        );
        
        // Copy to clipboard using Clipboard API
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
        
        console.log('Copied to clipboard as PNG');
    } catch (error) {
        console.error('Failed to copy as PNG:', error);
    }
}
```

### 15.2 Keyboard Shortcut Registration

```javascript
// Register in global keyboard handler
keyboardManager.register({
    key: 'c',
    modifiers: ['ctrl', 'shift'],
    action: () => this.copySelectionAsPNG(),
    description: 'Copy selection as PNG'
});
```

### 15.3 User Feedback

| State | Notification |
|-------|-------------|
| Success | Toast: "Copied to clipboard as PNG" (2s) |
| No selection | Toast: "No elements selected" (2s) |
| Clipboard denied | Toast: "Clipboard access denied" (3s) |
| Render failed | Toast: "Failed to copy - try exporting instead" (3s) |

### 15.4 Browser Support

- **Clipboard API:** Requires HTTPS or localhost
- **Fallback:** Show export dialog if clipboard unavailable
- **Safari:** May require user gesture (click, not just keyboard)

---

## 16. Future Enhancements

### 16.1 Planned
- [ ] **Export preview panel:** Live preview with size estimation
- [ ] **Batch export:** Export multiple selected elements at once

### 16.2 Considered
- [ ] **Export slices:** Define export regions independent of elements
- [ ] **Asset management:** Track exported versions
- [ ] **Cloud export:** Direct upload to CDN/storage
- [ ] **GIF/Video export:** Animated element export

---

## Next Section: [10 - Slide Section](./10-slide-section.md)
