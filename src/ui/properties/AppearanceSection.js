import { BaseSection } from './BaseSection.js';
import { NumberInput } from '../components/NumberInput.js';
import { Dropdown } from '../components/Dropdown.js';
import { Button } from '../components/Button.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';
import { isRectangleElement } from '../../core/shapes/ShapeElementAdapter.js';

/**
 * AppearanceSection - Property Inspector section for appearance controls
 * 
 * Controls:
 * - Opacity (0-100%)
 * - Blend Mode (normal, multiply, screen, etc.)
 * - Corner Radius (uniform or per-corner)
 * - Visibility toggle
 * 
 * @spec documentation/01-specs/ui-system/property-inspector-v2/04-appearance-section.md
 */
export class AppearanceSection extends BaseSection {
    constructor() {
        super({ 
            title: 'Appearance',
            actions: [
                { icon: Icons.VISIBLE, title: 'Toggle Visibility', onClick: () => this.toggleVisibility() }
            ]
        });
        
        // Track radius link state
        this._radiusLinked = true;
        
        this.createContent();
    }

    createContent() {
        // Opacity Row
        const opacityRow = document.createElement('div');
        opacityRow.className = 'pi-row';

        this.opacityInput = new NumberInput({
            icon: Icons.OPACITY || 'Opacity',
            value: 100,
            units: '%',
            min: 0,
            max: 100,
            onChange: (val, isTransient) => this.updateProperty('opacity', val / 100, isTransient)
        });

        // Blend Mode
        this.blendModeSelect = new Dropdown({
            options: [
                { label: 'Normal', value: 'normal' },
                { label: 'Multiply', value: 'multiply' },
                { label: 'Screen', value: 'screen' },
                { label: 'Overlay', value: 'overlay' },
                { label: 'Darken', value: 'darken' },
                { label: 'Lighten', value: 'lighten' },
                { label: 'Color Dodge', value: 'color-dodge' },
                { label: 'Color Burn', value: 'color-burn' },
                { label: 'Hard Light', value: 'hard-light' },
                { label: 'Soft Light', value: 'soft-light' },
                { label: 'Difference', value: 'difference' },
                { label: 'Exclusion', value: 'exclusion' },
                { label: 'Hue', value: 'hue' },
                { label: 'Saturation', value: 'saturation' },
                { label: 'Color', value: 'color' },
                { label: 'Luminosity', value: 'luminosity' }
            ],
            value: 'normal',
            size: 'fill',
            onChange: (val) => this.updateProperty('blendMode', val)
        });
        
        // Fixed width for opacity input
        this.opacityInput.element.classList.add('pi-input-fixed-width');

        opacityRow.appendChild(this.opacityInput.element);
        opacityRow.appendChild(this.blendModeSelect.element);
        this.section.appendChild(opacityRow);

        // Corner Radius Row (Uniform Mode)
        this.radiusRow = document.createElement('div');
        this.radiusRow.className = 'pi-row pi-radius-row';
        this.radiusRow.setAttribute('data-testid', 'appearance-radius-row');

        this.radiusInput = new NumberInput({
            icon: Icons.BORDER_RADIUS || 'Radius',
            value: 0,
            min: 0,
            onChange: (val, isTransient) => this._handleUniformRadiusChange(val, isTransient)
        });
        this.radiusInput.element.setAttribute('data-testid', 'appearance-radius-input');

        // Link/Unlink button for radius
        this.radiusLinkBtn = new Button({
            icon: Icons.LINK || '🔗',
            size: 'xs',
            variant: 'text',
            ariaLabel: 'Toggle per-corner radius',
            onClick: () => this._toggleRadiusLink()
        });
        this.radiusLinkBtn.element.classList.add('pi-radius-link-btn');
        this.radiusLinkBtn.element.setAttribute('data-testid', 'appearance-radius-link');

        this.radiusRow.appendChild(this.radiusInput.element);
        this.radiusRow.appendChild(this.radiusLinkBtn.element);
        this.section.appendChild(this.radiusRow);

        // Per-Corner Radius Row (hidden by default)
        this.perCornerRow = document.createElement('div');
        this.perCornerRow.className = 'pi-row pi-radius-per-corner hidden';
        this.perCornerRow.setAttribute('data-testid', 'appearance-radius-per-corner');
        
        // Create 4 corner inputs in a 2x2 grid
        const cornerGrid = document.createElement('div');
        cornerGrid.className = 'pi-corner-grid';

        this.tlRadiusInput = new NumberInput({
            icon: Icons.CORNER_TL || 'TL',
            value: 0,
            min: 0,
            onChange: (val, isTransient) => this._handleCornerRadiusChange('tl', val, isTransient)
        });

        this.trRadiusInput = new NumberInput({
            icon: Icons.CORNER_TR || 'TR',
            value: 0,
            min: 0,
            onChange: (val, isTransient) => this._handleCornerRadiusChange('tr', val, isTransient)
        });

        this.blRadiusInput = new NumberInput({
            icon: Icons.CORNER_BL || 'BL',
            value: 0,
            min: 0,
            onChange: (val, isTransient) => this._handleCornerRadiusChange('bl', val, isTransient)
        });

        this.brRadiusInput = new NumberInput({
            icon: Icons.CORNER_BR || 'BR',
            value: 0,
            min: 0,
            onChange: (val, isTransient) => this._handleCornerRadiusChange('br', val, isTransient)
        });

        cornerGrid.appendChild(this.tlRadiusInput.element);
        cornerGrid.appendChild(this.trRadiusInput.element);
        cornerGrid.appendChild(this.blRadiusInput.element);
        cornerGrid.appendChild(this.brRadiusInput.element);
        this.perCornerRow.appendChild(cornerGrid);
        this.section.appendChild(this.perCornerRow);
    }

