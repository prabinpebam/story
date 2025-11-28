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
 * @returns {Promise<void>}
 */
export async function handleAuthCallback() {
    if (!isAuthCallback()) {
        return;
    }

    // Show loading state
    store.dispatch('AUTH_LOGIN_START');

    try {
        const profile = await authService.handleCallback();
        
        // Update store with user info
        store.dispatch('AUTH_LOGIN_SUCCESS', profile);

        // Clear URL parameters and redirect to main app
        const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
        sessionStorage.removeItem('auth_return_url');
        
        // Use replaceState to avoid back button going to callback URL
        window.history.replaceState({}, '', returnUrl);
        
        // Trigger re-render
        window.dispatchEvent(new CustomEvent('story:auth-complete', { detail: profile }));

    } catch (error) {
        console.error('Auth callback failed:', error);
        store.dispatch('AUTH_LOGIN_FAILURE', error.message);
        
        // Redirect to main app with error
        window.history.replaceState({}, '', '/?auth_error=' + encodeURIComponent(error.message));
    }
}

/**
 * Store return URL before OAuth redirect
 */
export function storeReturnUrl() {
    sessionStorage.setItem('auth_return_url', window.location.pathname);
}
