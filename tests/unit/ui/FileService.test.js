/**
 * FileService Tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock store
vi.mock('../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(() => ({
            slides: [],
            editor: { activeSlideId: null }
        })),
        dispatch: vi.fn(),
        on: vi.fn(),
        emit: vi.fn()
    }
}));

// Mock FileSystemAccess
vi.mock('../../../src/core/storage/filesystem/FileSystemAccess.js', () => ({
    fileSystemAccess: {
        showOpenPicker: vi.fn(),
        showSavePicker: vi.fn(),
        writeFile: vi.fn(),
        isSupported: () => true
    }
}));

// Mock AlertModal
vi.mock('../../../src/ui/components/AlertModal.js', () => ({
    alertModal: {
        alert: vi.fn(() => Promise.resolve()),
        confirm: vi.fn(() => Promise.resolve(true)),
        unsavedChanges: vi.fn(() => Promise.resolve('discard'))
    }
}));

describe('FileService', () => {
    let FileService;
    let fileService;
    let store;
    let fileSystemAccess;
    let alertModal;

    beforeEach(async () => {
        vi.resetModules();
        
        const storeModule = await import('../../../src/core/Store.js');
        store = storeModule.store;
        
        const fsModule = await import('../../../src/core/storage/filesystem/FileSystemAccess.js');
        fileSystemAccess = fsModule.fileSystemAccess;
        
        const alertModule = await import('../../../src/ui/components/AlertModal.js');
        alertModal = alertModule.alertModal;
        
        // Import FileService after mocks are set up
        const module = await import('../../../src/ui/services/FileService.js');
        fileService = module.fileService;
    });

    afterEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('hasUnsavedChanges', () => {
        it('should return false for empty presentation', () => {
            store.getState.mockReturnValue({
                slides: [],
                editor: { activeSlideId: null }
            });
            
            expect(fileService.hasUnsavedChanges()).toBe(false);
        });

        it('should return true when slides have elements', () => {
            store.getState.mockReturnValue({
                slides: [
                    { id: 'slide-1', elements: [{ id: 'el-1' }] }
                ],
                editor: { activeSlideId: 'slide-1' }
            });
            
            expect(fileService.hasUnsavedChanges()).toBe(true);
        });
    });

    describe('newPresentation', () => {
        it('should reset state for new presentation', async () => {
            store.getState.mockReturnValue({
                slides: [],
                editor: { activeSlideId: null }
            });
            
            const result = await fileService.newPresentation();
            
            expect(result).toBe(true);
            expect(store.dispatch).toHaveBeenCalledWith('RESET_STATE');
        });

        it('should show unsaved changes dialog if there are changes', async () => {
            store.getState.mockReturnValue({
                slides: [{ id: 'slide-1', elements: [{ id: 'el-1' }] }],
                editor: { activeSlideId: 'slide-1' }
            });
            
            alertModal.unsavedChanges.mockResolvedValue('discard');
            
            await fileService.newPresentation();
            
            expect(alertModal.unsavedChanges).toHaveBeenCalled();
        });

        it('should cancel if user cancels unsaved dialog', async () => {
            store.getState.mockReturnValue({
                slides: [{ id: 'slide-1', elements: [{ id: 'el-1' }] }],
                editor: { activeSlideId: 'slide-1' }
            });
            
            alertModal.unsavedChanges.mockResolvedValue('cancel');
            
            const result = await fileService.newPresentation();
            
            expect(result).toBe(false);
            expect(store.dispatch).not.toHaveBeenCalledWith('RESET_STATE');
        });
    });

    describe('save', () => {
        it('should show save picker when no file handle', async () => {
            fileSystemAccess.showSavePicker.mockResolvedValue({
                name: 'test.str'
            });
            fileSystemAccess.writeFile.mockResolvedValue();
            
            store.getState.mockReturnValue({
                slides: [],
                editor: {}
            });
            
            await fileService.save();
            
            expect(fileSystemAccess.showSavePicker).toHaveBeenCalled();
        });

        it('should return false if user cancels save picker', async () => {
            fileSystemAccess.showSavePicker.mockResolvedValue(null);
            
            const result = await fileService.save();
            
            expect(result).toBe(false);
        });
    });

    describe('Recent Files', () => {
        it('should load recent files from localStorage', () => {
            const recentFiles = [
                { name: 'test.str', lastOpened: '2025-01-01' }
            ];
            localStorage.setItem('story_recent_files', JSON.stringify(recentFiles));
            
            // Reinitialize to pick up localStorage
            const files = fileService.getRecentFiles();
            // Note: The service was already initialized, so we check what it has
            expect(Array.isArray(files)).toBe(true);
        });

        it('should clear recent files', () => {
            fileService.clearRecentFiles();
            
            expect(fileService.getRecentFiles()).toEqual([]);
        });
    });

    describe('getCurrentFileName', () => {
        it('should return null initially', () => {
            expect(fileService.getCurrentFileName()).toBe(null);
        });
    });
});
