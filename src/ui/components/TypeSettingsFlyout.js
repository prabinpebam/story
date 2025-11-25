import { Flyout } from './Flyout.js';
import { IconButton } from './IconButton.js';
import { NumberInput } from './NumberInput.js';
import { Dropdown } from './Dropdown.js';
import { Switch } from './Switch.js';
import { Icons } from '../Icons.js';

export class TypeSettingsFlyout extends Flyout {
    constructor(options = {}) {
        super(options);
        
        this.element.className = 'type-settings-flyout ui-flyout';
        this.element.style.width = '280px';
        this.element.style.backgroundColor = '#2C2C2C';
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.gap = '12px';
        
        this.activeTab = 'basics';
        this.onChange = options.onChange || (() => {});
        this.currentProps = options.props || {};

        // Prevent clicks from closing
        this.element.addEventListener('mousedown', (e) => e.stopPropagation());

        this.render();
    }

    render() {
        this.element.innerHTML = '';
        
        // 1. Tabs
        const tabs = document.createElement('div');
        tabs.style.display = 'flex';
        tabs.style.borderBottom = '1px solid #444';
        tabs.style.marginBottom = '8px';
        
        ['Basics', 'Details', 'Variable'].forEach(tabName => {
            const key = tabName.toLowerCase();
            const tab = document.createElement('div');
            tab.textContent = tabName;
            tab.style.flex = '1';
            tab.style.textAlign = 'center';
            tab.style.padding = '8px 0';
            tab.style.fontSize = '12px';
            tab.style.cursor = 'pointer';
            tab.style.color = this.activeTab === key ? '#FFFFFF' : '#888888';
            tab.style.borderBottom = this.activeTab === key ? '2px solid #FFFFFF' : '2px solid transparent';
            
            tab.onclick = () => {
                this.activeTab = key;
                this.render();
            };
            
            tabs.appendChild(tab);
        });
        
        this.element.appendChild(tabs);

        // 2. Content
        const content = document.createElement('div');
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.gap = '16px';
        
        if (this.activeTab === 'basics') {
            this.renderBasics(content);
        } else if (this.activeTab === 'details') {
            this.renderDetails(content);
        } else if (this.activeTab === 'variable') {
            this.renderVariable(content);
        }
        
        this.element.appendChild(content);
    }

