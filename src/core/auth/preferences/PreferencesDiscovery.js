/**
 * Preferences Discovery
 * 
 * Discovers and locates user preferences files in cloud storage.
 * Handles first-time setup and preferences file creation.
 * 
 * @module core/auth/preferences/PreferencesDiscovery
 */

/**
 * Default preferences filename
 */
export const PREFERENCES_FILENAME = 'story-preferences.str';

/**
 * Storage locations to search for preferences
 */
export const StorageLocations = {
    ONEDRIVE: 'onedrive',
    GOOGLE_DRIVE: 'google-drive',
    LOCAL: 'local'
};

/**
 * OneDrive preferences folder path
 */
const ONEDRIVE_PREFERENCES_PATH = '/Apps/Story/';

/**
 * Google Drive preferences folder
 */
const GOOGLE_DRIVE_FOLDER_NAME = 'Story';

/**
 * Preferences Discovery
 */
export class PreferencesDiscovery {
    /**
     * @param {Object} options - Discovery options
     * @param {Object} [options.oneDriveClient] - OneDrive API client
     * @param {Object} [options.googleDriveClient] - Google Drive API client
     */
    constructor(options = {}) {
        this.oneDriveClient = options.oneDriveClient;
        this.googleDriveClient = options.googleDriveClient;
        this.cachedLocation = null;
    }

    /**
     * Discover preferences file location
     * 
     * @param {Object} idTokenClaims - OAuth claims
     * @returns {Promise<Object|null>} Location info or null if not found
     */
    async discover(idTokenClaims) {
        // Check cached location first
        if (this.cachedLocation) {
            const exists = await this.checkLocation(this.cachedLocation);
            if (exists) {
                return this.cachedLocation;
            }
            this.cachedLocation = null;
        }

        // Determine provider from claims
        const provider = this.getProviderFromClaims(idTokenClaims);
        
        // Search based on provider
        let location = null;
        
        if (provider === 'microsoft') {
            location = await this.findInOneDrive();
        } else if (provider === 'google') {
            location = await this.findInGoogleDrive();
        }
        
        // Cache the location
        if (location) {
            this.cachedLocation = location;
        }
        
        return location;
    }

    /**
     * Get provider from OAuth claims
     * 
     * @param {Object} idTokenClaims - OAuth claims
     * @returns {string} Provider name
     */
    getProviderFromClaims(idTokenClaims) {
        if (idTokenClaims.iss?.includes('microsoft') || 
            idTokenClaims.iss?.includes('sts.windows.net')) {
            return 'microsoft';
        }
        if (idTokenClaims.iss?.includes('accounts.google.com')) {
            return 'google';
        }
        return 'unknown';
    }

    /**
     * Find preferences in OneDrive
     * 
     * @returns {Promise<Object|null>} Location info or null
     */
    async findInOneDrive() {
        if (!this.oneDriveClient) {
            return null;
        }

        try {
            const path = `${ONEDRIVE_PREFERENCES_PATH}${PREFERENCES_FILENAME}`;
            
            // Try to get file metadata
            const response = await this.oneDriveClient.api(`/me/drive/root:${path}`)
                .get();
            
            if (response && response.id) {
                return {
                    storage: StorageLocations.ONEDRIVE,
                    path: path,
                    fileId: response.id,
                    modified: response.lastModifiedDateTime,
                    size: response.size
                };
            }
        } catch (error) {
            if (error.statusCode === 404) {
                // File not found
                return null;
            }
            throw error;
        }
        
        return null;
    }

