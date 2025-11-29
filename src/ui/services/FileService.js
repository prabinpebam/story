/**
 * FileService - File operations manager
 * 
 * Coordinates file open, save, and new operations using
 * the FileSystemAccess API and serialization modules.
 * Tracks unsaved changes and recent files.
 */

import { store } from '../../core/Store.js';
import { FileSystemAccess } from '../../core/storage/filesystem/FileSystemAccess.js';
import { PresentationSerializer } from '../../core/storage/serialization/PresentationSerializer.js';
import { PresentationDeserializer } from '../../core/storage/serialization/PresentationDeserializer.js';
import { alertModal } from '../components/AlertModal.js';
import { EventEmitter } from '../../core/Events.js';

// Create singleton instance
const fileSystemAccess = new FileSystemAccess();

const RECENT_FILES_KEY = 'story_recent_files';
const MAX_RECENT_FILES = 10;

class FileService extends EventEmitter {
    constructor() {
        super();
        this.currentFileHandle = null;
        this.currentFileName = null;
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
        this.lastSavedState = null;
        
        this.emit('file-changed', { name: null, handle: null });
        
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
            const deserializer = new PresentationDeserializer();
            const presentationData = await deserializer.deserialize(arrayBuffer);
            
            // Load into store
            store.dispatch('LOAD_PRESENTATION', presentationData);
            
            // Update file tracking
            this.currentFileHandle = handle;
            this.currentFileName = file.name;
            this.lastSavedState = store.getState();
            
            // Add to recent files
            this.addToRecentFiles({
                name: file.name,
                handle: handle,
                lastOpened: new Date().toISOString()
            });
            
            this.emit('file-changed', { name: file.name, handle });
            
            return true;
        } catch (error) {
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
     * Save the current presentation
     * @param {boolean} saveAs - Force save as (show picker)
     */
    async save(saveAs = false) {
        const state = store.getState();

        try {
            // Need file handle?
            if (saveAs || !this.currentFileHandle) {
                const handle = await fileSystemAccess.showSavePicker({
                    suggestedName: this.currentFileName || 'Untitled.str'
                });
                
                if (!handle) {
                    return false; // User cancelled
                }
                
                this.currentFileHandle = handle;
                this.currentFileName = handle.name;
            }

            // Serialize presentation
            const serializer = new PresentationSerializer();
            const data = await serializer.serialize(state);

            // Write to file
            await fileSystemAccess.writeFile(this.currentFileHandle, data);
            
            // Update saved state
            this.lastSavedState = state;
            
            // Add to recent files
            this.addToRecentFiles({
                name: this.currentFileName,
                handle: this.currentFileHandle,
                lastOpened: new Date().toISOString()
            });
            
            this.emit('file-saved', { name: this.currentFileName });
            this.emit('dirty-state-changed', false);
            
            // Show brief success feedback
            this.showSaveToast();
            
            return true;
        } catch (error) {
            console.error('Failed to save file:', error);
            
            // Check if it's a permission error
            if (error.name === 'NotAllowedError') {
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
     * Show a brief save success toast
     * @private
     */
    showSaveToast() {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'file-toast';
        toast.innerHTML = `
            <i class="fa-solid fa-check"></i>
            <span>Saved</span>
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
        // Remove existing entry with same name
        this.recentFiles = this.recentFiles.filter(f => f.name !== fileInfo.name);
        
        // Add to beginning
        this.recentFiles.unshift({
            name: fileInfo.name,
            lastOpened: fileInfo.lastOpened
            // Note: Can't serialize file handles to localStorage
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
}

// Export singleton instance
export const fileService = new FileService();
