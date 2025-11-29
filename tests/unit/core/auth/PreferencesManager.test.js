/**
 * Preferences Manager Tests
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
    PreferencesManager, 
    PreferencesEvents,
    getPreferencesManager 
} from '../../../../src/core/auth/preferences/PreferencesManager.js';
import { DEFAULT_PREFERENCES } from '../../../../src/core/auth/preferences/PreferencesSchema.js';

// Mock BroadcastChannel
class MockBroadcastChannel {
    constructor() {
        this.onmessage = null;
    }
    postMessage() {}
    close() {}
}

globalThis.BroadcastChannel = MockBroadcastChannel;

describe('PreferencesManager', () => {
    let manager;
    let mockClaims;

    beforeEach(() => {
        manager = new PreferencesManager();
        mockClaims = {
            sub: 'user-123',
            iss: 'https://login.microsoftonline.com/tenant/v2.0',
            email: 'user@example.com'
        };

        // Clear localStorage
        localStorage.clear();
    });

    afterEach(() => {
        manager.dispose();
    });

    describe('get', () => {
        it('should return defaults when not initialized', () => {
            const prefs = manager.get();
            expect(prefs.theme).toBe(DEFAULT_PREFERENCES.theme);
            expect(prefs.language).toBe(DEFAULT_PREFERENCES.language);
        });

        it('should return copy of preferences', () => {
            const prefs1 = manager.get();
            const prefs2 = manager.get();
            expect(prefs1).not.toBe(prefs2);
        });
    });

    describe('getValue', () => {
        it('should get simple value', async () => {
            await manager.initialize(mockClaims);
            expect(manager.getValue('theme')).toBe(DEFAULT_PREFERENCES.theme);
        });

        it('should get nested value with dot notation', async () => {
            await manager.initialize(mockClaims);
            expect(manager.getValue('gridSettings.size')).toBe(DEFAULT_PREFERENCES.gridSettings.size);
        });

        it('should return default for missing key', async () => {
            await manager.initialize(mockClaims);
            expect(manager.getValue('nonexistent.key', 'fallback')).toBe('fallback');
        });
    });

    describe('setValue', () => {
        it('should set simple value', async () => {
            await manager.initialize(mockClaims);
            manager.setValue('theme', 'dark');
            expect(manager.getValue('theme')).toBe('dark');
        });

        it('should set nested value with dot notation', async () => {
            await manager.initialize(mockClaims);
            manager.setValue('gridSettings.size', 40);
            expect(manager.getValue('gridSettings.size')).toBe(40);
        });

        it('should mark as dirty after setValue', async () => {
            await manager.initialize(mockClaims);
            manager.setValue('theme', 'dark');
            expect(manager.hasUnsavedChanges()).toBe(true);
        });
    });

    describe('update', () => {
        it('should merge partial updates', async () => {
            await manager.initialize(mockClaims);
            manager.update({ theme: 'dark' });
            expect(manager.getValue('theme')).toBe('dark');
            expect(manager.getValue('language')).toBe(DEFAULT_PREFERENCES.language);
        });

        it('should deep merge nested objects', async () => {
            await manager.initialize(mockClaims);
            manager.update({ gridSettings: { gridSize: 40 } });
            expect(manager.getValue('gridSettings.gridSize')).toBe(40);
            expect(manager.getValue('gridSettings.showGrid')).toBe(DEFAULT_PREFERENCES.gridSettings.showGrid);
        });
    });

    describe('subscribe', () => {
        it('should call listener on update', async () => {
            await manager.initialize(mockClaims);
            
            const listener = vi.fn();
            manager.subscribe(listener);
            
            manager.setValue('theme', 'dark');
            
            expect(listener).toHaveBeenCalledWith(
                PreferencesEvents.UPDATED,
                expect.objectContaining({ theme: 'dark' })
            );
        });

        it('should return unsubscribe function', async () => {
            await manager.initialize(mockClaims);
            
            const listener = vi.fn();
            const unsubscribe = manager.subscribe(listener);
            
            unsubscribe();
            manager.setValue('theme', 'dark');
            
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('reset', () => {
        it('should reset to defaults', async () => {
            await manager.initialize(mockClaims);
            manager.setValue('theme', 'dark');
            manager.setValue('language', 'es');
            
            await manager.reset();
            
            expect(manager.getValue('theme')).toBe(DEFAULT_PREFERENCES.theme);
            expect(manager.getValue('language')).toBe(DEFAULT_PREFERENCES.language);
        });
    });

    describe('caching', () => {
        it('should cache preferences locally', async () => {
            await manager.initialize(mockClaims);
            manager.setValue('theme', 'dark');
            
            const cached = localStorage.getItem('story_preferences_cache');
            expect(cached).toBeTruthy();
            
            const parsed = JSON.parse(cached);
            expect(parsed.preferences.theme).toBe('dark');
        });

        it('should load from cache on initialize', async () => {
            // Pre-populate cache
            localStorage.setItem('story_preferences_cache', JSON.stringify({
                preferences: { ...DEFAULT_PREFERENCES, theme: 'dark' },
                timestamp: Date.now()
            }));
            
            await manager.initialize(mockClaims);
            
            expect(manager.getValue('theme')).toBe('dark');
        });
    });

    describe('getPreferencesManager singleton', () => {
        it('should return same instance', () => {
            const manager1 = getPreferencesManager();
            const manager2 = getPreferencesManager();
            expect(manager1).toBe(manager2);
        });
    });

    describe('dispose', () => {
        it('should clean up resources', async () => {
            await manager.initialize(mockClaims);
            manager.dispose();
            
            expect(manager.preferences).toBeNull();
            expect(manager.file).toBeNull();
        });
    });
});
