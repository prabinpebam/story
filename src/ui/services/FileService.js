/**
 * FileService - File operations manager
 * 
 * Coordinates file open, save, and new operations using
 * the FileSystemAccess API, cloud storage, and serialization modules.
 * Tracks unsaved changes, file source, and recent files.
 */

import { store } from '../../core/Store.js';
import { FileSystemAccess } from '../../core/storage/filesystem/FileSystemAccess.js';
import { PresentationSerializer } from '../../core/storage/serialization/PresentationSerializer.js';
import { PresentationDeserializer } from '../../core/storage/serialization/PresentationDeserializer.js';
import { getCloudStorageManager } from '../../core/storage/providers/CloudStorageManager.js';
import { STORAGE_ERRORS } from '../../core/storage/constants/StorageConstants.js';
import { authService } from '../../core/auth/index.js';
import { alertModal } from '../components/AlertModal.js';
import { EventEmitter } from '../../core/Events.js';
import { CloudFilePicker } from '../file/CloudFilePicker.js';
import { SaveToCloudModal } from '../file/SaveToCloudModal.js';
import { SignInPrompt } from '../file/SignInPrompt.js';

// Create singleton instance
const fileSystemAccess = new FileSystemAccess();

const RECENT_FILES_KEY = 'story_recent_files';
const MAX_RECENT_FILES = 10;

/**
 * @typedef {'local' | 'onedrive' | 'google-drive'} FileSource
 */

/**
 * @typedef {Object} CloudFileInfo
 * @property {string} id - Cloud file ID
 * @property {string} name - File name
 * @property {FileSource} provider - Cloud provider
 * @property {string} folderId - Parent folder ID
 * @property {string} folderPath - Parent folder path
 * @property {'account-locked' | 'public'} accessLevel - Access level
 */

class FileService extends EventEmitter {
    constructor() {
        super();
        /** @type {FileSystemFileHandle|null} */
        this.currentFileHandle = null;
        /** @type {string|null} */
        this.currentFileName = null;
        /** @type {FileSource} */
        this.currentSource = 'local';
        /** @type {CloudFileInfo|null} */
        this.cloudFileInfo = null;
        this.lastSavedState = null;
        this.recentFiles = this.loadRecentFiles();
        
        // Track state changes for "unsaved" detection
        this.setupStateTracking();
    }

    /**
     * Setup listener for state changes to track unsaved modifications
     */
    setupStateTracking() {
        // Snapshot state after successful save/load
        store.on('state-changed', () => {
            // Mark as potentially unsaved
            this.emit('dirty-state-changed', this.hasUnsavedChanges());
        });
    }

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges() {
        if (!this.lastSavedState) {
            // Check if we have any content beyond initial state
            const state = store.getState();
            return state.slides && state.slides.length > 0 && 
                   state.slides.some(s => s.elements && s.elements.length > 0);
        }
        
        // Compare current state with last saved
        const currentState = store.getState();
        return JSON.stringify(currentState.slides) !== JSON.stringify(this.lastSavedState.slides);
    }

    /**
     * Get current file info
     * @returns {Object}
     */
    getCurrentFileInfo() {
        return {
            name: this.currentFileName,
            source: this.currentSource,
            cloudInfo: this.cloudFileInfo,
            hasUnsavedChanges: this.hasUnsavedChanges()
        };
    }

    /**
     * Create a new presentation
     * @param {boolean} force - Skip unsaved changes check
     */
    async newPresentation(force = false) {
        // Check for unsaved changes
        if (!force && this.hasUnsavedChanges()) {
            const result = await alertModal.unsavedChanges();
            
            if (result === 'cancel') {
                return false;
            }
            
            if (result === 'save') {
                const saved = await this.save();
                if (!saved) return false;
            }
        }

        // Reset state to initial
        store.dispatch('RESET_STATE');
        
        // Clear file handle
        this.currentFileHandle = null;
        this.currentFileName = null;
        this.currentSource = 'local';
        this.cloudFileInfo = null;
        this.lastSavedState = null;
        
        this.emit('file-changed', { name: null, handle: null, source: 'local' });
        
        return true;
    }

