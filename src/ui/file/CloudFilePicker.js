/**
 * CloudFilePicker - Modal for browsing and selecting cloud files
 * 
 * Provides a unified interface for browsing files in OneDrive and Google Drive.
 * Can be used for both opening and saving files.
 */

import { ProviderIcon } from './ProviderIcon.js';
import { getCloudStorageManager } from '../../core/storage/providers/index.js';

/**
 * @typedef {'open' | 'save'} PickerMode
 */

/**
 * @typedef {Object} CloudFile
 * @property {string} id - File ID
 * @property {string} name - File name
 * @property {string} path - Full path
 * @property {boolean} isFolder - Is this a folder
 * @property {Date} modifiedAt - Last modified date
 * @property {number} size - File size in bytes
 * @property {string} accessLevel - Access level
 */

export class CloudFilePicker {
    /**
     * Create cloud file picker
     * @param {Object} options
     * @param {'onedrive' | 'google-drive'} options.provider - Cloud provider
     * @param {PickerMode} options.mode - Picker mode
     * @param {string[]} options.fileTypes - Allowed file types (default: ['.str'])
     * @param {string} options.suggestedName - Suggested name for save mode
     * @param {Function} options.onSelect - Called when file is selected
     * @param {Function} options.onCancel - Called when cancelled
     */
    constructor(options) {
        this.provider = options.provider;
        this.mode = options.mode || 'open';
        this.fileTypes = options.fileTypes || ['.str'];
        this.suggestedName = options.suggestedName || '';
        this.onSelect = options.onSelect || (() => {});
        this.onCancel = options.onCancel || (() => {});
        
        /** @type {HTMLElement} */
        this.overlay = null;
        
        /** @type {HTMLElement} */
        this.modal = null;
        
        /** @type {CloudFile[]} */
        this.files = [];
        
        /** @type {CloudFile|null} */
        this.selectedFile = null;
        
        /** @type {string[]} */
        this.pathStack = [];
        
        /** @type {string|null} */
        this.currentFolderId = null;
        
        /** @type {boolean} */
        this.isLoading = false;
        
        this.cloudStorage = getCloudStorageManager();
        
        this.create();
    }
    
    create() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'cloud-picker-overlay';
        
        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'cloud-picker-modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'cloud-picker-title');
        
        const providerName = ProviderIcon.getName(this.provider);
        const title = this.mode === 'open' 
            ? `Open from ${providerName}` 
            : `Save to ${providerName}`;
        
