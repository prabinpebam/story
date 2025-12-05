import { Section } from '../components/Section.js';
import { ColorInput } from '../components/ColorInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { IconButton } from '../components/IconButton.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';
import { FillFlyout } from '../components/FillFlyout/FillFlyout.js';
import { BlendModes } from '../../core/constants/BlendModes.js';
import { EmptyState } from '../components/EmptyState.js';

import { CodeRunner } from '../../core/effects/CodeRunner.js';
import { propertyMemory } from '../../core/services/PropertyMemoryManager.js';
import { linkedPropertyManager, COLOR_SLOTS } from '../../core/services/LinkedPropertyManager.js';
import { StyleResolver } from '../../utils/StyleResolver.js';

// Module-level cache for last used values (legacy, now managed by PropertyMemoryManager)
const LastUsed = {
    solid: '#D9D9D9',
    gradient: 'linear-gradient(90deg, #000000 0%, #ffffff 100%)',
    code: null // Will use CodeRunner.DEFAULT_CODE when accessed
};

export class FillSection {
    constructor(options = {}) {
        this.options = options;
        // Context key for memory - default to object fill, can be overridden (e.g., 'fill.slide')
        this.contextKey = options.contextKey || 'fill.object';
        
        this.section = new Section({ 
            title: options.title || 'Fill',
            actions: [
                { icon: Icons.PLUS, title: 'Add Fill', onClick: () => this.addFill() }
            ]
        });
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
                this.section.element.style.display = 'none';
            }
            return;
        }
        
        this.section.element.style.display = 'block';
        this.selection = selection;
        
        // If custom getElement is provided
        let element;
        if (this.options.getElement) {
            element = this.options.getElement(selection);
        } else {
            const state = store.getState();
            element = this.getElement(state, selection[0]);
        }
        
        if (element) {
            this.render(element);
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
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '8px';
        
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
        const row = document.createElement('div');
        row.className = 'pi-row';
        
        // Check if fill is linked to a theme slot
        const isLinked = fill.themeSlot && COLOR_SLOTS[fill.themeSlot];
        if (isLinked) {
            row.classList.add('fill-linked');
        }
        
        row.dataset.index = index;

        // Drag Handle
        const dragHandle = document.createElement('div');
        dragHandle.innerHTML = Icons.DRAG_HANDLE;
        dragHandle.style.color = 'var(--color-text-tertiary)';
        dragHandle.style.cursor = 'grab';
        dragHandle.style.fontSize = '12px';
        dragHandle.style.display = 'flex';
        dragHandle.style.alignItems = 'center';
        dragHandle.style.justifyContent = 'center';
        dragHandle.style.width = '16px';
        dragHandle.style.height = '100%';
        dragHandle.draggable = true;
        
        dragHandle.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            e.dataTransfer.setDragImage(row, 0, 0);
            row.style.opacity = '0.5';
            this.dragStartIndex = index;
            e.stopPropagation();
        });

        dragHandle.addEventListener('dragend', (e) => {
            row.style.opacity = '1';
            this.container.querySelectorAll('.pi-row').forEach(r => {
                r.style.borderTop = 'none';
                r.style.borderBottom = 'none';
            });
            this.dragStartIndex = null;
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            e.dataTransfer.dropEffect = 'move';
            
            if (this.dragStartIndex === null || this.dragStartIndex === index) return;

            // Visual feedback
            const rect = row.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                row.style.borderTop = '2px solid var(--color-accent)';
                row.style.borderBottom = 'none';
            } else {
                row.style.borderTop = 'none';
                row.style.borderBottom = '2px solid var(--color-accent)';
            }
        });

        row.addEventListener('dragleave', () => {
            row.style.borderTop = 'none';
            row.style.borderBottom = 'none';
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            let toIndex = index;
            
            // Calculate if dropping above or below
            const rect = row.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY > midY) {
                // Dropped below this item
                // If moving down: from 0 to 2 (below 2) -> insert at 3? No.
                // If we are at index 2, and drop below, we want to be at index 3?
                // But splice logic is tricky.
                // Let's just say we want to insert AFTER this index.
                // But if we are moving down, the index shifts.
                // Let's simplify:
                // We want the target index in the NEW array.
            }
            
            // Actually, let's just use the visual indicator logic.
            // If borderTop, we drop BEFORE (index).
            // If borderBottom, we drop AFTER (index + 1).
            
            if (e.clientY > midY) {
                toIndex = index + 1;
            }
            
            if (fromIndex !== toIndex) {
                this.reorderFills(element, fromIndex, toIndex);
            }
            
            row.style.borderTop = 'none';
            row.style.borderBottom = 'none';
        });

        row.appendChild(dragHandle);

        // Combined Input Group (Swatch + Opacity)
        const combinedInput = document.createElement('div');
        combinedInput.style.flex = '1';
        combinedInput.style.display = 'flex';
        combinedInput.style.alignItems = 'center';
        combinedInput.style.border = '1px solid var(--color-border)';
        combinedInput.style.borderRadius = 'var(--radius-sm)';
        combinedInput.style.height = '24px';
        combinedInput.style.overflow = 'hidden';
        combinedInput.style.backgroundColor = 'var(--color-bg-input)';

        // 1. Color Swatch (Trigger for Flyout)
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch-trigger';
        swatch.style.width = '22px'; // Fixed width
        swatch.style.height = '100%';
        swatch.style.cursor = 'pointer';
        swatch.style.display = 'flex';
        swatch.style.alignItems = 'center';
        swatch.style.justifyContent = 'center';
        // swatch.style.borderRight = '1px solid #444'; // Removed separator
        
        // Preview
        const preview = document.createElement('div');
        preview.style.width = 'var(--swatch-size-sm)';
        preview.style.height = 'var(--swatch-size-sm)';
        preview.style.borderRadius = 'var(--radius-xs)';
        
        // Determine the color for the swatch border
        let swatchColor = '#000000';
        
        // Resolve theme slot to actual hex color if present
        if (fill.themeSlot !== undefined && fill.themeSlot !== null) {
            swatchColor = StyleResolver.resolveThemeSlot(fill.themeSlot, fill.color || fill.value || '#000000');
        }
        
        if (fill.type === 'image') {
             // Check if there's actually an image asset
             if (fill.assetId || fill.value) {
                 preview.style.backgroundImage = `url(${fill.value})`;
                 preview.style.backgroundSize = 'cover';
             } else {
                 // No image - show placeholder icon
                 preview.style.backgroundColor = 'var(--color-surface-tertiary)';
                 preview.innerHTML = '<i class="fa-solid fa-image" style="font-size: 10px; color: var(--color-text-tertiary);"></i>';
             }
             // Use a neutral border for images
             preview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.3)';
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
             preview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.3)';
        } else if (fill.type === 'gradient') {
             if (typeof fill.value === 'string') {
                 preview.style.background = fill.value;
             } else {
                 preview.style.background = this.getGradientCss(fill.value);
             }
             // Use a neutral border for gradients
             preview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.3)';
        } else if (fill.type === 'code') {
             preview.style.backgroundColor = 'var(--color-surface-tertiary)';
             preview.innerHTML = '<i class="fa-solid fa-code" style="font-size: 10px; color: var(--color-text-primary);"></i>';
             preview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.3)';
        } else {
             // Solid fill - use resolved swatchColor (may have been resolved from themeSlot above)
             if (!swatchColor || swatchColor === '#000000') {
                 swatchColor = fill.color || fill.value || '#000000';
             }
             preview.style.backgroundColor = swatchColor;
             this.updateSwatchBorder(preview, swatchColor, false);
        }
        swatch.appendChild(preview);
        
        // Hover handlers for border opacity
        swatch.addEventListener('mouseenter', () => {
            if (fill.type === 'solid' || !fill.type) {
                this.updateSwatchBorder(preview, swatchColor, true);
            } else {
                preview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 1)';
            }
        });
        swatch.addEventListener('mouseleave', () => {
            if (fill.type === 'solid' || !fill.type) {
                this.updateSwatchBorder(preview, swatchColor, false);
            } else {
                preview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.3)';
            }
        });

        swatch.onclick = (e) => {
            e.stopPropagation();
            this.openFlyout(swatch, fill, index, element);
        };
        
        if (!fill.visible) {
            swatch.style.opacity = '0.5';
        }

        combinedInput.appendChild(swatch);

        // 2. Hex Input (Editable) or Linked Value Display
        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.className = 'fill-hex-input';
        hexInput.spellcheck = false;
        
        if (isLinked && (fill.type === 'solid' || !fill.type)) {
            // Show theme slot name for linked fills
            const slotInfo = COLOR_SLOTS[fill.themeSlot];
            hexInput.value = slotInfo?.label || fill.themeSlot;
            hexInput.disabled = true;
            hexInput.classList.add('fill-hex-input--linked');
            hexInput.title = `Linked to theme: ${slotInfo?.label || fill.themeSlot}`;
        } else if (fill.type === 'solid' || !fill.type) {
            hexInput.value = this.rgbToHex(fill.color || fill.value || '#000000').toUpperCase();
            hexInput.onchange = (e) => {
                let val = e.target.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                // Basic validation
                if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
                    this.updateFill(element, index, { color: val });
                } else {
                    // Revert
                    e.target.value = this.rgbToHex(fill.color || fill.value || '#000000').toUpperCase();
                }
            };
        } else if (fill.type === 'code') {
            hexInput.value = 'Code Fill';
            hexInput.disabled = true;
        } else {
            hexInput.value = fill.type.charAt(0).toUpperCase() + fill.type.slice(1);
            hexInput.disabled = true;
        }
        
        if (!fill.visible) {
            hexInput.style.opacity = '0.5';
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
        separator.style.width = '1px';
        separator.style.height = '12px'; // Reduced height
        separator.style.backgroundColor = 'var(--color-border)';
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
        opacityInput.element.style.width = '50px';
        opacityInput.element.style.flex = '0 0 50px';
        opacityInput.element.style.border = 'none';
        opacityInput.element.style.background = 'transparent';
        opacityInput.element.querySelector('input').style.padding = '0';
        opacityInput.element.querySelector('input').style.textAlign = 'center';
        
        if (!fill.visible) {
            opacityInput.element.style.opacity = '0.5';
            opacityInput.element.style.pointerEvents = 'none';
        }

        combinedInput.appendChild(opacityInput.element);
        row.appendChild(combinedInput);

        // Button Group
        const buttonGroup = document.createElement('div');
        buttonGroup.style.display = 'flex';
        buttonGroup.style.alignItems = 'center';
        buttonGroup.style.gap = '0px'; // Minimize space
        buttonGroup.style.marginLeft = '4px';

        // Blend Mode Button
        const isNormalBlend = !fill.blendMode || fill.blendMode === 'normal';
        const blendBtn = new IconButton({
            icon: Icons.BLEND_MODE,
            title: `Blend Mode: ${fill.blendMode || 'Normal'}`,
            onClick: (e) => {
                // Find the button element (could be the icon or the button wrapper)
                const btn = e.target.closest('button') || e.target;
                this.openBlendModeMenu(btn, fill, index, element);
            }
        });
        if (!isNormalBlend) {
            blendBtn.element.style.color = 'var(--color-accent)'; // Blue if active
        }
        blendBtn.element.style.width = '24px'; // Compact
        blendBtn.element.style.height = '24px';
        blendBtn.element.style.padding = '0';

        // Visibility Button
        const visIcon = !fill.visible ? Icons.HIDDEN : Icons.VISIBLE;
        const visBtn = new IconButton({
            icon: visIcon,
            title: !fill.visible ? 'Show Fill' : 'Hide Fill',
            onClick: () => {
                this.updateFill(element, index, { visible: !fill.visible });
            }
        });
        visBtn.element.style.width = '24px'; // Compact
        visBtn.element.style.height = '24px';
        visBtn.element.style.padding = '0';

        // Remove Button
        const removeBtn = new IconButton({
            icon: Icons.MINUS,
            title: 'Remove Fill',
            onClick: () => {
                this.removeFill(element, index);
            }
        });
        removeBtn.element.style.width = '24px'; // Compact
        removeBtn.element.style.height = '24px';
        removeBtn.element.style.padding = '0';

        buttonGroup.appendChild(blendBtn.element);
        buttonGroup.appendChild(visBtn.element);
        buttonGroup.appendChild(removeBtn.element);

        row.appendChild(buttonGroup);

        return row;
    }

    openBlendModeMenu(target, fill, index, element) {
        // Create a simple dropdown menu
        const menu = document.createElement('div');
        menu.style.position = 'fixed';
        menu.style.zIndex = 'var(--z-popover)';
        menu.style.backgroundColor = 'var(--menu-bg)';
        menu.style.border = '1px solid var(--color-border)';
        menu.style.borderRadius = 'var(--radius-sm)';
        menu.style.padding = '4px 0';
        menu.style.boxShadow = 'var(--shadow-floating)';
        menu.style.width = '140px';
        menu.style.maxHeight = '300px';
        menu.style.overflowY = 'auto';
        menu.style.fontFamily = 'var(--font-ui)';
        
        // Prevent clicks/scroll inside menu from closing it
        menu.addEventListener('mousedown', (e) => e.stopPropagation());

        BlendModes.forEach(({ id: mode, label }) => {
            const item = document.createElement('div');
            item.textContent = label;
            item.style.padding = '6px 12px';
            item.style.fontSize = 'var(--font-size-md)';
            item.style.color = 'var(--color-text-primary)';
            item.style.cursor = 'pointer';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';

            if ((fill.blendMode || 'normal') === mode) {
                item.style.backgroundColor = 'var(--color-accent)';
                item.style.color = 'var(--color-text-on-accent)';
            }

            item.onmouseenter = () => {
                if ((fill.blendMode || 'normal') !== mode) item.style.backgroundColor = 'var(--color-bg-hover)';
            };
            item.onmouseleave = () => {
                if ((fill.blendMode || 'normal') !== mode) item.style.backgroundColor = 'transparent';
            };

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
        
        let element;
        if (this.options.getElement) {
            element = this.options.getElement(this.selection);
        } else {
            const state = store.getState();
            element = this.getElement(state, this.selection[0]);
        }
        if (!element) return;

        const style = element.style || {};
        let fills = style.fills ? [...style.fills] : [];
        
        // If migrating from legacy single fill
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

        // Add new fill to TOP (index 0)
        // Use memory for defaults when adding new fill
        const memoryDefaults = propertyMemory.getFillDefaults(this.contextKey, 'solid');
        
        const isFirst = fills.length === 0;
        
        if (isFirst) {
            // First fill: use memory color at full opacity
            fills.unshift({
                type: 'solid',
                color: memoryDefaults?.color || LastUsed.solid,
                value: memoryDefaults?.color || LastUsed.solid,
                opacity: memoryDefaults?.opacity || 100,
                visible: true
            });
        } else {
            // Subsequent fills: black at 25% opacity
            fills.unshift({
                type: 'solid',
                color: '#000000',
                value: '#000000',
                opacity: 25,
                visible: true
            });
        }

        if (this.options.onUpdate) {
            this.options.onUpdate(fills, false);
        } else {
            store.dispatch('UPDATE_ELEMENT', {
                id: element.id,
                style: {
                    ...style,
                    fills: fills,
                    backgroundColor: this.getCompositeColor(fills)
                }
            });
        }
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
            store.dispatch('UPDATE_ELEMENT', {
                id: element.id,
                style: {
                    ...style,
                    fills: fills,
                    backgroundColor: this.getCompositeColor(fills)
                }
            });
        }
    }

    updateFill(element, index, updates, isTransient = false) {
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
            const payload = {
                id: currentElement.id,
                style: {
                    ...style,
                    fills: fills,
                    backgroundColor: this.getCompositeColor(fills)
                }
            };
            store.dispatch('UPDATE_ELEMENT', payload, { skipHistory: isTransient });
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
            store.dispatch('UPDATE_ELEMENT', {
                id: element.id,
                style: {
                    ...style,
                    fills: newFills,
                    backgroundColor: this.getCompositeColor(newFills)
                }
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