    renderBasics(container) {
        // Alignment & Decoration Row
        const row1 = this.createRow();
        
        // Justify
        const justifyBtn = new IconButton({
            icon: Icons.ALIGN_JUSTIFY,
            title: 'Justify',
            onClick: () => this.updateProp('textAlign', 'justify')
        });
        if (this.currentProps.textAlign === 'justify') justifyBtn.element.classList.add('active');
        
        // Decoration (Underline, Strikethrough)
        const underlineBtn = new IconButton({
            icon: Icons.UNDERLINE,
            title: 'Underline',
            onClick: () => this.updateProp('textDecoration', this.currentProps.textDecoration === 'underline' ? 'none' : 'underline')
        });
        if (this.currentProps.textDecoration === 'underline') underlineBtn.element.classList.add('active');

        const strikeBtn = new IconButton({
            icon: Icons.STRIKETHROUGH,
            title: 'Strikethrough',
            onClick: () => this.updateProp('textDecoration', this.currentProps.textDecoration === 'line-through' ? 'none' : 'line-through')
        });
        if (this.currentProps.textDecoration === 'line-through') strikeBtn.element.classList.add('active');

        row1.appendChild(justifyBtn.element);
        row1.appendChild(this.createSeparator());
        row1.appendChild(underlineBtn.element);
        row1.appendChild(strikeBtn.element);
        container.appendChild(row1);

        // Case Row
        const row2 = this.createRow();
        const caseLabel = document.createElement('span');
        caseLabel.textContent = 'Case';
        caseLabel.style.fontSize = '11px';
        caseLabel.style.color = '#888';
        caseLabel.style.marginRight = '8px';
        caseLabel.style.minWidth = '30px';
        row2.appendChild(caseLabel);
        
        const cases = [
            { label: 'Aa', value: 'none', title: 'Normal' },
            { label: 'AA', value: 'uppercase', title: 'Uppercase' },
            { label: 'aa', value: 'lowercase', title: 'Lowercase' },
            { label: 'Aa', value: 'capitalize', title: 'Capitalize', style: 'font-variant: normal' },
            { label: 'ᴀᴀ', value: 'small-caps', title: 'Small Caps' }
        ];
        
        cases.forEach(c => {
            const btn = document.createElement('div');
            btn.textContent = c.label;
            btn.title = c.title;
            btn.style.padding = '4px 8px';
            btn.style.fontSize = '11px';
            btn.style.cursor = 'pointer';
            btn.style.borderRadius = '4px';
            btn.style.color = this.currentProps.textTransform === c.value ? '#FFF' : '#888';
            btn.style.backgroundColor = this.currentProps.textTransform === c.value ? '#444' : 'transparent';
            if (c.value === 'small-caps') {
                btn.style.fontVariant = 'small-caps';
            }
            
            btn.onclick = () => this.updateProp('textTransform', c.value);
            row2.appendChild(btn);
        });
        container.appendChild(row2);

        // Paragraph Spacing
        const pSpacingRow = this.createLabelRow('Paragraph Spacing');
        const pSpacingInput = new NumberInput({
            value: this.currentProps.paragraphSpacing || 0,
            scrubbable: true,
            onChange: (val) => this.updateProp('paragraphSpacing', val)
        });
        pSpacingRow.appendChild(pSpacingInput.element);
        container.appendChild(pSpacingRow);

        // Paragraph Indentation
        const pIndentRow = this.createLabelRow('Paragraph Indentation');
        const pIndentInput = new NumberInput({
            value: this.currentProps.paragraphIndent || 0,
            scrubbable: true,
            onChange: (val) => this.updateProp('paragraphIndent', val)
        });
        pIndentRow.appendChild(pIndentInput.element);
        container.appendChild(pIndentRow);

        // Vertical Trim
        const vTrimRow = this.createLabelRow('Vertical Trim');
        const vTrimDropdown = new Dropdown({
            options: [
                { label: 'Standard', value: 'standard' },
                { label: 'Cap Height', value: 'capHeight' }
            ],
            value: this.currentProps.verticalTrim || 'standard',
            onChange: (val) => this.updateProp('verticalTrim', val)
        });
        vTrimDropdown.element.style.width = '100px';
        vTrimRow.appendChild(vTrimDropdown.element);
        container.appendChild(vTrimRow);

        // Lists
        const listRow = this.createLabelRow('Lists');
        const listControls = document.createElement('div');
        listControls.style.display = 'flex';
        listControls.style.gap = '4px';

        const listNoneBtn = new IconButton({
            icon: Icons.CLOSE, // Using Close as "None"
            title: 'No List',
            onClick: () => this.updateProp('listStyle', 'none')
        });
        if (!this.currentProps.listStyle || this.currentProps.listStyle === 'none') listNoneBtn.element.classList.add('active');

        const listBulletBtn = new IconButton({
            icon: Icons.LIST_BULLET,
            title: 'Bullet List',
            onClick: () => this.updateProp('listStyle', 'bullet')
        });
        if (this.currentProps.listStyle === 'bullet') listBulletBtn.element.classList.add('active');

        const listNumberBtn = new IconButton({
            icon: Icons.LIST_NUMBERED,
            title: 'Numbered List',
            onClick: () => this.updateProp('listStyle', 'numbered')
        });
        if (this.currentProps.listStyle === 'numbered') listNumberBtn.element.classList.add('active');

        listControls.appendChild(listNoneBtn.element);
        listControls.appendChild(listBulletBtn.element);
        listControls.appendChild(listNumberBtn.element);
        listRow.appendChild(listControls);
        container.appendChild(listRow);

        // List Spacing (only if list is active)
        if (this.currentProps.listStyle && this.currentProps.listStyle !== 'none') {
            const listSpacingRow = this.createLabelRow('List Spacing');
            const listSpacingInput = new NumberInput({
                value: this.currentProps.listSpacing || 0,
                scrubbable: true,
                onChange: (val) => this.updateProp('listSpacing', val)
            });
            listSpacingRow.appendChild(listSpacingInput.element);
            container.appendChild(listSpacingRow);
        }

        // Truncation
        const truncRow = this.createLabelRow('Truncate text');
        const truncSwitch = new Switch({
            checked: this.currentProps.truncate || false,
            onChange: (val) => this.updateProp('truncate', val)
        });
        truncRow.appendChild(truncSwitch.element);
        container.appendChild(truncRow);

        // Max Lines (only if truncation is active)
        if (this.currentProps.truncate) {
            const maxLinesRow = this.createLabelRow('Max Lines');
            const maxLinesInput = new NumberInput({
                value: this.currentProps.maxLines || 1,
                min: 1,
                scrubbable: true,
                onChange: (val) => this.updateProp('maxLines', val)
            });
            maxLinesRow.appendChild(maxLinesInput.element);
            container.appendChild(maxLinesRow);
        }
    }

