/**
 * OneDriveProvider
 * Storage provider for Microsoft OneDrive integration
 * 
 * Uses Microsoft Graph API with OAuth 2.0 PKCE flow
 */

import { IStorageProvider } from './IStorageProvider.js';
import { FILE_FORMAT, STORAGE_ERRORS } from '../constants/StorageConstants.js';

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
        
        this._accessToken = null;
        this._refreshToken = null;
        this._tokenExpiry = null;
        this._user = null;
        this._storyFolderId = null;
        
        // Load stored tokens
        this._loadStoredTokens();
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
     */
    isAuthenticated() {
        return this._accessToken !== null && !this._isTokenExpired();
    }

    /**
     * Check if token is expired
     * @returns {boolean}
     * @private
     */
    _isTokenExpired() {
        if (!this._tokenExpiry) return true;
        return Date.now() >= this._tokenExpiry - 60000; // 1 minute buffer
    }

    /**
     * @inheritdoc
     */
    async authenticate() {
        // Generate PKCE code verifier and challenge
        const codeVerifier = this._generateCodeVerifier();
        const codeChallenge = await this._generateCodeChallenge(codeVerifier);
        
        // Store verifier for callback
        sessionStorage.setItem('microsoft_code_verifier', codeVerifier);
        
        // Build authorization URL
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: SCOPES,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            response_mode: 'query'
        });

        // Redirect to Microsoft auth
        window.location.href = `${MICROSOFT_API.AUTH}?${params}`;
    }

    /**
     * Handle OAuth callback
     * @param {string} code - Authorization code from callback
     * @returns {Promise<void>}
     */
    async handleCallback(code) {
        const codeVerifier = sessionStorage.getItem('microsoft_code_verifier');
        sessionStorage.removeItem('microsoft_code_verifier');

        if (!codeVerifier) {
            throw new Error('No code verifier found');
        }

        // Exchange code for tokens
        const response = await fetch(MICROSOFT_API.TOKEN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: this.clientId,
                code: code,
                code_verifier: codeVerifier,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
                scope: SCOPES
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error_description || 'Token exchange failed');
        }

        const tokens = await response.json();
        await this._setTokens(tokens);
    }

    /**
     * Refresh the access token
     * @returns {Promise<void>}
     */
    async refreshAccessToken() {
        if (!this._refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(MICROSOFT_API.TOKEN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: this.clientId,
                refresh_token: this._refreshToken,
                grant_type: 'refresh_token',
                scope: SCOPES
            })
        });

        if (!response.ok) {
            this._clearTokens();
            throw new Error('Session expired, please sign in again');
        }

        const tokens = await response.json();
        await this._setTokens(tokens);
    }

    /**
     * @inheritdoc
     */
    async signOut() {
        this._clearTokens();
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
        await this._ensureAuthenticated();

        const response = await fetch(
            `${MICROSOFT_API.GRAPH}/me/drive/items/${handle.id}/content`,
            {
                headers: {
                    'Authorization': `Bearer ${this._accessToken}`
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
        await this._ensureAuthenticated();

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
                'Authorization': `Bearer ${this._accessToken}`,
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
        // Create upload session
        const sessionUrl = handle.id
            ? `${MICROSOFT_API.GRAPH}/me/drive/items/${handle.id}/createUploadSession`
            : `${MICROSOFT_API.GRAPH}/me/drive/items/${handle.folderId || 'root'}:/${handle.name || 'presentation.str'}:/createUploadSession`;

        const sessionResponse = await fetch(sessionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this._accessToken}`,
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
        await this._ensureAuthenticated();

        const response = await fetch(
            `${MICROSOFT_API.GRAPH}/me/drive/items/${handle.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${this._accessToken}`
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
        await this._ensureAuthenticated();

        const response = await fetch(
            `${MICROSOFT_API.GRAPH}/me/drive/items/${handle.id}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this._accessToken}`
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
        await this._ensureAuthenticated();

        const path = folderId
            ? `/me/drive/items/${folderId}/children`
            : '/me/drive/root/children';

        const response = await fetch(
            `${MICROSOFT_API.GRAPH}${path}?$filter=endswith(name,'.str')&$select=id,name,size,lastModifiedDateTime,createdDateTime`,
            {
                headers: {
                    'Authorization': `Bearer ${this._accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to list files');
        }

        const data = await response.json();
        return data.value.map(f => ({
            id: f.id,
            name: f.name,
            size: f.size,
            modified: new Date(f.lastModifiedDateTime),
            created: f.createdDateTime ? new Date(f.createdDateTime) : null
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
     * @returns {Promise<Object>} User info
     */
    async getUserInfo() {
        await this._ensureAuthenticated();

        if (this._user) {
            return this._user;
        }

        const response = await fetch(MICROSOFT_API.ME, {
            headers: {
                'Authorization': `Bearer ${this._accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get user info');
        }

        this._user = await response.json();
        return this._user;
    }

    // Private helper methods

    /**
     * Ensure user is authenticated
     * @private
     */
    async _ensureAuthenticated() {
        if (!this._accessToken) {
            throw new Error('Not authenticated');
        }

        if (this._isTokenExpired()) {
            await this.refreshAccessToken();
        }
    }

    /**
     * Set tokens from OAuth response
     * @param {Object} tokens - Token response
     * @private
     */
    async _setTokens(tokens) {
        this._accessToken = tokens.access_token;
        this._tokenExpiry = Date.now() + (tokens.expires_in * 1000);
        
        if (tokens.refresh_token) {
            this._refreshToken = tokens.refresh_token;
        }

        // Store tokens securely
        this._storeTokens();

        // Get user info
        await this.getUserInfo();
    }

    /**
     * Store tokens in session storage
     * @private
     */
    _storeTokens() {
        const data = {
            accessToken: this._accessToken,
            refreshToken: this._refreshToken,
            tokenExpiry: this._tokenExpiry
        };
        
        // TODO: Move to encrypted IndexedDB storage
        sessionStorage.setItem('microsoft_tokens', JSON.stringify(data));
    }

    /**
     * Load stored tokens
     * @private
     */
    _loadStoredTokens() {
        try {
            const stored = sessionStorage.getItem('microsoft_tokens');
            if (stored) {
                const data = JSON.parse(stored);
                this._accessToken = data.accessToken;
                this._refreshToken = data.refreshToken;
                this._tokenExpiry = data.tokenExpiry;
            }
        } catch (e) {
            console.warn('Failed to load stored tokens:', e);
        }
    }

    /**
     * Clear stored tokens
     * @private
     */
    _clearTokens() {
        this._accessToken = null;
        this._refreshToken = null;
        this._tokenExpiry = null;
        this._user = null;
        sessionStorage.removeItem('microsoft_tokens');
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
        const response = await fetch(
            `${MICROSOFT_API.GRAPH}/me/drive/root/search(q='.str')?$select=id,name,lastModifiedDateTime`,
            {
                headers: {
                    'Authorization': `Bearer ${this._accessToken}`
                }
            }
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
            const response = await fetch(
                `${MICROSOFT_API.GRAPH}/me/drive/root:/Story`,
                {
                    headers: {
                        'Authorization': `Bearer ${this._accessToken}`
                    }
                }
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
        const createResponse = await fetch(
            `${MICROSOFT_API.GRAPH}/me/drive/root/children`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this._accessToken}`,
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
            const checkResponse = await fetch(
                `${MICROSOFT_API.GRAPH}/me/drive/root:/Story`,
                {
                    headers: {
                        'Authorization': `Bearer ${this._accessToken}`
                    }
                }
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
