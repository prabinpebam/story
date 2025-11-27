# Implementation Plan: Typography Style Manager

This plan details the implementation of the Typography Style Manager panel as specified in `typography-style-manager.md`.

---

## Principles
- **Small Incremental Steps:** Each phase should be testable independently.
- **Non-breaking:** Existing text editing functionality must remain operational.
- **Design System:** Use existing components (`Dropdown`, `NumberInput`, `IconButton`, `Flyout`, `Section`) and create new ones only if necessary.
- **Validation:** Verify against the spec at each step.

---

## Prerequisites

Before starting this implementation, ensure:
1. **DraggablePanel component exists** (from Phase 12 of slide-master-implementation-plan.md)
2. **PanelManager service exists** (from Phase 12)
3. **Typography styles schema is defined** in theme settings (from Phase 11.2)
4. **FontManager service** is functional for loading fonts

---

## Phase 1: Foundation & Data
**Goal:** Establish font presets and data structures.

### 1.1 Create Font Presets
**Estimated Time:** 3-4 hours  
**Risk Level:** Low  
**Dependencies:** None

**Tasks:**
1. **Create Presets File:**
   - File: `src/core/constants/FontPresets.js` (new)

2. **Define Preset Schema:**
   ```javascript
   export const FONT_PRESETS = [
     {
       id: "modern-clean",
       name: "Modern Clean",
       category: "sans-serif",
       fonts: {
         heading: { family: "Inter", weight: "700", fallback: "system-ui, sans-serif" },
         body: { family: "Inter", weight: "400", fallback: "system-ui, sans-serif" }
       },
       styles: {
         title: { fontSize: 44, fontWeight: "700", lineHeight: 1.2, letterSpacing: -0.02 },
         subtitle: { fontSize: 32, fontWeight: "400", lineHeight: 1.3 },
         bodyLevel1: { fontSize: 28, fontWeight: "400", lineHeight: 1.5 },
         bodyLevel2: { fontSize: 24, fontWeight: "400", lineHeight: 1.5 },
         bodyLevel3: { fontSize: 20, fontWeight: "400", lineHeight: 1.5 },
         bodyLevel4: { fontSize: 18, fontWeight: "400", lineHeight: 1.5 },
         bodyLevel5: { fontSize: 16, fontWeight: "400", lineHeight: 1.5 },
         caption: { fontSize: 14, fontWeight: "400", lineHeight: 1.4 }
       }
     },
     // ... 14+ more presets
   ];
   
   export const FONT_CATEGORIES = [
     { id: "all", name: "All" },
     { id: "sans-serif", name: "Sans Serif" },
     { id: "serif", name: "Serif" },
     { id: "mixed", name: "Mixed" },
     { id: "display", name: "Display" },
     { id: "monospace", name: "Monospace" }
   ];
   ```

3. **Create 15+ Presets:**
   - **Sans Serif:** Modern Clean, Geometric, Swiss, Tech Forward, Humanist
   - **Serif:** Editorial, Traditional, Literary, Elegant
   - **Mixed:** Professional Mix, Creative Mix, Contrast, Editorial Modern
   - **Display:** Bold Statement, Startup, Fashion
   - **Monospace:** Developer, Retro Tech, Code

4. **Font List for Dropdowns:**
   ```javascript
   export const AVAILABLE_FONTS = [
     // Sans Serif
     { family: "Inter", category: "sans-serif", weights: ["400", "500", "600", "700"] },
     { family: "Open Sans", category: "sans-serif", weights: ["400", "600", "700"] },
     { family: "Roboto", category: "sans-serif", weights: ["400", "500", "700"] },
     { family: "Poppins", category: "sans-serif", weights: ["400", "500", "600", "700"] },
     { family: "DM Sans", category: "sans-serif", weights: ["400", "500", "700"] },
     { family: "Space Grotesk", category: "sans-serif", weights: ["400", "500", "700"] },
     // Serif
     { family: "Playfair Display", category: "serif", weights: ["400", "700"] },
     { family: "Source Serif Pro", category: "serif", weights: ["400", "600", "700"] },
     { family: "Merriweather", category: "serif", weights: ["400", "700"] },
     { family: "Lora", category: "serif", weights: ["400", "600", "700"] },
     // Display
     { family: "Oswald", category: "display", weights: ["400", "500", "700"] },
     { family: "Bebas Neue", category: "display", weights: ["400"] },
     // Monospace
     { family: "JetBrains Mono", category: "monospace", weights: ["400", "700"] },
     { family: "Fira Code", category: "monospace", weights: ["400", "500", "700"] },
     // ... more fonts
   ];
   ```

