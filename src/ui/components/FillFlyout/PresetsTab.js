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
        this.element.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 320px;
            overflow-y: auto;
        `;

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
            emptyState.style.cssText = `
                padding: 16px;
                text-align: center;
                color: #666;
                font-size: 11px;
                border: 1px dashed #444;
                border-radius: 6px;
                margin-top: 8px;
            `;
            emptyState.innerHTML = `
                <div style="margin-bottom: 4px;">No saved presets yet</div>
                <div style="font-size: 10px; color: #555;">Create one from the Custom tab</div>
            `;
            
            const sectionHeader = this.createSectionHeader('My Presets');
            this.element.appendChild(sectionHeader);
            this.element.appendChild(emptyState);
        }
    }

    createSectionHeader(title) {
        const header = document.createElement('div');
        header.style.cssText = `
            font-size: 10px;
            font-weight: 600;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 0 2px;
        `;
        header.textContent = title;
        return header;
    }

    createSection(title, presets, isUserSection = false) {
        const section = document.createElement('div');
        section.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

        // Section header
        section.appendChild(this.createSectionHeader(title));

        // Grid container
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        `;

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
