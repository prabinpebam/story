import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Dropdown } from '../../../../src/ui/components/Dropdown.js';

describe('Dropdown', () => {
    let dropdown;
    let onChange;
    const testOptions = [
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' },
        { label: 'Option 3', value: 'opt3' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
        onChange = vi.fn();
    });

    afterEach(() => {
        if (dropdown && dropdown.isOpen) {
            dropdown.close();
        }
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should create an instance with default options', () => {
            dropdown = new Dropdown();
            expect(dropdown).toBeDefined();
            expect(dropdown.value).toBeNull();
        });

        it('should accept options array', () => {
            dropdown = new Dropdown({ options: testOptions });
            expect(dropdown.options.options).toEqual(testOptions);
        });

        it('should accept initial value', () => {
            dropdown = new Dropdown({ options: testOptions, value: 'opt2' });
            expect(dropdown.value).toBe('opt2');
        });

        it('should accept placeholder', () => {
            dropdown = new Dropdown({ placeholder: 'Select...' });
            expect(dropdown.options.placeholder).toBe('Select...');
        });

        it('should accept size option', () => {
            dropdown = new Dropdown({ size: 'fill' });
            expect(dropdown.options.size).toBe('fill');
        });

        it('should accept height option', () => {
            dropdown = new Dropdown({ height: 'lg' });
            expect(dropdown.options.height).toBe('lg');
        });

        it('should accept onChange callback', () => {
            dropdown = new Dropdown({ onChange });
            expect(dropdown.options.onChange).toBe(onChange);
        });

        it('should initialize isOpen as false', () => {
            dropdown = new Dropdown();
            expect(dropdown.isOpen).toBe(false);
        });
    });

    describe('create()', () => {
        it('should create a container element', () => {
            dropdown = new Dropdown();
            expect(dropdown.element).toBeDefined();
            expect(dropdown.element.className).toContain('dropdown-container');
        });

        it('should create a trigger element', () => {
            dropdown = new Dropdown();
            expect(dropdown.trigger).toBeDefined();
            expect(dropdown.trigger.className).toContain('dropdown-trigger');
        });

        it('should create an arrow element', () => {
            dropdown = new Dropdown();
            const arrow = dropdown.element.querySelector('.dropdown-arrow');
            expect(arrow).toBeDefined();
        });

        it('should apply size class when provided', () => {
            dropdown = new Dropdown({ size: 'fill' });
            expect(dropdown.element.className).toContain('dropdown-fill');
        });

        it('should apply height class when provided', () => {
            dropdown = new Dropdown({ height: 'sm' });
            expect(dropdown.element.className).toContain('dropdown-height-sm');
        });

        it('should display selected option label', () => {
            dropdown = new Dropdown({ options: testOptions, value: 'opt2' });
            expect(dropdown.trigger.textContent).toBe('Option 2');
        });

        it('should display placeholder when no value', () => {
            dropdown = new Dropdown({ placeholder: 'Select an option' });
            expect(dropdown.trigger.textContent).toBe('Select an option');
            expect(dropdown.trigger.classList.contains('placeholder')).toBe(true);
        });
    });

    describe('updateTriggerText()', () => {
        it('should display label for selected value', () => {
            dropdown = new Dropdown({ options: testOptions, value: 'opt1' });
            expect(dropdown.trigger.textContent).toBe('Option 1');
        });

        it('should display placeholder when no match', () => {
            dropdown = new Dropdown({ options: testOptions, placeholder: 'Choose...' });
            expect(dropdown.trigger.textContent).toBe('Choose...');
        });

        it('should add placeholder class when showing placeholder', () => {
            dropdown = new Dropdown({ placeholder: 'Choose...' });
            expect(dropdown.trigger.classList.contains('placeholder')).toBe(true);
        });

        it('should remove placeholder class when showing value', () => {
            dropdown = new Dropdown({ options: testOptions, value: 'opt1' });
            expect(dropdown.trigger.classList.contains('placeholder')).toBe(false);
        });

        it('should display empty when no value and no placeholder', () => {
            dropdown = new Dropdown({ options: testOptions });
            expect(dropdown.trigger.textContent).toBe('');
        });
    });

    describe('toggle()', () => {
        it('should open when closed', () => {
            dropdown = new Dropdown({ options: testOptions });
            dropdown.toggle();
            expect(dropdown.isOpen).toBe(true);
        });

        it('should close when open', () => {
            dropdown = new Dropdown({ options: testOptions });
            dropdown.open();
            dropdown.toggle();
            expect(dropdown.isOpen).toBe(false);
        });
    });

    describe('open()', () => {
        it('should set isOpen to true', () => {
            dropdown = new Dropdown({ options: testOptions });
            dropdown.open();
            expect(dropdown.isOpen).toBe(true);
        });

        it('should create menu element', () => {
            dropdown = new Dropdown({ options: testOptions });
            dropdown.open();
            expect(dropdown.menu).toBeDefined();
            expect(dropdown.menu.className).toBe('dropdown-menu');
        });

        it('should append menu to document body', () => {
            dropdown = new Dropdown({ options: testOptions });
            dropdown.open();
            const menu = document.querySelector('.dropdown-menu');
            expect(menu).toBeDefined();
        });

        it('should create menu items for each option', () => {
            dropdown = new Dropdown({ options: testOptions });
            dropdown.open();
            const items = dropdown.menu.querySelectorAll('.dropdown-item');
            expect(items.length).toBe(3);
        });

        it('should mark selected item', () => {
            dropdown = new Dropdown({ options: testOptions, value: 'opt2' });
            dropdown.open();
            const items = dropdown.menu.querySelectorAll('.dropdown-item');
            expect(items[1].classList.contains('selected')).toBe(true);
        });

        it('should not reopen if already open', () => {
            dropdown = new Dropdown({ options: testOptions });
            dropdown.open();
            const menu1 = dropdown.menu;
            dropdown.open();
            expect(dropdown.menu).toBe(menu1);
        });

        it('should handle divider options', () => {
            const optionsWithDivider = [
                { label: 'Option 1', value: 'opt1' },
                { divider: true },
                { label: 'Option 2', value: 'opt2' }
            ];
            dropdown = new Dropdown({ options: optionsWithDivider });
            dropdown.open();
            const dividers = dropdown.menu.querySelectorAll('.dropdown-divider');
            expect(dividers.length).toBe(1);
        });

        it('should handle action options', () => {
            const optionsWithAction = [
                { label: 'Regular', value: 'reg' },
                { label: 'Action', value: 'act', action: true }
            ];
            dropdown = new Dropdown({ options: optionsWithAction });
            dropdown.open();
            const items = dropdown.menu.querySelectorAll('.dropdown-item');
            expect(items[1].classList.contains('action')).toBe(true);
        });
    });

    describe('close()', () => {
        it('should set isOpen to false', () => {
            dropdown = new Dropdown({ options: testOptions });
            dropdown.open();
            dropdown.close();
            expect(dropdown.isOpen).toBe(false);
        });

        it('should remove menu element', () => {
            dropdown = new Dropdown({ options: testOptions });
            dropdown.open();
            dropdown.close();
            expect(dropdown.menu).toBeNull();
        });

        it('should remove menu from document body', () => {
            dropdown = new Dropdown({ options: testOptions });
            dropdown.open();
            dropdown.close();
            const menu = document.querySelector('.dropdown-menu');
            expect(menu).toBeNull();
        });

        it('should not error if already closed', () => {
            dropdown = new Dropdown({ options: testOptions });
            expect(() => dropdown.close()).not.toThrow();
        });
    });

    describe('setValue()', () => {
        it('should update value', () => {
            dropdown = new Dropdown({ options: testOptions, value: 'opt1' });
            dropdown.setValue('opt3');
            expect(dropdown.value).toBe('opt3');
        });

        it('should update trigger text', () => {
            dropdown = new Dropdown({ options: testOptions, value: 'opt1' });
            dropdown.setValue('opt3');
            expect(dropdown.trigger.textContent).toBe('Option 3');
        });
    });

    describe('setOptions()', () => {
        it('should update options', () => {
            dropdown = new Dropdown({ options: testOptions });
            const newOptions = [{ label: 'New', value: 'new' }];
            dropdown.setOptions(newOptions);
            expect(dropdown.options.options).toEqual(newOptions);
        });

        it('should update trigger text after changing options', () => {
            dropdown = new Dropdown({ options: testOptions, value: 'opt1' });
            const newOptions = [
                { label: 'New Option 1', value: 'opt1' },
                { label: 'New Option 2', value: 'opt2' }
            ];
            dropdown.setOptions(newOptions);
            expect(dropdown.trigger.textContent).toBe('New Option 1');
        });
    });

    describe('menu item click', () => {
        it('should call onChange when item is clicked', () => {
            dropdown = new Dropdown({ options: testOptions, onChange });
            dropdown.open();
            const items = dropdown.menu.querySelectorAll('.dropdown-item');
            items[1].click();
            expect(onChange).toHaveBeenCalledWith('opt2');
        });

        it('should update value when item is clicked', () => {
            dropdown = new Dropdown({ options: testOptions, onChange });
            dropdown.open();
            const items = dropdown.menu.querySelectorAll('.dropdown-item');
            items[2].click();
            expect(dropdown.value).toBe('opt3');
        });

        it('should close menu after selection', () => {
            dropdown = new Dropdown({ options: testOptions, onChange });
            dropdown.open();
            const items = dropdown.menu.querySelectorAll('.dropdown-item');
            items[0].click();
            expect(dropdown.isOpen).toBe(false);
        });

        it('should not update value for action items', () => {
            const optionsWithAction = [
                { label: 'Regular', value: 'reg' },
                { label: 'Action', value: 'act', action: true }
            ];
            dropdown = new Dropdown({ options: optionsWithAction, value: 'reg', onChange });
            dropdown.open();
            const items = dropdown.menu.querySelectorAll('.dropdown-item');
            items[1].click();
            expect(dropdown.value).toBe('reg');
        });
    });

    describe('container click', () => {
        it('should toggle menu on container click', () => {
            dropdown = new Dropdown({ options: testOptions });
            dropdown.element.click();
            expect(dropdown.isOpen).toBe(true);
        });

        it('should close menu on second container click', () => {
            dropdown = new Dropdown({ options: testOptions });
            dropdown.element.click();
            dropdown.element.click();
            expect(dropdown.isOpen).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('should handle empty options array', () => {
            dropdown = new Dropdown({ options: [] });
            dropdown.open();
            const items = dropdown.menu.querySelectorAll('.dropdown-item');
            expect(items.length).toBe(0);
        });

        it('should handle value not in options', () => {
            dropdown = new Dropdown({ options: testOptions, value: 'nonexistent' });
            expect(dropdown.trigger.textContent).toBe('');
        });

        it('should handle multiple size/height classes', () => {
            dropdown = new Dropdown({ size: 'lg', height: 'sm' });
            expect(dropdown.element.className).toContain('dropdown-lg');
            expect(dropdown.element.className).toContain('dropdown-height-sm');
        });
    });
});
