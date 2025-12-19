import { BaseSection } from './BaseSection.js';
import { Dropdown } from '../components/Dropdown.js';
import { IconButton } from '../components/IconButton.js';
import { TextInput } from '../components/TextInput.js';
import { Button } from '../components/Button.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';
import { ExportPreviewRenderer } from '../../core/renderer/ExportPreviewRenderer.js';
import { exportElements, exportToClipboard } from '../../core/export/Exporter.js';
import { EmptyState } from '../components/EmptyState.js';

export class ExportSection extends BaseSection {
    constructor() {
        super({ 
            title: 'Export',
            collapsed: true,
            actions: [
                { icon: Icons.PLUS, title: 'Add Export Preset', onClick: () => this.addPreset() }
            ]
        });
        
        // Preview Container
        this.previewContainer = document.createElement('div');
        this.previewContainer.className = 'pi-export-preview';
        this.section.appendChild(this.previewContainer);

        // Multi-selection scope hint
        this.scopeHint = document.createElement('div');
        this.scopeHint.className = 'pi-export-scope-hint hidden';
        this.scopeHint.setAttribute('data-testid', 'export-presets-scope-hint');
        this.section.appendChild(this.scopeHint);
        
        // Presets Container
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
        
        // Debounce timer for preview updates
        this.previewDebounceTimer = null;

        this.presets = [];
        this.presetsMixed = [];
        this.presetsMode = 'default'; // 'default' | 'aligned' | 'mixed-structure'
    }

