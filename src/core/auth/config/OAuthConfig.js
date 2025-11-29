/**
 * OAuth Configuration
 * 
 * Centralizes OAuth provider settings and client IDs.
 * Uses environment variables for security when available.
 * 
 * @module core/auth/config/OAuthConfig
 */

/**
 * Safely get environment variable
 * Works with Vite, or falls back to empty string for non-bundled environments
 */
function getEnvVar(name) {
    try {
        // Check if import.meta.env exists (Vite environment)
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            return import.meta.env[name] || '';
        }
    } catch (e) {
        // Ignore - not in Vite environment
    }
    
    // Check for window-based config (can be set by a config script)
    if (typeof window !== 'undefined' && window.__OAUTH_CONFIG__) {
        const key = name.replace('VITE_', '');
        return window.__OAUTH_CONFIG__[key] || '';
    }
    
    return '';
}

/**
 * OAuth Provider Configuration
 */
export const OAuthConfig = {
    /**
     * Microsoft OAuth Configuration
     */
    microsoft: {
        clientId: getEnvVar('VITE_MICROSOFT_CLIENT_ID'),
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: `${window.location.origin}/auth/callback`,
        scopes: [
            'openid',
            'profile',
            'email',
            'User.Read',
            'Files.ReadWrite.All' // For OneDrive integration
        ],
        responseType: 'code',
        responseMode: 'query',
        prompt: 'select_account'
    },

    /**
     * Google OAuth Configuration
     */
    google: {
        clientId: getEnvVar('VITE_GOOGLE_CLIENT_ID'),
        apiKey: getEnvVar('VITE_GOOGLE_API_KEY'),
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        redirectUri: `${window.location.origin}/auth/callback`,
        scopes: [
            'openid',
            'profile',
            'email',
            'https://www.googleapis.com/auth/drive.file' // For Google Drive integration
        ],
        responseType: 'code',
        prompt: 'select_account'
    },

    /**
     * Get configuration for a specific provider
     * @param {string} provider - 'microsoft' or 'google'
     * @returns {Object} Provider configuration
     * @throws {Error} If provider is unsupported
     */
    getProviderConfig(provider) {
        const config = this[provider];
        if (!config) {
            throw new Error(`Unsupported OAuth provider: ${provider}`);
        }
        
        if (!config.clientId) {
            throw new Error(`Missing client ID for ${provider}. Please set VITE_${provider.toUpperCase()}_CLIENT_ID in .env file.`);
        }
        
        return config;
    },

    /**
     * Validate configuration on app start
     * @returns {Object} Validation result with warnings
     */
    validate() {
        const warnings = [];
        
        if (!this.microsoft.clientId) {
            warnings.push('Microsoft OAuth not configured: VITE_MICROSOFT_CLIENT_ID missing');
        }
        
        if (!this.google.clientId) {
            warnings.push('Google OAuth not configured: VITE_GOOGLE_CLIENT_ID missing');
        }
        
        return {
            isValid: warnings.length < 2, // At least one provider must be configured
            warnings,
            providers: {
                microsoft: !!this.microsoft.clientId,
                google: !!this.google.clientId
            }
        };
    }
};
