import { Section } from '../components/Section.js';
import { TextInput } from '../components/TextInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { Dropdown } from '../components/Dropdown.js';
import { Switch } from '../components/Switch.js';
import { store } from '../../core/Store.js';

export class SlideSection {
    constructor() {
        this.section = new Section({ title: 'Slide' });
        this.createContent();
    }

    createContent() {
        // 1. Name (Master Mode)
        this.nameRow = document.createElement('div');
        this.nameRow.className = 'pi-row';
        this.nameInput = new TextInput({
            placeholder: 'Name',
            onChange: (val) => this.updateName(val)
        });
        this.nameRow.appendChild(this.nameInput.element);
        this.section.appendChild(this.nameRow);

        // 2. Layout Picker (Slide Mode)
        this.layoutRow = document.createElement('div');
        this.layoutRow.className = 'pi-row';
        this.layoutSelect = new Dropdown({
            onChange: (val) => this.updateLayout(val)
        });
        this.layoutRow.appendChild(this.layoutSelect.element);
        this.section.appendChild(this.layoutRow);

        // 3. Hide Graphics Toggle
        this.hideGraphicsRow = document.createElement('div');
        this.hideGraphicsRow.style.marginBottom = 'var(--spacing-2)';
        this.hideGraphicsSwitch = new Switch('Hide Background Graphics', false, (val) => {
            this.updateHideGraphics(val);
        });
        this.hideGraphicsRow.appendChild(this.hideGraphicsSwitch.element);
        this.section.appendChild(this.hideGraphicsRow);

        // 4. Dimensions
        const dimRow = document.createElement('div');
        dimRow.className = 'pi-row';
        
        this.wInput = new NumberInput({
            label: 'W',
            onChange: (val, isTransient) => this.updateDimension('width', val, isTransient)
        });
        
        this.hInput = new NumberInput({
            label: 'H',
            onChange: (val, isTransient) => this.updateDimension('height', val, isTransient)
        });

        dimRow.appendChild(this.wInput.element);
        dimRow.appendChild(this.hInput.element);
        this.section.appendChild(dimRow);

        // 5. Background Type
        const bgRow = document.createElement('div');
        bgRow.className = 'pi-row';
        
        const bgLabel = document.createElement('div');
        bgLabel.className = 'pi-label';
        bgLabel.textContent = 'Background';
        
        this.bgTypeSelect = new Dropdown({
            options: [
                { label: 'Inherited', value: 'inherited' },
                { label: 'Solid', value: 'solid' },
                { label: 'Gradient', value: 'gradient' },
                { label: 'Image', value: 'image' },
                { label: 'Code', value: 'code' }
            ],
            onChange: (val) => this.updateBackgroundType(val)
        });
        this.bgTypeSelect.element.style.flex = '1';

        bgRow.appendChild(bgLabel);
        bgRow.appendChild(this.bgTypeSelect.element);
        this.section.appendChild(bgRow);
        
        // TODO: Add specific background controls (Solid, Gradient, etc.)
        // For now, we rely on the legacy renderer for the complex background controls
        // or we implement them in Phase 6 (Fill) and reuse components.
    }

    update(selection) {
        // This section is shown when NO selection exists (or explicit slide selection)
        if (selection && selection.length > 0) {
            this.section.element.style.display = 'none';
            return;
        }
        
        this.section.element.style.display = 'block';
        
        const state = store.getState();
        const mode = state.editor.mode;
        const currentObject = this.getActiveContainer(state);

        if (!currentObject) return;

        // Update Title
        this.section.options.title = mode === 'master' ? 'Master / Layout' : 'Slide';
        this.section.element.querySelector('.pi-section-title').textContent = this.section.options.title;

        // 1. Name (Master only)
        if (mode === 'master') {
            this.nameRow.style.display = 'flex';
            this.nameInput.setValue(currentObject.name || '');
        } else {
            this.nameRow.style.display = 'none';
        }

        // 2. Layout Picker (Slide only)
        if (mode !== 'master') {
            this.layoutRow.style.display = 'flex';
            // Populate layouts
            const layouts = Object.values(state.masters).filter(m => m.type === 'layout');
            const options = layouts.map(l => ({ label: l.name, value: l.id }));
            this.layoutSelect.setOptions(options);
            this.layoutSelect.setValue(currentObject.layoutId);
        } else {
            this.layoutRow.style.display = 'none';
        }

        // 3. Hide Graphics
        if ((mode === 'master' && currentObject.type === 'layout') || mode === 'edit') {
            this.hideGraphicsRow.style.display = 'block';
            // Update switch value (need to add setValue to Switch component or recreate)
            // For now, let's assume we can recreate or update manually
            // this.hideGraphicsSwitch.setValue(currentObject.hideBackgroundGraphics);
        } else {
            this.hideGraphicsRow.style.display = 'none';
        }

        // 4. Dimensions
        this.wInput.setValue(currentObject.width, false);
        this.hInput.setValue(currentObject.height, false);

        // 5. Background
        const bg = currentObject.background || { type: 'inherited' };
        this.bgTypeSelect.setValue(bg.type);
    }

    getActiveContainer(state) {
        if (state.editor.mode === 'master') {
            return state.masters[state.editor.activeMasterId];
        } else {
            return state.slides[state.editor.activeSlideId];
        }
    }

    updateName(name) {
        const state = store.getState();
        const id = state.editor.activeMasterId;
        store.dispatch('UPDATE_MASTER', { id, name });
    }

    updateLayout(layoutId) {
        const state = store.getState();
        const id = state.editor.activeSlideId;
        store.dispatch('UPDATE_SLIDE', { id, layoutId });
    }

    updateHideGraphics(val) {
        const state = store.getState();
        const mode = state.editor.mode;
        const action = mode === 'master' ? 'UPDATE_MASTER' : 'UPDATE_SLIDE';
        const id = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        
        store.dispatch(action, { id, hideBackgroundGraphics: val });
    }

    updateDimension(prop, val, isTransient = false) {
        const state = store.getState();
        const mode = state.editor.mode;
        const action = mode === 'master' ? 'UPDATE_MASTER' : 'UPDATE_SLIDE';
        const id = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        
        store.dispatch(action, { id, [prop]: Math.max(100, val) }, { skipHistory: isTransient });
    }

    updateBackgroundType(type) {
        // Logic to switch background type
        // This might need to initialize default values for that type
        console.log('Switch BG Type:', type);
    }
}
