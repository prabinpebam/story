import { Section } from '../components/Section.js';
import { TextInput } from '../components/TextInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { Dropdown } from '../components/Dropdown.js';
import { Flyout } from '../components/Flyout.js';
import { Button } from '../components/Button.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { MasterPresetFlyout } from '../components/MasterPresetFlyout.js';
import { store } from '../../core/Store.js';
import { FillSection } from './FillSection.js';
import { panelManager } from '../PanelManager.js';
import { Icons } from '../Icons.js';
import { FillFlyout } from '../components/FillFlyout/FillFlyout.js';
import { ThemeSwatches } from '../components/ThemeSwatches.js';
import { getPresetById, getPresetList } from '../../core/store/SlideMasterPresets.js';
import { COLOR_MODES } from '../panels/color-theme/ColorThemeUtils.js';
import { StyleResolver } from '../../utils/StyleResolver.js';
import { ThemeDiag } from '../../utils/ThemeDiagnostics.js';
import { ThumbnailRenderer } from '../../core/renderer/ThumbnailRenderer.js';
import { SLIDE_TRANSITION_TYPES, DIRECTION4, DIRECTION8, coerceSlideTransition } from '../../core/presentation/SlideTransitionUtils.js';
import { announce } from '../services/LiveAnnouncer.js';

export class SlideSection {
    constructor() {
        // Container for all slide-related sections (no outer wrapper section)
        this.element = document.createElement('div');
        this.element.className = 'slide-properties';
        
        this.layoutFlyout = null;
        this.masterPresetFlyout = null;
        
        this.fillSection = new FillSection({
            title: 'Background',
            manualVisibility: true,
            getElement: (selection) => selection[0],
            onUpdate: (fills, isTransient) => this.updateBackground(fills, isTransient)
        });

        this.createContent();
        this.setupThemeListener();
    }
    
    _transitionTypeLabel(type) {
        switch (type) {
            case SLIDE_TRANSITION_TYPES.NONE:
                return 'None';
            case SLIDE_TRANSITION_TYPES.CROSS_FADE:
                return 'Cross fade';
            case SLIDE_TRANSITION_TYPES.WIPE:
                return 'Wipe';
            case SLIDE_TRANSITION_TYPES.PUSH:
                return 'Push';
            case SLIDE_TRANSITION_TYPES.COVER:
                return 'Cover';
            case SLIDE_TRANSITION_TYPES.UNCOVER:
                return 'Uncover';
            default:
                return String(type || '');
        }
    }

    static DEFAULT_LAYOUT_GUIDE = {
        enabled: true,
        margins: { top: 40, right: 40, bottom: 40, left: 40 },
        marginsLinked: true,
        columns: { count: 3, gutter: 20 },
        appearance: { color: '#FF0000', opacity: 10 }
    };

    createContent() {
        // 1. Name Row (Master Mode only) - standalone, no section
        this.nameRow = document.createElement('div');
        this.nameRow.className = 'pi-row pi-px-2';
        this.nameInput = new TextInput({
            placeholder: 'Name',
            onChange: (val) => this.updateName(val)
        });
        this.nameRow.appendChild(this.nameInput.element);
        this.element.appendChild(this.nameRow);

        // 1.5 Master Preset Section (Theme Master only)
        this.createPresetSection();

        // 2. Layout Section (Slide Mode)
        this.layoutSection = new Section({ title: 'Layout' });
        
        // Layout picker row
        this.layoutRow = document.createElement('div');
        this.layoutRow.className = 'pi-row layout-picker-row';
        
        // Layout trigger button (shows current layout)
        this.layoutTriggerBtn = new Button({
            label: 'Select Layout',
            variant: 'secondary',
            size: 'sm',
            className: 'layout-trigger-btn',
            onClick: () => this.openLayoutFlyout()
        });
        this.layoutTrigger = this.layoutTriggerBtn.element;
        this.layoutRow.appendChild(this.layoutTrigger);
        
        // Hidden dropdown for value storage
        this.layoutSelect = new Dropdown({
            onChange: (val) => this.updateLayout(val)
        });
        this.layoutSelect.element.classList.add('hidden');
        this.layoutRow.appendChild(this.layoutSelect.element);
        
        this.layoutSection.appendChild(this.layoutRow);

        // Dimensions row (inside Layout section)
        const dimRow = document.createElement('div');
        dimRow.className = 'pi-row';
        
        this.wInput = new NumberInput({
            label: 'W',
            onChange: (val, isTransient) => this.updateDimension('width', val, isTransient)
        });
        
        this.hInput = new NumberInput({
            label: 'H',
            onChange: (val, isTransient) => this.updateDimension('height', val, isTransient)
        });

        dimRow.appendChild(this.wInput.element);
        dimRow.appendChild(this.hInput.element);
        this.layoutSection.appendChild(dimRow);
        
        this.element.appendChild(this.layoutSection.element);

        // 3. Theme Section
        this.createThemeSection();

        // 3.25 Transition Section
        this.createTransitionSection();

        // 3.5 Layout Guides (Master Mode only)
        this.createLayoutGuideSection();

        // 4. Background (FillSection) - Appended separately in PropertyInspector
    }

    createTransitionSection() {
        this.transitionSection = new Section({ title: 'Transition' });
        this.transitionSection.element.setAttribute('data-testid', 'transition-section');

        this.transitionFlyout = null;

        // Primary row (name button + inheritance + source + reset)
        const primaryRow = document.createElement('div');
        primaryRow.className = 'pi-row pi-row--space-between';

        const left = document.createElement('div');
        left.className = 'pi-row';

        this.transitionBadge = document.createElement('span');
        this.transitionBadge.className = 'inherited-fill-badge inherited';
        this.transitionBadge.textContent = 'Inherited';
        this.transitionBadge.setAttribute('data-testid', 'transition-inherited-badge');
        left.appendChild(this.transitionBadge);

        this.transitionSourceLabel = document.createElement('span');
        this.transitionSourceLabel.className = 'transition-source-label';
        this.transitionSourceLabel.textContent = '';
        this.transitionSourceLabel.setAttribute('data-testid', 'transition-source-label');
        left.appendChild(this.transitionSourceLabel);

        primaryRow.appendChild(left);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'pi-button-group';

        this.transitionTypeTriggerBtn = new Button({
            label: 'Select transition',
            variant: 'secondary',
            size: 'sm',
            onClick: () => this.openTransitionFlyout()
        });
        this.transitionTypeTriggerBtn.element.setAttribute('data-testid', 'transition-picker-trigger');
        buttonGroup.appendChild(this.transitionTypeTriggerBtn.element);

        this.transitionResetBtn = new Button({
            icon: '<i class="fa-solid fa-arrow-rotate-left"></i>',
            variant: 'text',
            size: 'xs',
            title: 'Reset to inherited',
            onClick: () => this.resetSlideTransitionToInherited()
        });
        this.transitionResetBtn.element.setAttribute('data-testid', 'transition-reset-btn');
        buttonGroup.appendChild(this.transitionResetBtn.element);

        primaryRow.appendChild(buttonGroup);
        this.transitionSection.appendChild(primaryRow);

        // Duration
        const durationRow = document.createElement('div');
        durationRow.className = 'pi-row';
        durationRow.setAttribute('data-testid', 'transition-duration-row');
        this.transitionDurationRow = durationRow;

        this.transitionDurationInput = new NumberInput({
            label: 'Duration',
            min: 0,
            max: 5000,
            step: 50,
            shiftStep: 200,
            precision: 0,
            units: 'ms',
            onChange: (val, isTransient) => this.updateSlideTransitionDuration(val, isTransient)
        });
        this.transitionDurationInput.element.setAttribute('data-testid', 'transition-duration-input');
        durationRow.appendChild(this.transitionDurationInput.element);
        this.transitionSection.appendChild(durationRow);

        // Direction (shown only for directional transitions)
        this.transitionDirectionRow = document.createElement('div');
        this.transitionDirectionRow.className = 'pi-row';
        this.transitionDirectionRow.setAttribute('data-testid', 'transition-direction-row');

        this.transitionDirectionGrid = document.createElement('div');
        this.transitionDirectionGrid.className = 'pi-grid-row cols-3';
        this.transitionDirectionGrid.setAttribute('data-testid', 'transition-direction-grid');
        this.transitionDirectionRow.appendChild(this.transitionDirectionGrid);
        this.transitionSection.appendChild(this.transitionDirectionRow);

        this.element.appendChild(this.transitionSection.element);
    }

    _directionAriaLabel(direction) {
        switch (direction) {
            case 'left':
                return 'Direction: from left';
            case 'right':
                return 'Direction: from right';
            case 'up':
                return 'Direction: from top';
            case 'down':
                return 'Direction: from bottom';
            case 'upLeft':
                return 'Direction: from top-left';
            case 'upRight':
                return 'Direction: from top-right';
            case 'downLeft':
                return 'Direction: from bottom-left';
            case 'downRight':
                return 'Direction: from bottom-right';
            default:
                return 'Direction';
        }
    }

    _directionGlyph(direction) {
        switch (direction) {
            case 'left':
                return '←';
            case 'right':
                return '→';
            case 'up':
                return '↑';
            case 'down':
                return '↓';
            case 'upLeft':
                return '↖';
            case 'upRight':
                return '↗';
            case 'downLeft':
                return '↙';
            case 'downRight':
                return '↘';
            default:
                return '';
        }
    }

