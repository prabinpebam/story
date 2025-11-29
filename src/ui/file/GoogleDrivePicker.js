/**
 * GoogleDrivePicker - Native Google Drive file picker integration
 * 
 * Uses Google's Picker API to provide native Google Drive browsing experience.
 * The picker is displayed as a modal overlay with full Google Drive UI.
 * 
 * @see https://developers.google.com/drive/picker/guides/overview
 */

import { authService } from '../../core/auth/index.js';
import { OAuthConfig } from '../../core/auth/config/OAuthConfig.js';

// Storage key for remembering last folder
const LAST_FOLDER_KEY = 'story_gdrive_last_folder';

// Google Picker API loaded flag
let pickerApiLoaded = false;
let pickerApiLoading = false;
let pickerApiLoadPromise = null;

/**
 * Google Drive Picker using Google's Picker API
 */
export class GoogleDrivePicker {
    constructor() {
        this.resolvePromise = null;
        this.rejectPromise = null;
    }

    /**
     * Load Google Picker API
     */
    static async loadPickerApi() {
        if (pickerApiLoaded) {
            return Promise.resolve();
        }

        if (pickerApiLoading) {
            return pickerApiLoadPromise;
        }

        pickerApiLoading = true;

        pickerApiLoadPromise = new Promise((resolve, reject) => {
            // Check if gapi is already loaded
            if (window.gapi) {
                window.gapi.load('picker', {
                    callback: () => {
                        pickerApiLoaded = true;
                        pickerApiLoading = false;
                        resolve();
                    },
                    onerror: () => {
                        pickerApiLoading = false;
                        reject(new Error('Failed to load Google Picker API'));
                    }
                });
            } else {
                // Load the Google API script
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.async = true;
                script.defer = true;
                
                script.onload = () => {
                    window.gapi.load('picker', {
                        callback: () => {
                            pickerApiLoaded = true;
                            pickerApiLoading = false;
                            resolve();
                        },
                        onerror: () => {
                            pickerApiLoading = false;
                            reject(new Error('Failed to load Google Picker API'));
                        }
                    });
                };

                script.onerror = () => {
                    pickerApiLoading = false;
                    reject(new Error('Failed to load Google API script'));
                };

                document.head.appendChild(script);
            }
        });

        return pickerApiLoadPromise;
    }

    /**
     * Get last used folder ID from storage
     */
    getLastFolderId() {
        try {
            return localStorage.getItem(LAST_FOLDER_KEY) || null;
        } catch {
            return null;
        }
    }

    /**
     * Save last used folder ID to storage
     */
    saveLastFolderId(folderId) {
        try {
            if (folderId) {
                localStorage.setItem(LAST_FOLDER_KEY, folderId);
            }
        } catch {
            // Ignore storage errors
        }
    }

    /**
     * Show the native Google Drive picker for opening files
     * @returns {Promise<{file: Object, provider: string}|null>}
     */
    async showOpenPicker() {
        return this.showPicker('open');
    }

    /**
     * Show the native Google Drive picker for saving (folder selection)
     * @param {string} suggestedName - Suggested filename
     * @returns {Promise<{folderId: string, filename: string, provider: string}|null>}
     */
    async showSavePicker(suggestedName = 'Untitled.str') {
        return this.showPicker('save', suggestedName);
    }