    /**
     * Open a file using the file picker
     */
    async open() {
        // Check for unsaved changes first
        if (this.hasUnsavedChanges()) {
            const result = await alertModal.unsavedChanges();
            
            if (result === 'cancel') {
                return false;
            }
            
            if (result === 'save') {
                const saved = await this.save();
                if (!saved) return false;
            }
        }

        try {
            // Show file picker
            const result = await fileSystemAccess.showOpenPicker();
            
            if (!result) {
                return false; // User cancelled
            }

            const { handle, file } = result;
            
            // Read file content
            const arrayBuffer = await file.arrayBuffer();
            
            // Deserialize
            const deserializer = new PresentationDeserializer(arrayBuffer);
            const presentationData = await deserializer.deserialize();
            
            // Load into store
            store.dispatch('LOAD_PRESENTATION', presentationData);
            
            // Update file tracking
            this.currentFileHandle = handle;
            this.currentFileName = file.name;
            this.currentSource = 'local';
            this.cloudFileInfo = null;
            this.lastSavedState = store.getState();
            
            // Add to recent files
            this.addToRecentFiles({
                name: file.name,
                source: 'local',
                lastOpened: new Date().toISOString()
            });
            
            this.emit('file-changed', { name: file.name, handle, source: 'local' });
            
            return true;
        } catch (error) {
            // Check if user cancelled - don't log as error
            if (error.message === STORAGE_ERRORS.USER_CANCELLED) {
                return false;
            }
            
            console.error('Failed to open file:', error);
            
            await alertModal.alert({
                title: 'Unable to Open',
                message: error.message || 'The file could not be opened. Please check the file format and try again.',
                type: 'error'
            });
            
            return false;
        }
    }

    /**
     * Open a file from cloud storage using modal picker
     * @param {'onedrive' | 'google-drive'} provider
     */
    async openFromCloud(provider) {
        // Check for unsaved changes first
        if (this.hasUnsavedChanges()) {
            const result = await alertModal.unsavedChanges();
            
            if (result === 'cancel') {
                return false;
            }
            
            if (result === 'save') {
                const saved = await this.save();
                if (!saved) return false;
            }
        }

        try {
            // Show cloud file picker modal (handles auth inline if needed)
            const result = await CloudFilePicker.show({
                provider,
                mode: 'open'
            });
            
            if (!result || !result.file) {
                return false; // User cancelled
            }

            // Emit status
            this.emit('file-status', 'loading');
            
            // Download file from cloud
            const cloudManager = getCloudStorageManager();
            const fileData = await cloudManager.readFile(provider, { id: result.file.id }, {});
            
            // Deserialize
            const deserializer = new PresentationDeserializer(fileData);
            const presentationData = await deserializer.deserialize();
            
            // Load into store
            store.dispatch('LOAD_PRESENTATION', presentationData);
            
            // Update file tracking
            this.currentFileHandle = null;
            this.currentFileName = result.file.name;
            this.currentSource = provider;
            this.cloudFileInfo = {
                id: result.file.id,
                name: result.file.name,
                provider,
                folderId: result.file.parentId,
                accessLevel: 'account-locked'
            };
            this.lastSavedState = store.getState();
            
            // Add to recent files
            this.addToRecentFiles({
                name: result.file.name,
                source: provider,
                cloudId: result.file.id,
                lastOpened: new Date().toISOString()
            });
            
            this.emit('file-changed', { 
                name: result.file.name, 
                source: provider,
                cloudInfo: this.cloudFileInfo
            });
            this.emit('file-status', 'saved');
            
            return true;
        } catch (error) {
            console.error('Failed to open from cloud:', error);
            this.emit('file-status', 'error');
            
            await alertModal.alert({
                title: 'Unable to Open',
                message: error.message || 'The file could not be downloaded from cloud storage.',
                type: 'error'
            });
            
            return false;
        }
    }

