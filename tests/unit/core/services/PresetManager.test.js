import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const mockStorage = new Map();
const mockLocalStorage = {
    getItem: vi.fn((key) => mockStorage.get(key) ?? null),
    setItem: vi.fn((key, value) => mockStorage.set(key, value)),
    removeItem: vi.fn((key) => mockStorage.delete(key)),
    clear: vi.fn(() => mockStorage.clear())
};
vi.stubGlobal('localStorage', mockLocalStorage);

// Use vi.hoisted to declare mocks that work with hoisted vi.mock
const { mockGetBuiltInPresets } = vi.hoisted(() => ({
    mockGetBuiltInPresets: vi.fn(() => [
        { id: 'builtin-1', name: 'Gradient', category: 'backgrounds', code: 'gradient code' },
        { id: 'builtin-2', name: 'Pattern', category: 'patterns', code: 'pattern code' }
    ])
}));

// Mock dependencies
vi.mock('../../../../src/core/constants/CodeFillPresets.js', () => ({
    CODEFILL_PRESETS: {
        'builtin-1': { id: 'builtin-1', name: 'Gradient', category: 'backgrounds', code: 'gradient code' },
        'builtin-2': { id: 'builtin-2', name: 'Pattern', category: 'patterns', code: 'pattern code' }
    },
    getBuiltInPresets: mockGetBuiltInPresets
}));

import { PresetManager } from '../../../../src/core/services/PresetManager.js';

