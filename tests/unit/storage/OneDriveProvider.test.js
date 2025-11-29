/**
 * Tests for OneDriveProvider
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OneDriveProvider } from '../../../src/core/storage/providers/OneDriveProvider.js';
import { authService } from '../../../src/core/auth/AuthService.js';
import { tokenStorage } from '../../../src/core/auth/storage/TokenStorage.js';

// Mock authService and tokenStorage modules
vi.mock('../../../src/core/auth/AuthService.js', () => ({
    authService: {
        getAccessToken: vi.fn().mockResolvedValue('test-token'),
        login: vi.fn().mockResolvedValue(),
        logout: vi.fn().mockResolvedValue(),
        isAuthenticated: vi.fn().mockReturnValue(true)
    }
}));

vi.mock('../../../src/core/auth/storage/TokenStorage.js', () => ({
    tokenStorage: {
        getProvider: vi.fn().mockReturnValue('microsoft'),
        isAuthenticated: vi.fn().mockReturnValue(true),
        getAccessToken: vi.fn().mockReturnValue('test-token')
    }
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock crypto using vi.stubGlobal
const mockCrypto = {
    getRandomValues: vi.fn((array) => {
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
        return array;
    }),
    subtle: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
    }
};
vi.stubGlobal('crypto', mockCrypto);

// Mock sessionStorage
const sessionStorageData = {};
const mockSessionStorage = {
    getItem: vi.fn((key) => sessionStorageData[key] || null),
    setItem: vi.fn((key, value) => { sessionStorageData[key] = value; }),
    removeItem: vi.fn((key) => { delete sessionStorageData[key]; })
};
vi.stubGlobal('sessionStorage', mockSessionStorage);

// Mock window.location
const mockLocation = {
    origin: 'https://app.example.com',
    href: ''
};
vi.stubGlobal('window', { location: mockLocation });

// Mock btoa
vi.stubGlobal('btoa', (str) => Buffer.from(str).toString('base64'));

describe('OneDriveProvider', () => {
    let provider;

    beforeEach(() => {
        vi.clearAllMocks();
        Object.keys(sessionStorageData).forEach(key => delete sessionStorageData[key]);
        
        provider = new OneDriveProvider({
            clientId: 'test-client-id',
            redirectUri: 'https://app.example.com/auth/microsoft/callback'
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should store client ID and redirect URI', () => {
            expect(provider.clientId).toBe('test-client-id');
            expect(provider.redirectUri).toBe('https://app.example.com/auth/microsoft/callback');
        });

        it('should use default redirect URI if not provided', () => {
            const defaultProvider = new OneDriveProvider({ clientId: 'test' });
            expect(defaultProvider.redirectUri).toBe('https://app.example.com/auth/microsoft/callback');
        });

        it('should not be authenticated when tokenStorage returns false', () => {
            tokenStorage.isAuthenticated.mockReturnValueOnce(false);
            expect(provider.isAuthenticated()).toBe(false);
        });

        it('should not be authenticated when provider mismatch', () => {
            tokenStorage.isAuthenticated.mockReturnValueOnce(true);
            tokenStorage.getProvider.mockReturnValueOnce('google');
            expect(provider.isAuthenticated()).toBe(false);
        });
    });

    describe('getProviderInfo', () => {
        it('should return correct provider info', () => {
            const info = provider.getProviderInfo();
            
            expect(info.id).toBe('onedrive');
            expect(info.name).toBe('OneDrive');
            expect(info.icon).toBe('onedrive');
            expect(info.supportsAuth).toBe(true);
            expect(info.supportsConflictResolution).toBe(true);
        });
    });

    describe('authenticate', () => {
        it('should call authService.login with microsoft provider', async () => {
            await provider.authenticate();
            
            expect(authService.login).toHaveBeenCalledWith('microsoft');
        });
    });

    // Note: handleCallback is now handled by app-level authService
    // Callback handling tests should be in AuthService.test.js

    describe('signOut', () => {
        it('should call authService.logout', async () => {
            await provider.signOut();
            
            expect(authService.logout).toHaveBeenCalled();
        });
    });

    describe('read', () => {
        beforeEach(() => {
            // Authentication is handled by mocked authService and tokenStorage
        });

        it('should read file from OneDrive', async () => {
            const fileData = new ArrayBuffer(100);
            mockFetch.mockResolvedValueOnce({
                ok: true,
                headers: {
                    get: vi.fn().mockReturnValue(null) // No content-length
                },
                arrayBuffer: () => Promise.resolve(fileData)
            });

            const result = await provider.read({ id: 'file-123' });
            
            expect(mockFetch).toHaveBeenCalledWith(
                'https://graph.microsoft.com/v1.0/me/drive/items/file-123/content',
                expect.objectContaining({
                    headers: { Authorization: 'Bearer test-token' }
                })
            );
            expect(result).toBe(fileData);
        });

        it('should throw on read failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                headers: {
                    get: vi.fn().mockReturnValue(null)
                }
            });

            await expect(provider.read({ id: 'file-123' }))
                .rejects.toThrow();
        });

        it('should throw if not authenticated', async () => {
            // Mock unauthenticated state
            tokenStorage.isAuthenticated.mockReturnValueOnce(false);
            
            await expect(provider.read({ id: 'file-123' }))
                .rejects.toThrow('Not authenticated');
        });
    });

    describe('write', () => {
        beforeEach(() => {
            // Authentication is handled by mocked authService and tokenStorage
        });

        it('should write file to OneDrive', async () => {
            const fileResponse = {
                id: 'new-file-id',
                name: 'test.str',
                webUrl: 'https://onedrive.live.com/...',
                lastModifiedDateTime: new Date().toISOString()
            };
            
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(fileResponse)
            });

            const data = new ArrayBuffer(100);
            const result = await provider.write({ id: 'file-123' }, data);
            
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/me/drive/items/file-123/content'),
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token'
                    })
                })
            );
            expect(result.id).toBe('new-file-id');
        });

        it('should create new file if no ID provided', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    id: 'new-file-id',
                    name: 'new-file.str'
                })
            });

            const data = new ArrayBuffer(100);
            await provider.write({ name: 'new-file.str', folderId: 'folder-1' }, data);
            
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/me/drive/items/folder-1:/new-file.str:/content'),
                expect.any(Object)
            );
        });

        it('should call progress callback', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ id: 'file-id', name: 'test.str' })
            });

            const onProgress = vi.fn();
            await provider.write({ id: 'file-123' }, new ArrayBuffer(100), { onProgress });
            
            expect(onProgress).toHaveBeenCalledWith(1);
        });

        it('should throw on write failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            await expect(provider.write({ id: 'file-123' }, new ArrayBuffer(100)))
                .rejects.toThrow();
        });
    });

    describe('getFileInfo', () => {
        beforeEach(() => {
            // Authentication is handled by mocked authService and tokenStorage
        });

        it('should return file info', async () => {
            const fileData = {
                id: 'file-123',
                name: 'presentation.str',
                size: 1024,
                lastModifiedDateTime: '2024-01-15T10:30:00Z',
                createdDateTime: '2024-01-01T09:00:00Z',
                file: { mimeType: 'application/octet-stream' }
            };
            
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(fileData)
            });

            const info = await provider.getFileInfo({ id: 'file-123' });
            
            expect(info.id).toBe('file-123');
            expect(info.name).toBe('presentation.str');
            expect(info.size).toBe(1024);
            expect(info.modified).toBeInstanceOf(Date);
        });

        it('should throw on failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            await expect(provider.getFileInfo({ id: 'file-123' }))
                .rejects.toThrow('Failed to get file info');
        });
    });

    describe('delete', () => {
        beforeEach(() => {
            // Authentication is handled by mocked authService and tokenStorage
        });

        it('should delete file from OneDrive', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 204
            });

            await expect(provider.delete({ id: 'file-123' }))
                .resolves.toBeUndefined();
            
            expect(mockFetch).toHaveBeenCalledWith(
                'https://graph.microsoft.com/v1.0/me/drive/items/file-123',
                expect.objectContaining({
                    method: 'DELETE'
                })
            );
        });

        it('should throw on delete failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            await expect(provider.delete({ id: 'file-123' }))
                .rejects.toThrow('Failed to delete file');
        });
    });

    describe('listFiles', () => {
        beforeEach(() => {
            // Authentication is handled by mocked authService and tokenStorage
        });

        it('should list files from OneDrive', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    value: [
                        { id: 'f1', name: 'presentation.str', size: 1024, lastModifiedDateTime: '2024-01-15T10:00:00Z' },
                        { id: 'f2', name: 'slides.str', size: 2048, lastModifiedDateTime: '2024-01-14T09:00:00Z' }
                    ]
                })
            });

            const files = await provider.listFiles();
            
            expect(files.length).toBe(2);
            expect(files[0].name).toBe('presentation.str');
            expect(files[1].name).toBe('slides.str');
        });

        it('should list files in specific folder', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ value: [] })
            });

            await provider.listFiles('folder-123');
            
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/me/drive/items/folder-123/children'),
                expect.any(Object)
            );
        });

        it('should throw on list failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            await expect(provider.listFiles())
                .rejects.toThrow('Failed to list files');
        });

        it('should return empty array when drive root returns 404', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            const files = await provider.listFiles();
            
            expect(files).toEqual([]);
        });

        it('should filter .str files and folders client-side', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    value: [
                        { id: 'f1', name: 'presentation.str', size: 1024, lastModifiedDateTime: '2024-01-15T10:00:00Z' },
                        { id: 'f2', name: 'document.docx', size: 2048, lastModifiedDateTime: '2024-01-14T09:00:00Z' },
                        { id: 'f3', name: 'My Folder', folder: {}, lastModifiedDateTime: '2024-01-13T08:00:00Z' }
                    ]
                })
            });

            const files = await provider.listFiles();
            
            // Should filter client-side to only .str files and folders
            expect(files.length).toBe(2);
            expect(files[0].name).toBe('presentation.str');
            expect(files[1].name).toBe('My Folder');
            expect(files[1].isFolder).toBe(true);
        });
    });

    describe('isAvailable', () => {
        it('should return navigator.onLine value', async () => {
            Object.defineProperty(global.navigator, 'onLine', {
                value: true,
                writable: true
            });
            
            const result = await provider.isAvailable();
            expect(typeof result).toBe('boolean');
        });
    });

    describe('getUserInfo', () => {
        beforeEach(() => {
            // Authentication is handled by mocked authService and tokenStorage
        });

        it('should return user info', async () => {
            // Mock user info response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    displayName: 'Test User',
                    mail: 'test@example.com',
                    userPrincipalName: 'test@example.com'
                })
            });
            // Mock photo response (404 - no photo)
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            const user = await provider.getUserInfo();
            
            expect(user.displayName).toBe('Test User');
            expect(user.mail).toBe('test@example.com');
        });
        
        it('should return user info with photo', async () => {
            // Mock user info response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    displayName: 'Test User',
                    mail: 'test@example.com'
                })
            });
            // Mock photo response with blob
            const mockBlob = new Blob(['fake image data'], { type: 'image/jpeg' });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                blob: () => Promise.resolve(mockBlob)
            });

            const user = await provider.getUserInfo();
            
            expect(user.displayName).toBe('Test User');
            expect(user.photoUrl).toBeDefined();
            expect(user.photoUrl).toContain('data:');
        });

        it('should cache user info', async () => {
            // Mock user info response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ displayName: 'Test User' })
            });
            // Mock photo response (404 - no photo)
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            await provider.getUserInfo();
            await provider.getUserInfo();
            
            // Should only fetch twice on first call (user info + photo), then use cache
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should throw on failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401
            });

            await expect(provider.getUserInfo())
                .rejects.toThrow('Failed to get user info');
        });
    });

    // Note: refreshAccessToken is now handled by app-level authService
    // Token refresh tests should be in AuthService.test.js

    describe('showPicker', () => {
        beforeEach(() => {
            // Authentication is handled by mocked authService and tokenStorage
        });

        it('should return files from search', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    value: [
                        { id: 'f1', name: 'test.str', lastModifiedDateTime: '2024-01-15T10:00:00Z' }
                    ]
                })
            });

            const result = await provider.showPicker();
            
            expect(result.type).toBe('picker');
            expect(result.files.length).toBe(1);
        });

        it('should return null if no files', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ value: [] })
            });

            const result = await provider.showPicker();
            expect(result).toBeNull();
        });
    });

    describe('showSavePicker', () => {
        beforeEach(() => {
            // Authentication is handled by mocked authService and tokenStorage
        });

        it('should get or create Story folder', async () => {
            // First call: folder exists
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ id: 'story-folder-id' })
            });

            const result = await provider.showSavePicker('new-presentation.str');
            
            expect(result.type).toBe('save');
            expect(result.folderId).toBe('story-folder-id');
            expect(result.suggestedName).toBe('new-presentation.str');
        });

        it('should create Story folder if it does not exist', async () => {
            // First call: folder doesn't exist
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });
            // Second call: create folder
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ id: 'new-folder-id' })
            });

            const result = await provider.showSavePicker('new-presentation.str');
            
            expect(result.folderId).toBe('new-folder-id');
        });
    });
});
