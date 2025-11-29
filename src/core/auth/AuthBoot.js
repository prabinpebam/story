/**
 * AuthBoot
 * 
 * Handles authentication flow during app startup:
 * 1. Detects if this is an OAuth callback
 * 2. Restores existing session from storage
 * 3. Initializes AuthService
 * 
 * Must be called before the main app initializes.
 */

import { authService } from './AuthService.js';
import { isAuthCallback, handleAuthCallback, storeReturnUrl, getReturnUrl, clearReturnUrl } from './AuthCallback.js';
import { tokenStorage } from './storage/TokenStorage.js';

/**
 * Boot result indicating auth state
 * @typedef {Object} AuthBootResult
 * @property {boolean} isAuthenticated - Whether user is authenticated
 * @property {boolean} wasCallback - Whether this was an OAuth callback
 * @property {Object|null} user - User profile if authenticated
 * @property {string|null} returnUrl - URL to return to after auth
 * @property {Error|null} error - Error if auth failed
 */

/**
 * Initialize authentication on app boot
 * @returns {Promise<AuthBootResult>}
 */
export async function bootAuth() {
    const result = {
        isAuthenticated: false,
        wasCallback: false,
        user: null,
        returnUrl: null,
        error: null
    };

    try {
        // First, initialize the auth service
        authService.init();

        // Check if this is an OAuth callback
        if (isAuthCallback()) {
            result.wasCallback = true;
            
            try {
                // Handle the callback
                const user = await handleAuthCallback();
                result.isAuthenticated = true;
                result.user = user;
                result.returnUrl = getReturnUrl();
                
                // Clear URL parameters and navigate to return URL
                clearCallbackUrl();
                
                // Dispatch auth success event
                window.dispatchEvent(new CustomEvent('story:auth-success', {
                    detail: { user }
                }));
            } catch (error) {
                result.error = error;
                console.error('OAuth callback failed:', error);
                
                // Dispatch auth error event
                window.dispatchEvent(new CustomEvent('story:auth-error', {
                    detail: { error: error.message }
                }));
            }
        } else {
            // Check for existing session
            const existingSession = await restoreSession();
            if (existingSession) {
                result.isAuthenticated = true;
                result.user = existingSession;
            }
        }
    } catch (error) {
        result.error = error;
        console.error('Auth boot failed:', error);
    }

    return result;
}

/**
 * Attempt to restore an existing session from storage
 * @returns {Promise<Object|null>} User profile if session restored, null otherwise
 */
async function restoreSession() {
    // Check if we have stored tokens
    if (!tokenStorage.isAuthenticated()) {
        return null;
    }

    // Check if tokens need refresh
    if (tokenStorage.needsRefresh()) {
        try {
            // Try to refresh
            const refreshToken = tokenStorage.getRefreshToken();
            const provider = tokenStorage.getProvider();
            
            if (!refreshToken || !provider) {
                // Can't refresh, clear and return
                tokenStorage.clear();
                return null;
            }

            // Refresh the session
            await authService.refreshSession();
        } catch (error) {
            console.warn('Session refresh failed, user needs to re-authenticate:', error);
            tokenStorage.clear();
            return null;
        }
    }

    // Return the stored user profile
    return tokenStorage.getUserProfile();
}

/**
 * Clear OAuth callback parameters from URL
 * Preserves the base URL without query params
 */
function clearCallbackUrl() {
    const returnUrl = getReturnUrl();
    clearReturnUrl();
    
    // Clean URL - remove OAuth params
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    url.searchParams.delete('error_description');
    
    // Use replaceState to avoid adding to history
    const cleanUrl = returnUrl || url.pathname;
    window.history.replaceState({}, '', cleanUrl);
}

/**
 * Store current URL before redirecting to OAuth
 * Should be called before initiating login
 */
export function preserveCurrentUrl() {
    storeReturnUrl(window.location.href);
}

/**
 * Check if OAuth providers are configured
 * Useful for UI to show appropriate options
 * @returns {{microsoft: boolean, google: boolean}}
 */
export function getConfiguredProviders() {
    const validation = authService.getConfigValidation?.() || { providers: null };
    const providers = validation.providers;
    if (!providers || Object.keys(providers).length === 0) {
        return { microsoft: false, google: false };
    }
    return providers;
}

/**
 * Quick check if user is currently authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
    return tokenStorage.isAuthenticated();
}

/**
 * Get current user without full validation
 * @returns {Object|null}
 */
export function getCurrentUser() {
    return tokenStorage.getUserProfile();
}

// Export for use in main.js
export default {
    bootAuth,
    preserveCurrentUrl,
    getConfiguredProviders,
    isAuthenticated,
    getCurrentUser
};