    renderDetails(container) {
        // Initialize opentype features if not present
        if (!this.currentProps.opentypeFeatures) {
            this.currentProps.opentypeFeatures = {};
        }

        // Section: Numerals
        const numeralsSection = this.createSectionHeader('Numerals');
        container.appendChild(numeralsSection);

        // Figure Style
        const figureStyleRow = this.createLabelRow('Figure Style');
        const figureStyleDropdown = new Dropdown({
            options: [
                { label: 'Default', value: 'default' },
                { label: 'Lining', value: 'lnum' },
                { label: 'Old Style', value: 'onum' }
            ],
            value: this.currentProps.opentypeFeatures.figureStyle || 'default',
            onChange: (val) => this.updateOpenType('figureStyle', val)
        });
        figureStyleDropdown.element.style.width = '100px';
        figureStyleRow.appendChild(figureStyleDropdown.element);
        container.appendChild(figureStyleRow);

        // Figure Spacing
        const figureSpacingRow = this.createLabelRow('Figure Spacing');
        const figureSpacingDropdown = new Dropdown({
            options: [
                { label: 'Default', value: 'default' },
                { label: 'Proportional', value: 'pnum' },
                { label: 'Tabular', value: 'tnum' }
            ],
            value: this.currentProps.opentypeFeatures.figureSpacing || 'default',
            onChange: (val) => this.updateOpenType('figureSpacing', val)
        });
        figureSpacingDropdown.element.style.width = '100px';
        figureSpacingRow.appendChild(figureSpacingDropdown.element);
        container.appendChild(figureSpacingRow);

        // Fractions
        const fractionsRow = this.createLabelRow('Fractions');
        const fractionsDropdown = new Dropdown({
            options: [
                { label: 'Off', value: 'off' },
                { label: 'Diagonal', value: 'frac' },
                { label: 'Stacked', value: 'afrc' }
            ],
            value: this.currentProps.opentypeFeatures.fractions || 'off',
            onChange: (val) => this.updateOpenType('fractions', val)
        });
        fractionsDropdown.element.style.width = '100px';
        fractionsRow.appendChild(fractionsDropdown.element);
        container.appendChild(fractionsRow);

        // Section: Ligatures
        const ligaturesSection = this.createSectionHeader('Ligatures');
        container.appendChild(ligaturesSection);

        // Standard Ligatures
        const ligaRow = this.createLabelRow('Standard (fi, fl)');
        const ligaSwitch = new Switch({
            checked: this.currentProps.opentypeFeatures.liga !== false, // Default on
            onChange: (val) => this.updateOpenType('liga', val)
        });
        ligaRow.appendChild(ligaSwitch.element);
        container.appendChild(ligaRow);

        // Discretionary Ligatures
        const dligRow = this.createLabelRow('Discretionary');
        const dligSwitch = new Switch({
            checked: this.currentProps.opentypeFeatures.dlig === true,
            onChange: (val) => this.updateOpenType('dlig', val)
        });
        dligRow.appendChild(dligSwitch.element);
        container.appendChild(dligRow);

        // Contextual Alternates
        const caltRow = this.createLabelRow('Contextual Alternates');
        const caltSwitch = new Switch({
            checked: this.currentProps.opentypeFeatures.calt !== false, // Default on
            onChange: (val) => this.updateOpenType('calt', val)
        });
        caltRow.appendChild(caltSwitch.element);
        container.appendChild(caltRow);

        // Section: Stylistic Sets
        const stylisticSection = this.createSectionHeader('Stylistic Sets');
        container.appendChild(stylisticSection);

        // Stylistic Sets (ss01-ss20 are common)
        const ssRow = this.createLabelRow('Set Number');
        const ssInput = new NumberInput({
            value: this.currentProps.opentypeFeatures.stylisticSet || 0,
            min: 0,
            max: 20,
            step: 1,
            onChange: (val) => this.updateOpenType('stylisticSet', val)
        });
        ssInput.element.style.width = '60px';
        ssRow.appendChild(ssInput.element);
        
        const ssHint = document.createElement('span');
        ssHint.textContent = '(0 = off)';
        ssHint.style.fontSize = '10px';
        ssHint.style.color = '#666';
        ssHint.style.marginLeft = '8px';
        ssRow.appendChild(ssHint);
        container.appendChild(ssRow);

        // Section: Position
        const positionSection = this.createSectionHeader('Position');
        container.appendChild(positionSection);

        const positionRow = this.createLabelRow('Vertical Position');
        const positionDropdown = new Dropdown({
            options: [
                { label: 'Normal', value: 'normal' },
                { label: 'Superscript', value: 'sups' },
                { label: 'Subscript', value: 'subs' },
                { label: 'Ordinal', value: 'ordn' }
            ],
            value: this.currentProps.opentypeFeatures.position || 'normal',
            onChange: (val) => this.updateOpenType('position', val)
        });
        positionDropdown.element.style.width = '100px';
        positionRow.appendChild(positionDropdown.element);
        container.appendChild(positionRow);
    }

