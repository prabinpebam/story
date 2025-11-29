/**
 * AccessSettingsModal - Manage file access and sharing
 * 
 * Allows users to change access level and manage shared users.
 */

import { ProviderIcon } from './ProviderIcon.js';
import { authService } from '../../core/auth/index.js';

export class AccessSettingsModal {
    /**
     * Create access settings modal
     * @param {Object} options
     * @param {Object} options.file - File info
     * @param {string} options.file.name - File name
     * @param {string} options.file.provider - Cloud provider
     * @param {'account-locked' | 'public'} options.file.accessLevel - Current access level
     * @param {Array<{email: string, name: string, role: string}>} options.file.sharedWith - Users with access
     * @param {Function} options.onChange - Called when access settings change
     * @param {Function} options.onClose - Called when modal closes
     */
    constructor(options) {
        this.file = options.file || {};
        this.onChange = options.onChange || (() => {});
        this.onClose = options.onClose || (() => {});
        
        this.accessLevel = this.file.accessLevel || 'account-locked';
        this.sharedWith = [...(this.file.sharedWith || [])];
        
        /** @type {HTMLElement} */
        this.overlay = null;
        
        /** @type {HTMLElement} */
        this.modal = null;
        
        this.create();
    }
    
    create() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'access-settings-overlay';
        
        this.modal = document.createElement('div');
        this.modal.className = 'access-settings-modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'access-settings-title');
        
        const currentUser = authService.getCurrentUser();
        const providerName = ProviderIcon.getName(this.file.provider);
        
        this.modal.innerHTML = `
            <div class="access-settings__header">
                <h2 id="access-settings-title" class="access-settings__title">
                    <i class="fa-solid fa-shield-halved"></i>
                    Access Settings
                </h2>
                <button class="access-settings__close" aria-label="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <div class="access-settings__content">
                <div class="access-settings__file-info">
                    <div class="access-settings__file-icon"></div>
                    <div class="access-settings__file-details">
                        <div class="access-settings__file-name">${this.escapeHtml(this.file.name || 'Untitled.str')}</div>
                        <div class="access-settings__file-location">
                            Stored in ${providerName}
                        </div>
                    </div>
                </div>
                
                <div class="access-settings__section">
                    <h3 class="access-settings__section-title">General Access</h3>
                    
                    <div class="access-settings__access-options">
                        <label class="access-settings__option ${this.accessLevel === 'account-locked' ? 'access-settings__option--selected' : ''}">
                            <input type="radio" 
                                   name="access-level" 
                                   value="account-locked" 
                                   class="access-settings__radio"
                                   ${this.accessLevel === 'account-locked' ? 'checked' : ''}>
                            <div class="access-settings__option-icon">
                                <i class="fa-solid fa-lock"></i>
                            </div>
                            <div class="access-settings__option-content">
                                <div class="access-settings__option-title">Account-locked</div>
                                <div class="access-settings__option-desc">
                                    Only you (${currentUser?.email || 'your account'}) can access
                                </div>
                            </div>
                        </label>
                        
                        <label class="access-settings__option ${this.accessLevel === 'public' ? 'access-settings__option--selected' : ''}">
                            <input type="radio" 
                                   name="access-level" 
                                   value="public" 
                                   class="access-settings__radio"
                                   ${this.accessLevel === 'public' ? 'checked' : ''}>
                            <div class="access-settings__option-icon">
                                <i class="fa-solid fa-globe"></i>
                            </div>
                            <div class="access-settings__option-content">
                                <div class="access-settings__option-title">Public</div>
                                <div class="access-settings__option-desc">
                                    Anyone with the link can view
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
                
                ${this.accessLevel === 'public' ? this.renderShareSection() : ''}
                
                <div class="access-settings__section">
                    <h3 class="access-settings__section-title">Link</h3>
                    <div class="access-settings__link-row">
                        <input type="text" 
                               class="access-settings__link-input" 
                               value="${this.getShareLink()}" 
                               readonly>
                        <button class="access-settings__copy-btn" title="Copy link">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="access-settings__footer">
                <button class="access-settings__btn access-settings__btn--primary" data-action="done">
                    Done
                </button>
            </div>
        `;
        
        // Render provider icon
        const iconContainer = this.modal.querySelector('.access-settings__file-icon');
        const providerIcon = new ProviderIcon(this.file.provider, 24);
        providerIcon.render(iconContainer);
        
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
        
