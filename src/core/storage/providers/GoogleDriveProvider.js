/**
 * GoogleDriveProvider
 * Storage provider for Google Drive integration
 * 
 * Uses Google Drive API v3 with OAuth 2.0 PKCE flow
 * Integrates with app-level authService for shared authentication
 */

import { IStorageProvider } from './IStorageProvider.js';
import { FILE_FORMAT, STORAGE_ERRORS } from '../constants/StorageConstants.js';
import { authService } from '../../auth/AuthService.js';
import { tokenStorage } from '../../auth/storage/TokenStorage.js';

// Google API endpoints
const GOOGLE_API = {
    AUTH: 'https://accounts.google.com/o/oauth2/v2/auth',
    TOKEN: 'https://oauth2.googleapis.com/token',
    DRIVE_FILES: 'https://www.googleapis.com/drive/v3/files',
    DRIVE_UPLOAD: 'https://www.googleapis.com/upload/drive/v3/files',
    USERINFO: 'https://www.googleapis.com/oauth2/v3/userinfo'
};

// OAuth scopes
const SCOPES = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/drive.file'
].join(' ');

export class GoogleDriveProvider extends IStorageProvider {
    /**
     * Create a Google Drive provider
     * @param {Object} options - Configuration options
     * @param {string} options.clientId - Google OAuth client ID
     * @param {string} options.redirectUri - OAuth redirect URI
     */
    constructor(options = {}) {
        super();
        
        this.clientId = options.clientId;
        this.redirectUri = options.redirectUri || `${window.location.origin}/auth/google/callback`;
        
        this._user = null;
        this._storyFolderId = null;
    }

    /**
     * @inheritdoc
     */
    getProviderInfo() {
        return {
            id: 'google-drive',
            name: 'Google Drive',
            icon: 'google-drive',
            supportsAuth: true,
            supportsConflictResolution: true
        };
    }

    /**
     * @inheritdoc
     * Uses app-level auth state for Google provider
     */
    isAuthenticated() {
        // Check if user is authenticated at app level with Google
        const provider = tokenStorage.getProvider();
        if (provider !== 'google') {
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
        await authService.login('google');
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
        
        // List .str files in Drive
        const files = await this._listStrFiles();
        
        if (files.length === 0) {
            return null;
        }

        // Return the file list for UI to display
        // The actual picker UI would be implemented separately
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
            provider: 'google-drive'
        };
    }

    /**
     * @inheritdoc
     */
    async read(handle, options = {}) {
        const accessToken = await this._ensureAuthenticated();

        const response = await fetch(
            `${GOOGLE_API.DRIVE_FILES}/${handle.id}?alt=media`,
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
        
        // Use resumable upload for large files
        if (blob.size > 5 * 1024 * 1024) {
            return await this._resumableUpload(handle, blob, options);
        }

        // Simple upload for small files
        const url = handle.id
            ? `${GOOGLE_API.DRIVE_UPLOAD}/${handle.id}?uploadType=media`
            : `${GOOGLE_API.DRIVE_UPLOAD}?uploadType=multipart`;

        if (handle.id) {
            // Update existing file
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': FILE_FORMAT.MIME_TYPE
                },
                body: blob
            });

            if (!response.ok) {
                throw new Error(STORAGE_ERRORS.WRITE_FAILED);
            }

