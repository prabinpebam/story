# Implementation Plan: Color Theme Manager

This plan details the implementation of the Color Theme Manager panel as specified in `color-theme-manager.md`.

---

## Principles
- **Small Incremental Steps:** Each phase should be testable independently.
- **Non-breaking:** Existing color/fill functionality must remain operational.
- **Design System:** Use existing components (`ColorInput`, `Dropdown`, `IconButton`, `Flyout`, `Section`) and create new ones only if necessary.
- **Validation:** Verify against the spec at each step.

---

## Prerequisites

Before starting this implementation, ensure:
1. **DraggablePanel component exists** (from Phase 12 of slide-master-implementation-plan.md)
2. **PanelManager service exists** (from Phase 12)
3. **Theme color schema is expanded** to 12 colors (from Phase 11.1)

---

## Phase 1: Foundation & Data
**Goal:** Establish presets and data structures.

### 1.1 Create Color Presets
**Estimated Time:** 2-3 hours  
**Risk Level:** Low  
**Dependencies:** None

**Tasks:**
1. **Create Presets File:**
   - File: `src/core/constants/ColorPresets.js` (new)
   
2. **Define Preset Schema:**
   ```javascript
   export const COLOR_PRESETS = [
     {
       id: "modern-dark",
       name: "Modern Dark",
       category: "dark",
       colors: {
         background1: "#1E1E1E",
         background2: "#2D2D2D",
         text1: "#FFFFFF",
         text2: "#AAAAAA",
         accent1: "#18A0FB",
         accent2: "#7B61FF",
         accent3: "#1BC47D",
         accent4: "#F24822",
         accent5: "#FFBE0B",
         accent6: "#FF006E",
         hyperlink: "#18A0FB",
         followedHyperlink: "#7B61FF"
       }
     },
     // ... 15+ more presets
   ];
   
   export const COLOR_CATEGORIES = [
     { id: "all", name: "All" },
     { id: "professional", name: "Professional" },
     { id: "creative", name: "Creative" },
     { id: "dark", name: "Dark" },
     { id: "light", name: "Light" },
     { id: "minimal", name: "Minimal" },
     { id: "colorful", name: "Colorful" }
   ];
   ```

3. **Create 16+ Presets:**
   - Professional: Corporate Blue, Executive, Professional Gray
   - Creative: Sunset Gradient, Ocean Breeze, Forest Green
   - Dark: Modern Dark, Midnight, Deep Purple
   - Light: Classic Light, Soft Pastels
   - Minimal: Pure White, Soft Gray, Paper
   - Colorful: Vibrant, Rainbow, Neon

**Validation Checklist:**
- [ ] File loads without errors
- [ ] All presets have valid color values
- [ ] Categories are properly defined

### 1.2 Store Actions for Theme Colors
**Estimated Time:** 1-2 hours  
**Risk Level:** Medium  
**Dependencies:** Phase 11.1 (expanded schema)

**Tasks:**
1. **Verify `UPDATE_THEME_SETTINGS` Action:**
   - File: `src/core/store/handlers/MasterHandlers.js`
   - Should support updating all 12 color roles
   - Should trigger re-render

2. **Add `APPLY_COLOR_PRESET` Action:**
   ```javascript
   export function handleApplyColorPreset(draft, payload) {
     const { masterId, preset } = payload;
     const master = draft.masters[masterId];
     if (master && master.type === 'theme') {
       master.themeSettings.colors = { ...preset.colors };
     }
   }
   ```

3. **Add `RESET_THEME_COLORS` Action:**
   ```javascript
   export function handleResetThemeColors(draft, payload) {
     const { masterId, defaultPreset } = payload;
     // Reset to default preset colors
   }
   ```

**Validation Checklist:**
- [ ] `UPDATE_THEME_SETTINGS` works for all 12 colors
- [ ] `APPLY_COLOR_PRESET` applies all colors at once
- [ ] Changes trigger canvas re-render

---

## Phase 2: Panel UI Structure
**Goal:** Create the panel shell with tab navigation.

