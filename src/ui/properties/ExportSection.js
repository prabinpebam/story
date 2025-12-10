import { BaseSection } from './BaseSection.js';
import { Dropdown } from '../components/Dropdown.js';
import { IconButton } from '../components/IconButton.js';
import { TextInput } from '../components/TextInput.js';
import { Button } from '../components/Button.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';

export class ExportSection extends BaseSection {
    constructor() {
        super({ 
            title: 'Export',
            collapsed: true,
            actions: [
                { icon: Icons.PLUS, title: 'Add Export Preset', onClick: () => this.addPreset() }
            ]
        });
        this.container = document.createElement('div');
        this.container.className = 'pi-section-content';
        this.section.appendChild(this.container);
        
        // Export Button
        this.exportBtn = new Button({
            label: 'Export',
            variant: 'secondary',
            size: 'md',
            fullWidth: true,
            onClick: () => this.handleExport()
        });
        this.exportBtn.element.classList.add('pi-mt-2');
        
        this.section.appendChild(this.exportBtn.element);
    }

    update(selection) {
        if (!selection || selection.length === 0) {
            this.section.element.classList.add('hidden');
            return;
        }
        
        this.section.element.classList.remove('hidden');
        this.selection = selection;
        
        const state = store.getState();
        const element = this.getElement(state, selection[0]);
        
        if (element) {
            // Check if there are any custom export presets defined
            // If element.exportPresets is undefined or empty, we consider it "no export settings"
            // However, the code below defaults to [{ scale: '1x', format: 'png', suffix: '' }] if undefined.
            // To follow the "collapsed if no effects" logic, we should check if the user has explicitly added presets.
            // But here, it seems we always show at least one default preset?
            // If the design intent is "Export section always has a default", then it should probably be collapsed by default unless the user has interacted with it?
            // Or, if we treat "default preset" as "no custom export settings", we can collapse it.
            
            // Let's assume if exportPresets is present and length > 0, it's "active".
            // If it's undefined, we show default but keep it collapsed.
            
            const hasCustomPresets = element.exportPresets && element.exportPresets.length > 0;
            this.section.setCollapsed(!hasCustomPresets);

            this.presets = element.exportPresets || [{ scale: '1x', format: 'png', suffix: '' }];
            this.renderPresets();
            this.exportBtn.setLabel(`Export ${element.name || 'Layer'}`);
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

    renderPresets() {
        this.container.innerHTML = '';
        
        this.presets.forEach((preset, index) => {
            const row = document.createElement('div');
            row.className = 'pi-row pi-mb-1';
            
            // Scale
            const scaleSelect = new Dropdown({
                options: [
                    { label: '0.5x', value: '0.5x' },
                    { label: '0.75x', value: '0.75x' },
                    { label: '1x', value: '1x' },
                    { label: '1.5x', value: '1.5x' },
                    { label: '2x', value: '2x' },
                    { label: '3x', value: '3x' },
                    { label: '4x', value: '4x' },
                    { label: '512w', value: '512w' },
                    { label: '512h', value: '512h' }
                ],
                value: preset.scale,
                size: 'sm',
                onChange: (val) => this.updatePreset(index, 'scale', val)
            });

            // Suffix (Optional, maybe hidden or small)
            const suffixInput = new TextInput({
                value: preset.suffix,
                placeholder: 'Suffix',
                onChange: (val) => this.updatePreset(index, 'suffix', val)
            });
            // suffixInput.element.style.flex = '1'; // Let it take remaining space

            // Format
            const formatSelect = new Dropdown({
                options: [
                    { label: 'PNG', value: 'png' },
                    { label: 'JPG', value: 'jpg' },
                    { label: 'SVG', value: 'svg' },
                    { label: 'PDF', value: 'pdf' },
                    { label: 'WEBP', value: 'webp' }
                ],
                value: preset.format,
                size: 'sm',
                onChange: (val) => this.updatePreset(index, 'format', val)
            });

            // Remove Button
            const removeBtn = new IconButton({
                icon: Icons.MINUS,
                title: 'Remove Preset',
                onClick: () => this.removePreset(index)
            });

            row.appendChild(scaleSelect.element);
            row.appendChild(suffixInput.element);
            row.appendChild(formatSelect.element);
            row.appendChild(removeBtn.element);
            
            this.container.appendChild(row);
        });
    }

    addPreset() {
        this.section.setCollapsed(false);
        const newPreset = { scale: '1x', format: 'png', suffix: '' };
        const newPresets = [...this.presets, newPreset];
        this.savePresets(newPresets);
    }

    removePreset(index) {
        const newPresets = this.presets.filter((_, i) => i !== index);
        this.savePresets(newPresets);
    }

    updatePreset(index, key, value) {
        const newPresets = [...this.presets];
        newPresets[index] = { ...newPresets[index], [key]: value };
        
        // Auto-suffix logic
        if (key === 'scale' && !newPresets[index].suffix) {
            if (value === '2x') newPresets[index].suffix = '@2x';
            if (value === '3x') newPresets[index].suffix = '@3x';
            // etc.
        }
        
        this.savePresets(newPresets);
    }

    savePresets(newPresets) {
        this.presets = newPresets;
        this.renderPresets(); // Optimistic update
        
        // Save to store
        this.selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { id, exportPresets: newPresets });
        });
    }

    handleExport() {
        console.log('Exporting...', this.presets);
        alert(`Exporting ${this.presets.length} files... (Not implemented)`);
    }
}
