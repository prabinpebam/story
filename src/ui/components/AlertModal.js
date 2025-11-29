/**
 * AlertModal - Custom modal dialog component
 * 
 * Replaces browser alert/confirm dialogs with styled modals
 * that match the Story design system.
 */

export class AlertModal {
    constructor() {
        this.overlay = null;
        this.modal = null;
        this.resolvePromise = null;
    }

    /**
     * Show an alert dialog (single OK button)
     * @param {Object} options - Dialog options
     * @param {string} options.title - Dialog title
     * @param {string} options.message - Dialog message
     * @param {string} options.type - 'info' | 'warning' | 'error' | 'success'
     * @param {string} options.confirmText - OK button text
     * @returns {Promise<void>}
     */
    alert(options = {}) {
        return this.show({
            type: 'info',
            confirmText: 'OK',
            showCancel: false,
            ...options
        });
    }

    /**
     * Show a confirm dialog (OK and Cancel buttons)
     * @param {Object} options - Dialog options
     * @param {string} options.title - Dialog title
     * @param {string} options.message - Dialog message
     * @param {string} options.type - 'info' | 'warning' | 'error' | 'success'
     * @param {string} options.confirmText - Confirm button text
     * @param {string} options.cancelText - Cancel button text
     * @returns {Promise<boolean>} - true if confirmed, false if cancelled
     */
    confirm(options = {}) {
        return this.show({
            type: 'warning',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            showCancel: true,
            ...options
        });
    }

    /**
     * Show an unsaved changes dialog
     * @param {Object} options - Dialog options
     * @returns {Promise<'save' | 'discard' | 'cancel'>}
     */
    unsavedChanges(options = {}) {
        return new Promise((resolve) => {
            this.createModal({
                title: options.title || 'Unsaved Changes',
                message: options.message || 'You have unsaved changes. Would you like to save before continuing?',
                type: 'warning',
                buttons: [
                    { id: 'cancel', label: 'Cancel', variant: 'secondary' },
                    { id: 'discard', label: "Don't Save", variant: 'danger' },
                    { id: 'save', label: 'Save', variant: 'primary' }
                ],
                onButton: (id) => {
                    this.close();
                    resolve(id);
                }
            });
        });
    }

    /**
     * Show the modal dialog
     * @private
     */
    show(options) {
        return new Promise((resolve) => {
            const buttons = [];
            
            if (options.showCancel) {
                buttons.push({
                    id: 'cancel',
                    label: options.cancelText || 'Cancel',
                    variant: 'secondary'
                });
            }
            
            buttons.push({
                id: 'confirm',
                label: options.confirmText || 'OK',
                variant: options.type === 'error' ? 'danger' : 'primary'
            });

            this.createModal({
                ...options,
                buttons,
                onButton: (id) => {
                    this.close();
                    resolve(id === 'confirm');
                }
            });
        });
    }

    /**
     * Create and display the modal
     * @private
     */
    createModal(options) {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'alert-modal-overlay';
        
        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'alert-modal';
        this.modal.setAttribute('role', 'alertdialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'alert-modal-title');
        this.modal.setAttribute('aria-describedby', 'alert-modal-message');

        // Icon
        const icon = this.getIcon(options.type);
        
        // Build modal content
        this.modal.innerHTML = `
            <div class="alert-modal-icon alert-modal-icon-${options.type || 'info'}">
                ${icon}
            </div>
            <div class="alert-modal-content">
                <h3 id="alert-modal-title" class="alert-modal-title">${options.title || ''}</h3>
                <p id="alert-modal-message" class="alert-modal-message">${options.message || ''}</p>
            </div>
            <div class="alert-modal-buttons">
                ${options.buttons.map(btn => `
                    <button class="alert-modal-btn alert-modal-btn-${btn.variant}" data-button-id="${btn.id}">
                        ${btn.label}
                    </button>
                `).join('')}
            </div>
        `;

        // Add button event listeners
        this.modal.querySelectorAll('.alert-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                options.onButton(btn.dataset.buttonId);
            });
        });

        // Close on overlay click (only for non-blocking dialogs)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                options.onButton('cancel');
            }
        });

        // Close on escape
        this.handleEscape = (e) => {
            if (e.key === 'Escape') {
                options.onButton('cancel');
            }
        };
        document.addEventListener('keydown', this.handleEscape);

        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);

        // Focus first button
        requestAnimationFrame(() => {
            if (this.overlay && this.modal) {
                this.overlay.classList.add('visible');
                this.modal.classList.add('visible');
                const primaryBtn = this.modal.querySelector('.alert-modal-btn-primary');
                if (primaryBtn) {
                    primaryBtn.focus();
                }
            }
        });
    }

    /**
     * Get icon SVG for dialog type
     * @private
     */
    getIcon(type) {
        const icons = {
            info: '<i class="fa-solid fa-circle-info"></i>',
            warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
            error: '<i class="fa-solid fa-circle-xmark"></i>',
            success: '<i class="fa-solid fa-circle-check"></i>'
        };
        return icons[type] || icons.info;
    }

    /**
     * Close and cleanup the modal
     */
    close() {
        if (this.overlay) {
            if (this.overlay.classList) {
                this.overlay.classList.remove('visible');
            }
            if (this.modal && this.modal.classList) {
                this.modal.classList.remove('visible');
            }
            
            document.removeEventListener('keydown', this.handleEscape);
            
            // Wait for animation before removing
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.remove();
                }
                this.overlay = null;
                this.modal = null;
            }, 150);
        }
    }
}

// Singleton instance for easy access
export const alertModal = new AlertModal();
