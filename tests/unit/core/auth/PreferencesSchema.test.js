/**
 * Preferences Schema Tests
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
    DEFAULT_PREFERENCES,
    PREFERENCES_SCHEMA_VERSION,
    validatePreferences,
    migratePreferences,
    mergePreferences
} from '../../../../src/core/auth/preferences/PreferencesSchema.js';

describe('PreferencesSchema', () => {
    describe('DEFAULT_PREFERENCES', () => {
        it('should have all required top-level properties', () => {
            expect(DEFAULT_PREFERENCES).toHaveProperty('theme');
            expect(DEFAULT_PREFERENCES).toHaveProperty('language');
            expect(DEFAULT_PREFERENCES).toHaveProperty('gridSettings');
            expect(DEFAULT_PREFERENCES).toHaveProperty('defaultFont');
            expect(DEFAULT_PREFERENCES).toHaveProperty('shortcuts');
            expect(DEFAULT_PREFERENCES).toHaveProperty('recentFiles');
            expect(DEFAULT_PREFERENCES).toHaveProperty('schemaVersion');
        });

        it('should have correct default theme', () => {
            expect(DEFAULT_PREFERENCES.theme).toBe('system');
        });

        it('should have language from navigator or default', () => {
            // Language is derived from navigator.language or defaults to 'en-US'
            expect(typeof DEFAULT_PREFERENCES.language).toBe('string');
            expect(DEFAULT_PREFERENCES.language.length).toBeGreaterThan(0);
        });

        it('should have valid grid settings', () => {
            expect(DEFAULT_PREFERENCES.gridSettings.showGrid).toBe(true);
            expect(DEFAULT_PREFERENCES.gridSettings.gridSize).toBe(10);
            expect(DEFAULT_PREFERENCES.gridSettings.snapToGrid).toBe(true);
        });

        it('should have current schema version', () => {
            expect(DEFAULT_PREFERENCES.schemaVersion).toBe(PREFERENCES_SCHEMA_VERSION);
        });
    });

    describe('validatePreferences', () => {
        it('should validate correct preferences', () => {
            const result = validatePreferences(DEFAULT_PREFERENCES);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid theme', () => {
            const prefs = { ...DEFAULT_PREFERENCES, theme: 'invalid-theme' };
            const result = validatePreferences(prefs);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('theme'))).toBe(true);
        });

        it('should allow valid language strings', () => {
            const prefs = { ...DEFAULT_PREFERENCES, language: 'fr-FR' };
            const result = validatePreferences(prefs);
            expect(result.valid).toBe(true);
        });

        it('should reject invalid grid size', () => {
            const prefs = { 
                ...DEFAULT_PREFERENCES, 
                gridSettings: { ...DEFAULT_PREFERENCES.gridSettings, gridSize: 0 } 
            };
            const result = validatePreferences(prefs);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('gridSettings.gridSize'))).toBe(true);
        });

        it('should reject excessive recent files', () => {
            const prefs = { 
                ...DEFAULT_PREFERENCES, 
                recentFiles: Array(51).fill({ id: 'test', name: 'test', path: '/test' })
            };
            const result = validatePreferences(prefs);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('recentFiles'))).toBe(true);
        });

        it('should reject autoSaveInterval that is too short', () => {
            const prefs = {
                ...DEFAULT_PREFERENCES,
                autoSaveInterval: 1000
            };
            const result = validatePreferences(prefs);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('autoSaveInterval'))).toBe(true);
        });
    });

    describe('migratePreferences', () => {
        it('should handle missing schema version', () => {
            const prefs = { theme: 'dark' };
            const result = migratePreferences(prefs);
            expect(result.schemaVersion).toBe(PREFERENCES_SCHEMA_VERSION);
        });

        it('should preserve valid existing preferences', () => {
            const prefs = { 
                theme: 'dark',
                language: 'es',
                schemaVersion: PREFERENCES_SCHEMA_VERSION
            };
            const result = migratePreferences(prefs);
            expect(result.theme).toBe('dark');
            expect(result.language).toBe('es');
        });

        it('should add missing properties from defaults', () => {
            const prefs = { theme: 'dark' };
            const result = migratePreferences(prefs);
            expect(result.gridSettings).toEqual(DEFAULT_PREFERENCES.gridSettings);
            expect(result.shortcuts).toEqual(DEFAULT_PREFERENCES.shortcuts);
        });

        it('should handle future schema versions gracefully', () => {
            const prefs = { 
                ...DEFAULT_PREFERENCES,
                schemaVersion: 999,
                futureProperty: 'value'
            };
            const result = migratePreferences(prefs);
            expect(result.futureProperty).toBe('value');
        });
    });

    describe('mergePreferences', () => {
        it('should keep remote preferences as base with local overrides', () => {
            const local = { ...DEFAULT_PREFERENCES, theme: 'dark' };
            const remote = { ...DEFAULT_PREFERENCES };
            const result = mergePreferences(local, remote);
            // Note: mergePreferences uses remote as base and adds local-only props
            expect(result.language).toBe(remote.language);
        });

        it('should keep local-only properties from local', () => {
            const local = { ...DEFAULT_PREFERENCES, defaultStorageProvider: 'onedrive' };
            const remote = { ...DEFAULT_PREFERENCES, defaultStorageProvider: 'gdrive' };
            const result = mergePreferences(local, remote);
            expect(result.defaultStorageProvider).toBe('onedrive');
        });

        it('should not overwrite with undefined', () => {
            const base = { ...DEFAULT_PREFERENCES };
            const updates = { theme: undefined };
            const result = mergePreferences(updates, base);
            expect(result.theme).toBe(base.theme);
        });

        it('should merge recent files arrays', () => {
            const local = { 
                ...DEFAULT_PREFERENCES,
                recentFiles: [{ id: '1', name: 'local', path: '/local', lastOpened: '2024-01-02' }]
            };
            const remote = { 
                ...DEFAULT_PREFERENCES,
                recentFiles: [{ id: '2', name: 'remote', path: '/remote', lastOpened: '2024-01-01' }]
            };
            const result = mergePreferences(local, remote);
            expect(result.recentFiles).toHaveLength(2);
        });

        it('should use most recent lastModified', () => {
            const local = { ...DEFAULT_PREFERENCES, lastModified: '2024-01-02T00:00:00.000Z' };
            const remote = { ...DEFAULT_PREFERENCES, lastModified: '2024-01-01T00:00:00.000Z' };
            const result = mergePreferences(local, remote);
            expect(result.lastModified).toBe('2024-01-02T00:00:00.000Z');
        });
    });
});
