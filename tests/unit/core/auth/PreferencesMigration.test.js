/**
 * Preferences Migration Tests
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
    PreferencesMigration 
} from '../../../../src/core/auth/preferences/PreferencesMigration.js';
import { DEFAULT_PREFERENCES } from '../../../../src/core/auth/preferences/PreferencesSchema.js';

describe('PreferencesMigration', () => {
    let migration;

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        migration = new PreferencesMigration();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('needsMigration', () => {
        it('should return false when no legacy keys exist', () => {
            expect(migration.needsMigration()).toBe(false);
        });

        it('should return true when legacy keys exist', () => {
            localStorage.setItem('story_theme', 'dark');
            expect(migration.needsMigration()).toBe(true);
        });

        it('should return false when already migrated', () => {
            localStorage.setItem('story_preferences_migrated', 'true');
            localStorage.setItem('story_theme', 'dark');
            expect(migration.needsMigration()).toBe(false);
        });
    });

    describe('collectFromLocalStorage', () => {
        it('should collect theme preference', () => {
            localStorage.setItem('story_theme', 'dark');
            const prefs = migration.collectFromLocalStorage();
            expect(prefs.theme).toBe('dark');
        });

        it('should collect language preference', () => {
            localStorage.setItem('story_language', 'es-ES');
            const prefs = migration.collectFromLocalStorage();
            expect(prefs.language).toBe('es-ES');
        });

        it('should collect grid settings', () => {
            localStorage.setItem('story_grid_settings', JSON.stringify({ 
                showGrid: false, 
                gridSize: 20 
            }));
            const prefs = migration.collectFromLocalStorage();
            expect(prefs.gridSettings.showGrid).toBe(false);
            expect(prefs.gridSettings.gridSize).toBe(20);
        });

        it('should collect recent files', () => {
            const recentFiles = [
                { id: '1', name: 'File 1' },
                { id: '2', name: 'File 2' }
            ];
            localStorage.setItem('story_recent_files', JSON.stringify(recentFiles));
            const prefs = migration.collectFromLocalStorage();
            expect(prefs.recentFiles).toHaveLength(2);
        });

        it('should limit recent files to 20', () => {
            const recentFiles = Array(25).fill({ id: 'x', name: 'File' });
            localStorage.setItem('story_recent_files', JSON.stringify(recentFiles));
            const prefs = migration.collectFromLocalStorage();
            expect(prefs.recentFiles).toHaveLength(20);
        });

        it('should collect shortcuts', () => {
            localStorage.setItem('story_shortcuts', JSON.stringify({ 
                'ctrl+s': 'save',
                'ctrl+z': 'undo'
            }));
            const prefs = migration.collectFromLocalStorage();
            expect(prefs.shortcuts['ctrl+s']).toBe('save');
        });

        it('should handle invalid JSON gracefully', () => {
            localStorage.setItem('story_grid_settings', 'invalid json');
            const prefs = migration.collectFromLocalStorage();
            // Should return defaults
            expect(prefs.gridSettings).toEqual(DEFAULT_PREFERENCES.gridSettings);
        });

        it('should ignore invalid theme values', () => {
            localStorage.setItem('story_theme', 'invalid-theme');
            const prefs = migration.collectFromLocalStorage();
            expect(prefs.theme).toBe(DEFAULT_PREFERENCES.theme);
        });
    });

    describe('createBackup', () => {
        it('should create backup of legacy keys', () => {
            localStorage.setItem('story_theme', 'dark');
            localStorage.setItem('story_language', 'es');
            
            migration.createBackup();
            
            const backup = JSON.parse(localStorage.getItem('story_preferences_backup'));
            expect(backup.data.THEME).toBe('dark');
            expect(backup.data.LANGUAGE).toBe('es');
            expect(backup.timestamp).toBeTruthy();
        });

        it('should not create backup if no legacy keys', () => {
            migration.createBackup();
            expect(localStorage.getItem('story_preferences_backup')).toBeNull();
        });
    });

    describe('restoreBackup', () => {
        it('should restore backup data', () => {
            localStorage.setItem('story_preferences_backup', JSON.stringify({
                timestamp: '2024-01-01',
                data: { THEME: 'dark', LANGUAGE: 'es' }
            }));
            
            const result = migration.restoreBackup();
            
            expect(result).toBe(true);
            expect(localStorage.getItem('story_theme')).toBe('dark');
            expect(localStorage.getItem('story_language')).toBe('es');
        });

        it('should return false when no backup exists', () => {
            const result = migration.restoreBackup();
            expect(result).toBe(false);
        });

        it('should clear migration flag on restore', () => {
            localStorage.setItem('story_preferences_migrated', 'true');
            localStorage.setItem('story_preferences_backup', JSON.stringify({
                timestamp: '2024-01-01',
                data: { THEME: 'dark' }
            }));
            
            migration.restoreBackup();
            
            expect(localStorage.getItem('story_preferences_migrated')).toBeNull();
        });
    });

    describe('clearLegacyKeys', () => {
        it('should remove all legacy keys', () => {
            localStorage.setItem('story_theme', 'dark');
            localStorage.setItem('story_language', 'es');
            localStorage.setItem('story_grid_settings', '{}');
            
            migration.clearLegacyKeys();
            
            expect(localStorage.getItem('story_theme')).toBeNull();
            expect(localStorage.getItem('story_language')).toBeNull();
            expect(localStorage.getItem('story_grid_settings')).toBeNull();
        });
    });

    describe('migrate', () => {
        it('should perform full migration', () => {
            localStorage.setItem('story_theme', 'dark');
            localStorage.setItem('story_language', 'fr');
            
            const prefs = migration.migrate();
            
            expect(prefs.theme).toBe('dark');
            expect(prefs.language).toBe('fr');
            expect(prefs.lastModified).toBeTruthy();
        });

        it('should clear legacy keys by default', () => {
            localStorage.setItem('story_theme', 'dark');
            
            migration.migrate();
            
            expect(localStorage.getItem('story_theme')).toBeNull();
        });

        it('should keep legacy keys when clearLegacy=false', () => {
            localStorage.setItem('story_theme', 'dark');
            
            migration.migrate({ clearLegacy: false });
            
            expect(localStorage.getItem('story_theme')).toBe('dark');
        });

        it('should mark migration as complete', () => {
            localStorage.setItem('story_theme', 'dark');
            
            migration.migrate();
            
            expect(migration.isMigrationComplete()).toBe(true);
        });

        it('should return null if no migration needed', () => {
            const result = migration.migrate();
            expect(result).toBeNull();
        });

        it('should create backup before migration', () => {
            localStorage.setItem('story_theme', 'dark');
            
            migration.migrate();
            
            expect(localStorage.getItem('story_preferences_backup')).toBeTruthy();
        });
    });

    describe('getBackupInfo', () => {
        it('should return backup info when backup exists', () => {
            localStorage.setItem('story_preferences_backup', JSON.stringify({
                timestamp: '2024-01-01T00:00:00.000Z',
                data: { THEME: 'dark', LANGUAGE: 'es' }
            }));
            
            const info = migration.getBackupInfo();
            
            expect(info.timestamp).toBe('2024-01-01T00:00:00.000Z');
            expect(info.keyCount).toBe(2);
        });

        it('should return null when no backup exists', () => {
            const info = migration.getBackupInfo();
            expect(info).toBeNull();
        });
    });

    describe('clearBackup', () => {
        it('should remove backup data', () => {
            localStorage.setItem('story_preferences_backup', '{}');
            
            migration.clearBackup();
            
            expect(localStorage.getItem('story_preferences_backup')).toBeNull();
        });
    });

    describe('isMigrationComplete', () => {
        it('should return true when migration is complete', () => {
            localStorage.setItem('story_preferences_migrated', 'true');
            expect(migration.isMigrationComplete()).toBe(true);
        });

        it('should return false when migration is not complete', () => {
            expect(migration.isMigrationComplete()).toBe(false);
        });
    });
});