    updateOpenType(feature, value) {
        const features = { ...this.currentProps.opentypeFeatures, [feature]: value };
        this.currentProps.opentypeFeatures = features;
        this.onChange({ opentypeFeatures: features });
    }

    createSectionHeader(title) {
        const header = document.createElement('div');
        header.textContent = title;
        header.style.fontSize = '11px';
        header.style.fontWeight = '600';
        header.style.color = '#AAA';
        header.style.marginTop = '12px';
        header.style.marginBottom = '8px';
        header.style.borderBottom = '1px solid #444';
        header.style.paddingBottom = '4px';
        return header;
    }

    renderVariable(container) {
        // Initialize variable font settings if not present
        if (!this.currentProps.variableAxes) {
            this.currentProps.variableAxes = {};
        }

        // Info text
        const infoText = document.createElement('div');
        infoText.style.fontSize = '11px';
        infoText.style.color = '#888';
        infoText.style.marginBottom = '12px';
        infoText.style.lineHeight = '1.4';
        infoText.textContent = 'Variable fonts allow fine-tuning of weight, width, and other axes. Controls below work with fonts that support these features.';
        container.appendChild(infoText);

        // Weight axis (wght) - most common
        const weightRow = this.createLabelRow('Weight');
        const weightSlider = this.createSlider({
            min: 100,
            max: 900,
            value: this.currentProps.variableAxes.wght || 400,
            onChange: (val) => this.updateVariableAxis('wght', val)
        });
        weightRow.appendChild(weightSlider);
        container.appendChild(weightRow);

        // Width axis (wdth)
        const widthRow = this.createLabelRow('Width');
        const widthSlider = this.createSlider({
            min: 50,
            max: 200,
            value: this.currentProps.variableAxes.wdth || 100,
            onChange: (val) => this.updateVariableAxis('wdth', val)
        });
        widthRow.appendChild(widthSlider);
        container.appendChild(widthRow);

        // Slant axis (slnt)
        const slantRow = this.createLabelRow('Slant');
        const slantSlider = this.createSlider({
            min: -15,
            max: 0,
            value: this.currentProps.variableAxes.slnt || 0,
            onChange: (val) => this.updateVariableAxis('slnt', val)
        });
        slantRow.appendChild(slantSlider);
        container.appendChild(slantRow);

        // Italic axis (ital)
        const italicRow = this.createLabelRow('Italic');
        const italicSlider = this.createSlider({
            min: 0,
            max: 1,
            step: 0.1,
            value: this.currentProps.variableAxes.ital || 0,
            onChange: (val) => this.updateVariableAxis('ital', val)
        });
        italicRow.appendChild(italicSlider);
        container.appendChild(italicRow);

        // Optical Size (opsz)
        const opszRow = this.createLabelRow('Optical Size');
        const opszSlider = this.createSlider({
            min: 8,
            max: 144,
            value: this.currentProps.variableAxes.opsz || 14,
            onChange: (val) => this.updateVariableAxis('opsz', val)
        });
        opszRow.appendChild(opszSlider);
        container.appendChild(opszRow);

        // Grade (GRAD) - some fonts support this
        const gradeRow = this.createLabelRow('Grade');
        const gradeSlider = this.createSlider({
            min: -200,
            max: 150,
            value: this.currentProps.variableAxes.GRAD || 0,
            onChange: (val) => this.updateVariableAxis('GRAD', val)
        });
        gradeRow.appendChild(gradeSlider);
        container.appendChild(gradeRow);

        // Reset button
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset to Defaults';
        resetBtn.style.marginTop = '16px';
        resetBtn.style.padding = '6px 12px';
        resetBtn.style.fontSize = '11px';
        resetBtn.style.border = '1px solid #555';
        resetBtn.style.borderRadius = '4px';
        resetBtn.style.background = 'transparent';
        resetBtn.style.color = '#AAA';
        resetBtn.style.cursor = 'pointer';
        resetBtn.style.width = '100%';
        resetBtn.onmouseenter = () => resetBtn.style.backgroundColor = '#444';
        resetBtn.onmouseleave = () => resetBtn.style.backgroundColor = 'transparent';
        resetBtn.onclick = () => {
            this.currentProps.variableAxes = {};
            this.onChange({ variableAxes: {} });
            this.render();
        };
        container.appendChild(resetBtn);
    }