    /**
     * Handle uniform radius change (all corners same)
     */
    _handleUniformRadiusChange(val, isTransient) {
        this.updateProperty('borderRadius', val, isTransient);
        // Clear per-corner values when using uniform
        this.updateProperty('cornerRadii', null, isTransient);
    }

    /**
     * Handle individual corner radius change
     */
    _handleCornerRadiusChange(corner, val, isTransient) {
        if (!this.selection || this.selection.length === 0) return;
        
        const state = store.getState();

        // Update each element independently so we don't overwrite other corners
        // with the first element's radii.
        this.selection.forEach((id) => {
            const element = this.getElement(state, id);
            if (!element) return;

            const base = element.cornerRadii || {
                tl: element.borderRadius || 0,
                tr: element.borderRadius || 0,
                bl: element.borderRadius || 0,
                br: element.borderRadius || 0
            };

            const next = { ...base, [corner]: val };

            store.dispatch(
                'UPDATE_ELEMENT',
                {
                    id,
                    cornerRadii: next,
                    borderRadius: null
                },
                { skipHistory: isTransient }
            );
        });
    }

    /**
     * Toggle between uniform and per-corner radius modes
     */
    _toggleRadiusLink() {
        this._radiusLinked = !this._radiusLinked;
        
        if (this._radiusLinked) {
            // Switching to linked: average existing corners
            this._switchToUniformMode();
        } else {
            // Switching to per-corner: copy uniform value to all corners
            this._switchToPerCornerMode();
        }
        
        this._updateRadiusUI();
    }

