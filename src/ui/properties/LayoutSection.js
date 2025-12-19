import { BaseSection } from './BaseSection.js';
import { NumberInput } from '../components/NumberInput.js';
import { IconButton } from '../components/IconButton.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';

export class LayoutSection extends BaseSection {
    constructor() {
        super({ title: 'Layout' });
        this.layoutButtons = [];
        this.isTextElement = false;
        this.createContent();
    }

    createContent() {
        // Layout Mode Row (Auto Size / Fixed Width / Fixed Size) - Only shown for text elements
        this.layoutModeRow = document.createElement('div');
        this.layoutModeRow.className = 'pi-layout-mode-row';

        const layoutModes = [
            { icon: Icons.TEXT_AUTO_SIZE, value: 'autoSize', title: 'Auto Size' },
            { icon: Icons.TEXT_FIXED_WIDTH, value: 'fixedWidth', title: 'Fixed Width' },
            { icon: Icons.TEXT_FIXED_SIZE, value: 'fixed', title: 'Fixed Size' }
        ];

        this.layoutButtons = layoutModes.map(mode => {
            const btn = new IconButton({
                icon: mode.icon,
                title: mode.title,
                onClick: () => this.updateLayoutMode(mode.value)
            });
            this.layoutModeRow.appendChild(btn.element);
            return { btn, value: mode.value };
        });

        this.section.appendChild(this.layoutModeRow);

        // W / H Row
        const dimRow = document.createElement('div');
        dimRow.className = 'pi-row';

        this.wInput = new NumberInput({
            icon: Icons.WIDTH || 'W',
            value: 0,
            mixedPlaceholder: 'Mixed',
            onChange: (val, isTransient) => this.updateDimension('width', val, isTransient)
        });
        this.wInput.element.dataset.testid = 'layout-width';

        this.hInput = new NumberInput({
            icon: Icons.HEIGHT || 'H',
            value: 0,
            mixedPlaceholder: 'Mixed',
            onChange: (val, isTransient) => this.updateDimension('height', val, isTransient)
        });
        this.hInput.element.dataset.testid = 'layout-height';

        // Constrain Button
        const state = store.getState();
        this.constrainBtn = new IconButton({
            icon: Icons.LINK,
            title: 'Constrain Proportions',
            isActive: state.editor.constrainProportions,
            onClick: () => this.toggleConstrain()
        });

        dimRow.appendChild(this.wInput.element);
        dimRow.appendChild(this.hInput.element);
        dimRow.appendChild(this.constrainBtn.element);

        this.section.appendChild(dimRow);
    }

    updateLayoutMode(value) {
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        
        selection.forEach(id => {
            const el = this.getElement(state, id);
            if (el && el.type === 'text') {
                // Update the resizing mode at root level (matching creation behavior)
                store.dispatch('UPDATE_ELEMENT', { 
                    id, 
                    resizing: value
                });
            }
        });

        // Update input enabled states
        this.updateInputStates(value);
    }

    updateInputStates(resizingMode) {
        // autoSize: Both W and H are auto (disabled)
        // fixedWidth: W is manual (enabled), H is auto (disabled)
        // fixed: Both W and H are manual (enabled)
        if (resizingMode === 'autoSize') {
            this.wInput.setDisabled(true);
            this.hInput.setDisabled(true);
        } else if (resizingMode === 'fixedWidth') {
            this.wInput.setDisabled(false);
            this.hInput.setDisabled(true);
        } else {
            // fixed or undefined
            this.wInput.setDisabled(false);
            this.hInput.setDisabled(false);
        }
    }

    update(selection) {
        super.update(selection);
        
        if (!this.selection || this.selection.length === 0) {
            return;
        }
        
        const state = store.getState();
        const elements = this.getSelectedElements();
        const element = elements[0];

        // Update Constrain Button State
        this.constrainBtn.setActive(state.editor.constrainProportions);
        this.constrainBtn.element.innerHTML = state.editor.constrainProportions ? Icons.LINK : Icons.LINK_BROKEN;

        if (element) {
            const widthResult = this.getMixedValue(elements, 'width');
            if (widthResult.mixed) {
                this.wInput.setMixed(true);
            } else {
                this.wInput.setMixed(false);
                this.wInput.setValue(widthResult.value ?? 0, false);
            }

            const heightResult = this.getMixedValue(elements, 'height');
            if (heightResult.mixed) {
                this.hInput.setMixed(true);
            } else {
                this.hInput.setMixed(false);
                this.hInput.setValue(heightResult.value ?? 0, false);
            }
            
            // Store aspect ratio for constraint logic
            this.aspectRatio = element.width / element.height;

            // Show layout mode buttons only when ALL selected are text elements
            this.isTextElement = elements.length > 0 && elements.every((el) => el.type === 'text');
            this.layoutModeRow.classList.toggle('visible', this.isTextElement);

            if (this.isTextElement) {
                // Update layout mode button states
                // Mixed if selected text elements have different resizing modes.
                const modeObjects = elements.map((el) => ({ mode: el.resizing || el.style?.resizing || 'fixedWidth' }));
                const modeResult = this.getMixedValue(modeObjects, 'mode');
                const currentMode = modeResult.mixed ? null : (modeResult.value || 'fixedWidth');
                this.layoutButtons.forEach(({ btn, value }) => {
                    btn.setActive(currentMode != null && value === currentMode);
                });

                // Update W/H input enabled states based on mode
                this.updateInputStates(currentMode || 'fixedWidth');
            } else {
                // Non-text elements: enable both inputs
                this.wInput.setDisabled(false);
                this.hInput.setDisabled(false);
            }
        }
    }

    getElement(state, id) {
        const mode = state.editor.mode;
        if (mode === 'master') {
            const master = state.slideMasterPresets[state.editor.activeMasterId];
            return master?.elements[id];
        } else {
            const slide = state.slides[state.editor.activeSlideId];
            return slide?.elements[id];
        }
    }

    updateDimension(prop, value, isTransient = false) {
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        const constrain = state.editor.constrainProportions;
        
        selection.forEach(id => {
            const updates = { [prop]: value };
            
            if (constrain && this.aspectRatio) {
                if (prop === 'width') {
                    updates.height = value / this.aspectRatio;
                    this.hInput.setValue(updates.height, false);
                } else {
                    updates.width = value * this.aspectRatio;
                    this.wInput.setValue(updates.width, false);
                }
            }
            
            store.dispatch('UPDATE_ELEMENT', { id, ...updates }, { skipHistory: isTransient });
        });
    }

    toggleConstrain() {
        store.dispatch('TOGGLE_CONSTRAIN_PROPORTIONS');
        
        // Update aspect ratio based on current values
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        if (selection && selection.length > 0) {
            const el = this.getElement(state, selection[0]);
            if (el) this.aspectRatio = el.width / el.height;
        }
    }
}
