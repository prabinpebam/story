/**
 * ShareModal
 * 
 * Modal dialog for sharing presentations with others.
 * Provides collaborator management and share link creation.
 * 
 * @see ../../../documentation/plans/master-implementation-plan-v2.md
 */

import { SharingEvents, SharingRoles, ShareLinkTypes } from '../../core/storage/sharing/SharingConstants.js';
import { CollaboratorList } from './CollaboratorList.js';
import { ShareLinkPanel } from './ShareLinkPanel.js';
import { InviteInput } from './InviteInput.js';
import { PermissionDropdown } from './PermissionDropdown.js';

export class ShareModal {
    /**
     * Create a ShareModal
     * @param {Object} options - Configuration options
     * @param {string} options.fileId - File ID to share
     * @param {string} options.fileName - File name for display
     * @param {string} options.provider - Cloud storage provider
     * @param {SharingManager} [options.sharingManager] - Sharing manager instance
     */
    constructor(options = {}) {
        this.fileId = options.fileId;
        this.fileName = options.fileName || 'Untitled Presentation';
        this.provider = options.provider;
        this.sharingManager = options.sharingManager;
        
        this.overlay = null;
        this.modal = null;
        this.collaboratorList = null;
        this.shareLinkPanel = null;
        this.inviteInput = null;
        this.permissionDropdown = null;
        
        this.isLoading = false;
        this.canShare = true;
        
        this._boundHandleKeyDown = this._handleKeyDown.bind(this);
    }

    /**
     * Show the share modal
     * @returns {Promise<void>}
     */
    async show() {
        this._createModal();
        this._bindEvents();
        
        // Add to document
        document.body.appendChild(this.overlay);
        document.addEventListener('keydown', this._boundHandleKeyDown);
        
        // Animate in
        requestAnimationFrame(() => {
            this.overlay.classList.add('visible');
        });
        
        // Load collaborators
        await this._loadCollaborators();
        
        // Check share capability
        await this._checkShareCapability();
    }