    /**
     * Show the Google Drive picker
     * @param {'open' | 'save'} mode
     * @param {string} suggestedName
     */
    async showPicker(mode, suggestedName = '') {
        // Check authentication
        if (!authService.isAuthenticated()) {
            throw new Error('Not authenticated with Google');
        }

        const accessToken = await authService.getAccessToken();
        if (!accessToken) {
            throw new Error('No access token available');
        }

        // Load Picker API if needed
        await GoogleDrivePicker.loadPickerApi();

        return new Promise((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;

            try {
                this.createPicker(mode, accessToken, suggestedName);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Create and display the picker
     */
    createPicker(mode, accessToken, suggestedName) {
        const google = window.google;
        
        if (!google || !google.picker) {
            throw new Error('Google Picker API not loaded');
        }

        // Get API key from OAuth config
        const apiKey = OAuthConfig.google.apiKey;
        const appId = OAuthConfig.google.clientId?.split('-')[0]; // Extract project number

        let picker;
        const lastFolderId = this.getLastFolderId();

        if (mode === 'open') {
            // Create view for .str files
            const docsView = new google.picker.DocsView()
                .setIncludeFolders(true)
                .setSelectFolderEnabled(false)
                .setMode(google.picker.DocsViewMode.LIST);

            // If we have a last folder, try to start there
            if (lastFolderId) {
                docsView.setParent(lastFolderId);
            }

            // Build picker for opening files
            const builder = new google.picker.PickerBuilder()
                .addView(docsView)
                .setOAuthToken(accessToken)
                .setCallback((data) => this.handlePickerCallback(data, mode, suggestedName))
                .setTitle('Open from Google Drive')
                .enableFeature(google.picker.Feature.NAV_HIDDEN)
                .setMaxItems(1);

            // Add API key if available
            if (apiKey) {
                builder.setDeveloperKey(apiKey);
            }

            // Add app ID if available
            if (appId) {
                builder.setAppId(appId);
            }

            picker = builder.build();
        } else {
            // Save mode - select folder
            const foldersView = new google.picker.DocsView()
                .setIncludeFolders(true)
                .setSelectFolderEnabled(true)
                .setMimeTypes('application/vnd.google-apps.folder')
                .setMode(google.picker.DocsViewMode.LIST);

            // If we have a last folder, try to start there
            if (lastFolderId) {
                foldersView.setParent(lastFolderId);
            }

            // Build picker for selecting save location
            const builder = new google.picker.PickerBuilder()
                .addView(foldersView)
                .setOAuthToken(accessToken)
                .setCallback((data) => this.handlePickerCallback(data, mode, suggestedName))
                .setTitle('Choose Save Location')
                .enableFeature(google.picker.Feature.NAV_HIDDEN)
                .setMaxItems(1);

            // Add API key if available
            if (apiKey) {
                builder.setDeveloperKey(apiKey);
            }

            // Add app ID if available
            if (appId) {
                builder.setAppId(appId);
            }

            picker = builder.build();
        }

        picker.setVisible(true);
    }

    /**
     * Handle picker callback
     */
    handlePickerCallback(data, mode, suggestedName) {
        const google = window.google;
        const action = data[google.picker.Response.ACTION];

        if (action === google.picker.Action.PICKED) {
            const docs = data[google.picker.Response.DOCUMENTS];
            
            if (docs && docs.length > 0) {
                const doc = docs[0];

                // Save parent folder for next time
                if (doc[google.picker.Document.PARENT_ID]) {
                    this.saveLastFolderId(doc[google.picker.Document.PARENT_ID]);
                } else if (mode === 'save') {
                    // For save mode, the selected folder IS where we want to save
                    this.saveLastFolderId(doc[google.picker.Document.ID]);
                }

                if (mode === 'open') {
                    this.resolvePromise({
                        file: {
                            id: doc[google.picker.Document.ID],
                            name: doc[google.picker.Document.NAME],
                            parentId: doc[google.picker.Document.PARENT_ID],
                            url: doc[google.picker.Document.URL],
                            mimeType: doc[google.picker.Document.MIME_TYPE]
                        },
                        provider: 'google-drive'
                    });
                } else {
                    // Save mode - return folder info
                    this.resolvePromise({
                        folderId: doc[google.picker.Document.ID],
                        folderName: doc[google.picker.Document.NAME],
                        filename: suggestedName,
                        provider: 'google-drive'
                    });
                }
            } else {
                this.resolvePromise(null);
            }
        } else if (action === google.picker.Action.CANCEL) {
            this.resolvePromise(null);
        }
    }

    /**
     * Static method to show open picker
     */
    static async showOpen() {
        const picker = new GoogleDrivePicker();
        return picker.showOpenPicker();
    }

    /**
     * Static method to show save picker
     */
    static async showSave(suggestedName) {
        const picker = new GoogleDrivePicker();
        return picker.showSavePicker(suggestedName);
    }
}

export default GoogleDrivePicker;