    _renderTransitionDirectionGrid(transition) {
        if (!this.transitionDirectionGrid) return;

        const isWipe = transition.type === SLIDE_TRANSITION_TYPES.WIPE;
        const allowedDirs = isWipe ? DIRECTION8 : DIRECTION4;
        const currentDir = transition.direction || 'right';

        this.transitionDirectionGrid.innerHTML = '';

        const cells = isWipe
            ? ['upLeft', 'up', 'upRight', 'left', null, 'right', 'downLeft', 'down', 'downRight']
            : [null, 'up', null, 'left', null, 'right', null, 'down', null];

        for (const dir of cells) {
            if (!dir) {
                this.transitionDirectionGrid.appendChild(document.createElement('div'));
                continue;
            }

            if (!allowedDirs.includes(dir)) {
                this.transitionDirectionGrid.appendChild(document.createElement('div'));
                continue;
            }

            const btn = new Button({
                label: this._directionGlyph(dir),
                variant: 'secondary',
                size: 'xs',
                ariaLabel: this._directionAriaLabel(dir),
                active: dir === currentDir,
                dataTestId: `transition-direction-${dir}`,
                onClick: () => this.updateSlideTransitionDirection(dir)
            });

            this.transitionDirectionGrid.appendChild(btn.element);
        }
    }

    openTransitionFlyout() {
        const content = document.createElement('div');
        content.className = 'layout-flyout-content';
        content.setAttribute('data-testid', 'transition-picker-flyout');

        const title = document.createElement('div');
        title.className = 'layout-flyout-title';
        title.textContent = 'Select Transition';
        content.appendChild(title);

        const getPreviewIcon = (type) => {
            switch (type) {
                case SLIDE_TRANSITION_TYPES.NONE:
                    return Icons.CLOSE;
                case SLIDE_TRANSITION_TYPES.CROSS_FADE:
                    return Icons.OPACITY;
                case SLIDE_TRANSITION_TYPES.WIPE:
                    return Icons.GRID_3X3;
                case SLIDE_TRANSITION_TYPES.PUSH:
                    return Icons.CHEVRON_RIGHT;
                case SLIDE_TRANSITION_TYPES.COVER:
                    return Icons.FLIP_H;
                case SLIDE_TRANSITION_TYPES.UNCOVER:
                    return Icons.FLIP_V;
                default:
                    return Icons.STYLES;
            }
        };

        const options = [
            { type: SLIDE_TRANSITION_TYPES.NONE, label: 'None', icon: getPreviewIcon(SLIDE_TRANSITION_TYPES.NONE) },
            { type: SLIDE_TRANSITION_TYPES.CROSS_FADE, label: 'Cross fade', icon: getPreviewIcon(SLIDE_TRANSITION_TYPES.CROSS_FADE) },
            { type: SLIDE_TRANSITION_TYPES.WIPE, label: 'Wipe', icon: getPreviewIcon(SLIDE_TRANSITION_TYPES.WIPE) },
            { type: SLIDE_TRANSITION_TYPES.PUSH, label: 'Push', icon: getPreviewIcon(SLIDE_TRANSITION_TYPES.PUSH) },
            { type: SLIDE_TRANSITION_TYPES.COVER, label: 'Cover', icon: getPreviewIcon(SLIDE_TRANSITION_TYPES.COVER) },
            { type: SLIDE_TRANSITION_TYPES.UNCOVER, label: 'Uncover', icon: getPreviewIcon(SLIDE_TRANSITION_TYPES.UNCOVER) }
        ];

        const state = store.getState();
        const currentObject = this.getActiveContainer(state);
        const info = currentObject ? StyleResolver.getEffectiveSlideTransition(currentObject.id) : null;
        const currentType = info?.transition ? coerceSlideTransition(info.transition).type : SLIDE_TRANSITION_TYPES.CROSS_FADE;

        const listbox = document.createElement('div');
        listbox.className = 'layout-flyout-grid';
        listbox.setAttribute('role', 'listbox');
        listbox.setAttribute('data-testid', 'transition-picker-listbox');
        content.appendChild(listbox);

        let selectedOptionEl = null;

        options.forEach(opt => {
            const isSelected = opt.type === currentType;

            const btn = new Button({
                label: opt.label,
                icon: `<div class="layout-preview">${opt.icon}</div>`,
                iconPosition: 'left',
                variant: 'secondary',
                size: 'sm',
                className: `layout-thumbnail${isSelected ? ' selected' : ''}`,
                onClick: () => {
                    this.applySlideTransitionType(opt.type);
                    if (this.transitionFlyout) this.transitionFlyout.close();
                }
            });

            btn.element.setAttribute('data-testid', 'transition-picker-option');
            btn.element.setAttribute('role', 'option');
            btn.element.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            btn.element.dataset.transitionType = opt.type;

            if (isSelected) selectedOptionEl = btn.element;

            listbox.appendChild(btn.element);
        });

        if (this.transitionFlyout) {
            this.transitionFlyout.close();
        }

        this.transitionFlyout = new Flyout({
            trigger: this.transitionTypeTriggerBtn.element,
            content,
            position: 'left',
            closeOnEscape: true,
            trapFocus: true,
            onClose: () => {
                try {
                    this.transitionTypeTriggerBtn?.element?.focus?.();
                } catch {
                    // no-op
                }
            }
        });

        this.transitionFlyout.element.setAttribute('role', 'dialog');
        this.transitionFlyout.element.setAttribute('aria-label', 'Select Transition');

        this.transitionFlyout.open();

        // Focus SHOULD move to the selected option on open.
        setTimeout(() => {
            try {
                selectedOptionEl?.focus?.();
            } catch {
                // no-op
            }
        }, 0);
    }

