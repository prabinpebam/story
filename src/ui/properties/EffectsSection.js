import { BaseSection } from './BaseSection.js';
import { ColorInput } from '../components/ColorInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { IconButton } from '../components/IconButton.js';
import { PropertyRow } from '../components/PropertyRow.js';
import { Dropdown } from '../components/Dropdown.js';
import { Flyout } from '../components/Flyout.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';
import { EmptyState } from '../components/EmptyState.js';
import { 
    EffectTypes, 
    EffectTypeLabels, 
    EffectDefaults,
    getEffectTypeOptions,
    isShadowEffect,
    isBlurEffect,
    createEffect,
    BlendModeOptions
} from '../../core/constants/EffectDefaults.js';

/**
 * EffectsSection - Property Inspector section for visual effects
 * 
 * Data Model:
 * element.style.effects = [
 *   { id: 'xxx', type: 'dropShadow', x: 0, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 25, blendMode: 'normal', visible: true },
 *   { id: 'yyy', type: 'innerShadow', ... },
 *   { id: 'zzz', type: 'layerBlur', radius: 12, mode: 'uniform', visible: true }
 * ]
 */
export class EffectsSection extends BaseSection {
    constructor() {
        super({ 
            title: 'Effects',
            collapsed: false,
            actions: [
                { icon: Icons.STYLES, title: 'Effect Styles', onClick: () => this.openStylesPanel() },
                { icon: Icons.PLUS, title: 'Add Effect', onClick: () => this.addEffect() }
            ]
        });
        
        this.container = document.createElement('div');
        this.container.className = 'pi-section-content pi-gap-0';
        this.section.appendChild(this.container);
        
        this.activeFlyout = null;
        this.activeEffectId = null;
        this.activeEffectIndex = null;
    }

    /**
     * Update section with current selection
     */
    update(selection) {
        super.update(selection);
        
        if (!this.selection || this.selection.length === 0) {
            return;
        }
        
        const state = store.getState();
        const elements = this.selection.map((id) => this.getElement(state, id)).filter(Boolean);
        if (elements.length === 0) return;
        if (elements.length === 1) {
            this.render(elements[0]);
        } else {
            this.renderMulti(elements);
        }
    }

    getMixedResult(values) {
        if (!values || values.length === 0) return { value: undefined, mixed: false };
        const first = values[0];
        const mixed = values.some((v) => v !== first);
        return { value: first, mixed };
    }

    areEffectStacksCompatible(effectsByElement) {
        if (effectsByElement.length === 0) return false;
        const first = effectsByElement[0];
        for (let i = 1; i < effectsByElement.length; i++) {
            if (effectsByElement[i].length !== first.length) return false;
        }
        for (let index = 0; index < first.length; index++) {
            const baseType = first[index]?.type;
            for (let i = 1; i < effectsByElement.length; i++) {
                if (effectsByElement[i][index]?.type !== baseType) return false;
            }
        }
        return true;
    }

    renderMulti(elements) {
        this.container.innerHTML = '';

        const effectsByElement = elements.map((el) => this.getEffects(el));
        const compatible = this.areEffectStacksCompatible(effectsByElement);
        if (!compatible) {
            const empty = new EmptyState('Mixed');
            this.container.appendChild(empty.element);
            return;
        }

        const effects = effectsByElement[0] || [];
        if (effects.length === 0) {
            const empty = new EmptyState('No effects');
            this.container.appendChild(empty.element);
            return;
        }

        effects.forEach((effect, index) => {
            const row = this.createEffectRowMulti(effect, index, effects.length, effectsByElement);
            this.container.appendChild(row);
        });
    }

