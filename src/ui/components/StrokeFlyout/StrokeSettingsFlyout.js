import { Flyout } from '../Flyout.js';
import { SegmentedControl } from '../SegmentedControl.js';
import { Dropdown } from '../Dropdown.js';
import { NumberInput } from '../NumberInput.js';
import { TextInput } from '../TextInput.js';
import { IconButton } from '../IconButton.js';
import { Icons } from '../../Icons.js';
import { FillTypeSelector } from '../FillTypeSelector.js';
import { SolidTab } from '../FillFlyout/SolidTab.js';
import { GradientTab } from '../FillFlyout/GradientTab.js';

export class StrokeSettingsFlyout {
    constructor(options = {}) {
        this.stroke = options.stroke || {};
        this.onChange = options.onChange || (() => {});
        this.trigger = options.trigger;
        
        this.flyout = new Flyout({
            trigger: this.trigger,
            content: this.renderContent(),
            position: 'left',
            onClose: options.onClose
        });
    }

    open() {
        this.flyout.open();
    }

    close() {
        this.flyout.close();
    }

    renderContent() {
        const container = document.createElement('div');
        container.style.width = '240px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '12px';

        // --- 1. Header (Custom / Libraries) ---
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        
        const tabs = document.createElement('div');
        tabs.style.display = 'flex';
        tabs.style.gap = '12px';
        
        const customTab = document.createElement('div');
        customTab.textContent = 'Custom';
        customTab.style.fontSize = '11px';
        customTab.style.fontWeight = '600';
        customTab.style.color = 'var(--text-primary)';
        customTab.style.cursor = 'pointer';
        
        const librariesTab = document.createElement('div');
        librariesTab.textContent = 'Libraries';
        librariesTab.style.fontSize = '11px';
        librariesTab.style.color = 'var(--text-tertiary)';
        librariesTab.style.cursor = 'pointer';

        tabs.appendChild(customTab);
        tabs.appendChild(librariesTab);

        const closeBtn = new IconButton({ icon: Icons.CLOSE, title: 'Close', onClick: () => this.close() });

        header.appendChild(tabs);
        header.appendChild(closeBtn.element);
        container.appendChild(header);

        // --- 2. Mode Selector (Solid, Gradient, etc.) ---
        // For stroke, we mainly support Solid and Gradient for now.
        const modeRow = document.createElement('div');
        modeRow.style.display = 'flex';
        modeRow.style.gap = '2px';
        modeRow.style.borderBottom = '1px solid var(--color-border)';
        modeRow.style.paddingBottom = '8px';

        let activeMode = this.stroke.type || 'solid'; // Default to solid if undefined

        const typeSelector = new FillTypeSelector({
            activeType: activeMode,
            types: [
                { type: 'solid', icon: Icons.FILL_SOLID, title: 'Solid Color' },
                { type: 'gradient', icon: Icons.FILL_GRADIENT, title: 'Gradient' }
            ],
            onChange: (type) => {
                activeMode = type;
                this.updateModeContent(modeContent, activeMode);

                // Update Data Model immediately
                if (activeMode === 'gradient') {
                    const val = this.stroke.value || 'linear-gradient(90deg, #000000 0%, #ffffff 100%)';
                    this.onChange({ type: 'gradient', value: val });
                } else {
                    this.onChange({ type: 'solid' });
                }
            }
        });

        modeRow.appendChild(typeSelector.element);
        container.appendChild(modeRow);

        // --- 3. Color Content (Solid/Gradient Tab) ---
        const modeContent = document.createElement('div');
        this.updateModeContent(modeContent, activeMode);
        container.appendChild(modeContent);

        // --- 4. Stroke Properties (Weight, Position, Sides) ---
        const propsContainer = document.createElement('div');
        propsContainer.style.display = 'flex';
        propsContainer.style.flexDirection = 'column';
        propsContainer.style.gap = '8px';
        propsContainer.style.borderTop = '1px solid var(--color-border)';
        propsContainer.style.paddingTop = '12px';

        // Row A: Weight & Position
        const rowA = document.createElement('div');
        rowA.style.display = 'flex';
        rowA.style.gap = '8px';
        rowA.style.alignItems = 'center';

        const weightInput = new NumberInput({
            value: this.stroke.width || 1,
            min: 0,
            max: 100,
            label: 'W',
            scrubbable: true,
            width: '60px',
            onChange: (val) => this.onChange({ width: val })
        });

        const positionDropdown = new Dropdown({
            options: [
                { label: 'Center', value: 'center' },
                { label: 'Inside', value: 'inside' },
                { label: 'Outside', value: 'outside' }
            ],
            value: this.stroke.position || 'center',
            width: '100%',
            onChange: (val) => this.onChange({ position: val })
        });
        rowA.appendChild(weightInput.element);
        rowA.appendChild(positionDropdown.element);
        propsContainer.appendChild(rowA);

        // Style (Solid/Dashed) - Segmented Control
        const styleRow = this.createRow('Style');
        const styleControl = new SegmentedControl({
            options: [
                { label: 'Solid', value: 'solid' },
                { label: 'Dashed', value: 'dashed' }
            ],
            value: (this.stroke.style === 'dashed' || this.stroke.style === 'custom') ? 'dashed' : 'solid',
            onChange: (val) => {
                // If switching to dashed, default to 'dashed' style (or keep custom if it was custom?)
                // Let's just set it to 'dashed' or 'solid'.
                // If 'dashed' is selected, we show the dash input which allows customization.
                // If the user types in the input, we might want to switch to 'custom' internally if needed, 
                // or just treat 'dashed' as having a dashArray.
                // The renderer handles 'dashed' with dashArray.
                this.onChange({ style: val });
                updateDashVisibility(val);
            }
        });
        styleRow.appendChild(styleControl.element);
        propsContainer.appendChild(styleRow);

        // Dashes & Cap (Conditional)
        const dashRow = this.createRow('Dashes');
        dashRow.style.display = 'none';
        
        const dashContainer = document.createElement('div');
        dashContainer.style.display = 'flex';
        dashContainer.style.gap = '8px';
        dashContainer.style.width = '100%';

        const dashInput = new TextInput({
            value: this.stroke.dashArray || '2, 4',
            placeholder: '2, 4',
            onChange: (val) => this.onChange({ dashArray: val })
        });
        dashInput.element.style.flex = '1';
        // Fix TextInput styling to match
        const inputEl = dashInput.element.querySelector('input');
        if (inputEl) {
            inputEl.style.textAlign = 'center';
            inputEl.style.fontFamily = 'var(--font-mono)';
        }

        const capControl = new SegmentedControl({
            options: [
                { label: 'Butt', value: 'butt', icon: Icons.CAP_BUTT },
                { label: 'Square', value: 'square', icon: Icons.CAP_SQUARE },
                { label: 'Round', value: 'round', icon: Icons.CAP_ROUND }
            ],
            value: this.stroke.dashCap || 'butt',
            onChange: (val) => this.onChange({ dashCap: val })
        });
        capControl.element.style.width = 'auto';
        capControl.element.style.flex = '0 0 auto';
        capControl.element.style.marginBottom = '0';

        dashContainer.appendChild(dashInput.element);
        dashContainer.appendChild(capControl.element);
        dashRow.appendChild(dashContainer);
        propsContainer.appendChild(dashRow);

        const updateDashVisibility = (style) => {
            dashRow.style.display = (style === 'dashed' || style === 'custom') ? 'flex' : 'none';
        };
        updateDashVisibility(this.stroke.style || 'solid');

        // Joins
        const joinRow = this.createRow('Join');
        const joinControl = new SegmentedControl({
            options: [
                { label: 'Miter', value: 'miter', icon: Icons.JOIN_MITER },
                { label: 'Bevel', value: 'bevel', icon: Icons.JOIN_BEVEL },
                { label: 'Round', value: 'round', icon: Icons.JOIN_ROUND }
            ],
            value: this.stroke.join || 'miter',
            onChange: (val) => {
                this.onChange({ join: val });
                miterRow.style.display = val === 'miter' ? 'flex' : 'none';
            }
        });
        joinRow.appendChild(joinControl.element);
        propsContainer.appendChild(joinRow);

        // Miter Limit (Conditional)
        const miterRow = this.createRow('Miter Angle');
        miterRow.style.display = (this.stroke.join || 'miter') === 'miter' ? 'flex' : 'none';
        const miterInput = new NumberInput({
            value: this.stroke.miterLimit || 28.96,
            suffix: '°',
            scrubbable: true,
            width: '100%',
            onChange: (val) => this.onChange({ miterLimit: val })
        });
        miterRow.appendChild(miterInput.element);
        propsContainer.appendChild(miterRow);

        container.appendChild(propsContainer);

        return container;
    }

    updateModeContent(container, mode) {
        container.innerHTML = '';
        if (mode === 'solid') {
            const tab = new SolidTab({
                fill: { color: this.stroke.color, opacity: 100 }, // Adapt stroke to fill format
                onChange: (updates) => {
                    if (updates.color) this.onChange({ color: updates.color, type: 'solid' });
                }
            });
            container.appendChild(tab.element);
        } else if (mode === 'gradient') {
            const tab = new GradientTab({
                fill: { value: this.stroke.value || 'linear-gradient(90deg, #000000 0%, #ffffff 100%)' },
                onChange: (updates) => {
                    this.onChange({ value: updates.value, type: 'gradient' });
                }
            });
            container.appendChild(tab.element);
        }
    }

    createRow(label) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '4px';
        
        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        labelEl.style.fontSize = '10px';
        labelEl.style.color = 'var(--text-secondary)';
        
        row.appendChild(labelEl);
        return row;
    }
}