### 2.1 Create ColorThemeManager Component
**Estimated Time:** 3-4 hours  
**Risk Level:** Low  
**Dependencies:** DraggablePanel, PanelManager

**Tasks:**
1. **Create Component:**
   - File: `src/ui/panels/ColorThemeManager.js` (new)
   
2. **Implementation:**
   ```javascript
   import { DraggablePanel } from '../components/DraggablePanel.js';
   import { panelManager } from '../PanelManager.js';
   import { SegmentedControl } from '../components/SegmentedControl.js';
   
   export class ColorThemeManager extends DraggablePanel {
     constructor() {
       super({
         id: 'color-theme-manager',
         title: 'Color Theme Manager',
         defaultWidth: 320,
         defaultHeight: 480,
         minWidth: 280,
         minHeight: 400
       });
       
       this.activeTab = 'presets';
       this.createTabs();
       this.createContent();
       this.createFooter();
     }
     
     createTabs() {
       this.tabControl = new SegmentedControl({
         options: [
           { value: 'presets', label: 'Presets' },
           { value: 'custom', label: 'Custom' },
           { value: 'ai', label: 'AI' }
         ],
         value: 'presets',
         onChange: (tab) => this.switchTab(tab)
       });
       this.header.appendChild(this.tabControl.element);
     }
     
     createContent() {
       this.contentArea = document.createElement('div');
       this.contentArea.className = 'ctm-content';
       this.body.appendChild(this.contentArea);
       
       this.presetsTab = this.createPresetsTab();
       this.customTab = this.createCustomTab();
       this.aiTab = this.createAITab();
       
       this.switchTab('presets');
     }
     
     createFooter() {
       // Apply and Save buttons
     }
     
     switchTab(tab) {
       this.activeTab = tab;
       // Show/hide tab content
     }
   }
   ```

3. **CSS Styling:**
   - File: `styles/modules/color-theme-manager.css` (new)
   - Panel layout, tab styling, content areas

**Validation Checklist:**
- [ ] Panel opens and closes
- [ ] Tabs switch correctly
- [ ] Panel is draggable and resizable
- [ ] Styling matches design system

### 2.2 Register Panel
**Estimated Time:** 30 minutes  
**Risk Level:** Low

**Tasks:**
1. **Register with PanelManager:**
   ```javascript
   // In main.js or initialization
   import { ColorThemeManager } from './ui/panels/ColorThemeManager.js';
   import { panelManager } from './ui/PanelManager.js';
   
   const colorThemeManager = new ColorThemeManager();
   panelManager.register('color-theme-manager', colorThemeManager);
   ```

**Validation Checklist:**
- [ ] Panel can be opened via `panelManager.open('color-theme-manager')`
- [ ] Panel appears in correct position

---

## Phase 3: Presets Tab
**Goal:** Implement preset browsing and application.

### 3.1 Preset Grid UI
**Estimated Time:** 3-4 hours  
**Risk Level:** Low

**Tasks:**
1. **Search Input:**
   ```javascript
   createSearchInput() {
     const search = document.createElement('input');
     search.type = 'text';
     search.placeholder = 'Search themes...';
     search.className = 'ctm-search';
     search.addEventListener('input', (e) => this.filterPresets(e.target.value));
     return search;
   }
   ```

2. **Category Filter:**
   ```javascript
   createCategoryFilter() {
     const dropdown = new Dropdown({
       options: COLOR_CATEGORIES.map(c => ({ value: c.id, label: c.name })),
       value: 'all',
       onChange: (category) => this.filterByCategory(category)
     });
     return dropdown;
   }
   ```

