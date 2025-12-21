import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { SegmentedControl } from '../../../../src/ui/components/SegmentedControl.js';

describe('SegmentedControl', () => {
    let segmentedControl;
    let onChange;
    const testOptions = [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        onChange = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        describe('legacy positional arguments', () => {
            it('should accept options array as first argument', () => {
                segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
                expect(segmentedControl.options).toEqual(testOptions);
            });

            it('should accept selected value as second argument', () => {
                segmentedControl = new SegmentedControl(testOptions, 'center', onChange);
                expect(segmentedControl.selectedValue).toBe('center');
            });

            it('should accept onChange as third argument', () => {
                segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
                expect(segmentedControl.onChange).toBe(onChange);
            });
        });

        describe('config object pattern', () => {
            it('should accept config object with options', () => {
                segmentedControl = new SegmentedControl({
                    options: testOptions,
                    value: 'right',
                    onChange
                });
                expect(segmentedControl.options).toEqual(testOptions);
            });

            it('should accept config object with value', () => {
                segmentedControl = new SegmentedControl({
                    options: testOptions,
                    value: 'center',
                    onChange
                });
                expect(segmentedControl.selectedValue).toBe('center');
            });

            it('should accept config object with onChange', () => {
                segmentedControl = new SegmentedControl({
                    options: testOptions,
                    value: 'left',
                    onChange
                });
                expect(segmentedControl.onChange).toBe(onChange);
            });

            it('should handle empty config object', () => {
                segmentedControl = new SegmentedControl({});
                expect(segmentedControl.options).toEqual([]);
            });

            it('should handle null config', () => {
                segmentedControl = new SegmentedControl(null);
                expect(segmentedControl.options).toEqual([]);
            });
        });
    });

    describe('create()', () => {
        it('should create a container element', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element).toBeDefined();
            expect(segmentedControl.element.classList.contains('segmented-control')).toBe(true);
        });

        it('should create buttons for each option', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element.children.length).toBe(3);
            Array.from(segmentedControl.element.children).forEach((child) => {
                expect(child.tagName).toBe('BUTTON');
                expect(child.classList.contains('segmented-control__item')).toBe(true);
            });
        });

        it('should display labels in buttons', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element.children[0].innerText).toBe('Left');
            expect(segmentedControl.element.children[1].innerText).toBe('Center');
            expect(segmentedControl.element.children[2].innerText).toBe('Right');
        });

        it('should highlight selected option', () => {
            segmentedControl = new SegmentedControl(testOptions, 'center', onChange);
            expect(segmentedControl.element.children[1].classList.contains('is-selected')).toBe(true);
            expect(segmentedControl.element.children[1].getAttribute('aria-pressed')).toBe('true');
        });

        it('should not highlight unselected options', () => {
            segmentedControl = new SegmentedControl(testOptions, 'center', onChange);
            expect(segmentedControl.element.children[0].classList.contains('is-selected')).toBe(false);
            expect(segmentedControl.element.children[2].classList.contains('is-selected')).toBe(false);
            expect(segmentedControl.element.children[0].getAttribute('aria-pressed')).toBe('false');
            expect(segmentedControl.element.children[2].getAttribute('aria-pressed')).toBe('false');
        });

        it('should not use inline styles (design-system compliance)', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element.getAttribute('style')).toBe(null);
            Array.from(segmentedControl.element.children).forEach((child) => {
                expect(child.getAttribute('style')).toBe(null);
            });
        });
    });

    describe('icon options', () => {
        it('should render SVG icon when provided', () => {
            const iconOptions = [
                { label: 'Bold', value: 'bold', icon: '<svg>bold</svg>' },
                { label: 'Italic', value: 'italic', icon: '<svg>italic</svg>' }
            ];
            segmentedControl = new SegmentedControl(iconOptions, 'bold', onChange);
            
            expect(segmentedControl.element.children[0].innerHTML).toBe('<svg>bold</svg>');
        });

        it('should set tooltip from label when icon is used', () => {
            const iconOptions = [
                { label: 'Bold', value: 'bold', icon: '<svg>bold</svg>' }
            ];
            segmentedControl = new SegmentedControl(iconOptions, 'bold', onChange);
            
            expect(segmentedControl.element.children[0].title).toBe('Bold');
        });

        it('should render FontAwesome class when icon is not SVG', () => {
            const iconOptions = [
                { label: 'Star', value: 'star', icon: 'fa-star' }
            ];
            segmentedControl = new SegmentedControl(iconOptions, 'star', onChange);
            
            expect(segmentedControl.element.children[0].innerHTML).toContain('fa-solid');
            expect(segmentedControl.element.children[0].innerHTML).toContain('fa-star');
        });
    });

    describe('click interaction', () => {
        it('should update selectedValue on click', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            
            segmentedControl.element.children[2].click();
            
            expect(segmentedControl.selectedValue).toBe('right');
        });

        it('should call onChange with new value', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            
            segmentedControl.element.children[1].click();
            
            expect(onChange).toHaveBeenCalledWith('center');
        });

        it('should update visual state on click', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            
            segmentedControl.element.children[2].click();
            
            // New selection should be highlighted
            expect(segmentedControl.element.children[2].classList.contains('is-selected')).toBe(true);
            expect(segmentedControl.element.children[2].getAttribute('aria-pressed')).toBe('true');
            // Old selection should be unhighlighted
            expect(segmentedControl.element.children[0].classList.contains('is-selected')).toBe(false);
            expect(segmentedControl.element.children[0].getAttribute('aria-pressed')).toBe('false');
        });

        it('should handle clicking already selected option', () => {
            segmentedControl = new SegmentedControl(testOptions, 'center', onChange);
            
            segmentedControl.element.children[1].click();
            
            expect(onChange).toHaveBeenCalledWith('center');
            expect(segmentedControl.element.children[1].classList.contains('is-selected')).toBe(true);
        });

        it('should work without onChange callback', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', null);
            
            expect(() => segmentedControl.element.children[1].click()).not.toThrow();
            expect(segmentedControl.selectedValue).toBe('center');
        });
    });

    describe('edge cases', () => {
        it('should handle empty options array', () => {
            segmentedControl = new SegmentedControl([], null, onChange);
            expect(segmentedControl.element.children.length).toBe(0);
        });

        it('should handle single option', () => {
            segmentedControl = new SegmentedControl([{ label: 'Only', value: 'only' }], 'only', onChange);
            expect(segmentedControl.element.children.length).toBe(1);
            expect(segmentedControl.element.children[0].classList.contains('segmented-control__item')).toBe(true);
        });

        it('should handle no initial selection', () => {
            segmentedControl = new SegmentedControl(testOptions, null, onChange);
            Array.from(segmentedControl.element.children).forEach(child => {
                expect(child.classList.contains('is-selected')).toBe(false);
                expect(child.getAttribute('aria-pressed')).toBe('false');
            });
        });

        it('should handle value not in options', () => {
            segmentedControl = new SegmentedControl(testOptions, 'invalid', onChange);
            Array.from(segmentedControl.element.children).forEach(child => {
                expect(child.classList.contains('is-selected')).toBe(false);
                expect(child.getAttribute('aria-pressed')).toBe('false');
            });
        });
    });
});
