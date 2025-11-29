/**
 * Auth Module Index
 * 
 * Exports all authentication-related modules.
 */

export { authService } from './AuthService.js';
export { tokenStorage } from './storage/TokenStorage.js';
export { OAuthConfig } from './config/OAuthConfig.js';
export { isAuthCallback, handleAuthCallback, storeReturnUrl, getReturnUrl, clearReturnUrl } from './AuthCallback.js';
export { 
    bootAuth, 
    preserveCurrentUrl, 
    getConfiguredProviders, 
    isAuthenticated, 
    getCurrentUser 
} from './AuthBoot.js';
export * from './utils/PKCEUtils.js';
