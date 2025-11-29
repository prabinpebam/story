/**
 * SharingManager
 * 
 * Unified API for file sharing across cloud storage providers (OneDrive, Google Drive).
 * Provides consistent interface for sharing with people, creating links, and managing access.
 * 
 * @see ../../../documentation/specs/storage/cloud-storage-abstraction.md
 */

import { SharingEvents, ShareRole, ShareLinkType, ShareLinkScope } from './SharingConstants.js';
import { PermissionNormalizer } from './PermissionNormalizer.js';
import { ShareLinkGenerator } from './ShareLinkGenerator.js';

/**
 * @typedef {Object} ShareResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} [email] - Email of the person shared with
 * @property {string} [role] - Role granted
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} Collaborator
 * @property {string} email - Collaborator's email
 * @property {string} name - Collaborator's display name
 * @property {string} role - Permission role (viewer, commenter, editor, owner)
 * @property {string} [avatar] - Avatar URL
 * @property {boolean} isOwner - Whether this is the file owner
 * @property {boolean} isPending - Whether invitation is pending
 */

/**
 * @typedef {Object} ShareLink
 * @property {string} url - Shareable URL
 * @property {string} type - Link type (view, edit, embed)
 * @property {string} scope - Link scope (anyone, organization, specific)
 * @property {Date} [expiresAt] - Expiration date if set
 * @property {boolean} requiresPassword - Whether password is required
 */

export class SharingManager {
    /**
     * Create a SharingManager
     * @param {Object} options - Configuration options
     * @param {Object} options.oneDriveProvider - OneDrive storage provider
     * @param {Object} options.googleDriveProvider - Google Drive storage provider
     * @param {EventTarget} [options.eventTarget] - Event target for dispatching events
     */
    constructor(options = {}) {
        this.oneDriveProvider = options.oneDriveProvider || null;
        this.googleDriveProvider = options.googleDriveProvider || null;
        this.eventTarget = options.eventTarget || new EventTarget();
        
        this.permissionNormalizer = new PermissionNormalizer();
        this.shareLinkGenerator = new ShareLinkGenerator();
        
        // Cache collaborator lists
        this._collaboratorCache = new Map();
        this._cacheTimeout = 60000; // 1 minute
    }

    /**
     * Share a file with one or more people
     * @param {string} fileId - File ID in the cloud provider
     * @param {string[]} emails - List of email addresses to share with
     * @param {string} role - Permission role (viewer, commenter, editor)
     * @param {Object} [options] - Share options
     * @param {string} [options.message] - Message to include in notification
     * @param {boolean} [options.sendNotification=true] - Whether to send email notification
     * @param {string} [options.provider] - Storage provider (onedrive, google-drive)
     * @returns {Promise<ShareResult[]>} Array of results for each email
     */
    async shareWithPeople(fileId, emails, role, options = {}) {
        const provider = this._getProvider(options.provider || fileId);
        const normalizedRole = this.permissionNormalizer.normalizeRole(role);
        
        const results = [];
        
        for (const email of emails) {
            try {
                await this._shareWithPerson(provider, fileId, email, normalizedRole, options);
                results.push({
                    success: true,
                    email,
                    role: normalizedRole
                });
                
                this._emitEvent(SharingEvents.SHARED, { fileId, email, role: normalizedRole });
            } catch (error) {
                results.push({
                    success: false,
                    email,
                    error: error.message
                });
                
                this._emitEvent(SharingEvents.SHARE_FAILED, { fileId, email, error: error.message });
            }
        }
        
        // Invalidate cache
        this._invalidateCache(fileId);
        
        return results;
    }

    /**
     * Share with a single person (provider-specific)
     * @private
     */
    async _shareWithPerson(provider, fileId, email, role, options) {
        const providerInfo = provider.getProviderInfo();
        
        if (providerInfo.id === 'onedrive') {
            return this._shareOneDrive(provider, fileId, email, role, options);
        } else if (providerInfo.id === 'google-drive') {
            return this._shareGoogleDrive(provider, fileId, email, role, options);
        }
        
        throw new Error(`Unsupported provider: ${providerInfo.id}`);
    }

