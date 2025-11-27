/**
 * PresetsTab - Grid display of CodeFill presets
 */

import { PresetManager } from '../../../core/services/PresetManager.js';
import { PresetCard } from './PresetCard.js';

export class PresetsTab {
    constructor(options = {}) {
        this.onSelect = options.onSelect || (() => {});
        this.cards = [];
        
        this.element = document.createElement('div');
        this.element.className = 'presets-tab';

        this.render();
    }

    render() {
        this.element.innerHTML = '';
        this.destroyCards();

        const builtIn = PresetManager.getBuiltInPresets();
        const userPresets = PresetManager.getUserPresets();

        // Built-in section
        if (builtIn.length > 0) {
            this.element.appendChild(this.createSection('Built-in', builtIn));
        }

        // User presets section
        if (userPresets.length > 0) {
            this.element.appendChild(this.createSection('My Presets', userPresets, true));
        } else {
            // Empty state for user presets
            const emptyState = document.createElement('div');
            emptyState.className = 'presets-empty-state';
            emptyState.innerHTML = `
                <div class="presets-empty-title">No saved presets yet</div>
                <div class="presets-empty-subtitle">Create one from the Custom tab</div>
            `;
            
            const sectionHeader = this.createSectionHeader('My Presets');
            this.element.appendChild(sectionHeader);
            this.element.appendChild(emptyState);
        }
    }

    createSectionHeader(title) {
        const header = document.createElement('div');
        header.className = 'presets-section-header';
        header.textContent = title;
        return header;
    }

    createSection(title, presets, isUserSection = false) {
        const section = document.createElement('div');
        section.className = 'presets-section';

        // Section header
        section.appendChild(this.createSectionHeader(title));

        // Grid container
        const grid = document.createElement('div');
        grid.className = 'presets-grid';

        presets.forEach(preset => {
            const card = new PresetCard({
                preset,
                onSelect: (p) => this.handleSelect(p),
                onDelete: isUserSection ? (p) => this.handleDelete(p) : null,
                onRename: isUserSection ? (p) => this.handleRename(p) : null,
                onDuplicate: (p) => this.handleDuplicate(p)
            });
            this.cards.push(card);
            grid.appendChild(card.element);
        });

        section.appendChild(grid);
        return section;
    }

    handleSelect(preset) {
        this.onSelect(preset);
    }

    handleDelete(preset) {
        if (!confirm(`Delete "${preset.name}"?`)) return;
        
        PresetManager.deleteUserPreset(preset.id);
        this.render();
    }

    handleRename(preset) {
        const newName = prompt('Enter new name:', preset.name);
        if (!newName || newName === preset.name) return;
        
        if (PresetManager.isNameTaken(newName, preset.id)) {
            alert('A preset with this name already exists.');
            return;
        }

        PresetManager.updateUserPreset(preset.id, { name: newName });
        this.render();
    }

    handleDuplicate(preset) {
        PresetManager.duplicatePreset(preset.id);
        this.render();
    }

    destroyCards() {
        this.cards.forEach(card => card.destroy());
        this.cards = [];
    }

    destroy() {
        this.destroyCards();
    }
}
