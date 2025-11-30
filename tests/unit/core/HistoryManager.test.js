/**
 * HistoryManager Unit Tests
 * 
 * Tests undo/redo stack management, state snapshots, and history limits.
 * 
 * Note: HistoryManager stores entries as { state, meta } objects.
 * undo() and redo() require the current state as a parameter and return { state, meta }.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryManager } from '../../../src/core/HistoryManager.js';

describe('HistoryManager', () => {
    let historyManager;

    beforeEach(() => {
        historyManager = new HistoryManager();
    });

    describe('Initial State', () => {
        it('should initialize with empty undo stack', () => {
            expect(historyManager.canUndo()).toBe(false);
        });

        it('should initialize with empty redo stack', () => {
            expect(historyManager.canRedo()).toBe(false);
        });

        it('should have a max size of 50 by default', () => {
            expect(historyManager.maxSize).toBe(50);
        });
    });

    describe('push()', () => {
        it('should add a state to the undo stack', () => {
            const state = { test: 'value' };
            historyManager.push(state);
            
            expect(historyManager.canUndo()).toBe(true);
        });

        it('should clear the redo stack when pushing new state', () => {
            const state1 = { version: 1 };
            const state2 = { version: 2 };
            const state3 = { version: 3 };
            
            historyManager.push(state1);
            historyManager.push(state2);
            historyManager.undo(state2); // Now we have something in redo stack
            
            expect(historyManager.canRedo()).toBe(true);
            
            historyManager.push(state3); // Should clear redo stack
            
            expect(historyManager.canRedo()).toBe(false);
        });

        it('should enforce max size limit on undo stack', () => {
            // Push more than maxSize items
            for (let i = 0; i < 60; i++) {
                historyManager.push({ index: i });
            }
            
            // Should have exactly 50 items (maxSize)
            let undoCount = 0;
            let current = { index: 99 };
            while (historyManager.canUndo()) {
                const result = historyManager.undo(current);
                current = result.state;
                undoCount++;
            }
            
            expect(undoCount).toBe(50);
        });

        it('should store state and meta separately', () => {
            const state = { value: 1 };
            const meta = { description: 'test action' };
            
            historyManager.push(state, meta);
            
            const result = historyManager.undo({ value: 2 });
            expect(result.state).toEqual(state);
            expect(result.meta).toEqual(meta);
        });
    });

    describe('undo()', () => {
        it('should return null when undo stack is empty', () => {
            const result = historyManager.undo({ current: true });
            expect(result).toBeNull();
        });

        it('should return the most recent state wrapped in object', () => {
            const state = { test: 'value' };
            historyManager.push(state);
            
            const result = historyManager.undo({ current: true });
            expect(result.state).toEqual(state);
        });

        it('should move current state to redo stack', () => {
            historyManager.push({ version: 1 });
            historyManager.push({ version: 2 });
            
            historyManager.undo({ version: 3 }); // Pass current state
            
            expect(historyManager.canRedo()).toBe(true);
        });

        it('should return states in LIFO order', () => {
            historyManager.push({ version: 1 });
            historyManager.push({ version: 2 });
            historyManager.push({ version: 3 });
            
            expect(historyManager.undo({ current: true }).state).toEqual({ version: 3 });
            expect(historyManager.undo({ current: true }).state).toEqual({ version: 2 });
            expect(historyManager.undo({ current: true }).state).toEqual({ version: 1 });
        });

        it('should update canUndo status after undo', () => {
            historyManager.push({ test: 'value' });
            expect(historyManager.canUndo()).toBe(true);
            
            historyManager.undo({ current: true });
            expect(historyManager.canUndo()).toBe(false);
        });
    });

    describe('redo()', () => {
        it('should return null when redo stack is empty', () => {
            const result = historyManager.redo({ current: true });
            expect(result).toBeNull();
        });

        it('should return the most recently undone state', () => {
            const state = { test: 'value' };
            historyManager.push(state);
            historyManager.undo({ current: true });
            
            const result = historyManager.redo({ new: 'current' });
            expect(result.state).toEqual({ current: true }); // Undo pushed this to redo
        });

        it('should move current state back to undo stack', () => {
            historyManager.push({ version: 1 });
            historyManager.undo({ version: 2 });
            
            expect(historyManager.canUndo()).toBe(false);
            historyManager.redo({ version: 2 });
            expect(historyManager.canUndo()).toBe(true);
        });

        it('should handle multiple undo/redo cycles', () => {
            historyManager.push({ version: 1 });
            historyManager.push({ version: 2 });
            historyManager.push({ version: 3 });
            
            // Undo all - each undo returns the previous state
            const undone1 = historyManager.undo({ version: 4 }); // returns v3
            const undone2 = historyManager.undo(undone1.state); // returns v2
            const undone3 = historyManager.undo(undone2.state); // returns v1
            
            expect(undone1.state).toEqual({ version: 3 });
            expect(undone2.state).toEqual({ version: 2 });
            expect(undone3.state).toEqual({ version: 1 });
            
            // Now redo stack has [v4, v3, v2] (in order of addition)
            // Redo returns in LIFO order
            expect(historyManager.canRedo()).toBe(true);
        });

        it('should update canRedo status after redo', () => {
            historyManager.push({ version: 1 });
            historyManager.undo({ version: 2 });
            expect(historyManager.canRedo()).toBe(true);
            
            historyManager.redo({ version: 1 });
            expect(historyManager.canRedo()).toBe(false);
        });
    });

    describe('canUndo()', () => {
        it('should return false for empty stack', () => {
            expect(historyManager.canUndo()).toBe(false);
        });

        it('should return true when there are items to undo', () => {
            historyManager.push({ test: 'value' });
            expect(historyManager.canUndo()).toBe(true);
        });

        it('should return false after all items are undone', () => {
            historyManager.push({ version: 1 });
            historyManager.push({ version: 2 });
            historyManager.undo({ v: 3 });
            historyManager.undo({ v: 2 });
            
            expect(historyManager.canUndo()).toBe(false);
        });
    });

    describe('canRedo()', () => {
        it('should return false for empty stack', () => {
            expect(historyManager.canRedo()).toBe(false);
        });

        it('should return true after an undo operation', () => {
            historyManager.push({ test: 'value' });
            historyManager.undo({ current: true });
            
            expect(historyManager.canRedo()).toBe(true);
        });

        it('should return false after all items are redone', () => {
            historyManager.push({ version: 1 });
            historyManager.push({ version: 2 });
            let current = { version: 3 };
            current = historyManager.undo(current).state;
            current = historyManager.undo(current).state;
            historyManager.redo(current);
            historyManager.redo({ v: 1 });
            
            expect(historyManager.canRedo()).toBe(false);
        });
    });

    describe('clear()', () => {
        it('should clear the undo stack', () => {
            historyManager.push({ version: 1 });
            historyManager.push({ version: 2 });
            
            historyManager.clear();
            
            expect(historyManager.canUndo()).toBe(false);
        });

        it('should clear the redo stack', () => {
            historyManager.push({ version: 1 });
            historyManager.undo({ current: true });
            
            historyManager.clear();
            
            expect(historyManager.canRedo()).toBe(false);
        });

        it('should handle clearing an already empty manager', () => {
            expect(() => historyManager.clear()).not.toThrow();
            expect(historyManager.canUndo()).toBe(false);
            expect(historyManager.canRedo()).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle pushing null values', () => {
            historyManager.push(null);
            expect(historyManager.canUndo()).toBe(true);
            expect(historyManager.undo({ current: true }).state).toBeNull();
        });

        it('should handle pushing undefined values', () => {
            historyManager.push(undefined);
            expect(historyManager.canUndo()).toBe(true);
            expect(historyManager.undo({ current: true }).state).toBeUndefined();
        });

        it('should handle pushing complex nested objects', () => {
            const complexState = {
                slides: {
                    'slide-1': {
                        elements: {
                            'text-1': { x: 100, y: 200 }
                        }
                    }
                },
                editor: {
                    selectedElementIds: ['text-1']
                }
            };
            
            historyManager.push(complexState);
            const result = historyManager.undo({ current: true });
            
            expect(result.state).toEqual(complexState);
        });

        it('should handle rapid push/undo/redo operations', () => {
            for (let i = 0; i < 100; i++) {
                historyManager.push({ index: i });
            }
            
            let current = { index: 100 };
            for (let i = 0; i < 25; i++) {
                current = historyManager.undo(current).state;
            }
            
            for (let i = 0; i < 10; i++) {
                current = historyManager.redo(current).state;
            }
            
            // Should have 35 undoable items (50 - 25 + 10)
            let count = 0;
            while (historyManager.canUndo()) {
                current = historyManager.undo(current).state;
                count++;
            }
            expect(count).toBe(35);
        });
    });

    describe('pause() and resume()', () => {
        it('should initialize with isPaused = false', () => {
            expect(historyManager.isPausedState()).toBe(false);
        });

        it('should set isPaused to true when pause() is called', () => {
            historyManager.pause();
            expect(historyManager.isPausedState()).toBe(true);
        });

        it('should set isPaused to false when resume() is called', () => {
            historyManager.pause();
            historyManager.resume();
            expect(historyManager.isPausedState()).toBe(false);
        });

        it('should skip recording when paused', () => {
            historyManager.pause();
            historyManager.push({ version: 1 });
            historyManager.push({ version: 2 });
            
            expect(historyManager.canUndo()).toBe(false);
        });

        it('should resume recording after resume() is called', () => {
            historyManager.pause();
            historyManager.push({ version: 1 }); // Should be skipped
            historyManager.resume();
            historyManager.push({ version: 2 }); // Should be recorded
            
            expect(historyManager.canUndo()).toBe(true);
            const result = historyManager.undo({ current: true });
            expect(result.state).toEqual({ version: 2 });
        });

        it('should handle multiple pause/resume cycles', () => {
            historyManager.push({ version: 1 });
            historyManager.pause();
            historyManager.push({ version: 2 }); // Skipped
            historyManager.resume();
            historyManager.push({ version: 3 });
            historyManager.pause();
            historyManager.push({ version: 4 }); // Skipped
            historyManager.resume();
            historyManager.push({ version: 5 });
            
            // Should have versions 1, 3, 5
            let current = { current: true };
            const result1 = historyManager.undo(current);
            expect(result1.state).toEqual({ version: 5 });
            
            const result2 = historyManager.undo(result1.state);
            expect(result2.state).toEqual({ version: 3 });
            
            const result3 = historyManager.undo(result2.state);
            expect(result3.state).toEqual({ version: 1 });
        });
    });

    describe('Text Edit Entries', () => {
        describe('pushTextEdit()', () => {
            it('should push a text-edit entry to the undo stack', () => {
                historyManager.pushTextEdit({
                    elementId: 'text-1',
                    before: { content: 'Hello' },
                    after: { content: 'Hello World' }
                });
                
                expect(historyManager.canUndo()).toBe(true);
            });

            it('should store the correct entry structure', () => {
                historyManager.pushTextEdit({
                    elementId: 'text-1',
                    before: { content: 'Hello', inlineStyles: {} },
                    after: { content: 'Hello World', inlineStyles: { bold: true } },
                    description: 'Edit title'
                });
                
                const result = historyManager.undo({ current: true });
                expect(result.meta.type).toBe('text-edit');
                expect(result.meta.elementId).toBe('text-1');
                expect(result.meta.before).toEqual({ content: 'Hello', inlineStyles: {} });
                expect(result.meta.after).toEqual({ content: 'Hello World', inlineStyles: { bold: true } });
                expect(result.meta.description).toBe('Edit title');
                expect(result.meta.timestamp).toBeDefined();
            });

            it('should use default description if not provided', () => {
                historyManager.pushTextEdit({
                    elementId: 'text-1',
                    before: { content: '' },
                    after: { content: 'New text' }
                });
                
                const result = historyManager.undo({ current: true });
                expect(result.meta.description).toBe('Edit text');
            });

            it('should clear redo stack when pushing text edit', () => {
                historyManager.push({ version: 1 });
                historyManager.undo({ version: 2 });
                expect(historyManager.canRedo()).toBe(true);
                
                historyManager.pushTextEdit({
                    elementId: 'text-1',
                    before: { content: '' },
                    after: { content: 'Text' }
                });
                
                expect(historyManager.canRedo()).toBe(false);
            });

            it('should enforce max size limit', () => {
                // Push maxSize items
                for (let i = 0; i < 50; i++) {
                    historyManager.pushTextEdit({
                        elementId: `text-${i}`,
                        before: { content: '' },
                        after: { content: `Content ${i}` }
                    });
                }
                
                // Push one more
                historyManager.pushTextEdit({
                    elementId: 'text-final',
                    before: { content: '' },
                    after: { content: 'Final' }
                });
                
                // Count should still be maxSize
                let count = 0;
                let current = { current: true };
                while (historyManager.canUndo()) {
                    current = historyManager.undo(current).state || current;
                    count++;
                }
                expect(count).toBe(50);
            });
        });

        describe('isTextEditEntry()', () => {
            it('should return true for text-edit entries', () => {
                historyManager.pushTextEdit({
                    elementId: 'text-1',
                    before: { content: '' },
                    after: { content: 'Text' }
                });
                
                const result = historyManager.undo({ current: true });
                expect(historyManager.isTextEditEntry(result)).toBe(true);
            });

            it('should return false for regular state entries', () => {
                historyManager.push({ version: 1 });
                
                const result = historyManager.undo({ current: true });
                expect(historyManager.isTextEditEntry(result)).toBe(false);
            });

            it('should return false for null', () => {
                expect(historyManager.isTextEditEntry(null)).toBe(false);
            });

            it('should return false for undefined', () => {
                expect(historyManager.isTextEditEntry(undefined)).toBe(false);
            });
        });

        describe('Entry Handlers', () => {
            it('should have a default text-edit handler registered', () => {
                const handler = historyManager.getEntryHandler('text-edit');
                expect(handler).toBeDefined();
                expect(typeof handler.apply).toBe('function');
            });

            it('should return before content on undo', () => {
                const handler = historyManager.getEntryHandler('text-edit');
                const entry = {
                    before: { content: 'Original' },
                    after: { content: 'Modified' }
                };
                
                const result = handler.apply(entry, 'undo');
                expect(result).toEqual({ content: 'Original' });
            });

            it('should return after content on redo', () => {
                const handler = historyManager.getEntryHandler('text-edit');
                const entry = {
                    before: { content: 'Original' },
                    after: { content: 'Modified' }
                };
                
                const result = handler.apply(entry, 'redo');
                expect(result).toEqual({ content: 'Modified' });
            });

            it('should allow registering custom entry handlers', () => {
                const customHandler = {
                    apply: (entry, direction) => ({ custom: true, direction })
                };
                
                historyManager.registerEntryHandler('custom-type', customHandler);
                
                const handler = historyManager.getEntryHandler('custom-type');
                expect(handler).toBe(customHandler);
            });

            it('should return null for unknown entry types', () => {
                const handler = historyManager.getEntryHandler('unknown-type');
                expect(handler).toBeNull();
            });
        });

        describe('Mixed Entry Types', () => {
            it('should handle mix of regular and text-edit entries', () => {
                historyManager.push({ version: 1 });
                historyManager.pushTextEdit({
                    elementId: 'text-1',
                    before: { content: '' },
                    after: { content: 'Hello' }
                });
                historyManager.push({ version: 2 });
                
                let current = { version: 3 };
                
                // Undo version 2 (regular)
                const result1 = historyManager.undo(current);
                expect(result1.state).toEqual({ version: 2 });
                expect(historyManager.isTextEditEntry(result1)).toBe(false);
                
                // Undo text edit
                const result2 = historyManager.undo(result1.state);
                expect(historyManager.isTextEditEntry(result2)).toBe(true);
                expect(result2.meta.elementId).toBe('text-1');
                
                // Undo version 1 (regular)
                const result3 = historyManager.undo(result2.state);
                expect(result3.state).toEqual({ version: 1 });
                expect(historyManager.isTextEditEntry(result3)).toBe(false);
            });
        });
    });
});