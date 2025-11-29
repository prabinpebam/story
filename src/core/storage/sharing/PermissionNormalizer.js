/**
 * PermissionNormalizer
 * 
 * Normalizes permission roles across different cloud storage providers.
 * Provides a consistent role vocabulary (viewer, commenter, editor, owner)
 * that maps to provider-specific role names.
 */

import { ShareRole } from './SharingConstants.js';

/**
 * Role mapping for OneDrive
 * @see https://docs.microsoft.com/en-us/graph/api/resources/permission
 */
const ONEDRIVE_ROLES = {
    read: ShareRole.VIEWER,
    write: ShareRole.EDITOR,
    owner: ShareRole.OWNER,
    sp_editor: ShareRole.EDITOR,
    sp_viewer: ShareRole.VIEWER
};

/**
 * Role mapping for Google Drive
 * @see https://developers.google.com/drive/api/v3/ref-roles
 */
const GOOGLE_DRIVE_ROLES = {
    reader: ShareRole.VIEWER,
    commenter: ShareRole.COMMENTER,
    writer: ShareRole.EDITOR,
    fileorganizer: ShareRole.EDITOR,
    organizer: ShareRole.EDITOR,
    owner: ShareRole.OWNER
};

export class PermissionNormalizer {
    /**
     * Normalize a role to the standard vocabulary
     * @param {string} role - Input role (may be provider-specific or standard)
     * @returns {string} Normalized role (viewer, commenter, editor, owner)
     */
    normalizeRole(role) {
        const lowerRole = role?.toLowerCase() || '';
        
        // Already a standard role
        if (Object.values(ShareRole).includes(lowerRole)) {
            return lowerRole;
        }
        
        // Check OneDrive roles
        if (lowerRole in ONEDRIVE_ROLES) {
            return ONEDRIVE_ROLES[lowerRole];
        }
        
        // Check Google Drive roles
        if (lowerRole in GOOGLE_DRIVE_ROLES) {
            return GOOGLE_DRIVE_ROLES[lowerRole];
        }
        
        // Common aliases
        switch (lowerRole) {
            case 'view':
            case 'read':
            case 'readonly':
            case 'read-only':
                return ShareRole.VIEWER;
            
            case 'comment':
            case 'commentor':
                return ShareRole.COMMENTER;
            
            case 'edit':
            case 'write':
            case 'contributor':
                return ShareRole.EDITOR;
            
            case 'admin':
            case 'full':
                return ShareRole.OWNER;
            
            default:
                return ShareRole.VIEWER; // Default to most restrictive
        }
    }

    /**
     * Convert standard role to OneDrive role
     * @param {string} role - Standard role
     * @returns {string} OneDrive role
     */
    toOneDriveRole(role) {
        const normalized = this.normalizeRole(role);
        
        switch (normalized) {
            case ShareRole.VIEWER:
                return 'read';
            case ShareRole.COMMENTER:
                return 'read'; // OneDrive doesn't have commenter, fall back to read
            case ShareRole.EDITOR:
                return 'write';
            case ShareRole.OWNER:
                return 'owner';
            default:
                return 'read';
        }
    }

    /**
     * Convert OneDrive role to standard role
     * @param {string} role - OneDrive role
     * @returns {string} Standard role
     */
    fromOneDriveRole(role) {
        const lowerRole = role?.toLowerCase() || '';
        return ONEDRIVE_ROLES[lowerRole] || ShareRole.VIEWER;
    }

    /**
     * Convert standard role to Google Drive role
     * @param {string} role - Standard role
     * @returns {string} Google Drive role
     */
    toGoogleDriveRole(role) {
        const normalized = this.normalizeRole(role);
        
        switch (normalized) {
            case ShareRole.VIEWER:
                return 'reader';
            case ShareRole.COMMENTER:
                return 'commenter';
            case ShareRole.EDITOR:
                return 'writer';
            case ShareRole.OWNER:
                return 'owner';
            default:
                return 'reader';
        }
    }

