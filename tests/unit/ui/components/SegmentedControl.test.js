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
            expect(segmentedControl.element.style.display).toBe('flex');
        });

        it('should create buttons for each option', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element.children.length).toBe(3);
        });

        it('should display labels in buttons', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element.children[0].innerText).toBe('Left');
            expect(segmentedControl.element.children[1].innerText).toBe('Center');
            expect(segmentedControl.element.children[2].innerText).toBe('Right');
        });

        it('should apply border between items except last', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element.children[0].style.borderRight).toBe('1px solid var(--color-border)');
            expect(segmentedControl.element.children[1].style.borderRight).toBe('1px solid var(--color-border)');
            expect(segmentedControl.element.children[2].style.borderRight).toBe('');
        });

        it('should highlight selected option', () => {
            segmentedControl = new SegmentedControl(testOptions, 'center', onChange);
            expect(segmentedControl.element.children[1].style.backgroundColor).toBe('var(--color-accent)');
            expect(segmentedControl.element.children[1].style.color).toBe('var(--color-text-on-accent)');
        });

        it('should not highlight unselected options', () => {
            segmentedControl = new SegmentedControl(testOptions, 'center', onChange);
            expect(segmentedControl.element.children[0].style.backgroundColor).toBe('transparent');
            expect(segmentedControl.element.children[2].style.backgroundColor).toBe('transparent');
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
            expect(segmentedControl.element.children[2].style.backgroundColor).toBe('var(--color-accent)');
            // Old selection should be unhighlighted
            expect(segmentedControl.element.children[0].style.backgroundColor).toBe('transparent');
        });

        it('should handle clicking already selected option', () => {
            segmentedControl = new SegmentedControl(testOptions, 'center', onChange);
            
            segmentedControl.element.children[1].click();
            
            expect(onChange).toHaveBeenCalledWith('center');
            expect(segmentedControl.element.children[1].style.backgroundColor).toBe('var(--color-accent)');
        });

        it('should work without onChange callback', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', null);
            
            expect(() => segmentedControl.element.children[1].click()).not.toThrow();
            expect(segmentedControl.selectedValue).toBe('center');
        });
    });

    describe('styling', () => {
        it('should apply border radius to container', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element.style.borderRadius).toBe('2px');
        });

        it('should apply overflow hidden to container', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element.style.overflow).toBe('hidden');
        });

        it('should apply full width to container', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element.style.width).toBe('100%');
        });

        it('should apply flex to buttons', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element.children[0].style.flex).toContain('1');
        });

        it('should center content in buttons', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element.children[0].style.alignItems).toBe('center');
            expect(segmentedControl.element.children[0].style.justifyContent).toBe('center');
        });

        it('should set cursor to pointer on buttons', () => {
            segmentedControl = new SegmentedControl(testOptions, 'left', onChange);
            expect(segmentedControl.element.children[0].style.cursor).toBe('pointer');
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
            expect(segmentedControl.element.children[0].style.borderRight).toBe('');
        });

        it('should handle no initial selection', () => {
            segmentedControl = new SegmentedControl(testOptions, null, onChange);
            // All buttons should have transparent background
            Array.from(segmentedControl.element.children).forEach(child => {
                expect(child.style.backgroundColor).toBe('transparent');
            });
        });

        it('should handle value not in options', () => {
            segmentedControl = new SegmentedControl(testOptions, 'invalid', onChange);
            // All buttons should have transparent background
            Array.from(segmentedControl.element.children).forEach(child => {
                expect(child.style.backgroundColor).toBe('transparent');
            });
        });
    });
});
