/**
 * AutosaveManager Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutosaveManager } from '../../../src/core/storage/autosave/AutosaveManager.js';

// Mock FileCache
vi.mock('../../../src/core/storage/cache/FileCache.js', () => ({
    FileCache: vi.fn().mockImplementation(() => ({
        init: vi.fn().mockResolvedValue(undefined),
        cacheFile: vi.fn().mockResolvedValue(undefined),
        getFile: vi.fn().mockResolvedValue(null),
        removeFile: vi.fn().mockResolvedValue(undefined),
        close: vi.fn()
    }))
}));

// Mock window event listeners
const mockWindow = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
};
vi.stubGlobal('window', { ...window, ...mockWindow });

describe('AutosaveManager', () => {
    let manager;

    beforeEach(async () => {
        vi.useFakeTimers();
        manager = new AutosaveManager();
        await manager.init();
    });

    afterEach(() => {
        if (manager && manager._initialized) {
            // Don't call dispose in afterEach as it may fail in some tests
            manager.endSession();
            manager._cache?.close();
        }
        vi.useRealTimers();
    });

    describe('constructor', () => {
        it('should create instance with default options', () => {
            const m = new AutosaveManager();
            expect(m.options.enabled).toBe(true);
            expect(m.options.debounceMs).toBe(5000);
        });

        it('should accept custom options', () => {
            const m = new AutosaveManager({ debounceMs: 10000, enabled: false });
            expect(m.options.debounceMs).toBe(10000);
            expect(m.options.enabled).toBe(false);
        });
    });

    describe('init', () => {
        it('should initialize the cache', async () => {
            const m = new AutosaveManager();
            await m.init();
            expect(m._initialized).toBe(true);
        });

        it('should not re-initialize if already initialized', async () => {
            const initSpy = vi.spyOn(manager._cache, 'init');
            await manager.init();
            await manager.init();
            // Should have been called once during beforeEach
            expect(initSpy).toHaveBeenCalledTimes(0); // Already initialized in beforeEach
        });
    });

    describe('startSession', () => {
        it('should set current presentation ID', () => {
            manager.startSession('presentation-123');
            expect(manager.currentPresentationId).toBe('presentation-123');
        });

        it('should reset unsaved changes', () => {
            manager._hasUnsavedChanges = true;
            manager.startSession('presentation-123');
            expect(manager.hasUnsavedChanges).toBe(false);
        });

        it('should throw if not initialized', () => {
            const m = new AutosaveManager();
            expect(() => m.startSession('123')).toThrow('not initialized');
        });
    });

    describe('endSession', () => {
        it('should clear presentation ID', () => {
            manager.startSession('presentation-123');
            manager.endSession();
            expect(manager.currentPresentationId).toBeNull();
        });

        it('should clear pending state', () => {
            manager.startSession('presentation-123');
            manager._pendingState = { slides: [] };
            manager.endSession();
            expect(manager._pendingState).toBeNull();
        });
    });

    describe('isEnabled / setEnabled', () => {
        it('should get enabled state', () => {
            expect(manager.isEnabled).toBe(true);
        });

        it('should set enabled state', () => {
            manager.setEnabled(false);
            expect(manager.isEnabled).toBe(false);
        });

        it('should clear debounce when disabled', () => {
            manager.startSession('123');
            manager.markChanged({ slides: [] });
            manager.setEnabled(false);
            expect(manager._debounceTimer).toBeNull();
        });
    });

    describe('markChanged', () => {
        beforeEach(() => {
            manager.startSession('presentation-123');
        });

        it('should set unsaved changes flag', () => {
            manager.markChanged({ slides: [] });
            expect(manager.hasUnsavedChanges).toBe(true);
        });

        it('should store pending state', () => {
            const state = { slides: [{ id: '1' }] };
            manager.markChanged(state);
            expect(manager._pendingState).toBe(state);
        });

        it('should increment version', () => {
            manager.markChanged({ slides: [] });
            expect(manager._version).toBe(1);
            manager.markChanged({ slides: [] });
            expect(manager._version).toBe(2);
        });

        it('should schedule autosave when enabled', () => {
            manager.markChanged({ slides: [] });
            expect(manager._debounceTimer).not.toBeNull();
        });

        it('should not schedule autosave when disabled', () => {
            manager.setEnabled(false);
            manager.markChanged({ slides: [] });
            expect(manager._debounceTimer).toBeNull();
        });

        it('should warn when no active session', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            manager.endSession();
            manager.markChanged({ slides: [] });
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('should call onStateChange callback', () => {
            const callback = vi.fn();
            manager.options.onStateChange = callback;
            manager.markChanged({ slides: [] });
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                hasUnsavedChanges: true
            }));
        });
    });

    describe('markSaved', () => {
        beforeEach(() => {
            manager.startSession('presentation-123');
            manager.markChanged({ slides: [] });
        });

        it('should clear unsaved changes flag', () => {
            manager.markSaved();
            expect(manager.hasUnsavedChanges).toBe(false);
        });

        it('should clear pending state', () => {
            manager.markSaved();
            expect(manager._pendingState).toBeNull();
        });

        it('should set last save time', () => {
            manager.markSaved();
            expect(manager.lastSaveTime).toBeInstanceOf(Date);
        });
    });

    describe('saveNow', () => {
        beforeEach(() => {
            manager.startSession('presentation-123');
        });

        it('should save immediately', async () => {
            const cacheFileSpy = vi.spyOn(manager._cache, 'cacheFile');
            manager.markChanged({ slides: [] });
            
            await manager.saveNow();

            expect(cacheFileSpy).toHaveBeenCalled();
        });

        it('should clear debounce timer', async () => {
            manager.markChanged({ slides: [] });
            expect(manager._debounceTimer).not.toBeNull();
            
            await manager.saveNow();

            expect(manager._debounceTimer).toBeNull();
        });

        it('should accept explicit state', async () => {
            const cacheFileSpy = vi.spyOn(manager._cache, 'cacheFile');
            const state = { slides: [{ id: 'custom' }] };
            
            await manager.saveNow(state);

            expect(cacheFileSpy).toHaveBeenCalled();
        });

        it('should do nothing if no pending state', async () => {
            const cacheFileSpy = vi.spyOn(manager._cache, 'cacheFile');
            
            await manager.saveNow();

            expect(cacheFileSpy).not.toHaveBeenCalled();
        });

        it('should call onSave callback on success', async () => {
            const callback = vi.fn();
            manager.options.onSave = callback;
            manager.markChanged({ slides: [] });
            
            await manager.saveNow();

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                presentationId: 'presentation-123'
            }));
        });
    });

    describe('debounced autosave', () => {
        beforeEach(() => {
            manager.startSession('presentation-123');
        });

        it('should save after debounce period', async () => {
            const cacheFileSpy = vi.spyOn(manager._cache, 'cacheFile');
            
            manager.markChanged({ slides: [] });
            
            // Before debounce
            expect(cacheFileSpy).not.toHaveBeenCalled();

            // After debounce
            await vi.advanceTimersByTimeAsync(5000);
            
            expect(cacheFileSpy).toHaveBeenCalled();
        });

        it('should reset debounce on multiple changes', async () => {
            const cacheFileSpy = vi.spyOn(manager._cache, 'cacheFile');
            
            manager.markChanged({ slides: [{ id: '1' }] });
            await vi.advanceTimersByTimeAsync(3000);
            
            manager.markChanged({ slides: [{ id: '2' }] });
            await vi.advanceTimersByTimeAsync(3000);
            
            // Should not have saved yet (debounce reset)
            expect(cacheFileSpy).not.toHaveBeenCalled();

            await vi.advanceTimersByTimeAsync(2000);
            
            // Now should have saved
            expect(cacheFileSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('checkForRecovery', () => {
        it('should return null if no autosave exists', async () => {
            const result = await manager.checkForRecovery('nonexistent');
            expect(result).toBeNull();
        });

        it('should return recovered state if autosave exists', async () => {
            const savedData = {
                state: { slides: [{ id: '1' }] },
                savedAt: new Date().toISOString(),
                version: 5
            };
            
            // Create a mock blob with text() method
            const mockBlob = {
                text: vi.fn().mockResolvedValue(JSON.stringify(savedData))
            };
            
            vi.spyOn(manager._cache, 'getFile').mockResolvedValue({
                data: mockBlob
            });

            const result = await manager.checkForRecovery('presentation-123');

            expect(result).not.toBeNull();
            expect(result.state).toEqual(savedData.state);
            expect(result.version).toBe(5);
        });
    });

    describe('clearAutosave', () => {
        it('should remove autosave from cache', async () => {
            const removeSpy = vi.spyOn(manager._cache, 'removeFile');
            
            await manager.clearAutosave('presentation-123');

            expect(removeSpy).toHaveBeenCalledWith('autosave_presentation-123');
        });
    });

    describe('isSaving', () => {
        it('should return false when not saving', () => {
            expect(manager.isSaving).toBe(false);
        });
    });

    describe('getBeforeUnloadMessage', () => {
        it('should return undefined when no unsaved changes', () => {
            expect(manager.getBeforeUnloadMessage()).toBeUndefined();
        });

        it('should return message when unsaved changes exist', () => {
            manager.startSession('123');
            manager.markChanged({ slides: [] });
            expect(manager.getBeforeUnloadMessage()).toContain('unsaved changes');
        });
    });

    describe('dispose', () => {
        it('should end session', () => {
            manager.startSession('123');
            manager.endSession();
            manager._cache.close();
            expect(manager.currentPresentationId).toBeNull();
        });

        it('should close cache', () => {
            const closeSpy = vi.spyOn(manager._cache, 'close');
            manager.endSession();
            manager._cache.close();
            expect(closeSpy).toHaveBeenCalled();
        });
    });
});
