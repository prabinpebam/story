import { AuthProvider } from './AuthProvider.js';
import { generateCodeVerifier, generateCodeChallenge, generateState, storePKCEParams } from '../utils/PKCEUtils.js';

/**
 * Microsoft OAuth Provider
 * 
 * Implements authentication with Azure Active Directory (Microsoft Identity Platform).
 * 
 * @module core/auth/providers/MicrosoftProvider
 * @extends AuthProvider
 */
export class MicrosoftProvider extends AuthProvider {
    constructor(config) {
        super(config);
        this.endpoints = {
            auth: `${config.authority}/oauth2/v2.0/authorize`,
            token: `${config.authority}/oauth2/v2.0/token`,
            graph: 'https://graph.microsoft.com/v1.0'
        };
    }

    /**
     * Initiate login flow
     * Redirects user to Microsoft login page
     */
    async login() {
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const state = generateState();

        // Store PKCE params for verification after redirect
        storePKCEParams({
            codeVerifier,
            state,
            provider: 'microsoft'
        });

        const params = new URLSearchParams({
            client_id: this.config.clientId,
            response_type: this.config.responseType,
            redirect_uri: this.config.redirectUri,
            scope: this.config.scopes.join(' '),
            response_mode: this.config.responseMode,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state: state,
            prompt: this.config.prompt
        });

        window.location.href = `${this.endpoints.auth}?${params.toString()}`;
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
            scope: this.config.scopes.join(' '),
            code: code,
            redirect_uri: this.config.redirectUri,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier
        });

        const response = await fetch(this.endpoints.token, {
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
            scope: this.config.scopes.join(' '),
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            redirect_uri: this.config.redirectUri
        });

        const response = await fetch(this.endpoints.token, {
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
     * Get user profile from Microsoft Graph
     * @param {string} accessToken - Access token
     * @returns {Promise<Object>} User profile
     */
    async getUserProfile(accessToken) {
        const response = await fetch(`${this.endpoints.graph}/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        
        // Normalize profile structure
        return {
            id: data.id,
            name: data.displayName,
            email: data.mail || data.userPrincipalName,
            provider: 'microsoft',
            avatar: null // Avatar requires a separate call to /me/photo/$value
        };
    }
}
