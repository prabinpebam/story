/**
 * PKCE Utilities
 * 
 * Implements Proof Key for Code Exchange (RFC 7636) for OAuth 2.0.
 * Provides secure code verifier and challenge generation.
 * 
 * @module core/auth/utils/PKCEUtils
 */

/**
 * Generate a cryptographically random code verifier
 * @returns {string} Base64URL encoded code verifier (43-128 characters)
 */
export function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64URLEncode(array);
}

/**
 * Generate code challenge from verifier using SHA-256
 * @param {string} verifier - Code verifier
 * @returns {Promise<string>} Base64URL encoded code challenge
 */
export async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64URLEncode(new Uint8Array(hash));
}

/**
 * Generate a random state parameter for CSRF protection
 * @returns {string} Random state string
 */
export function generateState() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return base64URLEncode(array);
}

/**
 * Encode array buffer to Base64URL format
 * @param {Uint8Array} buffer - Buffer to encode
 * @returns {string} Base64URL encoded string
 * @private
 */
function base64URLEncode(buffer) {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Store PKCE parameters in sessionStorage for OAuth callback
 * @param {Object} params - PKCE parameters
 * @param {string} params.codeVerifier - Code verifier
 * @param {string} params.state - State parameter
 * @param {string} params.provider - OAuth provider
 */
export function storePKCEParams({ codeVerifier, state, provider }) {
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('pkce_state', state);
    sessionStorage.setItem('pkce_provider', provider);
}

/**
 * Retrieve PKCE parameters from sessionStorage
 * @returns {Object|null} PKCE parameters or null if not found
 */
export function getPKCEParams() {
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
    const state = sessionStorage.getItem('pkce_state');
    const provider = sessionStorage.getItem('pkce_provider');
    
    if (!codeVerifier || !state || !provider) {
        return null;
    }
    
    return { codeVerifier, state, provider };
}

/**
 * Clear PKCE parameters from sessionStorage
 */
export function clearPKCEParams() {
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('pkce_state');
    sessionStorage.removeItem('pkce_provider');
}

/**
 * Validate state parameter to prevent CSRF attacks
 * @param {string} receivedState - State from OAuth callback
 * @param {string} storedState - State from session storage
 * @returns {boolean} True if states match
 */
export function validateState(receivedState, storedState) {
    return receivedState === storedState;
}
