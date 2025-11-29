/**
 * OneDrivePicker - Native OneDrive file picker integration
 * 
 * Uses Microsoft's File Picker v8 to provide native OneDrive browsing experience.
 * The picker is displayed in a popup window with full OneDrive UI.
 * 
 * @see https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers/
 */

import { authService } from '../../core/auth/index.js';
import { CLOUD_PATHS } from '../../core/storage/constants/StorageConstants.js';

// Storage key for remembering last folder
const LAST_FOLDER_KEY = 'story_onedrive_last_folder';

/**
 * OneDrive Picker using Microsoft's native File Picker v8
 */
export class OneDrivePicker {
    constructor() {
        this.pickerWindow = null;
        this.port = null;
        this.channelId = this.generateUUID();
        this.resolvePromise = null;
        this.rejectPromise = null;
    }

    /**
     * Generate UUID for channel communication
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Get the base URL for OneDrive personal
     */
    getBaseUrl() {
        return 'https://onedrive.live.com/picker';
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
     * Show the native OneDrive picker for opening files
     * @returns {Promise<{file: Object, provider: string}|null>}
     */
    async showOpenPicker() {
        return this.showPicker('open');
    }

    /**
     * Show the native OneDrive picker for saving files
     * @param {string} suggestedName - Suggested filename
     * @returns {Promise<{folderId: string, filename: string, provider: string}|null>}
     */
    async showSavePicker(suggestedName = 'Untitled.str') {
        return this.showPicker('save', suggestedName);
    }

    /**
     * Show the OneDrive picker
     * @param {'open' | 'save'} mode
     * @param {string} suggestedName
     */
    async showPicker(mode, suggestedName = '') {
        // Check authentication
        if (!authService.isAuthenticated()) {
            throw new Error('Not authenticated with Microsoft');
        }

        const accessToken = await authService.getAccessToken();
        if (!accessToken) {
            throw new Error('No access token available');
        }

        return new Promise((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;

            try {
                // Open picker in popup
                this.pickerWindow = window.open(
                    '',
                    'OneDrivePicker',
                    'width=1080,height=680,menubar=no,toolbar=no,location=no,status=no'
                );

                if (!this.pickerWindow) {
                    reject(new Error('Failed to open picker window. Please allow popups.'));
                    return;
                }

                // Build picker configuration
                const config = this.buildPickerConfig(mode, suggestedName);

                // Setup message listener
                this.setupMessageListener(mode);

                // Initiate the picker
                this.initiatePicker(accessToken, config);
            } catch (error) {
                this.cleanup();
                reject(error);
            }
        });
    }

    /**
     * Build picker configuration
     */
    buildPickerConfig(mode, suggestedName) {
        const lastFolderId = this.getLastFolderId();
        
        const config = {
            sdk: '8.0',
            entry: {
                oneDrive: {
                    // Start in Story folder or last used folder
                    files: lastFolderId ? { folder: { id: lastFolderId } } : {}
                }
            },
            authentication: {},
            messaging: {
                origin: window.location.origin,
                channelId: this.channelId
            },
            selection: {
                mode: mode === 'save' ? 'single' : 'single'
            },
            typesAndSources: {
                // For open mode, show only .str files
                // For save mode, show folders to select save location
                filters: mode === 'open' 
                    ? [{ extension: 'str' }]
                    : [],
                pivots: {
                    recent: false,
                    oneDrive: true,
                    sharedLibraries: false
                }
            }
        };

        // For save mode, enable folder selection
        if (mode === 'save') {
            config.commands = {
                pick: {
                    action: 'select',
                    types: ['folder']
                }
            };
        }

        return config;
    }

    /**
     * Setup message listener for picker communication
     */
    setupMessageListener(mode) {
        this.messageHandler = (event) => {
            if (event.source !== this.pickerWindow) return;

            const message = event.data;

            if (message.type === 'initialize' && message.channelId === this.channelId) {
                // Establish port communication
                this.port = event.ports[0];
                this.port.addEventListener('message', (e) => this.handlePortMessage(e, mode));
                this.port.start();

                // Activate the picker
                this.port.postMessage({ type: 'activate' });
            }
        };

        window.addEventListener('message', this.messageHandler);
    }

    /**
     * Handle messages from the picker port
     */
    async handlePortMessage(event, mode) {
        const payload = event.data;

        switch (payload.type) {
            case 'notification':
                // Handle notifications (logging, page-loaded, etc.)
                if (payload.data?.notification === 'page-loaded') {
                    console.log('OneDrive picker loaded');
                }
                break;

            case 'command':
                // Acknowledge all commands
                this.port.postMessage({
                    type: 'acknowledge',
                    id: payload.id
                });

                const command = payload.data;

                switch (command.command) {
                    case 'authenticate':
                        await this.handleAuthenticate(payload.id, command);
                        break;

                    case 'pick':
                        await this.handlePick(payload.id, command, mode);
                        break;

                    case 'close':
                        this.handleClose(payload.id);
                        break;

                    default:
                        // Unsupported command
                        this.port.postMessage({
                            type: 'result',
                            id: payload.id,
                            data: {
                                result: 'error',
                                error: {
                                    code: 'unsupportedCommand',
                                    message: command.command
                                }
                            }
                        });
                }
                break;
        }
    }

    /**
     * Handle authentication command
     */
    async handleAuthenticate(messageId, command) {
        try {
            // Get fresh token for the requested resource
            const accessToken = await authService.getAccessToken();
            
            if (!accessToken) {
                throw new Error('No access token available');
            }

            this.port.postMessage({
                type: 'result',
                id: messageId,
                data: {
                    result: 'token',
                    token: accessToken
                }
            });
        } catch (error) {
            this.port.postMessage({
                type: 'result',
                id: messageId,
                data: {
                    result: 'error',
                    error: {
                        code: 'unableToObtainToken',
                        message: error.message
                    }
                }
            });
        }
    }

    /**
     * Handle pick command
     */
    async handlePick(messageId, command, mode) {
        try {
            const items = command.items || [];
            
            if (items.length === 0) {
                throw new Error('No items selected');
            }

            const item = items[0];

            // Save the parent folder for next time
            if (item.parentReference?.id) {
                this.saveLastFolderId(item.parentReference.id);
            }

            // Report success
            this.port.postMessage({
                type: 'result',
                id: messageId,
                data: { result: 'success' }
            });

            // Close the picker
            this.cleanup();

            // Resolve with the picked item
            if (mode === 'open') {
                this.resolvePromise({
                    file: {
                        id: item.id,
                        name: item.name,
                        parentId: item.parentReference?.id,
                        driveId: item.parentReference?.driveId,
                        webUrl: item['@sharePoint.endpoint'] || item.webUrl
                    },
                    provider: 'onedrive'
                });
            } else {
                // For save mode, return folder info
                this.resolvePromise({
                    folderId: item.id,
                    folderName: item.name,
                    driveId: item.parentReference?.driveId,
                    provider: 'onedrive'
                });
            }
        } catch (error) {
            this.port.postMessage({
                type: 'result',
                id: messageId,
                data: {
                    result: 'error',
                    error: {
                        code: 'pickError',
                        message: error.message
                    }
                }
            });
        }
    }

    /**
     * Handle close command
     */
    handleClose(messageId) {
        this.cleanup();
        this.resolvePromise(null); // User cancelled
    }

    /**
     * Initiate the picker by posting form to the picker URL
     */
    initiatePicker(accessToken, config) {
        const baseUrl = this.getBaseUrl();
        const queryString = new URLSearchParams({
            filePicker: JSON.stringify(config),
            locale: navigator.language || 'en-us'
        });

        const url = `${baseUrl}?${queryString}`;

        // Create and submit form
        const form = this.pickerWindow.document.createElement('form');
        form.setAttribute('action', url);
        form.setAttribute('method', 'POST');

        // Add access token as hidden field
        const tokenInput = this.pickerWindow.document.createElement('input');
        tokenInput.setAttribute('type', 'hidden');
        tokenInput.setAttribute('name', 'access_token');
        tokenInput.setAttribute('value', accessToken);
        form.appendChild(tokenInput);

        this.pickerWindow.document.body.appendChild(form);
        form.submit();
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.messageHandler) {
            window.removeEventListener('message', this.messageHandler);
            this.messageHandler = null;
        }

        if (this.port) {
            this.port.close();
            this.port = null;
        }

        if (this.pickerWindow && !this.pickerWindow.closed) {
            this.pickerWindow.close();
        }
        this.pickerWindow = null;
    }

    /**
     * Static method to show open picker
     */
    static async showOpen() {
        const picker = new OneDrivePicker();
        return picker.showOpenPicker();
    }

    /**
     * Static method to show save picker
     */
    static async showSave(suggestedName) {
        const picker = new OneDrivePicker();
        return picker.showSavePicker(suggestedName);
    }
}

export default OneDrivePicker;