    /**
     * Share via OneDrive
     * @private
     */
    async _shareOneDrive(provider, fileId, email, role, options) {
        await provider._ensureAuthenticated();
        
        const body = {
            recipients: [{ email }],
            message: options.message || '',
            requireSignIn: true,
            sendInvitation: options.sendNotification !== false,
            roles: [this.permissionNormalizer.toOneDriveRole(role)]
        };
        
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/invite`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to share file');
        }
        
        return await response.json();
    }

    /**
     * Share via Google Drive
     * @private
     */
    async _shareGoogleDrive(provider, fileId, email, role, options) {
        await provider._ensureAuthenticated();
        
        const body = {
            role: this.permissionNormalizer.toGoogleDriveRole(role),
            type: 'user',
            emailAddress: email
        };
        
        const params = new URLSearchParams({
            sendNotificationEmail: options.sendNotification !== false ? 'true' : 'false',
            emailMessage: options.message || ''
        });
        
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?${params}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to share file');
        }
        
        return await response.json();
    }

    /**
     * Create a shareable link for a file
     * @param {string} fileId - File ID in the cloud provider
     * @param {Object} [options] - Link options
     * @param {string} [options.type='view'] - Link type (view, edit)
     * @param {string} [options.scope='anyone'] - Link scope (anyone, organization)
     * @param {Date} [options.expiresAt] - Expiration date
     * @param {string} [options.password] - Password protection
     * @param {string} [options.provider] - Storage provider
     * @returns {Promise<ShareLink>} Created share link
     */
    async createShareLink(fileId, options = {}) {
        const provider = this._getProvider(options.provider || fileId);
        const providerInfo = provider.getProviderInfo();
        
        let link;
        
        if (providerInfo.id === 'onedrive') {
            link = await this._createOneDriveLink(provider, fileId, options);
        } else if (providerInfo.id === 'google-drive') {
            link = await this._createGoogleDriveLink(provider, fileId, options);
        } else {
            throw new Error(`Unsupported provider: ${providerInfo.id}`);
        }
        
        this._emitEvent(SharingEvents.LINK_CREATED, { fileId, link });
        
        return link;
    }

    /**
     * Create OneDrive share link
     * @private
     */
    async _createOneDriveLink(provider, fileId, options) {
        await provider._ensureAuthenticated();
        
        const type = options.type === 'edit' ? 'edit' : 'view';
        const scope = options.scope === 'organization' ? 'organization' : 'anonymous';
        
        const body = {
            type,
            scope
        };
        
        if (options.expiresAt) {
            body.expirationDateTime = options.expiresAt.toISOString();
        }
        
        if (options.password) {
            body.password = options.password;
        }
        
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/createLink`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to create share link');
        }
        
        const data = await response.json();
        