**Validation Checklist:**
- [ ] File loads without errors
- [ ] All presets have valid structure
- [ ] Categories are properly defined
- [ ] Font list covers all preset fonts

### 1.2 Store Actions for Typography
**Estimated Time:** 2-3 hours  
**Risk Level:** Medium  
**Dependencies:** Phase 11.2 (typography schema)

**Tasks:**
1. **Verify `UPDATE_THEME_SETTINGS` Action:**
   - Should support updating `fonts` and `textStyles`
   - File: `src/core/store/handlers/MasterHandlers.js`

2. **Add `APPLY_FONT_PRESET` Action:**
   ```javascript
   export function handleApplyFontPreset(draft, payload) {
     const { masterId, preset } = payload;
     const master = draft.masters[masterId];
     if (master && master.type === 'theme') {
       master.themeSettings.fonts = { ...preset.fonts };
       master.themeSettings.textStyles = { ...preset.styles };
     }
   }
   ```

3. **Add `UPDATE_TEXT_STYLE` Action:**
   ```javascript
   export function handleUpdateTextStyle(draft, payload) {
     const { masterId, styleName, styleProps } = payload;
     const master = draft.masters[masterId];
     if (master && master.type === 'theme') {
       if (!master.themeSettings.textStyles) {
         master.themeSettings.textStyles = {};
       }
       master.themeSettings.textStyles[styleName] = {
         ...master.themeSettings.textStyles[styleName],
         ...styleProps
       };
     }
   }
   ```

4. **Register Actions in Store:**
   - Add to `Store.js` dispatch switch statement

**Validation Checklist:**
- [ ] `UPDATE_THEME_SETTINGS` works for fonts and styles
- [ ] `APPLY_FONT_PRESET` applies all settings
- [ ] `UPDATE_TEXT_STYLE` updates individual style
- [ ] Changes trigger canvas re-render

### 1.3 Font Loading Integration
**Estimated Time:** 2-3 hours  
**Risk Level:** Medium  
**Dependencies:** FontManager.js

**Tasks:**
1. **Verify FontManager:**
   - File: `src/core/FontManager.js`
   - Should have `loadFont(family, weights)` method
   - Should have `getLoadedFonts()` method

2. **Add Preset Font Pre-loading:**
   ```javascript
   // In FontPresets.js
   export function preloadPresetFonts(preset) {
     const fontsToLoad = [
       preset.fonts.heading,
       preset.fonts.body
     ];
     return Promise.all(fontsToLoad.map(font => 
       fontManager.loadFont(font.family)
     ));
   }
   ```

3. **Font Loading State:**
   ```javascript
   // Track loading state for UI feedback
   class FontLoadingTracker {
     constructor() {
       this.loadingFonts = new Set();
       this.loadedFonts = new Set();
       this.failedFonts = new Set();
     }
     
     startLoading(family) { this.loadingFonts.add(family); }
     finishLoading(family) { 
       this.loadingFonts.delete(family);
       this.loadedFonts.add(family);
     }
     failLoading(family) {
       this.loadingFonts.delete(family);
       this.failedFonts.add(family);
     }
     isLoading(family) { return this.loadingFonts.has(family); }
   }
   ```

**Validation Checklist:**
- [ ] Fonts load on demand
- [ ] Loading state tracked
- [ ] Error handling for failed loads
- [ ] Fallback fonts work

---

## Phase 2: Panel UI Structure
**Goal:** Create the panel shell with tab navigation.