    /**
     * Find preferences in Google Drive
     * 
     * @returns {Promise<Object|null>} Location info or null
     */
    async findInGoogleDrive() {
        if (!this.googleDriveClient) {
            return null;
        }

        try {
            // First find the Story folder
            const folderResponse = await this.googleDriveClient.files.list({
                q: `name='${GOOGLE_DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)'
            });
            
            if (!folderResponse.data.files?.length) {
                return null;
            }
            
            const folderId = folderResponse.data.files[0].id;
            
            // Find preferences file in folder
            const fileResponse = await this.googleDriveClient.files.list({
                q: `name='${PREFERENCES_FILENAME}' and '${folderId}' in parents and trashed=false`,
                fields: 'files(id, name, modifiedTime, size)'
            });
            
            if (fileResponse.data.files?.length) {
                const file = fileResponse.data.files[0];
                return {
                    storage: StorageLocations.GOOGLE_DRIVE,
                    folderId: folderId,
                    fileId: file.id,
                    modified: file.modifiedTime,
                    size: parseInt(file.size, 10)
                };
            }
        } catch (error) {
            console.error('Google Drive search error:', error);
            // Continue without preferences
        }
        
        return null;
    }

    /**
     * Check if a location still has the preferences file
     * 
     * @param {Object} location - Location info
     * @returns {Promise<boolean>} True if file exists
     */
    async checkLocation(location) {
        try {
            if (location.storage === StorageLocations.ONEDRIVE) {
                const response = await this.oneDriveClient.api(`/me/drive/items/${location.fileId}`)
                    .select('id')
                    .get();
                return !!response?.id;
            } else if (location.storage === StorageLocations.GOOGLE_DRIVE) {
                const response = await this.googleDriveClient.files.get({
                    fileId: location.fileId,
                    fields: 'id'
                });
                return !!response.data?.id;
            }
        } catch (error) {
            return false;
        }
        return false;
    }

    /**
     * Load preferences file from location
     * 
     * @param {Object} location - Location info
     * @returns {Promise<ArrayBuffer>} File bytes
     */
    async loadFromLocation(location) {
        if (location.storage === StorageLocations.ONEDRIVE) {
            return this.loadFromOneDrive(location);
        } else if (location.storage === StorageLocations.GOOGLE_DRIVE) {
            return this.loadFromGoogleDrive(location);
        }
        throw new Error(`Unknown storage location: ${location.storage}`);
    }

    /**
     * Load preferences from OneDrive
     * 
     * @param {Object} location - Location info
     * @returns {Promise<ArrayBuffer>} File bytes
     */
    async loadFromOneDrive(location) {
        const response = await this.oneDriveClient.api(`/me/drive/items/${location.fileId}/content`)
            .responseType('arraybuffer')
            .get();
        return response;
    }

    /**
     * Load preferences from Google Drive
     * 
     * @param {Object} location - Location info
     * @returns {Promise<ArrayBuffer>} File bytes
     */
    async loadFromGoogleDrive(location) {
        const response = await this.googleDriveClient.files.get({
            fileId: location.fileId,
            alt: 'media'
        }, {
            responseType: 'arraybuffer'
        });
        return response.data;
    }

    /**
     * Create preferences file in cloud storage
     * 
     * @param {Object} idTokenClaims - OAuth claims
     * @param {ArrayBuffer} fileBytes - Preferences file bytes
     * @returns {Promise<Object>} Created location info
     */
    async createPreferencesFile(idTokenClaims, fileBytes) {
        const provider = this.getProviderFromClaims(idTokenClaims);
        
        if (provider === 'microsoft') {
            return this.createInOneDrive(fileBytes);
        } else if (provider === 'google') {
            return this.createInGoogleDrive(fileBytes);
        }
        
        throw new Error(`Unsupported provider: ${provider}`);
    }

    /**
     * Create preferences in OneDrive
     * 
     * @param {ArrayBuffer} fileBytes - File bytes
     * @returns {Promise<Object>} Location info
     */
    async createInOneDrive(fileBytes) {
        // Ensure folder exists
        const folderPath = ONEDRIVE_PREFERENCES_PATH.replace(/\/$/, '');
        
        try {
            await this.oneDriveClient.api(`/me/drive/root:${folderPath}`)
                .get();
        } catch (error) {
            if (error.statusCode === 404) {
                // Create folder
                await this.oneDriveClient.api('/me/drive/root/children')
                    .post({
                        name: 'Story',
                        folder: {},
                        '@microsoft.graph.conflictBehavior': 'fail'
                    });
            } else {
                throw error;
            }
        }
        
        // Upload file
        const filePath = `${ONEDRIVE_PREFERENCES_PATH}${PREFERENCES_FILENAME}`;
        const response = await this.oneDriveClient.api(`/me/drive/root:${filePath}:/content`)
            .put(fileBytes);
        
        const location = {
            storage: StorageLocations.ONEDRIVE,
            path: filePath,
            fileId: response.id,
            modified: response.lastModifiedDateTime,
            size: response.size
        };
        
        this.cachedLocation = location;
        return location;
    }

    /**
     * Create preferences in Google Drive
     * 
     * @param {ArrayBuffer} fileBytes - File bytes
     * @returns {Promise<Object>} Location info
     */
    async createInGoogleDrive(fileBytes) {
        // Find or create Story folder
        let folderId;
        
        const folderResponse = await this.googleDriveClient.files.list({
            q: `name='${GOOGLE_DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id)'
        });
        
        if (folderResponse.data.files?.length) {
            folderId = folderResponse.data.files[0].id;
        } else {
            // Create folder
            const createResponse = await this.googleDriveClient.files.create({
                requestBody: {
                    name: GOOGLE_DRIVE_FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder'
                },
                fields: 'id'
            });
            folderId = createResponse.data.id;
        }
        
        // Create preferences file
        const fileMetadata = {
            name: PREFERENCES_FILENAME,
            parents: [folderId]
        };
        
        const blob = new Blob([fileBytes], { type: 'application/octet-stream' });
        
        const response = await this.googleDriveClient.files.create({
            requestBody: fileMetadata,
            media: {
                mimeType: 'application/octet-stream',
                body: blob
            },
            fields: 'id, modifiedTime, size'
        });
        
        const location = {
            storage: StorageLocations.GOOGLE_DRIVE,
            folderId: folderId,
            fileId: response.data.id,
            modified: response.data.modifiedTime,
            size: parseInt(response.data.size, 10)
        };
        
        this.cachedLocation = location;
        return location;
    }

    /**
     * Save preferences file to location
     * 
     * @param {Object} location - Location info
     * @param {ArrayBuffer} fileBytes - File bytes
     * @returns {Promise<void>}
     */
    async saveToLocation(location, fileBytes) {
        if (location.storage === StorageLocations.ONEDRIVE) {
            await this.oneDriveClient.api(`/me/drive/items/${location.fileId}/content`)
                .put(fileBytes);
        } else if (location.storage === StorageLocations.GOOGLE_DRIVE) {
            await this.googleDriveClient.files.update({
                fileId: location.fileId,
                media: {
                    mimeType: 'application/octet-stream',
                    body: new Blob([fileBytes])
                }
            });
        } else {
            throw new Error(`Unknown storage location: ${location.storage}`);
        }
    }

    /**
     * Get current cached location
     * 
     * @returns {Object|null} Cached location or null
     */
    getCachedLocation() {
        return this.cachedLocation;
    }

    /**
     * Clear cached location
     */
    clearCache() {
        this.cachedLocation = null;
    }
}
