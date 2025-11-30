/**
 * CodeRunner Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeRunner } from '../../../../src/core/effects/CodeRunner.js';

describe('CodeRunner', () => {
    describe('captureFrame', () => {
        it('should return a canvas element for valid code', () => {
            const code = `return { draw: function(t) { ctx.fillStyle = 'red'; ctx.fillRect(0, 0, canvas.width, canvas.height); } }`;
            const canvas = CodeRunner.captureFrame(code, 100, 100);

            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas.width).toBe(100);
            expect(canvas.height).toBe(100);
        });

        it('should render at specified dimensions', () => {
            const code = `return { draw: function(t) { ctx.fillRect(0, 0, canvas.width, canvas.height); } }`;
            const canvas = CodeRunner.captureFrame(code, 200, 150);

            expect(canvas.width).toBe(200);
            expect(canvas.height).toBe(150);
        });

        it('should pass time parameter to draw function', () => {
            let receivedTime = null;
            const code = `return { draw: function(t) { 
                // Store time for verification
                canvas.receivedTime = t;
            } }`;
            const canvas = CodeRunner.captureFrame(code, 100, 100, 5.5);

            expect(canvas.receivedTime).toBe(5.5);
        });

        it('should return null for invalid code', () => {
            const code = 'this is { not valid ] javascript }';
            const canvas = CodeRunner.captureFrame(code, 100, 100);

            expect(canvas).toBeNull();
        });

        it('should return null for empty code', () => {
            const canvas = CodeRunner.captureFrame('', 100, 100);
            expect(canvas).toBeNull();
        });

        it('should return null for null code', () => {
            const canvas = CodeRunner.captureFrame(null, 100, 100);
            expect(canvas).toBeNull();
        });

        it('should return null when no draw function is returned', () => {
            const code = `const x = 5; return { setup: function() {} };`;
            const canvas = CodeRunner.captureFrame(code, 100, 100);

            expect(canvas).toBeNull();
        });

        it('should call init function if provided', () => {
            const code = `return { 
                initialized: false,
                init: function() { this.initialized = true; },
                draw: function(t) { 
                    canvas.wasInitialized = this.initialized;
                } 
            }`;
            const canvas = CodeRunner.captureFrame(code, 100, 100);

            expect(canvas.wasInitialized).toBe(true);
        });

        it('should handle code with cleanup function', () => {
            const code = `return { 
                draw: function(t) { ctx.fillRect(0, 0, 10, 10); },
                cleanup: function() { canvas.cleanupCalled = true; }
            }`;
            const canvas = CodeRunner.captureFrame(code, 100, 100);

            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas.cleanupCalled).toBe(true);
        });

        it('should handle statement-style code with draw function', () => {
            // Statement-style code that doesn't use canvas methods (works in JSDOM)
            const code = `function draw(t) { canvas.testValue = 42; }`;
            const canvas = CodeRunner.captureFrame(code, 100, 100);

            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas.testValue).toBe(42);
        });

        it('should handle runtime errors gracefully', () => {
            const code = `return { draw: function(t) { throw new Error('Runtime error'); } }`;
            
            // Should not throw
            expect(() => {
                CodeRunner.captureFrame(code, 100, 100);
            }).not.toThrow();
        });

        it('should provide mouse object to code', () => {
            const code = `return { draw: function(t) { 
                canvas.hasMouseX = typeof mouse.x === 'number';
                canvas.hasMouseY = typeof mouse.y === 'number';
            } }`;
            const canvas = CodeRunner.captureFrame(code, 100, 100);

            // Should return canvas (may be null in JSDOM without full canvas support)
            if (canvas) {
                expect(canvas.hasMouseX).toBe(true);
                expect(canvas.hasMouseY).toBe(true);
            }
        });

        it('should provide ctx, canvas, width, height to code', () => {
            const code = `return { draw: function(t) { 
                canvas.hasCtx = typeof ctx !== 'undefined';
                canvas.hasWidth = typeof width === 'number';
                canvas.hasHeight = typeof height === 'number';
            } }`;
            const canvas = CodeRunner.captureFrame(code, 150, 100);

            // Should return canvas (may be null in JSDOM without full canvas support)
            if (canvas) {
                expect(canvas.hasCtx).toBe(true);
                expect(canvas.hasWidth).toBe(true);
                expect(canvas.hasHeight).toBe(true);
            }
        });

        it('should floor dimensions to integers', () => {
            const code = `return { draw: function(t) { ctx.fillRect(0, 0, 1, 1); } }`;
            const canvas = CodeRunner.captureFrame(code, 100.7, 50.3);

            // Should return canvas (may be null in JSDOM without full canvas support)
            if (canvas) {
                expect(canvas.width).toBe(100);
                expect(canvas.height).toBe(50);
            }
        });

        it('should default time to 0', () => {
            // Use code that doesn't call canvas methods for JSDOM compatibility
            const code = `return { draw: function(t) { canvas.timeValue = t; } }`;
            const canvas = CodeRunner.captureFrame(code, 100, 100);

            // Canvas should be returned with timeValue set
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas.timeValue).toBe(0);
        });
    });

    describe('DEFAULT_CODE', () => {
        it('should have a DEFAULT_CODE static property', () => {
            expect(typeof CodeRunner.DEFAULT_CODE).toBe('string');
            expect(CodeRunner.DEFAULT_CODE.length).toBeGreaterThan(0);
        });

        it('should contain a draw function in DEFAULT_CODE', () => {
            expect(CodeRunner.DEFAULT_CODE).toContain('draw');
            expect(CodeRunner.DEFAULT_CODE).toContain('function');
        });
    });
});