    createEffectRowMulti(effect, index, total, effectsByElement) {
        const visibleValues = effectsByElement.map((effects) => (effects[index]?.visible !== false));
        const visibleMixed = visibleValues.some((v) => v !== visibleValues[0]);
        const allVisible = visibleValues.every(Boolean);

        const propertyRow = new PropertyRow({
            index,
            draggable: total > 1,
            showVisibility: true,
            showDelete: true,
            onVisibilityToggle: () => {
                const nextVisible = allVisible ? false : true;
                this.toggleEffectVisibilityAtIndex(index, nextVisible);
            },
            onDelete: () => {
                this.removeEffectAtIndex(index);
            },
            onDrop: ({ position, event }) => {
                const fromIndex = parseInt(event.dataTransfer.getData('text/plain'));
                let toIndex = index;
                if (position === 'after') {
                    toIndex = index + 1;
                }
                if (fromIndex !== toIndex) {
                    this.reorderEffect(fromIndex, toIndex);
                }
            },
            onClick: () => {
                this.openEffectFlyoutAtIndex(index, effectsByElement);
            }
        });

        propertyRow.setVisible(visibleMixed ? true : allVisible);
        propertyRow.setActive(this.activeEffectIndex === index);

        const row = propertyRow.element;
        row.classList.add('pi-effect-row');
        row.dataset.effectIndex = index;
        row.setAttribute('data-testid', `effect-row-${index}`);

        const effectContent = document.createElement('div');
        effectContent.className = 'pi-effect-content';

        const indicator = document.createElement('div');
        indicator.className = 'pi-effect-indicator';
        indicator.innerHTML = this.getEffectIcon(effect.type);
        effectContent.appendChild(indicator);

        const label = document.createElement('div');
        label.className = 'pi-effect-label';
        label.textContent = EffectTypeLabels[effect.type] || effect.type;
        effectContent.appendChild(label);

        propertyRow.appendChild(effectContent);
        return row;
    }

    /**
     * Get effects array from element
     */
    getEffects(element) {
        return element?.style?.effects || [];
    }

    /**
     * Render effects list
     */
    render(element) {
        this.container.innerHTML = '';
        
        const effects = this.getEffects(element);
        
        if (effects.length === 0) {
            const empty = new EmptyState('No effects');
            this.container.appendChild(empty.element);
            return;
        }

        effects.forEach((effect, index) => {
            const row = this.createEffectRow(effect, index, effects.length);
            this.container.appendChild(row);
        });
    }

    /**
     * Create a single effect row
     */
    createEffectRow(effect, index, total) {
        // Create PropertyRow wrapper with drag/visibility/delete controls
        const propertyRow = new PropertyRow({
            index,
            draggable: total > 1, // Only draggable if multiple effects
            showVisibility: true,
            showDelete: true,
            onVisibilityToggle: () => {
                this.toggleEffectVisibility(effect.id);
            },
            onDelete: () => {
                this.removeEffect(effect.id);
            },
            onDrop: ({ position, event }) => {
                const fromIndex = parseInt(event.dataTransfer.getData('text/plain'));
                let toIndex = index;
                
                // Calculate drop position
                if (position === 'after') {
                    toIndex = index + 1;
                }
                
                if (fromIndex !== toIndex) {
                    this.reorderEffect(fromIndex, toIndex);
                }
            },
            onClick: () => {
                this.openEffectFlyout(effect);
            }
        });
        
        // Set visibility and active state
        propertyRow.setVisible(effect.visible !== false);
        propertyRow.setActive(this.activeEffectId === effect.id);
        
        // Add effect-specific classes and data
        const row = propertyRow.element;
        row.classList.add('pi-effect-row');
        row.dataset.effectId = effect.id;
        row.dataset.effectIndex = index;
        row.setAttribute('data-testid', `effect-row-${index}`);

        // Effect content (icon + label)
        const effectContent = document.createElement('div');
        effectContent.className = 'pi-effect-content';

        // Effect indicator icon
        const indicator = document.createElement('div');
        indicator.className = 'pi-effect-indicator';
        indicator.innerHTML = this.getEffectIcon(effect.type);
        effectContent.appendChild(indicator);

        // Effect label
        const label = document.createElement('div');
        label.className = 'pi-effect-label';
        label.textContent = EffectTypeLabels[effect.type] || effect.type;
        effectContent.appendChild(label);
        
        // Add content to PropertyRow
        propertyRow.appendChild(effectContent);
        
        return row;
    }