### 2.1 Create TypographyStyleManager Component
**Estimated Time:** 3-4 hours  
**Risk Level:** Low  
**Dependencies:** DraggablePanel, PanelManager

**Tasks:**
1. **Create Component:**
   - File: `src/ui/panels/TypographyStyleManager.js` (new)

2. **Implementation:**
   ```javascript
   import { DraggablePanel } from '../components/DraggablePanel.js';
   import { panelManager } from '../PanelManager.js';
   import { SegmentedControl } from '../components/SegmentedControl.js';
   
   export class TypographyStyleManager extends DraggablePanel {
     constructor() {
       super({
         id: 'typography-style-manager',
         title: 'Typography Style Manager',
         defaultWidth: 360,
         defaultHeight: 560,
         minWidth: 320,
         minHeight: 450
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
       this.contentArea.className = 'tsm-content';
       this.body.appendChild(this.contentArea);
       
       this.presetsTab = this.createPresetsTab();
       this.customTab = this.createCustomTab();
       this.aiTab = this.createAITab();
       
       this.switchTab('presets');
     }
     
     createFooter() {
       const footer = document.createElement('div');
       footer.className = 'tsm-footer';
       
       const applyBtn = document.createElement('button');
       applyBtn.className = 'tsm-btn tsm-btn-primary';
       applyBtn.textContent = 'Apply to Presentation';
       applyBtn.addEventListener('click', () => this.applyCurrentSelection());
       
       const saveBtn = document.createElement('button');
       saveBtn.className = 'tsm-btn tsm-btn-secondary';
       saveBtn.textContent = 'Save Styles';
       saveBtn.addEventListener('click', () => this.saveCurrentStyles());
       
       footer.appendChild(applyBtn);
       footer.appendChild(saveBtn);
       this.element.appendChild(footer);
     }
     
     switchTab(tab) {
       this.activeTab = tab;
       // Hide all tabs
       [this.presetsTab, this.customTab, this.aiTab].forEach(t => {
         if (t) t.style.display = 'none';
       });
       // Show active tab
       switch(tab) {
         case 'presets': this.presetsTab.style.display = 'block'; break;
         case 'custom': this.customTab.style.display = 'block'; this.refreshCustomTab(); break;
         case 'ai': this.aiTab.style.display = 'block'; break;
       }
     }
   }
   ```