        return {
            url: data.link.webUrl,
            type: type === 'edit' ? ShareLinkType.EDIT : ShareLinkType.VIEW,
            scope: scope === 'organization' ? ShareLinkScope.ORGANIZATION : ShareLinkScope.ANYONE,
            expiresAt: data.expirationDateTime ? new Date(data.expirationDateTime) : null,
            requiresPassword: !!options.password
        };
    }

    /**
     * Create Google Drive share link
     * @private
     */
    async _createGoogleDriveLink(provider, fileId, options) {
        await provider._ensureAuthenticated();
        
        const role = options.type === 'edit' ? 'writer' : 'reader';
        
        // Create an "anyone" permission
        const body = {
            role,
            type: options.scope === 'organization' ? 'domain' : 'anyone'
        };
        
        if (options.expiresAt) {
            body.expirationTime = options.expiresAt.toISOString();
        }
        
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to create share link');
        }
        
        // Get the file's web view link
        const fileResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
            {
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`
                }
            }
        );
        
        if (!fileResponse.ok) {
            throw new Error('Failed to get file link');
        }
        
        const fileData = await fileResponse.json();
        
        return {
            url: fileData.webViewLink,
            type: options.type === 'edit' ? ShareLinkType.EDIT : ShareLinkType.VIEW,
            scope: options.scope === 'organization' ? ShareLinkScope.ORGANIZATION : ShareLinkScope.ANYONE,
            expiresAt: options.expiresAt || null,
            requiresPassword: false // Google Drive doesn't support password-protected links
        };
    }

    /**
     * Get list of collaborators for a file
     * @param {string} fileId - File ID
     * @param {Object} [options] - Options
     * @param {boolean} [options.useCache=true] - Whether to use cached data
     * @param {string} [options.provider] - Storage provider
     * @returns {Promise<Collaborator[]>} List of collaborators
     */
    async getCollaborators(fileId, options = {}) {
        const cacheKey = this._getCacheKey(fileId);
        
        // Check cache
        if (options.useCache !== false) {
            const cached = this._collaboratorCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this._cacheTimeout) {
                return cached.collaborators;
            }
        }
        
        const provider = this._getProvider(options.provider || fileId);
        const providerInfo = provider.getProviderInfo();
        
        let collaborators;
        
        if (providerInfo.id === 'onedrive') {
            collaborators = await this._getOneDriveCollaborators(provider, fileId);
        } else if (providerInfo.id === 'google-drive') {
            collaborators = await this._getGoogleDriveCollaborators(provider, fileId);
        } else {
            throw new Error(`Unsupported provider: ${providerInfo.id}`);
        }
        
        // Update cache
        this._collaboratorCache.set(cacheKey, {
            timestamp: Date.now(),
            collaborators
        });
        
        return collaborators;
    }

    /**
     * Get OneDrive collaborators
     * @private
     */
    async _getOneDriveCollaborators(provider, fileId) {
        await provider._ensureAuthenticated();
        
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/permissions`,
            {
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to get collaborators');
        }
        
        const data = await response.json();
        
        return data.value
            .filter(p => p.grantedToV2?.user)
            .map(p => ({
                id: p.id,
                email: p.grantedToV2.user.email || '',
                name: p.grantedToV2.user.displayName || 'Unknown',
                role: this.permissionNormalizer.fromOneDriveRole(p.roles?.[0] || 'read'),
                avatar: null,
                isOwner: p.roles?.includes('owner') || false,
                isPending: p.invitation?.signInRequired || false
            }));
    }

    /**
     * Get Google Drive collaborators
     * @private
     */
    async _getGoogleDriveCollaborators(provider, fileId) {
        await provider._ensureAuthenticated();
        
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?fields=permissions(id,emailAddress,displayName,role,photoLink,pendingOwner)`,
            {
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to get collaborators');
        }
        
        const data = await response.json();
        
        return (data.permissions || [])
            .filter(p => p.type === 'user')
            .map(p => ({
                id: p.id,
                email: p.emailAddress || '',
                name: p.displayName || 'Unknown',
                role: this.permissionNormalizer.fromGoogleDriveRole(p.role),
                avatar: p.photoLink || null,
                isOwner: p.role === 'owner',
                isPending: false
            }));
    }

    /**
     * Update access level for a collaborator
     * @param {string} fileId - File ID
     * @param {string} email - Collaborator's email
     * @param {string} newRole - New role (viewer, commenter, editor)
     * @param {Object} [options] - Options
     * @param {string} [options.provider] - Storage provider
     * @returns {Promise<void>}
     */
    async updateAccess(fileId, email, newRole, options = {}) {
        const provider = this._getProvider(options.provider || fileId);
        const providerInfo = provider.getProviderInfo();
        const normalizedRole = this.permissionNormalizer.normalizeRole(newRole);
        
        // First, find the permission ID for this email
        const collaborators = await this.getCollaborators(fileId, { ...options, useCache: false });
        const collaborator = collaborators.find(c => c.email.toLowerCase() === email.toLowerCase());
        
        if (!collaborator) {
            throw new Error(`Collaborator not found: ${email}`);
        }
        
        if (collaborator.isOwner) {
            throw new Error('Cannot change owner permissions');
        }
        
        if (providerInfo.id === 'onedrive') {
            await this._updateOneDriveAccess(provider, fileId, collaborator.id, normalizedRole);
        } else if (providerInfo.id === 'google-drive') {
            await this._updateGoogleDriveAccess(provider, fileId, collaborator.id, normalizedRole);
        }
        
        this._invalidateCache(fileId);
        this._emitEvent(SharingEvents.ACCESS_UPDATED, { fileId, email, role: normalizedRole });
    }

    /**
     * Update OneDrive access
     * @private
     */
    async _updateOneDriveAccess(provider, fileId, permissionId, role) {
        await provider._ensureAuthenticated();
        
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/permissions/${permissionId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roles: [this.permissionNormalizer.toOneDriveRole(role)]
                })
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to update access');
        }
    }

    /**
     * Update Google Drive access
     * @private
     */
    async _updateGoogleDriveAccess(provider, fileId, permissionId, role) {
        await provider._ensureAuthenticated();
        
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${permissionId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: this.permissionNormalizer.toGoogleDriveRole(role)
                })
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to update access');
        }
    }

    /**
     * Remove access for a collaborator
     * @param {string} fileId - File ID
     * @param {string} email - Collaborator's email to remove
     * @param {Object} [options] - Options
     * @param {string} [options.provider] - Storage provider
     * @returns {Promise<void>}
     */
    async removeAccess(fileId, email, options = {}) {
        const provider = this._getProvider(options.provider || fileId);
        const providerInfo = provider.getProviderInfo();
        
        // Find the permission ID
        const collaborators = await this.getCollaborators(fileId, { ...options, useCache: false });
        const collaborator = collaborators.find(c => c.email.toLowerCase() === email.toLowerCase());
        
        if (!collaborator) {
            throw new Error(`Collaborator not found: ${email}`);
        }
        
        if (collaborator.isOwner) {
            throw new Error('Cannot remove owner access');
        }
        
        if (providerInfo.id === 'onedrive') {
            await this._removeOneDriveAccess(provider, fileId, collaborator.id);
        } else if (providerInfo.id === 'google-drive') {
            await this._removeGoogleDriveAccess(provider, fileId, collaborator.id);
        }
        
        this._invalidateCache(fileId);
        this._emitEvent(SharingEvents.ACCESS_REMOVED, { fileId, email });
    }

    /**
     * Remove OneDrive access
     * @private
     */
    async _removeOneDriveAccess(provider, fileId, permissionId) {
        await provider._ensureAuthenticated();
        
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/permissions/${permissionId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`
                }
            }
        );
        
        if (!response.ok && response.status !== 204) {
            throw new Error('Failed to remove access');
        }
    }

    /**
     * Remove Google Drive access
     * @private
     */
    async _removeGoogleDriveAccess(provider, fileId, permissionId) {
        await provider._ensureAuthenticated();
        
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${permissionId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`
                }
            }
        );
        
        if (!response.ok && response.status !== 204) {
            throw new Error('Failed to remove access');
        }
    }

    /**
     * Revoke a share link
     * @param {string} fileId - File ID
     * @param {string} linkId - Link ID to revoke
     * @param {Object} [options] - Options
     * @param {string} [options.provider] - Storage provider
     * @returns {Promise<void>}
     */
    async revokeShareLink(fileId, linkId, options = {}) {
        const provider = this._getProvider(options.provider || fileId);
        const providerInfo = provider.getProviderInfo();
        
        if (providerInfo.id === 'onedrive') {
            await this._revokeOneDriveLink(provider, fileId, linkId);
        } else if (providerInfo.id === 'google-drive') {
            await this._revokeGoogleDriveLink(provider, fileId, linkId);
        }
        
        this._emitEvent(SharingEvents.LINK_REVOKED, { fileId, linkId });
    }

    /**
     * Revoke OneDrive link
     * @private
     */
    async _revokeOneDriveLink(provider, fileId, linkId) {
        await provider._ensureAuthenticated();
        
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/permissions/${linkId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`
                }
            }
        );
        
        if (!response.ok && response.status !== 204) {
            throw new Error('Failed to revoke share link');
        }
    }

    /**
     * Revoke Google Drive link
     * @private
     */
    async _revokeGoogleDriveLink(provider, fileId, linkId) {
        await provider._ensureAuthenticated();
        
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${linkId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`
                }
            }
        );
        
        if (!response.ok && response.status !== 204) {
            throw new Error('Failed to revoke share link');
        }
    }

    /**
     * Get share links for a file
     * @param {string} fileId - File ID
     * @param {Object} [options] - Options
     * @param {string} [options.provider] - Storage provider
     * @returns {Promise<ShareLink[]>} List of share links
     */
    async getShareLinks(fileId, options = {}) {
        const provider = this._getProvider(options.provider || fileId);
        const providerInfo = provider.getProviderInfo();
        
        if (providerInfo.id === 'onedrive') {
            return this._getOneDriveShareLinks(provider, fileId);
        } else if (providerInfo.id === 'google-drive') {
            return this._getGoogleDriveShareLinks(provider, fileId);
        }
        
        throw new Error(`Unsupported provider: ${providerInfo.id}`);
    }

    /**
     * Get OneDrive share links
     * @private
     */
    async _getOneDriveShareLinks(provider, fileId) {
        await provider._ensureAuthenticated();
        
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/permissions`,
            {
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to get share links');
        }
        
        const data = await response.json();
        
        return data.value
            .filter(p => p.link)
            .map(p => ({
                id: p.id,
                url: p.link.webUrl,
                type: p.link.type === 'edit' ? ShareLinkType.EDIT : ShareLinkType.VIEW,
                scope: p.link.scope === 'organization' ? ShareLinkScope.ORGANIZATION : ShareLinkScope.ANYONE,
                expiresAt: p.expirationDateTime ? new Date(p.expirationDateTime) : null,
                requiresPassword: p.hasPassword || false
            }));
    }

    /**
     * Get Google Drive share links
     * @private
     */
    async _getGoogleDriveShareLinks(provider, fileId) {
        await provider._ensureAuthenticated();
        
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?fields=permissions(id,type,role,expirationTime)`,
            {
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to get share links');
        }
        
        const data = await response.json();
        
        // Get the file's web view link
        const fileResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
            {
                headers: {
                    'Authorization': `Bearer ${provider._accessToken}`
                }
            }
        );
        
        let webViewLink = '';
        if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            webViewLink = fileData.webViewLink;
        }
        
        return (data.permissions || [])
            .filter(p => p.type === 'anyone' || p.type === 'domain')
            .map(p => ({
                id: p.id,
                url: webViewLink,
                type: p.role === 'writer' ? ShareLinkType.EDIT : ShareLinkType.VIEW,
                scope: p.type === 'domain' ? ShareLinkScope.ORGANIZATION : ShareLinkScope.ANYONE,
                expiresAt: p.expirationTime ? new Date(p.expirationTime) : null,
                requiresPassword: false
            }));
    }

    /**
     * Check if current user can share a file
     * @param {string} fileId - File ID
     * @param {Object} [options] - Options
     * @param {string} [options.provider] - Storage provider
     * @returns {Promise<boolean>} Whether user can share
     */
    async canShare(fileId, options = {}) {
        try {
            const provider = this._getProvider(options.provider || fileId);
            const providerInfo = provider.getProviderInfo();
            
            if (providerInfo.id === 'onedrive') {
                return this._canShareOneDrive(provider, fileId);
            } else if (providerInfo.id === 'google-drive') {
                return this._canShareGoogleDrive(provider, fileId);
            }
            
            return false;
        } catch {
            return false;
        }
    }

    /**
     * Check OneDrive share capability
     * @private
     */
    async _canShareOneDrive(provider, fileId) {
        try {
            await provider._ensureAuthenticated();
            
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}?$select=permissions`,
                {
                    headers: {
                        'Authorization': `Bearer ${provider._accessToken}`
                    }
                }
            );
            
            if (!response.ok) {
                return false;
            }
            
            // If we can read the file, we likely have some share permissions
            // More precise check would look at @microsoft.graph.capabilities
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check Google Drive share capability
     * @private
     */
    async _canShareGoogleDrive(provider, fileId) {
        try {
            await provider._ensureAuthenticated();
            
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?fields=capabilities(canShare)`,
                {
                    headers: {
                        'Authorization': `Bearer ${provider._accessToken}`
                    }
                }
            );
            
            if (!response.ok) {
                return false;
            }
            
            const data = await response.json();
            return data.capabilities?.canShare ?? false;
        } catch {
            return false;
        }
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event listener
     */
    addEventListener(event, listener) {
        this.eventTarget.addEventListener(event, listener);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event listener
     */
    removeEventListener(event, listener) {
        this.eventTarget.removeEventListener(event, listener);
    }

    /**
     * Get the appropriate provider for a file
     * @private
     */
    _getProvider(providerOrFileId) {
        // If it's a string, try to determine provider from file ID format or use passed value
        if (typeof providerOrFileId === 'string') {
            if (providerOrFileId === 'onedrive' || providerOrFileId === 'microsoft') {
                if (!this.oneDriveProvider) {
                    throw new Error('OneDrive provider not configured');
                }
                return this.oneDriveProvider;
            }
            
            if (providerOrFileId === 'google-drive' || providerOrFileId === 'google') {
                if (!this.googleDriveProvider) {
                    throw new Error('Google Drive provider not configured');
                }
                return this.googleDriveProvider;
            }
        }
        
        // Default to OneDrive if available, otherwise Google Drive
        if (this.oneDriveProvider) {
            return this.oneDriveProvider;
        }
        
        if (this.googleDriveProvider) {
            return this.googleDriveProvider;
        }
        
        throw new Error('No storage provider configured');
    }

    /**
     * Emit an event
     * @private
     */
    _emitEvent(eventName, detail) {
        this.eventTarget.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    /**
     * Get cache key for a file
     * @private
     */
    _getCacheKey(fileId) {
        return `collaborators:${fileId}`;
    }

    /**
     * Invalidate cache for a file
     * @private
     */
    _invalidateCache(fileId) {
        const key = this._getCacheKey(fileId);
        this._collaboratorCache.delete(key);
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this._collaboratorCache.clear();
    }
}

export default SharingManager;
