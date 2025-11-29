/**
 * Tests for GoogleDriveProvider
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GoogleDriveProvider } from '../../../src/core/storage/providers/GoogleDriveProvider.js';

// Mock authService and tokenStorage (app-level auth)
vi.mock('../../../src/core/auth/AuthService.js', () => ({
    authService: {
        login: vi.fn().mockResolvedValue(true),
        logout: vi.fn().mockResolvedValue(true),
        getAccessToken: vi.fn().mockResolvedValue('test-access-token')
    }
}));

vi.mock('../../../src/core/auth/storage/TokenStorage.js', () => ({
    tokenStorage: {
        isAuthenticated: vi.fn().mockReturnValue(true),
        getProvider: vi.fn().mockReturnValue('google'),
        getAccessToken: vi.fn().mockReturnValue('test-access-token'),
        needsRefresh: vi.fn().mockReturnValue(false),
        clear: vi.fn(),
        clearTokens: vi.fn()
    }
}));

import { authService } from '../../../src/core/auth/AuthService.js';
import { tokenStorage } from '../../../src/core/auth/storage/TokenStorage.js';

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

describe('GoogleDriveProvider', () => {
    let provider;

    beforeEach(() => {
        vi.clearAllMocks();
        Object.keys(sessionStorageData).forEach(key => delete sessionStorageData[key]);
        
        provider = new GoogleDriveProvider({
            clientId: 'test-client-id',
            redirectUri: 'https://app.example.com/auth/google/callback'
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should store client ID and redirect URI', () => {
            expect(provider.clientId).toBe('test-client-id');
            expect(provider.redirectUri).toBe('https://app.example.com/auth/google/callback');
        });

        it('should use default redirect URI if not provided', () => {
            const defaultProvider = new GoogleDriveProvider({ clientId: 'test' });
            expect(defaultProvider.redirectUri).toBe('https://app.example.com/auth/google/callback');
        });

        it('should not be authenticated when tokenStorage returns false', () => {
            tokenStorage.isAuthenticated.mockReturnValueOnce(false);
            expect(provider.isAuthenticated()).toBe(false);
        });

        it('should not be authenticated when provider mismatch', () => {
            tokenStorage.isAuthenticated.mockReturnValueOnce(true);
            tokenStorage.getProvider.mockReturnValueOnce('microsoft');
            expect(provider.isAuthenticated()).toBe(false);
        });
    });

    describe('getProviderInfo', () => {
        it('should return correct provider info', () => {
            const info = provider.getProviderInfo();
            
            expect(info.id).toBe('google-drive');
            expect(info.name).toBe('Google Drive');
            expect(info.icon).toBe('google-drive');
            expect(info.supportsAuth).toBe(true);
            expect(info.supportsConflictResolution).toBe(true);
        });
    });

    describe('authenticate', () => {
        it('should call authService.login with google provider', async () => {
            await provider.authenticate();
            
            expect(authService.login).toHaveBeenCalledWith('google');
        });
    });

    describe('signOut', () => {
        it('should call authService.logout', async () => {
            await provider.signOut();
            
            expect(authService.logout).toHaveBeenCalled();
        });
    });

    describe('read', () => {
        it('should read file from Google Drive', async () => {
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
                expect.stringContaining('files/file-123?alt=media'),
                expect.objectContaining({
                    headers: { Authorization: 'Bearer test-access-token' }
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
            tokenStorage.isAuthenticated.mockReturnValueOnce(false);
            
            await expect(provider.read({ id: 'file-123' }))
                .rejects.toThrow('Not authenticated');
        });
    });

    describe('write', () => {
        it('should update existing file', async () => {
            const fileResponse = {
                id: 'file-123',
                name: 'test.str',
                modifiedTime: new Date().toISOString()
            };
            
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(fileResponse)
            });

            const data = new ArrayBuffer(100);
            const result = await provider.write({ id: 'file-123' }, data);
            
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('upload/drive/v3/files/file-123'),
                expect.objectContaining({
                    method: 'PATCH'
                })
            );
            expect(result.id).toBe('file-123');
        });

        it('should create new file if no ID', async () => {
            // First: get/create Story folder (search returns existing folder)
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    files: [{ id: 'story-folder-id' }]
                })
            });
            // Second: create file with multipart upload
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ id: 'new-file-id', name: 'new-file.str' })
            });

            const data = new ArrayBuffer(100);
            const result = await provider.write({ name: 'new-file.str' }, data);
            
            expect(result.id).toBe('new-file-id');
        });

        it('should not call progress for small file updates', async () => {
            // Simple uploads don't support progress callbacks - only resumable uploads do
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ id: 'file-id', name: 'test.str' })
            });

            const onProgress = vi.fn();
            await provider.write({ id: 'file-123' }, new ArrayBuffer(100), { onProgress });
            
            // Simple upload doesn't call onProgress (only resumable upload does)
            expect(onProgress).not.toHaveBeenCalled();
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
        it('should return file info', async () => {
            const fileData = {
                id: 'file-123',
                name: 'presentation.str',
                size: '1024',
                modifiedTime: '2024-01-15T10:30:00Z',
                createdTime: '2024-01-01T09:00:00Z',
                mimeType: 'application/octet-stream'
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
        it('should delete file', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 204
            });

            await expect(provider.delete({ id: 'file-123' }))
                .resolves.toBeUndefined();
            
            expect(mockFetch).toHaveBeenCalledWith(
                'https://www.googleapis.com/drive/v3/files/file-123',
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
        it('should list .str files', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    files: [
                        { id: 'f1', name: 'presentation.str', size: '1024', modifiedTime: '2024-01-15T10:00:00Z' },
                        { id: 'f2', name: 'slides.str', size: '2048', modifiedTime: '2024-01-14T09:00:00Z' }
                    ]
                })
            });

            const files = await provider.listFiles();
            
            expect(files.length).toBe(2);
            expect(files[0].name).toBe('presentation.str');
            expect(files[1].name).toBe('slides.str');
        });

        it('should filter by folder ID', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ files: [] })
            });

            await provider.listFiles('folder-123');
            
            // URL-encoded query includes folder ID  
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("folder-123"),
                expect.any(Object)
            );
        });

        it('should throw on list failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: async () => 'Server error'
            });

            await expect(provider.listFiles())
                .rejects.toThrow('Failed to list files');
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
        it('should fetch user info', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    name: 'Test User',
                    email: 'test@gmail.com',
                    picture: 'https://example.com/photo.jpg'
                })
            });

            const user = await provider.getUserInfo();
            
            expect(user.name).toBe('Test User');
            expect(user.email).toBe('test@gmail.com');
        });

        it('should cache user info', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ name: 'Test User' })
            });

            await provider.getUserInfo();
            await provider.getUserInfo();
            
            expect(mockFetch).toHaveBeenCalledTimes(1);
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

    describe('showPicker', () => {
        it('should return files from search', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    files: [
                        { id: 'f1', name: 'test.str', modifiedTime: '2024-01-15T10:00:00Z' }
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
                json: () => Promise.resolve({ files: [] })
            });

            const result = await provider.showPicker();
            expect(result).toBeNull();
        });
    });

    describe('showSavePicker', () => {
        it('should get or create Story folder', async () => {
            // First call: search for folder
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    files: [{ id: 'story-folder-id' }]
                })
            });

            const result = await provider.showSavePicker('new-presentation.str');
            
            expect(result.type).toBe('save');
            expect(result.folderId).toBe('story-folder-id');
            expect(result.suggestedName).toBe('new-presentation.str');
        });

        it('should create Story folder if it does not exist', async () => {
            // First call: no folder found
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ files: [] })
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
