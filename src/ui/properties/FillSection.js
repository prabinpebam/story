import { BaseSection } from './BaseSection.js';
import { ColorInput } from '../components/ColorInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { IconButton } from '../components/IconButton.js';
import { PropertyRow } from '../components/PropertyRow.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';
import { FillFlyout } from '../components/FillFlyout/FillFlyout.js';
import { BlendModes } from '../../core/constants/BlendModes.js';
import { EmptyState } from '../components/EmptyState.js';

import { CodeRunner } from '../../core/effects/CodeRunner.js';
import { propertyMemory } from '../../core/services/PropertyMemoryManager.js';
import { linkedPropertyManager, COLOR_SLOTS } from '../../core/services/LinkedPropertyManager.js';
import { StyleResolver } from '../../utils/StyleResolver.js';
import { mediaAssetManager } from '../../core/media/MediaAssetManager.js';

// Module-level cache for last used values (legacy, now managed by PropertyMemoryManager)
const LastUsed = {
    solid: '#D9D9D9',
    gradient: 'linear-gradient(90deg, #000000 0%, #ffffff 100%)',
    code: null // Will use CodeRunner.DEFAULT_CODE when accessed
};

export class FillSection extends BaseSection {
    constructor(options = {}) {
        super({ 
            title: options.title || 'Fill',
            actions: [
                { icon: Icons.PLUS, title: 'Add Fill', onClick: () => this.addFill() }
            ]
        });
        this.options = options;
        // Context key for memory - default to object fill, can be overridden (e.g., 'fill.slide')
        this.contextKey = options.contextKey || 'fill.object';
        
        this.container = document.createElement('div');
        this.container.className = 'pi-section-content';
        this.section.appendChild(this.container);
    }

    update(selection) {
        if (!selection || selection.length === 0) {
            // If we are in "manual" mode (e.g. SlideSection), we might not use selection array
            // but update() is usually called with selection.
            // If this instance is controlled by SlideSection, it might call update([]) or update(null).
            // We should let the parent control visibility if needed.
            if (!this.options.manualVisibility) {
                this.section.element.classList.add('hidden');
            }
            return;
        }
        
        super.update(selection);
        
        // If custom getElement is provided (e.g. SlideSection background), keep single-target behavior
        if (this.options.getElement) {
            const element = this.options.getElement(selection);
            if (element) this.render(element);
            return;
        }

        const state = store.getState();
        const elements = (selection || []).map((id) => this.getElement(state, id)).filter(Boolean);
        if (elements.length === 0) {
            this.section.element.classList.add('hidden');
            return;
        }

        if (elements.length === 1) {
            this.render(elements[0]);
        } else {
            this.renderMulti(elements);
        }
    }

    getNormalizedFills(element) {
        const style = element?.style || {};
        let fills = [];
        if (style.fills && Array.isArray(style.fills)) {
            fills = style.fills;
        } else {
            // Migration / Legacy support
            const isTransparent = !style.backgroundColor || style.backgroundColor === 'transparent';
            const isHidden = style._fillEnabled === false;
            const hasLegacyFill = !isTransparent || isHidden || style.fillType;
            if (hasLegacyFill) {
                fills = [{
                    type: style.fillType || 'solid',
                    value: style.fillValue || style.backgroundColor || '#D9D9D9',
                    color: style.backgroundColor || '#D9D9D9',
                    opacity: 100,
                    visible: style._fillEnabled !== false
                }];
                if (isHidden && style._savedFillColor) {
                    fills[0].color = style._savedFillColor;
                    fills[0].value = style._savedFillColor;
                }
            }
        }
        return fills;
    }

    areFillStacksCompatible(fillsByElement) {
        if (fillsByElement.length === 0) return false;
        const first = fillsByElement[0];
        for (let i = 1; i < fillsByElement.length; i++) {
            if (fillsByElement[i].length !== first.length) return false;
        }

        for (let index = 0; index < first.length; index++) {
            const baseType = (first[index]?.type || 'solid');
            for (let i = 1; i < fillsByElement.length; i++) {
                const t = (fillsByElement[i][index]?.type || 'solid');
                if (t !== baseType) return false;
            }
        }

        return true;
    }

    getMixedResult(values) {
        if (!values || values.length === 0) return { value: undefined, mixed: false };
        const first = values[0];
        const mixed = values.some((v) => v !== first);
        return { value: first, mixed };
    }

    renderMulti(elements) {
        this.container.innerHTML = '';

        const fillsByElement = elements.map((el) => this.getNormalizedFills(el));
        const compatible = this.areFillStacksCompatible(fillsByElement);
        if (!compatible) {
            const empty = new EmptyState('Mixed');
            this.container.appendChild(empty.element);
            return;
        }

        const list = document.createElement('div');
        list.className = 'fill-list';
        const baseFills = fillsByElement[0];
        if (baseFills.length === 0) {
            const empty = new EmptyState('No fill');
            this.container.appendChild(empty.element);
            return;
        }
        baseFills.forEach((fill, index) => {
            const row = this.createFillRowMulti(fill, index, baseFills, fillsByElement, elements);
            list.appendChild(row);
        });
        this.container.appendChild(list);
    }

