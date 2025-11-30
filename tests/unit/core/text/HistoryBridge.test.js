/**
 * HistoryBridge Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HistoryBridge } from '../../../../src/core/text/HistoryBridge.js';

// Mock HistoryManager
vi.mock('../../../../src/core/HistoryManager.js', () => ({
    historyManager: {
        pause: vi.fn(),
        resume: vi.fn(),
        push: vi.fn(),
        pushTextEdit: vi.fn(),
        isPaused: vi.fn(() => false)
    }
}));

import { historyManager } from '../../../../src/core/HistoryManager.js';

describe('HistoryBridge', () => {
    let bridge;
    
    beforeEach(() => {
        vi.clearAllMocks();
        bridge = new HistoryBridge();
    });
    
    afterEach(() => {
        bridge = null;
    });

    describe('constructor', () => {
        it('should initialize with null session', () => {
            expect(bridge.currentSession).toBeNull();
        });
    });

    describe('beginSession', () => {
        it('should create a new editing session', () => {
            bridge.beginSession('text-1', {
                content: 'Initial content',
                inlineStyles: {}
            });
            
            expect(bridge.currentSession).not.toBeNull();
            expect(bridge.currentSession.elementId).toBe('text-1');
        });

        it('should pause the history manager', () => {
            bridge.beginSession('text-1', { content: 'Test' });
            
            expect(historyManager.pause).toHaveBeenCalled();
        });

        it('should store initial state in before property', () => {
            const initialState = {
                content: 'Initial content',
                inlineStyles: { bold: true }
            };
            
            bridge.beginSession('text-1', initialState);
            
            expect(bridge.currentSession.before.content).toBe('Initial content');
        });

        it('should end existing session before starting new one', () => {
            bridge.beginSession('text-1', { content: 'First' });
            bridge.beginSession('text-2', { content: 'Second' });
            
            expect(bridge.currentSession.elementId).toBe('text-2');
        });
    });

    describe('endSession', () => {
        beforeEach(() => {
            bridge.beginSession('text-1', {
                content: 'Initial content',
                inlineStyles: {}
            });
            bridge.markDirty(); // Mark dirty to enable saving
            vi.clearAllMocks();
        });

        it('should end the current session', () => {
            bridge.endSession(true, { content: 'Final content' });
            
            expect(bridge.currentSession).toBeNull();
        });

        it('should resume the history manager', () => {
            bridge.endSession(true, { content: 'Final content' });
            
            expect(historyManager.resume).toHaveBeenCalled();
        });

        it('should push to history when save is true and content changed', () => {
            bridge.endSession(true, {
                content: 'Changed content',
                inlineStyles: {}
            });
            
            expect(historyManager.pushTextEdit).toHaveBeenCalled();
        });

        it('should not push to history when save is false', () => {
            bridge.endSession(false, { content: 'Changed content' });
            
            expect(historyManager.pushTextEdit).not.toHaveBeenCalled();
        });

        it('should not push to history when content unchanged', () => {
            bridge.endSession(true, {
                content: 'Initial content',
                inlineStyles: {}
            });
            
            expect(historyManager.pushTextEdit).not.toHaveBeenCalled();
        });

        it('should return false if no active session', () => {
            bridge.currentSession = null;
            
            const result = bridge.endSession(true, { content: 'Test' });
            
            expect(result).toBe(false);
        });

        it('should return true when dirty session ended with changes', () => {
            const result = bridge.endSession(true, { content: 'New content' });
            
            expect(result).toBe(true);
        });
    });

    describe('cancelSession', () => {
        it('should cancel the session and return before state', () => {
            bridge.beginSession('text-1', { content: 'Initial' });
            vi.clearAllMocks();
            
            const beforeState = bridge.cancelSession();
            
            expect(bridge.currentSession).toBeNull();
            expect(beforeState.content).toBe('Initial');
        });

        it('should return null if no active session', () => {
            const result = bridge.cancelSession();
            
            expect(result).toBeNull();
        });
    });

    describe('isInSession', () => {
        it('should return true when session is active', () => {
            bridge.beginSession('text-1', { content: 'Test' });
            
            expect(bridge.isInSession()).toBe(true);
        });

        it('should return false when no session', () => {
            expect(bridge.isInSession()).toBe(false);
        });
    });

    describe('getSessionElementId', () => {
        it('should return current element ID', () => {
            bridge.beginSession('text-1', { content: 'Test' });
            
            expect(bridge.getSessionElementId()).toBe('text-1');
        });

        it('should return null when no session', () => {
            expect(bridge.getSessionElementId()).toBeNull();
        });
    });

    describe('markDirty', () => {
        it('should mark the session as dirty', () => {
            bridge.beginSession('text-1', { content: 'Test' });
            
            expect(bridge.currentSession.isDirty).toBe(false);
            
            bridge.markDirty();
            
            expect(bridge.currentSession.isDirty).toBe(true);
        });
    });

    describe('hasChanges', () => {
        it('should return true when session is dirty', () => {
            bridge.beginSession('text-1', { content: 'Test' });
            bridge.markDirty();
            
            expect(bridge.hasChanges()).toBe(true);
        });

        it('should return false when session is not dirty', () => {
            bridge.beginSession('text-1', { content: 'Test' });
            
            expect(bridge.hasChanges()).toBe(false);
        });

        it('should return false when no session', () => {
            expect(bridge.hasChanges()).toBe(false);
        });
    });
});
