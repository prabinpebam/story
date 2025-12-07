
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SlideMasterManager } from '../../../src/core/SlideMasterManager.js';
import { store } from '../../../src/core/Store.js';

// Mock the store
vi.mock('../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(),
        dispatch: vi.fn()
    }
}));

describe('SlideMasterManager', () => {
    let manager;

    beforeEach(() => {
        manager = new SlideMasterManager();
        vi.clearAllMocks();
    });

    describe('getMaster()', () => {
        it('should retrieve master from store state', () => {
            store.getState.mockReturnValue({
                slideMasterPresets: {
                    'master-1': { id: 'master-1', name: 'Test Master' }
                }
            });

            const master = manager.getMaster('master-1');
            expect(master).toEqual({ id: 'master-1', name: 'Test Master' });
        });

        it('should return null if master does not exist', () => {
            store.getState.mockReturnValue({ slideMasterPresets: {} });
            const master = manager.getMaster('non-existent');
            expect(master).toBeNull();
        });
    });

    describe('applyColorTheme()', () => {
        it('should dispatch APPLY_LUMA_THEME action', () => {
            const theme = { id: 'theme-1', name: 'New Theme' };
            manager.applyColorTheme('master-1', theme);

            expect(store.dispatch).toHaveBeenCalledWith('APPLY_LUMA_THEME', {
                masterId: 'master-1',
                theme
            });
        });

        it('should not dispatch if inputs are missing', () => {
            manager.applyColorTheme(null, {});
            expect(store.dispatch).not.toHaveBeenCalled();
        });
    });

    describe('assignColorTheme()', () => {
        it('should dispatch UPDATE_MASTER_STYLE_ASSIGNMENTS action', () => {
            manager.assignColorTheme('master-1', 'theme-ref-1');

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
                masterId: 'master-1',
                styleAssignments: {
                    colorTheme: 'theme-ref-1'
                }
            });
        });
    });

    describe('updateThemeSlot()', () => {
        it('should dispatch UPDATE_LUMA_THEME_SLOT action', () => {
            manager.updateThemeSlot('master-1', 0, 180, 50);

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_LUMA_THEME_SLOT', {
                masterId: 'master-1',
                slotIndex: 0,
                h: 180,
                s: 50
            });
        });
    });

    describe('setColorMode()', () => {
        it('should dispatch SET_COLOR_MODE action', () => {
            manager.setColorMode('master-1', 'dark');

            expect(store.dispatch).toHaveBeenCalledWith('SET_COLOR_MODE', {
                masterId: 'master-1',
                colorMode: 'dark'
            });
        });
    });
});
