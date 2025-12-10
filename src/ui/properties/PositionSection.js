import { BaseSection } from './BaseSection.js';
import { IconButton } from '../components/IconButton.js';
import { NumberInput } from '../components/NumberInput.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';
import { getBoundingBox } from '../../utils/SelectionUtils.js';

export class PositionSection extends BaseSection {
    constructor() {
        super({ title: 'Position' });
        this.distributeHBtn = null;
        this.distributeVBtn = null;
        this.createContent();
    }

    createContent() {
        // 1. Alignment Row
        const alignRow = document.createElement('div');
        alignRow.className = 'pi-row pi-align-row';

        const alignments = [
            { icon: Icons.ALIGN_LEFT, action: 'left', title: 'Align Left' },
            { icon: Icons.ALIGN_CENTER, action: 'center', title: 'Align Horizontal Center' },
            { icon: Icons.ALIGN_RIGHT, action: 'right', title: 'Align Right' },
            { icon: Icons.ALIGN_TOP, action: 'top', title: 'Align Top' },
            { icon: Icons.ALIGN_MIDDLE, action: 'middle', title: 'Align Vertical Center' },
            { icon: Icons.ALIGN_BOTTOM, action: 'bottom', title: 'Align Bottom' }
        ];

        alignments.forEach(item => {
            const btn = new IconButton({
                icon: item.icon,
                title: item.title,
                onClick: () => this.handleAlign(item.action)
            });
            alignRow.appendChild(btn.element);
        });

        this.section.appendChild(alignRow);

        // 2. Distribute Row (new)
        const distributeRow = document.createElement('div');
        distributeRow.className = 'pi-row pi-distribute-row';

        this.distributeHBtn = new IconButton({
            icon: Icons.DISTRIBUTE_H,
            title: 'Distribute Horizontally',
            onClick: () => this.handleDistribute('horizontal')
        });

        this.distributeVBtn = new IconButton({
            icon: Icons.DISTRIBUTE_V,
            title: 'Distribute Vertically',
            onClick: () => this.handleDistribute('vertical')
        });

        // Initially disabled (need 3+ elements)
        this.distributeHBtn.setDisabled(true);
        this.distributeVBtn.setDisabled(true);

        distributeRow.appendChild(this.distributeHBtn.element);
        distributeRow.appendChild(this.distributeVBtn.element);
        this.section.appendChild(distributeRow);

        // 3. Coordinates Row (X, Y)
        const coordRow = document.createElement('div');
        coordRow.className = 'pi-row';

        this.xInput = new NumberInput({
            icon: Icons.AXIS_X || 'X',
            value: 0,
            onChange: (val, isTransient) => this.updateProperty('x', val, isTransient)
        });

        this.yInput = new NumberInput({
            icon: Icons.AXIS_Y || 'Y',
            value: 0,
            onChange: (val, isTransient) => this.updateProperty('y', val, isTransient)
        });

        coordRow.appendChild(this.xInput.element);
        coordRow.appendChild(this.yInput.element);
        this.section.appendChild(coordRow);

        // 4. Transform Row (Rotation, Flips)
        const transformRow = document.createElement('div');
        transformRow.className = 'pi-row';

        this.rotationInput = new NumberInput({
            label: '°', // Rotation symbol
            value: 0,
            units: '°',
            onChange: (val, isTransient) => this.updateProperty('rotation', val, isTransient)
        });
        
        // Wrap rotation input to take less space if needed, or let it flex
        // For now, let's give it flex 1 like others
        
        const flipGroup = document.createElement('div');
        flipGroup.className = 'pi-flip-group';

        // Rotate -90
        const rot90Btn = new IconButton({
            icon: Icons.ROTATE_CCW,
            title: 'Rotate -90°',
            onClick: () => this.handleRotateStep(-90)
        });

        // Flip H
        const flipHBtn = new IconButton({
            icon: Icons.FLIP_H,
            title: 'Flip Horizontal',
            onClick: () => this.handleFlip('horizontal')
        });

        // Flip V
        const flipVBtn = new IconButton({
            icon: Icons.FLIP_V,
            title: 'Flip Vertical',
            onClick: () => this.handleFlip('vertical')
        });

        flipGroup.appendChild(rot90Btn.element);
        flipGroup.appendChild(flipHBtn.element);
        flipGroup.appendChild(flipVBtn.element);

        transformRow.appendChild(this.rotationInput.element);
        transformRow.appendChild(flipGroup);
        this.section.appendChild(transformRow);
    }

    update(selection) {
        super.update(selection);
        
        if (!this.selection || this.selection.length === 0) {
            this.updateDistributeButtons(selection);
            return;
        }
        
        // Update distribute button state based on selection count
        this.updateDistributeButtons(selection);
        
        // Get all selected elements
        const elements = this.getSelectedElements();

        if (elements.length === 0) {
            return;
        }

        // For multi-selection, use bounding box for position display
        if (elements.length > 1) {
            const bounds = getBoundingBox(elements);
            this.xInput.setValue(bounds.x, false);
            this.yInput.setValue(bounds.y, false);
            
            // Rotation is mixed if elements have different rotations
            const rotationResult = this.getMixedValue(elements, 'rotation');
            if (rotationResult.mixed) {
                this.rotationInput.setMixed(true);
            } else {
                this.rotationInput.setMixed(false);
                this.rotationInput.setValue(rotationResult.value || 0, false);
            }
        } else {
            // Single element - show its actual values
            const element = elements[0];
            this.xInput.setMixed(false);
            this.yInput.setMixed(false);
            this.rotationInput.setMixed(false);
            
            this.xInput.setValue(element.x, false);
            this.yInput.setValue(element.y, false);
            this.rotationInput.setValue(element.rotation || 0, false);
        }
    }

    /**
     * Update distribute button enabled/disabled state.
     * Distribute requires at least 3 elements to make sense.
     * @param {Array} selection - Array of selected element IDs
     */
    updateDistributeButtons(selection) {
        const enabled = selection && selection.length >= 3;
        this.distributeHBtn.setDisabled(!enabled);
        this.distributeVBtn.setDisabled(!enabled);
    }

    /**
     * Handle distribute action - evenly space elements.
     * @param {string} direction - 'horizontal' or 'vertical'
     */
    handleDistribute(direction) {
        store.dispatch('DISTRIBUTE_ELEMENTS', direction);
    }



    handleAlign(action) {
        // Dispatch alignment action to store
        store.dispatch('ALIGN_ELEMENTS', action);
    }

    handleRotateStep(deg) {
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        
        selection.forEach(id => {
            const el = this.getElement(state, id);
            if (el) {
                const currentRot = el.rotation || 0;
                store.dispatch('UPDATE_ELEMENT', { id, rotation: currentRot + deg });
            }
        });
    }

    handleFlip(axis) {
        // Flip logic usually involves scaling by -1
        // Or if we have specific flip properties
        console.log('Flip:', axis);
    }
}
