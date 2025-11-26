/**
 * PresetManager - Manages CodeFill presets (built-in and user-created)
 */

import { CODEFILL_PRESETS, getBuiltInPresets } from '../constants/CodeFillPresets.js';

const STORAGE_KEY = 'story-codefill-presets';

export class PresetManager {
    /**
     * Get all built-in presets
     */
    static getBuiltInPresets() {
        return getBuiltInPresets();
    }

    /**
     * Get user-created presets from localStorage
     */
    static getUserPresets() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load user presets:', e);
        }
        return [];
    }

    /**
     * Get all presets (built-in + user)
     */
    static getAllPresets() {
        return [
            ...this.getBuiltInPresets(),
            ...this.getUserPresets()
        ];
    }

    /**
     * Save a new user preset
     */
    static saveUserPreset(preset) {
        const userPresets = this.getUserPresets();
        
        const newPreset = {
            ...preset,
            id: preset.id || `user-${Date.now()}`,
            category: 'user',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        userPresets.push(newPreset);
        this._saveToStorage(userPresets);
        
        return newPreset;
    }

    /**
     * Update an existing user preset
     */
    static updateUserPreset(id, updates) {
        const userPresets = this.getUserPresets();
        const index = userPresets.findIndex(p => p.id === id);
        
        if (index === -1) {
            console.warn(`Preset not found: ${id}`);
            return null;
        }

        userPresets[index] = {
            ...userPresets[index],
            ...updates,
            updatedAt: Date.now()
        };

        this._saveToStorage(userPresets);
        return userPresets[index];
    }

    /**
     * Delete a user preset
     */
    static deleteUserPreset(id) {
        const userPresets = this.getUserPresets();
        const filtered = userPresets.filter(p => p.id !== id);
        
        if (filtered.length === userPresets.length) {
            console.warn(`Preset not found: ${id}`);
            return false;
        }

        this._saveToStorage(filtered);
        return true;
    }

    /**
     * Check if a preset name already exists
     */
    static isNameTaken(name, excludeId = null) {
        const all = this.getAllPresets();
        return all.some(p => 
            p.name.toLowerCase() === name.toLowerCase() && 
            p.id !== excludeId
        );
    }

    /**
     * Get a preset by ID (checks both built-in and user)
     */
    static getPresetById(id) {
        const all = this.getAllPresets();
        return all.find(p => p.id === id);
    }

    /**
     * Duplicate a preset (always creates user preset)
     */
    static duplicatePreset(id) {
        const original = this.getPresetById(id);
        if (!original) {
            console.warn(`Preset not found: ${id}`);
            return null;
        }

        let newName = `${original.name} Copy`;
        let counter = 1;
        while (this.isNameTaken(newName)) {
            counter++;
            newName = `${original.name} Copy ${counter}`;
        }

        return this.saveUserPreset({
            name: newName,
            description: original.description,
            code: original.code
        });
    }

    /**
     * Export presets as JSON string
     */
    static exportPresets(ids = null) {
        let presets = this.getUserPresets();
        
        if (ids) {
            presets = presets.filter(p => ids.includes(p.id));
        }

        return JSON.stringify(presets, null, 2);
    }

    /**
     * Import presets from JSON string
     */
    static importPresets(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            
            if (!Array.isArray(imported)) {
                throw new Error('Invalid preset format');
            }

            const results = { success: [], failed: [] };

            imported.forEach(preset => {
                if (!preset.name || !preset.code) {
                    results.failed.push({ preset, error: 'Missing name or code' });
                    return;
                }

                try {
                    const saved = this.saveUserPreset({
                        name: this.isNameTaken(preset.name) 
                            ? `${preset.name} (Imported)` 
                            : preset.name,
                        description: preset.description || '',
                        code: preset.code
                    });
                    results.success.push(saved);
                } catch (e) {
                    results.failed.push({ preset, error: e.message });
                }
            });

            return results;
        } catch (e) {
            console.error('Failed to import presets:', e);
            throw e;
        }
    }

    /**
     * Internal: Save user presets to localStorage
     */
    static _saveToStorage(presets) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
        } catch (e) {
            console.error('Failed to save presets:', e);
            throw new Error('Failed to save preset. Storage may be full.');
        }
    }
}