    resetSlideTransitionToInherited() {
        const state = store.getState();
        const mode = state.editor.mode;
        const currentObject = this.getActiveContainer(state);
        if (!currentObject) return;

        if (mode === 'master') {
            store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
                masterId: currentObject.id,
                styleAssignments: { slideTransition: null }
            });
        } else {
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId: currentObject.id,
                styleAssignments: { slideTransition: null }
            });
        }

        this.updateTransitionDisplay();

        try {
            const nextEffective = StyleResolver.getEffectiveSlideTransition(currentObject.id)?.transition;
            const label = this._transitionTypeLabel(coerceSlideTransition(nextEffective).type);
            announce(`Transition reset to inherited: ${label}`);
        } catch {
            announce('Transition reset to inherited');
        }
    }

    applySlideTransitionType(type) {
        const state = store.getState();
        const mode = state.editor.mode;
        const currentObject = this.getActiveContainer(state);
        if (!currentObject) return;

        const effective = StyleResolver.getEffectiveSlideTransition(currentObject.id)?.transition;
        const existing = currentObject.styleAssignments?.slideTransition;
        const base = (existing && typeof existing === 'object') ? existing : (effective || { type: SLIDE_TRANSITION_TYPES.CROSS_FADE, durationMs: 300, easing: 'ease-in-out' });

        const next = { ...base, type };
        if (type === SLIDE_TRANSITION_TYPES.NONE) {
            next.durationMs = 0;
            delete next.direction;
        }

        // Normalize and ensure direction defaults.
        const normalized = coerceSlideTransition(next);

        if (mode === 'master') {
            store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
                masterId: currentObject.id,
                styleAssignments: { slideTransition: normalized }
            });
        } else {
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId: currentObject.id,
                styleAssignments: { slideTransition: normalized }
            });
        }

        this.updateTransitionDisplay();

        announce(`Transition changed to ${this._transitionTypeLabel(type)}`);
    }

    updateSlideTransitionDuration(durationMs, isTransient) {
        const state = store.getState();
        const mode = state.editor.mode;
        const currentObject = this.getActiveContainer(state);
        if (!currentObject) return;

        const effective = StyleResolver.getEffectiveSlideTransition(currentObject.id)?.transition;
        const existing = currentObject.styleAssignments?.slideTransition;
        const base = (existing && typeof existing === 'object') ? existing : (effective || { type: SLIDE_TRANSITION_TYPES.CROSS_FADE, durationMs: 300, easing: 'ease-in-out' });
        const normalized = coerceSlideTransition({ ...base, durationMs });

        const action = mode === 'master' ? 'UPDATE_MASTER_STYLE_ASSIGNMENTS' : 'UPDATE_SLIDE_STYLE_ASSIGNMENTS';
        const payload = mode === 'master'
            ? { masterId: currentObject.id, styleAssignments: { slideTransition: normalized } }
            : { slideId: currentObject.id, styleAssignments: { slideTransition: normalized } };

        store.dispatch(action, payload, { skipHistory: !!isTransient });
        this.updateTransitionDisplay();

        if (!isTransient) {
            const ms = Number.isFinite(durationMs) ? Math.round(durationMs) : durationMs;
            announce(`Transition duration ${ms} ms`);
        }
    }

    updateSlideTransitionDirection(direction) {
        const state = store.getState();
        const mode = state.editor.mode;
        const currentObject = this.getActiveContainer(state);
        if (!currentObject) return;

        const effective = StyleResolver.getEffectiveSlideTransition(currentObject.id)?.transition;
        const existing = currentObject.styleAssignments?.slideTransition;
        const base = (existing && typeof existing === 'object') ? existing : (effective || { type: SLIDE_TRANSITION_TYPES.WIPE, durationMs: 300, easing: 'ease-in-out', direction: 'right' });
        const normalized = coerceSlideTransition({ ...base, direction });

        const action = mode === 'master' ? 'UPDATE_MASTER_STYLE_ASSIGNMENTS' : 'UPDATE_SLIDE_STYLE_ASSIGNMENTS';
        const payload = mode === 'master'
            ? { masterId: currentObject.id, styleAssignments: { slideTransition: normalized } }
            : { slideId: currentObject.id, styleAssignments: { slideTransition: normalized } };

        store.dispatch(action, payload);
        this.updateTransitionDisplay();

        const dirLabel = this._directionAriaLabel(direction);
        announce(`Transition ${dirLabel}`);
    }

    _formatTransitionLabel(transition) {
        const t = transition || { type: SLIDE_TRANSITION_TYPES.CROSS_FADE };
        switch (t.type) {
            case SLIDE_TRANSITION_TYPES.NONE:
                return 'None';
            case SLIDE_TRANSITION_TYPES.CROSS_FADE:
                return 'Cross fade';
            case SLIDE_TRANSITION_TYPES.WIPE:
                return `Wipe${t.direction ? ` (${t.direction})` : ''}`;
            case SLIDE_TRANSITION_TYPES.PUSH:
                return `Push${t.direction ? ` (${t.direction})` : ''}`;
            case SLIDE_TRANSITION_TYPES.COVER:
                return `Cover${t.direction ? ` (${t.direction})` : ''}`;
            case SLIDE_TRANSITION_TYPES.UNCOVER:
                return `Uncover${t.direction ? ` (${t.direction})` : ''}`;
            default:
                return 'Transition';
        }
    }

    updateTransitionDisplay() {
        const state = store.getState();
        const currentObject = this.getActiveContainer(state);
        if (!currentObject) return;

        const info = StyleResolver.getEffectiveSlideTransition(currentObject.id);
        const transition = info?.transition ? coerceSlideTransition(info.transition) : coerceSlideTransition({ type: SLIDE_TRANSITION_TYPES.CROSS_FADE });

        const hasCanonical = !!currentObject.styleAssignments && Object.prototype.hasOwnProperty.call(currentObject.styleAssignments, 'slideTransition');
        const hasDirectOverride = hasCanonical && currentObject.styleAssignments.slideTransition && typeof currentObject.styleAssignments.slideTransition === 'object';

        const label = this._formatTransitionLabel(transition);

        if (this.transitionTypeTriggerBtn?.setLabel) {
            this.transitionTypeTriggerBtn.setLabel(label);
        }

        const sourceText = (() => {
            if (!info) return '';
            if (info.source === 'slide') return 'Source: Slide';

            if (info.source === 'layout') {
                const layoutName = currentObject.type === 'slide'
                    ? (state.slideMasterPresets?.[currentObject.layoutId]?.name || 'Layout')
                    : (state.slideMasterPresets?.[info.sourceId]?.name || 'Layout');
                return `Source: Layout: ${layoutName}`;
            }

            if (info.sourceLabel === 'system default') return 'Source: System default';
            if (info.source === 'master') return 'Source: Master preset';
            return `Source: ${info.sourceLabel || 'Unknown'}`;
        })();

        if (this.transitionSourceLabel) {
            this.transitionSourceLabel.textContent = sourceText;
        }

        const isOverrideAtLevel = !!hasDirectOverride;
        if (this.transitionBadge) {
            this.transitionBadge.textContent = isOverrideAtLevel ? 'Override' : 'Inherited';
            this.transitionBadge.classList.remove('hidden');
            this.transitionBadge.classList.toggle('override', isOverrideAtLevel);
            this.transitionBadge.classList.toggle('inherited', !isOverrideAtLevel);
        }

        if (this.transitionResetBtn?.element) {
            this.transitionResetBtn.element.classList.toggle('hidden', !hasDirectOverride);
        }

        if (this.transitionDurationInput?.setValue) {
            this.transitionDurationInput.setValue(transition.durationMs, false);
        }

        const isNone = transition.type === SLIDE_TRANSITION_TYPES.NONE;
        this.transitionDurationRow?.classList.toggle('hidden', isNone);

        const needsDirection = transition.type === SLIDE_TRANSITION_TYPES.WIPE || transition.type === SLIDE_TRANSITION_TYPES.PUSH || transition.type === SLIDE_TRANSITION_TYPES.COVER || transition.type === SLIDE_TRANSITION_TYPES.UNCOVER;
        this.transitionDirectionRow?.classList.toggle('hidden', isNone || !needsDirection);

        if (!isNone && needsDirection) {
            this._renderTransitionDirectionGrid(transition);
        }
    }

    createLayoutGuideSection() {
        this.layoutGuideSection = new Section({ title: 'Layout guides' });
        this.layoutGuideSection.element.setAttribute('data-testid', 'layout-guide-section');

        this.layoutGuideFlyout = null;

        // Inheritance row (Layout Masters only): badge + reset
        const inheritanceRow = document.createElement('div');
        inheritanceRow.className = 'pi-row pi-row--space-between';

        this.layoutGuideInheritedBadge = document.createElement('span');
        this.layoutGuideInheritedBadge.className = 'inherited-fill-badge';
        this.layoutGuideInheritedBadge.textContent = 'Inherited';
        this.layoutGuideInheritedBadge.setAttribute('data-testid', 'layout-guide-inherited-badge');
        inheritanceRow.appendChild(this.layoutGuideInheritedBadge);

        const lgButtonGroup = document.createElement('div');
        lgButtonGroup.className = 'pi-button-group';

        this.layoutGuideResetBtn = new Button({
            icon: '<i class="fa-solid fa-arrow-rotate-left"></i>',
            variant: 'text',
            size: 'xs',
            title: 'Reset to inherited',
            onClick: () => this.resetLayoutGuideToInherited()
        });
        this.layoutGuideResetBtn.element.setAttribute('data-testid', 'layout-guide-reset-btn');
        lgButtonGroup.appendChild(this.layoutGuideResetBtn.element);

        inheritanceRow.appendChild(lgButtonGroup);
        this.layoutGuideSection.appendChild(inheritanceRow);

        // Margins header: link toggle
        const headerRow = document.createElement('div');
        headerRow.className = 'pi-row pi-row--space-between';

        const label = document.createElement('div');
        label.className = 'pi-label';
        label.textContent = 'Margins';
        headerRow.appendChild(label);

        this.marginLinkBtn = new Button({
            icon: Icons.LINK || '🔗',
            size: 'xs',
            variant: 'text',
            ariaLabel: 'Toggle linked margins',
            onClick: () => this.toggleLayoutGuideMarginsLinked()
        });
        this.marginLinkBtn.element.setAttribute('data-testid', 'layout-guide-margin-link-toggle');
        headerRow.appendChild(this.marginLinkBtn.element);

        this.layoutGuideSection.appendChild(headerRow);

        // Linked margin: single input
        this.marginAllRow = document.createElement('div');
        this.marginAllRow.className = 'pi-row';
        this.marginAllInput = new NumberInput({
            label: 'Margin',
            min: 0,
            onChange: (val, isTransient) => this.updateLayoutGuideMargin('all', val, isTransient)
        });
        this.marginAllInput.element.setAttribute('data-testid', 'layout-guide-margin-all');
        this.marginAllRow.appendChild(this.marginAllInput.element);
        this.layoutGuideSection.appendChild(this.marginAllRow);

        // Unlinked margins: two rows
        this.marginUnlinkedRow1 = document.createElement('div');
        this.marginUnlinkedRow1.className = 'pi-row hidden';
        this.marginLeftInput = new NumberInput({
            label: 'Left',
            min: 0,
            onChange: (val, isTransient) => this.updateLayoutGuideMargin('left', val, isTransient)
        });
        this.marginLeftInput.element.setAttribute('data-testid', 'layout-guide-margin-left');
        this.marginTopInput = new NumberInput({
            label: 'Top',
            min: 0,
            onChange: (val, isTransient) => this.updateLayoutGuideMargin('top', val, isTransient)
        });
        this.marginTopInput.element.setAttribute('data-testid', 'layout-guide-margin-top');
        this.marginUnlinkedRow1.appendChild(this.marginLeftInput.element);
        this.marginUnlinkedRow1.appendChild(this.marginTopInput.element);
        this.layoutGuideSection.appendChild(this.marginUnlinkedRow1);

        this.marginUnlinkedRow2 = document.createElement('div');
        this.marginUnlinkedRow2.className = 'pi-row hidden';
        this.marginRightInput = new NumberInput({
            label: 'Right',
            min: 0,
            onChange: (val, isTransient) => this.updateLayoutGuideMargin('right', val, isTransient)
        });
        this.marginRightInput.element.setAttribute('data-testid', 'layout-guide-margin-right');
        this.marginBottomInput = new NumberInput({
            label: 'Bottom',
            min: 0,
            onChange: (val, isTransient) => this.updateLayoutGuideMargin('bottom', val, isTransient)
        });
        this.marginBottomInput.element.setAttribute('data-testid', 'layout-guide-margin-bottom');
        this.marginUnlinkedRow2.appendChild(this.marginRightInput.element);
        this.marginUnlinkedRow2.appendChild(this.marginBottomInput.element);
        this.layoutGuideSection.appendChild(this.marginUnlinkedRow2);

        // Columns + gutter
        const columnsRow = document.createElement('div');
        columnsRow.className = 'pi-row';

        this.columnsCountInput = new NumberInput({
            label: 'Columns',
            min: 1,
            max: 24,
            step: 1,
            precision: 0,
            onChange: (val, isTransient) => this.updateLayoutGuideColumnsCount(val, isTransient)
        });
        this.columnsCountInput.element.setAttribute('data-testid', 'layout-guide-columns');

        this.gutterInput = new NumberInput({
            label: 'Gutter',
            min: 0,
            step: 1,
            precision: 0,
            onChange: (val, isTransient) => this.updateLayoutGuideGutter(val, isTransient)
        });
        this.gutterInput.element.setAttribute('data-testid', 'layout-guide-gutter');

        columnsRow.appendChild(this.columnsCountInput.element);
        columnsRow.appendChild(this.gutterInput.element);
        this.layoutGuideSection.appendChild(columnsRow);

        // Color + Opacity (reuse FillFlyout + existing fill input group styles)
        const appearanceRow = document.createElement('div');
        appearanceRow.className = 'pi-row';

        const combinedInput = document.createElement('div');
        combinedInput.className = 'fill-input-group';

        this.layoutGuideColorSwatch = document.createElement('div');
        this.layoutGuideColorSwatch.className = 'fill-swatch-trigger';
        this.layoutGuideColorSwatch.dataset.testid = 'layout-guide-color-swatch';

        this.layoutGuideColorPreview = document.createElement('div');
        this.layoutGuideColorPreview.className = 'fill-preview';
        this.layoutGuideColorSwatch.appendChild(this.layoutGuideColorPreview);
        this.layoutGuideColorSwatch.onclick = (e) => {
            e.stopPropagation();
            this.openLayoutGuideFillFlyout(this.layoutGuideColorSwatch);
        };
        combinedInput.appendChild(this.layoutGuideColorSwatch);

        this.layoutGuideColorHexInput = document.createElement('input');
        this.layoutGuideColorHexInput.type = 'text';
        this.layoutGuideColorHexInput.className = 'fill-hex-input';
        this.layoutGuideColorHexInput.spellcheck = false;
        this.layoutGuideColorHexInput.dataset.testid = 'layout-guide-color-hex';
        this.layoutGuideColorHexInput.onchange = (e) => {
            let val = e.target.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
                this.updateLayoutGuideAppearance({ color: val.toUpperCase() }, false);
            }
        };
        combinedInput.appendChild(this.layoutGuideColorHexInput);

        const separator = document.createElement('div');
        separator.className = 'fill-separator';
        combinedInput.appendChild(separator);

        this.layoutGuideOpacityInput = new NumberInput({
            value: 10,
            min: 0,
            max: 100,
            step: 1,
            units: '%',
            scrubbable: true,
            onChange: (val, isTransient) => this.updateLayoutGuideAppearance({ opacity: val }, isTransient)
        });
        this.layoutGuideOpacityInput.element.className = 'fill-opacity-input';
        this.layoutGuideOpacityInput.element.dataset.testid = 'layout-guide-color-opacity';
        combinedInput.appendChild(this.layoutGuideOpacityInput.element);

        appearanceRow.appendChild(combinedInput);
        this.layoutGuideSection.appendChild(appearanceRow);

        this.element.appendChild(this.layoutGuideSection.element);
    }

    getEffectiveLayoutGuide(state, currentObject) {
        const fallback = SlideSection.DEFAULT_LAYOUT_GUIDE;
        const direct = currentObject?.layoutGuide || null;
        if (direct) {
            return {
                ...fallback,
                ...direct,
                margins: { ...fallback.margins, ...(direct.margins || {}) },
                columns: { ...fallback.columns, ...(direct.columns || {}) },
                appearance: { ...fallback.appearance, ...(direct.appearance || {}) }
            };
        }

        if (currentObject?.type === 'layoutMaster' && currentObject?.parentMasterId) {
            const parent = state.slideMasterPresets?.[currentObject.parentMasterId] || null;
            const parentGuide = parent?.layoutGuide || null;
            if (parentGuide) {
                return {
                    ...fallback,
                    ...parentGuide,
                    margins: { ...fallback.margins, ...(parentGuide.margins || {}) },
                    columns: { ...fallback.columns, ...(parentGuide.columns || {}) },
                    appearance: { ...fallback.appearance, ...(parentGuide.appearance || {}) }
                };
            }
        }

        return fallback;
    }

    getLayoutGuideInheritanceInfo(state, currentObject) {
        const effective = this.getEffectiveLayoutGuide(state, currentObject);

        // Layout masters can inherit from their parent theme master.
        if (currentObject?.type === 'layoutMaster') {
            const hasDirect = !!currentObject.layoutGuide;
            const parent = currentObject.parentMasterId ? state.slideMasterPresets?.[currentObject.parentMasterId] : null;
            const hasParent = !!parent?.layoutGuide;
            const isInherited = !hasDirect && hasParent;
            return { effective, isInherited, hasDirect };
        }

        return { effective, isInherited: false, hasDirect: !!currentObject?.layoutGuide };
    }

    resetLayoutGuideToInherited() {
        const state = store.getState();
        if (state.editor.mode !== 'master') return;

        const id = state.editor.activeMasterId;
        const currentObject = state.slideMasterPresets?.[id];
        if (!currentObject || currentObject.type !== 'layoutMaster') return;

        // Clear override so it inherits from the parent master (or defaults).
        store.dispatch('UPDATE_MASTER', { id, layoutGuide: null });
    }

    clampMargins(margins, width, height) {
        const next = {
            top: Math.max(0, margins.top),
            right: Math.max(0, margins.right),
            bottom: Math.max(0, margins.bottom),
            left: Math.max(0, margins.left)
        };

        const safeWidth = Math.max(1, Number(width) || 1);
        const safeHeight = Math.max(1, Number(height) || 1);

        // Ensure content bounds remain positive (strictly > 0)
        next.left = Math.min(next.left, safeWidth - next.right - 1);
        next.right = Math.min(next.right, safeWidth - next.left - 1);
        next.top = Math.min(next.top, safeHeight - next.bottom - 1);
        next.bottom = Math.min(next.bottom, safeHeight - next.top - 1);

        // Re-ensure non-negative after pair clamping
        next.left = Math.max(0, next.left);
        next.right = Math.max(0, next.right);
        next.top = Math.max(0, next.top);
        next.bottom = Math.max(0, next.bottom);

        return next;
    }

    getActiveSlideDimensions(state) {
        const slideId = state.editor?.activeSlideId;
        const slide = slideId ? state.slides?.[slideId] : null;
        const width = Number(slide?.width) || 1920;
        const height = Number(slide?.height) || 1080;
        return { width, height };
    }

    clampGutter({ count, gutter }, contentWidth) {
        const safeCount = Math.max(1, Math.min(24, Number(count) || 1));
        const safeGutter = Math.max(0, Number(gutter) || 0);
        const totalGutters = safeGutter * (safeCount - 1);
        const maxGutter = safeCount > 1 ? Math.max(0, (contentWidth - 1) / (safeCount - 1)) : safeGutter;
        return {
            count: safeCount,
            gutter: Math.min(safeGutter, maxGutter)
        };
    }

    toggleLayoutGuideMarginsLinked() {
        const state = store.getState();
        const mode = state.editor.mode;
        if (mode !== 'master') return;

        const id = state.editor.activeMasterId;
        const currentObject = state.slideMasterPresets?.[id];
        if (!currentObject) return;

        const effective = this.getEffectiveLayoutGuide(state, currentObject);
        const nextLinked = !(effective.marginsLinked === true);

        // If turning linking back on, normalize all sides to current top (simple + stable).
        const normalized = nextLinked
            ? {
                top: effective.margins.top,
                right: effective.margins.top,
                bottom: effective.margins.top,
                left: effective.margins.top
            }
            : { ...effective.margins };

        const dims = this.getActiveSlideDimensions(state);
        const clamped = this.clampMargins(normalized, dims.width, dims.height);

        store.dispatch('UPDATE_MASTER', {
            id,
            layoutGuide: {
                ...effective,
                marginsLinked: nextLinked,
                margins: clamped
            }
        });
    }

    updateLayoutGuideMargin(side, val, isTransient = false) {
        const state = store.getState();
        const mode = state.editor.mode;
        if (mode !== 'master') return;

        const id = state.editor.activeMasterId;
        const currentObject = state.slideMasterPresets?.[id];
        if (!currentObject) return;

        const effective = this.getEffectiveLayoutGuide(state, currentObject);
        const marginsLinked = effective.marginsLinked !== false;
        const safeVal = Math.max(0, val);

        const baseMargins = marginsLinked || side === 'all'
            ? { top: safeVal, right: safeVal, bottom: safeVal, left: safeVal }
            : { ...effective.margins, [side]: safeVal };

        const dims = this.getActiveSlideDimensions(state);
        const nextMargins = this.clampMargins(baseMargins, dims.width, dims.height);

        store.dispatch(
            'UPDATE_MASTER',
            {
                id,
                layoutGuide: {
                    ...effective,
                    margins: nextMargins,
                    marginsLinked
                }
            },
            { skipHistory: isTransient }
        );
    }

    updateLayoutGuideColumnsCount(val, isTransient = false) {
        const state = store.getState();
        if (state.editor.mode !== 'master') return;

        const id = state.editor.activeMasterId;
        const currentObject = state.slideMasterPresets?.[id];
        if (!currentObject) return;

        const effective = this.getEffectiveLayoutGuide(state, currentObject);
        const dims = this.getActiveSlideDimensions(state);
        const width = dims.width;
        const contentWidth = Math.max(0, width - effective.margins.left - effective.margins.right);
        const nextColumns = this.clampGutter({ count: val, gutter: effective.columns.gutter }, contentWidth);

        store.dispatch(
            'UPDATE_MASTER',
            { id, layoutGuide: { ...effective, columns: nextColumns } },
            { skipHistory: isTransient }
        );
    }

    updateLayoutGuideGutter(val, isTransient = false) {
        const state = store.getState();
        if (state.editor.mode !== 'master') return;

        const id = state.editor.activeMasterId;
        const currentObject = state.slideMasterPresets?.[id];
        if (!currentObject) return;

        const effective = this.getEffectiveLayoutGuide(state, currentObject);
        const dims = this.getActiveSlideDimensions(state);
        const width = dims.width;
        const contentWidth = Math.max(0, width - effective.margins.left - effective.margins.right);
        const nextColumns = this.clampGutter({ count: effective.columns.count, gutter: val }, contentWidth);

        store.dispatch(
            'UPDATE_MASTER',
            { id, layoutGuide: { ...effective, columns: nextColumns } },
            { skipHistory: isTransient }
        );
    }

    updateLayoutGuideAppearance(updates, isTransient = false) {
        const state = store.getState();
        if (state.editor.mode !== 'master') return;

        const id = state.editor.activeMasterId;
        const currentObject = state.slideMasterPresets?.[id];
        if (!currentObject) return;

        const effective = this.getEffectiveLayoutGuide(state, currentObject);
        const nextAppearance = {
            ...effective.appearance,
            ...updates
        };

        if (typeof nextAppearance.opacity === 'number') {
            nextAppearance.opacity = Math.max(0, Math.min(100, nextAppearance.opacity));
        }

        store.dispatch(
            'UPDATE_MASTER',
            { id, layoutGuide: { ...effective, appearance: nextAppearance } },
            { skipHistory: isTransient }
        );
    }

    openLayoutGuideFillFlyout(target) {
        if (this.layoutGuideFlyout) {
            this.layoutGuideFlyout.close();
            this.layoutGuideFlyout = null;
        }

        const state = store.getState();
        const currentObject = this.getActiveContainer(state);
        const effective = this.getEffectiveLayoutGuide(state, currentObject);
        const color = effective.appearance?.color || '#FF0000';
        const opacity = typeof effective.appearance?.opacity === 'number' ? effective.appearance.opacity : 10;

        const flyout = new FillFlyout({
            trigger: target,
            fill: { type: 'solid', color, value: color, opacity },
            contextKey: 'layoutGuide.appearance',
            onChange: (updates, isTransient) => {
                if (updates.color) this.updateLayoutGuideAppearance({ color: String(updates.color).toUpperCase() }, isTransient);
                if (updates.value && !updates.color) this.updateLayoutGuideAppearance({ color: String(updates.value).toUpperCase() }, isTransient);
                if (typeof updates.opacity === 'number') this.updateLayoutGuideAppearance({ opacity: updates.opacity }, isTransient);
            },
            onClose: () => {
                this.layoutGuideFlyout = null;
            }
        });

        flyout.open();
        this.layoutGuideFlyout = flyout;
    }

    createPresetSection() {
        this.presetSection = new Section({ title: 'Master preset' });
        // Stable hook for e2e tests (no visual impact)
        this.presetSection.element.setAttribute('data-testid', 'master-preset-section');
        
        const presetRow = document.createElement('div');
        presetRow.className = 'pi-row preset-picker-row';
        
        // Preset trigger button
        this.presetTriggerBtn = new Button({
            label: 'Select Master Preset',
            variant: 'secondary',
            size: 'sm',
            className: 'preset-trigger-btn',
            onClick: () => {
                this.openMasterPresetFlyout();
            }
        });
        this.presetTrigger = this.presetTriggerBtn.element;
        this.presetTrigger.setAttribute('data-testid', 'master-preset-row-button');
        presetRow.appendChild(this.presetTrigger);
        
        this.presetSection.appendChild(presetRow);
        
        // Description text
        this.presetDescription = document.createElement('div');
        this.presetDescription.className = 'preset-description slide-preset-description';
        this.presetSection.appendChild(this.presetDescription);
        
        this.element.appendChild(this.presetSection.element);
    }

    openMasterPresetFlyout() {
        if (this.masterPresetFlyout) {
            this.masterPresetFlyout.close();
            this.masterPresetFlyout = null;
        }

        const state = store.getState();
        const masterId = state.editor?.activeMasterId || null;

        const flyout = new MasterPresetFlyout({
            trigger: this.presetTrigger,
            mode: 'apply',
            masterId,
            onClose: () => {
                this.masterPresetFlyout = null;
            }
        });

        flyout.open();
        this.masterPresetFlyout = flyout;
    }

    createThemeSection() {
        console.log('SlideSection: Creating theme section');
        
        // Colors Section
        this.colorsSection = new Section({ title: 'Colors' });
        this.colorsContent = this.createColorsSectionContent();
        console.log('SlideSection: Colors content created:', this.colorsContent);
        this.colorsSection.appendChild(this.colorsContent);
        this.element.appendChild(this.colorsSection.element);

        // Typography Section
        this.typographySection = new Section({ title: 'Typography' });
        this.typographyContent = this.createTypographySectionContent();
        this.typographySection.appendChild(this.typographyContent);
        this.element.appendChild(this.typographySection.element);
    }

    createColorsSectionContent() {
        const container = document.createElement('div');
        container.className = 'theme-colors-content';
        
        console.log('SlideSection: Creating colors section content');

        // Header actions row (rendered in the section header to save vertical space)
        const headerRow = document.createElement('div');
        headerRow.className = 'pi-row';
        
        // Left side: Inheritance badge OR theme name
        this.colorBadge = document.createElement('span');
        this.colorBadge.className = 'inherited-fill-badge';
        this.colorBadge.textContent = 'Inherited';
        this.colorBadge.setAttribute('data-testid', 'color-theme-inherited-badge');
        headerRow.appendChild(this.colorBadge);
        
        this.colorThemeName = document.createElement('span');
        this.colorThemeName.className = 'theme-detail-name hidden';
        this.colorThemeName.textContent = '';
        headerRow.appendChild(this.colorThemeName);
        
        // Right side: Button group
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'pi-button-group';

        const colorEditBtn = new Button({
            icon: '<i class="fa-solid fa-pen"></i>',
            variant: 'text',
            size: 'xs',
            title: 'Edit colors',
            onClick: () => panelManager.toggle('color-theme-manager')
        });
        buttonGroup.appendChild(colorEditBtn.element);

        this.colorResetBtn = new Button({
            icon: '<i class="fa-solid fa-arrow-rotate-left"></i>',
            variant: 'text',
            size: 'xs',
            title: 'Reset to inherited',
            onClick: () => this.resetColors()
        });
        this.colorResetBtn.element.setAttribute('data-testid', 'color-theme-reset-btn');
        buttonGroup.appendChild(this.colorResetBtn.element);
        
        headerRow.appendChild(buttonGroup);

        // Prefer placing this row in the section header actions area.
        const actionsHost = this.colorsSection?.element?.querySelector?.('.pi-section__actions');
        if (actionsHost) {
            actionsHost.appendChild(headerRow);
        } else {
            // Fallback (e.g., in unit tests with a simplified Section mock)
            container.appendChild(headerRow);
        }

        // Mode toggle row (Light ☀️ / Dark 🌙)
        const modeRow = document.createElement('div');
        modeRow.className = 'pi-row theme-mode-row pi-mb-2';
        
        const modeLabel = document.createElement('span');
        modeLabel.className = 'pi-label pi-mr-2';
        modeLabel.textContent = 'Mode';
        modeRow.appendChild(modeLabel);
        
        // Get current color mode from store
        const currentMode = StyleResolver.getColorMode();
        
        this.modeToggle = new SegmentedControl({
            testId: 'theme-mode-toggle',
            options: [
                { value: COLOR_MODES.LIGHT, label: 'Light', icon: '<i class="fa-solid fa-sun"></i>', testId: 'theme-mode-light' },
                { value: COLOR_MODES.DARK, label: 'Dark', icon: '<i class="fa-solid fa-moon"></i>', testId: 'theme-mode-dark' }
            ],
            value: currentMode,
            onChange: (mode) => this.updateColorMode(mode)
        });
        modeRow.appendChild(this.modeToggle.element);
        
        container.appendChild(modeRow);

        // Use ThemeSwatches component for luma-locked 12-slot display
        // Now cascade-aware - will show theme from the correct cascade level
        this.themeSwatchesComponent = new ThemeSwatches({
            onColorSelect: () => {}, // No-op for display-only in SlideSection
            showThemeName: false, // We show the name in the header row
            showThemeSource: false,
            columns: 6
        });
        container.appendChild(this.themeSwatchesComponent.element);

        return container;
    }
    
    /**
     * Update the color mode (light/dark)
     * @param {string} mode - 'light' or 'dark'
     */
    updateColorMode(mode) {
        const state = store.getState();
        const themeMasterId = this._getActiveThemeMasterId(state);
        const themeMaster = themeMasterId ? state.slideMasterPresets?.[themeMasterId] : null;
        
        if (!themeMaster) return;
        
        // Dispatch the color mode change
        store.dispatch('SET_COLOR_MODE', {
            masterId: themeMasterId,
            colorMode: mode
        });
        
        // NOTE: CSS variables are NOT applied globally.
        // SlideView.update() applies per-slide CSS vars via StyleResolver.
        // The state-changed event from dispatch will trigger re-renders.
        document.dispatchEvent(new CustomEvent('style:color-mode-changed', {
            detail: { masterId: themeMasterId, colorMode: mode }
        }));
    }

    _getActiveThemeMasterId(state) {
        if (!state) return null;
        const mode = state.editor?.mode;

        if (mode === 'master') {
            const activeMasterId = state.editor?.activeMasterId;
            const active = activeMasterId ? state.slideMasterPresets?.[activeMasterId] : null;
            if (active?.type === 'slideMasterPreset') return active.id;
            if (active?.type === 'layoutMaster' && active.parentMasterId) return active.parentMasterId;
        } else {
            const slideId = state.editor?.activeSlideId;
            const slide = slideId ? state.slides?.[slideId] : null;
            const layout = slide?.layoutId ? state.slideMasterPresets?.[slide.layoutId] : null;
            if (layout?.type === 'layoutMaster' && layout.parentMasterId) return layout.parentMasterId;
        }

        return Object.values(state.slideMasterPresets || {}).find(m => m.type === 'slideMasterPreset')?.id || null;
    }

    createTypographySectionContent() {
        const container = document.createElement('div');
        container.className = 'theme-typography-content';

        // Header actions row with name/badge and buttons (rendered in the section header)
        const headerRow = document.createElement('div');
        headerRow.className = 'pi-row';

        // Left side: Inheritance badge OR typography name
        this.typoBadge = document.createElement('span');
        this.typoBadge.className = 'inherited-fill-badge';
        this.typoBadge.textContent = 'Inherited';
        this.typoBadge.setAttribute('data-testid', 'typography-inherited-badge');
        headerRow.appendChild(this.typoBadge);
        
        this.typographyStyleName = document.createElement('span');
        this.typographyStyleName.className = 'theme-detail-name hidden';
        this.typographyStyleName.textContent = '';
        headerRow.appendChild(this.typographyStyleName);
        
        // Right side: Button group
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'pi-button-group';

        const typoEditBtn = new Button({
            icon: '<i class="fa-solid fa-pen"></i>',
            variant: 'text',
            size: 'xs',
            title: 'Edit typography',
            onClick: () => panelManager.toggle('typography-style-manager'),
            dataTestId: 'typography-manager-btn'
        });
        buttonGroup.appendChild(typoEditBtn.element);

        this.typoResetBtn = new Button({
            icon: '<i class="fa-solid fa-arrow-rotate-left"></i>',
            variant: 'text',
            size: 'xs',
            title: 'Reset to inherited',
            onClick: () => this.resetTypography()
        });
        this.typoResetBtn.element.setAttribute('data-testid', 'typography-reset-btn');
        buttonGroup.appendChild(this.typoResetBtn.element);
        
        headerRow.appendChild(buttonGroup);

        const actionsHost = this.typographySection?.element?.querySelector?.('.pi-section__actions');
        if (actionsHost) {
            actionsHost.appendChild(headerRow);
        } else {
            // Fallback (e.g., in unit tests with a simplified Section mock)
            container.appendChild(headerRow);
        }

        // Heading font row
        const headingRow = document.createElement('div');
        headingRow.className = 'theme-font-row';
        
        const headingLabel = document.createElement('span');
        headingLabel.className = 'theme-font-label';
        headingLabel.textContent = 'Heading';
        headingRow.appendChild(headingLabel);

        this.headingFontName = document.createElement('span');
        this.headingFontName.className = 'theme-font-name';
        this.headingFontName.textContent = 'Inter';
        this.headingFontName.dataset.testid = 'slide-typography-heading-font';
        headingRow.appendChild(this.headingFontName);

        this.headingFontPreview = document.createElement('span');
        this.headingFontPreview.className = 'theme-font-preview';
        this.headingFontPreview.textContent = 'Aa';
        headingRow.appendChild(this.headingFontPreview);

        container.appendChild(headingRow);

        // Body font row
        const bodyRow = document.createElement('div');
        bodyRow.className = 'theme-font-row';
        
        const bodyLabel = document.createElement('span');
        bodyLabel.className = 'theme-font-label';
        bodyLabel.textContent = 'Body';
        bodyRow.appendChild(bodyLabel);

        this.bodyFontName = document.createElement('span');
        this.bodyFontName.className = 'theme-font-name';
        this.bodyFontName.textContent = 'Inter';
        this.bodyFontName.dataset.testid = 'slide-typography-body-font';
        bodyRow.appendChild(this.bodyFontName);

        this.bodyFontPreview = document.createElement('span');
        this.bodyFontPreview.className = 'theme-font-preview';
        this.bodyFontPreview.textContent = 'Aa';
        bodyRow.appendChild(this.bodyFontPreview);

        container.appendChild(bodyRow);

        return container;
    }

    updateThemeDisplay() {
        const state = store.getState();
        const currentObject = this.getActiveContainer(state);
        if (!currentObject) {
            console.warn('SlideSection: No current object found');
            return;
        }

        const mode = state.editor.mode;
        const slideId = mode === 'master' ? null : state.editor.activeSlideId;
        const themeInfo = mode === 'master'
            ? StyleResolver.getThemeInfoForMaster(state.editor.activeMasterId)
            : StyleResolver.getThemeInfoForSlide(slideId);

        // Diagnostic logging
        ThemeDiag.logPropertyInspectorDisplay(slideId, themeInfo, mode);

        // Get typography using cascade-aware resolution (Master slide → Layout master → Slide)
        let typographyStyle;
        let typoInfo = null;
        if (mode === 'master') {
            const contextId = state.editor.activeMasterId;
            typoInfo = StyleResolver.getEffectiveTypographyStyle(contextId);
            typographyStyle = state.typographyStylePresets?.[typoInfo?.typographyStyleId];
        } else {
            typoInfo = StyleResolver.getEffectiveTypographyStyle(slideId);
            typographyStyle = state.typographyStylePresets?.[typoInfo?.typographyStyleId];
        }

        // Extract fonts from resolved typography style
        const themeFonts = typographyStyle?.fonts || { heading: 'Inter', body: 'Inter' };

        // Check if current entity has an explicit override (slide or layout master)
        const hasColorOverride = (() => {
            if (mode === 'master') {
                const active = state.slideMasterPresets?.[state.editor.activeMasterId];
                return active?.type === 'layoutMaster' && themeInfo?.isInherited === false;
            }
            return (
                currentObject.styleAssignments?.colorTheme !== undefined &&
                currentObject.styleAssignments?.colorTheme !== null
            );
        })();

        const hasTypoOverride = (() => {
            if (mode === 'master') {
                const active = state.slideMasterPresets?.[state.editor.activeMasterId];
                return active?.type === 'layoutMaster' && typoInfo?.isInherited === false;
            }
            return (
                currentObject.styleAssignments?.typographyStyle !== undefined &&
                currentObject.styleAssignments?.typographyStyle !== null
            );
        })();

        // Update Colors Section with cascade-aware theme info
        this.updateColorsSectionDisplay(themeInfo, hasColorOverride);

        // Update Typography Section
        this.updateTypographySectionDisplay(themeFonts, hasTypoOverride);
    }

    updateColorsSectionDisplay(themeInfo, isOverride) {
        const lumaTheme = themeInfo?.lumaTheme;
        
        // Update theme name from luma theme
        const themeName = lumaTheme?.name || 'Default';
        
        // Diagnostic logging for Property Inspector display
        const state = store.getState();
        const slideId = state.editor.mode === 'master' ? null : state.editor.activeSlideId;
        ThemeDiag.logUIDisplay('PropertyInspector', {
            slideId,
            mode: state.editor.mode,
            displayedTheme: {
                name: themeName,
                id: lumaTheme?.id || null,
                source: themeInfo?.source,
                isOverride,
                isInherited: themeInfo?.isInherited
            }
        });

        // Update display based on cascade state
        if (!this.colorThemeName || !this.colorBadge) {
            return;
        }
        
        if (isOverride) {
            // Override: show user-chosen theme name, hide badge, show reset button
            this.colorThemeName.textContent = themeName;
            this.colorThemeName.classList.remove('hidden');
            this.colorBadge.classList.add('hidden');
            this.colorResetBtn.element.classList.remove('hidden');
        } else if (themeInfo?.isInherited) {
            // Inherited: show badge, hide theme name, hide reset button
            this.colorThemeName.classList.add('hidden');
            this.colorBadge.classList.remove('hidden');
            this.colorResetBtn.element.classList.add('hidden');
        } else {
            // Master or no cascade: show theme name, hide badge, hide reset button
            this.colorThemeName.textContent = themeName;
            this.colorThemeName.classList.remove('hidden');
            this.colorBadge.classList.add('hidden');
            this.colorResetBtn.element.classList.add('hidden');
        }

        // NOTE: We no longer apply CSS variables globally here.
        // CSS variables are now applied per-slide in SlideView.update()
        // This prevents per-slide themes from polluting other slides.

        // Update mode toggle to reflect current color mode
        const colorMode = themeInfo?.colorMode || COLOR_MODES.LIGHT;
        if (this.modeToggle && this.modeToggle.selectedValue !== colorMode) {
            this.modeToggle.selectedValue = colorMode;
            // Update visual state of toggle buttons
            Array.from(this.modeToggle.element.children).forEach((child, i) => {
                const option = this.modeToggle.options[i];
                if (colorMode === option.value) {
                    child.classList.add('active');
                    child.classList.add('slide-mode-segment');
                } else {
                    child.classList.remove('active');
                    child.classList.add('slide-mode-segment');
                }
            });
        }

        // ThemeSwatches component auto-updates from store via StyleResolver
        // Update its slideId to ensure cascade context is correct
        if (this.themeSwatchesComponent) {
            const state = store.getState();
            const slideId = state.editor.mode === 'master' ? null : state.editor.activeSlideId;
            this.themeSwatchesComponent.setSlideId(slideId);
        }
    }

    updateTypographySectionDisplay(fonts, isOverride) {
        const headingFont = fonts.heading || 'Inter';
        const bodyFont = fonts.body || 'Inter';

        // Update heading font
        this.headingFontName.textContent = headingFont;
        this.headingFontPreview.style.fontFamily = headingFont;

        // Update body font
        this.bodyFontName.textContent = bodyFont;
        this.bodyFontPreview.style.fontFamily = bodyFont;

        // Get typography style info using StyleResolver (like Color Theme)
        const state = store.getState();
        const mode = state.editor.mode;
        
        if (mode === 'master') {
            const contextId = state.editor.activeMasterId;
            const active = state.slideMasterPresets?.[contextId] || null;
            const typoInfo = StyleResolver.getEffectiveTypographyStyle(contextId);
            const preset = state.typographyStylePresets?.[typoInfo?.typographyStyleId];
            const typographyName = preset?.name || 'Default';

            // Theme master: always show name, no reset.
            if (active?.type !== 'layoutMaster') {
                this.typographyStyleName.textContent = typographyName;
                this.typographyStyleName.classList.remove('hidden');
                this.typoBadge.classList.add('hidden');
                this.typoResetBtn.element.classList.add('hidden');
                return;
            }

            // Layout master: inherited vs override mirrors slide behavior.
            if (typoInfo?.isInherited) {
                this.typographyStyleName.classList.add('hidden');
                this.typoBadge.classList.remove('hidden');
                this.typoResetBtn.element.classList.add('hidden');
            } else {
                this.typographyStyleName.textContent = typographyName;
                this.typographyStyleName.classList.remove('hidden');
                this.typoBadge.classList.add('hidden');
                this.typoResetBtn.element.classList.remove('hidden');
            }
        } else {
            // Slide mode: use cascade-aware resolution
            const slideId = state.editor.activeSlideId;
            const typoInfo = StyleResolver.getEffectiveTypographyStyle(slideId);
            const preset = state.typographyStylePresets?.[typoInfo.typographyStyleId];
            const typographyName = preset?.name || 'Default';

            if (typoInfo.isInherited) {
                this.typographyStyleName.classList.add('hidden');
                this.typoBadge.classList.remove('hidden');
                this.typoResetBtn.element.classList.add('hidden');
            } else {
                this.typographyStyleName.textContent = typographyName;
                this.typographyStyleName.classList.remove('hidden');
                this.typoBadge.classList.add('hidden');
                this.typoResetBtn.element.classList.remove('hidden');
            }
        }
    }

    updateInheritanceUI(row, isOverride) {
        // Kept for backward compatibility
        const { badge, resetBtn } = row;
        
        if (isOverride) {
            badge.textContent = 'Override';
            badge.classList.remove('hidden');
            badge.classList.add('override');
            badge.classList.remove('inherited');
            resetBtn.classList.remove('hidden');
        } else {
            badge.textContent = 'Inherited';
            badge.classList.remove('hidden');
            badge.classList.add('inherited');
            badge.classList.remove('override');
            resetBtn.classList.add('hidden');
        }
    }

    resetColors() {
        const state = store.getState();
        const mode = state.editor.mode;
        
        if (mode === 'master') {
            const masterId = state.editor.activeMasterId;
            const active = state.slideMasterPresets?.[masterId];
            // Layout masters inherit from their parent master; reset clears the override.
            if (active?.type === 'layoutMaster') {
                store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
                    masterId,
                    styleAssignments: { colorTheme: null }
                });
            }
        } else {
            // For slides, use the cascade-aware style assignment system
            const slideId = state.editor.activeSlideId;
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: {
                    colorTheme: null // null = inherit from cascade
                }
            });
        }
        
        this.updateThemeDisplay();
    }

    resetTypography() {
        const state = store.getState();
        const mode = state.editor.mode;
        
        if (mode === 'master') {
            const masterId = state.editor.activeMasterId;
            const active = state.slideMasterPresets?.[masterId];
            // Layout masters inherit from their parent master; reset clears the override.
            if (active?.type === 'layoutMaster') {
                store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
                    masterId,
                    styleAssignments: { typographyStyle: null }
                });
            } else {
                // Theme master reset remains "reset to default".
                store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
                    masterId,
                    styleAssignments: { typographyStyle: 'typo-style-default' }
                });
            }
        } else {
            // For slides, reset to null (inherit from cascade)
            const slideId = state.editor.activeSlideId;
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: { typographyStyle: null }
            });
        }
        
        this.updateThemeDisplay();
    }

    update(selection) {
        // This is shown when NO selection exists (or explicit slide selection)
        if (selection && selection.length > 0) {
            this.element.classList.add('hidden');
            return;
        }
        
        this.element.classList.remove('hidden');
        
        const state = store.getState();
        const mode = state.editor.mode;
        const currentObject = this.getActiveContainer(state);

        if (!currentObject) return;

        // 0. Master Preset selector (Master View + Master Slide only)
        // Supports legacy 'theme' and canonical 'slideMasterPreset' master-root types.
        const isMasterRoot = mode === 'master' && currentObject.type === 'slideMasterPreset';
        if (isMasterRoot) {
            this.presetSection.element.classList.remove('hidden');
            // Update preset button label with current preset name
            const currentPresetId = currentObject.presetId || null;
            const currentPreset = currentPresetId ? getPresetById(currentPresetId) : null;
            this.presetTriggerBtn.setLabel(currentPreset ? currentPreset.name : 'Select Master Preset');
            this.presetDescription.textContent = currentPreset?.description || '';
        } else {
            this.presetSection.element.classList.add('hidden');
        }

        // 1. Name (Master only) - show standalone row
        if (mode === 'master') {
            this.nameRow.classList.remove('hidden');
            this.nameInput.setValue(currentObject.name || '');
        } else {
            this.nameRow.classList.add('hidden');
        }

        // 2. Layout Section (Slide only) - update title based on mode
        if (mode !== 'master') {
            this.layoutSection.element.classList.remove('hidden');
            this.layoutSection.setTitle('Layout');
            this.layoutRow.classList.remove('hidden');
            
            // Update layout options for hidden dropdown
            const layouts = Object.values(state.slideMasterPresets || {}).filter(m => m.type === 'layoutMaster');
            const options = layouts.map(l => ({ label: l.name, value: l.id }));
            this.layoutSelect.setOptions(options);
            this.layoutSelect.setValue(currentObject.layoutId);
            
            // Update trigger button text with current layout name
            const currentLayout = layouts.find(l => l.id === currentObject.layoutId);
            this.layoutTriggerBtn.setLabel(currentLayout ? currentLayout.name : 'Select Layout');
            
            // Store current state for flyout
            this.currentLayouts = layouts;
            this.currentLayoutId = currentObject.layoutId;
            this.currentState = state;
        } else {
            // In master mode, show as "Dimensions" section (no layout picker)
            this.layoutSection.element.classList.remove('hidden');
            this.layoutSection.setTitle('Dimensions');
            this.layoutRow.classList.add('hidden');
        }

        // 3. Dimensions
        this.wInput.setValue(currentObject.width, false);
        this.hInput.setValue(currentObject.height, false);

        // 3.25 Transition
        this.updateTransitionDisplay();

        // 3.5 Layout Guides (Master mode only; master root + layouts)
        const hasElementSelection = Array.isArray(state.editor?.selectedElementIds) && state.editor.selectedElementIds.length > 0;
        const supportsLayoutGuides = mode === 'master' && !hasElementSelection && (currentObject.type === 'slideMasterPreset' || currentObject.type === 'layoutMaster');
        if (supportsLayoutGuides) {
            this.layoutGuideSection.element.classList.remove('hidden');
            const { effective: lg, isInherited } = this.getLayoutGuideInheritanceInfo(state, currentObject);

            // Inherited/reset UI is only meaningful for Layout Masters (children of a theme master).
            const showInheritanceUI = currentObject.type === 'layoutMaster';
            if (this.layoutGuideInheritedBadge) {
                this.layoutGuideInheritedBadge.classList.toggle('hidden', !showInheritanceUI || !isInherited);
            }
            if (this.layoutGuideResetBtn?.element) {
                const hasDirect = !!currentObject.layoutGuide;
                this.layoutGuideResetBtn.element.classList.toggle('hidden', !showInheritanceUI || !hasDirect);
            }

            const linked = lg.marginsLinked !== false;
            this.marginLinkBtn.element.classList.toggle('unlinked', !linked);

            // Linked vs unlinked margin UI
            this.marginAllRow.classList.toggle('hidden', !linked);
            this.marginUnlinkedRow1.classList.toggle('hidden', linked);
            this.marginUnlinkedRow2.classList.toggle('hidden', linked);

            if (linked) {
                this.marginAllInput.setValue(lg.margins.top, false);
            } else {
                this.marginTopInput.setValue(lg.margins.top, false);
                this.marginRightInput.setValue(lg.margins.right, false);
                this.marginBottomInput.setValue(lg.margins.bottom, false);
                this.marginLeftInput.setValue(lg.margins.left, false);
            }

            // Columns
            this.columnsCountInput.setValue(lg.columns.count, false);
            this.gutterInput.setValue(lg.columns.gutter, false);

            // Appearance
            const color = lg.appearance?.color || '#FF0000';
            const opacity = typeof lg.appearance?.opacity === 'number' ? lg.appearance.opacity : 10;
            this.layoutGuideColorPreview.style.backgroundColor = color;
            this.layoutGuideColorHexInput.value = color;
            this.layoutGuideOpacityInput.setValue(opacity, false);
        } else {
            this.layoutGuideSection.element.classList.add('hidden');
        }

        // 4. Theme Display
        this.updateThemeDisplay();

        // 5. Background
        const bg = currentObject.background;
        let fills = [];
        
        if (Array.isArray(bg)) {
            fills = bg;
        } else if (bg && bg.type !== 'inherited') {
             fills = [{
                 type: bg.type,
                 value: bg.value,
                 color: bg.value,
                 opacity: 100,
                 visible: true
             }];
        }
        
        // Get inherited background for display
        const inheritedBg = this.getInheritedBackground(state, currentObject);
        
        const proxyElement = {
            id: currentObject.id,
            style: {
                fills: fills
            },
            // Pass inherited info to FillSection
            inheritedFill: inheritedBg,
            hasOwnBackground: bg !== null && bg !== undefined && (Array.isArray(bg) ? bg.length > 0 : bg.type !== 'inherited')
        };
        
        this.fillSection.update([proxyElement]);
    }

    /**
     * Resolve the inherited background from layout or master
     */
    getInheritedBackground(state, currentObject) {
        const mode = state.editor.mode;
        
        if (mode === 'master') {
            // Masters don't inherit (except layouts from theme master)
            const master = currentObject;
            if (master.type === 'layoutMaster' && master.parentMasterId) {
                const themeMaster = state.slideMasterPresets[master.parentMasterId];
                if (themeMaster && themeMaster.background) {
                    return this.normalizeFill(themeMaster.background);
                }
            }
            return null;
        } else {
            // Slides inherit from layout, which may inherit from theme master
            const slide = currentObject;
            const layout = state.slideMasterPresets[slide.layoutId];
            
            if (layout) {
                // Check if layout has its own background
                if (layout.background && layout.background.type !== 'inherited') {
                    return this.normalizeFill(layout.background);
                }
                
                // Otherwise, get from theme master
                if (layout.parentMasterId) {
                    const themeMaster = state.slideMasterPresets[layout.parentMasterId];
                    if (themeMaster && themeMaster.background) {
                        return this.normalizeFill(themeMaster.background);
                    }
                }
            }
            return null;
        }
    }

    /**
     * Normalize background object to a fill object format
     */
    normalizeFill(bg) {
        if (!bg) return null;
        
        if (Array.isArray(bg)) {
            // If it's already an array, return the first visible fill
            const visible = bg.find(f => f.visible !== false);
            return visible || bg[0] || null;
        }
        
        return {
            type: bg.type || 'solid',
            value: bg.value,
            color: bg.value,
            opacity: 100,
            visible: true
        };
    }

    getActiveContainer(state) {
        if (state.editor.mode === 'master') {
            return state.slideMasterPresets[state.editor.activeMasterId];
        } else {
            return state.slides[state.editor.activeSlideId];
        }
    }

    updateName(name) {
        const state = store.getState();
        const id = state.editor.activeMasterId;
        store.dispatch('UPDATE_MASTER', { id, name });
    }

    updateLayout(layoutId) {
        const state = store.getState();
        const id = state.editor.activeSlideId;
        store.dispatch('UPDATE_SLIDE', { id, layoutId });
    }

    updateDimension(prop, val, isTransient = false) {
        const state = store.getState();
        const mode = state.editor.mode;
        const action = mode === 'master' ? 'UPDATE_MASTER' : 'UPDATE_SLIDE';
        const id = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        
        store.dispatch(action, { id, [prop]: Math.max(100, val) }, { skipHistory: isTransient });
    }

    updateBackground(fills, isTransient) {
        const state = store.getState();
        const mode = state.editor.mode;
        const action = mode === 'master' ? 'UPDATE_MASTER' : 'UPDATE_SLIDE';
        const id = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        
        // If fills is empty, set to null to inherit from parent
        const background = (fills && fills.length > 0) ? fills : null;
        
        store.dispatch(action, { id, background }, { skipHistory: isTransient });
    }
    
    openLayoutFlyout() {
        // Create flyout content
        const content = document.createElement('div');
        content.className = 'layout-flyout-content';
        content.setAttribute('data-testid', 'layout-picker-flyout');
        
        // Title
        const title = document.createElement('div');
        title.className = 'layout-flyout-title';
        title.textContent = 'Select Layout';
        content.appendChild(title);
        
        const layouts = this.currentLayouts || [];
        const currentLayoutId = this.currentLayoutId;
        const state = this.currentState;

        const mastersById = state?.slideMasterPresets || {};

        // Group layouts by parent master (canonical: layoutMaster.parentMasterId)
        const groupMap = new Map();
        for (const layout of layouts) {
            const parentMasterId = layout.parentMasterId || 'unknown-master';
            if (!groupMap.has(parentMasterId)) {
                groupMap.set(parentMasterId, []);
            }
            groupMap.get(parentMasterId).push(layout);
        }

        // Determine master order (prefer explicit display order if present)
        let masterOrder = [];
        if (Array.isArray(state?.masterDisplayOrder) && state.masterDisplayOrder.length > 0) {
            masterOrder = state.masterDisplayOrder.slice();
        } else {
            masterOrder = Object.values(mastersById)
                .filter(m => m && m.type === 'slideMasterPreset')
                .map(m => m.id)
                .sort((a, b) => {
                    const ma = mastersById[a];
                    const mb = mastersById[b];
                    return String(ma?.name || a).localeCompare(String(mb?.name || b));
                });
        }

        const orderedMasterIds = [];
        for (const masterId of masterOrder) {
            if (groupMap.has(masterId)) orderedMasterIds.push(masterId);
        }
        for (const [masterId] of groupMap.entries()) {
            if (!orderedMasterIds.includes(masterId)) orderedMasterIds.push(masterId);
        }

        const makeLayoutThumbnail = (layout) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'layout-thumbnail' + (layout.id === currentLayoutId ? ' selected' : '');
            thumbnail.dataset.layoutId = layout.id;
            thumbnail.setAttribute('data-testid', 'layout-picker-option');
            thumbnail.title = layout.name;

            // Get effective layout data (with theme inheritance)
            const effectiveLayout = store.getEffectiveMaster(layout.id);

            // Create accurate preview using ThumbnailRenderer (only if effectiveLayout exists)
            if (effectiveLayout) {
                const previewWrapper = document.createElement('div');
                previewWrapper.className = 'layout-preview';

                const preview = ThumbnailRenderer.createThumbnail(layout.id, effectiveLayout);
                previewWrapper.appendChild(preview);

                thumbnail.appendChild(previewWrapper);
            } else {
                const preview = document.createElement('div');
                preview.className = 'layout-preview';
                thumbnail.appendChild(preview);
            }

            const label = document.createElement('div');
            label.className = 'layout-label';
            label.textContent = layout.name;
            thumbnail.appendChild(label);

            thumbnail.addEventListener('click', () => {
                if (layout.id !== currentLayoutId) {
                    this.layoutSelect.setValue(layout.id);
                    this.updateLayout(layout.id);
                    this.layoutTriggerBtn.setLabel(layout.name);
                }
                if (this.layoutFlyout) {
                    this.layoutFlyout.close();
                }
            });

            return thumbnail;
        };

        // Render groups (Master -> Layouts), while keeping single-step selection.
        orderedMasterIds.forEach(masterId => {
            const group = document.createElement('div');
            group.className = 'layout-flyout-group';
            group.setAttribute('data-testid', 'layout-picker-group');
            group.dataset.masterId = masterId;

            const master = mastersById?.[masterId];
            const groupTitle = document.createElement('div');
            groupTitle.className = 'layout-flyout-group-title';
            groupTitle.setAttribute('data-testid', 'layout-picker-group-title');
            groupTitle.textContent = master?.name || 'Master';
            group.appendChild(groupTitle);

            const grid = document.createElement('div');
            grid.className = 'layout-flyout-grid';

            const groupLayouts = groupMap.get(masterId) || [];
            // Stable ordering inside group
            groupLayouts
                .slice()
                .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)))
                .forEach(layout => {
                    grid.appendChild(makeLayoutThumbnail(layout));
                });

            group.appendChild(grid);
            content.appendChild(group);
        });
        
        // Create or update flyout
        if (this.layoutFlyout) {
            this.layoutFlyout.close();
        }
        
        this.layoutFlyout = new Flyout({
            trigger: this.layoutTrigger,
            content: content,
            position: 'left'
        });
        
        this.layoutFlyout.open();
    }


    setupThemeListener() {
        const updateTheme = (theme) => {
            const isLight = theme === 'light';
            // Target the layout trigger button element
            if (this.layoutTriggerBtn && this.layoutTriggerBtn.element) {
                if (isLight) {
                    this.layoutTriggerBtn.element.classList.add('light-theme');
                } else {
                    this.layoutTriggerBtn.element.classList.remove('light-theme');
                }
            }
        };

        // Initial check
        const initialTheme = localStorage.getItem('story-theme') || localStorage.getItem('themeMode');
        updateTheme(initialTheme);

        // Listen for changes
        window.addEventListener('theme-changed', (e) => updateTheme(e.detail.theme));
    }
}
