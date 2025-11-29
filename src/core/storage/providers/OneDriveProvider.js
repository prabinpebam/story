/**
 * OneDriveProvider
 * Storage provider for Microsoft OneDrive integration
 * 
 * Uses Microsoft Graph API with OAuth 2.0 PKCE flow
 * Integrates with app-level authService for shared authentication
 */

import { IStorageProvider } from './IStorageProvider.js';
import { FILE_FORMAT, STORAGE_ERRORS } from '../constants/StorageConstants.js';
import { authService } from '../../auth/AuthService.js';
import { tokenStorage } from '../../auth/storage/TokenStorage.js';

// Microsoft API endpoints
const MICROSOFT_API = {
    AUTH: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    TOKEN: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    GRAPH: 'https://graph.microsoft.com/v1.0',
    ME: 'https://graph.microsoft.com/v1.0/me'
};

// OAuth scopes
const SCOPES = [
    'openid',
    'profile',
    'email',
    'Files.ReadWrite',
    'offline_access'
].join(' ');

export class OneDriveProvider extends IStorageProvider {
    /**
     * Create a OneDrive provider
     * @param {Object} options - Configuration options
     * @param {string} options.clientId - Microsoft OAuth client ID
     * @param {string} options.redirectUri - OAuth redirect URI
     */
    constructor(options = {}) {
        super();
        
        this.clientId = options.clientId;
        this.redirectUri = options.redirectUri || `${window.location.origin}/auth/microsoft/callback`;
        
        this._user = null;
        this._storyFolderId = null;
    }

    /**
     * @inheritdoc
     */
    getProviderInfo() {
        return {
            id: 'onedrive',
            name: 'OneDrive',
            icon: 'onedrive',
            supportsAuth: true,
            supportsConflictResolution: true
        };
    }

    /**
     * @inheritdoc
     * Uses app-level auth state for Microsoft provider
     */
    isAuthenticated() {
        // Check if user is authenticated at app level with Microsoft
        const provider = tokenStorage.getProvider();
        if (provider !== 'microsoft') {
            return false;
        }
        return tokenStorage.isAuthenticated();
    }

    /**
     * Get access token from app-level auth
     * @returns {Promise<string|null>}
     * @private
     */
    async _getAccessToken() {
        // Use app-level auth service to get (and refresh if needed) the token
        return await authService.getAccessToken();
    }

    /**
     * @inheritdoc
     * Delegates to app-level auth service
     */
    async authenticate() {
        // Use app-level auth service for authentication
        await authService.login('microsoft');
    }

    /**
     * @inheritdoc
     */
    async signOut() {
        await authService.logout();
    }

    /**
     * @inheritdoc
     */
    async showPicker() {
        await this._ensureAuthenticated();
        
        // List .str files in OneDrive
        const files = await this._listStrFiles();
        
        if (files.length === 0) {
            return null;
        }

        return {
            type: 'picker',
            files: files
        };
    }

    /**
     * @inheritdoc
     */
    async showSavePicker(suggestedName) {
        await this._ensureAuthenticated();
        
        // Ensure we have the Story folder
        const folderId = await this._getOrCreateStoryFolder();
        
        return {
            type: 'save',
            folderId: folderId,
            suggestedName: suggestedName,
            provider: 'onedrive'
        };
    }

    /**
     * @inheritdoc
     */
    async read(handle, options = {}) {
        const accessToken = await this._ensureAuthenticated();

        const response = await fetch(
            `${MICROSOFT_API.GRAPH}/me/drive/items/${handle.id}/content`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(STORAGE_ERRORS.READ_FAILED);
        }

        // Report progress if content length is known
        const contentLength = response.headers.get('content-length');
        if (contentLength && options.onProgress) {
            const reader = response.body.getReader();
            const total = parseInt(contentLength, 10);
            let received = 0;
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                received += value.length;
                options.onProgress(received / total);
            }

            const allChunks = new Uint8Array(received);
            let position = 0;
            for (const chunk of chunks) {
                allChunks.set(chunk, position);
                position += chunk.length;
            }
            return allChunks.buffer;
        }