    createFillRowMulti(fill, index, allFills, fillsByElement, elements) {
        const type = fill?.type || 'solid';

        const visibleValues = fillsByElement.map((fills) => (fills[index]?.visible !== false));
        const visibleMixed = visibleValues.some((v) => v !== visibleValues[0]);
        const allVisible = visibleValues.every(Boolean);

        const propertyRow = new PropertyRow({
            index,
            draggable: allFills.length > 1,
            showVisibility: true,
            showDelete: true,
            onVisibilityToggle: () => {
                const nextVisible = allVisible ? false : true;
                this.updateFillForSelection(index, { visible: nextVisible });
            },
            onDelete: () => {
                this.removeFillForSelection(index);
            },
            onDrop: ({ position, event }) => {
                const fromIndex = parseInt(event.dataTransfer.getData('text/plain'));
                let toIndex = index;
                if (position === 'after') toIndex = index + 1;
                if (fromIndex !== toIndex) {
                    this.reorderFillsForSelection(fromIndex, toIndex);
                }
            }
        });

        // If visibility differs, show as visible (but toggling will unify)
        propertyRow.setVisible(visibleMixed ? true : allVisible);

        const row = propertyRow.element;
        row.classList.add('fill-row');

        const combinedInput = document.createElement('div');
        combinedInput.className = 'fill-input-group';

        const swatch = document.createElement('div');
        swatch.className = 'fill-swatch-trigger';

        const preview = document.createElement('div');
        preview.className = 'fill-preview';

        // Mixed detection per type
        const typeValues = fillsByElement.map((fills) => (fills[index]?.type || 'solid'));
        const typeMixed = typeValues.some((t) => t !== typeValues[0]);

        let swatchMixed = false;
        if (typeMixed) {
            swatchMixed = true;
        } else if (type === 'solid' || !type) {
            const colorValues = fillsByElement.map((fills) => this.rgbToHex((fills[index]?.color || fills[index]?.value || '#000000')).toUpperCase());
            swatchMixed = colorValues.some((c) => c !== colorValues[0]);
            if (!swatchMixed) {
                preview.style.backgroundColor = colorValues[0];
            }
        } else if (type === 'gradient') {
            const gradientValues = fillsByElement.map((fills) => {
                const v = fills[index]?.value;
                return typeof v === 'string' ? v : JSON.stringify(v);
            });
            swatchMixed = gradientValues.some((v) => v !== gradientValues[0]);
            if (!swatchMixed) {
                preview.style.background = fillsByElement[0][index]?.value;
            }
        } else if (type === 'image' || type === 'video' || type === 'code') {
            // Treat non-solid fills as mixed unless values match
            const vValues = fillsByElement.map((fills) => {
                const f = fills[index] || {};
                return `${f.type || ''}|${f.assetId || ''}|${f.value || ''}`;
            });
            swatchMixed = vValues.some((v) => v !== vValues[0]);
        }

        if (swatchMixed) {
            preview.classList.add('mixed');
        }

        swatch.appendChild(preview);
        swatch.onclick = (e) => {
            e.stopPropagation();
            this.openFlyout(swatch, fill, index, (elements && elements[0]) ? elements[0] : null);
        };
        combinedInput.appendChild(swatch);

        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.className = 'fill-hex-input';
        hexInput.spellcheck = false;
        hexInput.setAttribute('data-testid', `fill-hex-${index}`);

        if (type === 'solid' || !type) {
            const colorValues = fillsByElement.map((fills) => this.rgbToHex((fills[index]?.color || fills[index]?.value || '#000000')).toUpperCase());
            const colorMixed = colorValues.some((c) => c !== colorValues[0]);
            if (colorMixed) {
                hexInput.value = '';
                hexInput.placeholder = 'Mixed';
                hexInput.classList.add('mixed');
            } else {
                hexInput.value = colorValues[0];
            }

            hexInput.onchange = (e) => {
                let val = e.target.value.trim();
                if (!val) return;
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
                    this.updateFillForSelection(index, { color: val });
                } else {
                    // Revert to current
                    if (colorMixed) {
                        e.target.value = '';
                        e.target.placeholder = 'Mixed';
                    } else {
                        e.target.value = colorValues[0];
                    }
                }
            };
        } else {
            // Non-solid fills
            const labelValues = fillsByElement.map((fills) => {
                const f = fills[index] || {};
                if (f.type === 'code') return 'Code Fill';
                return (f.type || 'Fill').charAt(0).toUpperCase() + (f.type || 'Fill').slice(1);
            });
            const mixed = labelValues.some((v) => v !== labelValues[0]);
            if (mixed) {
                hexInput.value = '';
                hexInput.placeholder = 'Mixed';
                hexInput.classList.add('mixed');
            } else {
                hexInput.value = labelValues[0];
            }
            hexInput.disabled = true;
        }
        combinedInput.appendChild(hexInput);

        const separator = document.createElement('div');
        separator.className = 'fill-separator';
        combinedInput.appendChild(separator);

        const opacityValues = fillsByElement.map((fills) => {
            const op = fills[index]?.opacity;
            return op !== undefined ? op : 100;
        });
        const opacityResult = this.getMixedResult(opacityValues);

        const opacityInput = new NumberInput({
            value: opacityResult.mixed ? 100 : opacityResult.value,
            onChange: (val, isTransient) => {
                this.updateFillForSelection(index, { opacity: val }, isTransient);
            },
            min: 0,
            max: 100,
            step: 1,
            units: '%',
            scrubbable: true,
            mixedPlaceholder: 'Mixed'
        });
        opacityInput.element.classList.add('fill-opacity-input');
        opacityInput.element.setAttribute('data-testid', `fill-opacity-${index}`);
        opacityInput.setMixed(opacityResult.mixed);
        combinedInput.appendChild(opacityInput.element);

