/**
 * Token Storage Manager
 * 
 * Securely stores and manages OAuth tokens in localStorage.
 * Handles token expiration and refresh logic.
 * Syncs tokens across browser tabs using BroadcastChannel.
 * 
 * @module core/auth/storage/TokenStorage
 */

const STORAGE_PREFIX = 'story_auth_';
const TOKEN_KEYS = {
    ACCESS_TOKEN: `${STORAGE_PREFIX}access_token`,
    REFRESH_TOKEN: `${STORAGE_PREFIX}refresh_token`,
    EXPIRES_AT: `${STORAGE_PREFIX}expires_at`,
    PROVIDER: `${STORAGE_PREFIX}provider`,
    USER_PROFILE: `${STORAGE_PREFIX}user_profile`
};

/**
 * Token Storage Manager
 */
export class TokenStorage {
    constructor() {
        this.channel = new BroadcastChannel('story_auth_sync');
        this.listeners = new Set();
        this.setupChannelListener();
    }

    /**
     * Setup BroadcastChannel listener for multi-tab sync
     * @private
     */
    setupChannelListener() {
        this.channel.onmessage = (event) => {
            const { type, data } = event.data;
            
            if (type === 'TOKEN_UPDATED' || type === 'TOKEN_CLEARED') {
                // Notify all listeners about token change from another tab
                this.listeners.forEach(callback => callback(type, data));
            }
        };
    }

    /**
     * Store authentication tokens
     * @param {Object} tokens - Token data
     * @param {string} tokens.accessToken - Access token
     * @param {string} tokens.refreshToken - Refresh token
     * @param {number} tokens.expiresIn - Expiration time in seconds
     * @param {string} tokens.provider - OAuth provider ('microsoft' or 'google')
     */
    setTokens({ accessToken, refreshToken, expiresIn, provider }) {
        const expiresAt = Date.now() + (expiresIn * 1000);
        
        localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(TOKEN_KEYS.EXPIRES_AT, expiresAt.toString());
        localStorage.setItem(TOKEN_KEYS.PROVIDER, provider);
        
        if (refreshToken) {
            localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
        }
        
        // Notify other tabs
        this.channel.postMessage({
            type: 'TOKEN_UPDATED',
            data: { provider, expiresAt }
        });
    }

    /**
     * Get access token if valid
     * @returns {string|null} Access token or null if expired/missing
     */
    getAccessToken() {
        const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
        const expiresAt = localStorage.getItem(TOKEN_KEYS.EXPIRES_AT);
        
        if (!token || !expiresAt) {
            return null;
        }
        
        // Check if token is expired (with 5 minute buffer)
        const bufferMs = 5 * 60 * 1000;
        if (Date.now() + bufferMs >= parseInt(expiresAt)) {
            return null;
        }
        
        return token;
    }

    /**
     * Get refresh token
     * @returns {string|null} Refresh token or null if missing
     */
    getRefreshToken() {
        return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    }

    /**
     * Get token expiration time
     * @returns {number|null} Expiration timestamp or null
     */
    getExpiresAt() {
        const expiresAt = localStorage.getItem(TOKEN_KEYS.EXPIRES_AT);
        return expiresAt ? parseInt(expiresAt) : null;
    }

    /**
     * Get OAuth provider
     * @returns {string|null} Provider name or null
     */
    getProvider() {
        return localStorage.getItem(TOKEN_KEYS.PROVIDER);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if valid access token exists
     */
    isAuthenticated() {
        return this.getAccessToken() !== null;
    }

    /**
     * Check if token needs refresh (within 10 minutes of expiry)
     * @returns {boolean} True if refresh needed
     */
    needsRefresh() {
        const expiresAt = this.getExpiresAt();
        if (!expiresAt) return false;
        
        const refreshThresholdMs = 10 * 60 * 1000; // 10 minutes
        return Date.now() + refreshThresholdMs >= expiresAt;
    }

    /**
     * Store user profile data
     * @param {Object} profile - User profile data
     */
    setUserProfile(profile) {
        localStorage.setItem(TOKEN_KEYS.USER_PROFILE, JSON.stringify(profile));
    }

    /**
     * Get user profile data
     * @returns {Object|null} User profile or null
     */
    getUserProfile() {
        const profile = localStorage.getItem(TOKEN_KEYS.USER_PROFILE);
        return profile ? JSON.parse(profile) : null;
    }

    /**
     * Clear all authentication data
     */
    clear() {
        Object.values(TOKEN_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Notify other tabs
        this.channel.postMessage({
            type: 'TOKEN_CLEARED',
            data: null
        });
    }

    /**
     * Listen for token changes (from other tabs)
     * @param {Function} callback - Callback(type, data)
     * @returns {Function} Unsubscribe function
     */
    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.channel.close();
        this.listeners.clear();
    }
}

// Singleton instance
export const tokenStorage = new TokenStorage();
