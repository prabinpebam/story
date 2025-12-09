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

        it('should have CSS class for styling (moved from inline)', () => {
            emptyState = new EmptyState('Test');
            // Styles are now in CSS class .empty-state-row
            // The CSS provides: display: flex, align-items: center, padding, gap, color, font-size, user-select
            expect(emptyState.element.classList.contains('empty-state-row')).toBe(true);
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

        it('should create placeholder slot with CSS class', () => {
            emptyState = new EmptyState('Test');
            const slot = emptyState.element.children[0];
            // Slot styles are now in CSS class .empty-state-slot
            expect(slot.classList.contains('empty-state-slot')).toBe(true);
        });
    });

    describe('styling', () => {
        it('should use CSS class for container styling', () => {
            emptyState = new EmptyState('Test');
            // All container styles (color, font-size, user-select, gap, padding) are in CSS class
            expect(emptyState.element.classList.contains('empty-state-row')).toBe(true);
        });

        it('should use CSS class for slot styling', () => {
            emptyState = new EmptyState('Test');
            const slot = emptyState.element.children[0];
            // All slot styles (width, height, border, etc.) are in CSS class
            expect(slot.classList.contains('empty-state-slot')).toBe(true);
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