3. **CSS Styling:**
   - File: `styles/modules/typography-style-manager.css` (new)
   - Panel layout, font preview styling

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
   import { TypographyStyleManager } from './ui/panels/TypographyStyleManager.js';
   import { panelManager } from './ui/PanelManager.js';
   
   const typographyStyleManager = new TypographyStyleManager();
   panelManager.register('typography-style-manager', typographyStyleManager);
   ```

**Validation Checklist:**
- [ ] Panel can be opened via `panelManager.open('typography-style-manager')`

---

## Phase 3: Presets Tab
**Goal:** Implement preset browsing and application.

### 3.1 Preset List UI
**Estimated Time:** 4-5 hours  
**Risk Level:** Low

**Tasks:**
1. **Search and Filter:**
   ```javascript
   createPresetsTab() {
     const container = document.createElement('div');
     container.className = 'tsm-presets-tab';
     
     // Search
     const searchContainer = document.createElement('div');
     searchContainer.className = 'tsm-search-container';
     
     const searchInput = document.createElement('input');
     searchInput.type = 'text';
     searchInput.placeholder = 'Search style sets...';
     searchInput.className = 'tsm-search';
     searchInput.addEventListener('input', (e) => this.filterPresets(e.target.value));
     searchContainer.appendChild(searchInput);
     
     // Category filter
     const categoryDropdown = new Dropdown({
       options: FONT_CATEGORIES.map(c => ({ value: c.id, label: c.name })),
       value: 'all',
       onChange: (cat) => this.filterByCategory(cat)
     });
     searchContainer.appendChild(categoryDropdown.element);
     
     container.appendChild(searchContainer);
     
     // Preset list
     this.presetList = document.createElement('div');
     this.presetList.className = 'tsm-preset-list';
     container.appendChild(this.presetList);
     
     this.renderPresetList();
     
     return container;
   }
   ```

2. **Preset Card Component:**
   ```javascript
   createPresetCard(preset) {
     const card = document.createElement('div');
     card.className = 'tsm-preset-card';
     card.dataset.presetId = preset.id;
     
     // Header with name and apply button
     const header = document.createElement('div');
     header.className = 'tsm-preset-header';
     
     const name = document.createElement('span');
     name.className = 'tsm-preset-name';
     name.textContent = preset.name;
     
     const applyBtn = document.createElement('button');
     applyBtn.className = 'tsm-apply-btn';
     applyBtn.textContent = 'Apply';
     applyBtn.addEventListener('click', (e) => {
       e.stopPropagation();
       this.applyPreset(preset);
     });
     
     header.appendChild(name);
     header.appendChild(applyBtn);
     
     // Preview area
     const preview = document.createElement('div');
     preview.className = 'tsm-preset-preview';
     preview.style.fontFamily = `"${preset.fonts.heading.family}", sans-serif`;
     
     const headingSample = document.createElement('div');
     headingSample.className = 'tsm-preview-heading';
     headingSample.textContent = 'Heading Sample';
     headingSample.style.fontWeight = preset.fonts.heading.weight;
     
     const bodySample = document.createElement('div');
     bodySample.className = 'tsm-preview-body';
     bodySample.textContent = 'Body text sample here';
     bodySample.style.fontFamily = `"${preset.fonts.body.family}", sans-serif`;
     bodySample.style.fontWeight = preset.fonts.body.weight;
     
     preview.appendChild(headingSample);
     preview.appendChild(bodySample);
     
     // Font names
     const fontNames = document.createElement('div');
     fontNames.className = 'tsm-preset-fonts';
     fontNames.textContent = `${preset.fonts.heading.family} / ${preset.fonts.body.family}`;
     
     card.appendChild(header);
     card.appendChild(preview);
     card.appendChild(fontNames);
     
     // Click to select/preview
     card.addEventListener('click', () => this.selectPreset(preset));
     
     // Load fonts for preview
     this.loadPresetFonts(preset);
     
     return card;
   }
   ```

3. **Font Loading for Preview:**
   ```javascript
   async loadPresetFonts(preset) {
     try {
       await fontManager.loadFont(preset.fonts.heading.family);
       await fontManager.loadFont(preset.fonts.body.family);
       // Trigger re-render of preview
       this.refreshPresetCard(preset.id);
     } catch (err) {
       console.warn(`Failed to load fonts for preset ${preset.id}`, err);
     }
   }
   ```

**Validation Checklist:**
- [ ] All presets display in list
- [ ] Font previews render with correct fonts
- [ ] Search filters presets
- [ ] Category filter works
- [ ] Apply button works

### 3.2 Preset Selection & Preview
**Estimated Time:** 2-3 hours  
**Risk Level:** Medium

**Tasks:**
1. **Selection State:**
   ```javascript
   selectPreset(preset) {
     this.selectedPreset = preset;
     this.updateCardSelection(preset.id);
     this.previewPreset(preset);
   }
   ```

2. **Preview on Canvas:**
   ```javascript
   previewPreset(preset) {
     // Temporarily inject CSS variables
     const container = document.querySelector('.slide-container');
     container.style.setProperty('--theme-font-heading', 
       `"${preset.fonts.heading.family}", ${preset.fonts.heading.fallback}`);
     container.style.setProperty('--theme-font-body', 
       `"${preset.fonts.body.family}", ${preset.fonts.body.fallback}`);
     
     // Update text style variables
     Object.entries(preset.styles).forEach(([key, style]) => {
       container.style.setProperty(`--text-${key}-size`, `${style.fontSize}px`);
       container.style.setProperty(`--text-${key}-weight`, style.fontWeight || 'inherit');
       container.style.setProperty(`--text-${key}-line-height`, style.lineHeight || 'inherit');
     });
   }
   
   cancelPreview() {
     // Restore from state
     this.restoreOriginalStyles();
   }
   ```

3. **Apply Preset:**
   ```javascript
   applyPreset(preset) {
     const state = store.getState();
     const masterId = this.getActiveMasterId(state);
     
     store.snapshot('Apply Font Preset');
     store.dispatch('APPLY_FONT_PRESET', { masterId, preset });
     
     this.selectedPreset = null;
   }
   ```

**Validation Checklist:**
- [ ] Selecting preset shows preview
- [ ] Applying preset saves to state
- [ ] Canvas text updates
- [ ] Undo works

---

## Phase 4: Custom Tab
**Goal:** Implement manual typography editing.

### 4.1 Theme Fonts Section
**Estimated Time:** 3-4 hours  
**Risk Level:** Medium

**Tasks:**
1. **Font Selector Component:**
   ```javascript
   createFontSelector(label, currentFont, onChange) {
     const container = document.createElement('div');
     container.className = 'tsm-font-selector';
     
     const labelEl = document.createElement('label');
     labelEl.textContent = label;
     
     const familyDropdown = new Dropdown({
       options: AVAILABLE_FONTS.map(f => ({ value: f.family, label: f.family })),
       value: currentFont.family,
       onChange: (family) => {
         const font = AVAILABLE_FONTS.find(f => f.family === family);
         onChange({ ...currentFont, family, weight: font.weights[0] });
         this.updateWeightDropdown(weightDropdown, font.weights);
       }
     });
     
     const weightDropdown = new Dropdown({
       options: this.getWeightsForFont(currentFont.family),
       value: currentFont.weight,
       onChange: (weight) => onChange({ ...currentFont, weight })
     });
     
     container.appendChild(labelEl);
     container.appendChild(familyDropdown.element);
     container.appendChild(weightDropdown.element);
     
     return container;
   }
   ```

2. **Theme Fonts UI:**
   ```javascript
   createThemeFontsSection() {
     const section = document.createElement('div');
     section.className = 'tsm-theme-fonts';
     
     const title = document.createElement('h4');
     title.textContent = 'Theme Fonts';
     section.appendChild(title);
     
     const currentFonts = this.getCurrentThemeFonts();
     
     // Heading font
     section.appendChild(this.createFontSelector(
       'Heading Font',
       currentFonts.heading,
       (font) => this.updateThemeFont('heading', font)
     ));
     
     // Body font
     section.appendChild(this.createFontSelector(
       'Body Font',
       currentFonts.body,
       (font) => this.updateThemeFont('body', font)
     ));
     
     return section;
   }
   
   updateThemeFont(role, font) {
     const state = store.getState();
     const masterId = this.getActiveMasterId(state);
     
     store.dispatch('UPDATE_THEME_SETTINGS', {
       id: masterId,
       settings: {
         fonts: { [role]: font }
       }
     });
     
     this.refreshCustomTab();
   }
   ```

**Validation Checklist:**
- [ ] Font family dropdown shows all fonts
- [ ] Weight dropdown updates based on family
- [ ] Changes update theme immediately
- [ ] Preview shows correct fonts

### 4.2 Text Styles List
**Estimated Time:** 4-5 hours  
**Risk Level:** Medium

**Tasks:**
1. **Style List:**
   ```javascript
   const TEXT_STYLE_DEFS = [
     { key: 'title', label: 'Title', usesFont: 'heading' },
     { key: 'subtitle', label: 'Subtitle', usesFont: 'body' },
     { key: 'bodyLevel1', label: 'Body Level 1', usesFont: 'body' },
     { key: 'bodyLevel2', label: 'Body Level 2', usesFont: 'body' },
     { key: 'bodyLevel3', label: 'Body Level 3', usesFont: 'body' },
     { key: 'bodyLevel4', label: 'Body Level 4', usesFont: 'body' },
     { key: 'bodyLevel5', label: 'Body Level 5', usesFont: 'body' },
     { key: 'caption', label: 'Caption', usesFont: 'body' }
   ];
   
   createTextStylesList() {
     const container = document.createElement('div');
     container.className = 'tsm-styles-list';
     
     const title = document.createElement('h4');
     title.textContent = 'Text Styles';
     container.appendChild(title);
     
     const currentStyles = this.getCurrentTextStyles();
     const fonts = this.getCurrentThemeFonts();
     
     TEXT_STYLE_DEFS.forEach(def => {
       const style = currentStyles[def.key] || {};
       const font = fonts[def.usesFont];
       container.appendChild(this.createStyleRow(def, style, font));
     });
     
     return container;
   }
   ```

2. **Style Row Component:**
   ```javascript
   createStyleRow(def, style, font) {
     const row = document.createElement('div');
     row.className = 'tsm-style-row';
     row.dataset.styleKey = def.key;
     
     // Preview
     const preview = document.createElement('div');
     preview.className = 'tsm-style-preview';
     preview.textContent = def.label;
     preview.style.fontFamily = `"${font.family}", sans-serif`;
     preview.style.fontSize = `${Math.min(style.fontSize || 16, 24)}px`;
     preview.style.fontWeight = style.fontWeight || font.weight;
     
     // Info
     const info = document.createElement('div');
     info.className = 'tsm-style-info';
     info.textContent = `${font.family}, ${style.fontSize || 16}pt`;
     
     // Edit button
     const editBtn = document.createElement('button');
     editBtn.className = 'tsm-edit-btn';
     editBtn.textContent = 'Edit';
     editBtn.addEventListener('click', () => this.toggleStyleEditor(def.key));
     
     row.appendChild(preview);
     row.appendChild(info);
     row.appendChild(editBtn);
     
     // Editor (hidden by default)
     const editor = this.createStyleEditor(def.key, style, font);
     editor.style.display = 'none';
     row.appendChild(editor);
     
     return row;
   }
   ```

3. **Inline Style Editor:**
   ```javascript
   createStyleEditor(styleKey, style, font) {
     const editor = document.createElement('div');
     editor.className = 'tsm-style-editor';
     editor.dataset.editorFor = styleKey;
     
     // Font Size
     const sizeInput = new NumberInput({
       label: 'Size',
       value: style.fontSize || 16,
       min: 8,
       max: 200,
       suffix: 'pt',
       onChange: (val) => this.updateStyle(styleKey, { fontSize: val })
     });
     editor.appendChild(sizeInput.element);
     
     // Font Weight
     const weightDropdown = new Dropdown({
       label: 'Weight',
       options: this.getWeightsForFont(font.family),
       value: style.fontWeight || font.weight,
       onChange: (val) => this.updateStyle(styleKey, { fontWeight: val })
     });
     editor.appendChild(weightDropdown.element);
     
     // Line Height
     const lineHeightInput = new NumberInput({
       label: 'Line Height',
       value: style.lineHeight || 1.5,
       min: 0.5,
       max: 3,
       step: 0.1,
       onChange: (val) => this.updateStyle(styleKey, { lineHeight: val })
     });
     editor.appendChild(lineHeightInput.element);
     
     // Letter Spacing
     const letterSpacingInput = new NumberInput({
       label: 'Letter Spacing',
       value: (style.letterSpacing || 0) * 100,
       min: -10,
       max: 50,
       suffix: '%',
       onChange: (val) => this.updateStyle(styleKey, { letterSpacing: val / 100 })
     });
     editor.appendChild(letterSpacingInput.element);
     
     // Live Preview
     const previewArea = document.createElement('div');
     previewArea.className = 'tsm-editor-preview';
     previewArea.textContent = 'Sample Text Preview';
     this.applyStyleToElement(previewArea, style, font);
     editor.appendChild(previewArea);
     
     return editor;
   }
   
   toggleStyleEditor(styleKey) {
     const row = this.customTab.querySelector(`[data-style-key="${styleKey}"]`);
     const editor = row.querySelector('.tsm-style-editor');
     editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
   }
   
   updateStyle(styleKey, props) {
     const state = store.getState();
     const masterId = this.getActiveMasterId(state);
     
     store.dispatch('UPDATE_TEXT_STYLE', {
       masterId,
       styleName: styleKey,
       styleProps: props
     });
     
     this.refreshStyleRow(styleKey);
   }
   ```

**Validation Checklist:**
- [ ] All 8 text styles listed
- [ ] Edit expands inline editor
- [ ] Changes update immediately
- [ ] Live preview in editor works

---

## Phase 5: AI Tab (Skeleton)
**Goal:** Create UI for future AI integration.

### 5.1 AI Prompt Area
**Estimated Time:** 2-3 hours  
**Risk Level:** Low

**Tasks:**
1. **Prompt UI:**
   ```javascript
   createAITab() {
     const container = document.createElement('div');
     container.className = 'tsm-ai-tab';
     
     // Generate section
     const generateSection = document.createElement('div');
     generateSection.className = 'tsm-ai-generate';
     
     const generateTitle = document.createElement('h4');
     generateTitle.textContent = 'Generate with AI';
     generateSection.appendChild(generateTitle);
     
     const promptLabel = document.createElement('label');
     promptLabel.textContent = 'Describe the typography style you want:';
     generateSection.appendChild(promptLabel);
     
     const promptTextarea = document.createElement('textarea');
     promptTextarea.className = 'tsm-ai-prompt';
     promptTextarea.placeholder = 'Professional and modern, easy to read with a slight tech feel...';
     promptTextarea.rows = 4;
     generateSection.appendChild(promptTextarea);
     
     // Mood dropdown
     const moodContainer = document.createElement('div');
     moodContainer.className = 'tsm-ai-mood';
     
     const moodDropdown = new Dropdown({
       label: 'Mood',
       options: [
         { value: 'professional', label: 'Professional' },
         { value: 'creative', label: 'Creative' },
         { value: 'playful', label: 'Playful' },
         { value: 'elegant', label: 'Elegant' },
         { value: 'bold', label: 'Bold' },
         { value: 'minimal', label: 'Minimal' }
       ],
       value: 'professional'
     });
     moodContainer.appendChild(moodDropdown.element);
     
     // Industry dropdown
     const industryDropdown = new Dropdown({
       label: 'Industry',
       options: [
         { value: 'technology', label: 'Technology' },
         { value: 'finance', label: 'Finance' },
         { value: 'healthcare', label: 'Healthcare' },
         { value: 'education', label: 'Education' },
         { value: 'fashion', label: 'Fashion' },
         { value: 'entertainment', label: 'Entertainment' }
       ],
       value: 'technology'
     });
     moodContainer.appendChild(industryDropdown.element);
     
     generateSection.appendChild(moodContainer);
     
     // Generate button
     const generateBtn = document.createElement('button');
     generateBtn.className = 'tsm-generate-btn';
     generateBtn.textContent = '✨ Generate Styles';
     generateBtn.disabled = true; // Disabled until AI integration
     generateBtn.addEventListener('click', () => {
       this.showAIPlaceholder('AI style generation coming soon!');
     });
     generateSection.appendChild(generateBtn);
     
     container.appendChild(generateSection);
     
     // Results placeholder
     const resultsSection = document.createElement('div');
     resultsSection.className = 'tsm-ai-results';
     resultsSection.innerHTML = '<p class="tsm-ai-placeholder">Generated results will appear here</p>';
     container.appendChild(resultsSection);
     
     return container;
   }
   ```

**Validation Checklist:**
- [ ] Prompt textarea renders
- [ ] Mood/Industry dropdowns work
- [ ] Generate button shows placeholder

---

## Phase 6: Entry Points
**Goal:** Add all access points to the panel.

### 6.1 Toolbar Button
**Estimated Time:** 1-2 hours  
**Risk Level:** Low

**Tasks:**
1. **Add Button to Toolbar:**
   ```javascript
   // In Toolbar.js
   createTypographyButton() {
     const btn = new IconButton({
       icon: Icons.TEXT_AA, // Or "Aa" text
       title: 'Typography Style Manager (Ctrl+Shift+T)',
       onClick: () => panelManager.toggle('typography-style-manager')
     });
     return btn;
   }
   ```

**Validation Checklist:**
- [ ] Button appears in toolbar
- [ ] Click toggles panel
- [ ] Tooltip shows shortcut

### 6.2 View Menu
**Estimated Time:** 30 minutes  
**Risk Level:** Low

**Tasks:**
1. **Add Menu Item:**
   - Add "Typography Style Manager" under View menu

### 6.3 Property Inspector Links
**Estimated Time:** 1-2 hours  
**Risk Level:** Low

**Tasks:**
1. **Add to SlideSection:**
   ```javascript
   createThemeFontsLink() {
     const link = document.createElement('button');
     link.className = 'pi-link-btn';
     link.textContent = 'Customize Fonts...';
     link.addEventListener('click', () => {
       panelManager.open('typography-style-manager');
     });
     return link;
   }
   ```

2. **Add to TextSection (Style Dropdown):**
   ```javascript
   // In style selector dropdown
   addManageStylesOption() {
     // Add "Manage Styles..." option at bottom of dropdown
     const option = { 
       value: '_manage_styles', 
       label: 'Manage Styles...',
       isAction: true 
     };
     // On select, open Typography Style Manager
   }
   ```

### 6.4 Keyboard Shortcut
**Estimated Time:** 30 minutes  
**Risk Level:** Low

**Tasks:**
1. **Register Shortcut:**
   ```javascript
   // In InputManager.js
   if (e.ctrlKey && e.shiftKey && e.code === 'KeyT') {
     e.preventDefault();
     panelManager.toggle('typography-style-manager');
   }
   ```

**Validation Checklist:**
- [ ] All entry points work
- [ ] Keyboard shortcut works

---

## Phase 7: Polish & Testing
**Goal:** Finalize implementation.

### 7.1 Font Preview Loading
**Estimated Time:** 2-3 hours

**Tasks:**
1. **Loading States:**
   - Show spinner while fonts load
   - Fallback text if font fails

2. **Lazy Loading:**
   - Only load fonts when preset is visible
   - Use IntersectionObserver for viewport detection

### 7.2 Accessibility
**Estimated Time:** 1-2 hours

**Tasks:**
1. ARIA labels
2. Keyboard navigation
3. Focus management

### 7.3 Error Handling
**Estimated Time:** 1 hour

**Tasks:**
1. Handle font loading failures
2. Validate style values
3. Graceful degradation

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Font loading slow | Medium | Medium | Lazy loading, caching |
| Preview inconsistent | Low | Medium | Force font load before preview |
| Style conflicts | Medium | Low | Validate style inheritance |
| State sync issues | High | Low | Centralize through store |

---

## Timeline Estimate

| Phase | Hours | Dependencies |
|-------|-------|--------------|
| Phase 1: Foundation | 7-10 hrs | FontManager |
| Phase 2: Panel UI | 3-4 hrs | DraggablePanel |
| Phase 3: Presets Tab | 6-8 hrs | Phase 1, 2 |
| Phase 4: Custom Tab | 7-9 hrs | Phase 2 |
| Phase 5: AI Tab | 2-3 hrs | Phase 2 |
| Phase 6: Entry Points | 3-5 hrs | Phase 2 |
| Phase 7: Polish | 4-6 hrs | All |

**Total: 32-45 hours (4-6 days)**

---

## Testing Checklist

### Unit Tests
- [ ] Font preset loading
- [ ] Style calculation
- [ ] Store handlers

### Integration Tests
- [ ] Preset application updates text
- [ ] Custom style changes persist
- [ ] Undo/redo works

### Manual Testing
- [ ] Open panel from all entry points
- [ ] Browse and filter presets
- [ ] Apply preset → All text updates
- [ ] Edit theme fonts → Preview updates
- [ ] Edit text style → Live preview
- [ ] Reset styles → Defaults restored
- [ ] Close panel → State preserved

---

## Related Documents

- [Typography Style Manager Spec](../specs/design-system/typography-style-manager.md)
- [Property Inspector: Typography Spec](../specs/property-inspector/property-inspector-typography.md)
- [Slide Master Implementation Plan](./slide-master-implementation-plan.md)
- [UI Design System](../specs/design-system/ui-design-system.md)
