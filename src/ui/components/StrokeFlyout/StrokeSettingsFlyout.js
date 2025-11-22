import { Flyout } from '../Flyout.js';
import { SegmentedControl } from '../SegmentedControl.js';
import { Dropdown } from '../Dropdown.js';
import { NumberInput } from '../NumberInput.js';
import { IconButton } from '../IconButton.js';
import { Icons } from '../../Icons.js';
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

        const modes = [
            { type: 'solid', icon: Icons.FILL_SOLID, title: 'Solid Color' },
            { type: 'gradient', icon: Icons.FILL_GRADIENT, title: 'Gradient' }
        ];

        let activeMode = this.stroke.type || 'solid'; // Default to solid if undefined

        modes.forEach(mode => {
            const btn = new IconButton({
                icon: mode.icon,
                title: mode.title,
                onClick: () => {
                    activeMode = mode.type;
                    this.updateModeContent(modeContent, activeMode);
                    // Update UI state of buttons
                    modeRow.querySelectorAll('.icon-button').forEach(b => b.classList.remove('active'));
                    btn.element.classList.add('active');
                }
            });
            if (mode.type === activeMode) btn.element.classList.add('active');
            modeRow.appendChild(btn.element);
        });
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

        // Style (Solid/Dashed)
        const styleRow = this.createRow('Style');
        const styleDropdown = new Dropdown({
            options: [
                { label: 'Solid', value: 'solid' },
                { label: 'Dashed', value: 'dashed' },
                { label: 'Dotted', value: 'dotted' }
            ],
            value: this.stroke.style || 'solid',
            width: '100%',
            onChange: (val) => this.onChange({ style: val })
        });
        styleRow.appendChild(styleDropdown.element);
        propsContainer.appendChild(styleRow);

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
                    if (updates.color) this.onChange({ color: updates.color });
                }
            });
            container.appendChild(tab.element);
        } else if (mode === 'gradient') {
            // Placeholder for gradient support on strokes
            const msg = document.createElement('div');
            msg.textContent = 'Gradient stroke support coming soon.';
            msg.style.fontSize = '11px';
            msg.style.color = 'var(--text-tertiary)';
            msg.style.padding = '12px 0';
            container.appendChild(msg);
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