    /**
     * Hide the share modal
     */
    hide() {
        if (!this.overlay) return;
        
        this.overlay.classList.remove('visible');
        document.removeEventListener('keydown', this._boundHandleKeyDown);
        
        // Remove after animation
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            this._cleanup();
        }, 200);
    }

    /**
     * Create the modal DOM structure
     * @private
     */
    _createModal() {
        // Overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'share-modal-overlay';
        
        // Modal container
        this.modal = document.createElement('div');
        this.modal.className = 'share-modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-labelledby', 'share-modal-title');
        this.modal.setAttribute('aria-modal', 'true');
        
        // Header
        const header = this._createHeader();
        this.modal.appendChild(header);
        
        // Invite section
        const inviteSection = this._createInviteSection();
        this.modal.appendChild(inviteSection);
        
        // Collaborators section
        const collaboratorsSection = this._createCollaboratorsSection();
        this.modal.appendChild(collaboratorsSection);
        
        // Share link section
        const linkSection = this._createLinkSection();
        this.modal.appendChild(linkSection);
        
        this.overlay.appendChild(this.modal);
    }

    /**
     * Create modal header
     * @private
     */
    _createHeader() {
        const header = document.createElement('div');
        header.className = 'share-modal-header';
        
        const title = document.createElement('h2');
        title.id = 'share-modal-title';
        title.className = 'share-modal-title';
        title.textContent = `Share "${this.fileName}"`;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'share-modal-close';
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        closeButton.addEventListener('click', () => this.hide());
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        return header;
    }

    /**
     * Create invite section
     * @private
     */
    _createInviteSection() {
        const section = document.createElement('div');
        section.className = 'share-modal-section share-modal-invite';
        
        const label = document.createElement('label');
        label.className = 'share-modal-label';
        label.textContent = 'Add people';
        
        const inputRow = document.createElement('div');
        inputRow.className = 'share-modal-invite-row';
        
        // Email input
        this.inviteInput = new InviteInput({
            placeholder: 'Enter email addresses...',
            onSubmit: (emails) => this._handleInvite(emails)
        });
        inputRow.appendChild(this.inviteInput.element);
        
        // Permission dropdown
        this.permissionDropdown = new PermissionDropdown({
            value: SharingRoles.VIEWER,
            onChange: (role) => this.selectedRole = role
        });
        this.selectedRole = SharingRoles.VIEWER;
        inputRow.appendChild(this.permissionDropdown.element);
        
        // Invite button
        this.inviteButton = document.createElement('button');
        this.inviteButton.className = 'share-modal-button share-modal-button-primary';
        this.inviteButton.textContent = 'Invite';
        this.inviteButton.addEventListener('click', () => this._handleInviteClick());
        inputRow.appendChild(this.inviteButton);
        
        section.appendChild(label);
        section.appendChild(inputRow);
        
        // Error message container
        this.inviteError = document.createElement('div');
        this.inviteError.className = 'share-modal-error';
        this.inviteError.style.display = 'none';
        section.appendChild(this.inviteError);
        
        return section;
    }

    /**
     * Create collaborators section
     * @private
     */
    _createCollaboratorsSection() {
        const section = document.createElement('div');
        section.className = 'share-modal-section share-modal-collaborators';
        
        const label = document.createElement('label');
        label.className = 'share-modal-label';
        label.textContent = 'People with access';
        section.appendChild(label);
        
        // Collaborator list container
        this.collaboratorsContainer = document.createElement('div');
        this.collaboratorsContainer.className = 'share-modal-collaborators-list';
        section.appendChild(this.collaboratorsContainer);
        
        return section;
    }

    /**
     * Create share link section
     * @private
     */
    _createLinkSection() {
        const section = document.createElement('div');
        section.className = 'share-modal-section share-modal-link-section';
        
        const label = document.createElement('label');
        label.className = 'share-modal-label';
        label.textContent = 'Get link';
        section.appendChild(label);
        
        // Share link panel container
        this.linkContainer = document.createElement('div');
        this.linkContainer.className = 'share-modal-link-container';
        section.appendChild(this.linkContainer);
        
        return section;
    }

    /**
     * Bind modal events
     * @private
     */
    _bindEvents() {
        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
        
        // Subscribe to sharing events
        if (this.sharingManager) {
            this.sharingManager.addEventListener(SharingEvents.SHARED, () => {
                this._loadCollaborators();
            });
            
            this.sharingManager.addEventListener(SharingEvents.ACCESS_UPDATED, () => {
                this._loadCollaborators();
            });
            
            this.sharingManager.addEventListener(SharingEvents.ACCESS_REMOVED, () => {
                this._loadCollaborators();
            });
        }
    }

    /**
     * Handle keyboard events
     * @private
     */
    _handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.hide();
        }
    }

    /**
     * Load collaborators list
     * @private
     */
    async _loadCollaborators() {
        if (!this.sharingManager) return;
        
        this._showLoading(this.collaboratorsContainer);
        
        try {
            const collaborators = await this.sharingManager.getCollaborators(
                this.fileId,
                { provider: this.provider, useCache: false }
            );
            
            // Create collaborator list component
            if (this.collaboratorList) {
                this.collaboratorList.destroy();
            }
            
            this.collaboratorList = new CollaboratorList({
                collaborators,
                onRoleChange: (email, role) => this._handleRoleChange(email, role),
                onRemove: (email) => this._handleRemoveAccess(email)
            });
            
            this.collaboratorsContainer.innerHTML = '';
            this.collaboratorsContainer.appendChild(this.collaboratorList.element);
            
            // Create share link panel
            await this._loadShareLinks();
        } catch (error) {
            this._showError(this.collaboratorsContainer, 'Failed to load collaborators');
            console.error('Failed to load collaborators:', error);
        }
    }

    /**
     * Load share links
     * @private
     */
    async _loadShareLinks() {
        if (!this.sharingManager) return;
        
        try {
            const links = await this.sharingManager.getShareLinks(
                this.fileId,
                { provider: this.provider }
            );
            
            if (this.shareLinkPanel) {
                this.shareLinkPanel.destroy();
            }
            
            this.shareLinkPanel = new ShareLinkPanel({
                fileId: this.fileId,
                provider: this.provider,
                links,
                sharingManager: this.sharingManager,
                onCreateLink: (type) => this._handleCreateLink(type),
                onRevokeLink: (linkId) => this._handleRevokeLink(linkId)
            });
            
            this.linkContainer.innerHTML = '';
            this.linkContainer.appendChild(this.shareLinkPanel.element);
        } catch (error) {
            console.error('Failed to load share links:', error);
        }
    }

    /**
     * Check if user can share
     * @private
     */
    async _checkShareCapability() {
        if (!this.sharingManager) return;
        
        this.canShare = await this.sharingManager.canShare(
            this.fileId,
            { provider: this.provider }
        );
        
        if (!this.canShare) {
            this.inviteButton.disabled = true;
            this.inviteInput.disable();
            this.inviteError.textContent = 'You do not have permission to share this file.';
            this.inviteError.style.display = 'block';
        }
    }

    /**
     * Handle invite button click
     * @private
     */
    _handleInviteClick() {
        const emails = this.inviteInput.getEmails();
        if (emails.length > 0) {
            this._handleInvite(emails);
        }
    }

    /**
     * Handle invite action
     * @param {string[]} emails - Email addresses to invite
     * @private
     */
    async _handleInvite(emails) {
        if (!this.sharingManager || emails.length === 0) return;
        
        this.inviteError.style.display = 'none';
        this.inviteButton.disabled = true;
        this.inviteButton.textContent = 'Inviting...';
        
        try {
            const results = await this.sharingManager.shareWithPeople(
                this.fileId,
                emails,
                this.selectedRole,
                { provider: this.provider }
            );
            
            // Check for failures
            const failures = results.filter(r => !r.success);
            if (failures.length > 0) {
                const failedEmails = failures.map(f => f.email).join(', ');
                this.inviteError.textContent = `Failed to invite: ${failedEmails}`;
                this.inviteError.style.display = 'block';
            }
            
            // Clear input
            this.inviteInput.clear();
            
            // Reload collaborators
            await this._loadCollaborators();
        } catch (error) {
            this.inviteError.textContent = error.message || 'Failed to send invites';
            this.inviteError.style.display = 'block';
        } finally {
            this.inviteButton.disabled = false;
            this.inviteButton.textContent = 'Invite';
        }
    }

    /**
     * Handle role change
     * @param {string} email - Collaborator email
     * @param {string} newRole - New role
     * @private
     */
    async _handleRoleChange(email, newRole) {
        if (!this.sharingManager) return;
        
        try {
            await this.sharingManager.updateAccess(
                this.fileId,
                email,
                newRole,
                { provider: this.provider }
            );
        } catch (error) {
            console.error('Failed to update access:', error);
            // Reload to revert UI
            await this._loadCollaborators();
        }
    }

    /**
     * Handle remove access
     * @param {string} email - Collaborator email
     * @private
     */
    async _handleRemoveAccess(email) {
        if (!this.sharingManager) return;
        
        try {
            await this.sharingManager.removeAccess(
                this.fileId,
                email,
                { provider: this.provider }
            );
        } catch (error) {
            console.error('Failed to remove access:', error);
        }
    }

    /**
     * Handle create link
     * @param {string} type - Link type
     * @private
     */
    async _handleCreateLink(type) {
        if (!this.sharingManager) return;
        
        try {
            await this.sharingManager.createShareLink(
                this.fileId,
                { provider: this.provider, type }
            );
            
            await this._loadShareLinks();
        } catch (error) {
            console.error('Failed to create share link:', error);
        }
    }

    /**
     * Handle revoke link
     * @param {string} linkId - Link ID to revoke
     * @private
     */
    async _handleRevokeLink(linkId) {
        if (!this.sharingManager) return;
        
        try {
            await this.sharingManager.revokeShareLink(
                this.fileId,
                linkId,
                { provider: this.provider }
            );
            
            await this._loadShareLinks();
        } catch (error) {
            console.error('Failed to revoke share link:', error);
        }
    }

    /**
     * Show loading state
     * @param {HTMLElement} container - Container element
     * @private
     */
    _showLoading(container) {
        container.innerHTML = `
            <div class="share-modal-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Loading...</span>
            </div>
        `;
    }

    /**
     * Show error state
     * @param {HTMLElement} container - Container element
     * @param {string} message - Error message
     * @private
     */
    _showError(container, message) {
        container.innerHTML = `
            <div class="share-modal-error-state">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
    }

    /**
     * Clean up resources
     * @private
     */
    _cleanup() {
        if (this.collaboratorList) {
            this.collaboratorList.destroy();
            this.collaboratorList = null;
        }
        
        if (this.shareLinkPanel) {
            this.shareLinkPanel.destroy();
            this.shareLinkPanel = null;
        }
        
        if (this.inviteInput) {
            this.inviteInput.destroy();
            this.inviteInput = null;
        }
        
        if (this.permissionDropdown) {
            this.permissionDropdown.destroy();
            this.permissionDropdown = null;
        }
        
        this.overlay = null;
        this.modal = null;
    }

    /**
     * Destroy the modal completely
     */
    destroy() {
        this.hide();
    }
}

export default ShareModal;
