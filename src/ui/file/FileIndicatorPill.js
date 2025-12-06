/**
 * FileIndicatorPill - Floating filename indicator
 * 
 * Displays the current file's name, source (cloud/local), 
 * save status, and access level in the top-left corner.
 * 
 * States:
 * - unsaved: New file, not yet saved
 * - saved: All changes saved
 * - saving: Currently saving
 * - error: Save failed
 * - offline: Cloud file, offline mode
 */

import { ProviderIcon } from './ProviderIcon.js';
import { FileIndicatorMenu } from './FileIndicatorMenu.js';
import { fileService } from '../services/FileService.js';
import { EventEmitter } from '../../core/Events.js';

/**
 * @typedef {'account-locked' | 'shared' | 'public' | 'none'} AccessLevel
 * @typedef {'saved' | 'unsaved' | 'saving' | 'error' | 'offline'} SaveStatus
 * @typedef {'onedrive' | 'google-drive' | 'local' | 'unsaved'} ProviderType
 */

export class FileIndicatorPill extends EventEmitter {
    /**
     * @param {HTMLElement|string} container - Container element or ID
     */
    constructor(container) {
        super();
        
        /** @type {HTMLElement} */
        this.container = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
        
        /** @type {HTMLElement} */
        this.element = null;
        
        /** @type {FileIndicatorMenu} */
        this.menu = null;
        
        /** @type {boolean} */
        this.isMenuOpen = false;
        
        // Current file state
        this.state = {
            /** @type {string} */
            fileName: 'Untitled',
            /** @type {ProviderType} */
            provider: 'unsaved',
            /** @type {SaveStatus} */
            status: 'unsaved',
            /** @type {AccessLevel} */
            accessLevel: 'none',
            /** @type {string|null} */
            path: null,
            /** @type {Date|null} */
            lastSaved: null,
            /** @type {number} */
            sharedCount: 0,
            /** @type {string|null} */
            ownerEmail: null
        };
        
        this.init();
    }
    
    init() {
        this.createElement();
        this.bindEvents();
        this.subscribeToFileService();
        
        // Initial theme check
        const theme = localStorage.getItem('themeMode') || localStorage.getItem('theme');
        if (theme === 'light') {
            this.element.style.setProperty('background-color', '#FFFFFF', 'important');
        }
        
        // Listen for theme changes
        window.addEventListener('theme-changed', (e) => {
            if (e.detail.theme === 'light') {
                this.element.style.setProperty('transition', 'none', 'important');
                this.element.style.setProperty('background-color', '#FFFFFF', 'important');
            } else {
                this.element.style.removeProperty('background-color');
                this.element.style.removeProperty('transition');
            }
        });
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'file-indicator';
        this.element.setAttribute('role', 'button');
        this.element.setAttribute('tabindex', '0');
        this.element.setAttribute('aria-haspopup', 'true');
        this.element.setAttribute('aria-expanded', 'false');
        this.element.setAttribute('aria-label', 'File options');
        
        this.render();
        
        // Insert into DOM - append to container or body
        if (this.container) {
            this.container.appendChild(this.element);
        } else {
            document.body.appendChild(this.element);
        }
    }
    