describe('PresetManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getBuiltInPresets()', () => {
        it('should return built-in presets', () => {
            const presets = PresetManager.getBuiltInPresets();
            
            expect(Array.isArray(presets)).toBe(true);
            expect(presets.length).toBeGreaterThan(0);
        });

        it('should include preset with id', () => {
            const presets = PresetManager.getBuiltInPresets();
            
            expect(presets[0]).toHaveProperty('id');
        });

        it('should include preset with name', () => {
            const presets = PresetManager.getBuiltInPresets();
            
            expect(presets[0]).toHaveProperty('name');
        });

        it('should include preset with category', () => {
            const presets = PresetManager.getBuiltInPresets();
            
            expect(presets[0]).toHaveProperty('category');
        });

        it('should include preset with code', () => {
            const presets = PresetManager.getBuiltInPresets();
            
            expect(presets[0]).toHaveProperty('code');
        });
    });

    describe('getUserPresets()', () => {
        it('should return empty array when no presets saved', () => {
            const presets = PresetManager.getUserPresets();
            
            expect(presets).toEqual([]);
        });

        it('should return saved user presets', () => {
            const savedPresets = [{ id: 'user-1', name: 'My Preset', code: 'code' }];
            mockStorage.set('story-codefill-presets', JSON.stringify(savedPresets));
            
            const presets = PresetManager.getUserPresets();
            
            expect(presets).toHaveLength(1);
            expect(presets[0].name).toBe('My Preset');
        });

        it('should return empty array on parse error', () => {
            mockStorage.set('story-codefill-presets', 'invalid json');
            
            const presets = PresetManager.getUserPresets();
            
            expect(presets).toEqual([]);
        });
    });

    describe('getAllPresets()', () => {
        it('should combine built-in and user presets', () => {
            const userPresets = [{ id: 'user-1', name: 'My Preset', code: 'code' }];
            mockStorage.set('story-codefill-presets', JSON.stringify(userPresets));
            
            const all = PresetManager.getAllPresets();
            
            expect(all.length).toBeGreaterThan(1);
        });

        it('should include built-in presets first', () => {
            const all = PresetManager.getAllPresets();
            
            expect(all[0].id).toBe('builtin-1');
        });
    });

    describe('saveUserPreset()', () => {
        it('should save preset to localStorage', () => {
            const preset = { name: 'Test Preset', code: 'test code', description: 'Test' };
            
            PresetManager.saveUserPreset(preset);
            
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        it('should generate id if not provided', () => {
            const preset = { name: 'Test Preset', code: 'test code' };
            
            const saved = PresetManager.saveUserPreset(preset);
            
            expect(saved.id).toMatch(/^user-/);
        });

        it('should use provided id', () => {
            const preset = { id: 'custom-id', name: 'Test', code: 'code' };
            
            const saved = PresetManager.saveUserPreset(preset);
            
            expect(saved.id).toBe('custom-id');
        });

        it('should set category to user', () => {
            const preset = { name: 'Test Preset', code: 'test code' };
            
            const saved = PresetManager.saveUserPreset(preset);
            
            expect(saved.category).toBe('user');
        });

        it('should add createdAt timestamp', () => {
            const preset = { name: 'Test Preset', code: 'test code' };
            
            const saved = PresetManager.saveUserPreset(preset);
            
            expect(saved.createdAt).toBeDefined();
            expect(typeof saved.createdAt).toBe('number');
        });

        it('should add updatedAt timestamp', () => {
            const preset = { name: 'Test Preset', code: 'test code' };
            
            const saved = PresetManager.saveUserPreset(preset);
            
            expect(saved.updatedAt).toBeDefined();
        });

        it('should return saved preset', () => {
            const preset = { name: 'Test Preset', code: 'test code' };
            
            const saved = PresetManager.saveUserPreset(preset);
            
            expect(saved.name).toBe('Test Preset');
            expect(saved.code).toBe('test code');
        });
    });

    describe('updateUserPreset()', () => {
        beforeEach(() => {
            const userPresets = [{ id: 'user-1', name: 'Original', code: 'old code' }];
            mockStorage.set('story-codefill-presets', JSON.stringify(userPresets));
        });

        it('should update existing preset', () => {
            const updated = PresetManager.updateUserPreset('user-1', { name: 'Updated' });
            
            expect(updated.name).toBe('Updated');
        });

        it('should preserve other properties', () => {
            const updated = PresetManager.updateUserPreset('user-1', { name: 'Updated' });
            
            expect(updated.code).toBe('old code');
        });

        it('should update updatedAt timestamp', () => {
            const before = Date.now();
            const updated = PresetManager.updateUserPreset('user-1', { name: 'Updated' });
            
            expect(updated.updatedAt).toBeGreaterThanOrEqual(before);
        });

        it('should return null for non-existent preset', () => {
            const result = PresetManager.updateUserPreset('non-existent', { name: 'Test' });
            
            expect(result).toBeNull();
        });

        it('should save to localStorage', () => {
            PresetManager.updateUserPreset('user-1', { name: 'Updated' });
            
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('deleteUserPreset()', () => {
        beforeEach(() => {
            const userPresets = [
                { id: 'user-1', name: 'Preset 1', code: 'code 1' },
                { id: 'user-2', name: 'Preset 2', code: 'code 2' }
            ];
            mockStorage.set('story-codefill-presets', JSON.stringify(userPresets));
        });

        it('should delete existing preset', () => {
            const result = PresetManager.deleteUserPreset('user-1');
            
            expect(result).toBe(true);
        });

        it('should remove preset from storage', () => {
            PresetManager.deleteUserPreset('user-1');
            
            const remaining = PresetManager.getUserPresets();
            expect(remaining).toHaveLength(1);
            expect(remaining[0].id).toBe('user-2');
        });

        it('should return false for non-existent preset', () => {
            const result = PresetManager.deleteUserPreset('non-existent');
            
            expect(result).toBe(false);
        });

        it('should save to localStorage', () => {
            PresetManager.deleteUserPreset('user-1');
            
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('isNameTaken()', () => {
        beforeEach(() => {
            const userPresets = [{ id: 'user-1', name: 'Existing', code: 'code' }];
            mockStorage.set('story-codefill-presets', JSON.stringify(userPresets));
        });

        it('should return true for taken name', () => {
            expect(PresetManager.isNameTaken('Existing')).toBe(true);
        });

        it('should be case-insensitive', () => {
            expect(PresetManager.isNameTaken('existing')).toBe(true);
            expect(PresetManager.isNameTaken('EXISTING')).toBe(true);
        });

        it('should return false for available name', () => {
            expect(PresetManager.isNameTaken('New Name')).toBe(false);
        });

        it('should exclude specified id', () => {
            expect(PresetManager.isNameTaken('Existing', 'user-1')).toBe(false);
        });

        it('should check built-in preset names', () => {
            expect(PresetManager.isNameTaken('Gradient')).toBe(true);
        });
    });

    describe('getPresetById()', () => {
        beforeEach(() => {
            const userPresets = [{ id: 'user-1', name: 'User Preset', code: 'code' }];
            mockStorage.set('story-codefill-presets', JSON.stringify(userPresets));
        });

        it('should find built-in preset', () => {
            const preset = PresetManager.getPresetById('builtin-1');
            
            expect(preset).toBeDefined();
            expect(preset.name).toBe('Gradient');
        });

        it('should find user preset', () => {
            const preset = PresetManager.getPresetById('user-1');
            
            expect(preset).toBeDefined();
            expect(preset.name).toBe('User Preset');
        });

        it('should return undefined for non-existent id', () => {
            const preset = PresetManager.getPresetById('non-existent');
            
            expect(preset).toBeUndefined();
        });
    });

    describe('duplicatePreset()', () => {
        beforeEach(() => {
            const userPresets = [{ id: 'user-1', name: 'Original', description: 'Desc', code: 'code' }];
            mockStorage.set('story-codefill-presets', JSON.stringify(userPresets));
        });

        it('should create copy of preset', () => {
            const copy = PresetManager.duplicatePreset('user-1');
            
            expect(copy).toBeDefined();
            expect(copy.code).toBe('code');
        });

        it('should append Copy to name', () => {
            const copy = PresetManager.duplicatePreset('user-1');
            
            expect(copy.name).toBe('Original Copy');
        });

        it('should increment copy number if name taken', () => {
            PresetManager.duplicatePreset('user-1'); // Creates "Original Copy"
            const copy2 = PresetManager.duplicatePreset('user-1'); // Should be "Original Copy 2"
            
            expect(copy2.name).toBe('Original Copy 2');
        });

        it('should return null for non-existent preset', () => {
            const result = PresetManager.duplicatePreset('non-existent');
            
            expect(result).toBeNull();
        });

        it('should duplicate built-in preset', () => {
            const copy = PresetManager.duplicatePreset('builtin-1');
            
            expect(copy).toBeDefined();
            expect(copy.category).toBe('user');
        });
    });

    describe('exportPresets()', () => {
        beforeEach(() => {
            const userPresets = [
                { id: 'user-1', name: 'Preset 1', code: 'code 1' },
                { id: 'user-2', name: 'Preset 2', code: 'code 2' }
            ];
            mockStorage.set('story-codefill-presets', JSON.stringify(userPresets));
        });

        it('should return JSON string', () => {
            const exported = PresetManager.exportPresets();
            
            expect(typeof exported).toBe('string');
            expect(() => JSON.parse(exported)).not.toThrow();
        });

        it('should export all user presets by default', () => {
            const exported = PresetManager.exportPresets();
            const parsed = JSON.parse(exported);
            
            expect(parsed).toHaveLength(2);
        });

        it('should export specific presets when ids provided', () => {
            const exported = PresetManager.exportPresets(['user-1']);
            const parsed = JSON.parse(exported);
            
            expect(parsed).toHaveLength(1);
            expect(parsed[0].id).toBe('user-1');
        });

        it('should format JSON with indentation', () => {
            const exported = PresetManager.exportPresets();
            
            expect(exported).toContain('\n');
        });
    });

    describe('importPresets()', () => {
        it('should import valid presets', () => {
            const json = JSON.stringify([
                { name: 'Imported 1', code: 'code 1' },
                { name: 'Imported 2', code: 'code 2' }
            ]);
            
            const result = PresetManager.importPresets(json);
            
            expect(result.success).toHaveLength(2);
            expect(result.failed).toHaveLength(0);
        });

        it('should add suffix for duplicate names', () => {
            const userPresets = [{ id: 'user-1', name: 'Existing', code: 'code' }];
            mockStorage.set('story-codefill-presets', JSON.stringify(userPresets));
            
            const json = JSON.stringify([{ name: 'Existing', code: 'new code' }]);
            const result = PresetManager.importPresets(json);
            
            expect(result.success[0].name).toBe('Existing (Imported)');
        });

        it('should fail for presets without name', () => {
            const json = JSON.stringify([{ code: 'code' }]);
            
            const result = PresetManager.importPresets(json);
            
            expect(result.success).toHaveLength(0);
            expect(result.failed).toHaveLength(1);
        });

        it('should fail for presets without code', () => {
            const json = JSON.stringify([{ name: 'Test' }]);
            
            const result = PresetManager.importPresets(json);
            
            expect(result.success).toHaveLength(0);
            expect(result.failed).toHaveLength(1);
        });

        it('should throw for invalid JSON', () => {
            expect(() => PresetManager.importPresets('invalid')).toThrow();
        });

        it('should throw for non-array JSON', () => {
            expect(() => PresetManager.importPresets('{"name": "test"}')).toThrow();
        });

        it('should preserve description', () => {
            const json = JSON.stringify([{ name: 'Test', code: 'code', description: 'My desc' }]);
            
            const result = PresetManager.importPresets(json);
            
            expect(result.success[0].description).toBe('My desc');
        });
    });

    describe('_saveToStorage()', () => {
        it('should save to localStorage', () => {
            PresetManager._saveToStorage([{ id: 'test', name: 'Test' }]);
            
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'story-codefill-presets',
                expect.any(String)
            );
        });

        it('should throw on storage error', () => {
            mockLocalStorage.setItem.mockImplementationOnce(() => {
                throw new Error('Storage full');
            });
            
            expect(() => PresetManager._saveToStorage([])).toThrow();
        });
    });
});
