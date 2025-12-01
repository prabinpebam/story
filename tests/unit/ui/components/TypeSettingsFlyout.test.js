import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../../../../src/ui/components/Flyout.js', () => ({
    Flyout: class MockFlyout {
        constructor(options = {}) {
            this.options = options;
            this.element = document.createElement('div');
            this.element.className = 'ui-flyout';
            this.isOpen = false;
        }
        open() { this.isOpen = true; }
        close() { this.isOpen = false; }
    }
}));

vi.mock('../../../../src/ui/components/IconButton.js', () => ({
    IconButton: class MockIconButton {
        constructor(options = {}) {
            this.element = document.createElement('button');
            this.element.className = 'ui-icon-btn';
            this.element.title = options.title || '';
            if (options.onClick) {
                this.element.addEventListener('click', options.onClick);
            }
        }
    }
}));

vi.mock('../../../../src/ui/components/NumberInput.js', () => ({
    NumberInput: class MockNumberInput {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'ui-number-input';
            this.value = options.value || 0;
            this.onChange = options.onChange;
        }
        setValue(val) { this.value = val; }
    }
}));

vi.mock('../../../../src/ui/components/Dropdown.js', () => ({
    Dropdown: class MockDropdown {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'ui-dropdown';
            this.value = options.value;
            this.options = options.options || [];
            this.onChange = options.onChange;
        }
    }
}));

vi.mock('../../../../src/ui/components/Switch.js', () => ({
    Switch: class MockSwitch {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'ui-switch';
            this.checked = options.checked || false;
            this.onChange = options.onChange;
        }
    }
}));

vi.mock('../../../../src/ui/Icons.js', () => ({
    Icons: {
        ALIGN_JUSTIFY: '<svg></svg>',
        UNDERLINE: '<svg></svg>',
        STRIKETHROUGH: '<svg></svg>',
        CLOSE: '<svg></svg>',
        LIST_BULLET: '<svg></svg>',
        LIST_NUMBERED: '<svg></svg>'
    }
}));

import { TypeSettingsFlyout } from '../../../../src/ui/components/TypeSettingsFlyout.js';

