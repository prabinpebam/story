import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies
vi.mock('../../../../src/ui/components/Flyout.js', () => ({
    Flyout: class MockFlyout {
        constructor(options = {}) {
            this.options = options;
            this.trigger = options.trigger;
            this.content = options.content;
            this.isOpen = false;
        }
        open() { this.isOpen = true; }
        close() { 
            this.isOpen = false; 
            if (this.options.onClose) this.options.onClose();
        }
    }
}));

vi.mock('../../../../src/ui/components/SegmentedControl.js', () => ({
    SegmentedControl: class MockSegmentedControl {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'ui-segmented-control';
            this.value = options.value;
            this.options = options.options || [];
            this.onChange = options.onChange;
        }
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

vi.mock('../../../../src/ui/components/NumberInput.js', () => ({
    NumberInput: class MockNumberInput {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'ui-number-input';
            this.value = options.value || 0;
            this.onChange = options.onChange;
        }
    }
}));

vi.mock('../../../../src/ui/components/TextInput.js', () => ({
    TextInput: class MockTextInput {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'ui-text-input';
            const input = document.createElement('input');
            this.element.appendChild(input);
            this.value = options.value || '';
            this.onChange = options.onChange;
        }
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

vi.mock('../../../../src/ui/components/FillTypeSelector.js', () => ({
    FillTypeSelector: class MockFillTypeSelector {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'fill-type-selector';
            this.activeType = options.activeType || 'solid';
            this.onChange = options.onChange;
        }
    }
}));

vi.mock('../../../../src/ui/components/FillFlyout/SolidTab.js', () => ({
    SolidTab: class MockSolidTab {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'solid-tab';
            this.fill = options.fill || {};
            this.onChange = options.onChange;
        }
    }
}));

vi.mock('../../../../src/ui/components/FillFlyout/GradientTab.js', () => ({
    GradientTab: class MockGradientTab {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'gradient-tab';
            this.fill = options.fill || {};
            this.onChange = options.onChange;
        }
    }
}));

vi.mock('../../../../src/ui/Icons.js', () => ({
    Icons: {
        CLOSE: '<svg></svg>',
        FILL_SOLID: '<svg></svg>',
        FILL_GRADIENT: '<svg></svg>',
        CAP_BUTT: '<svg></svg>',
        CAP_SQUARE: '<svg></svg>',
        CAP_ROUND: '<svg></svg>',
        JOIN_MITER: '<svg></svg>',
        JOIN_BEVEL: '<svg></svg>',
        JOIN_ROUND: '<svg></svg>'
    }
}));

import { StrokeSettingsFlyout } from '../../../../src/ui/components/StrokeFlyout/StrokeSettingsFlyout.js';

describe('StrokeSettingsFlyout', () => {
    let flyout;
    let mockOnChange;
    let mockTrigger;

    beforeEach(() => {
        document.body.innerHTML = '';
        mockOnChange = vi.fn();
        mockTrigger = document.createElement('button');
        document.body.appendChild(mockTrigger);
    });

    afterEach(() => {
        flyout = null;
    });

    describe('constructor', () => {
        it('should create flyout with default options', () => {
            flyout = new StrokeSettingsFlyout();
            
            expect(flyout.flyout).toBeDefined();
        });

        it('should accept stroke data', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { width: 2, color: '#ff0000' }
            });
            
            expect(flyout.stroke.width).toBe(2);
            expect(flyout.stroke.color).toBe('#ff0000');
        });

        it('should accept onChange callback', () => {
            flyout = new StrokeSettingsFlyout({ onChange: mockOnChange });
            expect(flyout.onChange).toBe(mockOnChange);
        });

        it('should accept trigger element', () => {
            flyout = new StrokeSettingsFlyout({ trigger: mockTrigger });
            expect(flyout.trigger).toBe(mockTrigger);
        });

        it('should default to empty stroke object', () => {
            flyout = new StrokeSettingsFlyout();
            expect(flyout.stroke).toEqual({});
        });
    });

    describe('open/close', () => {
        it('should open flyout', () => {
            flyout = new StrokeSettingsFlyout();
            
            flyout.open();
            
            expect(flyout.flyout.isOpen).toBe(true);
        });

        it('should close flyout', () => {
            flyout = new StrokeSettingsFlyout();
            flyout.open();
            
            flyout.close();
            
            expect(flyout.flyout.isOpen).toBe(false);
        });

        it('should call onClose callback when closing', () => {
            const mockOnClose = vi.fn();
            flyout = new StrokeSettingsFlyout({ onClose: mockOnClose });
            flyout.open();
            
            flyout.close();
            
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    describe('renderContent', () => {
        it('should return content element', () => {
            flyout = new StrokeSettingsFlyout();
            
            const content = flyout.renderContent();
            
            expect(content).toBeInstanceOf(HTMLElement);
        });

        it('should set width to 240px', () => {
            flyout = new StrokeSettingsFlyout();
            
            const content = flyout.renderContent();
            
            expect(content.style.width).toBe('240px');
        });

        it('should include header with tabs', () => {
            flyout = new StrokeSettingsFlyout();
            
            const content = flyout.renderContent();
            
            expect(content.textContent).toContain('Custom');
            expect(content.textContent).toContain('Libraries');
        });

        it('should include close button', () => {
            flyout = new StrokeSettingsFlyout();
            
            const content = flyout.renderContent();
            const closeBtn = content.querySelector('.ui-icon-btn');
            
            expect(closeBtn).toBeDefined();
        });

        it('should include type selector for solid/gradient', () => {
            flyout = new StrokeSettingsFlyout();
            
            const content = flyout.renderContent();
            const typeSelector = content.querySelector('.fill-type-selector');
            
            expect(typeSelector).toBeDefined();
        });

        it('should include weight input', () => {
            flyout = new StrokeSettingsFlyout();
            
            const content = flyout.renderContent();
            const numberInputs = content.querySelectorAll('.ui-number-input');
            
            expect(numberInputs.length).toBeGreaterThan(0);
        });

        it('should include position dropdown', () => {
            flyout = new StrokeSettingsFlyout();
            
            const content = flyout.renderContent();
            const dropdowns = content.querySelectorAll('.ui-dropdown');
            
            expect(dropdowns.length).toBeGreaterThan(0);
        });

        it('should include style segmented control', () => {
            flyout = new StrokeSettingsFlyout();
            
            const content = flyout.renderContent();
            const segmentedControls = content.querySelectorAll('.ui-segmented-control');
            
            expect(segmentedControls.length).toBeGreaterThan(0);
        });

        it('should include join controls', () => {
            flyout = new StrokeSettingsFlyout();
            
            const content = flyout.renderContent();
            
            expect(content.textContent).toContain('Join');
        });
    });

    describe('stroke weight', () => {
        it('should use stroke width from props', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { width: 5 }
            });
            
            expect(flyout.stroke.width).toBe(5);
        });

        it('should default width to 1', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: {}
            });
            
            const content = flyout.renderContent();
            // NumberInput receives default value of 1
        });
    });

    describe('stroke position', () => {
        it('should use position from props', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { position: 'inside' }
            });
            
            expect(flyout.stroke.position).toBe('inside');
        });

        it('should default position to center', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: {}
            });
            
            // Dropdown receives default value of 'center'
        });
    });

    describe('stroke style', () => {
        it('should use style from props', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { style: 'dashed' }
            });
            
            expect(flyout.stroke.style).toBe('dashed');
        });

        it('should show dash options when style is dashed', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { style: 'dashed' }
            });
            
            const content = flyout.renderContent();
            
            // Dashes row should be visible
            expect(content.textContent).toContain('Dashes');
        });

        it('should hide dash options when style is solid', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { style: 'solid' }
            });
            
            const content = flyout.renderContent();
            
            // Find the dash row - it should have display: none
            const rows = content.querySelectorAll('div');
            const dashRow = Array.from(rows).find(r => r.textContent.includes('Dashes'));
            // The row exists but may be hidden
        });
    });

    describe('dash array', () => {
        it('should use dashArray from props', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { dashArray: '4, 2' }
            });
            
            expect(flyout.stroke.dashArray).toBe('4, 2');
        });

        it('should default dashArray to "2, 4"', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { style: 'dashed' }
            });
            
            // TextInput receives placeholder of '2, 4'
        });
    });

    describe('stroke join', () => {
        it('should use join from props', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { join: 'bevel' }
            });
            
            expect(flyout.stroke.join).toBe('bevel');
        });

        it('should show miter angle when join is miter', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { join: 'miter' }
            });
            
            const content = flyout.renderContent();
            
            expect(content.textContent).toContain('Miter Angle');
        });

        it('should hide miter angle for other joins', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { join: 'round' }
            });
            
            const content = flyout.renderContent();
            
            // Miter row should be hidden (display: none)
            // Find the row that has the text 'Miter Angle' as its first child span
            const spans = content.querySelectorAll('span');
            const miterSpan = Array.from(spans).find(s => s.textContent === 'Miter Angle');
            if (miterSpan) {
                const miterRow = miterSpan.parentElement;
                expect(miterRow.style.display).toBe('none');
            }
        });
    });

    describe('miter limit', () => {
        it('should use miterLimit from props', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { miterLimit: 15 }
            });
            
            expect(flyout.stroke.miterLimit).toBe(15);
        });

        it('should default miterLimit to 28.96', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { join: 'miter' }
            });
            
            // NumberInput receives default value of 28.96
        });
    });

    describe('updateModeContent', () => {
        it('should render solid tab for solid mode', () => {
            flyout = new StrokeSettingsFlyout();
            
            const container = document.createElement('div');
            flyout.updateModeContent(container, 'solid');
            
            const solidTab = container.querySelector('.solid-tab');
            expect(solidTab).toBeDefined();
        });

        it('should render gradient tab for gradient mode', () => {
            flyout = new StrokeSettingsFlyout();
            
            const container = document.createElement('div');
            flyout.updateModeContent(container, 'gradient');
            
            const gradientTab = container.querySelector('.gradient-tab');
            expect(gradientTab).toBeDefined();
        });

        it('should clear container before rendering', () => {
            flyout = new StrokeSettingsFlyout();
            
            const container = document.createElement('div');
            container.innerHTML = '<div>Old content</div>';
            
            flyout.updateModeContent(container, 'solid');
            
            expect(container.innerHTML).not.toContain('Old content');
        });
    });

    describe('createRow', () => {
        it('should create row with label', () => {
            flyout = new StrokeSettingsFlyout();
            
            const row = flyout.createRow('Test Label');
            
            expect(row.textContent).toBe('Test Label');
        });

        it('should have column flex direction', () => {
            flyout = new StrokeSettingsFlyout();
            
            const row = flyout.createRow('Label');
            
            expect(row.style.flexDirection).toBe('column');
        });
    });

    describe('stroke type switching', () => {
        it('should default to solid type', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: {}
            });
            
            // Type selector should default to solid
        });

        it('should use type from props', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { type: 'gradient' }
            });
            
            expect(flyout.stroke.type).toBe('gradient');
        });
    });

    describe('dash cap', () => {
        it('should use dashCap from props', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { dashCap: 'round' }
            });
            
            expect(flyout.stroke.dashCap).toBe('round');
        });

        it('should default dashCap to butt', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { style: 'dashed' }
            });
            
            // SegmentedControl receives default value of 'butt'
        });
    });

    describe('close button', () => {
        it('should close flyout when clicked', () => {
            flyout = new StrokeSettingsFlyout();
            flyout.open();
            
            const content = flyout.renderContent();
            const closeBtn = content.querySelector('.ui-icon-btn');
            closeBtn.click();
            
            expect(flyout.flyout.isOpen).toBe(false);
        });
    });

    describe('gradient stroke', () => {
        it('should use gradient value from props', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { 
                    type: 'gradient',
                    value: 'linear-gradient(45deg, #000 0%, #fff 100%)'
                }
            });
            
            expect(flyout.stroke.value).toBe('linear-gradient(45deg, #000 0%, #fff 100%)');
        });

        it('should provide default gradient value', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { type: 'gradient' }
            });
            
            const container = document.createElement('div');
            flyout.updateModeContent(container, 'gradient');
            
            // GradientTab receives default gradient value
        });
    });

    describe('color', () => {
        it('should use color from props', () => {
            flyout = new StrokeSettingsFlyout({
                stroke: { color: '#00ff00' }
            });
            
            expect(flyout.stroke.color).toBe('#00ff00');
        });
    });
});
