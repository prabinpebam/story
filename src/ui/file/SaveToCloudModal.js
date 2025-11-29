/**
 * SaveToCloudModal - Save to cloud dialog
 * 
 * Allows users to save a presentation to cloud storage
 * with filename, folder selection, and access options.
 */

import { ProviderIcon } from './ProviderIcon.js';
import { CloudFilePicker } from './CloudFilePicker.js';
import { authService } from '../../core/auth/index.js';

export class SaveToCloudModal {
    /**
     * Create save to cloud modal
     * @param {Object} options
     * @param {'onedrive' | 'google-drive'} options.provider - Cloud provider
     * @param {string} options.suggestedName - Suggested filename
     * @param {Function} options.onSave - Called when save is confirmed
     * @param {Function} options.onCancel - Called when cancelled
     */
    constructor(options) {
        this.provider = options.provider;
        this.suggestedName = options.suggestedName || 'Untitled';
        this.onSave = options.onSave || (() => {});
        this.onCancel = options.onCancel || (() => {});
        
        /** @type {HTMLElement} */
        this.overlay = null;
        
        /** @type {HTMLElement} */
        this.modal = null;
        
        /** @type {string|null} */
        this.selectedFolderId = null;
        
        /** @type {string} */
        this.selectedFolderPath = 'My Files';
        
        /** @type {'account-locked' | 'public'} */
        this.accessLevel = 'account-locked';
        
        this.create();
    }
    
    create() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'save-cloud-overlay';
        
        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'save-cloud-modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'save-cloud-title');
        
        const providerName = ProviderIcon.getName(this.provider);
        const userEmail = authService.getUser()?.email || '';
        
        // Remove .str if present in suggested name
        const baseName = this.suggestedName.replace(/\.str$/i, '');
        
        this.modal.innerHTML = `
            <div class="save-cloud__header">
                <h2 id="save-cloud-title" class="save-cloud__title">Save to ${providerName}</h2>
                <button class="save-cloud__close" aria-label="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <div class="save-cloud__content">
                <div class="save-cloud__field">
                    <label class="save-cloud__label" for="save-cloud-filename">File name</label>
                    <div class="save-cloud__filename">
                        <input type="text" 
                               id="save-cloud-filename" 
                               class="save-cloud__filename-input"
                               value="${this.escapeHtml(baseName)}" 
                               placeholder="Untitled">
                        <span class="save-cloud__filename-ext">.str</span>
                    </div>
                </div>
                
                <div class="save-cloud__field">
                    <label class="save-cloud__label">Save to</label>
                    <div class="save-cloud__location">
                        <div class="save-cloud__location-path">
                            <span class="save-cloud__location-icon">
                                <i class="fa-solid fa-folder"></i>
                            </span>
                            <span class="save-cloud__location-text">${this.selectedFolderPath}</span>
                        </div>
                        <button class="save-cloud__location-browse">Browse...</button>
                    </div>
                </div>
                
                <div class="save-cloud__divider"></div>
                
                <div class="save-cloud__field">
                    <label class="save-cloud__label">Access</label>
                    <div class="save-cloud__access">
                        <label class="save-cloud__access-option">
                            <input type="radio" 
                                   name="access-level" 
                                   value="account-locked" 
                                   class="save-cloud__access-radio"
                                   checked>
                            <div class="save-cloud__access-content">
                                <div class="save-cloud__access-title">
                                    <i class="fa-solid fa-lock"></i>
                                    Account-locked (only you)
                                </div>
                                <div class="save-cloud__access-desc">
                                    Only you can access this file with your account${userEmail ? ` (${userEmail})` : ''}
                                </div>
                            </div>
                        </label>
                        
                        <label class="save-cloud__access-option">
                            <input type="radio" 
                                   name="access-level" 
                                   value="public" 
                                   class="save-cloud__access-radio">
                            <div class="save-cloud__access-content">
                                <div class="save-cloud__access-title">
                                    <i class="fa-solid fa-globe"></i>
                                    Public (anyone with link)
                                </div>
                                <div class="save-cloud__access-desc">
                                    Anyone with the link can view this file
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="save-cloud__footer">
                <button class="save-cloud__btn save-cloud__btn--secondary" data-action="cancel">
                    Cancel
                </button>
                <button class="save-cloud__btn save-cloud__btn--primary" data-action="save">
                    Save
                </button>
            </div>
        `;
        
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
        
