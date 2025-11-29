/**
 * FileIndicatorMenu - Dropdown menu from file indicator pill
 * 
 * Shows file information and actions:
 * - File name (header)
 * - Path/location
 * - Last saved time
 * - Access status
 * - Actions: Rename, Move, Copy, Share, Version History
 */

import { ProviderIcon } from './ProviderIcon.js';

export class FileIndicatorMenu {
    /**
     * Create file indicator menu
     * @param {Object} options
     * @param {Object} options.fileState - Current file state
     * @param {Object} options.position - Menu position { top, left }
     * @param {Function} options.onClose - Close callback
     * @param {Function} options.onAction - Action callback
     */
    constructor(options) {
        this.fileState = options.fileState;
        this.position = options.position;
        this.onClose = options.onClose;
        this.onAction = options.onAction;
        
        /** @type {HTMLElement} */
        this.element = null;
        
        this.create();
    }
    
    create() {
        this.element = document.createElement('div');
        this.element.className = 'file-indicator-menu';
        this.element.setAttribute('role', 'menu');
        this.element.setAttribute('aria-label', 'File options');
        
        // Position
        this.element.style.position = 'fixed';
        this.element.style.top = `${this.position.top}px`;
        this.element.style.left = `${this.position.left}px`;
        this.element.style.zIndex = 'var(--z-dropdown, 1000)';
        
        this.render();
        document.body.appendChild(this.element);
        
        // Focus first item
        requestAnimationFrame(() => {
            const firstItem = this.element.querySelector('[role="menuitem"]:not([aria-disabled="true"])');
            if (firstItem) firstItem.focus();
        });
    }
    
    render() {
        const { fileName, provider, path, lastSaved, accessLevel, ownerEmail, sharedCount } = this.fileState;
        
        let html = '';
        
        // Header - File name
        html += `<div class="file-indicator-menu__header">${this.escapeHtml(fileName)}</div>`;
        
        // Divider
        html += '<div class="file-indicator-menu__divider"></div>';
        
        // Info section
        // Path/location
        if (path || provider !== 'unsaved') {
            const providerName = ProviderIcon.getName(provider);
            const displayPath = path || providerName;
            html += `
                <div class="file-indicator-menu__info">
                    <span class="file-indicator-menu__info-icon"><i class="fa-solid fa-location-dot"></i></span>
                    <span class="file-indicator-menu__info-text">${this.escapeHtml(displayPath)}</span>
                </div>
            `;
        }
        
        // Last saved
        if (lastSaved) {
            const timeAgo = this.formatTimeAgo(lastSaved);
            html += `
                <div class="file-indicator-menu__info">
                    <span class="file-indicator-menu__info-icon"><i class="fa-regular fa-floppy-disk"></i></span>
                    <span class="file-indicator-menu__info-text">Saved ${timeAgo}</span>
                </div>
            `;
        } else if (provider === 'unsaved') {
            html += `
                <div class="file-indicator-menu__info file-indicator-menu__info--muted">
                    <span class="file-indicator-menu__info-icon"><i class="fa-regular fa-floppy-disk"></i></span>
                    <span class="file-indicator-menu__info-text">Not saved yet</span>
                </div>
            `;
        }
        
        // Access level
        if (accessLevel && accessLevel !== 'none') {
            let accessText = '';
            let accessIcon = '';
            
            if (accessLevel === 'account-locked') {
                accessIcon = 'fa-solid fa-lock';
                accessText = ownerEmail ? `Account locked (${ownerEmail})` : 'Account locked (only you)';
            } else if (accessLevel === 'shared') {
                accessIcon = 'fa-solid fa-user-lock';
                accessText = sharedCount > 0 ? `Shared with ${sharedCount} people` : 'Shared';
            } else if (accessLevel === 'public') {
                accessIcon = 'fa-solid fa-globe';
                accessText = 'Public (anyone with link)';
            }
            
            html += `
                <div class="file-indicator-menu__info">
                    <span class="file-indicator-menu__info-icon"><i class="${accessIcon}"></i></span>
                    <span class="file-indicator-menu__info-text">${this.escapeHtml(accessText)}</span>
                </div>
            `;
        }
        
        // Divider before actions
        html += '<div class="file-indicator-menu__divider"></div>';
        
        // Action items
        const isCloudFile = provider === 'onedrive' || provider === 'google-drive';
        const isSaved = provider !== 'unsaved';
        
        // Rename
        html += this.createMenuItem('rename', 'Rename...', 'fa-solid fa-pen', !isSaved);
        
        // Move to (cloud only)
        if (isCloudFile) {
            html += this.createMenuItem('move', 'Move to...', 'fa-solid fa-folder-arrow-right');
        }
        
        // Make a Copy
        html += this.createMenuItem('make-copy', 'Make a Copy...', 'fa-regular fa-copy', !isSaved);
        
        // Share Settings (cloud only, account-locked or shared)
        if (isCloudFile && (accessLevel === 'account-locked' || accessLevel === 'shared')) {
            html += '<div class="file-indicator-menu__divider"></div>';
            html += this.createMenuItem('share-settings', 'Share Settings...', 'fa-solid fa-user-plus');
        }
        
        // Version History (cloud only)
        if (isCloudFile) {
            if (accessLevel !== 'account-locked' && accessLevel !== 'shared') {
                html += '<div class="file-indicator-menu__divider"></div>';
            }
            html += this.createMenuItem('version-history', 'Version History', 'fa-solid fa-clock-rotate-left');
        }
        
        this.element.innerHTML = html;
        
        // Bind action clicks
        this.element.querySelectorAll('.file-indicator-menu__item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = item.dataset.action;
                if (action && !item.hasAttribute('aria-disabled')) {
                    this.onAction(action);
                }
            });
            