    /**
     * Save the current presentation
     * @param {boolean} saveAs - Force save as (show picker)
     */
    async save(saveAs = false) {
        // If cloud file, save to cloud
        if (this.currentSource !== 'local' && this.cloudFileInfo && !saveAs) {
            return this.saveToCloud(this.currentSource, false);
        }

        const state = store.getState();

        try {
            // Serialize presentation first (needed for both native save and download)
            const serializer = new PresentationSerializer(state);
            const data = await serializer.serialize();
            const fileName = this.currentFileName || 'Untitled.str';

            // Need file handle?
            if (saveAs || !this.currentFileHandle) {
                const handle = await fileSystemAccess.showSavePicker(fileName);
                
                if (!handle) {
                    // Fallback to download if picker not available or cancelled
                    if (!fileSystemAccess.isSupported) {
                        fileSystemAccess.downloadFile(new Blob([data]), fileName);
                        this.currentFileName = fileName;
                        this.currentSource = 'local';
                        this.cloudFileInfo = null;
                        this.lastSavedState = state;
                        this.emit('file-saved', { name: fileName, source: 'local' });
                        this.emit('dirty-state-changed', false);
                        this.showSaveToast();
                        return true;
                    }
                    return false; // User cancelled in native picker
                }
                
                this.currentFileHandle = handle;
                this.currentFileName = handle.name;
                this.currentSource = 'local';
                this.cloudFileInfo = null;
            }

            // Write to file
            await fileSystemAccess.writeFile(this.currentFileHandle, data);
            
            // Update saved state
            this.lastSavedState = state;
            
            // Add to recent files
            this.addToRecentFiles({
                name: this.currentFileName,
                source: 'local',
                lastOpened: new Date().toISOString()
            });
            
            this.emit('file-saved', { name: this.currentFileName, source: 'local' });
            this.emit('dirty-state-changed', false);
            this.emit('file-status', 'saved');
            
            // Show brief success feedback
            this.showSaveToast();
            
            return true;
        } catch (error) {
            // Check if user cancelled - don't log as error
            if (error.message === STORAGE_ERRORS.USER_CANCELLED) {
                // User cancelled, silently return
                return false;
            }
            
            console.error('Failed to save file:', error);
            this.emit('file-status', 'error');
            
            // Check if it's a permission error
            if (error.name === 'NotAllowedError' || error.message === STORAGE_ERRORS.PERMISSION_DENIED) {
                await alertModal.alert({
                    title: 'Permission Denied',
                    message: 'Permission to save was denied. Please try again and grant write access.',
                    type: 'error'
                });
            } else {
                await alertModal.alert({
                    title: 'Unable to Save',
                    message: error.message || 'The file could not be saved. Please try again.',
                    type: 'error'
                });
            }
            
            return false;
        }
    }

    /**
     * Save As - always show file picker
     */
    async saveAs() {
        return this.save(true);
    }

    /**
     * Save to cloud storage using native picker
     * @param {'onedrive' | 'google-drive'} provider
     * @param {boolean} saveAs - Force save as (show picker)
     */
    async saveToCloud(provider, saveAs = true) {
        // Check authentication
        const isAuthenticated = await this.ensureAuthenticated(provider);
        if (!isAuthenticated) {
            return false;
        }

        const state = store.getState();

        try {
            let targetInfo;
            const suggestedName = this.currentFileName || 'Untitled.str';

            // Need to pick location?
            if (saveAs || !this.cloudFileInfo || this.cloudFileInfo.provider !== provider) {
                // Show save to cloud modal
                const result = await SaveToCloudModal.show({
                    provider,
                    suggestedName: suggestedName.replace('.str', '')
                });
                
                if (!result) {
                    return false; // User cancelled
                }

                targetInfo = {
                    filename: result.filename,
                    folderId: result.folderId,
                    folderPath: result.folderPath,
                    accessLevel: result.accessLevel || 'account-locked',
                    provider
                };
            } else {
                // Use existing cloud file info
                targetInfo = {
                    filename: this.cloudFileInfo.name,
                    folderId: this.cloudFileInfo.folderId,
                    folderPath: this.cloudFileInfo.folderPath,
                    accessLevel: this.cloudFileInfo.accessLevel,
                    provider
                };
            }

            // Emit saving status
            this.emit('file-status', 'saving');

            // Serialize presentation
            const serializer = new PresentationSerializer(state);
            const data = await serializer.serialize();

            // Upload to cloud
            const cloudManager = getCloudStorageManager();
            let cloudFile;
            if (!saveAs && this.cloudFileInfo && this.cloudFileInfo.id) {
                // Update existing file
                const handle = { 
                    id: this.cloudFileInfo.id, 
                    name: targetInfo.filename,
                    folderId: targetInfo.folderId 
                };
                cloudFile = await cloudManager.getProvider(provider)?.write(handle, data, {});
            } else {
                // Create new file - use saveFileAs
                cloudFile = await cloudManager.saveFileAs(
                    provider,
                    data,
                    targetInfo.filename,
                    { folderId: targetInfo.folderId }
                );
            }

            // Update file tracking
            this.currentFileHandle = null;
            this.currentFileName = targetInfo.filename;
            this.currentSource = provider;
            this.cloudFileInfo = {
                id: cloudFile.id,
                name: targetInfo.filename,
                provider,
                folderId: targetInfo.folderId,
                folderPath: targetInfo.folderPath,
                accessLevel: targetInfo.accessLevel
            };
            this.lastSavedState = state;

            // Add to recent files
            this.addToRecentFiles({
                name: targetInfo.filename,
                source: provider,
                cloudId: cloudFile.id,
                lastOpened: new Date().toISOString()
            });

            this.emit('file-saved', { name: targetInfo.filename, source: provider });
            this.emit('dirty-state-changed', false);
            this.emit('file-status', 'saved');
            this.emit('file-changed', {
                name: targetInfo.filename,
                source: provider,
                cloudInfo: this.cloudFileInfo
            });

            // Show brief success feedback
            this.showSaveToast(`Saved to ${provider === 'onedrive' ? 'OneDrive' : 'Google Drive'}`);

            return true;
        } catch (error) {
            console.error('Failed to save to cloud:', error);
            this.emit('file-status', 'error');

            await alertModal.alert({
                title: 'Unable to Save',
                message: error.message || 'The file could not be saved to cloud storage.',
                type: 'error'
            });

            return false;
        }
    }