3. **Preset Card Component:**
   ```javascript
   createPresetCard(preset) {
     const card = document.createElement('div');
     card.className = 'ctm-preset-card';
     card.dataset.presetId = preset.id;
     
     // Color swatches row
     const swatches = document.createElement('div');
     swatches.className = 'ctm-swatches';
     Object.values(preset.colors).slice(0, 8).forEach(color => {
       const swatch = document.createElement('div');
       swatch.className = 'ctm-swatch';
       swatch.style.backgroundColor = color;
       swatches.appendChild(swatch);
     });
     
     // Name
     const name = document.createElement('div');
     name.className = 'ctm-preset-name';
     name.textContent = preset.name;
     
     card.appendChild(swatches);
     card.appendChild(name);
     
     // Events
     card.addEventListener('click', () => this.selectPreset(preset));
     card.addEventListener('dblclick', () => this.applyPreset(preset));
     
     return card;
   }
   ```

4. **Preset Grid:**
   ```javascript
   renderPresetGrid() {
     const grid = document.createElement('div');
     grid.className = 'ctm-preset-grid';
     
     const filteredPresets = this.getFilteredPresets();
     filteredPresets.forEach(preset => {
       grid.appendChild(this.createPresetCard(preset));
     });
     
     return grid;
   }
   ```

**Validation Checklist:**
- [ ] All presets display in grid
- [ ] Search filters presets by name
- [ ] Category filter works
- [ ] Click selects preset
- [ ] Double-click applies preset

### 3.2 Preset Selection & Preview
**Estimated Time:** 2-3 hours  
**Risk Level:** Medium

**Tasks:**
1. **Selection State:**
   ```javascript
   selectPreset(preset) {
     this.selectedPreset = preset;
     // Update card visual state
     this.updateCardSelection(preset.id);
     // Preview on canvas (temporary)
     this.previewPreset(preset);
   }
   ```

2. **Preview System:**
   ```javascript
   previewPreset(preset) {
     // Temporarily apply colors to canvas without saving to state
     const container = document.querySelector('.slide-container');
     Object.entries(preset.colors).forEach(([key, value]) => {
       container.style.setProperty(`--theme-${this.camelToKebab(key)}`, value);
     });
   }
   
   cancelPreview() {
     // Restore original colors from state
     this.restoreOriginalColors();
   }
   ```

3. **Apply Action:**
   ```javascript
   applyPreset(preset) {
     const state = store.getState();
     const masterId = this.getActiveMasterId(state);
     
     store.snapshot('Apply Color Preset');
     store.dispatch('APPLY_COLOR_PRESET', { masterId, preset });
     
     this.selectedPreset = null;
   }
   ```

**Validation Checklist:**
- [ ] Selecting preset shows preview on canvas
- [ ] Deselecting restores original colors
- [ ] Applying preset saves to state
- [ ] Undo works after applying preset

---

## Phase 4: Custom Tab
**Goal:** Implement manual color editing.

### 4.1 Color Role List
**Estimated Time:** 3-4 hours  
**Risk Level:** Medium

**Tasks:**
1. **Color Role Definitions:**
   ```javascript
   const COLOR_ROLES = [
     { key: 'background1', label: 'Background 1', group: 'background' },
     { key: 'background2', label: 'Background 2', group: 'background' },
     { key: 'text1', label: 'Text Primary', group: 'text' },
     { key: 'text2', label: 'Text Secondary', group: 'text' },
     { key: 'accent1', label: 'Accent 1', group: 'accent' },
     { key: 'accent2', label: 'Accent 2', group: 'accent' },
     { key: 'accent3', label: 'Accent 3', group: 'accent' },
     { key: 'accent4', label: 'Accent 4', group: 'accent' },
     { key: 'accent5', label: 'Accent 5', group: 'accent' },
     { key: 'accent6', label: 'Accent 6', group: 'accent' },
     { key: 'hyperlink', label: 'Hyperlink', group: 'semantic' },
     { key: 'followedHyperlink', label: 'Followed Link', group: 'semantic' }
   ];
   ```

