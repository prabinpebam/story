import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { EmptyState } from '../../../../src/ui/components/EmptyState.js';

describe('EmptyState', () => {
    let emptyState;

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            emptyState = new EmptyState('No items');
            expect(emptyState).toBeDefined();
        });

        it('should create an element', () => {
            emptyState = new EmptyState('Empty');
            expect(emptyState.element).toBeDefined();
        });
    });

    describe('element structure', () => {
        it('should have empty-state-row class', () => {
            emptyState = new EmptyState('No data');
            expect(emptyState.element.className).toBe('empty-state-row');
        });

        it('should have flex display', () => {
            emptyState = new EmptyState('Test');
            expect(emptyState.element.style.display).toBe('flex');
        });

        it('should center items', () => {
            emptyState = new EmptyState('Test');
            expect(emptyState.element.style.alignItems).toBe('center');
        });

        it('should have two children - slot and text', () => {
            emptyState = new EmptyState('Message');
            expect(emptyState.element.children.length).toBe(2);
        });

        it('should display message in text span', () => {
            emptyState = new EmptyState('No effects');
            const textSpan = emptyState.element.querySelector('span');
            expect(textSpan.textContent).toBe('No effects');
        });

        it('should create placeholder slot', () => {
            emptyState = new EmptyState('Test');
            const slot = emptyState.element.children[0];
            expect(slot.style.width).toBe('16px');
            expect(slot.style.height).toBe('16px');
        });

        it('should have dashed border on slot', () => {
            emptyState = new EmptyState('Test');
            const slot = emptyState.element.children[0];
            expect(slot.style.border).toContain('dashed');
        });
    });

    describe('styling', () => {
        it('should use design system color variable', () => {
            emptyState = new EmptyState('Test');
            expect(emptyState.element.style.color).toBe('var(--text-tertiary)');
        });

        it('should have font size of 11px', () => {
            emptyState = new EmptyState('Test');
            expect(emptyState.element.style.fontSize).toBe('11px');
        });

        it('should disable user selection', () => {
            emptyState = new EmptyState('Test');
            expect(emptyState.element.style.userSelect).toBe('none');
        });

        it('should have gap between elements', () => {
            emptyState = new EmptyState('Test');
            expect(emptyState.element.style.gap).toBe('8px');
        });

        it('should have padding', () => {
            emptyState = new EmptyState('Test');
            expect(emptyState.element.style.padding).toBe('8px 4px');
        });
    });

    describe('edge cases', () => {
        it('should handle empty message', () => {
            emptyState = new EmptyState('');
            const textSpan = emptyState.element.querySelector('span');
            expect(textSpan.textContent).toBe('');
        });

        it('should handle long message', () => {
            const longMessage = 'This is a very long message that describes the empty state condition';
            emptyState = new EmptyState(longMessage);
            const textSpan = emptyState.element.querySelector('span');
            expect(textSpan.textContent).toBe(longMessage);
        });

        it('should handle undefined message', () => {
            emptyState = new EmptyState(undefined);
            const textSpan = emptyState.element.querySelector('span');
            // textContent of undefined becomes empty string in DOM
            expect(textSpan.textContent).toBe('');
        });
    });
});
