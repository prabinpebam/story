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
            icon: Icons.UNDERLINE, // Need to ensure this icon exists
            title: 'Underline',
            onClick: () => this.updateProp('textDecoration', this.currentProps.textDecoration === 'underline' ? 'none' : 'underline')
        });
        if (this.currentProps.textDecoration === 'underline') underlineBtn.element.classList.add('active');

        const strikeBtn = new IconButton({
            icon: Icons.STRIKETHROUGH, // Need to ensure this icon exists
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
        const cases = [
            { label: 'Aa', value: 'none', title: 'Normal' },
            { label: 'AA', value: 'uppercase', title: 'Uppercase' },
            { label: 'aa', value: 'lowercase', title: 'Lowercase' },
            { label: 'A a', value: 'capitalize', title: 'Capitalize' }
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
            
            btn.onclick = () => this.updateProp('textTransform', c.value);
            row2.appendChild(btn);
        });
        container.appendChild(row2);

        // Paragraph Spacing
        const pSpacingRow = this.createLabelRow('Paragraph Spacing');
        const pSpacingInput = new NumberInput({
            value: this.currentProps.paragraphSpacing || 0,
            onChange: (val) => this.updateProp('paragraphSpacing', val)
        });
        pSpacingRow.appendChild(pSpacingInput.element);
        container.appendChild(pSpacingRow);

        // Paragraph Indentation
        const pIndentRow = this.createLabelRow('Paragraph Indentation');
        const pIndentInput = new NumberInput({
            value: this.currentProps.paragraphIndent || 0,
            onChange: (val) => this.updateProp('paragraphIndent', val)
        });
        pIndentRow.appendChild(pIndentInput.element);
        container.appendChild(pIndentRow);
    }

    renderDetails(container) {
        container.textContent = 'Advanced OpenType features coming soon.';
        container.style.color = '#888';
        container.style.fontSize = '11px';
        container.style.padding = '12px';
    }

    renderVariable(container) {
        container.textContent = 'Variable font axes coming soon.';
        container.style.color = '#888';
        container.style.fontSize = '11px';
        container.style.padding = '12px';
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
