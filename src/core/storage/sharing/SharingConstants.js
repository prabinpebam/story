/**
 * Sharing Constants
 * 
 * Constants and enums for the sharing system.
 */

/**
 * Sharing events
 */
export const SharingEvents = {
    SHARED: 'sharing:shared',
    SHARE_FAILED: 'sharing:share-failed',
    ACCESS_UPDATED: 'sharing:access-updated',
    ACCESS_REMOVED: 'sharing:access-removed',
    LINK_CREATED: 'sharing:link-created',
    LINK_REVOKED: 'sharing:link-revoked',
    COLLABORATOR_JOINED: 'sharing:collaborator-joined',
    COLLABORATOR_LEFT: 'sharing:collaborator-left'
};

/**
 * Standard share roles (normalized across providers)
 */
export const ShareRole = {
    VIEWER: 'viewer',
    COMMENTER: 'commenter',
    EDITOR: 'editor',
    OWNER: 'owner'
};

/**
 * Share link types
 */
export const ShareLinkType = {
    VIEW: 'view',
    EDIT: 'edit',
    EMBED: 'embed',
    PRESENT: 'present'
};

/**
 * Share link scope
 */
export const ShareLinkScope = {
    ANYONE: 'anyone',           // Anyone with the link
    ORGANIZATION: 'organization', // Only people in the organization
    SPECIFIC: 'specific'         // Specific people only
};

/**
 * Sharing errors
 */
export const SharingErrors = {
    NOT_AUTHENTICATED: 'Not authenticated with cloud provider',
    PERMISSION_DENIED: 'You do not have permission to share this file',
    INVALID_EMAIL: 'Invalid email address',
    USER_NOT_FOUND: 'User not found',
    ALREADY_SHARED: 'File is already shared with this user',
    CANNOT_SHARE_WITH_SELF: 'Cannot share with yourself',
    OWNER_CANNOT_BE_REMOVED: 'Owner cannot be removed',
    OWNER_CANNOT_BE_CHANGED: 'Owner role cannot be changed',
    RATE_LIMITED: 'Too many requests, please try again later',
    PROVIDER_ERROR: 'Cloud provider error',
    NETWORK_ERROR: 'Network error'
};

/**
 * Default share message
 */
export const DEFAULT_SHARE_MESSAGE = 'You have been invited to collaborate on this presentation.';

/**
 * Maximum number of people to share with in one request
 */
export const MAX_SHARE_BATCH_SIZE = 50;

/**
 * Share capability flags
 */
export const ShareCapabilities = {
    CAN_SHARE: 'canShare',
    CAN_MANAGE_ACCESS: 'canManageAccess',
    CAN_CREATE_LINKS: 'canCreateLinks',
    CAN_SET_EXPIRY: 'canSetExpiry',
    CAN_SET_PASSWORD: 'canSetPassword',
    CAN_TRANSFER_OWNERSHIP: 'canTransferOwnership'
};