            // Keyboard navigation
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const action = item.dataset.action;
                    if (action && !item.hasAttribute('aria-disabled')) {
                        this.onAction(action);
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.focusNextItem(item);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.focusPrevItem(item);
                }
            });
        });
    }
    
    /**
     * Create a menu item HTML
     * @param {string} action
     * @param {string} label
     * @param {string} icon
     * @param {boolean} disabled
     * @returns {string}
     */
    createMenuItem(action, label, icon, disabled = false) {
        const disabledAttr = disabled ? 'aria-disabled="true"' : '';
        const disabledClass = disabled ? 'file-indicator-menu__item--disabled' : '';
        
        return `
            <button class="file-indicator-menu__item ${disabledClass}" 
                    role="menuitem" 
                    data-action="${action}"
                    ${disabledAttr}
                    tabindex="${disabled ? '-1' : '0'}">
                <span class="file-indicator-menu__item-icon"><i class="${icon}"></i></span>
                <span class="file-indicator-menu__item-label">${label}</span>
            </button>
        `;
    }
    
    /**
     * Focus next menu item
     * @param {HTMLElement} current
     */
    focusNextItem(current) {
        const items = Array.from(this.element.querySelectorAll('.file-indicator-menu__item:not([aria-disabled="true"])'));
        const index = items.indexOf(current);
        const next = items[index + 1] || items[0];
        if (next) next.focus();
    }
    
    /**
     * Focus previous menu item
     * @param {HTMLElement} current
     */
    focusPrevItem(current) {
        const items = Array.from(this.element.querySelectorAll('.file-indicator-menu__item:not([aria-disabled="true"])'));
        const index = items.indexOf(current);
        const prev = items[index - 1] || items[items.length - 1];
        if (prev) prev.focus();
    }
    
    /**
     * Format time ago string
     * @param {Date|string} date
     * @returns {string}
     */
    formatTimeAgo(date) {
        const now = new Date();
        const then = new Date(date);
        const diffMs = now - then;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSecs < 10) return 'just now';
        if (diffSecs < 60) return `${diffSecs} seconds ago`;
        if (diffMins === 1) return '1 minute ago';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours === 1) return '1 hour ago';
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return then.toLocaleDateString();
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
     * Destroy the menu
     */
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

export default FileIndicatorMenu;