    update(selection) {
        if (!selection || selection.length === 0) {
            this.section.element.classList.add('hidden');
            return;
        }
        
        this.section.element.classList.remove('hidden');
        this.selection = selection;

        if (this.selection.length > 1) {
            this.scopeHint.textContent = 'Editing export presets applies to all selected layers.';
            this.scopeHint.classList.remove('hidden');
        } else {
            this.scopeHint.textContent = '';
            this.scopeHint.classList.add('hidden');
        }
        
        const state = store.getState();
        const elements = selection.map((id) => this.getElement(state, id)).filter(Boolean);
        const element = elements[0];

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
            
            const presetsLists = elements.map((el) => (Array.isArray(el.exportPresets) ? el.exportPresets : []));
            const hasCustomPresets = presetsLists.some((list) => list.length > 0);
            this.section.setCollapsed(!hasCustomPresets);

            const defaultPreset = { scale: '1x', format: 'png', suffix: '' };

            // Determine whether preset stacks are aligned across selection.
            // We do NOT auto-normalize other elements here; we only unify when the user edits.
            const lengths = presetsLists.map((list) => list.length);
            const allSameLength = lengths.every((v) => v === lengths[0]);
            const anyEmpty = presetsLists.some((list) => list.length === 0);

            if (!hasCustomPresets) {
                this.presetsMode = 'default';
                this.presets = [defaultPreset];
                this.presetsMixed = [{ scale: false, format: false, suffix: false }];
            } else if (!allSameLength || anyEmpty) {
                // Mixed structure: different preset counts across selection.
                // Non-destructive UI: show Mixed. Export action uses merged effective presets.
                this.presetsMode = 'mixed-structure';
                this.presets = presetsLists.find((list) => list.length > 0) || [defaultPreset];
                this.presetsMixed = [];
            } else {
                this.presetsMode = 'aligned';
                // Clone the first list for editing.
                this.presets = (presetsLists[0] || []).map((p) => this.normalizePreset(p, defaultPreset));

                // Precompute mixed flags per preset index for common fields.
                this.presetsMixed = (this.presets || []).map((_, index) => {
                    const scales = presetsLists.map((list) => this.normalizePreset(list[index], defaultPreset).scale);
                    const formats = presetsLists.map((list) => this.normalizePreset(list[index], defaultPreset).format);
                    const suffixes = presetsLists.map((list) => this.normalizePreset(list[index], defaultPreset).suffix);

                    const allSame = (arr) => arr.every((v) => v === arr[0]);
                    return {
                        scale: !allSame(scales),
                        format: !allSame(formats),
                        suffix: !allSame(suffixes)
                    };
                });
            }

            this.renderPresets();
            if (this.selection.length > 1) {
                this.exportBtn.setLabel('Export Selection');
            } else {
                this.exportBtn.setLabel(`Export ${element.name || 'Layer'}`);
            }
            this.updatePreview();
        }
    }

    normalizePreset(preset, defaults) {
        const p = preset || {};
        return {
            scale: typeof p.scale === 'string' && p.scale ? p.scale : defaults.scale,
            format: typeof p.format === 'string' && p.format ? p.format : defaults.format,
            suffix: typeof p.suffix === 'string' ? p.suffix : defaults.suffix
        };
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

        if (this.presetsMode === 'mixed-structure') {
            const empty = new EmptyState('Mixed');
            this.container.appendChild(empty.element);
            return;
        }

        if (!Array.isArray(this.presets) || this.presets.length === 0) {
            const empty = new EmptyState('No export presets');
            this.container.appendChild(empty.element);
            return;
        }
        
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
            scaleSelect.element.setAttribute('data-testid', `export-preset-scale-${index}`);

            if (this.presetsMixed?.[index]?.scale) {
                scaleSelect.setMixed(true);
            }

            // Suffix (Optional, maybe hidden or small)
            const suffixInput = new TextInput({
                value: preset.suffix,
                placeholder: 'Suffix',
                mixedPlaceholder: 'Mixed',
                onChange: (val) => this.updatePreset(index, 'suffix', val)
            });
            suffixInput.element.setAttribute('data-testid', `export-preset-suffix-${index}`);

            if (this.presetsMixed?.[index]?.suffix) {
                suffixInput.setMixed(true);
            }
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
            formatSelect.element.setAttribute('data-testid', `export-preset-format-${index}`);

            if (this.presetsMixed?.[index]?.format) {
                formatSelect.setMixed(true);
            }

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
        const base = Array.isArray(this.presets) && this.presets.length > 0
            ? this.presets
            : [{ scale: '1x', format: 'png', suffix: '' }];
        const newPresets = [...base, newPreset];
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
        this.presetsMode = 'aligned';
        this.renderPresets(); // Optimistic update
        
        // Save to store
        this.selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { id, exportPresets: newPresets });
        });
        
        // Update preview with debouncing
        this.updatePreviewDebounced();
    }

    updatePreviewDebounced() {
        // Debounce preview updates to avoid excessive re-renders
        clearTimeout(this.previewDebounceTimer);
        this.previewDebounceTimer = setTimeout(() => {
            this.updatePreview();
        }, 300);
    }

    async updatePreview() {
        // Guard: Check if preview container still exists
        if (!this.previewContainer) {
            return;
        }
        
        if (!this.selection || this.selection.length === 0) {
            this.previewContainer.innerHTML = '';
            return;
        }
        
        // Show loading state
        this.previewContainer.innerHTML = '<div class="pi-export-preview-loading">Generating preview...</div>';
        
        try {
            // Validate ExportPreviewRenderer is available
            if (typeof ExportPreviewRenderer === 'undefined' || !ExportPreviewRenderer.renderExportPreview) {
                throw new Error('ExportPreviewRenderer not available');
            }
            
            const state = store.getState();
            if (!state) {
                throw new Error('Store state unavailable');
            }
            
            const elements = this.selection.map(id => this.getElement(state, id)).filter(Boolean);
            
            if (elements.length === 0) {
                throw new Error('No valid elements to preview');
            }
            
            // Validate elements have required properties
            const validElements = elements.filter(el => 
                el && typeof el.x === 'number' && typeof el.y === 'number' &&
                typeof el.width === 'number' && typeof el.height === 'number'
            );
            
            if (validElements.length === 0) {
                throw new Error('Elements missing required dimensions');
            }
            
            // Get first preset for preview (or use default)
            const preset = (this.presets && this.presets[0]) || { scale: '1x', format: 'png', suffix: '' };
            const scaleStr = String(preset.scale || '1x');
            const scale = parseFloat(scaleStr.replace('x', '')) || 1;
            
            // Render preview with timeout protection
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Preview render timeout')), 5000)
            );
            
            const renderPromise = ExportPreviewRenderer.renderExportPreview(validElements, {
                scale,
                maxWidth: 200,
                maxHeight: 200
            });
            
            const canvas = await Promise.race([renderPromise, timeoutPromise]);
            
            if (!canvas || !canvas.toDataURL) {
                throw new Error('Invalid canvas returned');
            }
            
            // Convert canvas to image
            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.alt = 'Export Preview';
            img.className = 'pi-export-preview-image';
            
            // Verify container still exists before updating
            if (this.previewContainer && this.previewContainer.parentNode) {
                this.previewContainer.innerHTML = '';
                this.previewContainer.appendChild(img);
            }
            
        } catch (error) {
            console.error('Failed to generate export preview:', error);
            if (this.previewContainer && this.previewContainer.parentNode) {
                this.previewContainer.innerHTML = '<div class="pi-export-preview-error">Preview unavailable</div>';
            }
        }
    }

    async handleExport() {
        if (!this.selection || this.selection.length === 0) {
            return;
        }
        
        // Disable button during export
        this.exportBtn.setDisabled(true);
        this.exportBtn.setLabel('Exporting...');
        
        try {
            const state = store.getState();
            const elements = this.selection
                .map(id => this.getElement(state, id))
                .filter(Boolean);
            
            if (elements.length === 0) {
                throw new Error('No valid elements to export');
            }
            
            const presets = this.getPresetsForExport(elements);

            console.log('[ExportSection] Exporting elements:', elements);
            console.log('[ExportSection] Presets:', presets);

            // Export with all presets
            await exportElements(elements, presets);
            
            // Success feedback
            this.exportBtn.setLabel('Export Complete!');
            setTimeout(() => {
                const elementName = elements.length === 1 ? (elements[0].name || 'Layer') : 'Selection';
                this.exportBtn.setLabel(`Export ${elementName}`);
                this.exportBtn.setDisabled(false);
            }, 2000);
            
        } catch (error) {
            console.error('Export failed:', error);
            this.exportBtn.setLabel('Export Failed');
            
            // Show error message
            alert(`Export failed: ${error.message}`);
            
            setTimeout(() => {
                const state = store.getState();
                const element = this.getElement(state, this.selection[0]);
                this.exportBtn.setLabel(`Export ${element?.name || 'Layer'}`);
                this.exportBtn.setDisabled(false);
            }, 2000);
        }
    }

    getPresetsForExport(elements) {
        const defaultPreset = { scale: '1x', format: 'png', suffix: '' };

        // If UI is aligned (or single selection), use the edited list (or default).
        if (this.presetsMode !== 'mixed-structure') {
            const presets = Array.isArray(this.presets) && this.presets.length > 0
                ? this.presets.map((p) => this.normalizePreset(p, defaultPreset))
                : [defaultPreset];
            return presets;
        }

        // Mixed structure: merge effective presets across selection so export is not surprising.
        const merged = [];
        const seen = new Set();

        const normalizeList = (list) => {
            const raw = Array.isArray(list) && list.length > 0 ? list : [defaultPreset];
            return raw.map((p) => this.normalizePreset(p, defaultPreset));
        };

        elements.forEach((el) => {
            const list = normalizeList(el?.exportPresets);
            list.forEach((p) => {
                const key = `${p.scale}|${p.format}|${p.suffix}`;
                if (seen.has(key)) return;
                seen.add(key);
                merged.push(p);
            });
        });

        return merged.length > 0 ? merged : [defaultPreset];
    }
    
    /**
     * Export to clipboard (ready for Ctrl+Shift+C keyboard shortcut)
     * This method can be called globally when keyboard shortcut is implemented
     */
    async exportToClipboardAction() {
        if (!this.selection || this.selection.length === 0) {
            throw new Error('No elements selected');
        }
        
        const state = store.getState();
        const elements = this.selection
            .map(id => this.getElement(state, id))
            .filter(Boolean);
        
        if (elements.length === 0) {
            throw new Error('No valid elements to export');
        }
        
        await exportToClipboard(elements, { scale: 2 });
    }
}