    createSlider({ min, max, value, step = 1, onChange }) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '8px';
        wrapper.style.flex = '1';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        slider.style.flex = '1';
        slider.style.accentColor = 'var(--color-accent, #18A0FB)';
        slider.style.height = '4px';

        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = value;
        valueDisplay.style.fontSize = '11px';
        valueDisplay.style.color = '#AAA';
        valueDisplay.style.minWidth = '35px';
        valueDisplay.style.textAlign = 'right';

        slider.oninput = (e) => {
            const val = parseFloat(e.target.value);
            valueDisplay.textContent = val;
            onChange(val);
        };

        wrapper.appendChild(slider);
        wrapper.appendChild(valueDisplay);
        return wrapper;
    }

    updateVariableAxis(axis, value) {
        const axes = { ...this.currentProps.variableAxes, [axis]: value };
        this.currentProps.variableAxes = axes;
        this.onChange({ variableAxes: axes });
    }

    createRow() {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '4px';
        return div;
    }

    createLabelRow(label) {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        
        const span = document.createElement('span');
        span.textContent = label;
        span.style.fontSize = '11px';
        span.style.color = '#888';
        
        div.appendChild(span);
        return div;
    }

    createSeparator() {
        const div = document.createElement('div');
        div.style.width = '1px';
        div.style.height = '16px';
        div.style.backgroundColor = '#444';
        div.style.margin = '0 4px';
        return div;
    }

    updateProp(prop, value) {
        this.currentProps = { ...this.currentProps, [prop]: value };
        this.onChange({ [prop]: value });
        this.render();
    }
}