            const fileData = await response.json();
            return this._toFileHandle(fileData);
        } else {
            // Create new file
            const metadata = {
                name: handle.name || 'presentation.str',
                mimeType: FILE_FORMAT.MIME_TYPE,
                parents: [handle.folderId || await this._getOrCreateStoryFolder()]
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);

            const response = await fetch(`${GOOGLE_API.DRIVE_UPLOAD}?uploadType=multipart`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: form
            });

            if (!response.ok) {
                throw new Error(STORAGE_ERRORS.WRITE_FAILED);
            }

            const fileData = await response.json();
            return this._toFileHandle(fileData);
        }
    }

    /**
     * Resumable upload for large files
     * @param {Object} handle - File handle
     * @param {Blob} blob - File data
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Updated file handle
     * @private
     */
    async _resumableUpload(handle, blob, options) {
        const accessToken = await this._ensureAuthenticated();
        
        const metadata = {
            name: handle.name || 'presentation.str',
            mimeType: FILE_FORMAT.MIME_TYPE
        };

        if (!handle.id) {
            metadata.parents = [handle.folderId || await this._getOrCreateStoryFolder()];
        }

        // Initiate resumable upload
        const initUrl = handle.id
            ? `${GOOGLE_API.DRIVE_UPLOAD}/${handle.id}?uploadType=resumable`
            : `${GOOGLE_API.DRIVE_UPLOAD}?uploadType=resumable`;

        const initResponse = await fetch(initUrl, {
            method: handle.id ? 'PATCH' : 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Upload-Content-Type': FILE_FORMAT.MIME_TYPE,
                'X-Upload-Content-Length': blob.size
            },
            body: JSON.stringify(metadata)
        });

        if (!initResponse.ok) {
            throw new Error(STORAGE_ERRORS.WRITE_FAILED);
        }

        const uploadUrl = initResponse.headers.get('location');

        // Upload in chunks
        const chunkSize = 256 * 1024 * 4; // 1MB chunks
        let uploaded = 0;

        while (uploaded < blob.size) {
            const chunk = blob.slice(uploaded, uploaded + chunkSize);
            const end = Math.min(uploaded + chunkSize, blob.size);

            const response = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Range': `bytes ${uploaded}-${end - 1}/${blob.size}`
                },
                body: chunk
            });

            if (response.status === 308) {
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
            `${GOOGLE_API.DRIVE_FILES}/${handle.id}?fields=id,name,size,modifiedTime,createdTime,mimeType,thumbnailLink`,
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
            size: parseInt(data.size, 10),
            modified: new Date(data.modifiedTime),
            created: new Date(data.createdTime),
            mimeType: data.mimeType,
            thumbnailUrl: data.thumbnailLink
        };
    }

    /**
     * @inheritdoc
     */
    async delete(handle) {
        const accessToken = await this._ensureAuthenticated();

        const response = await fetch(
            `${GOOGLE_API.DRIVE_FILES}/${handle.id}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to delete file');
        }
    }

    /**
     * @inheritdoc
     */
    async listFiles(folderId) {
        const accessToken = await this._ensureAuthenticated();

        const query = folderId
            ? `'${folderId}' in parents and trashed = false`
            : `mimeType = '${FILE_FORMAT.MIME_TYPE}' and trashed = false`;

        const response = await fetch(
            `${GOOGLE_API.DRIVE_FILES}?q=${encodeURIComponent(query)}&fields=files(id,name,size,modifiedTime,createdTime,thumbnailLink)`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to list files');
        }

        const data = await response.json();
        return data.files.map(f => ({
            id: f.id,
            name: f.name,
            size: parseInt(f.size, 10),
            modified: new Date(f.modifiedTime),
            created: f.createdTime ? new Date(f.createdTime) : null,
            thumbnailUrl: f.thumbnailLink
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
        const accessToken = await this._ensureAuthenticated();

        if (this._user) {
            return this._user;
        }

        const response = await fetch(GOOGLE_API.USERINFO, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
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
     * List .str files in Drive
     * @returns {Promise<Array>}
     * @private
     */
    async _listStrFiles() {
        const response = await this._authenticatedFetch(
            `${GOOGLE_API.DRIVE_FILES}?q=mimeType='${FILE_FORMAT.MIME_TYPE}' and trashed=false&fields=files(id,name,modifiedTime,thumbnailLink)`
        );

        if (!response.ok) {
            throw new Error('Failed to list files');
        }

        const data = await response.json();
        return data.files;
    }

    /**
     * Get or create the Story folder in Drive
     * @returns {Promise<string>} Folder ID
     * @private
     */
    async _getOrCreateStoryFolder() {
        if (this._storyFolderId) {
            return this._storyFolderId;
        }

        // Check if folder exists
        const response = await this._authenticatedFetch(
            `${GOOGLE_API.DRIVE_FILES}?q=name='Story' and mimeType='application/vnd.google-apps.folder' and trashed=false`
        );

        if (!response.ok) {
            throw new Error('Failed to check for Story folder');
        }

        const data = await response.json();
        if (data.files && data.files.length > 0) {
            this._storyFolderId = data.files[0].id;
            return this._storyFolderId;
        }

        // Create the folder
        const createResponse = await this._authenticatedFetch(GOOGLE_API.DRIVE_FILES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Story',
                mimeType: 'application/vnd.google-apps.folder'
            })
        });

        if (!createResponse.ok) {
            throw new Error('Failed to create Story folder');
        }

        const folder = await createResponse.json();
        this._storyFolderId = folder.id;
        return this._storyFolderId;
    }

    /**
     * Convert Drive file data to FileHandle
     * @param {Object} data - Drive file data
     * @returns {Object} File handle
     * @private
     */
    _toFileHandle(data) {
        return {
            id: data.id,
            name: data.name,
            provider: 'google-drive',
            metadata: {
                mimeType: data.mimeType,
                modifiedTime: data.modifiedTime
            }
        };
    }
}

export default GoogleDriveProvider;