    /**
     * Get icon for effect type
     */
    getEffectIcon(type) {
        switch (type) {
            case EffectTypes.DROP_SHADOW:
                return Icons.EFFECT_SHADOW || '◫';
            case EffectTypes.INNER_SHADOW:
                return Icons.EFFECT_INNER_SHADOW || Icons.EFFECT_SHADOW || '◩';
            case EffectTypes.LAYER_BLUR:
                return Icons.EFFECT_BLUR || '⊞';
            case EffectTypes.BACKGROUND_BLUR:
                return Icons.EFFECT_BG_BLUR || '⊟';
            default:
                return '●';
        }
    }

    /**
     * Setup drag and drop handlers for reordering
     */
    setupDragHandlers(handle, row, effectId, index) {
        handle.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            this.dragState = { effectId, startIndex: index };
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', effectId);
            row.classList.add('dragging');
        });

        handle.addEventListener('dragend', () => {
            this.dragState = null;
            const rows = this.container.querySelectorAll('.pi-effect-row');
            rows.forEach(r => r.classList.remove('dragging', 'drag-over'));
        });

        row.addEventListener('dragover', (e) => {
            if (!this.dragState) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            row.classList.add('drag-over');
        });

        row.addEventListener('dragleave', () => {
            row.classList.remove('drag-over');
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            row.classList.remove('drag-over');
            
            if (!this.dragState) return;
            
            const targetIndex = parseInt(row.dataset.effectIndex);
            if (targetIndex !== this.dragState.startIndex) {
                this.reorderEffect(this.dragState.startIndex, targetIndex);
            }
        });
    }

    /**
     * Open effect settings flyout
     */
    openEffectFlyout(effect) {
        if (this.activeFlyout) {
            this.activeFlyout.close();
        }

        this.activeEffectId = effect.id;
        this.activeEffectIndex = null;
        
        const trigger = this.container.querySelector(`[data-effect-id="${effect.id}"]`);
        
        const content = isShadowEffect(effect.type) 
            ? this.createShadowFlyoutContent(effect)
            : this.createBlurFlyoutContent(effect);

        this.activeFlyout = new Flyout({
            trigger: trigger,
            content: content,
            position: 'left',
            onClose: () => {
                this.activeFlyout = null;
                this.activeEffectId = null;
                this.refreshRender();
            }
        });
        
        this.activeFlyout.open();
        this.refreshRender();
    }

    openEffectFlyoutAtIndex(index, effectsByElement) {
        if (this.activeFlyout) {
            this.activeFlyout.close();
        }

        const baseEffect = effectsByElement?.[0]?.[index];
        if (!baseEffect) return;

        this.activeEffectId = null;
        this.activeEffectIndex = index;

        const trigger = this.container.querySelector(`[data-effect-index="${index}"]`);
        const content = isShadowEffect(baseEffect.type)
            ? this.createShadowFlyoutContent(baseEffect, { index, effectsByElement })
            : this.createBlurFlyoutContent(baseEffect, { index, effectsByElement });

        this.activeFlyout = new Flyout({
            trigger: trigger,
            content: content,
            position: 'left',
            onClose: () => {
                this.activeFlyout = null;
                this.activeEffectIndex = null;
                this.refreshRender();
            }
        });

        this.activeFlyout.open();
        this.refreshRender();
    }

    /**
     * Create flyout content for shadow effects
     */
    createShadowFlyoutContent(effect, mixedCtx = null) {
        const content = document.createElement('div');
        content.className = 'pi-flyout-content';

        const idKey = mixedCtx ? `idx-${mixedCtx.index}` : `id-${effect.id}`;

        // Header
        const header = document.createElement('div');
        header.className = 'pi-flyout-header';

        const typeSelect = new Dropdown({
            options: getEffectTypeOptions(),
            value: effect.type,
            size: 'lg',
            onChange: (newType) => {
                if (mixedCtx) {
                    this.changeEffectTypeAtIndex(mixedCtx.index, newType);
                } else {
                    this.changeEffectType(effect.id, newType);
                }
            }
        });
        typeSelect.element.setAttribute('data-testid', `effect-${idKey}-type`);

        const headerRight = document.createElement('div');
        headerRight.className = 'pi-effect-row-right';

        const blendDropdown = new Dropdown({
            options: BlendModeOptions,
            value: effect.blendMode || 'normal',
            size: 'sm',
            onChange: (val) => {
                if (mixedCtx) {
                    this.updateEffectAtIndex(mixedCtx.index, { blendMode: val });
                } else {
                    this.updateEffect(effect.id, { blendMode: val });
                }
            }
        });
        blendDropdown.element.setAttribute('data-testid', `effect-${idKey}-blendMode`);

        if (mixedCtx) {
            const blendValues = mixedCtx.effectsByElement.map((effects) => effects[mixedCtx.index]?.blendMode || 'normal');
            const blendResult = this.getMixedResult(blendValues);
            blendDropdown.setMixed(blendResult.mixed);
        }

        const closeBtn = new IconButton({ 
            icon: Icons.CLOSE, 
            title: 'Close', 
            onClick: () => this.activeFlyout.close() 
        });

        headerRight.appendChild(blendDropdown.element);
        headerRight.appendChild(closeBtn.element);
        header.appendChild(typeSelect.element);
        header.appendChild(headerRight);
        content.appendChild(header);

        // X / Y Position
        const row1 = document.createElement('div');
        row1.className = 'pi-flyout-row';
        
        const xInput = new NumberInput({ 
            value: effect.x ?? 0, 
            label: 'X', 
            mixedPlaceholder: 'Mixed',
            onChange: (v, isTransient) => {
                if (mixedCtx) {
                    this.updateEffectAtIndex(mixedCtx.index, { x: v }, isTransient);
                } else {
                    this.updateEffect(effect.id, { x: v }, isTransient);
                }
            }
        });
        const yInput = new NumberInput({ 
            value: effect.y ?? 4, 
            label: 'Y', 
            mixedPlaceholder: 'Mixed',
            onChange: (v, isTransient) => {
                if (mixedCtx) {
                    this.updateEffectAtIndex(mixedCtx.index, { y: v }, isTransient);
                } else {
                    this.updateEffect(effect.id, { y: v }, isTransient);
                }
            }
        });

        xInput.element.setAttribute('data-testid', `effect-${idKey}-shadow-x`);
        yInput.element.setAttribute('data-testid', `effect-${idKey}-shadow-y`);

        if (mixedCtx) {
            const xValues = mixedCtx.effectsByElement.map((effects) => effects[mixedCtx.index]?.x ?? 0);
            const yValues = mixedCtx.effectsByElement.map((effects) => effects[mixedCtx.index]?.y ?? 4);
            const xResult = this.getMixedResult(xValues);
            const yResult = this.getMixedResult(yValues);
            xInput.setMixed(xResult.mixed);
            yInput.setMixed(yResult.mixed);
        }
        
        xInput.element.classList.add('pi-flex-1');
        yInput.element.classList.add('pi-flex-1');
        
        row1.appendChild(xInput.element);
        row1.appendChild(yInput.element);
        content.appendChild(row1);

        // Blur / Spread
        const row2 = document.createElement('div');
        row2.className = 'pi-flyout-row';
        
        const blurInput = new NumberInput({ 
            value: effect.blur ?? 8, 
            label: 'Blur', 
            min: 0, 
            mixedPlaceholder: 'Mixed',
            onChange: (v, isTransient) => {
                if (mixedCtx) {
                    this.updateEffectAtIndex(mixedCtx.index, { blur: v }, isTransient);
                } else {
                    this.updateEffect(effect.id, { blur: v }, isTransient);
                }
            }
        });
        const spreadInput = new NumberInput({ 
            value: effect.spread ?? 0, 
            label: 'Spread', 
            mixedPlaceholder: 'Mixed',
            onChange: (v, isTransient) => {
                if (mixedCtx) {
                    this.updateEffectAtIndex(mixedCtx.index, { spread: v }, isTransient);
                } else {
                    this.updateEffect(effect.id, { spread: v }, isTransient);
                }
            }
        });

        blurInput.element.setAttribute('data-testid', `effect-${idKey}-shadow-blur`);
        spreadInput.element.setAttribute('data-testid', `effect-${idKey}-shadow-spread`);

        if (mixedCtx) {
            const blurValues = mixedCtx.effectsByElement.map((effects) => effects[mixedCtx.index]?.blur ?? 8);
            const spreadValues = mixedCtx.effectsByElement.map((effects) => effects[mixedCtx.index]?.spread ?? 0);
            const blurResult = this.getMixedResult(blurValues);
            const spreadResult = this.getMixedResult(spreadValues);
            blurInput.setMixed(blurResult.mixed);
            spreadInput.setMixed(spreadResult.mixed);
        }
        
        blurInput.element.classList.add('pi-flex-1');
        spreadInput.element.classList.add('pi-flex-1');
        
        row2.appendChild(blurInput.element);
        row2.appendChild(spreadInput.element);
        content.appendChild(row2);

        // Color & Opacity
        const row3 = document.createElement('div');
        row3.className = 'pi-flyout-row-center';

        const colorInput = new ColorInput(
            effect.color || '#000000',
            (v, isTransient) => {
                if (mixedCtx) {
                    this.updateEffectAtIndex(mixedCtx.index, { color: v }, isTransient);
                } else {
                    this.updateEffect(effect.id, { color: v }, isTransient);
                }
            }
        );
        colorInput.element.classList.add('pi-flex-1');
        colorInput.element.setAttribute('data-testid', `effect-${idKey}-shadow-color`);

        const opacityInput = new NumberInput({ 
            value: effect.opacity ?? 25,
            label: '%', 
            min: 0, 
            max: 100,
            mixedPlaceholder: 'Mixed',
            onChange: (v, isTransient) => {
                if (mixedCtx) {
                    this.updateEffectAtIndex(mixedCtx.index, { opacity: v }, isTransient);
                } else {
                    this.updateEffect(effect.id, { opacity: v }, isTransient);
                }
            }
        });
        opacityInput.element.classList.add('pi-width-60');
        opacityInput.element.setAttribute('data-testid', `effect-${idKey}-shadow-opacity`);

        if (mixedCtx) {
            const colorValues = mixedCtx.effectsByElement.map((effects) => (effects[mixedCtx.index]?.color || '#000000'));
            const opacityValues = mixedCtx.effectsByElement.map((effects) => (effects[mixedCtx.index]?.opacity ?? 25));
            const colorResult = this.getMixedResult(colorValues);
            const opacityResult = this.getMixedResult(opacityValues);
            if (typeof colorInput.setMixed === 'function') {
                colorInput.setMixed(colorResult.mixed);
            }
            opacityInput.setMixed(opacityResult.mixed);
        }

        row3.appendChild(colorInput.element);
        row3.appendChild(opacityInput.element);
        content.appendChild(row3);

        return content;
    }

    /**
     * Create flyout content for blur effects
     */
    createBlurFlyoutContent(effect, mixedCtx = null) {
        const content = document.createElement('div');
        content.className = 'pi-flyout-content';

        const idKey = mixedCtx ? `idx-${mixedCtx.index}` : `id-${effect.id}`;

        // Header
        const header = document.createElement('div');
        header.className = 'pi-flyout-header';

        const typeSelect = new Dropdown({
            options: getEffectTypeOptions(),
            value: effect.type,
            size: 'lg',
            onChange: (newType) => {
                if (mixedCtx) {
                    this.changeEffectTypeAtIndex(mixedCtx.index, newType);
                } else {
                    this.changeEffectType(effect.id, newType);
                }
            }
        });
        typeSelect.element.setAttribute('data-testid', `effect-${idKey}-type`);

        const closeBtn = new IconButton({ 
            icon: Icons.CLOSE, 
            title: 'Close', 
            onClick: () => this.activeFlyout.close() 
        });

        header.appendChild(typeSelect.element);
        header.appendChild(closeBtn.element);
        content.appendChild(header);

        // Mode toggle (only for layer blur)
        if (effect.type === EffectTypes.LAYER_BLUR) {
            const modeControl = new SegmentedControl(
                [
                    { label: 'Uniform', value: 'uniform' },
                    { label: 'Progressive', value: 'progressive' }
                ],
                effect.mode || 'uniform',
                (val) => {
                    if (mixedCtx) {
                        this.updateEffectAtIndex(mixedCtx.index, { mode: val });
                    } else {
                        this.updateEffect(effect.id, { mode: val });
                    }
                }
            );
            content.appendChild(modeControl.element);
        }

        // Blur intensity
        const blurInput = new NumberInput({ 
            value: effect.radius ?? 12,
            label: Icons.GRID_3X3 || 'Blur',
            min: 0, 
            mixedPlaceholder: 'Mixed',
            onChange: (v, isTransient) => {
                if (mixedCtx) {
                    this.updateEffectAtIndex(mixedCtx.index, { radius: v }, isTransient);
                } else {
                    this.updateEffect(effect.id, { radius: v }, isTransient);
                }
            }
        });
        blurInput.element.setAttribute('data-testid', `effect-${idKey}-blur-radius`);

        if (mixedCtx) {
            const radiusValues = mixedCtx.effectsByElement.map((effects) => (effects[mixedCtx.index]?.radius ?? 12));
            const radiusResult = this.getMixedResult(radiusValues);
            blurInput.setMixed(radiusResult.mixed);
        }
        content.appendChild(blurInput.element);

        return content;
    }

    removeEffectAtIndex(index) {
        if (this.activeFlyout) {
            this.activeFlyout.close();
        }
        this.activeEffectIndex = null;
        this.selection.forEach((id) => {
            const state = store.getState();
            const element = this.getElement(state, id);
            const effects = [...this.getEffects(element)];
            effects.splice(index, 1);
            this.dispatchEffectsUpdate(id, effects);
        });
    }

    updateEffectAtIndex(index, updates, isTransient = false) {
        this.selection.forEach((id) => {
            const state = store.getState();
            const element = this.getElement(state, id);
            const effects = [...this.getEffects(element)];
            const existing = effects[index];
            if (!existing) return;
            effects[index] = { ...existing, ...updates };
            this.dispatchEffectsUpdate(id, effects, isTransient);
        });
    }

    toggleEffectVisibilityAtIndex(index, nextVisible) {
        this.selection.forEach((id) => {
            const state = store.getState();
            const element = this.getElement(state, id);
            const effects = [...this.getEffects(element)];
            const existing = effects[index];
            if (!existing) return;
            effects[index] = { ...existing, visible: nextVisible };
            this.dispatchEffectsUpdate(id, effects);
        });
    }

    changeEffectTypeAtIndex(index, newType) {
        this.selection.forEach((id) => {
            const state = store.getState();
            const element = this.getElement(state, id);
            const effects = [...this.getEffects(element)];
            const existing = effects[index];
            if (!existing) return;

            const defaults = EffectDefaults[newType];
            const next = (() => {
                if (isShadowEffect(existing.type) && isShadowEffect(newType)) {
                    return { ...defaults, ...existing, type: newType, id: existing.id };
                }
                if (isBlurEffect(existing.type) && isBlurEffect(newType)) {
                    return { ...defaults, ...existing, type: newType, id: existing.id };
                }
                return { ...defaults, type: newType, id: existing.id };
            })();

            effects[index] = next;
            this.dispatchEffectsUpdate(id, effects);
        });

        if (this.activeFlyout) {
            this.activeFlyout.close();
            this.activeFlyout = null;
            setTimeout(() => {
                const state = store.getState();
                const element = this.getElement(state, this.selection[0]);
                const effects = this.getEffects(element);
                const effect = effects[index];
                if (effect) {
                    this.openEffectFlyoutAtIndex(index, this.selection.map((id) => {
                        const el = this.getElement(state, id);
                        return this.getEffects(el);
                    }));
                }
            }, 50);
        }
    }

    // ===== Effect Operations =====

    /**
     * Add a new effect
     */
    addEffect(type = EffectTypes.DROP_SHADOW) {
        this.section.setCollapsed(false);

        this.selection.forEach(id => {
            const state = store.getState();
            const element = this.getElement(state, id);
            const effects = this.getEffects(element);
            
            const newEffect = createEffect(type);
            const updatedEffects = [...effects, newEffect];
            
            this.dispatchEffectsUpdate(id, updatedEffects);
        });
    }

    /**
     * Remove an effect by ID
     */
    removeEffect(effectId) {
        if (this.activeEffectId === effectId && this.activeFlyout) {
            this.activeFlyout.close();
        }

        this.selection.forEach(id => {
            const state = store.getState();
            const element = this.getElement(state, id);
            const effects = this.getEffects(element);
            
            const updatedEffects = effects.filter(e => e.id !== effectId);
            this.dispatchEffectsUpdate(id, updatedEffects);
        });
    }

    /**
     * Update a specific effect's properties
     */
    updateEffect(effectId, updates, isTransient = false) {
        this.selection.forEach(id => {
            const state = store.getState();
            const element = this.getElement(state, id);
            const effects = this.getEffects(element);
            
            const updatedEffects = effects.map(e => 
                e.id === effectId ? { ...e, ...updates } : e
            );
            
            this.dispatchEffectsUpdate(id, updatedEffects, isTransient);
        });
    }

    /**
     * Change effect type
     */
    changeEffectType(effectId, newType) {
        this.selection.forEach(id => {
            const state = store.getState();
            const element = this.getElement(state, id);
            const effects = this.getEffects(element);
            
            const updatedEffects = effects.map(e => {
                if (e.id !== effectId) return e;
                
                const defaults = EffectDefaults[newType];
                
                // Preserve common properties where applicable
                if (isShadowEffect(e.type) && isShadowEffect(newType)) {
                    return { ...defaults, ...e, type: newType, id: e.id };
                } else if (isBlurEffect(e.type) && isBlurEffect(newType)) {
                    return { ...defaults, ...e, type: newType, id: e.id };
                } else {
                    return { ...defaults, type: newType, id: e.id };
                }
            });
            
            this.dispatchEffectsUpdate(id, updatedEffects);
        });

        // Reopen flyout with new type
        if (this.activeFlyout) {
            this.activeFlyout.close();
            setTimeout(() => {
                const state = store.getState();
                const element = this.getElement(state, this.selection[0]);
                const effects = this.getEffects(element);
                const effect = effects.find(e => e.id === effectId);
                if (effect) {
                    this.openEffectFlyout(effect);
                }
            }, 50);
        }
    }

    /**
     * Toggle effect visibility
     */
    toggleEffectVisibility(effectId) {
        this.selection.forEach(id => {
            const state = store.getState();
            const element = this.getElement(state, id);
            const effects = this.getEffects(element);
            
            const updatedEffects = effects.map(e => 
                e.id === effectId ? { ...e, visible: e.visible === false ? true : false } : e
            );
            
            this.dispatchEffectsUpdate(id, updatedEffects);
        });
    }

    /**
     * Reorder effect from one index to another
     */
    reorderEffect(fromIndex, toIndex) {
        this.selection.forEach(id => {
            const state = store.getState();
            const element = this.getElement(state, id);
            const effects = [...this.getEffects(element)];
            
            const [moved] = effects.splice(fromIndex, 1);
            effects.splice(toIndex, 0, moved);
            
            this.dispatchEffectsUpdate(id, effects);
        });
    }

    /**
     * Dispatch effects update to store
     */
    dispatchEffectsUpdate(elementId, effects, isTransient = false) {
        const state = store.getState();
        const element = this.getElement(state, elementId);
        
        const newStyle = { 
            ...(element?.style || {}),
            effects
        };
        
        store.dispatch('UPDATE_ELEMENT', { 
            id: elementId, 
            style: newStyle 
        }, { skipHistory: isTransient });
        
        this.refreshRender();
    }

    /**
     * Refresh the section render
     */
    refreshRender() {
        if (this.selection && this.selection.length > 0) {
            const state = store.getState();
            const elements = this.selection.map((id) => this.getElement(state, id)).filter(Boolean);
            if (elements.length === 1) {
                this.render(elements[0]);
            } else if (elements.length > 1) {
                this.renderMulti(elements);
            }
        }
    }

    /**
     * Open effect styles panel
     */
    openStylesPanel() {
        // TODO: Implement effect styles panel
        console.log('Effect styles panel - coming soon');
    }
}
