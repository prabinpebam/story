/**
 * OAuth Configuration
 * 
 * Centralizes OAuth provider settings and client IDs.
 * Uses environment variables for security.
 * 
 * @module core/auth/config/OAuthConfig
 */

/**
 * OAuth Provider Configuration
 */
export const OAuthConfig = {
    /**
     * Microsoft OAuth Configuration
     */
    microsoft: {
        clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
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
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
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