2. **Color Row Component:**
   ```javascript
   createColorRow(role, currentColor) {
     const row = document.createElement('div');
     row.className = 'ctm-color-row';
     
     // Label
     const label = document.createElement('span');
     label.className = 'ctm-color-label';
     label.textContent = role.label;
     
     // Swatch (clickable)
     const swatch = document.createElement('div');
     swatch.className = 'ctm-color-swatch';
     swatch.style.backgroundColor = currentColor;
     swatch.addEventListener('click', () => this.openColorPicker(role.key, swatch));
     
     // Hex value
     const hex = document.createElement('span');
     hex.className = 'ctm-color-hex';
     hex.textContent = currentColor;
     
     row.appendChild(label);
     row.appendChild(swatch);
     row.appendChild(hex);
     
     return row;
   }
   ```

3. **Grouped Sections:**
   ```javascript
   createCustomTab() {
     const container = document.createElement('div');
     container.className = 'ctm-custom-tab';
     
     // Group colors by type
     const groups = {
       background: 'Background Colors',
       text: 'Text Colors',
       accent: 'Accent Colors',
       semantic: 'Semantic Colors'
     };
     
     const currentColors = this.getCurrentThemeColors();
     
     Object.entries(groups).forEach(([groupKey, groupLabel]) => {
       const section = document.createElement('div');
       section.className = 'ctm-color-section';
       
       const header = document.createElement('h4');
       header.textContent = groupLabel;
       section.appendChild(header);
       
       const roles = COLOR_ROLES.filter(r => r.group === groupKey);
       roles.forEach(role => {
         section.appendChild(this.createColorRow(role, currentColors[role.key]));
       });
       
       container.appendChild(section);
     });
     
     // Reset button
     const resetBtn = document.createElement('button');
     resetBtn.className = 'ctm-reset-btn';
     resetBtn.textContent = 'Reset to Default';
     resetBtn.addEventListener('click', () => this.resetColors());
     container.appendChild(resetBtn);
     
     return container;
   }
   ```

**Validation Checklist:**
- [ ] All 12 colors displayed in groups
- [ ] Current values shown correctly
- [ ] Visual grouping clear

### 4.2 Color Picker Integration
**Estimated Time:** 2-3 hours  
**Risk Level:** Low

**Tasks:**
1. **Open Color Picker:**
   ```javascript
   openColorPicker(colorKey, triggerElement) {
     // Use existing ColorPicker/FillFlyout component
     const picker = new ColorPicker({
       trigger: triggerElement,
       initialColor: this.getCurrentColor(colorKey),
       onChange: (color) => this.updateColor(colorKey, color),
       onClose: () => this.colorPickerClosed()
     });
     picker.open();
   }
   ```

2. **Update Color:**
   ```javascript
   updateColor(colorKey, color) {
     const state = store.getState();
     const masterId = this.getActiveMasterId(state);
     
     store.dispatch('UPDATE_THEME_SETTINGS', {
       id: masterId,
       settings: {
         colors: { [colorKey]: color }
       }
     });
     
     // Update UI
     this.refreshCustomTab();
   }
   ```

3. **Reset Colors:**
   ```javascript
   resetColors() {
     if (confirm('Reset all colors to default?')) {
       const state = store.getState();
       const masterId = this.getActiveMasterId(state);
       const defaultPreset = COLOR_PRESETS.find(p => p.id === 'modern-dark');
       
       store.snapshot('Reset Theme Colors');
       store.dispatch('APPLY_COLOR_PRESET', { masterId, preset: defaultPreset });
       
       this.refreshCustomTab();
     }
   }
   ```

**Validation Checklist:**
- [ ] Clicking swatch opens color picker
- [ ] Color changes update immediately
- [ ] Hex value updates in UI
- [ ] Reset confirms and restores defaults

---

## Phase 5: AI Tab (Skeleton)
**Goal:** Create UI for future AI integration.

### 5.1 Image Drop Zone
**Estimated Time:** 2-3 hours  
**Risk Level:** Low