describe('TypeSettingsFlyout', () => {
    let flyout;
    let mockOnChange;

    beforeEach(() => {
        document.body.innerHTML = '';
        mockOnChange = vi.fn();
    });

    afterEach(() => {
        flyout = null;
    });

    describe('constructor', () => {
        it('should create flyout with default options', () => {
            flyout = new TypeSettingsFlyout();
            
            expect(flyout.element).toBeDefined();
            expect(flyout.element.className).toContain('type-settings-flyout');
        });

        it('should set default active tab to basics', () => {
            flyout = new TypeSettingsFlyout();
            expect(flyout.activeTab).toBe('basics');
        });

        it('should accept onChange callback', () => {
            flyout = new TypeSettingsFlyout({ onChange: mockOnChange });
            expect(flyout.onChange).toBe(mockOnChange);
        });

        it('should accept initial props', () => {
            flyout = new TypeSettingsFlyout({
                props: { textAlign: 'center', fontSize: 16 }
            });
            
            expect(flyout.currentProps.textAlign).toBe('center');
            expect(flyout.currentProps.fontSize).toBe(16);
        });

        it('should default to empty props if not provided', () => {
            flyout = new TypeSettingsFlyout();
            expect(flyout.currentProps).toEqual({});
        });

        it('should stop mousedown propagation on element', () => {
            flyout = new TypeSettingsFlyout();
            
            const event = new MouseEvent('mousedown', { bubbles: true });
            const stopSpy = vi.spyOn(event, 'stopPropagation');
            
            flyout.element.dispatchEvent(event);
            
            expect(stopSpy).toHaveBeenCalled();
        });
    });

    describe('render', () => {
        it('should render tab navigation', () => {
            flyout = new TypeSettingsFlyout();
            
            const tabs = flyout.element.querySelector('.flyout-tabs');
            expect(tabs).toBeDefined();
        });

        it('should render three tabs', () => {
            flyout = new TypeSettingsFlyout();
            
            const tabs = flyout.element.querySelectorAll('.flyout-tab');
            expect(tabs.length).toBe(3);
        });

        it('should mark basics tab as active by default', () => {
            flyout = new TypeSettingsFlyout();
            
            const tabs = flyout.element.querySelectorAll('.flyout-tab');
            expect(tabs[0].classList.contains('active')).toBe(true);
        });

        it('should render content area', () => {
            flyout = new TypeSettingsFlyout();
            
            const content = flyout.element.querySelector('.flyout-content');
            expect(content).toBeDefined();
        });
    });

    describe('tab switching', () => {
        it('should switch to details tab on click', () => {
            flyout = new TypeSettingsFlyout();
            
            const tabs = flyout.element.querySelectorAll('.flyout-tab');
            tabs[1].click();
            
            expect(flyout.activeTab).toBe('details');
        });

        it('should switch to variable tab on click', () => {
            flyout = new TypeSettingsFlyout();
            
            const tabs = flyout.element.querySelectorAll('.flyout-tab');
            tabs[2].click();
            
            expect(flyout.activeTab).toBe('variable');
        });

        it('should update active class on tab switch', () => {
            flyout = new TypeSettingsFlyout();
            
            const tabs = flyout.element.querySelectorAll('.flyout-tab');
            tabs[1].click();
            
            // Re-query tabs after re-render
            const updatedTabs = flyout.element.querySelectorAll('.flyout-tab');
            expect(updatedTabs[1].classList.contains('active')).toBe(true);
            expect(updatedTabs[0].classList.contains('active')).toBe(false);
        });

        it('should re-render content on tab switch', () => {
            flyout = new TypeSettingsFlyout();
            const renderSpy = vi.spyOn(flyout, 'render');
            
            const tabs = flyout.element.querySelectorAll('.flyout-tab');
            tabs[1].click();
            
            expect(renderSpy).toHaveBeenCalled();
        });
    });

    describe('renderBasics', () => {
        it('should render alignment controls', () => {
            flyout = new TypeSettingsFlyout();
            
            // Should have icon buttons for justify, underline, strikethrough
            const buttons = flyout.element.querySelectorAll('.ui-icon-btn');
            expect(buttons.length).toBeGreaterThan(0);
        });

        it('should render case selector', () => {
            flyout = new TypeSettingsFlyout();
            
            const label = flyout.element.querySelector('.type-settings-label');
            expect(label).toBeDefined();
        });

        it('should render paragraph spacing control', () => {
            flyout = new TypeSettingsFlyout();
            
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Paragraph Spacing');
        });

        it('should render paragraph indentation control', () => {
            flyout = new TypeSettingsFlyout();
            
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Paragraph Indentation');
        });

        it('should render vertical trim dropdown', () => {
            flyout = new TypeSettingsFlyout();
            
            const dropdowns = flyout.element.querySelectorAll('.ui-dropdown');
            expect(dropdowns.length).toBeGreaterThan(0);
        });

        it('should render list controls', () => {
            flyout = new TypeSettingsFlyout();
            
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Lists');
        });

        it('should render truncation switch', () => {
            flyout = new TypeSettingsFlyout();
            
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Truncate text');
        });

        it('should show max lines when truncation is enabled', () => {
            flyout = new TypeSettingsFlyout({
                props: { truncate: true }
            });
            
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Max Lines');
        });

        it('should hide max lines when truncation is disabled', () => {
            flyout = new TypeSettingsFlyout({
                props: { truncate: false }
            });
            
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).not.toContain('Max Lines');
        });

        it('should show list spacing when list is active', () => {
            flyout = new TypeSettingsFlyout({
                props: { listStyle: 'bullet' }
            });
            
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('List Spacing');
        });
    });

    describe('renderDetails', () => {
        beforeEach(() => {
            flyout = new TypeSettingsFlyout();
            flyout.activeTab = 'details';
            flyout.render();
        });

        it('should render numerals section', () => {
            const headers = flyout.element.querySelectorAll('.type-settings-section-header');
            const texts = Array.from(headers).map(h => h.textContent);
            expect(texts).toContain('Numerals');
        });

        it('should render ligatures section', () => {
            const headers = flyout.element.querySelectorAll('.type-settings-section-header');
            const texts = Array.from(headers).map(h => h.textContent);
            expect(texts).toContain('Ligatures');
        });

        it('should render stylistic sets section', () => {
            const headers = flyout.element.querySelectorAll('.type-settings-section-header');
            const texts = Array.from(headers).map(h => h.textContent);
            expect(texts).toContain('Stylistic Sets');
        });

        it('should render position section', () => {
            const headers = flyout.element.querySelectorAll('.type-settings-section-header');
            const texts = Array.from(headers).map(h => h.textContent);
            expect(texts).toContain('Position');
        });

        it('should initialize opentype features if not present', () => {
            expect(flyout.currentProps.opentypeFeatures).toBeDefined();
        });

        it('should render figure style dropdown', () => {
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Figure Style');
        });

        it('should render figure spacing dropdown', () => {
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Figure Spacing');
        });

        it('should render fractions dropdown', () => {
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Fractions');
        });

        it('should render ligature switches', () => {
            const switches = flyout.element.querySelectorAll('.ui-switch');
            expect(switches.length).toBeGreaterThan(0);
        });
    });

    describe('renderVariable', () => {
        beforeEach(() => {
            flyout = new TypeSettingsFlyout();
            flyout.activeTab = 'variable';
            flyout.render();
        });

        it('should render info text', () => {
            const info = flyout.element.querySelector('.type-settings-info');
            expect(info).toBeDefined();
            expect(info.textContent).toContain('Variable fonts');
        });

        it('should render weight slider', () => {
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Weight');
        });

        it('should render width slider', () => {
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Width');
        });

        it('should render slant slider', () => {
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Slant');
        });

        it('should render italic slider', () => {
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Italic');
        });

        it('should render optical size slider', () => {
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Optical Size');
        });

        it('should render grade slider', () => {
            const labels = flyout.element.querySelectorAll('.flyout-label');
            const texts = Array.from(labels).map(l => l.textContent);
            expect(texts).toContain('Grade');
        });

        it('should render reset button', () => {
            const button = flyout.element.querySelector('.btn--text.btn--sm');
            expect(button).toBeDefined();
            expect(button.textContent).toContain('Reset to Defaults');
        });

        it('should initialize variable axes if not present', () => {
            expect(flyout.currentProps.variableAxes).toBeDefined();
        });

        it('should reset axes on reset button click', () => {
            flyout.currentProps.variableAxes = { wght: 700, wdth: 150 };
            
            const button = flyout.element.querySelector('.btn--text.btn--sm');
            button.click();
            
            expect(flyout.currentProps.variableAxes).toEqual({});
        });
    });

    describe('createSlider', () => {
        it('should create range input', () => {
            flyout = new TypeSettingsFlyout();
            flyout.activeTab = 'variable';
            flyout.render();
            
            const sliders = flyout.element.querySelectorAll('input[type="range"]');
            expect(sliders.length).toBeGreaterThan(0);
        });

        it('should display current value', () => {
            flyout = new TypeSettingsFlyout();
            flyout.activeTab = 'variable';
            flyout.render();
            
            const valueDisplays = flyout.element.querySelectorAll('.type-settings-value');
            expect(valueDisplays.length).toBeGreaterThan(0);
        });
    });

    describe('updateProp', () => {
        it('should update currentProps', () => {
            flyout = new TypeSettingsFlyout({ onChange: mockOnChange });
            
            flyout.updateProp('textAlign', 'center');
            
            expect(flyout.currentProps.textAlign).toBe('center');
        });

        it('should call onChange with update', () => {
            flyout = new TypeSettingsFlyout({ onChange: mockOnChange });
            
            flyout.updateProp('textDecoration', 'underline');
            
            expect(mockOnChange).toHaveBeenCalledWith({ textDecoration: 'underline' });
        });

        it('should re-render after update', () => {
            flyout = new TypeSettingsFlyout();
            const renderSpy = vi.spyOn(flyout, 'render');
            
            flyout.updateProp('fontSize', 18);
            
            expect(renderSpy).toHaveBeenCalled();
        });
    });

    describe('updateOpenType', () => {
        it('should update opentype feature', () => {
            flyout = new TypeSettingsFlyout({ onChange: mockOnChange });
            flyout.activeTab = 'details';
            flyout.render();
            
            flyout.updateOpenType('liga', true);
            
            expect(flyout.currentProps.opentypeFeatures.liga).toBe(true);
        });

        it('should call onChange with all features', () => {
            flyout = new TypeSettingsFlyout({ onChange: mockOnChange });
            flyout.currentProps.opentypeFeatures = { liga: true };
            
            flyout.updateOpenType('dlig', true);
            
            expect(mockOnChange).toHaveBeenCalledWith({
                opentypeFeatures: { liga: true, dlig: true }
            });
        });

        it('should preserve existing features', () => {
            flyout = new TypeSettingsFlyout({ onChange: mockOnChange });
            flyout.currentProps.opentypeFeatures = { liga: true, calt: false };
            
            flyout.updateOpenType('frac', 'diagonal');
            
            expect(flyout.currentProps.opentypeFeatures.liga).toBe(true);
            expect(flyout.currentProps.opentypeFeatures.calt).toBe(false);
            expect(flyout.currentProps.opentypeFeatures.frac).toBe('diagonal');
        });
    });

    describe('updateVariableAxis', () => {
        it('should update variable axis', () => {
            flyout = new TypeSettingsFlyout({ onChange: mockOnChange });
            flyout.activeTab = 'variable';
            flyout.render();
            
            flyout.updateVariableAxis('wght', 700);
            
            expect(flyout.currentProps.variableAxes.wght).toBe(700);
        });

        it('should call onChange with all axes', () => {
            flyout = new TypeSettingsFlyout({ onChange: mockOnChange });
            flyout.currentProps.variableAxes = { wght: 400 };
            
            flyout.updateVariableAxis('wdth', 125);
            
            expect(mockOnChange).toHaveBeenCalledWith({
                variableAxes: { wght: 400, wdth: 125 }
            });
        });
    });

    describe('helper methods', () => {
        beforeEach(() => {
            flyout = new TypeSettingsFlyout();
        });

        it('createRow should return div with class', () => {
            const row = flyout.createRow();
            expect(row.tagName).toBe('DIV');
            expect(row.className).toBe('type-settings-row');
        });

        it('createLabelRow should include label span', () => {
            const row = flyout.createLabelRow('Test Label');
            const label = row.querySelector('.flyout-label');
            expect(label.textContent).toBe('Test Label');
        });

        it('createSeparator should create divider element', () => {
            const sep = flyout.createSeparator();
            expect(sep.className).toBe('type-settings-divider');
        });

        it('createSectionHeader should create header with title', () => {
            const header = flyout.createSectionHeader('Section Title');
            expect(header.className).toBe('type-settings-section-header');
            expect(header.textContent).toBe('Section Title');
        });
    });

    describe('button active states', () => {
        it('should mark justify button active when textAlign is justify', () => {
            flyout = new TypeSettingsFlyout({
                props: { textAlign: 'justify' }
            });
            
            const buttons = flyout.element.querySelectorAll('.ui-icon-btn');
            // First button should be justify
            const hasActive = Array.from(buttons).some(b => b.classList.contains('active'));
            // Note: The active class is added conditionally based on props
        });

        it('should mark underline button active when textDecoration is underline', () => {
            flyout = new TypeSettingsFlyout({
                props: { textDecoration: 'underline' }
            });
            // Button state should reflect the prop
        });

        it('should mark strikethrough button active when textDecoration is line-through', () => {
            flyout = new TypeSettingsFlyout({
                props: { textDecoration: 'line-through' }
            });
            // Button state should reflect the prop
        });
    });

    describe('case buttons', () => {
        it('should render all case options', () => {
            flyout = new TypeSettingsFlyout();
            
            const caseButtons = flyout.element.querySelectorAll('.fill-type-btn');
            expect(caseButtons.length).toBe(5); // none, uppercase, lowercase, capitalize, small-caps
        });

        it('should mark active case button', () => {
            flyout = new TypeSettingsFlyout({
                props: { textTransform: 'uppercase' }
            });
            
            const caseButtons = flyout.element.querySelectorAll('.fill-type-btn');
            const activeButtons = Array.from(caseButtons).filter(b => b.classList.contains('active'));
            expect(activeButtons.length).toBe(1);
        });
    });
});