    /**
     * Ensure user is authenticated with the cloud provider
     * @param {'onedrive' | 'google-drive'} provider
     * @returns {Promise<boolean>}
     */
    async ensureAuthenticated(provider) {
        const providerKey = provider === 'onedrive' ? 'microsoft' : 'google';
        
        if (authService.isAuthenticated(providerKey)) {
            return true;
        }

        // Show sign-in prompt
        const result = await SignInPrompt.show({
            message: `Sign in to access your ${provider === 'onedrive' ? 'OneDrive' : 'Google Drive'} files`
        });

        if (!result || result.action === 'cancel') {
            return false;
        }

        if (result.action === 'guest') {
            return false; // User chose to continue without signing in
        }

        // Sign in - result.action is 'signin' and result.provider is the chosen provider
        try {
            await authService.signIn(result.provider);
            return authService.isAuthenticated(providerKey);
        } catch (error) {
            console.error('Authentication failed:', error);
            
            await alertModal.alert({
                title: 'Sign In Failed',
                message: error.message || 'Unable to sign in. Please try again.',
                type: 'error'
            });
            
            return false;
        }
    }

    /**
     * Show a brief save success toast
     * @param {string} message - Optional custom message
     * @private
     */
    showSaveToast(message = 'Saved') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'file-toast';
        toast.innerHTML = `
            <i class="fa-solid fa-check"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 200);
        }, 1500);
    }

    /**
     * Get list of recent files
     */
    getRecentFiles() {
        return this.recentFiles;
    }

    /**
     * Load recent files from localStorage
     * @private
     */
    loadRecentFiles() {
        try {
            const stored = localStorage.getItem(RECENT_FILES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Add a file to recent files list
     * @private
     */
    addToRecentFiles(fileInfo) {
        // Remove existing entry with same name and source
        this.recentFiles = this.recentFiles.filter(
            f => !(f.name === fileInfo.name && f.source === fileInfo.source)
        );
        
        // Add to beginning
        this.recentFiles.unshift({
            name: fileInfo.name,
            source: fileInfo.source || 'local',
            cloudId: fileInfo.cloudId,
            lastOpened: fileInfo.lastOpened
        });
        
        // Limit to max
        this.recentFiles = this.recentFiles.slice(0, MAX_RECENT_FILES);
        
        // Persist
        this.saveRecentFiles();
        
        this.emit('recent-files-changed', this.recentFiles);
    }

    /**
     * Save recent files to localStorage
     * @private
     */
    saveRecentFiles() {
        try {
            localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(this.recentFiles));
        } catch (e) {
            console.warn('Failed to save recent files:', e);
        }
    }

    /**
     * Clear all recent files
     */
    clearRecentFiles() {
        this.recentFiles = [];
        this.saveRecentFiles();
        this.emit('recent-files-changed', this.recentFiles);
    }

    /**
     * Get current file name
     */
    getCurrentFileName() {
        return this.currentFileName;
    }

    /**
     * Get current file source
     * @returns {FileSource}
     */
    getCurrentSource() {
        return this.currentSource;
    }
}

// Export singleton instance
export const fileService = new FileService();
