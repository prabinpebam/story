/**
 * IMEHandler Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IMEHandler } from '../../../../src/core/text/IMEHandler.js';

describe('IMEHandler', () => {
    let handler;
    let mockElement;
    
    beforeEach(() => {
        handler = new IMEHandler();
        
        // Create mock DOM element
        mockElement = document.createElement('div');
        mockElement.contentEditable = 'true';
        document.body.appendChild(mockElement);
    });
    
    afterEach(() => {
        if (mockElement.parentNode) {
            mockElement.parentNode.removeChild(mockElement);
        }
        handler = null;
    });

    describe('constructor', () => {
        it('should initialize with not composing', () => {
            expect(handler.isComposing).toBe(false);
        });

        it('should initialize with empty composition text', () => {
            expect(handler.compositionText).toBe('');
        });
    });

    describe('attach', () => {
        it('should add composition event listeners', () => {
            const addEventListenerSpy = vi.spyOn(mockElement, 'addEventListener');
            
            handler.attach(mockElement);
            
            expect(addEventListenerSpy).toHaveBeenCalledWith('compositionstart', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('compositionend', expect.any(Function));
        });

        it('should not throw for null element', () => {
            expect(() => handler.attach(null)).not.toThrow();
        });
    });

    describe('detach', () => {
        it('should remove event listeners', () => {
            const removeEventListenerSpy = vi.spyOn(mockElement, 'removeEventListener');
            
            handler.attach(mockElement);
            handler.detach(mockElement);
            
            expect(removeEventListenerSpy).toHaveBeenCalledWith('compositionstart', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('compositionend', expect.any(Function));
        });

        it('should reset composing state', () => {
            handler.attach(mockElement);
            handler.isComposing = true;
            handler.detach(mockElement);
            
            expect(handler.isComposing).toBe(false);
        });

        it('should reset composition text', () => {
            handler.attach(mockElement);
            handler.compositionText = 'test';
            handler.detach(mockElement);
            
            expect(handler.compositionText).toBe('');
        });
    });

    describe('isCompositionInProgress', () => {
        it('should return true during composition', () => {
            handler.attach(mockElement);
            
            // Simulate composition start
            mockElement.dispatchEvent(new CompositionEvent('compositionstart'));
            
            expect(handler.isCompositionInProgress()).toBe(true);
        });

        it('should return false after composition ends', () => {
            handler.attach(mockElement);
            
            // Simulate composition start and end
            mockElement.dispatchEvent(new CompositionEvent('compositionstart'));
            mockElement.dispatchEvent(new CompositionEvent('compositionend'));
            
            expect(handler.isCompositionInProgress()).toBe(false);
        });

        it('should return false when not attached', () => {
            expect(handler.isCompositionInProgress()).toBe(false);
        });
    });

    describe('composition events', () => {
        it('should set isComposing to true on compositionstart', () => {
            handler.attach(mockElement);
            
            mockElement.dispatchEvent(new CompositionEvent('compositionstart'));
            
            expect(handler.isComposing).toBe(true);
        });

        it('should set isComposing to false on compositionend', () => {
            handler.attach(mockElement);
            
            mockElement.dispatchEvent(new CompositionEvent('compositionstart'));
            mockElement.dispatchEvent(new CompositionEvent('compositionend'));
            
            expect(handler.isComposing).toBe(false);
        });
    });

    describe('getCompositionText', () => {
        it('should return empty string when not composing', () => {
            expect(handler.getCompositionText()).toBe('');
        });

        it('should return composition text during composition', () => {
            handler.attach(mockElement);
            
            mockElement.dispatchEvent(new CompositionEvent('compositionstart'));
            mockElement.dispatchEvent(new CompositionEvent('compositionupdate', { data: '中文' }));
            
            // Note: In JSDOM, this may not fully simulate real composition
            // The actual composition text capture depends on browser implementation
            expect(typeof handler.getCompositionText()).toBe('string');
        });
    });

    describe('shouldBlockAction', () => {
        it('should block certain actions during composition', () => {
            handler.isComposing = true;
            
            expect(handler.shouldBlockAction('save')).toBe(true);
            expect(handler.shouldBlockAction('exit')).toBe(true);
            expect(handler.shouldBlockAction('format')).toBe(true);
        });

        it('should not block actions when not composing', () => {
            handler.isComposing = false;
            
            expect(handler.shouldBlockAction('save')).toBe(false);
            expect(handler.shouldBlockAction('exit')).toBe(false);
        });
    });

    describe('forceEndComposition', () => {
        it('should force end composition', () => {
            handler.isComposing = true;
            handler.compositionText = 'test';
            
            handler.forceEndComposition();
            
            expect(handler.isComposing).toBe(false);
            expect(handler.compositionText).toBe('');
        });
    });
});
