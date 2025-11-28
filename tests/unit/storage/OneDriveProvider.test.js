/**
 * Tests for OneDriveProvider
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OneDriveProvider } from '../../../src/core/storage/providers/OneDriveProvider.js';

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

        it('should not be authenticated initially', () => {
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
        it('should generate code verifier and store it', async () => {
            await provider.authenticate();
            
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
                'microsoft_code_verifier',
                expect.any(String)
            );
        });

        it('should redirect to Microsoft OAuth URL', async () => {
            await provider.authenticate();
            
            expect(mockLocation.href).toContain('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
            expect(mockLocation.href).toContain('client_id=test-client-id');
            expect(mockLocation.href).toContain('response_type=code');
            expect(mockLocation.href).toContain('code_challenge=');
        });

        it('should include required scopes', async () => {
            await provider.authenticate();
            
            const url = mockLocation.href;
            expect(url).toContain('scope=');
            expect(url).toContain('openid');
            expect(url).toContain('Files.ReadWrite');
        });
    });

    describe('handleCallback', () => {
        beforeEach(() => {
            // Store code verifier as if authenticate was called
            sessionStorageData['microsoft_code_verifier'] = 'test-verifier';
        });

        it('should exchange code for tokens', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    access_token: 'test-access-token',
                    refresh_token: 'test-refresh-token',
                    expires_in: 3600
                })
            }).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    displayName: 'Test User',
                    mail: 'test@example.com'
                })
            });

            await provider.handleCallback('auth-code');
            
            expect(mockFetch).toHaveBeenCalledWith(
                'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                expect.objectContaining({
                    method: 'POST'
                })
            );
            expect(provider.isAuthenticated()).toBe(true);
        });

        it('should throw if no code verifier found', async () => {
            delete sessionStorageData['microsoft_code_verifier'];
            
            await expect(provider.handleCallback('auth-code'))
                .rejects.toThrow('No code verifier found');
        });

        it('should throw on token exchange failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({
                    error_description: 'Invalid code'
                })
            });

            await expect(provider.handleCallback('auth-code'))
                .rejects.toThrow('Invalid code');
        });

        it('should remove code verifier after use', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    access_token: 'token',
                    expires_in: 3600
                })
            }).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ displayName: 'User' })
            });

            await provider.handleCallback('auth-code');
            
            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('microsoft_code_verifier');
        });
    });

    describe('signOut', () => {
        beforeEach(async () => {
            // Simulate authenticated state
            sessionStorageData['microsoft_code_verifier'] = 'test-verifier';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    access_token: 'test-token',
                    expires_in: 3600
                })
            }).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ displayName: 'User' })
            });
            await provider.handleCallback('code');
        });

        it('should clear tokens', async () => {
            expect(provider.isAuthenticated()).toBe(true);
            
            await provider.signOut();
            
            expect(provider.isAuthenticated()).toBe(false);
        });

        it('should remove stored tokens', async () => {
            await provider.signOut();
            
            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('microsoft_tokens');
        });
    });

    describe('read', () => {
        beforeEach(() => {
            // Set up authenticated state
            provider._accessToken = 'test-token';
            provider._tokenExpiry = Date.now() + 3600000;
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
            provider._accessToken = null;
            
            await expect(provider.read({ id: 'file-123' }))
                .rejects.toThrow('Not authenticated');
        });
    });

    describe('write', () => {
        beforeEach(() => {
            provider._accessToken = 'test-token';
            provider._tokenExpiry = Date.now() + 3600000;
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
            provider._accessToken = 'test-token';
            provider._tokenExpiry = Date.now() + 3600000;
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
            provider._accessToken = 'test-token';
            provider._tokenExpiry = Date.now() + 3600000;
        });

        it('should delete file', async () => {
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
            provider._accessToken = 'test-token';
            provider._tokenExpiry = Date.now() + 3600000;
        });

        it('should list .str files', async () => {
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
            provider._accessToken = 'test-token';
            provider._tokenExpiry = Date.now() + 3600000;
        });

        it('should fetch user info', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    displayName: 'Test User',
                    mail: 'test@example.com',
                    userPrincipalName: 'test@example.com'
                })
            });

            const user = await provider.getUserInfo();
            
            expect(user.displayName).toBe('Test User');
            expect(user.mail).toBe('test@example.com');
        });

        it('should cache user info', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ displayName: 'Test User' })
            });

            await provider.getUserInfo();
            await provider.getUserInfo();
            
            // Should only fetch once
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

    describe('refreshAccessToken', () => {
        beforeEach(() => {
            provider._accessToken = 'old-token';
            provider._refreshToken = 'test-refresh-token';
            provider._tokenExpiry = Date.now() - 1000; // Expired
        });

        it('should refresh token', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    access_token: 'new-access-token',
                    expires_in: 3600
                })
            }).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ displayName: 'User' })
            });

            await provider.refreshAccessToken();
            
            expect(provider.isAuthenticated()).toBe(true);
        });

        it('should throw if no refresh token', async () => {
            provider._refreshToken = null;
            
            await expect(provider.refreshAccessToken())
                .rejects.toThrow('No refresh token available');
        });

        it('should clear tokens on refresh failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400
            });

            await expect(provider.refreshAccessToken())
                .rejects.toThrow('Session expired');
            
            expect(provider.isAuthenticated()).toBe(false);
        });
    });

    describe('showPicker', () => {
        beforeEach(() => {
            provider._accessToken = 'test-token';
            provider._tokenExpiry = Date.now() + 3600000;
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
            provider._accessToken = 'test-token';
            provider._tokenExpiry = Date.now() + 3600000;
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
