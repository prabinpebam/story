/**
 * Sharing Module - Main Exports
 * 
 * This module provides file sharing functionality across cloud storage providers.
 */

// Constants
export * from './SharingConstants.js';

// Main manager
export { SharingManager, default as SharingManagerDefault } from './SharingManager.js';

// Utilities
export { PermissionNormalizer } from './PermissionNormalizer.js';
export { ShareLinkGenerator } from './ShareLinkGenerator.js';

// Singleton instance
import { SharingManager } from './SharingManager.js';

let sharingManagerInstance = null;

/**
 * Get the singleton SharingManager instance
 * @param {Object} [options] - Configuration options
 * @returns {SharingManager}
 */
export function getSharingManager(options) {
    if (!sharingManagerInstance) {
        sharingManagerInstance = new SharingManager(options);
    } else if (options) {
        // Update providers if provided
        if (options.oneDriveProvider) {
            sharingManagerInstance.oneDriveProvider = options.oneDriveProvider;
        }
        if (options.googleDriveProvider) {
            sharingManagerInstance.googleDriveProvider = options.googleDriveProvider;
        }
    }
    return sharingManagerInstance;
}

/**
 * Reset the singleton instance (mainly for testing)
 */
export function resetSharingManager() {
    sharingManagerInstance = null;
}