        this.modal.innerHTML = `
            <div class="cloud-picker__header">
                <h2 id="cloud-picker-title" class="cloud-picker__title">${title}</h2>
                <button class="cloud-picker__close" aria-label="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <div class="cloud-picker__content">
                <div class="cloud-picker__breadcrumb">
                    <button class="cloud-picker__breadcrumb-back" disabled>
                        <i class="fa-solid fa-chevron-left"></i>
                        <span>Back</span>
                    </button>
                    <div class="cloud-picker__breadcrumb-path">
                        <span class="cloud-picker__breadcrumb-segment" data-id="root">
                            <i class="fa-solid fa-folder"></i>
                            My Files
                        </span>
                    </div>
                </div>
                
                <div class="cloud-picker__list-container">
                    <div class="cloud-picker__loading">
                        <div class="cloud-picker__spinner"></div>
                        <span>Loading files...</span>
                    </div>
                    <div class="cloud-picker__list" role="listbox" aria-label="Files"></div>
                    <div class="cloud-picker__empty">
                        <i class="fa-regular fa-folder-open"></i>
                        <span>No .str files found</span>
                    </div>
                </div>
                
                ${this.mode === 'save' ? `
                    <div class="cloud-picker__filename">
                        <label for="cloud-picker-filename">File name</label>
                        <div class="cloud-picker__filename-input">
                            <input type="text" id="cloud-picker-filename" value="${this.escapeHtml(this.suggestedName.replace('.str', ''))}" placeholder="Untitled">
                            <span class="cloud-picker__filename-ext">.str</span>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="cloud-picker__footer">
                <div class="cloud-picker__selection">
                    ${this.mode === 'open' ? '<span>No file selected</span>' : ''}
                </div>
                <div class="cloud-picker__actions">
                    <button class="cloud-picker__btn cloud-picker__btn--secondary" data-action="cancel">
                        Cancel
                    </button>
                    <button class="cloud-picker__btn cloud-picker__btn--primary" data-action="confirm" disabled>
                        ${this.mode === 'open' ? 'Open' : 'Save'}
                    </button>
                </div>
            </div>
        `;
        
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
        
        this.bindEvents();
        this.loadFiles();
    }
    
    bindEvents() {
        // Close button
        this.modal.querySelector('.cloud-picker__close').addEventListener('click', () => {
            this.cancel();
        });
        
        // Overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.cancel();
            }
        });
        
        // Back button
        this.modal.querySelector('.cloud-picker__breadcrumb-back').addEventListener('click', () => {
            this.goBack();
        });
        
        // Action buttons
        this.modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            this.cancel();
        });
        
        this.modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            this.confirm();
        });
        
        // File name input (save mode)
        if (this.mode === 'save') {
            const input = this.modal.querySelector('#cloud-picker-filename');
            input.addEventListener('input', () => {
                this.updateConfirmButton();
            });
        }
        
        // Escape key
        document.addEventListener('keydown', this.handleKeyDown);
    }
    
    handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            this.cancel();
        }
    };
    
    /**
     * Load files from current folder
     */
    async loadFiles() {
        this.isLoading = true;
        this.updateLoadingState();
        
        try {
            const provider = this.cloudStorage.getProvider(this.provider);
            if (!provider) {
                throw new Error(`Provider ${this.provider} not available`);
            }
            
            // Check if authenticated, if not, show sign-in prompt
            if (!provider.isAuthenticated()) {
                this.isLoading = false;
                this.updateLoadingState();
                this.showSignInPrompt(provider);
                return;
            }
            
            // List files in current folder
            const files = await provider.listFiles(this.currentFolderId);
            
            this.files = Array.isArray(files) ? files : (files.files || []);
            this.renderFiles();
        } catch (error) {
            console.error('Failed to load files:', error);
            // Check if it's an authentication error
            if (error.message?.includes('Not authenticated') || error.message?.includes('auth')) {
                const provider = this.cloudStorage.getProvider(this.provider);
                this.showSignInPrompt(provider);
            } else {
                this.showError('Failed to load files. Please try again.');
            }
        } finally {
            this.isLoading = false;
            this.updateLoadingState();
        }
    }
    
    /**
     * Show sign-in prompt in the picker
     * @param {Object} provider - The cloud storage provider
     */
    showSignInPrompt(provider) {
        const listContainer = this.modal.querySelector('.cloud-picker__list');
        const emptyContainer = this.modal.querySelector('.cloud-picker__empty');
        const loadingContainer = this.modal.querySelector('.cloud-picker__loading');
        
        // Hide loading and list
        loadingContainer.style.display = 'none';
        listContainer.innerHTML = '';
        
        // Show sign-in prompt in empty container
        const providerName = this.provider === 'onedrive' ? 'Microsoft' : 'Google';
        const providerIcon = this.provider === 'onedrive' 
            ? `<svg viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <rect width="9" height="9" fill="#f25022"/>
                <rect x="11" width="9" height="9" fill="#7fba00"/>
                <rect y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
               </svg>`
            : `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>`;
        
        emptyContainer.innerHTML = `
            <div class="cloud-picker__signin">
                <div class="cloud-picker__signin-icon">
                    <i class="fa-solid fa-cloud"></i>
                </div>
                <h3 class="cloud-picker__signin-title">Sign in to access your files</h3>
                <p class="cloud-picker__signin-description">
                    Connect your ${providerName} account to browse and ${this.mode === 'open' ? 'open' : 'save'} files.
                </p>
                <button class="cloud-picker__signin-btn" data-action="signin">
                    ${providerIcon}
                    <span>Sign in with ${providerName}</span>
                </button>
            </div>
        `;
        emptyContainer.style.display = 'flex';
        
        // Bind sign-in button
        const signInBtn = emptyContainer.querySelector('[data-action="signin"]');
        signInBtn.addEventListener('click', async () => {
            signInBtn.disabled = true;
            signInBtn.classList.add('cloud-picker__signin-btn--loading');
            
            try {
                await provider.authenticate();
                // After successful authentication, reload files
                this.loadFiles();
            } catch (error) {
                console.error('Authentication failed:', error);
                signInBtn.disabled = false;
                signInBtn.classList.remove('cloud-picker__signin-btn--loading');
                
                // Show error below the button
                let errorEl = emptyContainer.querySelector('.cloud-picker__signin-error');
                if (!errorEl) {
                    errorEl = document.createElement('p');
                    errorEl.className = 'cloud-picker__signin-error';
                    signInBtn.parentNode.appendChild(errorEl);
                }
                errorEl.textContent = 'Sign-in failed. Please try again.';
            }
        });
    }
    
    /**
     * Render file list
     */
    renderFiles() {
        const listContainer = this.modal.querySelector('.cloud-picker__list');
        const emptyContainer = this.modal.querySelector('.cloud-picker__empty');
        
        // Sort: folders first, then files
        const sorted = [...this.files].sort((a, b) => {
            if (a.isFolder && !b.isFolder) return -1;
            if (!a.isFolder && b.isFolder) return 1;
            return a.name.localeCompare(b.name);
        });
        
        // Filter for .str files in open mode (but show all folders)
        const filtered = sorted.filter(f => {
            if (f.isFolder) return true;
            if (this.mode === 'save') return true;
            return this.fileTypes.some(ext => f.name.toLowerCase().endsWith(ext));
        });
        
        if (filtered.length === 0) {
            listContainer.innerHTML = '';
            emptyContainer.style.display = 'flex';
            return;
        }
        
        emptyContainer.style.display = 'none';
        
        listContainer.innerHTML = filtered.map(file => this.renderFileItem(file)).join('');
        
        // Bind file click events
        listContainer.querySelectorAll('.cloud-picker__item').forEach(item => {
            item.addEventListener('click', () => {
                const fileId = item.dataset.id;
                const file = this.files.find(f => f.id === fileId);
                if (file) {
                    if (file.isFolder) {
                        this.navigateToFolder(file);
                    } else {
                        this.selectFile(file, item);
                    }
                }
            });
            
            item.addEventListener('dblclick', () => {
                const fileId = item.dataset.id;
                const file = this.files.find(f => f.id === fileId);
                if (file && !file.isFolder) {
                    this.selectFile(file, item);
                    this.confirm();
                }
            });
        });
    }
    
    /**
     * Render a single file item
     * @param {CloudFile} file
     * @returns {string}
     */
    renderFileItem(file) {
        const icon = file.isFolder 
            ? '<i class="fa-solid fa-folder"></i>' 
            : '<i class="fa-regular fa-file"></i>';
        
        const accessIcon = this.getAccessIcon(file.accessLevel);
        const date = file.modifiedAt ? this.formatDate(file.modifiedAt) : '';
        
        return `
            <button class="cloud-picker__item ${file.isFolder ? 'cloud-picker__item--folder' : ''}" 
                    data-id="${file.id}"
                    role="option"
                    aria-selected="false">
                <span class="cloud-picker__item-icon">${icon}</span>
                <span class="cloud-picker__item-name">${this.escapeHtml(file.name)}</span>
                ${accessIcon ? `<span class="cloud-picker__item-lock">${accessIcon}</span>` : ''}
                <span class="cloud-picker__item-date">${date}</span>
            </button>
        `;
    }
    
    /**
     * Get access icon HTML
     * @param {string} accessLevel
     * @returns {string}
     */
    getAccessIcon(accessLevel) {
        if (accessLevel === 'account-locked') {
            return '<i class="fa-solid fa-lock" title="Account-locked"></i>';
        }
        if (accessLevel === 'public') {
            return '<i class="fa-solid fa-globe" title="Public"></i>';
        }
        return '';
    }
    
    /**
     * Navigate to a folder
     * @param {CloudFile} folder
     */
    navigateToFolder(folder) {
        this.pathStack.push({
            id: this.currentFolderId,
            name: this.getCurrentFolderName()
        });
        
        this.currentFolderId = folder.id;
        this.selectedFile = null;
        this.updateBreadcrumb();
        this.updateSelection();
        this.loadFiles();
    }
    
    /**
     * Go back to parent folder
     */
    goBack() {
        if (this.pathStack.length === 0) return;
        
        const parent = this.pathStack.pop();
        this.currentFolderId = parent.id;
        this.selectedFile = null;
        this.updateBreadcrumb();
        this.updateSelection();
        this.loadFiles();
    }
    
    /**
     * Get current folder name
     * @returns {string}
     */
    getCurrentFolderName() {
        if (!this.currentFolderId) return 'My Files';
        const current = this.files.find(f => f.id === this.currentFolderId);
        return current ? current.name : 'My Files';
    }
    
    /**
     * Update breadcrumb display
     */
    updateBreadcrumb() {
        const backBtn = this.modal.querySelector('.cloud-picker__breadcrumb-back');
        const pathContainer = this.modal.querySelector('.cloud-picker__breadcrumb-path');
        
        backBtn.disabled = this.pathStack.length === 0;
        
        const segments = [
            { id: null, name: 'My Files' },
            ...this.pathStack.map(p => ({ id: p.id, name: p.name }))
        ];
        
        if (this.currentFolderId) {
            segments.push({ id: this.currentFolderId, name: this.getCurrentFolderName() });
        }
        
        pathContainer.innerHTML = segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            const separator = i < segments.length - 1 ? '<span class="cloud-picker__breadcrumb-sep">›</span>' : '';
            
            return `
                <span class="cloud-picker__breadcrumb-segment ${isLast ? 'cloud-picker__breadcrumb-segment--current' : ''}" 
                      data-id="${seg.id || 'root'}">
                    ${i === 0 ? '<i class="fa-solid fa-folder"></i>' : ''}
                    ${this.escapeHtml(seg.name)}
                </span>
                ${separator}
            `;
        }).join('');
    }
    
    /**
     * Select a file
     * @param {CloudFile} file
     * @param {HTMLElement} element
     */
    selectFile(file, element) {
        // Deselect previous
        const prev = this.modal.querySelector('.cloud-picker__item--selected');
        if (prev) {
            prev.classList.remove('cloud-picker__item--selected');
            prev.setAttribute('aria-selected', 'false');
        }
        
        // Select new
        this.selectedFile = file;
        element.classList.add('cloud-picker__item--selected');
        element.setAttribute('aria-selected', 'true');
        
        this.updateSelection();
    }
    
    /**
     * Update selection display and confirm button
     */
    updateSelection() {
        const selectionContainer = this.modal.querySelector('.cloud-picker__selection');
        const confirmBtn = this.modal.querySelector('[data-action="confirm"]');
        
        if (this.mode === 'open') {
            if (this.selectedFile) {
                selectionContainer.innerHTML = `<span>Selected: <strong>${this.escapeHtml(this.selectedFile.name)}</strong></span>`;
                confirmBtn.disabled = false;
            } else {
                selectionContainer.innerHTML = '<span>No file selected</span>';
                confirmBtn.disabled = true;
            }
        } else {
            this.updateConfirmButton();
        }
    }
    
    /**
     * Update confirm button state for save mode
     */
    updateConfirmButton() {
        if (this.mode !== 'save') return;
        
        const input = this.modal.querySelector('#cloud-picker-filename');
        const confirmBtn = this.modal.querySelector('[data-action="confirm"]');
        
        const filename = input.value.trim();
        confirmBtn.disabled = filename.length === 0;
    }
    
    /**
     * Update loading state
     */
    updateLoadingState() {
        const loading = this.modal.querySelector('.cloud-picker__loading');
        const list = this.modal.querySelector('.cloud-picker__list');
        const empty = this.modal.querySelector('.cloud-picker__empty');
        
        if (this.isLoading) {
            loading.style.display = 'flex';
            list.style.display = 'none';
            empty.style.display = 'none';
        } else {
            loading.style.display = 'none';
            list.style.display = 'flex';
        }
    }
    
    /**
     * Show error message
     * @param {string} message
     */
    showError(message) {
        const empty = this.modal.querySelector('.cloud-picker__empty');
        empty.innerHTML = `
            <i class="fa-solid fa-exclamation-triangle"></i>
            <span>${this.escapeHtml(message)}</span>
        `;
        empty.style.display = 'flex';
    }
    
    /**
     * Confirm selection
     */
    confirm() {
        if (this.mode === 'open') {
            if (this.selectedFile) {
                this.close();
                this.onSelect({
                    file: this.selectedFile,
                    provider: this.provider
                });
            }
        } else {
            const input = this.modal.querySelector('#cloud-picker-filename');
            const filename = input.value.trim();
            
            if (filename) {
                this.close();
                this.onSelect({
                    filename: filename + '.str',
                    folderId: this.currentFolderId,
                    provider: this.provider
                });
            }
        }
    }
    
    /**
     * Cancel and close
     */
    cancel() {
        this.close();
        this.onCancel();
    }
    
    /**
     * Close modal
     */
    close() {
        document.removeEventListener('keydown', this.handleKeyDown);
        
        if (this.overlay) {
            this.overlay.classList.add('cloud-picker-overlay--closing');
            setTimeout(() => {
                if (this.overlay) {
                    this.overlay.remove();
                    this.overlay = null;
                    this.modal = null;
                }
            }, 150);
        }
    }
    
    /**
     * Format date
     * @param {Date|string} date
     * @returns {string}
     */
    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return d.toLocaleDateString();
    }
    
    /**
     * Escape HTML
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    /**
     * Static method to show picker and return promise
     * @param {Object} options
     * @returns {Promise<{file?: CloudFile, filename?: string, folderId?: string, provider: string}|null>}
     */
    static show(options) {
        return new Promise((resolve) => {
            new CloudFilePicker({
                ...options,
                onSelect: (result) => resolve(result),
                onCancel: () => resolve(null)
            });
        });
    }
}

export default CloudFilePicker;
