import { OAuthConfig } from './config/OAuthConfig.js';
import { tokenStorage } from './storage/TokenStorage.js';
import { MicrosoftProvider } from './providers/MicrosoftProvider.js';
import { GoogleProvider } from './providers/GoogleProvider.js';
import { getPKCEParams, clearPKCEParams, validateState } from './utils/PKCEUtils.js';

/**
 * Authentication Service
 * 
 * Orchestrates authentication flows, manages providers, and handles session state.
 * Singleton instance.
 * 
 * @module core/auth/AuthService
 */
class AuthService {
    constructor() {
        this.providers = {};
        this.initialized = false;
    }

    /**
     * Initialize auth service
     * Validates config and sets up providers.
     */
    init() {
        if (this.initialized) return;

        const validation = OAuthConfig.validate();
        if (!validation.isValid) {
            console.warn('Auth configuration invalid:', validation.warnings);
        }

        if (validation.providers.microsoft) {
            this.providers.microsoft = new MicrosoftProvider(OAuthConfig.getProviderConfig('microsoft'));
        }

        if (validation.providers.google) {
            this.providers.google = new GoogleProvider(OAuthConfig.getProviderConfig('google'));
        }

        this.initialized = true;
    }

    /**
     * Start login flow for a provider
     * @param {string} providerName - 'microsoft' or 'google'
     * @returns {Promise<void>}
     */
    async login(providerName) {
        this.ensureInitialized();
        
        const provider = this.providers[providerName];
        if (!provider) {
            throw new Error(`Provider ${providerName} not configured`);
        }

        await provider.login();
    }

    /**
     * Handle OAuth callback
     * Supports both authorization code flow and implicit flow
     * Should be called when app loads on /auth/callback route
     * @returns {Promise<Object>} User profile
     */
    async handleCallback() {
        this.ensureInitialized();

        // Check for errors in both query params and hash
        const urlParams = new URLSearchParams(window.location.search || '');
        const hash = window.location.hash || '';
        const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
        
        const error = urlParams.get('error') || hashParams.get('error');
        if (error) {
            const description = urlParams.get('error_description') || hashParams.get('error_description');
            throw new Error(`Auth error: ${error} - ${description}`);
        }

        // Detect flow type
        const code = urlParams.get('code');
        const accessTokenInHash = hashParams.get('access_token');
        const state = urlParams.get('state') || hashParams.get('state');

        if (!state) {
            throw new Error('Missing state in callback URL');
        }

        // Verify PKCE/state params
        const pkceParams = getPKCEParams();
        if (!pkceParams) {
            throw new Error('No PKCE parameters found. Session may have expired.');
        }

        if (!validateState(state, pkceParams.state)) {
            throw new Error('Invalid state parameter. Possible CSRF attack.');
        }

        const provider = this.providers[pkceParams.provider];
        if (!provider) {
            throw new Error(`Provider ${pkceParams.provider} not found`);
        }

        try {
            let tokenResponse;
            
            if (accessTokenInHash) {
                // Implicit flow - tokens are already in the URL hash
                tokenResponse = await provider.handleCallback(null, null);
            } else if (code) {
                // Authorization code flow - exchange code for tokens
                tokenResponse = await provider.handleCallback(code, pkceParams.codeVerifier);
            } else {
                throw new Error('No authorization code or access token found in callback');
            }
            
            // Store tokens
            tokenStorage.setTokens({
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token,
                expiresIn: tokenResponse.expires_in,
                provider: pkceParams.provider
            });

            // Fetch user profile
            const profile = await provider.getUserProfile(tokenResponse.access_token);
            tokenStorage.setUserProfile(profile);

            // Cleanup
            clearPKCEParams();

            return profile;
        } catch (err) {
            console.error('Auth callback failed:', err);
            throw err;
        }
    }

    /**
     * Logout current user
     * @returns {Promise<void>}
     */
    async logout() {
        const providerName = tokenStorage.getProvider();
        const accessToken = tokenStorage.getAccessToken();

        if (providerName && accessToken) {
            const provider = this.providers[providerName];
            if (provider) {
                await provider.logout(accessToken);
            }
        }

        tokenStorage.clear();
        window.location.href = '/';
    }

    /**
     * Get valid access token (refreshes if needed)
     * @returns {Promise<string|null>} Access token
     */
    async getAccessToken() {
        if (!tokenStorage.isAuthenticated()) {
            return null;
        }

        if (tokenStorage.needsRefresh()) {
            await this.refreshSession();
        }

        return tokenStorage.getAccessToken();
    }

    /**
     * Refresh current session
     * @returns {Promise<void>}
     */
    async refreshSession() {
        this.ensureInitialized();

        const refreshToken = tokenStorage.getRefreshToken();
        const providerName = tokenStorage.getProvider();

        if (!refreshToken || !providerName) {
            throw new Error('No session to refresh');
        }

        const provider = this.providers[providerName];
        if (!provider) {
            throw new Error(`Provider ${providerName} not available`);
        }

        try {
            const tokenResponse = await provider.refreshTokens(refreshToken);
            
            tokenStorage.setTokens({
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token || refreshToken, // Some providers don't rotate refresh tokens
                expiresIn: tokenResponse.expires_in,
                provider: providerName
            });
        } catch (err) {
            console.error('Token refresh failed:', err);
            tokenStorage.clear(); // Force logout on refresh failure
            throw err;
        }
    }

    /**
     * Get current user profile
     * @returns {Object|null}
     */
    getUser() {
        return tokenStorage.getUserProfile();
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return tokenStorage.isAuthenticated();
    }

    /**
     * Get available providers and configuration status
     * @returns {{isValid: boolean, providers: {microsoft: boolean, google: boolean}}}
     */
    getConfigValidation() {
        return OAuthConfig.validate();
    }

    /**
     * Check if a specific provider is available
     * @param {string} providerName - 'microsoft' or 'google'
     * @returns {boolean}
     */
    isProviderAvailable(providerName) {
        this.ensureInitialized();
        return !!this.providers[providerName];
    }

    /**
     * Ensure service is initialized
     * @private
     */
    ensureInitialized() {
        if (!this.initialized) {
            this.init();
        }
    }
}

export const authService = new AuthService();