**Tasks:**
1. **Drop Zone UI:**
   ```javascript
   createImageDropZone() {
     const dropZone = document.createElement('div');
     dropZone.className = 'ctm-drop-zone';
     
     const icon = document.createElement('span');
     icon.className = 'ctm-drop-icon';
     icon.innerHTML = '📷'; // Or use icon component
     
     const text = document.createElement('span');
     text.className = 'ctm-drop-text';
     text.textContent = 'Drop image here or click to upload';
     
     dropZone.appendChild(icon);
     dropZone.appendChild(text);
     
     // Drag events
     dropZone.addEventListener('dragover', (e) => {
       e.preventDefault();
       dropZone.classList.add('drag-over');
     });
     
     dropZone.addEventListener('dragleave', () => {
       dropZone.classList.remove('drag-over');
     });
     
     dropZone.addEventListener('drop', (e) => {
       e.preventDefault();
       dropZone.classList.remove('drag-over');
       const file = e.dataTransfer.files[0];
       if (file && file.type.startsWith('image/')) {
         this.handleImageUpload(file);
       }
     });
     
     // Click to upload
     dropZone.addEventListener('click', () => {
       const input = document.createElement('input');
       input.type = 'file';
       input.accept = 'image/*';
       input.onchange = (e) => {
         if (e.target.files[0]) {
           this.handleImageUpload(e.target.files[0]);
         }
       };
       input.click();
     });
     
     return dropZone;
   }
   ```

2. **Image Upload Handler (Placeholder):**
   ```javascript
   handleImageUpload(file) {
     // For now, show "Coming soon" message
     // Future: Extract colors using canvas and k-means
     this.showAIPlaceholder('Image color extraction coming soon!');
   }
   ```

**Validation Checklist:**
- [ ] Drop zone renders correctly
- [ ] Drag-over state works
- [ ] Click opens file picker
- [ ] Placeholder message shows

### 5.2 AI Prompt Area
**Estimated Time:** 1-2 hours  
**Risk Level:** Low

**Tasks:**
1. **Prompt Input:**
   ```javascript
   createAIPromptArea() {
     const container = document.createElement('div');
     container.className = 'ctm-ai-prompt';
     
     const label = document.createElement('label');
     label.textContent = 'Describe the theme you want:';
     
     const textarea = document.createElement('textarea');
     textarea.className = 'ctm-ai-textarea';
     textarea.placeholder = 'A warm, autumnal palette with rich oranges and deep browns...';
     textarea.rows = 4;
     
     const styleHint = new Dropdown({
       options: [
         { value: 'auto', label: 'Auto' },
         { value: 'professional', label: 'Professional' },
         { value: 'creative', label: 'Creative' },
         { value: 'playful', label: 'Playful' },
         { value: 'elegant', label: 'Elegant' }
       ],
       value: 'auto'
     });
     
     const generateBtn = document.createElement('button');
     generateBtn.className = 'ctm-generate-btn';
     generateBtn.textContent = '✨ Generate Theme';
     generateBtn.disabled = true; // Disabled until AI integration
     generateBtn.addEventListener('click', () => {
       this.showAIPlaceholder('AI theme generation coming soon!');
     });
     
     container.appendChild(label);
     container.appendChild(textarea);
     container.appendChild(styleHint.element);
     container.appendChild(generateBtn);
     
     return container;
   }
   ```

**Validation Checklist:**
- [ ] Prompt textarea renders
- [ ] Style hint dropdown works
- [ ] Generate button shows placeholder message

---

## Phase 6: Entry Points
**Goal:** Add all access points to the panel.

### 6.1 Toolbar Button
**Estimated Time:** 1-2 hours  
**Risk Level:** Low

**Tasks:**
1. **Add Button to Toolbar:**
   - File: `src/ui/Toolbar.js`
   ```javascript
   createThemeButton() {
     const btn = new IconButton({
       icon: Icons.PALETTE, // Or appropriate icon
       title: 'Color Theme Manager (Ctrl+Shift+C)',
       onClick: () => panelManager.toggle('color-theme-manager')
     });
     return btn;
   }
   ```

2. **Position in Toolbar:**
   - Add between tools section and settings
   - Consider grouping with Typography Style Manager button

**Validation Checklist:**
- [ ] Button appears in toolbar
- [ ] Click toggles panel
- [ ] Tooltip shows correct shortcut