        this.bindEvents();
        
        // Focus filename input
        requestAnimationFrame(() => {
            const input = this.modal.querySelector('#save-cloud-filename');
            if (input) {
                input.focus();
                input.select();
            }
        });
    }
    
    bindEvents() {
        // Close button
        this.modal.querySelector('.save-cloud__close').addEventListener('click', () => {
            this.cancel();
        });
        
        // Overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.cancel();
            }
        });
        
        // Browse button
        this.modal.querySelector('.save-cloud__location-browse').addEventListener('click', () => {
            this.browseFolder();
        });
        
        // Access level radios
        this.modal.querySelectorAll('input[name="access-level"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.accessLevel = e.target.value;
            });
        });
        
        // Action buttons
        this.modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            this.cancel();
        });
        
        this.modal.querySelector('[data-action="save"]').addEventListener('click', () => {
            this.save();
        });
        
        // Filename validation
        const filenameInput = this.modal.querySelector('#save-cloud-filename');
        filenameInput.addEventListener('input', () => {
            this.validateFilename();
        });
        
        // Enter key to save
        filenameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.save();
            }
        });
        
        // Escape key
        document.addEventListener('keydown', this.handleKeyDown);
    }
    
    handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            this.cancel();
        }
    };
    
    /**
     * Open folder browser
     */
    async browseFolder() {
        // Create a minimal folder picker using CloudFilePicker
        const result = await CloudFilePicker.show({
            provider: this.provider,
            mode: 'save',
            suggestedName: this.getFilename()
        });
        
        if (result) {
            this.selectedFolderId = result.folderId;
            this.selectedFolderPath = result.folderPath || 'My Files';
            this.updateLocationDisplay();
            
            // Update filename if changed in picker
            if (result.filename) {
                const input = this.modal.querySelector('#save-cloud-filename');
                input.value = result.filename.replace('.str', '');
            }
        }
    }
    
    /**
     * Update location display
     */
    updateLocationDisplay() {
        const pathText = this.modal.querySelector('.save-cloud__location-text');
        pathText.textContent = this.selectedFolderPath;
    }
    
    /**
     * Validate filename
     */
    validateFilename() {
        const input = this.modal.querySelector('#save-cloud-filename');
        const saveBtn = this.modal.querySelector('[data-action="save"]');
        
        const filename = input.value.trim();
        const isValid = filename.length > 0 && !this.hasInvalidChars(filename);
        
        saveBtn.disabled = !isValid;
        
        if (filename.length > 0 && !isValid) {
            input.classList.add('save-cloud__filename-input--error');
        } else {
            input.classList.remove('save-cloud__filename-input--error');
        }
    }
    
    /**
     * Check for invalid filename characters
     * @param {string} name
     * @returns {boolean}
     */
    hasInvalidChars(name) {
        const invalidChars = /[<>:"/\\|?*]/;
        return invalidChars.test(name);
    }
    
    /**
     * Get current filename
     * @returns {string}
     */
    getFilename() {
        const input = this.modal.querySelector('#save-cloud-filename');
        return input.value.trim() + '.str';
    }
    
    /**
     * Save file
     */
    save() {
        const filename = this.getFilename();
        
        if (filename === '.str' || this.hasInvalidChars(filename.replace('.str', ''))) {
            this.validateFilename();
            return;
        }
        
        this.close();
        this.onSave({
            filename,
            folderId: this.selectedFolderId,
            folderPath: this.selectedFolderPath,
            accessLevel: this.accessLevel,
            provider: this.provider
        });
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
            this.overlay.classList.add('save-cloud-overlay--closing');
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
     * Static method to show modal and return promise
     * @param {Object} options
     * @returns {Promise<Object|null>}
     */
    static show(options) {
        return new Promise((resolve) => {
            new SaveToCloudModal({
                ...options,
                onSave: (result) => resolve(result),
                onCancel: () => resolve(null)
            });
        });
    }
}

export default SaveToCloudModal;
