import { Section } from '../components/Section.js';
import { ColorInput } from '../components/ColorInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { IconButton } from '../components/IconButton.js';
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
export class EffectsSection {
    constructor() {
        this.section = new Section({ 
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
        this.selection = [];
    }

    /**
     * Update section with current selection
     */
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
            this.render(element);
        }
    }

    /**
     * Get element from state by ID
     */
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
        const row = document.createElement('div');
        row.className = 'pi-row pi-effect-row';
        row.dataset.effectId = effect.id;
        row.dataset.effectIndex = index;
        
        if (this.activeEffectId === effect.id) {
            row.classList.add('active');
        }
        if (effect.visible === false) {
            row.classList.add('invisible');
        }

        // Left side (clickable to open flyout)
        const left = document.createElement('div');
        left.className = 'pi-effect-row-left';
        left.onclick = () => this.openEffectFlyout(effect);

        // Drag handle (only if multiple effects)
        if (total > 1) {
            const dragHandle = document.createElement('div');
            dragHandle.className = 'pi-effect-drag-handle';
            dragHandle.innerHTML = Icons.DRAG_HANDLE || '⋮⋮';
            dragHandle.draggable = true;
            this.setupDragHandlers(dragHandle, row, effect.id, index);
            left.appendChild(dragHandle);
        }

        // Effect indicator icon
        const indicator = document.createElement('div');
        indicator.className = 'pi-effect-indicator';
        indicator.innerHTML = this.getEffectIcon(effect.type);
        left.appendChild(indicator);

        // Effect label
        const label = document.createElement('div');
        label.className = 'pi-effect-label';
        label.textContent = EffectTypeLabels[effect.type] || effect.type;
        left.appendChild(label);

        row.appendChild(left);

        // Right side controls
        const right = document.createElement('div');
        right.className = 'pi-effect-row-right';

        // Visibility toggle
        const visibleBtn = new IconButton({
            icon: effect.visible !== false ? Icons.VISIBLE : Icons.HIDDEN,
            title: 'Toggle Visibility',
            onClick: (e) => {
                e.stopPropagation();
                this.toggleEffectVisibility(effect.id);
            }
        });
        right.appendChild(visibleBtn.element);

        // Remove button
        const removeBtn = new IconButton({
            icon: Icons.MINUS,
            title: 'Remove Effect',
            onClick: (e) => {
                e.stopPropagation();
                this.removeEffect(effect.id);
            }
        });
        right.appendChild(removeBtn.element);

        row.appendChild(right);
        
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

    /**
     * Create flyout content for shadow effects
     */
    createShadowFlyoutContent(effect) {
        const content = document.createElement('div');
        content.className = 'pi-flyout-content';

        // Header
        const header = document.createElement('div');
        header.className = 'pi-flyout-header';

        const typeSelect = new Dropdown({
            options: getEffectTypeOptions(),
            value: effect.type,
            size: 'lg',
            onChange: (newType) => this.changeEffectType(effect.id, newType)
        });

        const headerRight = document.createElement('div');
        headerRight.className = 'pi-effect-row-right';

        const blendDropdown = new Dropdown({
            options: BlendModeOptions,
            value: effect.blendMode || 'normal',
            size: 'sm',
            onChange: (val) => this.updateEffect(effect.id, { blendMode: val })
        });

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
            onChange: (v, isTransient) => this.updateEffect(effect.id, { x: v }, isTransient)
        });
        const yInput = new NumberInput({ 
            value: effect.y ?? 4, 
            label: 'Y', 
            onChange: (v, isTransient) => this.updateEffect(effect.id, { y: v }, isTransient)
        });
        
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
            onChange: (v, isTransient) => this.updateEffect(effect.id, { blur: v }, isTransient)
        });
        const spreadInput = new NumberInput({ 
            value: effect.spread ?? 0, 
            label: 'Spread', 
            onChange: (v, isTransient) => this.updateEffect(effect.id, { spread: v }, isTransient)
        });
        
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
            (v, isTransient) => this.updateEffect(effect.id, { color: v }, isTransient)
        );
        colorInput.element.classList.add('pi-flex-1');

        const opacityInput = new NumberInput({ 
            value: effect.opacity ?? 25,
            label: '%', 
            min: 0, 
            max: 100,
            onChange: (v, isTransient) => this.updateEffect(effect.id, { opacity: v }, isTransient)
        });
        opacityInput.element.classList.add('pi-width-60');

        row3.appendChild(colorInput.element);
        row3.appendChild(opacityInput.element);
        content.appendChild(row3);

        return content;
    }

    /**
     * Create flyout content for blur effects
     */
    createBlurFlyoutContent(effect) {
        const content = document.createElement('div');
        content.className = 'pi-flyout-content';

        // Header
        const header = document.createElement('div');
        header.className = 'pi-flyout-header';

        const typeSelect = new Dropdown({
            options: getEffectTypeOptions(),
            value: effect.type,
            size: 'lg',
            onChange: (newType) => this.changeEffectType(effect.id, newType)
        });

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
                (val) => this.updateEffect(effect.id, { mode: val })
            );
            content.appendChild(modeControl.element);
        }

        // Blur intensity
        const blurInput = new NumberInput({ 
            value: effect.radius ?? 12,
            label: Icons.GRID_3X3 || 'Blur',
            min: 0, 
            onChange: (v, isTransient) => this.updateEffect(effect.id, { radius: v }, isTransient)
        });
        content.appendChild(blurInput.element);

        return content;
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
            const element = this.getElement(state, this.selection[0]);
            if (element) {
                this.render(element);
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
