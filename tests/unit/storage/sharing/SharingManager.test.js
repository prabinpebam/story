/**
 * SharingManager Tests
 * 
 * Tests for the unified sharing API across cloud storage providers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SharingManager } from '../../../../src/core/storage/sharing/SharingManager.js';
import { SharingEvents, ShareRole, ShareLinkType, ShareLinkScope } from '../../../../src/core/storage/sharing/SharingConstants.js';

// Mock providers
function createMockOneDriveProvider() {
    return {
        getProviderInfo: () => ({ id: 'onedrive', name: 'OneDrive' }),
        _accessToken: 'mock-token',
        _ensureAuthenticated: vi.fn().mockResolvedValue(undefined)
    };
}

function createMockGoogleDriveProvider() {
    return {
        getProviderInfo: () => ({ id: 'google-drive', name: 'Google Drive' }),
        _accessToken: 'mock-token',
        _ensureAuthenticated: vi.fn().mockResolvedValue(undefined)
    };
}

describe('SharingManager', () => {
    let sharingManager;
    let mockOneDriveProvider;
    let mockGoogleDriveProvider;
    
    beforeEach(() => {
        mockOneDriveProvider = createMockOneDriveProvider();
        mockGoogleDriveProvider = createMockGoogleDriveProvider();
        
        sharingManager = new SharingManager({
            oneDriveProvider: mockOneDriveProvider,
            googleDriveProvider: mockGoogleDriveProvider
        });
        
        // Mock global fetch
        global.fetch = vi.fn();
    });
    
    afterEach(() => {
        vi.restoreAllMocks();
    });
    
    describe('constructor', () => {
        it('should create with providers', () => {
            expect(sharingManager.oneDriveProvider).toBe(mockOneDriveProvider);
            expect(sharingManager.googleDriveProvider).toBe(mockGoogleDriveProvider);
        });
        
        it('should create without providers', () => {
            const manager = new SharingManager();
            expect(manager.oneDriveProvider).toBeNull();
            expect(manager.googleDriveProvider).toBeNull();
        });
        
        it('should initialize permission normalizer and link generator', () => {
            expect(sharingManager.permissionNormalizer).toBeDefined();
            expect(sharingManager.shareLinkGenerator).toBeDefined();
        });
    });
    
    describe('shareWithPeople', () => {
        it('should share via OneDrive', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ value: [] })
            });
            
            const results = await sharingManager.shareWithPeople(
                'file123',
                ['test@example.com'],
                'editor',
                { provider: 'onedrive' }
            );
            
            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
            expect(results[0].email).toBe('test@example.com');
            expect(results[0].role).toBe('editor');
        });
        
        it('should share via Google Drive', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ id: 'perm123' })
            });
            
            const results = await sharingManager.shareWithPeople(
                'file123',
                ['test@example.com'],
                'viewer',
                { provider: 'google-drive' }
            );
            
            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
            expect(results[0].role).toBe('viewer');
        });
        
        it('should share with multiple people', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({})
            });
            
            const emails = ['a@test.com', 'b@test.com', 'c@test.com'];
            const results = await sharingManager.shareWithPeople(
                'file123',
                emails,
                'editor',
                { provider: 'onedrive' }
            );
            
            expect(results).toHaveLength(3);
            expect(results.every(r => r.success)).toBe(true);
        });
        
        it('should handle share failures', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error: { message: 'User not found' } })
            });
            
            const results = await sharingManager.shareWithPeople(
                'file123',
                ['invalid@test.com'],
                'editor',
                { provider: 'onedrive' }
            );
            
            expect(results[0].success).toBe(false);
            expect(results[0].error).toBe('User not found');
        });
        
        it('should emit SHARED event on success', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });
            
            const listener = vi.fn();
            sharingManager.addEventListener(SharingEvents.SHARED, listener);
            
            await sharingManager.shareWithPeople(
                'file123',
                ['test@example.com'],
                'editor',
                { provider: 'onedrive' }
            );
            
            expect(listener).toHaveBeenCalled();
        });
        
        it('should emit SHARE_FAILED event on failure', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error: { message: 'Failed' } })
            });
            
            const listener = vi.fn();
            sharingManager.addEventListener(SharingEvents.SHARE_FAILED, listener);
            
            await sharingManager.shareWithPeople(
                'file123',
                ['test@example.com'],
                'editor',
                { provider: 'onedrive' }
            );
            
            expect(listener).toHaveBeenCalled();
        });
        
        it('should include message in notification', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });
            
            await sharingManager.shareWithPeople(
                'file123',
                ['test@example.com'],
                'editor',
                { provider: 'onedrive', message: 'Check this out!' }
            );
            
            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('Check this out!')
                })
            );
        });
    });
    
    describe('createShareLink', () => {
        it('should create OneDrive view link', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    link: { webUrl: 'https://1drv.ms/xxx', type: 'view', scope: 'anonymous' }
                })
            });
            
            const link = await sharingManager.createShareLink('file123', {
                provider: 'onedrive',
                type: 'view'
            });
            
            expect(link.url).toBe('https://1drv.ms/xxx');
            expect(link.type).toBe(ShareLinkType.VIEW);
            expect(link.scope).toBe(ShareLinkScope.ANYONE);
        });
        
        it('should create OneDrive edit link', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    link: { webUrl: 'https://1drv.ms/xxx', type: 'edit', scope: 'anonymous' }
                })
            });
            
            const link = await sharingManager.createShareLink('file123', {
                provider: 'onedrive',
                type: 'edit'
            });
            
            expect(link.type).toBe(ShareLinkType.EDIT);
        });
        
        it('should create Google Drive link', async () => {
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: 'perm123' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ webViewLink: 'https://drive.google.com/xxx' })
                });
            
            const link = await sharingManager.createShareLink('file123', {
                provider: 'google-drive'
            });
            
            expect(link.url).toBe('https://drive.google.com/xxx');
        });
        
        it('should support organization scope', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    link: { webUrl: 'https://1drv.ms/xxx', type: 'view', scope: 'organization' }
                })
            });
            
            const link = await sharingManager.createShareLink('file123', {
                provider: 'onedrive',
                scope: 'organization'
            });
            
            expect(link.scope).toBe(ShareLinkScope.ORGANIZATION);
        });
        
        it('should support expiration date', async () => {
            const expiresAt = new Date('2024-12-31');
            
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    link: { webUrl: 'https://1drv.ms/xxx' },
                    expirationDateTime: expiresAt.toISOString()
                })
            });
            
            const link = await sharingManager.createShareLink('file123', {
                provider: 'onedrive',
                expiresAt
            });
            
            expect(link.expiresAt).toEqual(expiresAt);
        });
        
        it('should emit LINK_CREATED event', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    link: { webUrl: 'https://1drv.ms/xxx' }
                })
            });
            
            const listener = vi.fn();
            sharingManager.addEventListener(SharingEvents.LINK_CREATED, listener);
            
            await sharingManager.createShareLink('file123', { provider: 'onedrive' });
            
            expect(listener).toHaveBeenCalled();
        });
    });
    
    describe('getCollaborators', () => {
        it('should get OneDrive collaborators', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    value: [
                        {
                            id: 'p1',
                            grantedToV2: { user: { email: 'a@test.com', displayName: 'User A' } },
                            roles: ['write']
                        },
                        {
                            id: 'p2',
                            grantedToV2: { user: { email: 'b@test.com', displayName: 'User B' } },
                            roles: ['owner']
                        }
                    ]
                })
            });
            
            const collaborators = await sharingManager.getCollaborators('file123', {
                provider: 'onedrive'
            });
            
            expect(collaborators).toHaveLength(2);
            expect(collaborators[0].email).toBe('a@test.com');
            expect(collaborators[0].role).toBe(ShareRole.EDITOR);
            expect(collaborators[1].isOwner).toBe(true);
        });
        
        it('should get Google Drive collaborators', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    permissions: [
                        {
                            id: 'p1',
                            type: 'user',
                            emailAddress: 'a@test.com',
                            displayName: 'User A',
                            role: 'writer'
                        }
                    ]
                })
            });
            
            const collaborators = await sharingManager.getCollaborators('file123', {
                provider: 'google-drive'
            });
            
            expect(collaborators).toHaveLength(1);
            expect(collaborators[0].role).toBe(ShareRole.EDITOR);
        });
        
        it('should use cache by default', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ value: [] })
            });
            
            await sharingManager.getCollaborators('file123', { provider: 'onedrive' });
            await sharingManager.getCollaborators('file123', { provider: 'onedrive' });
            
            // Should only fetch once due to caching
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
        
        it('should bypass cache when requested', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ value: [] })
            });
            
            await sharingManager.getCollaborators('file123', { provider: 'onedrive' });
            await sharingManager.getCollaborators('file123', { provider: 'onedrive', useCache: false });
            
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });
    
    describe('updateAccess', () => {
        beforeEach(() => {
            // Mock getCollaborators first
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    value: [{
                        id: 'p1',
                        grantedToV2: { user: { email: 'test@test.com', displayName: 'Test' } },
                        roles: ['read']
                    }]
                })
            });
        });
        
        it('should update OneDrive access', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });
            
            await sharingManager.updateAccess('file123', 'test@test.com', 'editor', {
                provider: 'onedrive'
            });
            
            expect(global.fetch).toHaveBeenLastCalledWith(
                expect.stringContaining('permissions/p1'),
                expect.objectContaining({
                    method: 'PATCH'
                })
            );
        });
        
        it('should emit ACCESS_UPDATED event', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });
            
            const listener = vi.fn();
            sharingManager.addEventListener(SharingEvents.ACCESS_UPDATED, listener);
            
            await sharingManager.updateAccess('file123', 'test@test.com', 'editor', {
                provider: 'onedrive'
            });
            
            expect(listener).toHaveBeenCalled();
        });
        
        it('should throw for non-existent collaborator', async () => {
            await expect(
                sharingManager.updateAccess('file123', 'notfound@test.com', 'editor', {
                    provider: 'onedrive'
                })
            ).rejects.toThrow('Collaborator not found');
        });
    });
    
    describe('removeAccess', () => {
        beforeEach(() => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    value: [{
                        id: 'p1',
                        grantedToV2: { user: { email: 'test@test.com', displayName: 'Test' } },
                        roles: ['read']
                    }]
                })
            });
        });
        
        it('should remove OneDrive access', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 204
            });
            
            await sharingManager.removeAccess('file123', 'test@test.com', {
                provider: 'onedrive'
            });
            
            expect(global.fetch).toHaveBeenLastCalledWith(
                expect.stringContaining('permissions/p1'),
                expect.objectContaining({
                    method: 'DELETE'
                })
            );
        });
        
        it('should emit ACCESS_REMOVED event', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 204
            });
            
            const listener = vi.fn();
            sharingManager.addEventListener(SharingEvents.ACCESS_REMOVED, listener);
            
            await sharingManager.removeAccess('file123', 'test@test.com', {
                provider: 'onedrive'
            });
            
            expect(listener).toHaveBeenCalled();
        });
    });
    
    describe('getShareLinks', () => {
        it('should get OneDrive share links', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    value: [
                        {
                            id: 'l1',
                            link: { webUrl: 'https://1drv.ms/xxx', type: 'view', scope: 'anonymous' }
                        }
                    ]
                })
            });
            
            const links = await sharingManager.getShareLinks('file123', {
                provider: 'onedrive'
            });
            
            expect(links).toHaveLength(1);
            expect(links[0].url).toBe('https://1drv.ms/xxx');
        });
    });
    
    describe('revokeShareLink', () => {
        it('should revoke OneDrive link', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 204
            });
            
            await sharingManager.revokeShareLink('file123', 'link1', {
                provider: 'onedrive'
            });
            
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('permissions/link1'),
                expect.objectContaining({
                    method: 'DELETE'
                })
            );
        });
        
        it('should emit LINK_REVOKED event', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 204
            });
            
            const listener = vi.fn();
            sharingManager.addEventListener(SharingEvents.LINK_REVOKED, listener);
            
            await sharingManager.revokeShareLink('file123', 'link1', {
                provider: 'onedrive'
            });
            
            expect(listener).toHaveBeenCalled();
        });
    });
    
    describe('canShare', () => {
        it('should check OneDrive share capability', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });
            
            const canShare = await sharingManager.canShare('file123', {
                provider: 'onedrive'
            });
            
            expect(canShare).toBe(true);
        });
        
        it('should check Google Drive share capability', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    capabilities: { canShare: true }
                })
            });
            
            const canShare = await sharingManager.canShare('file123', {
                provider: 'google-drive'
            });
            
            expect(canShare).toBe(true);
        });
        
        it('should return false on error', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));
            
            const canShare = await sharingManager.canShare('file123', {
                provider: 'onedrive'
            });
            
            expect(canShare).toBe(false);
        });
    });
    
    describe('event handling', () => {
        it('should add and remove event listeners', () => {
            const listener = vi.fn();
            
            sharingManager.addEventListener(SharingEvents.SHARED, listener);
            sharingManager.eventTarget.dispatchEvent(new CustomEvent(SharingEvents.SHARED));
            
            expect(listener).toHaveBeenCalledTimes(1);
            
            sharingManager.removeEventListener(SharingEvents.SHARED, listener);
            sharingManager.eventTarget.dispatchEvent(new CustomEvent(SharingEvents.SHARED));
            
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });
    
    describe('cache management', () => {
        it('should clear cache', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ value: [] })
            });
            
            await sharingManager.getCollaborators('file123', { provider: 'onedrive' });
            sharingManager.clearCache();
            await sharingManager.getCollaborators('file123', { provider: 'onedrive' });
            
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });
    
    describe('provider selection', () => {
        it('should throw when no providers configured', () => {
            const manager = new SharingManager();
            
            expect(() => manager._getProvider('file123')).toThrow('No storage provider configured');
        });
        
        it('should select OneDrive when specified', () => {
            const provider = sharingManager._getProvider('onedrive');
            expect(provider).toBe(mockOneDriveProvider);
        });
        
        it('should select Google Drive when specified', () => {
            const provider = sharingManager._getProvider('google-drive');
            expect(provider).toBe(mockGoogleDriveProvider);
        });
    });
});
