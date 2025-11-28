import { AuthProvider } from './AuthProvider.js';
import { generateCodeVerifier, generateCodeChallenge, generateState, storePKCEParams } from '../utils/PKCEUtils.js';

/**
 * Google OAuth Provider
 * 
 * Implements authentication with Google Identity Services.
 * 
 * @module core/auth/providers/GoogleProvider
 * @extends AuthProvider
 */
export class GoogleProvider extends AuthProvider {
    constructor(config) {
        super(config);
    }

    /**
     * Initiate login flow
     * Redirects user to Google login page
     */
    async login() {
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const state = generateState();

        storePKCEParams({
            codeVerifier,
            state,
            provider: 'google'
        });

        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            response_type: this.config.responseType,
            scope: this.config.scopes.join(' '),
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state: state,
            prompt: this.config.prompt,
            access_type: 'offline' // Required for refresh token
        });

        window.location.href = `${this.config.authorizationEndpoint}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for tokens
     * @param {string} code - Authorization code
     * @param {string} codeVerifier - PKCE code verifier
     * @returns {Promise<Object>} Token response
     */
    async handleCallback(code, codeVerifier) {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            code: code,
            redirect_uri: this.config.redirectUri,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier
        });

        const response = await fetch(this.config.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error_description || 'Failed to exchange code for token');
        }

        return response.json();
    }

    /**
     * Refresh access token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} New token response
     */
    async refreshTokens(refreshToken) {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        });

        const response = await fetch(this.config.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        return response.json();
    }

    /**
     * Get user profile from Google
     * @param {string} accessToken - Access token
     * @returns {Promise<Object>} User profile
     */
    async getUserProfile(accessToken) {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        
        return {
            id: data.sub,
            name: data.name,
            email: data.email,
            provider: 'google',
            avatar: data.picture
        };
    }

    /**
     * Revoke tokens (logout)
     * @param {string} accessToken - Access token
     */
    async logout(accessToken) {
        // Google supports token revocation
        try {
            await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
        } catch (e) {
            console.warn('Failed to revoke Google token', e);
        }
    }
}
