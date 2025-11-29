import { AuthProvider } from './AuthProvider.js';
import { generateCodeVerifier, generateCodeChallenge, generateState, storePKCEParams } from '../utils/PKCEUtils.js';

/**
 * Google OAuth Provider
 * 
 * Implements authentication with Google Identity Services.
 * Uses implicit flow with ID token for SPAs (no client_secret required).
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
     * Uses implicit flow (response_type=token id_token) for SPAs
     * This avoids the need for client_secret
     */
    async login() {
        const state = generateState();
        const nonce = generateState(); // Use state generator for nonce too

        // Store state for validation
        storePKCEParams({
            codeVerifier: nonce, // Store nonce as verifier for consistency
            state,
            provider: 'google'
        });

        // Use implicit flow for SPAs - returns tokens directly in URL fragment
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            response_type: 'token id_token', // Implicit flow - get tokens directly
            scope: this.config.scopes.join(' '),
            state: state,
            nonce: nonce, // Required for id_token
            prompt: this.config.prompt
        });

        window.location.href = `${this.config.authorizationEndpoint}?${params.toString()}`;
    }

    /**
     * Handle OAuth callback - for implicit flow, tokens are in URL fragment
     * @param {string} code - Not used for implicit flow
     * @param {string} codeVerifier - Not used for implicit flow  
     * @returns {Promise<Object>} Token response
     */
    async handleCallback(code, codeVerifier) {
        // For implicit flow, tokens are in the URL hash fragment, not query params
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const idToken = params.get('id_token');
        const expiresIn = params.get('expires_in');
        const error = params.get('error');
        
        if (error) {
            throw new Error(params.get('error_description') || error);
        }
        
        if (!accessToken) {
            // Fallback: Maybe it's authorization code flow, try the old way
            // This happens if somehow we got here via code flow
            throw new Error('No access token in callback. Google OAuth requires implicit flow for SPAs.');
        }

        return {
            access_token: accessToken,
            id_token: idToken,
            expires_in: parseInt(expiresIn, 10) || 3600,
            token_type: 'Bearer'
            // Note: Implicit flow does not provide refresh_token
        };
    }

    /**
     * Refresh access token
     * Note: Implicit flow doesn't support refresh tokens
     * User will need to re-authenticate
     * @param {string} refreshToken - Refresh token (not available in implicit flow)
     * @returns {Promise<Object>} New token response
     */
    async refreshTokens(refreshToken) {
        // Implicit flow doesn't support refresh tokens
        // Throw an error to trigger re-authentication
        throw new Error('Session expired. Please sign in again.');
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