    /**
     * Convert Google Drive role to standard role
     * @param {string} role - Google Drive role
     * @returns {string} Standard role
     */
    fromGoogleDriveRole(role) {
        const lowerRole = role?.toLowerCase() || '';
        return GOOGLE_DRIVE_ROLES[lowerRole] || ShareRole.VIEWER;
    }

    /**
     * Get all standard roles in order of permissions (least to most)
     * @returns {string[]} Array of roles
     */
    getRoleHierarchy() {
        return [
            ShareRole.VIEWER,
            ShareRole.COMMENTER,
            ShareRole.EDITOR,
            ShareRole.OWNER
        ];
    }

    /**
     * Compare two roles
     * @param {string} roleA - First role
     * @param {string} roleB - Second role
     * @returns {number} -1 if A < B, 0 if equal, 1 if A > B
     */
    compareRoles(roleA, roleB) {
        const hierarchy = this.getRoleHierarchy();
        const indexA = hierarchy.indexOf(this.normalizeRole(roleA));
        const indexB = hierarchy.indexOf(this.normalizeRole(roleB));
        
        if (indexA < indexB) return -1;
        if (indexA > indexB) return 1;
        return 0;
    }

    /**
     * Check if a role has at least the given permission level
     * @param {string} role - Role to check
     * @param {string} requiredRole - Minimum required role
     * @returns {boolean} Whether role meets requirement
     */
    hasAtLeast(role, requiredRole) {
        return this.compareRoles(role, requiredRole) >= 0;
    }

    /**
     * Get human-readable description for a role
     * @param {string} role - Role to describe
     * @returns {Object} Role description with name and capabilities
     */
    getRoleDescription(role) {
        // Note: We use the normalized role to get the description
        // but we need to handle unknown roles specially
        const normalized = this.normalizeRole(role);
        
        switch (normalized) {
            case ShareRole.VIEWER:
                return {
                    name: 'Viewer',
                    description: 'Can view the presentation',
                    capabilities: ['view']
                };
            
            case ShareRole.COMMENTER:
                return {
                    name: 'Commenter',
                    description: 'Can view and add comments',
                    capabilities: ['view', 'comment']
                };
            
            case ShareRole.EDITOR:
                return {
                    name: 'Editor',
                    description: 'Can view, comment, and edit',
                    capabilities: ['view', 'comment', 'edit']
                };
            
            case ShareRole.OWNER:
                return {
                    name: 'Owner',
                    description: 'Full access including sharing and deletion',
                    capabilities: ['view', 'comment', 'edit', 'share', 'delete']
                };
            
            default:
                return {
                    name: 'Unknown',
                    description: 'Unknown permission level',
                    capabilities: []
                };
        }
    }

    /**
     * Get roles available for sharing (excluding owner)
     * @returns {Object[]} Array of role objects with value and label
     */
    getShareableRoles() {
        return [
            { value: ShareRole.VIEWER, label: 'Viewer' },
            { value: ShareRole.COMMENTER, label: 'Commenter' },
            { value: ShareRole.EDITOR, label: 'Editor' }
        ];
    }

    /**
     * Check if a provider supports a role
     * @param {string} provider - Provider ID (onedrive, google-drive)
     * @param {string} role - Role to check
     * @returns {boolean} Whether provider supports the role
     */
    isRoleSupported(provider, role) {
        const normalized = this.normalizeRole(role);
        
        if (provider === 'onedrive') {
            // OneDrive doesn't support commenter
            return normalized !== ShareRole.COMMENTER;
        }
        
        if (provider === 'google-drive') {
            // Google Drive supports all roles
            return true;
        }
        
        return false;
    }

    /**
     * Get the closest supported role for a provider
     * @param {string} provider - Provider ID
     * @param {string} role - Desired role
     * @returns {string} Supported role (may be different from input)
     */
    getClosestSupportedRole(provider, role) {
        const normalized = this.normalizeRole(role);
        
        if (this.isRoleSupported(provider, normalized)) {
            return normalized;
        }
        
        // OneDrive: commenter → viewer
        if (provider === 'onedrive' && normalized === ShareRole.COMMENTER) {
            return ShareRole.VIEWER;
        }
        
        return normalized;
    }
}

export default PermissionNormalizer;