    /**
     * Switch to uniform radius mode
     */
    _switchToUniformMode() {
        if (!this.selection || this.selection.length === 0) return;
        
        const state = store.getState();
        const element = this.getElement(state, this.selection[0]);
        if (!element || !element.cornerRadii) return;

        // Calculate average of corners
        const radii = element.cornerRadii;
        const avg = Math.round((radii.tl + radii.tr + radii.bl + radii.br) / 4);

        // Apply uniform radius
        this.selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { 
                id, 
                borderRadius: avg,
                cornerRadii: null  // Clear per-corner values
            });
        });

        this.radiusInput.setValue(avg, false);
    }

    /**
     * Switch to per-corner radius mode
     */
    _switchToPerCornerMode() {
        if (!this.selection || this.selection.length === 0) return;
        
        const state = store.getState();
        const element = this.getElement(state, this.selection[0]);
        if (!element) return;

        const uniformRadius = element.borderRadius || 0;

        // Copy uniform value to all corners
        const cornerRadii = {
            tl: uniformRadius,
            tr: uniformRadius,
            bl: uniformRadius,
            br: uniformRadius
        };

        this.selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { 
                id, 
                cornerRadii,
                borderRadius: null
            });
        });

        // Update per-corner inputs
        this.tlRadiusInput.setValue(uniformRadius, false);
        this.trRadiusInput.setValue(uniformRadius, false);
        this.blRadiusInput.setValue(uniformRadius, false);
        this.brRadiusInput.setValue(uniformRadius, false);
    }

    /**
     * Update radius UI based on linked state
     */
    _updateRadiusUI() {
        if (this._radiusLinked) {
            this.radiusInput.element.classList.remove('hidden');
            this.perCornerRow.classList.add('hidden');
            this.radiusLinkBtn.element.classList.remove('unlinked');
            this.radiusLinkBtn.element.setAttribute('aria-pressed', 'true');
        } else {
            this.radiusInput.element.classList.add('hidden');
            this.perCornerRow.classList.remove('hidden');
            this.radiusLinkBtn.element.classList.add('unlinked');
            this.radiusLinkBtn.element.setAttribute('aria-pressed', 'false');
        }
    }

    update(selection) {
        super.update(selection);
        
        const elements = this.getSelectedElements();
        if (elements.length === 0) return;

        // Opacity - check for mixed values
        const opacityResult = this.getMixedValue(elements, 'opacity');
        if (opacityResult.mixed) {
            this.opacityInput.setMixed(true);
        } else {
            this.opacityInput.setMixed(false);
            const opacity = opacityResult.value !== undefined ? opacityResult.value : 1;
            this.opacityInput.setValue(Math.round(opacity * 100), false);
        }

        // Blend Mode - check for mixed values
        const blendModeResult = this.getMixedValue(elements, 'blendMode');
        if (blendModeResult.mixed) {
            this.blendModeSelect.setMixed(true);
        } else {
            this.blendModeSelect.setMixed(false);
            const blendMode = blendModeResult.value || 'normal';
            this.blendModeSelect.setValue(blendMode);
        }
        
        // Radius only makes sense when ALL selected elements support it.
        const supportsRadius = (el) => isRectangleElement(el) || el.type === 'image';
        const allSupportRadius = elements.every(supportsRadius);

        const hasPerCorner = (el) => {
            const radii = el.cornerRadii;
            if (!radii) return false;
            return (
                radii.tl !== undefined ||
                radii.tr !== undefined ||
                radii.bl !== undefined ||
                radii.br !== undefined
            );
        };

        if (allSupportRadius) {
            this.radiusRow.classList.remove('hidden');
            this.radiusLinkBtn.element.classList.remove('hidden');

            const perCornerFlags = elements.map(hasPerCorner);
            const allPerCorner = perCornerFlags.every(Boolean);
            const nonePerCorner = perCornerFlags.every((v) => !v);

            if (allPerCorner) {
                this._radiusLinked = false;

                const radiiObjects = elements.map((el) => {
                    const r = el.cornerRadii || {};
                    return {
                        tl: r.tl ?? 0,
                        tr: r.tr ?? 0,
                        bl: r.bl ?? 0,
                        br: r.br ?? 0
                    };
                });

                const tl = this.getMixedValue(radiiObjects, 'tl');
                const tr = this.getMixedValue(radiiObjects, 'tr');
                const bl = this.getMixedValue(radiiObjects, 'bl');
                const br = this.getMixedValue(radiiObjects, 'br');

                tl.mixed ? this.tlRadiusInput.setMixed(true) : (this.tlRadiusInput.setMixed(false), this.tlRadiusInput.setValue(tl.value ?? 0, false));
                tr.mixed ? this.trRadiusInput.setMixed(true) : (this.trRadiusInput.setMixed(false), this.trRadiusInput.setValue(tr.value ?? 0, false));
                bl.mixed ? this.blRadiusInput.setMixed(true) : (this.blRadiusInput.setMixed(false), this.blRadiusInput.setValue(bl.value ?? 0, false));
                br.mixed ? this.brRadiusInput.setMixed(true) : (this.brRadiusInput.setMixed(false), this.brRadiusInput.setValue(br.value ?? 0, false));

                // When per-corner is active, hide uniform input.
                this.radiusInput.setMixed(false);
            } else {
                // Uniform mode (also used as fallback if selection is mixed per-corner vs uniform)
                this._radiusLinked = true;

                const uniformObjects = elements.map((el) => ({ v: el.borderRadius || 0 }));
                const uniform = this.getMixedValue(uniformObjects, 'v');
                if (uniform.mixed || !nonePerCorner) {
                    this.radiusInput.setMixed(true);
                } else {
                    this.radiusInput.setMixed(false);
                    this.radiusInput.setValue(uniform.value ?? 0, false);
                }
            }
            
            this._updateRadiusUI();
        } else {
            this.radiusRow.classList.add('hidden');
            this.radiusInput.element.classList.add('hidden');
            this.radiusLinkBtn.element.classList.add('hidden');
            this.perCornerRow.classList.add('hidden');
        }
    }



    toggleVisibility() {
        if (!this.selection || this.selection.length === 0) return;
        
        const state = store.getState();
        // Toggle based on first item
        const firstEl = this.getElement(state, this.selection[0]);
        const newHidden = !firstEl.hidden; // Toggle hidden state
        
        this.selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { id, hidden: newHidden });
        });
        
        // Update icon state (optional, or wait for re-render)
    }

    /**
     * Check if radius is in per-corner mode
     * @returns {boolean}
     */
    isRadiusLinked() {
        return this._radiusLinked;
    }

    /**
     * Get the current corner radii values
     * @returns {{ tl: number, tr: number, bl: number, br: number } | null}
     */
    getCornerRadii() {
        if (this._radiusLinked) return null;
        
        return {
            tl: this.tlRadiusInput?.getValue?.() || 0,
            tr: this.trRadiusInput?.getValue?.() || 0,
            bl: this.blRadiusInput?.getValue?.() || 0,
            br: this.brRadiusInput?.getValue?.() || 0
        };
    }
}
