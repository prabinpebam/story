import { store } from '../core/Store.js';
import { Knob } from './components/Knob.js';
import { Switch } from './components/Switch.js';
import { SegmentedControl } from './components/SegmentedControl.js';
import { ScrubbableControl } from './components/ScrubbableControl.js';
import { ColorInput } from './components/ColorInput.js';
import { aiService } from '../core/ai/AIService.js';
import { PositionSection } from './properties/PositionSection.js';
import { LayoutSection } from './properties/LayoutSection.js';
import { AppearanceSection } from './properties/AppearanceSection.js';
import { FillSection } from './properties/FillSection.js';
import { StrokeSection } from './properties/StrokeSection.js';
import { EffectsSection } from './properties/EffectsSection.js';
import { ExportSection } from './properties/ExportSection.js';
import { SlideSection } from './properties/SlideSection.js';
import { LegacyTextSection } from './properties/legacy/LegacyTextSection.js';
import { LegacyShapeSection } from './properties/legacy/LegacyShapeSection.js';
import { LegacyImageSection } from './properties/legacy/LegacyImageSection.js';
import { LegacyAnimationSection } from './properties/legacy/LegacyAnimationSection.js';
import { LegacyEffectsSection } from './properties/legacy/LegacyEffectsSection.js';
import { LegacyCommonSection } from './properties/legacy/LegacyCommonSection.js';
import { LegacySlideSection } from './properties/legacy/LegacySlideSection.js';
import { getActiveContainer, getCommonProperties } from './properties/legacy/LegacyUtils.js';

export class PropertyInspector {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.sectionStates = {}; // Persist section collapse state
        
        // Initialize Sections
        this.positionSection = new PositionSection();
        this.layoutSection = new LayoutSection();
        this.appearanceSection = new AppearanceSection();
        this.fillSection = new FillSection();
        this.strokeSection = new StrokeSection();
        this.effectsSection = new EffectsSection();
        this.exportSection = new ExportSection();
        this.slideSection = new SlideSection();
        
        // Initialize Legacy Sections
        this.legacyTextSection = new LegacyTextSection(null, this.sectionStates);
        this.legacyShapeSection = new LegacyShapeSection(null, this.sectionStates);
        this.legacyImageSection = new LegacyImageSection(null, this.sectionStates);
        this.legacyAnimationSection = new LegacyAnimationSection(null, this.sectionStates);
        this.legacyEffectsSection = new LegacyEffectsSection(null, this.sectionStates);
        this.legacyCommonSection = new LegacyCommonSection(null);
        this.legacySlideSection = new LegacySlideSection(null, this.sectionStates);

        this.init();
    }

    init() {
        this.render();
        store.on('state-changed', () => this.render());
        store.on('selection-changed', () => this.render());
    }

    render() {
        this.container.classList.add('property-inspector');
        
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        
        // Clear container
        this.container.innerHTML = '';
        
        if (selection && selection.length > 0) {
            // 1. Position Section
            this.positionSection.update(selection);
            this.container.appendChild(this.positionSection.section.element);
            
            // 2. Layout Section
            this.layoutSection.update(selection);
            this.container.appendChild(this.layoutSection.section.element);

            // 3. Appearance Section
            this.appearanceSection.update(selection);
            this.container.appendChild(this.appearanceSection.section.element);

            // 4. Fill Section
            this.fillSection.update(selection);
            this.container.appendChild(this.fillSection.section.element);

            // 5. Stroke Section
            this.strokeSection.update(selection);
            this.container.appendChild(this.strokeSection.section.element);

            // 6. Effects Section
            this.effectsSection.update(selection);
            this.container.appendChild(this.effectsSection.section.element);

            // 7. Export Section
            this.exportSection.update(selection);
            this.container.appendChild(this.exportSection.section.element);
            
            // TODO: Add other sections here as they are built
        } else {
            // No selection: Show Slide Properties
            this.slideSection.update(selection);
            this.container.appendChild(this.slideSection.section.element);
        }

        // Fallback to legacy for missing parts (or if we want to mix them)
        // For now, let's append a container for legacy stuff below the new stuff
        const legacyContainer = document.createElement('div');
        legacyContainer.className = 'legacy-properties';
        this.container.appendChild(legacyContainer);
        
        // We need to temporarily hijack the container for renderLegacy to work on the sub-div
        const originalContainer = this.container;
        this.container = legacyContainer;
        this.renderLegacy();
        this.container = originalContainer;
    }

    renderLegacy() {
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        const mode = state.editor.mode;
        
        const currentObject = getActiveContainer(state);
        
        this.container.innerHTML = '';

        if (!currentObject) return;

        // Update container for legacy sections
        this.legacyTextSection.container = this.container;
        this.legacyShapeSection.container = this.container;
        this.legacyImageSection.container = this.container;
        this.legacyAnimationSection.container = this.container;
        this.legacyEffectsSection.container = this.container;
        this.legacyCommonSection.container = this.container;
        this.legacySlideSection.container = this.container;

        if (!selection || selection.length === 0) {
            this.legacySlideSection.render(currentObject, mode);
            return;
        }

        // Get all selected elements
        const elements = selection.map(id => {
            if (currentObject.elements && currentObject.elements[id]) return currentObject.elements[id];
            
            if (mode === 'master') {
                // If not found in current object (layout), check parent master
                if (currentObject.type === 'layout' && currentObject.parentId) {
                     const master = state.masters[currentObject.parentId];
                     if (master && master.elements && master.elements[id]) {
                         return master.elements[id];
                     }
                }
            } else if (mode === 'edit') {
                const effective = store.getEffectiveSlide(state.editor.activeSlideId);
                if (effective && effective.effectiveElements && effective.effectiveElements[id]) {
                    return effective.effectiveElements[id];
                }
            }
            return null;
        }).filter(el => el);
        
        if (elements.length === 0) return;

        // Calculate common properties
        const commonProps = getCommonProperties(elements);

        // Render Controls
        this.legacyCommonSection.render(commonProps, selection);

        // Type specific properties (only if all same type)
        const firstType = elements[0].type;
        const allSameType = elements.every(el => el.type === firstType);

        if (allSameType) {
            if (firstType === 'text') {
                this.legacyTextSection.render(elements[0], selection);
            } else if (firstType === 'rect') {
                this.legacyShapeSection.render(elements[0], selection);
            } else if (firstType === 'image') {
                this.legacyImageSection.render(elements[0], selection);
            }
        }

        // Effects (Shadow) - Only for single selection for now
        if (selection.length === 1) {
            this.legacyEffectsSection.render(elements[0], selection);
            this.legacyAnimationSection.render(elements[0], selection);
        }
    }

}