### 6.2 View Menu
**Estimated Time:** 30 minutes  
**Risk Level:** Low

**Tasks:**
1. **Add Menu Item:**
   - File: `src/ui/MenuBar.js` (if exists) or appropriate menu component
   - Add "Color Theme Manager" under View menu

**Validation Checklist:**
- [ ] Menu item appears
- [ ] Click opens panel

### 6.3 Property Inspector Links
**Estimated Time:** 1-2 hours  
**Risk Level:** Low

**Tasks:**
1. **Add to SlideSection:**
   - File: `src/ui/properties/SlideSection.js`
   ```javascript
   createThemeColorsLink() {
     const link = document.createElement('button');
     link.className = 'pi-link-btn';
     link.textContent = 'Customize Colors...';
     link.addEventListener('click', () => {
       panelManager.open('color-theme-manager');
     });
     return link;
   }
   ```

2. **Conditional Display:**
   - Show "Customize Colors..." in Master mode
   - Show "Edit Theme Colors..." in Edit mode

**Validation Checklist:**
- [ ] Link appears in Property Inspector
- [ ] Click opens panel
- [ ] Correct text based on mode

### 6.4 Keyboard Shortcut
**Estimated Time:** 30 minutes  
**Risk Level:** Low

**Tasks:**
1. **Register Shortcut:**
   - File: `src/core/InputManager.js`
   ```javascript
   // In keyboard handler
   if (e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
     e.preventDefault();
     panelManager.toggle('color-theme-manager');
   }
   ```

**Validation Checklist:**
- [ ] Ctrl+Shift+C toggles panel
- [ ] Does not conflict with other shortcuts

---

## Phase 7: Polish & Testing
**Goal:** Finalize implementation.

### 7.1 Accessibility
**Estimated Time:** 1-2 hours

**Tasks:**
1. ARIA labels on all interactive elements
2. Keyboard navigation within panel
3. Focus management when panel opens/closes

### 7.2 Error Handling
**Estimated Time:** 1 hour

**Tasks:**
1. Handle missing theme data gracefully
2. Validate color values
3. Fallback for failed operations

### 7.3 Performance
**Estimated Time:** 1 hour

**Tasks:**
1. Debounce search input
2. Lazy render preset cards
3. Minimize re-renders on color change

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Color picker conflicts | Medium | Low | Use existing component, test integration |
| State sync issues | High | Medium | Centralize through store, no local state |
| Performance with many presets | Low | Low | Virtual scrolling if needed |
| Theme not applying | High | Low | Test inheritance chain thoroughly |

---

## Timeline Estimate

| Phase | Hours | Dependencies |
|-------|-------|--------------|
| Phase 1: Foundation | 3-5 hrs | Expanded schema |
| Phase 2: Panel UI | 3-4 hrs | DraggablePanel |
| Phase 3: Presets Tab | 5-7 hrs | Phase 1, 2 |
| Phase 4: Custom Tab | 5-7 hrs | Phase 2 |
| Phase 5: AI Tab | 3-5 hrs | Phase 2 |
| Phase 6: Entry Points | 3-5 hrs | Phase 2 |
| Phase 7: Polish | 3-4 hrs | All |

**Total: 25-37 hours (3-5 days)**

---

## Testing Checklist

### Unit Tests
- [ ] Color preset loading
- [ ] Color value validation
- [ ] Store action handlers

### Integration Tests
- [ ] Preset application updates canvas
- [ ] Custom color changes persist
- [ ] Undo/redo works

### Manual Testing
- [ ] Open panel from all entry points
- [ ] Browse and filter presets
- [ ] Apply preset → All slides update
- [ ] Edit custom color → Live preview
- [ ] Reset colors → Defaults restored
- [ ] Close panel → State preserved
- [ ] Keyboard shortcut works

---

## Related Documents

- [Color Theme Manager Spec](../specs/design-system/color-theme-manager.md)
- [Slide Master Implementation Plan](./slide-master-implementation-plan.md)
- [UI Design System](../specs/design-system/ui-design-system.md)