        const fillContent = document.createElement('div');
        fillContent.className = 'fill-content';
        fillContent.appendChild(combinedInput);

        propertyRow.appendChild(fillContent);

        return row;
    }

    render(element) {
        this.container.innerHTML = '';
        
        const style = element.style || {};
        
        // Normalize fills:
        // If style.fills exists, use it.
        // Else if backgroundColor/fillType exists, create a single fill entry.
        // Else empty.
        let fills = [];
        if (style.fills && Array.isArray(style.fills)) {
            fills = style.fills;
        } else {
            // Migration / Legacy support
            const isTransparent = !style.backgroundColor || style.backgroundColor === 'transparent';
            const isHidden = style._fillEnabled === false;
            const hasLegacyFill = !isTransparent || isHidden || style.fillType;
            
            if (hasLegacyFill) {
                fills = [{
                    type: style.fillType || 'solid',
                    value: style.fillValue || style.backgroundColor || '#D9D9D9',
                    color: style.backgroundColor || '#D9D9D9', // For solid
                    opacity: 100, // Legacy assumed 100% or baked into color
                    visible: style._fillEnabled !== false
                }];
                // If hidden, restore saved color
                if (isHidden && style._savedFillColor) {
                    fills[0].color = style._savedFillColor;
                    fills[0].value = style._savedFillColor;
                }
            }
        }

        // Container for the list of fills
        const list = document.createElement('div');
        list.className = 'fill-list';
        
        // Check for inherited fill (for slide/master backgrounds)
        const inheritedFill = element.inheritedFill;
        const hasOwnBackground = element.hasOwnBackground;
        
        if (fills.length === 0 && inheritedFill) {
            // No override fills - show inherited fill as active (but marked as inherited)
            const inheritedRow = this.createInheritedFillRow(inheritedFill, true);
            list.appendChild(inheritedRow);
        } else if (fills.length === 0) {
            // No fills and no inherited - show empty state
            const empty = new EmptyState('No fill');
            this.container.appendChild(empty.element);
            return;
        } else {
            // Has override fills - show them
            fills.forEach((fill, index) => {
                const row = this.createFillRow(element, fill, index, fills);
                list.appendChild(row);
            });
            
            // Also show inherited fill at the bottom as reference (if available)
            if (inheritedFill) {
                const divider = document.createElement('div');
                divider.className = 'inherited-fill-divider';
                list.appendChild(divider);
                
                const inheritedRow = this.createInheritedFillRow(inheritedFill, false);
                list.appendChild(inheritedRow);
            }
        }
        
        this.container.appendChild(list);
    }

    /**
     * Create a row showing an inherited fill (read-only, with visual indicator)
     * @param {Object} fill - The inherited fill object
     * @param {boolean} isActive - Whether this is the active fill (no override exists)
     */
    createInheritedFillRow(fill, isActive) {
        const row = document.createElement('div');
        row.className = 'pi-row inherited-fill-row' + (isActive ? '' : ' inactive');

        // Color swatch / preview (16x16 to match theme swatches)
        const swatch = document.createElement('div');
        swatch.className = 'inherited-fill-swatch';
        
        if (fill.type === 'solid') {
            swatch.style.background = fill.color || fill.value || '#D9D9D9';
        } else if (fill.type === 'gradient') {
            swatch.style.background = fill.value || 'linear-gradient(90deg, #000 0%, #fff 100%)';
        } else if (fill.type === 'image') {
            swatch.style.background = `url(${fill.value}) center/cover no-repeat`;
        } else {
            swatch.style.background = '#D9D9D9';
        }
        row.appendChild(swatch);

        // Label container
        const labelContainer = document.createElement('div');
        labelContainer.className = 'inherited-fill-label';
        
        // Type label
        const typeLabel = document.createElement('span');
        typeLabel.className = 'inherited-fill-type';
        typeLabel.textContent = fill.type || 'Solid';
        labelContainer.appendChild(typeLabel);
        
        row.appendChild(labelContainer);

        // Inherited badge
        const badge = document.createElement('span');
        badge.className = 'inherited-fill-badge';
        badge.textContent = 'Inherited';
        row.appendChild(badge);

        return row;
    }

    createFillRow(element, fill, index, allFills) {
        // Check if fill is linked to a theme slot
        const isLinked = fill.themeSlot !== undefined && fill.themeSlot !== null;
        
        // Create PropertyRow wrapper with drag/visibility/delete controls
        const propertyRow = new PropertyRow({
            index,
            draggable: true,
            showVisibility: true,
            showDelete: true,
            onVisibilityToggle: () => {
                this.updateFill(element, index, { visible: !fill.visible });
            },
            onDelete: () => {
                this.removeFill(element, index);
            },
            onDrop: ({ position, event }) => {
                const fromIndex = parseInt(event.dataTransfer.getData('text/plain'));
                let toIndex = index;
                
                // Calculate drop position
                if (position === 'after') {
                    toIndex = index + 1;
                }
                
                if (fromIndex !== toIndex) {
                    this.reorderFills(element, fromIndex, toIndex);
                }
            }
        });
        
        // Set visibility state
        propertyRow.setVisible(fill.visible !== false);
        
        // Add fill-specific classes
        const row = propertyRow.element;
        row.classList.add('fill-row');
        if (isLinked) {
            row.classList.add('fill-linked');
        }

        // Combined Input Group (Swatch + Opacity)
        const combinedInput = document.createElement('div');
        combinedInput.className = 'fill-input-group';

        // 1. Color Swatch (Trigger for Flyout)
        const swatch = document.createElement('div');
        swatch.className = 'fill-swatch-trigger';
        
        // Preview
        const preview = document.createElement('div');
        preview.className = 'fill-preview';
        
        // Determine the color for the swatch border
        let swatchColor = '#000000';
        
        // Resolve theme slot to actual hex color if present
        if (fill.themeSlot !== undefined && fill.themeSlot !== null) {
            swatchColor = StyleResolver.resolveThemeSlot(fill.themeSlot, fill.color || fill.value || '#000000');
        }
        
        if (fill.type === 'image') {
             // Check if there's actually an image asset
             if (fill.assetId || fill.value) {
                 const url = fill.value || mediaAssetManager.getBlobUrl(fill.assetId);
                 preview.style.backgroundImage = `url(${url})`;
             } else {
                 // No image - show placeholder icon
                 preview.style.backgroundColor = 'var(--color-surface-tertiary)';
                 preview.innerHTML = '<i class="fa-solid fa-image" style="font-size: 10px; color: var(--color-text-tertiary);"></i>';
             }
        } else if (fill.type === 'video') {
             // Check if there's actually a video asset
             if (fill.assetId || fill.value) {
                 // TODO: Show video thumbnail if available
                 preview.style.backgroundColor = 'var(--color-surface-tertiary)';
                 preview.innerHTML = '<i class="fa-solid fa-play" style="font-size: 10px; color: var(--color-text-primary);"></i>';
             } else {
                 // No video - show placeholder icon
                 preview.style.backgroundColor = 'var(--color-surface-tertiary)';
                 preview.innerHTML = '<i class="fa-solid fa-video" style="font-size: 10px; color: var(--color-text-tertiary);"></i>';
             }
        } else if (fill.type === 'gradient') {
             if (typeof fill.value === 'string') {
                 preview.style.background = fill.value;
             } else {
                 preview.style.background = this.getGradientCss(fill.value);
             }
        } else if (fill.type === 'code') {
             preview.style.backgroundColor = 'var(--color-surface-tertiary)';
             preview.innerHTML = '<i class="fa-solid fa-code" style="font-size: 10px; color: var(--color-text-primary);"></i>';
        } else {
             // Solid fill - use resolved swatchColor (may have been resolved from themeSlot above)
             if (!swatchColor || swatchColor === '#000000') {
                 swatchColor = fill.color || fill.value || '#000000';
             }
             preview.style.backgroundColor = swatchColor;
             // Border update logic is now handled by CSS hover on .fill-preview
        }
        swatch.appendChild(preview);
        
        swatch.onclick = (e) => {
            e.stopPropagation();
            this.openFlyout(swatch, fill, index, element);
        };
        
        if (!fill.visible) {
            swatch.classList.add('fill-disabled');
        }

        combinedInput.appendChild(swatch);

        // 2. Hex Input (Editable) or Linked Value Display
        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.className = 'fill-hex-input';
        hexInput.spellcheck = false;
        hexInput.setAttribute('data-testid', `fill-hex-${index}`);
        
        if (isLinked && (fill.type === 'solid' || !fill.type)) {
            // Show theme slot name for linked fills
            let label = fill.themeSlot;
            if (COLOR_SLOTS[fill.themeSlot]) {
                label = COLOR_SLOTS[fill.themeSlot].name || fill.themeSlot;
            } else if (typeof fill.themeSlot === 'number') {
                label = `Slot ${fill.themeSlot + 1}`;
            }

            hexInput.value = label;
            // hexInput.disabled = true; // Allow editing to unlink
            hexInput.classList.add('fill-hex-input--linked');
            hexInput.title = `Linked to theme: ${label}`;
        } else if (fill.type === 'solid' || !fill.type) {
            hexInput.value = this.rgbToHex(fill.color || fill.value || '#000000').toUpperCase();
        } else if (fill.type === 'code') {
            hexInput.value = 'Code Fill';
            hexInput.disabled = true;
        } else {
            hexInput.value = fill.type.charAt(0).toUpperCase() + fill.type.slice(1);
            hexInput.disabled = true;
        }

        // Attach onchange for solid fills (linked or not)
        if (fill.type === 'solid' || !fill.type) {
            hexInput.onchange = (e) => {
                let val = e.target.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                // Basic validation
                if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
                    this.updateFill(element, index, { color: val });
                } else {
                    // Revert
                    if (isLinked) {
                        let label = fill.themeSlot;
                        if (COLOR_SLOTS[fill.themeSlot]) {
                            label = COLOR_SLOTS[fill.themeSlot].name || fill.themeSlot;
                        } else if (typeof fill.themeSlot === 'number') {
                            label = `Slot ${fill.themeSlot + 1}`;
                        }
                        e.target.value = label;
                    } else {
                        e.target.value = this.rgbToHex(fill.color || fill.value || '#000000').toUpperCase();
                    }
                }
            };
        }
        
        if (!fill.visible) {
            hexInput.classList.add('fill-disabled');
        }

        combinedInput.appendChild(hexInput);
        
        // Add linked indicator icon if linked
        if (isLinked) {
            const linkIcon = document.createElement('span');
            linkIcon.className = 'fill-linked-icon';
            linkIcon.innerHTML = Icons.LINK || '🔗';
            linkIcon.title = 'Linked to theme color';
            combinedInput.appendChild(linkIcon);
        }

        // Separator
        const separator = document.createElement('div');
        separator.className = 'fill-separator';
        combinedInput.appendChild(separator);

        // Opacity Input
        // If opacity is stored separately (0-100), use it. 
        // If not, try to extract from color string (legacy migration).
        let opacityVal = fill.opacity;
        if (opacityVal === undefined) {
            opacityVal = this.getOpacity(fill.color || fill.value);
        }

        const opacityInput = new NumberInput({
            value: opacityVal,
            onChange: (val, isTransient) => {
                this.updateFill(element, index, { opacity: val }, isTransient);
            },
            min: 0,
            max: 100,
            step: 1,
            units: '%',
            scrubbable: true
        });
        
        // Style opacity input to fit in group
        opacityInput.element.classList.add('fill-opacity-input');
        opacityInput.element.setAttribute('data-testid', `fill-opacity-${index}`);
        
        if (!fill.visible) {
            opacityInput.element.classList.add('fill-disabled-interactive');
        }

        combinedInput.appendChild(opacityInput.element);

        // Wrap combined input in a content container
        const fillContent = document.createElement('div');
        fillContent.className = 'fill-content';
        fillContent.appendChild(combinedInput);
        
        // Add content to PropertyRow
        propertyRow.appendChild(fillContent);

        // Blend Mode Button - add to actions container
        const isNormalBlend = !fill.blendMode || fill.blendMode === 'normal';
        const blendBtn = document.createElement('button');
        blendBtn.type = 'button';
        blendBtn.className = 'btn btn--text btn--xs btn--icon-only pi-icon-btn';
        blendBtn.setAttribute('title', `Blend Mode: ${fill.blendMode || 'Normal'}`);
        blendBtn.setAttribute('aria-label', `Blend Mode: ${fill.blendMode || 'Normal'}`);
        blendBtn.innerHTML = `<span class="btn__icon" aria-hidden="true">${Icons.BLEND_MODE}</span>`;
        blendBtn.onclick = (e) => {
            e.stopPropagation();
            this.openBlendModeMenu(blendBtn, fill, index, element);
        };
        if (!isNormalBlend) {
            blendBtn.classList.add('pi-btn-active');
        }
        
        // Insert blend mode button before visibility button in actions
        const actionsContainer = row.querySelector('.pi-property-row__actions');
        const visibilityBtn = actionsContainer.querySelector('.pi-property-row__visibility');
        actionsContainer.insertBefore(blendBtn, visibilityBtn);

        return row;
    }

    openBlendModeMenu(target, fill, index, element) {
        // Create a simple dropdown menu
        const menu = document.createElement('div');
        menu.className = 'blend-mode-menu';
        
        // Prevent clicks/scroll inside menu from closing it
        menu.addEventListener('mousedown', (e) => e.stopPropagation());

        BlendModes.forEach(({ id: mode, label }) => {
            const item = document.createElement('div');
            item.className = 'blend-mode-item';
            item.textContent = label;

            if ((fill.blendMode || 'normal') === mode) {
                item.classList.add('active');
            }

            item.onclick = () => {
                this.updateFill(element, index, { blendMode: mode });
                menu.remove();
                document.removeEventListener('mousedown', closeHandler);
            };

            menu.appendChild(item);
        });

        document.body.appendChild(menu);

        const rect = target.getBoundingClientRect();
        // Align right of menu with right of button if possible, or left
        // Let's align right edge of menu to right edge of button
        let left = rect.right - 140;
        if (left < 0) left = rect.left;
        
        menu.style.left = `${left}px`;
        menu.style.top = `${rect.bottom + 4}px`;

        // Adjust if off screen
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = `${rect.top - menuRect.height - 4}px`;
        }

        const closeHandler = (e) => {
            if (!menu.contains(e.target) && !target.contains(e.target)) {
                menu.remove();
                document.removeEventListener('mousedown', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 0);
    }

    addFill() {
        if (!this.selection) return;
        
        // Slide/master background path
        if (this.options.getElement) {
            const element = this.options.getElement(this.selection);
            if (!element) return;
            const style = element.style || {};
            let fills = style.fills ? [...style.fills] : [];
            if (!style.fills && (style.backgroundColor || style.fillType)) {
                const isTransparent = !style.backgroundColor || style.backgroundColor === 'transparent';
                if (!isTransparent) {
                    fills.push({
                        type: style.fillType || 'solid',
                        value: style.fillValue || style.backgroundColor,
                        color: style.backgroundColor,
                        opacity: 100,
                        visible: style._fillEnabled !== false
                    });
                }
            }

            const memoryDefaults = propertyMemory.getFillDefaults(this.contextKey, 'solid');
            const isFirst = fills.length === 0;
            fills.unshift(isFirst ? {
                type: 'solid',
                color: memoryDefaults?.color || LastUsed.solid,
                value: memoryDefaults?.color || LastUsed.solid,
                opacity: memoryDefaults?.opacity || 100,
                visible: true
            } : {
                type: 'solid',
                color: '#000000',
                value: '#000000',
                opacity: 25,
                visible: true
            });

            if (this.options.onUpdate) {
                this.options.onUpdate(fills, false);
            }
            return;
        }

        // Multi-select object fill: apply per element, preserving existing stacks
        const state = store.getState();
        const memoryDefaults = propertyMemory.getFillDefaults(this.contextKey, 'solid');

        // Allow external owners (tests / special sections) to override dispatch behavior.
        // Keep legacy contract: onUpdate(fills, isTransient)
        if (this.options.onUpdate) {
            const id = this.selection[0];
            const element = id ? this.getElement(state, id) : null;
            if (!element) return;
            let fills = [...this.getNormalizedFills(element)];
            const isFirst = fills.length === 0;
            fills.unshift(isFirst ? {
                type: 'solid',
                color: memoryDefaults?.color || LastUsed.solid,
                value: memoryDefaults?.color || LastUsed.solid,
                opacity: memoryDefaults?.opacity || 100,
                visible: true
            } : {
                type: 'solid',
                color: '#000000',
                value: '#000000',
                opacity: 25,
                visible: true
            });
            this.options.onUpdate(fills, false);
            return;
        }

        this.selection.forEach((id) => {
            const element = this.getElement(state, id);
            if (!element) return;
            let fills = [...this.getNormalizedFills(element)];
            const isFirst = fills.length === 0;
            fills.unshift(isFirst ? {
                type: 'solid',
                color: memoryDefaults?.color || LastUsed.solid,
                value: memoryDefaults?.color || LastUsed.solid,
                opacity: memoryDefaults?.opacity || 100,
                visible: true
            } : {
                type: 'solid',
                color: '#000000',
                value: '#000000',
                opacity: 25,
                visible: true
            });
            const newStyle = { ...(element.style || {}), fills, backgroundColor: this.getCompositeColor(fills) };
            store.dispatch('UPDATE_ELEMENT', { id, style: newStyle }, { skipHistory: false });
        });
    }

    removeFillForSelection(index) {
        if (!this.selection || this.selection.length === 0) return;
        const state = store.getState();
        this.selection.forEach((id) => {
            const element = this.getElement(state, id);
            if (!element) return;
            const fills = [...this.getNormalizedFills(element)];
            fills.splice(index, 1);
            const newStyle = { ...(element.style || {}), fills, backgroundColor: this.getCompositeColor(fills) };
            store.dispatch('UPDATE_ELEMENT', { id, style: newStyle }, { skipHistory: false });
        });
    }

    reorderFillsForSelection(fromIndex, toIndex) {
        if (!this.selection || this.selection.length === 0) return;
        const state = store.getState();
        this.selection.forEach((id) => {
            const element = this.getElement(state, id);
            if (!element) return;
            const fills = [...this.getNormalizedFills(element)];
            const [movedItem] = fills.splice(fromIndex, 1);
            const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
            fills.splice(adjustedToIndex, 0, movedItem);
            const newStyle = { ...(element.style || {}), fills, backgroundColor: this.getCompositeColor(fills) };
            store.dispatch('UPDATE_ELEMENT', { id, style: newStyle }, { skipHistory: false });
        });
    }

    updateFillForSelection(index, updates, isTransient = false) {
        if (!this.selection || this.selection.length === 0) return;
        const state = store.getState();
        this.selection.forEach((id) => {
            const element = this.getElement(state, id);
            if (!element) return;

            const style = element.style || {};
            let fills = [...this.getNormalizedFills(element)];
            const existing = { ...(fills[index] || {}) };

            let fill = existing;
            if (updates.type && updates.type !== fill.type) {
                const commonProps = {
                    type: updates.type,
                    visible: fill.visible,
                    blendMode: fill.blendMode,
                    opacity: fill.opacity !== undefined ? fill.opacity : 100
                };

                if (updates.type === 'solid') {
                    fill = {
                        ...commonProps,
                        color: updates.color || LastUsed.solid,
                        value: updates.value || updates.color || LastUsed.solid
                    };
                } else if (updates.type === 'gradient') {
                    fill = {
                        ...commonProps,
                        value: updates.value || LastUsed.gradient
                    };
                } else if (updates.type === 'code') {
                    fill = {
                        ...commonProps,
                        code: updates.code || LastUsed.code || CodeRunner.DEFAULT_CODE,
                        value: updates.value || LastUsed.code || CodeRunner.DEFAULT_CODE
                    };
                } else if (updates.type === 'image') {
                    fill = {
                        ...commonProps,
                        assetId: updates.assetId || null,
                        value: updates.value || '',
                        scaleMode: updates.scaleMode || 'fill',
                        position: updates.position || { x: 0.5, y: 0.5 }
                    };
                } else if (updates.type === 'video') {
                    fill = {
                        ...commonProps,
                        assetId: updates.assetId || null,
                        value: updates.value || '',
                        scaleMode: updates.scaleMode || 'fill'
                    };
                }
            } else {
                if (updates.blendMode !== undefined) {
                    fill.blendMode = updates.blendMode;
                }

                if (updates.code !== undefined) {
                    fill.code = updates.code;
                    LastUsed.code = updates.code;
                }

                if (updates.color) {
                    fill.color = updates.color;
                    if (fill.themeSlot) {
                        delete fill.themeSlot;
                    }
                    if (fill.type === 'solid') {
                        fill.value = updates.color;
                        LastUsed.solid = updates.color;
                    }
                }

                if (updates.themeSlot !== undefined) {
                    if (updates.themeSlot === null) {
                        delete fill.themeSlot;
                    } else {
                        fill.themeSlot = updates.themeSlot;
                    }
                }

                if (updates.opacity !== undefined) {
                    fill.opacity = updates.opacity;
                }

                if (fill.type !== 'solid' && updates.value !== undefined) {
                    fill.value = updates.value;
                    if (fill.type === 'gradient') {
                        LastUsed.gradient = updates.value;
                    }
                }

                if (updates.visible !== undefined) {
                    fill.visible = updates.visible;
                }

                if (updates.assetId !== undefined) fill.assetId = updates.assetId;
                if (updates.scaleMode !== undefined) fill.scaleMode = updates.scaleMode;
                if (updates.position !== undefined) fill.position = updates.position;
                if (updates.filters !== undefined) fill.filters = updates.filters;
                if (updates.playback !== undefined) fill.playback = updates.playback;
            }

            fills[index] = fill;

            const newStyle = { ...style, fills, backgroundColor: this.getCompositeColor(fills) };
            store.dispatch('UPDATE_ELEMENT', { id, style: newStyle }, { skipHistory: isTransient });
        });
    }

    removeFill(element, index) {
        const style = element.style || {};
        let fills = style.fills ? [...style.fills] : [];
        
        // Migration check
        if (!style.fills && (style.backgroundColor || style.fillType)) {
             fills = [{
                type: style.fillType || 'solid',
                value: style.fillValue || style.backgroundColor,
                color: style.backgroundColor,
                opacity: 100,
                visible: style._fillEnabled !== false
             }];
        }

        fills.splice(index, 1);

        if (this.options.onUpdate) {
            this.options.onUpdate(fills, false);
        } else {
            this.updateStyle({
                fills: fills,
                backgroundColor: this.getCompositeColor(fills)
            });
        }
    }

    updateFill(element, index, updates, isTransient = false) {
        // Multi-selection object fills: update per element without overwriting stacks
        if (!this.options.onUpdate && !this.options.getElement && this.selection && this.selection.length > 1) {
            this.updateFillForSelection(index, updates, isTransient);
            return;
        }
        // IMPORTANT: Get fresh element data from store to avoid stale reference issues
        // The element parameter may be captured in a closure and become stale
        const state = store.getState();
        let freshElement;
        if (this.options.getElement) {
            freshElement = this.options.getElement(this.selection);
        } else {
            freshElement = this.getElement(state, element.id);
        }
        
        // Fallback to provided element if not found (shouldn't happen)
        const currentElement = freshElement || element;
        const style = currentElement.style || {};
        let fills = style.fills ? [...style.fills] : [];
        
        // Migration check
        if (!style.fills && (style.backgroundColor || style.fillType)) {
             fills = [{
                type: style.fillType || 'solid',
                value: style.fillValue || style.backgroundColor,
                color: style.backgroundColor,
                opacity: 100,
                visible: style._fillEnabled !== false
             }];
        }

        let fill = { ...fills[index] };
        
        if (updates.type && updates.type !== fill.type) {
            // When changing fill type, create a clean fill object
            // Only preserve common properties, not type-specific ones like assetId
            const commonProps = {
                type: updates.type,
                visible: fill.visible,
                blendMode: fill.blendMode,
                opacity: fill.opacity !== undefined ? fill.opacity : 100
            };
            
            // Set type-specific defaults
            if (updates.type === 'solid') {
                fill = {
                    ...commonProps,
                    color: updates.color || LastUsed.solid,
                    value: updates.value || updates.color || LastUsed.solid
                };
            } else if (updates.type === 'gradient') {
                fill = {
                    ...commonProps,
                    value: updates.value || LastUsed.gradient
                };
            } else if (updates.type === 'code') {
                fill = {
                    ...commonProps,
                    code: updates.code || LastUsed.code || CodeRunner.DEFAULT_CODE,
                    value: updates.value || LastUsed.code || CodeRunner.DEFAULT_CODE
                };
            } else if (updates.type === 'image') {
                fill = {
                    ...commonProps,
                    assetId: updates.assetId || null,
                    value: updates.value || '',
                    scaleMode: updates.scaleMode || 'fill',
                    position: updates.position || { x: 0.5, y: 0.5 }
                };
            } else if (updates.type === 'video') {
                fill = {
                    ...commonProps,
                    assetId: updates.assetId || null,
                    value: updates.value || '',
                    scaleMode: updates.scaleMode || 'fill'
                };
            }
        } else {
            // Same type - merge updates normally
            if (updates.blendMode !== undefined) {
                fill.blendMode = updates.blendMode;
            }
            
            if (updates.code !== undefined) {
                fill.code = updates.code;
                LastUsed.code = updates.code;
            }

            if (updates.color) {
                // Store color as-is (hex or rgb) - opacity is applied separately via layer.style.opacity
                // Do NOT bake opacity into the color, as the renderer applies opacity on the layer
                fill.color = updates.color;
                
                // Unlink from theme if color is manually changed
                if (fill.themeSlot) {
                    delete fill.themeSlot;
                }
                
                if (fill.type === 'solid') {
                    fill.value = updates.color;
                    LastUsed.solid = updates.color;
                }
            }

            // Handle themeSlot linking
            if (updates.themeSlot !== undefined) {
                if (updates.themeSlot === null) {
                    // Unlink from theme
                    delete fill.themeSlot;
                } else {
                    // Link to theme slot
                    fill.themeSlot = updates.themeSlot;
                }
            }

            if (updates.opacity !== undefined) {
                fill.opacity = updates.opacity;
                // Don't bake opacity into color - it's applied via layer.style.opacity in the renderer
            }

            if (fill.type !== 'solid' && updates.value !== undefined) {
                fill.value = updates.value;
                if (fill.type === 'gradient') {
                    LastUsed.gradient = updates.value;
                }
            }

            if (updates.visible !== undefined) {
                fill.visible = updates.visible;
            }

            // Handle media fill properties (image/video)
            if (updates.assetId !== undefined) {
                fill.assetId = updates.assetId;
            }
            if (updates.scaleMode !== undefined) {
                fill.scaleMode = updates.scaleMode;
            }
            if (updates.position !== undefined) {
                fill.position = updates.position;
            }
            if (updates.filters !== undefined) {
                fill.filters = updates.filters;
            }
            if (updates.playback !== undefined) {
                fill.playback = updates.playback;
            }
        }

        fills[index] = fill;

        if (this.options.onUpdate) {
            this.options.onUpdate(fills, isTransient);
        } else {
            this.updateStyle({
                fills: fills,
                backgroundColor: this.getCompositeColor(fills)
            }, isTransient);
        }
    }

    reorderFills(element, fromIndex, toIndex) {
        const style = element.style || {};
        if (!style.fills) return;

        const newFills = [...style.fills];
        const [movedItem] = newFills.splice(fromIndex, 1);
        
        // Adjust toIndex if we removed an item before it
        if (fromIndex < toIndex) {
            toIndex--;
        }
        
        newFills.splice(toIndex, 0, movedItem);

        if (this.options.onUpdate) {
            this.options.onUpdate(newFills, false);
        } else {
            this.updateStyle({
                fills: newFills,
                backgroundColor: this.getCompositeColor(newFills)
            });
        }
    }

    getCompositeColor(fills) {
        // Find the first visible fill to use as legacy fallback
        // Or maybe we should construct a CSS background string?
        // For now, return the top-most visible color for simple renderers
        const visible = fills.find(f => f.visible);
        return visible ? visible.color : 'transparent';
    }

    // Helpers
    getOpacity(colorString) {
        if (!colorString) return 100;
        if (colorString.startsWith('rgba')) {
            const match = colorString.match(/rgba?\(.*,\s*([\d.]+)\)/);
            if (match) {
                return Math.round(parseFloat(match[1]) * 100);
            }
        }
        return 100;
    }

    applyOpacity(colorString, opacityPercent) {
        // Convert hex/rgb/rgba to rgba with new alpha
        let r = 0, g = 0, b = 0;
        
        if (colorString.startsWith('#')) {
            const hex = colorString.substring(1);
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            }
        } else if (colorString.startsWith('rgb')) {
            const match = colorString.match(/\d+/g);
            if (match) {
                r = parseInt(match[0]);
                g = parseInt(match[1]);
                b = parseInt(match[2]);
            }
        }
        
        const alpha = opacityPercent / 100;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    rgbToHex(colorString) {
        // ColorInput expects Hex. If we have rgba/rgb, convert to hex (ignoring alpha for the input value)
        if (colorString.startsWith('#')) return colorString;
        
        let r = 0, g = 0, b = 0;
        if (colorString.startsWith('rgb')) {
            const match = colorString.match(/\d+/g);
            if (match) {
                r = parseInt(match[0]);
                g = parseInt(match[1]);
                b = parseInt(match[2]);
            }
        }
        
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    openFlyout(targetElement, fill, index, element) {
        if (this.activeFlyout) {
            if (typeof this.activeFlyout.destroy === 'function') {
                this.activeFlyout.destroy();
            }
            this.activeFlyout.close();
            this.activeFlyout = null;
        }

        const flyout = new FillFlyout({
            trigger: targetElement,
            fill: fill,
            contextKey: this.contextKey, // Pass context for memory system
            onChange: (updates, isTransient) => {
                this.updateFill(element, index, updates, isTransient);
            },
            onClose: () => {
                this.activeFlyout = null;
            }
        });

        flyout.open();
        this.activeFlyout = flyout;
    }

    getGradientCss(gradient) {
        if (!gradient) return 'none';
        const stops = gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ');
        
        if (gradient.type === 'linear') {
            return `linear-gradient(${gradient.angle}deg, ${stops})`;
        } else if (gradient.type === 'radial') {
             return `radial-gradient(circle, ${stops})`;
        } else if (gradient.type === 'angular') {
             return `conic-gradient(from ${gradient.angle || 0}deg at center, ${stops})`;
        } else if (gradient.type === 'diamond') {
             return `radial-gradient(circle, ${stops})`;
        }
        return 'none';
    }

    /**
     * Determines if a color is dark using WCAG luminance formula
     */
    isColorDark(color) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false; // Fallback for test environment
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            
            const toLinear = (c) => {
                const sRGB = c / 255;
                return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
            };
            const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
            return luminance < 0.5;
        } catch (e) {
            // Fallback for environments without canvas support
            return false;
        }
    }

    /**
     * Updates the swatch border based on color darkness
     */
    updateSwatchBorder(preview, color, isHover = false) {
        const isDark = this.isColorDark(color);
        const opacity = isHover ? 1 : 0.3;
        preview.style.border = 'none';
        preview.style.boxShadow = isDark 
            ? `inset 0 0 0 1px rgba(255, 255, 255, ${opacity})`
            : `inset 0 0 0 1px rgba(0, 0, 0, ${opacity})`;
    }
}
