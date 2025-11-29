/**
 * CloudFileBrowser - Modern cloud file browser modal
 * 
 * A comprehensive file browser for OneDrive and Google Drive with:
 * - Sidebar navigation (Recent, My Files, Shared)
 * - Search functionality
 * - List and grid views
 * - Column sorting
 * - Keyboard navigation
 * - Responsive design
 */

import { ProviderIcon } from './ProviderIcon.js';
import { getCloudStorageManager } from '../../core/storage/providers/index.js';
import { authService } from '../../core/auth/index.js';

/**
 * @typedef {'open' | 'save'} BrowserMode
 * @typedef {'list' | 'grid'} ViewMode
 * @typedef {'name' | 'modified' | 'size'} SortColumn
 * @typedef {'asc' | 'desc'} SortDirection
 */

/**
 * @typedef {Object} CloudFile
 * @property {string} id - File ID
 * @property {string} name - File name
 * @property {boolean} isFolder - Is this a folder
 * @property {Date} modified - Last modified date
 * @property {number} size - File size in bytes
 * @property {string} [parentId] - Parent folder ID
 * @property {string} [thumbnailUrl] - Thumbnail URL for preview
 */

/**
 * @typedef {Object} NavigationItem
 * @property {string} id - Location ID
 * @property {string} name - Display name
 * @property {string} icon - Font Awesome icon class
 * @property {'location' | 'folder'} type - Item type
 */

// Storage keys
const STORAGE_KEYS = {
    RECENT_FILES: 'story_cloud_recent_files',
    LAST_FOLDER: 'story_cloud_last_folder',
    PENDING_ACTION: 'story_cloud_pending_action'
};

// Maximum recent files to store
const MAX_RECENT_FILES = 20;

// Default Story folder name
const STORY_FOLDER_NAME = 'Story';

export class CloudFileBrowser {
    /**
     * Create cloud file browser
     * @param {Object} options
     * @param {'onedrive' | 'google-drive'} options.provider - Cloud provider
     * @param {BrowserMode} options.mode - Browser mode
     * @param {string} options.suggestedName - Suggested filename for save mode
     * @param {Function} options.onSelect - Called when file is selected
     * @param {Function} options.onCancel - Called when cancelled
     */
    constructor(options) {
        console.log('[CloudFileBrowser] constructor called for provider:', options.provider);
        this.provider = options.provider;
        this.mode = options.mode || 'open';
        this.suggestedName = options.suggestedName || 'Untitled';
        this.onSelect = options.onSelect || (() => {});
        this.onCancel = options.onCancel || (() => {});
        
        // State
        /** @type {CloudFile[]} */
        this.files = [];
        /** @type {CloudFile|null} */
        this.selectedFile = null;
        /** @type {string|null} */
        this.currentFolderId = null;
        /** @type {string} */
        this.currentLocation = 'my-files'; // 'recent', 'my-files', 'shared'
        /** @type {Array<{id: string, name: string}>} */
        this.navigationHistory = [];
        /** @type {number} */
        this.historyIndex = -1;
        /** @type {SortColumn} */
        this.sortColumn = 'name';
        /** @type {SortDirection} */
        this.sortDirection = 'asc';
        /** @type {boolean} */
        this.isLoading = true; // Start in loading state for instant perceived performance
        /** @type {number} */
        this.focusedIndex = -1;
        
        // DOM references
        /** @type {HTMLElement} */
        this.overlay = null;
        /** @type {HTMLElement} */
        this.modal = null;
        
        // Cloud storage manager
        this.cloudStorage = getCloudStorageManager();
        console.log('[CloudFileBrowser] cloudStorage:', this.cloudStorage);
        
        this.create();
    }
    
