/**
 * Abstract Auth Provider
 * 
 * Base class for OAuth providers.
 * Defines the interface for authentication flows.
 * 
 * @module core/auth/providers/AuthProvider
 * @abstract
 */
export class AuthProvider {
    /**
     * @param {Object} config - Provider configuration
     */
    constructor(config) {
        if (new.target === AuthProvider) {
            throw new Error('Cannot instantiate abstract class AuthProvider');
        }
        this.config = config;
    }

    /**
     * Initiate login flow
     * @returns {Promise<void>}
     * @abstract
     */
    async login() {
        throw new Error('Method login() must be implemented');
    }

    /**
     * Handle auth callback and exchange code for tokens
     * @param {string} code - Authorization code
     * @param {string} codeVerifier - PKCE code verifier
     * @returns {Promise<Object>} Token response
     * @abstract
     */
    async handleCallback(code, codeVerifier) {
        throw new Error('Method handleCallback() must be implemented');
    }

    /**
     * Refresh access token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} New token response
     * @abstract
     */
    async refreshTokens(refreshToken) {
        throw new Error('Method refreshTokens() must be implemented');
    }

    /**
     * Get user profile
     * @param {string} accessToken - Access token
     * @returns {Promise<Object>} User profile
     * @abstract
     */
    async getUserProfile(accessToken) {
        throw new Error('Method getUserProfile() must be implemented');
    }

    /**
     * Revoke tokens (logout)
     * @param {string} accessToken - Access token
     * @returns {Promise<void>}
     */
    async logout(accessToken) {
        // Default implementation: do nothing (some providers don't support revocation)
        return Promise.resolve();
    }
}
