import { describe, it, expect, vi, beforeEach } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';
import * as MasterHandlers from '../../../../src/core/store/handlers/MasterHandlers.js';
import Store from '../../../../src/core/Store.js';

// Mock Store
vi.mock('../../../../src/core/Store.js', () => ({
    default: {
        getState: vi.fn(),
        dispatch: vi.fn()
    }
}));

describe('MasterHandlers V2', () => {
    let initialState;

    beforeEach(() => {
        initialState = {
            slideMasterPresets: {
                'master-1': {
                    id: 'master-1',
                    name: 'Master 1',
                    type: 'slideMasterPreset'
                },
                'master-2': {
                    id: 'master-2',
                    name: 'Master 2',
                    type: 'slideMasterPreset'
                },
                'layout-1': {
                    id: 'layout-1',
                    name: 'Layout 1',
                    type: 'layoutMaster',
                    parentId: 'master-1'
                }
            },
            editor: {
                activeMasterId: 'master-1'
            },
            slides: []
        };
        Store.getState.mockReturnValue(initialState);
        vi.clearAllMocks();
    });

    describe('handleAddLayout', () => {
        it('should add a new layout to the specified master', () => {
            const newState = produce(initialState, draft => {
                MasterHandlers.handleAddLayout(draft, { parentId: 'master-1' });
            });
            
            const layouts = Object.values(newState.slideMasterPresets).filter(m => m.parentId === 'master-1');
            expect(layouts.length).toBe(2); // layout-1 + new layout
            const newLayout = layouts.find(l => l.id !== 'layout-1');
            expect(newLayout).toBeDefined();
            expect(newLayout.type).toBe('layout');
            expect(newState.editor.activeMasterId).toBe(newLayout.id);
        });

        it('should not modify state if master is not found', () => {
            const newState = produce(initialState, draft => {
                MasterHandlers.handleAddLayout(draft, { parentId: 'non-existent' });
            });
            expect(Object.keys(newState.slideMasterPresets).length).toBe(3);
        });
    });

    describe('handleDuplicateMaster', () => {
        it('should duplicate a master', () => {
            const newState = produce(initialState, draft => {
                MasterHandlers.handleDuplicateMaster(draft, { id: 'master-1' });
            });
            
            const masters = Object.values(newState.slideMasterPresets).filter(m => m.type === 'slideMasterPreset');
            expect(masters.length).toBe(3); // master-1, master-2, copy
            const newMaster = masters.find(m => m.id !== 'master-1' && m.id !== 'master-2');
            expect(newMaster.name).toContain('Copy');
            expect(newState.editor.activeMasterId).toBe(newMaster.id);
        });

        it('should duplicate a layout', () => {
            const newState = produce(initialState, draft => {
                MasterHandlers.handleDuplicateMaster(draft, { id: 'layout-1' });
            });
            
            const layouts = Object.values(newState.slideMasterPresets).filter(m => m.type === 'layoutMaster' || m.type === 'layout');
            expect(layouts.length).toBe(2);
            const newLayout = layouts.find(l => l.id !== 'layout-1');
            expect(newLayout.name).toContain('Copy');
            expect(newLayout.parentId).toBe('master-1');
        });
    });

    describe('handleRenameMaster', () => {
        it('should rename a master', () => {
            const newState = produce(initialState, draft => {
                MasterHandlers.handleRenameMaster(draft, { id: 'master-1', name: 'Renamed Master' });
            });
            
            expect(newState.slideMasterPresets['master-1'].name).toBe('Renamed Master');
        });

        it('should rename a layout', () => {
            const newState = produce(initialState, draft => {
                MasterHandlers.handleRenameMaster(draft, { id: 'layout-1', name: 'Renamed Layout' });
            });
            
            expect(newState.slideMasterPresets['layout-1'].name).toBe('Renamed Layout');
        });
    });

    describe('handleDeleteMaster', () => {
        it('should delete a master if not used', () => {
            const newState = produce(initialState, draft => {
                MasterHandlers.handleDeleteMaster(draft, { id: 'master-1' });
            });
            
            expect(newState.slideMasterPresets['master-1']).toBeUndefined();
        });

        it('should delete a layout if not used', () => {
            const newState = produce(initialState, draft => {
                MasterHandlers.handleDeleteMaster(draft, { id: 'layout-1' });
            });
            
            expect(newState.slideMasterPresets['layout-1']).toBeUndefined();
        });

        it('should not delete a master if used by a slide', () => {
            initialState.slides.push({ masterId: 'master-1', layoutId: 'layout-1' });
            
            // Mock console.warn
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const newState = produce(initialState, draft => {
                MasterHandlers.handleDeleteMaster(draft, { id: 'master-1' });
            });
            
            expect(newState.slideMasterPresets['master-1']).toBeDefined();
            expect(consoleSpy).toHaveBeenCalledWith('Cannot delete master/layout that is in use');
            
            consoleSpy.mockRestore();
        });
    });
});
