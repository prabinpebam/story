import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Switch } from '../../../../src/ui/components/Switch.js';

describe('Switch', () => {
    let switchComponent;
    let onChange;

    beforeEach(() => {
        vi.clearAllMocks();
        onChange = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            switchComponent = new Switch('Test', false, onChange);
            expect(switchComponent).toBeDefined();
        });

        it('should store label', () => {
            switchComponent = new Switch('My Label', false, onChange);
            expect(switchComponent.label).toBe('My Label');
        });

        it('should store initial value', () => {
            switchComponent = new Switch('Test', true, onChange);
            expect(switchComponent.value).toBe(true);
        });

        it('should store onChange callback', () => {
            switchComponent = new Switch('Test', false, onChange);
            expect(switchComponent.onChange).toBe(onChange);
        });

        it('should create element', () => {
            switchComponent = new Switch('Test', false, onChange);
            expect(switchComponent.element).toBeDefined();
        });
    });

    describe('create()', () => {
        it('should create a container element', () => {
            switchComponent = new Switch('Test', false, onChange);
            expect(switchComponent.element.style.display).toBe('flex');
            expect(switchComponent.element.style.alignItems).toBe('center');
        });

        it('should create label when provided', () => {
            switchComponent = new Switch('Toggle Me', false, onChange);
            const label = switchComponent.element.firstElementChild;
            expect(label.innerText).toBe('Toggle Me');
        });

        it('should not create label when not provided', () => {
            switchComponent = new Switch(null, false, onChange);
            // Container has only track (no label)
            expect(switchComponent.element.children.length).toBe(1);
        });

        it('should create track element', () => {
            switchComponent = new Switch('Test', false, onChange);
            const track = switchComponent.element.querySelector('[style*="width: 32px"]');
            expect(track).toBeDefined();
        });

        it('should create thumb element', () => {
            switchComponent = new Switch('Test', false, onChange);
            const thumb = switchComponent.element.querySelector('[style*="border-radius: 50%"]');
            expect(thumb).toBeDefined();
        });

        it('should show accent color when on', () => {
            switchComponent = new Switch('Test', true, onChange);
            const track = switchComponent.element.lastElementChild;
            expect(track.style.backgroundColor).toBe('var(--color-accent)');
        });

        it('should show border color when off', () => {
            switchComponent = new Switch('Test', false, onChange);
            const track = switchComponent.element.lastElementChild;
            expect(track.style.backgroundColor).toBe('var(--color-border)');
        });

        it('should position thumb on right when on', () => {
            switchComponent = new Switch('Test', true, onChange);
            const thumb = switchComponent.element.lastElementChild.firstElementChild;
            expect(thumb.style.left).toBe('18px');
        });

        it('should position thumb on left when off', () => {
            switchComponent = new Switch('Test', false, onChange);
            const thumb = switchComponent.element.lastElementChild.firstElementChild;
            expect(thumb.style.left).toBe('2px');
        });
    });

    describe('track click', () => {
        it('should toggle value from false to true', () => {
            switchComponent = new Switch('Test', false, onChange);
            const track = switchComponent.element.lastElementChild;
            
            track.click();
            
            expect(switchComponent.value).toBe(true);
        });

        it('should toggle value from true to false', () => {
            switchComponent = new Switch('Test', true, onChange);
            const track = switchComponent.element.lastElementChild;
            
            track.click();
            
            expect(switchComponent.value).toBe(false);
        });

        it('should call onChange with new value', () => {
            switchComponent = new Switch('Test', false, onChange);
            const track = switchComponent.element.lastElementChild;
            
            track.click();
            
            expect(onChange).toHaveBeenCalledWith(true);
        });

        it('should update track color on toggle', () => {
            switchComponent = new Switch('Test', false, onChange);
            const track = switchComponent.element.lastElementChild;
            
            track.click();
            
            expect(track.style.backgroundColor).toBe('var(--color-accent)');
        });

        it('should update thumb position on toggle', () => {
            switchComponent = new Switch('Test', false, onChange);
            const track = switchComponent.element.lastElementChild;
            const thumb = track.firstElementChild;
            
            track.click();
            
            expect(thumb.style.left).toBe('18px');
        });

        it('should handle multiple toggles', () => {
            switchComponent = new Switch('Test', false, onChange);
            const track = switchComponent.element.lastElementChild;
            
            track.click(); // false -> true
            track.click(); // true -> false
            track.click(); // false -> true
            
            expect(switchComponent.value).toBe(true);
            expect(onChange).toHaveBeenCalledTimes(3);
        });
    });

    describe('event propagation', () => {
        it('should stop propagation on container click', () => {
            switchComponent = new Switch('Test', false, onChange);
            const event = new MouseEvent('click', { bubbles: true });
            event.stopPropagation = vi.fn();
            
            switchComponent.element.dispatchEvent(event);
            
            expect(event.stopPropagation).toHaveBeenCalled();
        });

        it('should stop propagation on track click', () => {
            switchComponent = new Switch('Test', false, onChange);
            const track = switchComponent.element.lastElementChild;
            const event = new MouseEvent('click', { bubbles: true });
            event.stopPropagation = vi.fn();
            
            track.dispatchEvent(event);
            
            expect(event.stopPropagation).toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should work without onChange callback', () => {
            switchComponent = new Switch('Test', false, null);
            const track = switchComponent.element.lastElementChild;
            
            expect(() => track.click()).not.toThrow();
            expect(switchComponent.value).toBe(true);
        });

        it('should handle empty string label', () => {
            switchComponent = new Switch('', false, onChange);
            // Only track should be present, no label
            expect(switchComponent.element.children.length).toBe(1);
        });

        it('should apply styling correctly', () => {
            switchComponent = new Switch('Test', false, onChange);
            const track = switchComponent.element.lastElementChild;
            
            expect(track.style.width).toBe('32px');
            expect(track.style.height).toBe('16px');
            expect(track.style.borderRadius).toBe('8px');
            expect(track.style.cursor).toBe('pointer');
        });

        it('should apply thumb styling correctly', () => {
            switchComponent = new Switch('Test', false, onChange);
            const thumb = switchComponent.element.lastElementChild.firstElementChild;
            
            expect(thumb.style.width).toBe('12px');
            expect(thumb.style.height).toBe('12px');
            expect(thumb.style.borderRadius).toBe('50%');
            expect(thumb.style.backgroundColor).toBe('white');
        });
    });
});
