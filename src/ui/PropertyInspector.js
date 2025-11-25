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
import { TextSection } from './properties/TextSection.js';
import { PlaceholderSection } from './properties/PlaceholderSection.js';

export class PropertyInspector {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.sectionStates = {}; // Persist section collapse state
        
        // Initialize Sections
        this.positionSection = new PositionSection();
        this.layoutSection = new LayoutSection();
        this.appearanceSection = new AppearanceSection();
        this.textSection = new TextSection();
        this.fillSection = new FillSection();
        this.strokeSection = new StrokeSection();
        this.effectsSection = new EffectsSection();
        this.exportSection = new ExportSection();
        this.slideSection = new SlideSection();
        this.placeholderSection = new PlaceholderSection();
        
        this.init();
    }

    init() {
        this.render();
        store.on('state-changed', (state) => {
            // Don't re-render if we are in the middle of an interaction (like scrubbing)
            // This prevents the input from being destroyed while dragging
            if (state.ui && state.ui.isInteracting) return;
            this.render();
        });
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

            // 4. Typography Section (Text Only)
            this.textSection.update(selection);
            this.container.appendChild(this.textSection.section.element);

            // 5. Fill Section (Hide for Text as it has its own control)
            const isText = selection.length === 1 && this.getElement(state, selection[0])?.type === 'text';
            if (!isText) {
                this.fillSection.update(selection);
                this.container.appendChild(this.fillSection.section.element);
            }

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
            this.container.appendChild(this.slideSection.fillSection.section.element);
            
            // Show Placeholder Section when in master mode with a layout selected
            this.placeholderSection.update(selection);
            this.container.appendChild(this.placeholderSection.section.element);
        }
    }

    getElement(state, id) {
        const mode = state.editor.mode;
        if (mode === 'master') {
            const master = state.masters[state.editor.activeMasterId];
            return master?.elements[id];
        } else {
            const slide = state.slides[state.editor.activeSlideId];
            return slide?.elements[id];
        }
    }
}