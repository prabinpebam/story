import { Section } from '../components/Section.js';
import { Dropdown } from '../components/Dropdown.js';
import { IconButton } from '../components/IconButton.js';
import { TextInput } from '../components/TextInput.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';

export class ExportSection {
    constructor() {
        this.section = new Section({ 
            title: 'Export',
            actions: [
                { icon: Icons.PLUS, title: 'Add Export Preset', onClick: () => this.addPreset() }
            ]
        });
        this.container = document.createElement('div');
        this.container.className = 'pi-section-content';
        this.section.appendChild(this.container);
        
        // Export Button
        this.exportBtn = document.createElement('button');
        this.exportBtn.className = 'btn-secondary'; // Or action-btn
        this.exportBtn.style.width = '100%';
        this.exportBtn.style.marginTop = 'var(--spacing-2)';
        this.exportBtn.textContent = 'Export';
        this.exportBtn.onclick = () => this.handleExport();
        
        this.section.appendChild(this.exportBtn);
    }

    update(selection) {
        if (!selection || selection.length === 0) {
            this.section.element.style.display = 'none';
            return;
        }
        
        this.section.element.style.display = 'block';
        this.selection = selection;
        
        const state = store.getState();
        const element = this.getElement(state, selection[0]);
        
        if (element) {
            this.presets = element.exportPresets || [{ scale: '1x', format: 'png', suffix: '' }];
            this.renderPresets();
            this.exportBtn.textContent = `Export ${element.name || 'Layer'}`;
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

    renderPresets() {
        this.container.innerHTML = '';
        
        this.presets.forEach((preset, index) => {
            const row = document.createElement('div');
            row.className = 'pi-row';
            row.style.marginBottom = 'var(--spacing-1)';
            
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
                onChange: (val) => this.updatePreset(index, 'scale', val)
            });
            scaleSelect.element.style.flex = '0 0 70px';

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
                onChange: (val) => this.updatePreset(index, 'format', val)
            });
            formatSelect.element.style.flex = '0 0 70px';

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
