/**
 * Identity Linking
 * 
 * Allows users to link multiple OAuth accounts (Microsoft, Google)
 * to a single Story identity. Linked accounts can access the same
 * preferences and shared files.
 * 
 * @module core/auth/IdentityLinking
 */

import { getPreferencesManager } from './preferences/PreferencesManager.js';
import { IdentityEncryption } from './preferences/IdentityEncryption.js';

/**
 * Events emitted by IdentityLinking
 */
export const IdentityLinkingEvents = {
    IDENTITY_LINKED: 'identity:linked',
    IDENTITY_UNLINKED: 'identity:unlinked',
    LINKING_STARTED: 'identity:linking:started',
    LINKING_FAILED: 'identity:linking:failed'
};

/**
 * Identity Linking Manager
 * 
 * Manages linking and unlinking of OAuth identities.
 */
export class IdentityLinking {
    constructor(authService) {
        this.authService = authService;
        this.encryption = new IdentityEncryption();
        this.listeners = new Set();
        this.linkingInProgress = false;
        this.pendingLinkProvider = null;
    }

    /**
     * Subscribe to identity linking events
     * 
     * @param {Function} callback - Event callback
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Emit event to listeners
     * @private
     */
    emit(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (e) {
                console.error('Identity linking listener error:', e);
            }
        }
    }

    /**
     * Get current user's identity information
     * 
     * @returns {Object|null} Identity info or null if not authenticated
     */
    getCurrentIdentity() {
        const user = this.authService.getCurrentUser();
        if (!user) return null;

        const claims = user.idTokenClaims || user;
        return {
            id: this.encryption.getIdentityId(claims),
            provider: this.encryption.getProviderFromIssuer(claims.iss),
            email: claims.email || user.email,
            name: claims.name || user.name,
            sub: claims.sub,
            iss: claims.iss
        };
    }

    /**
     * Get all linked identities for current user
     * 
     * @returns {Promise<Object[]>} Array of linked identities
     */
    async getLinkedIdentities() {
        const preferencesManager = getPreferencesManager();
        const file = preferencesManager.file;
        
        if (!file) {
            return [];
        }

        return file.getAuthorizedIdentities();
    }

    /**
     * Check if a provider is already linked
     * 
     * @param {string} provider - Provider name ('microsoft', 'google')
     * @returns {Promise<boolean>} True if provider is linked
     */
    async isProviderLinked(provider) {
        const identities = await this.getLinkedIdentities();
        return identities.some(i => {
            // Parse provider from identity ID (format: provider_sub)
            return i.id.startsWith(`${provider}_`);
        });
    }

    /**
     * Start the identity linking flow
     * 
     * This initiates OAuth with a different provider while keeping
     * the current session. After successful auth, the new identity
     * is linked to the existing preferences.
     * 
     * @param {string} provider - Provider to link ('microsoft', 'google')
     * @returns {Promise<Object>} Linked identity info
     */
    async startLinking(provider) {
        if (this.linkingInProgress) {
            throw new Error('Identity linking already in progress');
        }

        const currentIdentity = this.getCurrentIdentity();
        if (!currentIdentity) {
            throw new Error('Must be authenticated to link identities');
        }

        // Can't link same provider twice
        if (currentIdentity.provider === provider) {
            throw new Error(`Already signed in with ${provider}`);
        }

        // Check if provider already linked
        if (await this.isProviderLinked(provider)) {
            throw new Error(`A ${provider} account is already linked`);
        }

        this.linkingInProgress = true;
        this.pendingLinkProvider = provider;
        this.emit(IdentityLinkingEvents.LINKING_STARTED, { provider });

        try {
            // Store current identity claims for later
            const ownerClaims = this.authService.getCurrentUser()?.idTokenClaims;
            if (!ownerClaims) {
                throw new Error('Cannot get current identity claims');
            }

            // Initiate OAuth flow with the other provider
            // This should open popup/redirect without signing out current user
            const newUser = await this.authService.loginWithProvider(provider, {
                prompt: 'select_account',
                linkingMode: true // Tell auth service we're linking, not switching
            });

            if (!newUser) {
                throw new Error('Link authentication failed');
            }

            const newClaims = newUser.idTokenClaims || newUser;
            
            // Add the new identity to preferences file
            const preferencesManager = getPreferencesManager();
            if (preferencesManager.file) {
                await preferencesManager.file.addLinkedIdentity(ownerClaims, newClaims);
                
                // Save the updated preferences file
                await preferencesManager.save();
            }

            const linkedIdentity = {
                id: this.encryption.getIdentityId(newClaims),
                provider: provider,
                email: newClaims.email,
                name: newClaims.name,
                linkedAt: new Date().toISOString()
            };

            this.emit(IdentityLinkingEvents.IDENTITY_LINKED, linkedIdentity);
            return linkedIdentity;

        } catch (error) {
            this.emit(IdentityLinkingEvents.LINKING_FAILED, { 
                provider, 
                error: error.message 
            });
            throw error;
        } finally {
            this.linkingInProgress = false;
            this.pendingLinkProvider = null;
        }
    }

    /**
     * Remove a linked identity
     * 
     * @param {string} identityId - Identity ID to unlink
     * @returns {Promise<void>}
     */
    async unlinkIdentity(identityId) {
        const currentIdentity = this.getCurrentIdentity();
        if (!currentIdentity) {
            throw new Error('Must be authenticated to unlink identities');
        }

        // Can't unlink the owner identity
        if (identityId === currentIdentity.id) {
            throw new Error('Cannot unlink your primary identity');
        }

        const preferencesManager = getPreferencesManager();
        const file = preferencesManager.file;

        if (!file) {
            throw new Error('No preferences file loaded');
        }

        // Get current owner claims
        const ownerClaims = this.authService.getCurrentUser()?.idTokenClaims;
        if (!ownerClaims) {
            throw new Error('Cannot get current identity claims');
        }

        // Remove the linked identity
        file.removeLinkedIdentity(ownerClaims, identityId);
        
        // Save the updated preferences file
        await preferencesManager.save();

        this.emit(IdentityLinkingEvents.IDENTITY_UNLINKED, { identityId });
    }

    /**
     * Check if current authentication can access a preferences file
     * 
     * @param {PreferencesFile} file - Preferences file to check
     * @returns {boolean} True if current identity can access
     */
    canAccessPreferencesFile(file) {
        const currentIdentity = this.getCurrentIdentity();
        if (!currentIdentity) return false;

        const claims = this.authService.getCurrentUser()?.idTokenClaims;
        if (!claims) return false;

        return file.canDecrypt(claims);
    }

    /**
     * Get display information for linked accounts
     * 
     * @returns {Promise<Object[]>} Array of account display info
     */
    async getLinkedAccountsDisplay() {
        const identities = await this.getLinkedIdentities();
        const currentIdentity = this.getCurrentIdentity();

        return identities.map(identity => ({
            id: identity.id,
            provider: this.getProviderFromId(identity.id),
            isOwner: identity.type === 'owner',
            isCurrent: identity.id === currentIdentity?.id,
            addedAt: identity.addedAt,
            // Provider-specific display
            displayName: this.getProviderDisplayName(identity.id)
        }));
    }

    /**
     * Extract provider from identity ID
     * @private
     */
    getProviderFromId(identityId) {
        const parts = identityId.split('_');
        return parts[0] || 'unknown';
    }

    /**
     * Get display name for provider
     * @private
     */
    getProviderDisplayName(identityId) {
        const provider = this.getProviderFromId(identityId);
        const displayNames = {
            microsoft: 'Microsoft Account',
            google: 'Google Account',
            unknown: 'Unknown Account'
        };
        return displayNames[provider] || displayNames.unknown;
    }

    /**
     * Dispose of the manager
     */
    dispose() {
        this.listeners.clear();
        this.linkingInProgress = false;
        this.pendingLinkProvider = null;
    }
}

/**
 * Singleton instance
 */
let instance = null;

/**
 * Get or create the IdentityLinking instance
 * 
 * @param {Object} authService - Auth service instance
 * @returns {IdentityLinking}
 */
export function getIdentityLinking(authService) {
    if (!instance && authService) {
        instance = new IdentityLinking(authService);
    }
    return instance;
}
