import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Flyout } from '../../../../src/ui/components/Flyout.js';

describe('Flyout', () => {
    let flyout;
    let trigger;
    let content;
    let onClose;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
        
        trigger = document.createElement('button');
        trigger.textContent = 'Open';
        trigger.style.position = 'absolute';
        trigger.style.left = '100px';
        trigger.style.top = '100px';
        document.body.appendChild(trigger);
        
        content = document.createElement('div');
        content.textContent = 'Flyout content';
        
        onClose = vi.fn();
    });

    afterEach(() => {
        if (flyout && flyout.element.parentNode) {
            flyout.close();
        }
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should create an instance with default options', () => {
            flyout = new Flyout();
            expect(flyout).toBeDefined();
        });

        it('should accept trigger option', () => {
            flyout = new Flyout({ trigger });
            expect(flyout.options.trigger).toBe(trigger);
        });

        it('should accept content option', () => {
            flyout = new Flyout({ content });
            expect(flyout.options.content).toBe(content);
        });

        it('should accept position option', () => {
            flyout = new Flyout({ position: 'right' });
            expect(flyout.options.position).toBe('right');
        });

        it('should default to left position', () => {
            flyout = new Flyout();
            expect(flyout.options.position).toBe('left');
        });

        it('should accept onClose callback', () => {
            flyout = new Flyout({ onClose });
            expect(flyout.options.onClose).toBe(onClose);
        });

        it('should create element', () => {
            flyout = new Flyout();
            expect(flyout.element).toBeDefined();
            expect(flyout.element.className).toBe('ui-flyout');
        });

        it('should append content to element', () => {
            flyout = new Flyout({ content });
            expect(flyout.element.contains(content)).toBe(true);
        });
    });

    describe('element styling', () => {
        it('should have fixed position', () => {
            flyout = new Flyout();
            expect(flyout.element.style.position).toBe('fixed');
        });

        it('should have high z-index', () => {
            flyout = new Flyout();
            // Uses CSS variable with fallback for design token compliance
            expect(flyout.element.style.zIndex).toBe('var(--z-dropdown, 1000)');
        });

        it('should use design system variables for background', () => {
            flyout = new Flyout();
            expect(flyout.element.style.background).toBe('var(--color-bg-panel)');
        });

        it('should use design system variables for border', () => {
            flyout = new Flyout();
            expect(flyout.element.style.border).toBe('1px solid var(--color-border)');
        });

        it('should use design system variables for border-radius', () => {
            flyout = new Flyout();
            expect(flyout.element.style.borderRadius).toBe('var(--radius-md)');
        });

        it('should have box shadow', () => {
            flyout = new Flyout();
            expect(flyout.element.style.boxShadow).toContain('rgba(0,0,0');
        });

        it('should have min-width', () => {
            flyout = new Flyout();
            expect(flyout.element.style.minWidth).toBe('200px');
        });
    });

    describe('open()', () => {
        it('should append element to document body', () => {
            flyout = new Flyout({ trigger, content });
            flyout.open();
            expect(document.body.contains(flyout.element)).toBe(true);
        });

        it('should call updatePosition', () => {
            flyout = new Flyout({ trigger, content });
            flyout.updatePosition = vi.fn();
            flyout.open();
            expect(flyout.updatePosition).toHaveBeenCalled();
        });
    });

    describe('close()', () => {
        it('should remove element from document body', () => {
            flyout = new Flyout({ trigger, content });
            flyout.open();
            flyout.close();
            expect(document.body.contains(flyout.element)).toBe(false);
        });

        it('should call onClose callback', () => {
            flyout = new Flyout({ trigger, content, onClose });
            flyout.open();
            flyout.close();
            expect(onClose).toHaveBeenCalled();
        });

        it('should not error if element not in DOM', () => {
            flyout = new Flyout({ trigger, content });
            expect(() => flyout.close()).not.toThrow();
        });

        it('should remove mousedown event listener', () => {
            flyout = new Flyout({ trigger, content });
            flyout.open();
            vi.advanceTimersByTime(10);
            
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
            flyout.close();
            
            expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', flyout.handleOutsideClick);
        });
    });

    describe('updatePosition()', () => {
        it('should not error if trigger is null', () => {
            flyout = new Flyout({ content });
            flyout.open();
            expect(() => flyout.updatePosition()).not.toThrow();
        });

        it('should set top and left styles', () => {
            flyout = new Flyout({ trigger, content });
            flyout.open();
            flyout.updatePosition();
            expect(flyout.element.style.top).toBeDefined();
            expect(flyout.element.style.left).toBeDefined();
        });
    });

    describe('handleOutsideClick()', () => {
        it('should close when clicking outside', () => {
            flyout = new Flyout({ trigger, content });
            flyout.open();
            vi.advanceTimersByTime(10);
            
            const outsideElement = document.createElement('div');
            document.body.appendChild(outsideElement);
            
            const event = new MouseEvent('mousedown', { bubbles: true });
            Object.defineProperty(event, 'target', { value: outsideElement });
            
            flyout.handleOutsideClick(event);
            
            expect(document.body.contains(flyout.element)).toBe(false);
        });

        it('should not close when clicking inside flyout', () => {
            flyout = new Flyout({ trigger, content });
            flyout.open();
            vi.advanceTimersByTime(10);
            
            const event = new MouseEvent('mousedown', { bubbles: true });
            Object.defineProperty(event, 'target', { value: content });
            
            flyout.handleOutsideClick(event);
            
            expect(document.body.contains(flyout.element)).toBe(true);
        });

        it('should not close when clicking trigger', () => {
            flyout = new Flyout({ trigger, content });
            flyout.open();
            vi.advanceTimersByTime(10);
            
            const event = new MouseEvent('mousedown', { bubbles: true });
            Object.defineProperty(event, 'target', { value: trigger });
            
            flyout.handleOutsideClick(event);
            
            expect(document.body.contains(flyout.element)).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should work without content', () => {
            flyout = new Flyout({ trigger });
            flyout.open();
            expect(document.body.contains(flyout.element)).toBe(true);
        });

        it('should work without onClose callback', () => {
            flyout = new Flyout({ trigger, content });
            flyout.open();
            expect(() => flyout.close()).not.toThrow();
        });

        it('should handle multiple open/close cycles', () => {
            flyout = new Flyout({ trigger, content, onClose });
            
            flyout.open();
            flyout.close();
            flyout.open();
            flyout.close();
            
            expect(onClose).toHaveBeenCalledTimes(2);
        });
    });
});
