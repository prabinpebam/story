/**
 * Tests for CloudStorageManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CloudStorageManager, getCloudStorageManager } from '../../../src/core/storage/providers/CloudStorageManager.js';

// Mock provider for testing
const createMockProvider = (id, name, authenticated = false) => ({
    getProviderInfo: vi.fn().mockReturnValue({
        id,
        name,
        icon: id,
        supportsAuth: true,
        supportsConflictResolution: true
    }),
    isAuthenticated: vi.fn().mockReturnValue(authenticated),
    authenticate: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    showPicker: vi.fn().mockResolvedValue(null),
    showSavePicker: vi.fn().mockResolvedValue(null),
    read: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
    write: vi.fn().mockResolvedValue({ id: 'new-file-id', name: 'test.str' }),
    getFileInfo: vi.fn().mockResolvedValue({
        id: 'file-1',
        name: 'test.str',
        size: 1024,
        modified: new Date()
    }),
    delete: vi.fn().mockResolvedValue(undefined),
    listFiles: vi.fn().mockResolvedValue([]),
    isAvailable: vi.fn().mockResolvedValue(true)
});

describe('CloudStorageManager', () => {
    let manager;
    let mockOneDrive;
    let mockGoogleDrive;

    beforeEach(() => {
        // Create fresh mocks
        mockOneDrive = createMockProvider('onedrive', 'OneDrive', true);
        mockGoogleDrive = createMockProvider('google-drive', 'Google Drive', false);
        
        // Create manager without config (we'll register providers manually)
        manager = new CloudStorageManager({});
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should create manager with empty providers', () => {
            expect(manager.providers.size).toBe(0);
        });

        it('should have no current provider initially', () => {
            expect(manager.currentProvider).toBeNull();
            expect(manager.currentHandle).toBeNull();
        });
    });

    describe('registerProvider', () => {
        it('should register a provider', () => {
            manager.registerProvider(mockOneDrive);
            expect(manager.providers.size).toBe(1);
            expect(manager.providers.has('onedrive')).toBe(true);
        });

        it('should register multiple providers', () => {
            manager.registerProvider(mockOneDrive);
            manager.registerProvider(mockGoogleDrive);
            expect(manager.providers.size).toBe(2);
        });
    });

    describe('getProviders', () => {
        beforeEach(() => {
            manager.registerProvider(mockOneDrive);
            manager.registerProvider(mockGoogleDrive);
        });

        it('should return array of provider info', () => {
            const providers = manager.getProviders();
            expect(providers.length).toBe(2);
        });

        it('should include authentication status', () => {
            const providers = manager.getProviders();
            const oneDrive = providers.find(p => p.id === 'onedrive');
            const googleDrive = providers.find(p => p.id === 'google-drive');
            
            expect(oneDrive.authenticated).toBe(true);
            expect(googleDrive.authenticated).toBe(false);
        });

        it('should include provider name and icon', () => {
            const providers = manager.getProviders();
            const oneDrive = providers.find(p => p.id === 'onedrive');
            
            expect(oneDrive.name).toBe('OneDrive');
            expect(oneDrive.icon).toBe('onedrive');
        });
    });

    describe('getProvider', () => {
        beforeEach(() => {
            manager.registerProvider(mockOneDrive);
        });

        it('should return provider by ID', () => {
            const provider = manager.getProvider('onedrive');
            expect(provider).toBe(mockOneDrive);
        });

        it('should return null for unknown provider', () => {
            const provider = manager.getProvider('unknown');
            expect(provider).toBeNull();
        });
    });

    describe('setCurrentFile / clearCurrentFile', () => {
        beforeEach(() => {
            manager.registerProvider(mockOneDrive);
        });

        it('should set current provider and handle', () => {
            const handle = { id: 'file-1', name: 'test.str' };
            manager.setCurrentFile('onedrive', handle);
            
            expect(manager.currentProvider).toBe(mockOneDrive);
            expect(manager.currentHandle).toBe(handle);
        });

        it('should clear current file', () => {
            const handle = { id: 'file-1', name: 'test.str' };
            manager.setCurrentFile('onedrive', handle);
            manager.clearCurrentFile();
            
            expect(manager.currentProvider).toBeNull();
            expect(manager.currentHandle).toBeNull();
        });
    });

    describe('authenticate', () => {
        beforeEach(() => {
            manager.registerProvider(mockOneDrive);
        });

        it('should call provider authenticate', async () => {
            await manager.authenticate('onedrive');
            expect(mockOneDrive.authenticate).toHaveBeenCalled();
        });

        it('should throw for unknown provider', async () => {
            await expect(manager.authenticate('unknown'))
                .rejects.toThrow('Unknown provider: unknown');
        });
    });

    describe('handleCallback', () => {
        beforeEach(() => {
            manager.registerProvider(mockOneDrive);
            mockOneDrive.handleCallback = vi.fn().mockResolvedValue(undefined);
        });

        it('should call provider handleCallback', async () => {
            await manager.handleCallback('onedrive', 'auth-code');
            expect(mockOneDrive.handleCallback).toHaveBeenCalledWith('auth-code');
        });

        it('should throw for unknown provider', async () => {
            await expect(manager.handleCallback('unknown', 'code'))
                .rejects.toThrow('Unknown provider: unknown');
        });
    });

    describe('signOut', () => {
        beforeEach(() => {
            manager.registerProvider(mockOneDrive);
            const handle = { id: 'file-1', name: 'test.str' };
            manager.setCurrentFile('onedrive', handle);
        });

        it('should call provider signOut', async () => {
            await manager.signOut('onedrive');
            expect(mockOneDrive.signOut).toHaveBeenCalled();
        });

        it('should clear current file if from same provider', async () => {
            await manager.signOut('onedrive');
            expect(manager.currentProvider).toBeNull();
            expect(manager.currentHandle).toBeNull();
        });

        it('should not clear current file if from different provider', async () => {
            manager.registerProvider(mockGoogleDrive);
            await manager.signOut('google-drive');
            
            // Current file should still be from OneDrive
            expect(manager.currentProvider).toBe(mockOneDrive);
        });
    });

    describe('signOutAll', () => {
        beforeEach(() => {
            manager.registerProvider(mockOneDrive);
            manager.registerProvider(mockGoogleDrive);
        });

        it('should sign out from all authenticated providers', async () => {
            await manager.signOutAll();
            
            // OneDrive was authenticated
            expect(mockOneDrive.signOut).toHaveBeenCalled();
            // GoogleDrive was not authenticated
            expect(mockGoogleDrive.signOut).not.toHaveBeenCalled();
        });

        it('should clear current file', async () => {
            manager.setCurrentFile('onedrive', { id: 'file-1' });
            await manager.signOutAll();
            
            expect(manager.currentProvider).toBeNull();
        });
    });

    describe('readFile', () => {
        beforeEach(() => {
            manager.registerProvider(mockOneDrive);
        });

        it('should read file and set current file', async () => {
            const handle = { id: 'file-1', name: 'test.str' };
            const data = await manager.readFile('onedrive', handle);
            
            expect(mockOneDrive.read).toHaveBeenCalledWith(handle, {});
            expect(manager.currentProvider).toBe(mockOneDrive);
            expect(manager.currentHandle).toBe(handle);
            expect(data).toBeInstanceOf(ArrayBuffer);
        });

        it('should pass options to provider', async () => {
            const handle = { id: 'file-1' };
            const onProgress = vi.fn();
            
            await manager.readFile('onedrive', handle, { onProgress });
            expect(mockOneDrive.read).toHaveBeenCalledWith(handle, { onProgress });
        });

        it('should throw for unknown provider', async () => {
            await expect(manager.readFile('unknown', {}))
                .rejects.toThrow('Unknown provider: unknown');
        });
    });

    describe('saveToCurrentFile', () => {
        it('should return false if no current file', async () => {
            const result = await manager.saveToCurrentFile(new ArrayBuffer(100));
            expect(result).toBe(false);
        });

        it('should save to current file', async () => {
            manager.registerProvider(mockOneDrive);
            const handle = { id: 'file-1', name: 'test.str' };
            manager.setCurrentFile('onedrive', handle);

            const data = new ArrayBuffer(100);
            const result = await manager.saveToCurrentFile(data);
            
            expect(result).toBe(true);
            expect(mockOneDrive.write).toHaveBeenCalledWith(handle, data, {});
        });

        it('should update current handle after save', async () => {
            manager.registerProvider(mockOneDrive);
            const handle = { id: 'file-1', name: 'test.str' };
            manager.setCurrentFile('onedrive', handle);

            mockOneDrive.write.mockResolvedValue({ id: 'new-id', name: 'test.str' });
            
            await manager.saveToCurrentFile(new ArrayBuffer(100));
            
            expect(manager.currentHandle.id).toBe('new-id');
        });
    });

    describe('saveFileAs', () => {
        beforeEach(() => {
            manager.registerProvider(mockOneDrive);
            mockOneDrive.showSavePicker.mockResolvedValue({
                folderId: 'folder-1',
                suggestedName: 'new-file.str'
            });
        });

        it('should throw for unknown provider', async () => {
            await expect(manager.saveFileAs('unknown', new ArrayBuffer(100), 'test.str'))
                .rejects.toThrow('Unknown provider: unknown');
        });

        it('should authenticate if not authenticated', async () => {
            mockOneDrive.isAuthenticated.mockReturnValue(false);
            
            await manager.saveFileAs('onedrive', new ArrayBuffer(100), 'test.str');
            
            expect(mockOneDrive.authenticate).toHaveBeenCalled();
        });

        it('should return null if save picker cancelled', async () => {
            mockOneDrive.showSavePicker.mockResolvedValue(null);
            
            const result = await manager.saveFileAs('onedrive', new ArrayBuffer(100), 'test.str');
            expect(result).toBeNull();
        });

        it('should save file and update current file', async () => {
            const result = await manager.saveFileAs('onedrive', new ArrayBuffer(100), 'test.str');
            
            expect(mockOneDrive.write).toHaveBeenCalled();
            expect(manager.currentProvider).toBe(mockOneDrive);
            expect(result).toBeDefined();
        });
    });

    describe('getCurrentFileInfo', () => {
        it('should return null if no current file', async () => {
            const info = await manager.getCurrentFileInfo();
            expect(info).toBeNull();
        });

        it('should return file info for current file', async () => {
            manager.registerProvider(mockOneDrive);
            manager.setCurrentFile('onedrive', { id: 'file-1' });
            
            const info = await manager.getCurrentFileInfo();
            
            expect(mockOneDrive.getFileInfo).toHaveBeenCalled();
            expect(info.name).toBe('test.str');
        });
    });

    describe('hasAuthenticatedProvider', () => {
        it('should return false with no providers', () => {
            expect(manager.hasAuthenticatedProvider()).toBe(false);
        });

        it('should return true if any provider is authenticated', () => {
            manager.registerProvider(mockOneDrive);
            manager.registerProvider(mockGoogleDrive);
            
            expect(manager.hasAuthenticatedProvider()).toBe(true);
        });

        it('should return false if no providers authenticated', () => {
            mockOneDrive.isAuthenticated.mockReturnValue(false);
            manager.registerProvider(mockOneDrive);
            
            expect(manager.hasAuthenticatedProvider()).toBe(false);
        });
    });

    describe('getAuthenticatedProviders', () => {
        beforeEach(() => {
            manager.registerProvider(mockOneDrive);
            manager.registerProvider(mockGoogleDrive);
        });

        it('should return list of authenticated provider IDs', () => {
            const authenticated = manager.getAuthenticatedProviders();
            expect(authenticated).toEqual(['onedrive']);
        });

        it('should return empty array if none authenticated', () => {
            mockOneDrive.isAuthenticated.mockReturnValue(false);
            
            const authenticated = manager.getAuthenticatedProviders();
            expect(authenticated).toEqual([]);
        });
    });

    describe('hasCurrentCloudFile', () => {
        it('should return false with no current file', () => {
            expect(manager.hasCurrentCloudFile()).toBe(false);
        });

        it('should return true with current file', () => {
            manager.registerProvider(mockOneDrive);
            manager.setCurrentFile('onedrive', { id: 'file-1' });
            
            expect(manager.hasCurrentCloudFile()).toBe(true);
        });
    });

    describe('getCurrentCloudPath', () => {
        it('should return null with no current file', () => {
            expect(manager.getCurrentCloudPath()).toBeNull();
        });

        it('should return formatted path with current file', () => {
            manager.registerProvider(mockOneDrive);
            manager.setCurrentFile('onedrive', { id: 'file-1', name: 'presentation.str' });
            
            const path = manager.getCurrentCloudPath();
            expect(path).toBe('OneDrive:presentation.str');
        });
    });

    describe('isOnline', () => {
        it('should return navigator.onLine value', () => {
            // navigator.onLine is typically true in test environment
            expect(typeof manager.isOnline()).toBe('boolean');
        });
    });

    describe('openFile', () => {
        beforeEach(() => {
            manager.registerProvider(mockOneDrive);
            mockOneDrive.showPicker.mockResolvedValue({
                type: 'picker',
                files: [{ id: 'file-1', name: 'test.str' }]
            });
        });

        it('should throw for unknown provider', async () => {
            await expect(manager.openFile('unknown'))
                .rejects.toThrow('Unknown provider: unknown');
        });

        it('should authenticate if not authenticated', async () => {
            mockOneDrive.isAuthenticated.mockReturnValue(false);
            
            // Authenticate will redirect, so this will return null
            const result = await manager.openFile('onedrive');
            
            expect(mockOneDrive.authenticate).toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('should show picker for authenticated provider', async () => {
            const result = await manager.openFile('onedrive');
            
            expect(mockOneDrive.showPicker).toHaveBeenCalled();
            expect(result.type).toBe('picker');
            expect(result.files.length).toBe(1);
        });

        it('should return null if picker cancelled', async () => {
            mockOneDrive.showPicker.mockResolvedValue(null);
            
            const result = await manager.openFile('onedrive');
            expect(result).toBeNull();
        });
    });
});

describe('getCloudStorageManager', () => {
    it('should return a CloudStorageManager instance', () => {
        // Note: This may return cached singleton
        const manager = getCloudStorageManager({});
        expect(manager).toBeInstanceOf(CloudStorageManager);
    });
});