        return await response.arrayBuffer();
    }

    /**
     * @inheritdoc
     */
    async write(handle, data, options = {}) {
        const accessToken = await this._ensureAuthenticated();

        const blob = data instanceof Blob ? data : new Blob([data]);
        
        // Use upload session for large files (> 4MB)
        if (blob.size > 4 * 1024 * 1024) {
            return await this._uploadLargeFile(handle, blob, options);
        }

        // Simple upload for small files
        const url = handle.id
            ? `${MICROSOFT_API.GRAPH}/me/drive/items/${handle.id}/content`
            : `${MICROSOFT_API.GRAPH}/me/drive/items/${handle.folderId || 'root'}:/${handle.name || 'presentation.str'}:/content`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': FILE_FORMAT.MIME_TYPE
            },
            body: blob
        });

        if (!response.ok) {
            throw new Error(STORAGE_ERRORS.WRITE_FAILED);
        }

        if (options.onProgress) {
            options.onProgress(1);
        }

        const fileData = await response.json();
        return this._toFileHandle(fileData);
    }

    /**
     * Upload large file using upload session
     * @param {Object} handle - File handle
     * @param {Blob} blob - File data
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Updated file handle
     * @private
     */
    async _uploadLargeFile(handle, blob, options) {
        const accessToken = await this._ensureAuthenticated();
        
        // Create upload session
        const sessionUrl = handle.id
            ? `${MICROSOFT_API.GRAPH}/me/drive/items/${handle.id}/createUploadSession`
            : `${MICROSOFT_API.GRAPH}/me/drive/items/${handle.folderId || 'root'}:/${handle.name || 'presentation.str'}:/createUploadSession`;

        const sessionResponse = await fetch(sessionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item: {
                    '@microsoft.graph.conflictBehavior': 'replace'
                }
            })
        });

        if (!sessionResponse.ok) {
            throw new Error(STORAGE_ERRORS.WRITE_FAILED);
        }

        const session = await sessionResponse.json();
        const uploadUrl = session.uploadUrl;

        // Upload in chunks (10MB max per chunk for OneDrive)
        const chunkSize = 10 * 1024 * 1024;
        let uploaded = 0;

        while (uploaded < blob.size) {
            const chunk = blob.slice(uploaded, uploaded + chunkSize);
            const end = Math.min(uploaded + chunkSize, blob.size);

            const response = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Length': chunk.size,
                    'Content-Range': `bytes ${uploaded}-${end - 1}/${blob.size}`
                },
                body: chunk
            });

            if (response.status === 202) {
                // Incomplete, continue
                uploaded = end;
                if (options.onProgress) {
                    options.onProgress(uploaded / blob.size);
                }
            } else if (response.ok) {
                // Complete
                if (options.onProgress) {
                    options.onProgress(1);
                }
                const fileData = await response.json();
                return this._toFileHandle(fileData);
            } else {
                throw new Error(STORAGE_ERRORS.WRITE_FAILED);
            }
        }
    }

    /**
     * @inheritdoc
     */
    async getFileInfo(handle) {
        const accessToken = await this._ensureAuthenticated();

        const response = await fetch(
            `${MICROSOFT_API.GRAPH}/me/drive/items/${handle.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to get file info');
        }

        const data = await response.json();
        return {
            id: data.id,
            name: data.name,
            size: data.size,
            modified: new Date(data.lastModifiedDateTime),
            created: data.createdDateTime ? new Date(data.createdDateTime) : null,
            mimeType: data.file?.mimeType,
            thumbnailUrl: data.thumbnails?.[0]?.medium?.url
        };
    }

    /**
     * @inheritdoc
     */
    async delete(handle) {
        const accessToken = await this._ensureAuthenticated();

        const response = await fetch(
            `${MICROSOFT_API.GRAPH}/me/drive/items/${handle.id}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok && response.status !== 204) {
            throw new Error('Failed to delete file');
        }
    }

    /**
     * @inheritdoc
     */
    async listFiles(folderId) {
        const accessToken = await this._ensureAuthenticated();

        const path = folderId
            ? `/me/drive/items/${folderId}/children`
            : '/me/drive/root/children';

        // Try without filter first - $filter=endswith() not always supported
        let response = await fetch(
            `${MICROSOFT_API.GRAPH}${path}?$select=id,name,size,lastModifiedDateTime,createdDateTime,folder`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            // If 404, user may not have OneDrive set up - return empty list
            if (response.status === 404) {
                console.warn('OneDrive root not found - user may not have OneDrive set up');
                return [];
            }
            throw new Error('Failed to list files');
        }

        const data = await response.json();
        
        // Filter for .str files and folders (client-side)
        const items = (data.value || []).filter(f => 
            f.folder || f.name.toLowerCase().endsWith('.str')
        );
        
        return items.map(f => ({
            id: f.id,
            name: f.name,
            size: f.size || 0,
            modified: new Date(f.lastModifiedDateTime),
            created: f.createdDateTime ? new Date(f.createdDateTime) : null,
            isFolder: !!f.folder
        }));
    }

    /**
     * @inheritdoc
     */
    async isAvailable() {
        return navigator.onLine;
    }

    /**
     * Get current user info
     * @returns {Promise<Object>} User info with photo
     */
    async getUserInfo() {
        const accessToken = await this._ensureAuthenticated();

        if (this._user) {
            return this._user;
        }

        const response = await fetch(MICROSOFT_API.ME, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get user info');
        }

        this._user = await response.json();
        
        // Try to fetch profile photo
        try {
            const photoUrl = await this._getProfilePhoto(accessToken);
            if (photoUrl) {
                this._user.photoUrl = photoUrl;
            }
        } catch (error) {
            // Photo fetch failed - user may not have a photo set
            console.debug('[OneDriveProvider] Could not fetch profile photo:', error.message);
        }
        
        return this._user;
    }
    
    /**
     * Get user's profile photo as a data URL
     * @param {string} accessToken - Access token
     * @returns {Promise<string|null>} Photo data URL or null
     * @private
     */
    async _getProfilePhoto(accessToken) {
        const response = await fetch(`${MICROSOFT_API.GRAPH}/me/photo/$value`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            // 404 means user has no photo set
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to get profile photo: ${response.status}`);
        }
        
        // Convert blob to data URL
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    // Private helper methods

    /**
     * Ensure user is authenticated and get valid access token
     * @returns {Promise<string>} Access token
     * @private
     */
    async _ensureAuthenticated() {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        // Get access token from app-level auth (handles refresh automatically)
        const accessToken = await this._getAccessToken();
        if (!accessToken) {
            throw new Error('Not authenticated');
        }
        
        return accessToken;
    }

    /**
     * Make an authenticated API request
     * @param {string} url - API URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>}
     * @private
     */
    async _authenticatedFetch(url, options = {}) {
        const accessToken = await this._ensureAuthenticated();
        
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${accessToken}`
            }
        });
    }

    /**
     * Generate PKCE code verifier
     * @returns {string}
     * @private
     */
    _generateCodeVerifier() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this._base64UrlEncode(array);
    }

    /**
     * Generate PKCE code challenge from verifier
     * @param {string} verifier - Code verifier
     * @returns {Promise<string>}
     * @private
     */
    async _generateCodeChallenge(verifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return this._base64UrlEncode(new Uint8Array(hash));
    }

    /**
     * Base64 URL encode
     * @param {Uint8Array} buffer - Buffer to encode
     * @returns {string}
     * @private
     */
    _base64UrlEncode(buffer) {
        const base64 = btoa(String.fromCharCode(...buffer));
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    /**
     * List .str files in OneDrive
     * @returns {Promise<Array>}
     * @private
     */
    async _listStrFiles() {
        const response = await this._authenticatedFetch(
            `${MICROSOFT_API.GRAPH}/me/drive/root/search(q='.str')?$select=id,name,lastModifiedDateTime`
        );

        if (!response.ok) {
            throw new Error('Failed to list files');
        }

        const data = await response.json();
        return data.value.filter(f => f.name.endsWith('.str'));
    }

    /**
     * Get or create the Story folder in OneDrive
     * @returns {Promise<string>} Folder ID
     * @private
     */
    async _getOrCreateStoryFolder() {
        if (this._storyFolderId) {
            return this._storyFolderId;
        }

        // Check if folder exists
        try {
            const response = await this._authenticatedFetch(
                `${MICROSOFT_API.GRAPH}/me/drive/root:/Story`
            );

            if (response.ok) {
                const folder = await response.json();
                this._storyFolderId = folder.id;
                return this._storyFolderId;
            }
        } catch (e) {
            // Folder doesn't exist, create it
        }

        // Create the folder
        const createResponse = await this._authenticatedFetch(
            `${MICROSOFT_API.GRAPH}/me/drive/root/children`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Story',
                    folder: {},
                    '@microsoft.graph.conflictBehavior': 'fail'
                })
            }
        );

        if (!createResponse.ok) {
            // Folder might already exist due to race condition
            const checkResponse = await this._authenticatedFetch(
                `${MICROSOFT_API.GRAPH}/me/drive/root:/Story`
            );

            if (checkResponse.ok) {
                const folder = await checkResponse.json();
                this._storyFolderId = folder.id;
                return this._storyFolderId;
            }

            throw new Error('Failed to create Story folder');
        }

        const folder = await createResponse.json();
        this._storyFolderId = folder.id;
        return this._storyFolderId;
    }

    /**
     * Convert OneDrive file data to FileHandle
     * @param {Object} data - OneDrive file data
     * @returns {Object} File handle
     * @private
     */
    _toFileHandle(data) {
        return {
            id: data.id,
            name: data.name,
            provider: 'onedrive',
            metadata: {
                webUrl: data.webUrl,
                modifiedTime: data.lastModifiedDateTime
            }
        };
    }
}

export default OneDriveProvider;
