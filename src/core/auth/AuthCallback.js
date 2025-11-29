/**
 * Auth Callback Handler
 * 
 * Handles OAuth redirect callbacks.
 * Should be called when app loads on /auth/callback route.
 * 
 * @module core/auth/AuthCallback
 */

import { authService } from './AuthService.js';
import { store } from '../Store.js';

const RETURN_URL_KEY = 'auth_return_url';

/**
 * Check if current URL is an auth callback
 * @returns {boolean}
 */
export function isAuthCallback() {
    return window.location.pathname === '/auth/callback' ||
           window.location.pathname.includes('/auth/callback');
}

/**
 * Handle auth callback and redirect to app
 * @returns {Promise<Object>} User profile on success
 * @throws {Error} On auth failure
 */
export async function handleAuthCallback() {
    if (!isAuthCallback()) {
        throw new Error('Not on auth callback URL');
    }

    // Show loading state
    store.dispatch('AUTH_LOGIN_START');

    try {
        const profile = await authService.handleCallback();
        
        // Update store with user info
        store.dispatch('AUTH_LOGIN_SUCCESS', profile);
        
        // Trigger re-render
        window.dispatchEvent(new CustomEvent('story:auth-complete', { detail: profile }));
        
        return profile;

    } catch (error) {
        console.error('Auth callback failed:', error);
        store.dispatch('AUTH_LOGIN_FAILURE', error.message);
        throw error;
    }
}

/**
 * Store return URL before OAuth redirect
 * @param {string} [url=window.location.pathname] - URL to return to after auth
 */
export function storeReturnUrl(url = window.location.pathname) {
    sessionStorage.setItem(RETURN_URL_KEY, url);
}

/**
 * Get stored return URL
 * @returns {string|null}
 */
export function getReturnUrl() {
    return sessionStorage.getItem(RETURN_URL_KEY);
}

/**
 * Clear stored return URL
 */
export function clearReturnUrl() {
    sessionStorage.removeItem(RETURN_URL_KEY);
}