    /**
     * Load last opened folder from localStorage
     */
    loadLastFolder() {
        try {
            const data = localStorage.getItem(`${STORAGE_KEYS.LAST_FOLDER}_${this.provider}`);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }
    
    /**
     * Save current folder as last opened
     * @param {string|null} folderId
     * @param {string} folderName
     */
    saveLastFolder(folderId, folderName) {
        try {
            localStorage.setItem(
                `${STORAGE_KEYS.LAST_FOLDER}_${this.provider}`, 
                JSON.stringify({ id: folderId, name: folderName })
            );
        } catch {
            // Ignore storage errors
        }
    }
    
    /**
     * Load recent files from localStorage
     */
    loadRecentFiles() {
        try {
            const data = localStorage.getItem(`${STORAGE_KEYS.RECENT_FILES}_${this.provider}`);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }
    
    /**
     * Save file to recent files
     * @param {CloudFile} file
     */
    addToRecentFiles(file) {
        try {
            let recent = this.loadRecentFiles();
            // Remove if already exists
            recent = recent.filter(f => f.id !== file.id);
            // Add to front
            recent.unshift({
                id: file.id,
                name: file.name,
                modified: file.modified,
                parentId: file.parentId,
                accessedAt: new Date().toISOString()
            });
            // Limit size
            recent = recent.slice(0, MAX_RECENT_FILES);
            localStorage.setItem(`${STORAGE_KEYS.RECENT_FILES}_${this.provider}`, JSON.stringify(recent));
        } catch {
            // Ignore storage errors
        }
    }
    
    /**
     * Get provider display name
     */
    getProviderName() {
        return this.provider === 'onedrive' ? 'OneDrive' : 'Google Drive';
    }
    
    /**
     * Get provider icon SVG
     */
    getProviderIconSVG() {
        if (this.provider === 'onedrive') {
            return `<img src="/assets/icons/one-drive.svg" alt="OneDrive" class="cfb-provider-icon">`;
        }
        return `<img src="/assets/icons/google-drive.svg" alt="Google Drive" class="cfb-provider-icon">`;
    }
    
    /**
     * Create the browser modal
     */
    create() {
        console.log('[CloudFileBrowser] create() called for provider:', this.provider);
        
        // Check for existing overlays
        const existingOverlays = document.querySelectorAll('.cfb-overlay');
        console.log('[CloudFileBrowser] Existing cfb-overlays in DOM:', existingOverlays.length);
        if (existingOverlays.length > 0) {
            console.log('[CloudFileBrowser] Removing existing overlays');
            existingOverlays.forEach(el => el.remove());
        }
        
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'cfb-overlay';
        
        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'cfb-modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'cfb-title');
        
        const title = this.mode === 'open' 
            ? `Open from ${this.getProviderName()}` 
            : `Save to ${this.getProviderName()}`;
        
        this.modal.innerHTML = `
            <header class="cfb-header">
                <div class="cfb-header-title">
                    ${this.getProviderIconSVG()}
                    <h2 id="cfb-title">${title}</h2>
                </div>
                <button class="cfb-close" aria-label="Close" data-action="close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </header>
            
            <div class="cfb-body">
                <aside class="cfb-sidebar">
                    <nav class="cfb-nav">
                        <button class="cfb-nav-item cfb-nav-item--active" data-location="my-files">
                            <i class="fa-solid fa-folder"></i>
                            <span>My Files</span>
                        </button>
                        <button class="cfb-nav-item" data-location="recent">
                            <i class="fa-solid fa-clock-rotate-left"></i>
                            <span>Recent</span>
                        </button>
                        <button class="cfb-nav-item" data-location="shared">
                            <i class="fa-solid fa-users"></i>
                            <span>Shared with me</span>
                        </button>
                    </nav>
                </aside>
                
                <main class="cfb-main">
                    <div class="cfb-breadcrumb">
                        <button class="cfb-nav-btn cfb-nav-btn--back" disabled aria-label="Go back">
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <button class="cfb-nav-btn cfb-nav-btn--forward" disabled aria-label="Go forward">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                        <div class="cfb-breadcrumb-path">
                            <button class="cfb-breadcrumb-item cfb-breadcrumb-item--root" data-id="root">
                                <i class="fa-solid fa-cloud"></i>
                                <span>${this.getProviderName()}</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="cfb-content">
                        <div class="cfb-list-header">
                            <button class="cfb-col-header cfb-col-name" data-sort="name">
                                Name
                                <i class="fa-solid fa-sort-up cfb-sort-icon"></i>
                            </button>
                            <button class="cfb-col-header cfb-col-modified" data-sort="modified">
                                Modified
                            </button>
                            <button class="cfb-col-header cfb-col-size" data-sort="size">
                                Size
                            </button>
                        </div>
                        
                        <div class="cfb-files cfb-files--list" role="listbox" aria-label="Files" tabindex="0" style="display: none;">
                            <!-- Files will be rendered here -->
                        </div>
                        
                        <div class="cfb-loading" style="display: flex;">
                            <div class="cfb-spinner"></div>
                            <span class="cfb-loading-text">Connecting to ${this.getProviderName()}...</span>
                        </div>
                        
                        <div class="cfb-empty" style="display: none;">
                            <div class="cfb-empty-icon">
                                <i class="fa-regular fa-folder-open"></i>
                            </div>
                            <h3 class="cfb-empty-title">No files found</h3>
                            <p class="cfb-empty-text">This folder is empty or contains no .str files.</p>
                        </div>
                        
                        <div class="cfb-error" style="display: none;">
                            <div class="cfb-error-icon">
                                <i class="fa-solid fa-exclamation-triangle"></i>
                            </div>
                            <h3 class="cfb-error-title">Something went wrong</h3>
                            <p class="cfb-error-text">Failed to load files. Please try again.</p>
                            <button class="cfb-btn cfb-btn--secondary cfb-error-retry">
                                <i class="fa-solid fa-rotate"></i>
                                Retry
                            </button>
                        </div>
                        
                        <div class="cfb-signin" style="display: none;">
                            <div class="cfb-signin-icon">
                                <i class="fa-solid fa-cloud"></i>
                            </div>
                            <h3 class="cfb-signin-title">Sign in to access your files</h3>
                            <p class="cfb-signin-text">
                                Connect your ${this.provider === 'onedrive' ? 'Microsoft' : 'Google'} account to browse and ${this.mode === 'open' ? 'open' : 'save'} files.
                            </p>
                            <button class="cfb-signin-btn">
                                ${this.getProviderIconSVG()}
                                <span>Sign in with ${this.provider === 'onedrive' ? 'Microsoft' : 'Google'}</span>
                            </button>
                        </div>
                    </div>
                </main>
            </div>
            
            <footer class="cfb-footer">
                <div class="cfb-selection">
                    ${this.mode === 'save' ? `
                        <label class="cfb-filename-label" for="cfb-filename">File name:</label>
                        <div class="cfb-filename-wrapper">
                            <input type="text" 
                                   id="cfb-filename" 
                                   class="cfb-filename-input" 
                                   value="${this.escapeHtml(this.suggestedName.replace('.str', ''))}"
                                   placeholder="Untitled">
                            <span class="cfb-filename-ext">.str</span>
                        </div>
                    ` : `
                        <span class="cfb-selected-file">No file selected</span>
                    `}
                </div>
                <div class="cfb-actions">
                    ${this.mode === 'save' ? `
                        <button class="cfb-btn cfb-btn--ghost" data-action="new-folder">
                            <i class="fa-solid fa-folder-plus"></i>
                            New Folder
                        </button>
                    ` : ''}
                    <button class="cfb-btn cfb-btn--secondary" data-action="cancel">Cancel</button>
                    <button class="cfb-btn cfb-btn--primary" data-action="confirm" disabled>
                        ${this.mode === 'open' ? 'Open' : 'Save'}
                    </button>
                </div>
            </footer>
        `;
        
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
        console.log('[CloudFileBrowser] Modal appended to DOM, overlay:', this.overlay, 'modal:', this.modal);
        
        // Focus trap
        this.firstFocusable = this.modal.querySelector('.cfb-nav-item');
        this.lastFocusable = this.modal.querySelector('[data-action="confirm"]');
        
        this.bindEvents();
        console.log('[CloudFileBrowser] Events bound, scheduling loadFiles()');
        
        // Use double requestAnimationFrame to ensure modal is painted before loading
        // This provides instant perceived performance - modal appears immediately
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.loadFiles();
            });
        });
    }
    
    /**
     * Bind all event handlers
     */
    bindEvents() {
        // Close button
        this.modal.querySelector('[data-action="close"]').addEventListener('click', () => this.cancel());
        
        // Overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.cancel();
        });
        
        // Cancel button
        this.modal.querySelector('[data-action="cancel"]').addEventListener('click', () => this.cancel());
        
        // Confirm button
        this.modal.querySelector('[data-action="confirm"]').addEventListener('click', () => this.confirm());
        
        // New folder button (save mode)
        const newFolderBtn = this.modal.querySelector('[data-action="new-folder"]');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => this.createNewFolder());
        }
        
        // Sidebar navigation
        this.modal.querySelectorAll('.cfb-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const location = item.dataset.location;
                this.navigateToLocation(location);
            });
        });
        
        // Navigation buttons
        this.modal.querySelector('.cfb-nav-btn--back').addEventListener('click', () => this.goBack());
        this.modal.querySelector('.cfb-nav-btn--forward').addEventListener('click', () => this.goForward());
        
        // Column headers (sorting)
        this.modal.querySelectorAll('.cfb-col-header').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                this.handleSort(column);
            });
        });
        
        // Breadcrumb root
        this.modal.querySelector('.cfb-breadcrumb-item--root').addEventListener('click', () => {
            this.navigateToRoot();
        });
        
        // File list keyboard navigation
        const fileList = this.modal.querySelector('.cfb-files');
        fileList.addEventListener('keydown', (e) => this.handleFileListKeydown(e));
        
        // Filename input (save mode)
        const filenameInput = this.modal.querySelector('#cfb-filename');
        if (filenameInput) {
            filenameInput.addEventListener('input', () => this.updateConfirmButton());
            filenameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.confirm();
            });
        }
        
        // Sign-in button
        this.modal.querySelector('.cfb-signin-btn').addEventListener('click', () => this.handleSignIn());
        
        // Retry button
        this.modal.querySelector('.cfb-error-retry').addEventListener('click', () => this.loadFiles());
        
        // Global keyboard handlers
        document.addEventListener('keydown', this.handleGlobalKeydown);
    }
    
    /**
     * Handle global keyboard events
     */
    handleGlobalKeydown = (e) => {
        // Escape to close
        if (e.key === 'Escape') {
            this.cancel();
        }
        
        // Backspace to go up (when not in input)
        if (e.key === 'Backspace' && !this.isInputFocused()) {
            e.preventDefault();
            this.goUp();
        }
    };
    
    /**
     * Handle file list keyboard navigation
     */
    handleFileListKeydown(e) {
        const fileItems = this.modal.querySelectorAll('.cfb-file-item');
        if (fileItems.length === 0) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusedIndex = Math.min(this.focusedIndex + 1, fileItems.length - 1);
                this.updateFocus(fileItems);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
                this.updateFocus(fileItems);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.focusedIndex >= 0 && this.focusedIndex < fileItems.length) {
                    const item = fileItems[this.focusedIndex];
                    const fileId = item.dataset.id;
                    const file = this.files.find(f => f.id === fileId);
                    if (file) {
                        if (file.isFolder) {
                            this.navigateToFolder(file);
                        } else {
                            this.selectFile(file, item);
                            this.confirm();
                        }
                    }
                }
                break;
                
            case 'Home':
                e.preventDefault();
                this.focusedIndex = 0;
                this.updateFocus(fileItems);
                break;
                
            case 'End':
                e.preventDefault();
                this.focusedIndex = fileItems.length - 1;
                this.updateFocus(fileItems);
                break;
        }
    }
    
    /**
     * Update focus state for file items
     */
    updateFocus(fileItems) {
        fileItems.forEach((item, i) => {
            if (i === this.focusedIndex) {
                item.classList.add('cfb-file-item--focused');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('cfb-file-item--focused');
            }
        });
    }
    
    /**
     * Check if an input element is focused
     */
    isInputFocused() {
        const active = document.activeElement;
        return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
    }
    
    /**
     * Navigate to a sidebar location
     */
    navigateToLocation(location) {
        // Update sidebar active state
        this.modal.querySelectorAll('.cfb-nav-item').forEach(item => {
            item.classList.toggle('cfb-nav-item--active', item.dataset.location === location);
        });
        
        this.currentLocation = location;
        this.currentFolderId = null;
        this.navigationHistory = [];
        this.historyIndex = -1;
        this.selectedFile = null;
        
        this.updateBreadcrumb();
        this.updateSelection();
        this.loadFiles();
    }
    
    /**
     * Navigate to root
     */
    navigateToRoot() {
        this.currentFolderId = null;
        this.pushToHistory(null, this.getProviderName());
        this.selectedFile = null;
        this.updateBreadcrumb();
        this.updateSelection();
        this.loadFiles();
    }
    
    /**
     * Navigate to a folder
     */
    navigateToFolder(folder) {
        this.pushToHistory(folder.id, folder.name);
        this.currentFolderId = folder.id;
        this.selectedFile = null;
        this.focusedIndex = -1;
        
        // Save as last opened folder
        this.saveLastFolder(folder.id, folder.name);
        
        this.updateBreadcrumb();
        this.updateSelection();
        this.loadFiles();
    }
    
    /**
     * Push to navigation history
     */
    pushToHistory(folderId, name) {
        // Truncate forward history
        this.navigationHistory = this.navigationHistory.slice(0, this.historyIndex + 1);
        this.navigationHistory.push({ id: folderId, name });
        this.historyIndex = this.navigationHistory.length - 1;
        this.updateNavigationButtons();
    }
    
    /**
     * Go back in navigation history
     */
    goBack() {
        if (this.historyIndex <= 0) return;
        
        this.historyIndex--;
        const entry = this.navigationHistory[this.historyIndex];
        this.currentFolderId = entry.id;
        this.selectedFile = null;
        this.updateBreadcrumb();
        this.updateSelection();
        this.updateNavigationButtons();
        this.loadFiles();
    }
    
    /**
     * Go forward in navigation history
     */
    goForward() {
        if (this.historyIndex >= this.navigationHistory.length - 1) return;
        
        this.historyIndex++;
        const entry = this.navigationHistory[this.historyIndex];
        this.currentFolderId = entry.id;
        this.selectedFile = null;
        this.updateBreadcrumb();
        this.updateSelection();
        this.updateNavigationButtons();
        this.loadFiles();
    }
    
    /**
     * Go up to parent folder
     */
    goUp() {
        if (this.historyIndex > 0) {
            this.goBack();
        }
    }
    
    /**
     * Update navigation buttons state
     */
    updateNavigationButtons() {
        const backBtn = this.modal.querySelector('.cfb-nav-btn--back');
        const forwardBtn = this.modal.querySelector('.cfb-nav-btn--forward');
        
        backBtn.disabled = this.historyIndex <= 0;
        forwardBtn.disabled = this.historyIndex >= this.navigationHistory.length - 1;
    }
    
    /**
     * Update breadcrumb display
     */
    updateBreadcrumb() {
        const pathContainer = this.modal.querySelector('.cfb-breadcrumb-path');
        
        // Build breadcrumb segments
        let html = `
            <button class="cfb-breadcrumb-item cfb-breadcrumb-item--root" data-id="root">
                <i class="fa-solid fa-cloud"></i>
                <span>${this.getProviderName()}</span>
            </button>
        `;
        
        // Add history path
        for (let i = 1; i <= this.historyIndex; i++) {
            const entry = this.navigationHistory[i];
            const isLast = i === this.historyIndex;
            
            html += `
                <span class="cfb-breadcrumb-sep">
                    <i class="fa-solid fa-chevron-right"></i>
                </span>
                <button class="cfb-breadcrumb-item ${isLast ? 'cfb-breadcrumb-item--current' : ''}" 
                        data-id="${entry.id || ''}" 
                        data-index="${i}">
                    <span>${this.escapeHtml(entry.name)}</span>
                </button>
            `;
        }
        
        pathContainer.innerHTML = html;
        
        // Bind click handlers
        pathContainer.querySelector('.cfb-breadcrumb-item--root').addEventListener('click', () => {
            this.navigateToRoot();
        });
        
        pathContainer.querySelectorAll('.cfb-breadcrumb-item:not(.cfb-breadcrumb-item--root)').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index, 10);
                if (index < this.historyIndex) {
                    // Navigate back to that point
                    while (this.historyIndex > index) {
                        this.historyIndex--;
                    }
                    const entry = this.navigationHistory[this.historyIndex];
                    this.currentFolderId = entry.id;
                    this.selectedFile = null;
                    this.updateBreadcrumb();
                    this.updateSelection();
                    this.updateNavigationButtons();
                    this.loadFiles();
                }
            });
        });
    }
    
    /**
     * Handle column sorting
     */
    handleSort(column) {
        if (this.sortColumn === column) {
            // Toggle direction
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        // Update header UI
        this.modal.querySelectorAll('.cfb-col-header').forEach(header => {
            const isActive = header.dataset.sort === column;
            header.classList.toggle('cfb-col-header--active', isActive);
            
            const icon = header.querySelector('.cfb-sort-icon');
            if (icon) icon.remove();
            
            if (isActive) {
                const iconClass = this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
                header.insertAdjacentHTML('beforeend', `<i class="fa-solid ${iconClass} cfb-sort-icon"></i>`);
            }
        });
        
        this.renderFiles();
    }
    
    /**
     * Load files from current location
     */
    async loadFiles() {
        this.isLoading = true;
        this.updateLoadingState(`Connecting to ${this.getProviderName()}...`);
        
        try {
            const provider = this.cloudStorage.getProvider(this.provider);
            if (!provider) {
                throw new Error(`${this.getProviderName()} is not available. Please try again later.`);
            }
            
            // Check authentication
            if (!provider.isAuthenticated()) {
                this.showSignIn();
                return;
            }
            
            // Update loading message once we know we're authenticated
            this.updateLoadingState('Loading files...');
            
            let files = [];
            
            switch (this.currentLocation) {
                case 'recent':
                    files = this.loadRecentFiles();
                    break;
                    
                case 'shared':
                    // TODO: Implement shared files API
                    files = [];
                    break;
                    
                case 'my-files':
                default:
                    // On first load, try to open last folder or find Story folder
                    if (this.navigationHistory.length === 0 && this.currentFolderId === null) {
                        this.updateLoadingState('Finding Story folder...');
                        const targetFolder = await this.findInitialFolder(provider);
                        if (targetFolder) {
                            this.currentFolderId = targetFolder.id;
                            this.pushToHistory(null, this.getProviderName());
                            this.pushToHistory(targetFolder.id, targetFolder.name);
                            this.updateBreadcrumb();
                            this.updateNavigationButtons();
                        }
                    }
                    
                    this.updateLoadingState('Loading files...');
                    files = await provider.listFiles(this.currentFolderId);
                    
                    // Save current folder as last opened
                    if (this.currentFolderId) {
                        const currentEntry = this.navigationHistory[this.historyIndex];
                        if (currentEntry) {
                            this.saveLastFolder(currentEntry.id, currentEntry.name);
                        }
                    }
                    break;
            }
            
            this.files = Array.isArray(files) ? files : (files.files || []);
            
            // Initialize navigation history if empty
            if (this.navigationHistory.length === 0) {
                this.pushToHistory(null, this.getProviderName());
            }
            
            this.renderFiles();
            
        } catch (error) {
            console.error('Failed to load files:', error);
            
            if (error.message?.includes('Not authenticated') || error.message?.includes('auth')) {
                this.showSignIn();
            } else {
                this.showError(error.message);
            }
        } finally {
            this.isLoading = false;
            this.updateLoadingState();
        }
    }
    
    /**
     * Find the initial folder to open (last folder or Story folder)
     * @param {Object} provider
     * @returns {Promise<{id: string, name: string}|null>}
     */
    async findInitialFolder(provider) {
        // First, try to use last opened folder
        const lastFolder = this.loadLastFolder();
        if (lastFolder && lastFolder.id) {
            try {
                // Verify folder still exists by listing its contents
                await provider.listFiles(lastFolder.id);
                return lastFolder;
            } catch {
                // Folder no longer exists, clear saved folder
                localStorage.removeItem(`${STORAGE_KEYS.LAST_FOLDER}_${this.provider}`);
            }
        }
        
        // Otherwise, try to find or create Story folder
        try {
            const rootFiles = await provider.listFiles(null);
            const files = Array.isArray(rootFiles) ? rootFiles : (rootFiles.files || []);
            
            // Look for existing Story folder
            const storyFolder = files.find(f => 
                f.isFolder && f.name.toLowerCase() === STORY_FOLDER_NAME.toLowerCase()
            );
            
            if (storyFolder) {
                return { id: storyFolder.id, name: storyFolder.name };
            }
            
            // No Story folder found, stay at root
            return null;
        } catch {
            return null;
        }
    }
    
    /**
     * Render the file list
     */
    renderFiles() {
        const container = this.modal.querySelector('.cfb-files');
        const emptyState = this.modal.querySelector('.cfb-empty');
        
        // Filter files
        let filtered = [...this.files];
        
        // In open mode, only show .str files (and folders)
        if (this.mode === 'open') {
            filtered = filtered.filter(f => 
                f.isFolder || f.name.toLowerCase().endsWith('.str')
            );
        }
        
        // Sort files
        filtered = this.sortFiles(filtered);
        
        // Show empty state if no files
        if (filtered.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            
            // Update empty message based on context
            const emptyTitle = emptyState.querySelector('.cfb-empty-title');
            const emptyText = emptyState.querySelector('.cfb-empty-text');
            
            if (this.currentLocation === 'recent') {
                emptyTitle.textContent = 'No recent files';
                emptyText.textContent = 'Files you open will appear here.';
            } else if (this.currentLocation === 'shared') {
                emptyTitle.textContent = 'No shared files';
                emptyText.textContent = 'Files shared with you will appear here.';
            } else {
                emptyTitle.textContent = 'No files found';
                emptyText.textContent = this.mode === 'open' 
                    ? 'This folder contains no .story files.'
                    : 'This folder is empty.';
            }
            
            return;
        }
        
        emptyState.style.display = 'none';
        container.style.display = 'flex';
        
        // Render files
        container.innerHTML = filtered.map((file, index) => this.renderFileItem(file, index)).join('');
        
        // Bind click handlers
        container.querySelectorAll('.cfb-file-item').forEach(item => {
            const fileId = item.dataset.id;
            const file = this.files.find(f => f.id === fileId);
            
            if (!file) return;
            
            item.addEventListener('click', () => {
                if (file.isFolder) {
                    this.navigateToFolder(file);
                } else {
                    this.selectFile(file, item);
                }
            });
            
            item.addEventListener('dblclick', () => {
                if (file.isFolder) {
                    this.navigateToFolder(file);
                } else {
                    this.selectFile(file, item);
                    this.confirm();
                }
            });
        });
        
        // Reset focus index
        this.focusedIndex = -1;
    }
    
    /**
     * Sort files array
     */
    sortFiles(files) {
        return files.sort((a, b) => {
            // Folders always first
            if (a.isFolder && !b.isFolder) return -1;
            if (!a.isFolder && b.isFolder) return 1;
            
            let comparison = 0;
            
            switch (this.sortColumn) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'modified':
                    comparison = new Date(b.modified) - new Date(a.modified);
                    break;
                case 'size':
                    comparison = (a.size || 0) - (b.size || 0);
                    break;
            }
            
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
    }
    
    /**
     * Render a single file item
     */
    renderFileItem(file, index) {
        const isSelected = this.selectedFile?.id === file.id;
        const icon = this.getFileIcon(file);
        const modified = this.formatDate(file.modified);
        const size = file.isFolder ? '' : this.formatSize(file.size);
        
        return `
            <button class="cfb-file-item cfb-file-item--list ${file.isFolder ? 'cfb-file-item--folder' : ''} ${isSelected ? 'cfb-file-item--selected' : ''}"
                    data-id="${file.id}"
                    data-index="${index}"
                    role="option"
                    aria-selected="${isSelected}">
                <span class="cfb-file-icon">${icon}</span>
                <span class="cfb-file-name">${this.escapeHtml(file.name)}</span>
                <span class="cfb-file-modified">${modified}</span>
                <span class="cfb-file-size">${size}</span>
            </button>
        `;
    }
    
    /**
     * Get icon HTML for a file
     */
    getFileIcon(file) {
        if (file.isFolder) {
            return '<i class="fa-solid fa-folder cfb-icon--folder"></i>';
        }
        
        const ext = file.name.split('.').pop()?.toLowerCase();
        
        if (ext === 'str') {
            // Custom Story file icon
            return `<svg class="cfb-icon--str" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="var(--color-accent)"/>
                <path d="M8 8h8M8 12h8M8 16h5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            </svg>`;
        }
        
        // Generic file icon
        return '<i class="fa-regular fa-file cfb-icon--file"></i>';
    }
    
    /**
     * Select a file
     */
    selectFile(file, element) {
        // Deselect previous
        const prev = this.modal.querySelector('.cfb-file-item--selected');
        if (prev) {
            prev.classList.remove('cfb-file-item--selected');
            prev.setAttribute('aria-selected', 'false');
        }
        
        // Select new
        this.selectedFile = file;
        element.classList.add('cfb-file-item--selected');
        element.setAttribute('aria-selected', 'true');
        
        this.updateSelection();
    }
    
    /**
     * Update selection display
     */
    updateSelection() {
        const confirmBtn = this.modal.querySelector('[data-action="confirm"]');
        
        if (this.mode === 'open') {
            const selectionText = this.modal.querySelector('.cfb-selected-file');
            if (this.selectedFile) {
                selectionText.innerHTML = `Selected: <strong>${this.escapeHtml(this.selectedFile.name)}</strong>`;
                confirmBtn.disabled = false;
            } else {
                selectionText.textContent = 'No file selected';
                confirmBtn.disabled = true;
            }
        } else {
            this.updateConfirmButton();
        }
    }
    
    /**
     * Update confirm button state (save mode)
     */
    updateConfirmButton() {
        if (this.mode !== 'save') return;
        
        const input = this.modal.querySelector('#cfb-filename');
        const confirmBtn = this.modal.querySelector('[data-action="confirm"]');
        
        const filename = input.value.trim();
        confirmBtn.disabled = filename.length === 0;
    }
    
    /**
     * Update loading state UI
     * @param {string} [message] - Optional loading message
     */
    updateLoadingState(message) {
        const loading = this.modal.querySelector('.cfb-loading');
        const files = this.modal.querySelector('.cfb-files');
        const empty = this.modal.querySelector('.cfb-empty');
        const error = this.modal.querySelector('.cfb-error');
        const signin = this.modal.querySelector('.cfb-signin');
        
        if (this.isLoading) {
            loading.style.display = 'flex';
            files.style.display = 'none';
            empty.style.display = 'none';
            error.style.display = 'none';
            signin.style.display = 'none';
            
            // Update loading message if provided
            if (message) {
                const loadingText = loading.querySelector('.cfb-loading-text');
                if (loadingText) {
                    loadingText.textContent = message;
                }
            }
        } else {
            loading.style.display = 'none';
        }
    }
    
    /**
     * Show sign-in state
     */
    showSignIn() {
        this.isLoading = false;
        
        const loading = this.modal.querySelector('.cfb-loading');
        const files = this.modal.querySelector('.cfb-files');
        const empty = this.modal.querySelector('.cfb-empty');
        const error = this.modal.querySelector('.cfb-error');
        const signin = this.modal.querySelector('.cfb-signin');
        
        loading.style.display = 'none';
        files.style.display = 'none';
        empty.style.display = 'none';
        error.style.display = 'none';
        signin.style.display = 'flex';
    }
    
    /**
     * Show error state
     */
    showError(message) {
        this.isLoading = false;
        
        const loading = this.modal.querySelector('.cfb-loading');
        const files = this.modal.querySelector('.cfb-files');
        const empty = this.modal.querySelector('.cfb-empty');
        const error = this.modal.querySelector('.cfb-error');
        const signin = this.modal.querySelector('.cfb-signin');
        
        loading.style.display = 'none';
        files.style.display = 'none';
        empty.style.display = 'none';
        signin.style.display = 'none';
        error.style.display = 'flex';
        
        if (message) {
            error.querySelector('.cfb-error-text').textContent = message;
        }
    }
    
    /**
     * Handle sign-in button click
     */
    async handleSignIn() {
        const btn = this.modal.querySelector('.cfb-signin-btn');
        btn.disabled = true;
        btn.classList.add('cfb-signin-btn--loading');
        
        try {
            // Store pending action before OAuth redirect
            // This will be resumed after successful authentication
            CloudFileBrowser.storePendingAction({
                provider: this.provider,
                mode: this.mode,
                suggestedName: this.suggestedName
            });
            
            const provider = this.cloudStorage.getProvider(this.provider);
            await provider.authenticate();
            
            // Note: If we reach here, authentication didn't require a redirect
            // (e.g., token was cached). Clear the pending action and load files.
            CloudFileBrowser.clearPendingAction();
            this.loadFiles();
        } catch (error) {
            console.error('Sign-in failed:', error);
            CloudFileBrowser.clearPendingAction();
            btn.disabled = false;
            btn.classList.remove('cfb-signin-btn--loading');
            
            // Show error message
            let errorEl = this.modal.querySelector('.cfb-signin-error');
            if (!errorEl) {
                errorEl = document.createElement('p');
                errorEl.className = 'cfb-signin-error';
                btn.parentNode.appendChild(errorEl);
            }
            errorEl.textContent = 'Sign-in failed. Please try again.';
        }
    }
    
    /**
     * Store a pending cloud action to resume after authentication
     * @param {Object} action - Action to store
     * @param {string} action.provider - Cloud provider ID
     * @param {string} action.mode - Browser mode ('open' or 'save')
     * @param {string} [action.suggestedName] - Suggested filename for save mode
     */
    static storePendingAction(action) {
        try {
            sessionStorage.setItem(STORAGE_KEYS.PENDING_ACTION, JSON.stringify({
                ...action,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('Failed to store pending action:', e);
        }
    }
    
    /**
     * Get and clear any pending cloud action
     * @returns {Object|null} Pending action or null
     */
    static getPendingAction() {
        try {
            const data = sessionStorage.getItem(STORAGE_KEYS.PENDING_ACTION);
            if (!data) return null;
            
            const action = JSON.parse(data);
            
            // Expire after 5 minutes
            if (Date.now() - action.timestamp > 5 * 60 * 1000) {
                CloudFileBrowser.clearPendingAction();
                return null;
            }
            
            return action;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Clear pending action
     */
    static clearPendingAction() {
        try {
            sessionStorage.removeItem(STORAGE_KEYS.PENDING_ACTION);
        } catch (e) {
            // Ignore
        }
    }
    
    /**
     * Resume pending cloud action after authentication
     * Call this from app initialization after auth boot
     * @returns {Promise<Object|null>} Result from CloudFileBrowser or null if no pending action
     */
    static async resumePendingAction() {
        const action = CloudFileBrowser.getPendingAction();
        if (!action) return null;
        
        // Clear the pending action
        CloudFileBrowser.clearPendingAction();
        
        // Show the cloud file browser with the stored options
        return CloudFileBrowser.show({
            provider: action.provider,
            mode: action.mode,
            suggestedName: action.suggestedName
        });
    }
    
    /**
     * Create new folder
     */
    async createNewFolder() {
        const folderName = prompt('Enter folder name:', 'New Folder');
        if (!folderName?.trim()) return;
        
        try {
            const provider = this.cloudStorage.getProvider(this.provider);
            // TODO: Implement createFolder in provider
            // await provider.createFolder(this.currentFolderId, folderName.trim());
            
            alert('Create folder functionality coming soon!');
            // this.loadFiles();
        } catch (error) {
            console.error('Failed to create folder:', error);
            alert('Failed to create folder. Please try again.');
        }
    }
    
    /**
     * Confirm selection
     */
    confirm() {
        if (this.mode === 'open') {
            if (!this.selectedFile) return;
            
            // Add to recent files
            this.addToRecentFiles(this.selectedFile);
            
            this.close();
            this.onSelect({
                file: this.selectedFile,
                provider: this.provider
            });
        } else {
            const input = this.modal.querySelector('#cfb-filename');
            const filename = input.value.trim();
            
            if (!filename) return;
            
            this.close();
            this.onSelect({
                filename: filename + '.str',
                folderId: this.currentFolderId,
                provider: this.provider
            });
        }
    }
    
    /**
     * Cancel and close
     */
    cancel() {
        console.log('[CloudFileBrowser] cancel() called');
        this.close();
        this.onCancel();
    }
    
    /**
     * Close the modal
     */
    close() {
        console.log('[CloudFileBrowser] close() called');
        document.removeEventListener('keydown', this.handleGlobalKeydown);
        
        if (this.overlay) {
            this.overlay.classList.add('cfb-overlay--closing');
            setTimeout(() => {
                if (this.overlay) {
                    this.overlay.remove();
                    this.overlay = null;
                    this.modal = null;
                    console.log('[CloudFileBrowser] Modal removed from DOM');
                }
            }, 150);
        }
    }
    
    /**
     * Format date for display
     */
    formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return d.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric',
            year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
    
    /**
     * Format file size for display
     */
    formatSize(bytes) {
        if (!bytes || bytes === 0) return '';
        
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
    }
    
    /**
     * Escape HTML special characters
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    /**
     * Static method to show browser and return promise
     */
    static show(options) {
        console.log('[CloudFileBrowser] show() called with options:', options);
        return new Promise((resolve) => {
            console.log('[CloudFileBrowser] Creating new CloudFileBrowser instance');
            new CloudFileBrowser({
                ...options,
                onSelect: (result) => {
                    console.log('[CloudFileBrowser] onSelect called with:', result);
                    resolve(result);
                },
                onCancel: () => {
                    console.log('[CloudFileBrowser] onCancel called');
                    resolve(null);
                }
            });
        });
    }
}

export default CloudFileBrowser;