    render() {
        const { fileName, provider, status, accessLevel } = this.state;
        
        // Build HTML
        let html = '';
        
        // Source icon
        const iconContainer = document.createElement('span');
        iconContainer.className = 'file-indicator__source-icon';
        const icon = ProviderIcon.create(provider, 'md');
        iconContainer.appendChild(icon);
        
        // File name
        const nameSpan = `<span class="file-indicator__name" title="${this.escapeHtml(fileName)}">${this.escapeHtml(this.truncateFileName(fileName))}</span>`;
        
        // Status indicator
        let statusHtml = '';
        if (status === 'unsaved') {
            statusHtml = '<span class="file-indicator__status file-indicator__status--dot" title="Unsaved changes"></span>';
        } else if (status === 'saving') {
            statusHtml = '<span class="file-indicator__status file-indicator__status--spinner" title="Saving..."></span>';
        } else if (status === 'error') {
            statusHtml = '<span class="file-indicator__status file-indicator__status--error" title="Save failed"><i class="fa-solid fa-exclamation-circle"></i></span>';
        } else if (status === 'offline') {
            statusHtml = '<span class="file-indicator__status file-indicator__status--warning" title="Offline - changes queued"><i class="fa-solid fa-cloud-slash"></i></span>';
        }
        
        // Lock/access icon
        let lockHtml = '';
        if (accessLevel === 'account-locked') {
            lockHtml = '<span class="file-indicator__lock file-indicator__lock--owned" title="Account-locked (only you)"><i class="fa-solid fa-lock"></i></span>';
        } else if (accessLevel === 'shared') {
            const tooltip = this.state.sharedCount > 0 
                ? `Shared with ${this.state.sharedCount} people` 
                : 'Shared';
            lockHtml = `<span class="file-indicator__lock" title="${tooltip}"><i class="fa-solid fa-user-lock"></i></span>`;
        } else if (accessLevel === 'public') {
            lockHtml = '<span class="file-indicator__lock file-indicator__lock--public" title="Public (anyone with link)"><i class="fa-solid fa-globe"></i></span>';
        }
        
        // Chevron for dropdown
        const chevronHtml = `
            <svg class="file-indicator__chevron" width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        this.element.innerHTML = nameSpan + statusHtml + lockHtml + chevronHtml;
        this.element.insertBefore(iconContainer, this.element.firstChild);
    }
    
    bindEvents() {
        // Click to toggle menu
        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });
        
        // Keyboard navigation
        this.element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.openMenu();
            }
        });
        
        // Close menu on outside click
        document.addEventListener('mousedown', (e) => {
            if (this.isMenuOpen && 
                !this.element.contains(e.target) &&
                this.menu && !this.menu.element.contains(e.target)) {
                this.closeMenu();
            }
        });
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMenu();
                this.element.focus();
            }
        });
    }
    
    subscribeToFileService() {
        // File changed (opened/saved/new)
        fileService.on('file-changed', ({ name, handle, provider, accessLevel }) => {
            this.updateState({
                fileName: name || 'Untitled',
                provider: provider || (handle ? 'local' : 'unsaved'),
                status: handle ? 'saved' : 'unsaved',
                accessLevel: accessLevel || 'none'
            });
        });
        
        // File saved
        fileService.on('file-saved', ({ name }) => {
            this.updateState({
                fileName: name,
                status: 'saved',
                lastSaved: new Date()
            });
        });
        
        // Dirty state changed
        fileService.on('dirty-state-changed', (isDirty) => {
            if (this.state.status !== 'saving' && this.state.status !== 'error') {
                this.updateState({
                    status: isDirty ? 'unsaved' : 'saved'
                });
            }
        });
        
        // Cloud file info updated
        fileService.on('cloud-file-info', (info) => {
            if (info) {
                this.updateState({
                    provider: info.provider,
                    path: info.path,
                    accessLevel: info.accessLevel || 'none',
                    ownerEmail: info.ownerEmail
                });
            }
        });
    }
    
    /**
     * Update state and re-render
     * @param {Partial<typeof this.state>} updates
     */
    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.render();
        this.emit('state-changed', this.state);
    }
    
    /**
     * Set saving state
     */
    setSaving() {
        this.updateState({ status: 'saving' });
    }
    
    /**
     * Set save error state
     */
    setSaveError() {
        this.updateState({ status: 'error' });
    }
    
    /**
     * Set offline state
     */
    setOffline() {
        if (this.state.provider !== 'local' && this.state.provider !== 'unsaved') {
            this.updateState({ status: 'offline' });
        }
    }
    
    /**
     * Set online and trigger sync
     */
    setOnline() {
        if (this.state.status === 'offline') {
            this.updateState({ status: 'unsaved' });
            this.emit('sync-requested');
        }
    }
    
    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        if (this.isMenuOpen) return;
        this.isMenuOpen = true;
        
        this.element.classList.add('active');
        this.element.setAttribute('aria-expanded', 'true');
        
        // Get position for menu
        const rect = this.element.getBoundingClientRect();
        
        // Create menu
        this.menu = new FileIndicatorMenu({
            fileState: this.state,
            position: {
                top: rect.bottom + 4,
                left: rect.left
            },
            onClose: () => this.closeMenu(),
            onAction: (action) => this.handleMenuAction(action)
        });
    }
    
    closeMenu() {
        if (!this.isMenuOpen) return;
        this.isMenuOpen = false;
        
        this.element.classList.remove('active');
        this.element.setAttribute('aria-expanded', 'false');
        
        if (this.menu) {
            this.menu.destroy();
            this.menu = null;
        }
    }
    
    /**
     * Handle menu action
     * @param {string} action
     */
    handleMenuAction(action) {
        this.closeMenu();
        
        // Emit action event for FileService to handle
        this.emit('action', action);
        
        // Dispatch global event
        window.dispatchEvent(new CustomEvent('story:file-action', {
            detail: { action }
        }));
    }
    
    /**
     * Truncate file name if too long
     * @param {string} name
     * @param {number} maxLength
     * @returns {string}
     */
    truncateFileName(name, maxLength = 30) {
        if (!name || name.length <= maxLength) return name;
        
        const ext = name.lastIndexOf('.');
        if (ext > 0) {
            const baseName = name.substring(0, ext);
            const extension = name.substring(ext);
            const availableLength = maxLength - extension.length - 3; // 3 for "..."
            if (availableLength > 0) {
                return baseName.substring(0, availableLength) + '...' + extension;
            }
        }
        
        return name.substring(0, maxLength - 3) + '...';
    }
    
    /**
     * Escape HTML special characters
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
     * Show the indicator (if hidden)
     */
    show() {
        this.element.classList.remove('hidden');
    }
    
    /**
     * Hide the indicator
     */
    hide() {
        this.element.classList.add('hidden');
    }
    
    /**
     * Destroy the component
     */
    destroy() {
        this.closeMenu();
        if (this.element) {
            this.element.remove();
        }
    }
}

export default FileIndicatorPill;
