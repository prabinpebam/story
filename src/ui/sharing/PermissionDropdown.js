/**
 * PermissionDropdown
 * 
 * Dropdown for selecting permission roles.
 */

import { SharingRoles } from '../../core/storage/sharing/SharingConstants.js';
import { PermissionNormalizer } from '../../core/storage/sharing/PermissionNormalizer.js';

// Create singleton instance for getting descriptions
const permissionNormalizer = new PermissionNormalizer();

export class PermissionDropdown {
    /**
     * Create a PermissionDropdown
     * @param {Object} options - Configuration options
     * @param {string} options.value - Initial role value
     * @param {Function} options.onChange - Callback when role changes
     * @param {boolean} options.showOwner - Whether to show owner option
     * @param {boolean} options.disabled - Whether dropdown is disabled
     */
    constructor(options = {}) {
        this.value = options.value || SharingRoles.VIEWER;
        this.onChange = options.onChange;
        this.showOwner = options.showOwner || false;
        this.isDisabled = options.disabled || false;
        this.isOpen = false;
        
        this.roles = this._getRoles();
        
        this.element = document.createElement('div');
        this.element.className = 'permission-dropdown';
        if (this.isDisabled) {
            this.element.classList.add('disabled');
        }
        
        this._render();
        this._bindEvents();
    }

    /**
     * Get available roles
     * @returns {Array}
     * @private
     */
    _getRoles() {
        const roles = [
            { value: SharingRoles.VIEWER, label: 'Viewer', icon: 'fa-eye' },
            { value: SharingRoles.COMMENTER, label: 'Commenter', icon: 'fa-comment' },
            { value: SharingRoles.EDITOR, label: 'Editor', icon: 'fa-pen' }
        ];
        
        if (this.showOwner) {
            roles.push({ value: SharingRoles.OWNER, label: 'Owner', icon: 'fa-crown' });
        }
        
        return roles;
    }

    /**
     * Render the dropdown
     * @private
     */
    _render() {
        const currentRole = this.roles.find(r => r.value === this.value) || this.roles[0];
        
        this.element.innerHTML = `
            <button class="permission-dropdown-trigger" ${this.isDisabled ? 'disabled' : ''}>
                <i class="fa-solid ${currentRole.icon}"></i>
                <span>${currentRole.label}</span>
                <i class="fa-solid fa-chevron-down permission-dropdown-arrow"></i>
            </button>
            <div class="permission-dropdown-menu ${this.isOpen ? 'open' : ''}">
                ${this.roles.map(role => `
                    <button class="permission-dropdown-item ${role.value === this.value ? 'selected' : ''}" 
                            data-role="${role.value}">
                        <i class="fa-solid ${role.icon}"></i>
                        <div class="permission-dropdown-item-content">
                            <span class="permission-dropdown-item-label">${role.label}</span>
                            <span class="permission-dropdown-item-description">${this._getRoleDescription(role.value)}</span>
                        </div>
                        ${role.value === this.value ? '<i class="fa-solid fa-check permission-dropdown-check"></i>' : ''}
                    </button>
                `).join('')}
            </div>
        `;
        
        this.trigger = this.element.querySelector('.permission-dropdown-trigger');
        this.menu = this.element.querySelector('.permission-dropdown-menu');
    }

    /**
     * Get role description text
     * @param {string} role - Role value
     * @returns {string}
     * @private
     */
    _getRoleDescription(role) {
        const desc = permissionNormalizer.getRoleDescription(role);
        return desc?.description || 'Unknown permission level';
    }

    /**
     * Bind events
     * @private
     */
    _bindEvents() {
        // Toggle on trigger click
        this.element.addEventListener('click', (e) => {
            const trigger = e.target.closest('.permission-dropdown-trigger');
            if (trigger && !this.isDisabled) {
                e.stopPropagation();
                this._toggle();
            }
            
            const item = e.target.closest('.permission-dropdown-item');
            if (item) {
                e.stopPropagation();
                const role = item.dataset.role;
                this._selectRole(role);
            }
        });
        
        // Close on outside click
        this._handleOutsideClick = (e) => {
            if (!this.element.contains(e.target)) {
                this._close();
            }
        };
        document.addEventListener('click', this._handleOutsideClick);
        
        // Close on escape
        this._handleKeydown = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this._close();
            }
        };
        document.addEventListener('keydown', this._handleKeydown);
    }

    /**
     * Toggle dropdown
     * @private
     */
    _toggle() {
        if (this.isOpen) {
            this._close();
        } else {
            this._open();
        }
    }

    /**
     * Open dropdown
     * @private
     */
    _open() {
        this.isOpen = true;
        this.menu.classList.add('open');
        this.element.classList.add('open');
    }

    /**
     * Close dropdown
     * @private
     */
    _close() {
        this.isOpen = false;
        this.menu.classList.remove('open');
        this.element.classList.remove('open');
    }

    /**
     * Select a role
     * @param {string} role - Role to select
     * @private
     */
    _selectRole(role) {
        if (role !== this.value) {
            const oldValue = this.value;
            this.value = role;
            this._render();
            this._close();
            
            if (this.onChange) {
                this.onChange(role, oldValue);
            }
        } else {
            this._close();
        }
    }

    /**
     * Get current value
     * @returns {string}
     */
    getValue() {
        return this.value;
    }

    /**
     * Set value
     * @param {string} value - New value
     */
    setValue(value) {
        this.value = value;
        this._render();
    }

    /**
     * Disable the dropdown
     */
    disable() {
        this.isDisabled = true;
        this.element.classList.add('disabled');
        if (this.trigger) {
            this.trigger.disabled = true;
        }
    }

    /**
     * Enable the dropdown
     */
    enable() {
        this.isDisabled = false;
        this.element.classList.remove('disabled');
        if (this.trigger) {
            this.trigger.disabled = false;
        }
    }

    /**
     * Destroy the component
     */
    destroy() {
        document.removeEventListener('click', this._handleOutsideClick);
        document.removeEventListener('keydown', this._handleKeydown);
        
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default PermissionDropdown;