        this.bindEvents();
    }
    
    /**
     * Render share section
     * @returns {string}
     */
    renderShareSection() {
        return `
            <div class="access-settings__section access-settings__share-section">
                <h3 class="access-settings__section-title">
                    People with access
                    <span class="access-settings__count">${this.sharedWith.length}</span>
                </h3>
                
                ${this.sharedWith.length > 0 ? `
                    <div class="access-settings__people-list">
                        ${this.sharedWith.map(user => this.renderUserRow(user)).join('')}
                    </div>
                ` : `
                    <div class="access-settings__people-empty">
                        <i class="fa-regular fa-user"></i>
                        <span>No one else has access</span>
                    </div>
                `}
                
                <div class="access-settings__invite">
                    <input type="email" 
                           class="access-settings__invite-input" 
                           placeholder="Add people by email">
                    <button class="access-settings__invite-btn" disabled>
                        <i class="fa-solid fa-plus"></i>
                        Invite
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render user row
     * @param {Object} user
     * @returns {string}
     */
    renderUserRow(user) {
        const initials = this.getInitials(user.name || user.email);
        const isOwner = user.role === 'owner';
        
        return `
            <div class="access-settings__person" data-email="${this.escapeHtml(user.email)}">
                <div class="access-settings__person-avatar" style="background-color: ${this.getAvatarColor(user.email)}">
                    ${initials}
                </div>
                <div class="access-settings__person-info">
                    <div class="access-settings__person-name">${this.escapeHtml(user.name || user.email)}</div>
                    <div class="access-settings__person-email">${this.escapeHtml(user.email)}</div>
                </div>
                <div class="access-settings__person-role">
                    ${isOwner ? `
                        <span class="access-settings__owner-badge">Owner</span>
                    ` : `
                        <select class="access-settings__role-select">
                            <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                            <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Editor</option>
                        </select>
                        <button class="access-settings__remove-btn" title="Remove access">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    `}
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        // Close button
        this.modal.querySelector('.access-settings__close').addEventListener('click', () => {
            this.close();
        });
        
        // Overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Access level change
        this.modal.querySelectorAll('input[name="access-level"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const newLevel = e.target.value;
                this.updateAccessLevel(newLevel);
            });
        });
        
        // Copy link button
        const copyBtn = this.modal.querySelector('.access-settings__copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyLink();
            });
        }
        
        // Invite input
        this.bindInviteEvents();
        
        // Done button
        this.modal.querySelector('[data-action="done"]').addEventListener('click', () => {
            this.close();
        });
        
        // Escape key
        document.addEventListener('keydown', this.handleKeyDown);
    }
    
    /**
     * Bind invite-related events
     */
    bindInviteEvents() {
        const inviteInput = this.modal.querySelector('.access-settings__invite-input');
        const inviteBtn = this.modal.querySelector('.access-settings__invite-btn');
        
        if (!inviteInput) return;
        
        inviteInput.addEventListener('input', () => {
            const email = inviteInput.value.trim();
            const isValid = this.isValidEmail(email);
            inviteBtn.disabled = !isValid;
        });
        
        inviteInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.inviteUser();
            }
        });
        
        inviteBtn.addEventListener('click', () => {
            this.inviteUser();
        });
        
        // Remove user buttons
        this.modal.querySelectorAll('.access-settings__remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const personRow = e.target.closest('.access-settings__person');
                const email = personRow.dataset.email;
                this.removeUser(email);
            });
        });
        
        // Role change selects
        this.modal.querySelectorAll('.access-settings__role-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const personRow = e.target.closest('.access-settings__person');
                const email = personRow.dataset.email;
                const role = e.target.value;
                this.updateUserRole(email, role);
            });
        });
    }
    
    handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            this.close();
        }
    };
    
    /**
     * Update access level
     * @param {'account-locked' | 'public'} level
     */
    updateAccessLevel(level) {
        this.accessLevel = level;
        
        // Update visual selection
        this.modal.querySelectorAll('.access-settings__option').forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            option.classList.toggle('access-settings__option--selected', radio.checked);
        });
        
        // Show/hide share section
        const shareSection = this.modal.querySelector('.access-settings__share-section');
        if (level === 'public' && !shareSection) {
            // Insert share section
            const content = this.modal.querySelector('.access-settings__content');
            const linkSection = this.modal.querySelector('.access-settings__section:last-of-type');
            const shareHtml = this.renderShareSection();
            linkSection.insertAdjacentHTML('beforebegin', shareHtml);
            this.bindInviteEvents();
        } else if (level === 'account-locked' && shareSection) {
            // Remove share section
            shareSection.remove();
        }
        
        this.notifyChange();
    }
    
    /**
     * Invite user
     */
    inviteUser() {
        const inviteInput = this.modal.querySelector('.access-settings__invite-input');
        const email = inviteInput.value.trim();
        
        if (!this.isValidEmail(email)) return;
        
        // Check if already added
        if (this.sharedWith.find(u => u.email === email)) {
            inviteInput.value = '';
            return;
        }
        
        // Add user
        this.sharedWith.push({
            email,
            name: email.split('@')[0],
            role: 'viewer'
        });
        
        // Update list
        const peopleList = this.modal.querySelector('.access-settings__people-list');
        const emptyState = this.modal.querySelector('.access-settings__people-empty');
        
        if (emptyState) {
            emptyState.remove();
            const list = document.createElement('div');
            list.className = 'access-settings__people-list';
            list.innerHTML = this.renderUserRow(this.sharedWith[this.sharedWith.length - 1]);
            this.modal.querySelector('.access-settings__invite').insertAdjacentElement('beforebegin', list);
        } else if (peopleList) {
            peopleList.insertAdjacentHTML('beforeend', this.renderUserRow(this.sharedWith[this.sharedWith.length - 1]));
        }
        
        // Update count
        const count = this.modal.querySelector('.access-settings__count');
        if (count) count.textContent = this.sharedWith.length;
        
        // Clear input
        inviteInput.value = '';
        this.modal.querySelector('.access-settings__invite-btn').disabled = true;
        
        // Bind events for new row
        this.bindInviteEvents();
        
        this.notifyChange();
    }
    
    /**
     * Remove user
     * @param {string} email
     */
    removeUser(email) {
        const index = this.sharedWith.findIndex(u => u.email === email);
        if (index === -1) return;
        
        this.sharedWith.splice(index, 1);
        
        // Remove from DOM
        const personRow = this.modal.querySelector(`.access-settings__person[data-email="${email}"]`);
        if (personRow) personRow.remove();
        
        // Show empty state if needed
        if (this.sharedWith.length === 0) {
            const peopleList = this.modal.querySelector('.access-settings__people-list');
            if (peopleList) {
                peopleList.remove();
                const emptyHtml = `
                    <div class="access-settings__people-empty">
                        <i class="fa-regular fa-user"></i>
                        <span>No one else has access</span>
                    </div>
                `;
                this.modal.querySelector('.access-settings__invite').insertAdjacentHTML('beforebegin', emptyHtml);
            }
        }
        
        // Update count
        const count = this.modal.querySelector('.access-settings__count');
        if (count) count.textContent = this.sharedWith.length;
        
        this.notifyChange();
    }
    
    /**
     * Update user role
     * @param {string} email
     * @param {string} role
     */
    updateUserRole(email, role) {
        const user = this.sharedWith.find(u => u.email === email);
        if (user) {
            user.role = role;
            this.notifyChange();
        }
    }
    
    /**
     * Copy share link
     */
    async copyLink() {
        const link = this.getShareLink();
        const copyBtn = this.modal.querySelector('.access-settings__copy-btn');
        
        try {
            await navigator.clipboard.writeText(link);
            
            // Show success feedback
            const icon = copyBtn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            copyBtn.classList.add('access-settings__copy-btn--success');
            
            setTimeout(() => {
                icon.className = 'fa-regular fa-copy';
                copyBtn.classList.remove('access-settings__copy-btn--success');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    }
    
    /**
     * Get share link
     * @returns {string}
     */
    getShareLink() {
        // In a real app, this would be a proper share URL
        const fileId = this.file.id || 'temp-id';
        return `${window.location.origin}/view/${fileId}`;
    }
    
    /**
     * Notify change
     */
    notifyChange() {
        this.onChange({
            accessLevel: this.accessLevel,
            sharedWith: this.sharedWith
        });
    }
    
    /**
     * Close modal
     */
    close() {
        document.removeEventListener('keydown', this.handleKeyDown);
        
        if (this.overlay) {
            this.overlay.classList.add('access-settings-overlay--closing');
            setTimeout(() => {
                if (this.overlay) {
                    this.overlay.remove();
                    this.overlay = null;
                    this.modal = null;
                }
            }, 150);
        }
        
        this.onClose();
    }
    
    /**
     * Validate email
     * @param {string} email
     * @returns {boolean}
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    /**
     * Get initials from name
     * @param {string} name
     * @returns {string}
     */
    getInitials(name) {
        if (!name) return '?';
        const parts = name.split(/[\s@]+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
    /**
     * Get avatar color from email
     * @param {string} email
     * @returns {string}
     */
    getAvatarColor(email) {
        // Simple hash to color
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            hash = email.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#84cc16',
            '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6',
            '#ec4899', '#f43f5e'
        ];
        return colors[Math.abs(hash) % colors.length];
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
     * Static method to show modal
     * @param {Object} options
     * @returns {Promise<Object|null>}
     */
    static show(options) {
        return new Promise((resolve) => {
            let lastSettings = null;
            
            new AccessSettingsModal({
                ...options,
                onChange: (settings) => {
                    lastSettings = settings;
                },
                onClose: () => resolve(lastSettings)
            });
        });
    }
}

export default AccessSettingsModal;
