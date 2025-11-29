/**
 * CollaboratorList
 * 
 * Displays list of people with access to a file with role management.
 */

import { SharingRoles } from '../../core/storage/sharing/SharingConstants.js';
import { PermissionDropdown } from './PermissionDropdown.js';

export class CollaboratorList {
    /**
     * Create a CollaboratorList
     * @param {Object} options - Configuration options
     * @param {Array} options.collaborators - List of collaborators
     * @param {string} options.currentUserId - Current user's ID
     * @param {Function} options.onRoleChange - Callback for role changes
     * @param {Function} options.onRemove - Callback for removing access
     * @param {boolean} options.readonly - Whether list is read-only
     */
    constructor(options = {}) {
        this.collaborators = options.collaborators || [];
        this.currentUserId = options.currentUserId;
        this.onRoleChange = options.onRoleChange;
        this.onRemove = options.onRemove;
        this.readonly = options.readonly || false;
        
        this.element = document.createElement('div');
        this.element.className = 'collaborator-list';
        
        this._roleDropdowns = [];
        
        this._render();
    }

    /**
     * Render the collaborator list
     * @private
     */
    _render() {
        this.element.innerHTML = '';
        this._cleanup();
        
        if (this.collaborators.length === 0) {
            this._renderEmptyState();
            return;
        }
        
        // Sort: owner first, then by name
        const sorted = [...this.collaborators].sort((a, b) => {
            if (a.role === SharingRoles.OWNER) return -1;
            if (b.role === SharingRoles.OWNER) return 1;
            const nameA = a.displayName || a.name || a.email;
            const nameB = b.displayName || b.name || b.email;
            return nameA.localeCompare(nameB);
        });
        
        sorted.forEach(collaborator => {
            const item = this._renderCollaborator(collaborator);
            this.element.appendChild(item);
        });
    }

    /**
     * Render empty state
     * @private
     */
    _renderEmptyState() {
        const empty = document.createElement('div');
        empty.className = 'collaborator-list-empty';
        empty.innerHTML = `
            <i class="fa-solid fa-users"></i>
            <span>No collaborators yet</span>
        `;
        this.element.appendChild(empty);
    }

    /**
     * Render a single collaborator
     * @param {Object} collaborator - Collaborator data
     * @returns {HTMLElement}
     * @private
     */
    _renderCollaborator(collaborator) {
        const isOwner = collaborator.role === SharingRoles.OWNER;
        const isCurrentUser = collaborator.id === this.currentUserId;
        
        const item = document.createElement('div');
        item.className = 'collaborator-item';
        item.dataset.collaboratorId = collaborator.id;
        
        if (isOwner) {
            item.classList.add('is-owner');
        }
        if (collaborator.isPending) {
            item.classList.add('collaborator-pending');
        }
        
        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'collaborator-avatar';
        if (collaborator.avatar) {
            avatar.innerHTML = `<img src="${collaborator.avatar}" alt="" />`;
        } else {
            const displayName = collaborator.displayName || collaborator.name || collaborator.email;
            const initials = this._getInitials(displayName);
            avatar.textContent = initials;
        }
        item.appendChild(avatar);
        
        // Info
        const info = document.createElement('div');
        info.className = 'collaborator-info';
        
        const name = document.createElement('div');
        name.className = 'collaborator-name';
        name.textContent = collaborator.displayName || collaborator.name || collaborator.email;
        info.appendChild(name);
        
        const email = document.createElement('div');
        email.className = 'collaborator-email';
        email.textContent = collaborator.email;
        info.appendChild(email);
        
        item.appendChild(info);
        
        // Actions
        const actions = document.createElement('div');
        actions.className = 'collaborator-actions';
        
        if (isOwner) {
            // Owner badge
            const ownerBadge = document.createElement('span');
            ownerBadge.className = 'collaborator-owner-badge';
            ownerBadge.textContent = 'Owner';
            actions.appendChild(ownerBadge);
        } else {
            // Role dropdown
            const dropdown = new PermissionDropdown({
                value: collaborator.role,
                disabled: this.readonly,
                onChange: (role) => {
                    if (this.onRoleChange) {
                        this.onRoleChange(collaborator.id, role);
                    }
                }
            });
            this._roleDropdowns.push(dropdown);
            actions.appendChild(dropdown.element);
            
            // Remove button (not for current user or in readonly mode)
            if (!isCurrentUser && !this.readonly) {
                const removeBtn = document.createElement('button');
                removeBtn.className = 'collaborator-remove';
                removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                removeBtn.setAttribute('aria-label', `Remove ${collaborator.email}`);
                removeBtn.addEventListener('click', () => {
                    if (this.onRemove) {
                        this.onRemove(collaborator.id);
                    }
                });
                actions.appendChild(removeBtn);
            }
        }
        
        item.appendChild(actions);
        
        return item;
    }

    /**
     * Get initials from name or email
     * @param {string} nameOrEmail - Name or email string
     * @returns {string} Initials (1-2 characters)
     * @private
     */
    _getInitials(nameOrEmail) {
        if (!nameOrEmail) return '?';
        
        // If it's an email, use first letter
        if (nameOrEmail.includes('@')) {
            return nameOrEmail.charAt(0).toUpperCase();
        }
        
        // Get initials from name
        const parts = nameOrEmail.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    /**
     * Set collaborators list (alias for update)
     * @param {Array} collaborators - New list of collaborators
     */
    setCollaborators(collaborators) {
        this.collaborators = collaborators;
        this._render();
    }

    /**
     * Update collaborators list
     * @param {Array} collaborators - New list of collaborators
     */
    update(collaborators) {
        this.setCollaborators(collaborators);
    }

    /**
     * Clean up dropdowns
     * @private
     */
    _cleanup() {
        this._roleDropdowns.forEach(d => d.destroy());
        this._roleDropdowns = [];
    }

    /**
     * Destroy the component
     */
    destroy() {
        this._cleanup();
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default CollaboratorList;
