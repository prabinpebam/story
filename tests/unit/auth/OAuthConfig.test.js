/**
 * OAuthConfig Unit Tests
 * 
 * Tests OAuth configuration loading and validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OAuthConfig } from '../../../src/core/auth/config/OAuthConfig.js';

describe('OAuthConfig', () => {
    beforeEach(() => {
        // Manually inject test client IDs since import.meta.env is evaluated at module load
        OAuthConfig.microsoft.clientId = 'test-microsoft-client-id';
        OAuthConfig.google.clientId = 'test-google-client-id';
    });

    describe('microsoft config', () => {
        it('should have correct microsoft configuration', () => {
            const config = OAuthConfig.microsoft;
            
            expect(config.authority).toBe('https://login.microsoftonline.com/common');
            expect(config.scopes).toContain('openid');
            expect(config.scopes).toContain('profile');
            expect(config.scopes).toContain('email');
            expect(config.scopes).toContain('User.Read');
            expect(config.responseType).toBe('code');
        });
        
        it('should have correct redirect URI', () => {
            const config = OAuthConfig.microsoft;
            expect(config.redirectUri).toContain('/auth/callback');
        });
    });
    
    describe('google config', () => {
        it('should have correct google configuration', () => {
            const config = OAuthConfig.google;
            
            expect(config.authorizationEndpoint).toBe('https://accounts.google.com/o/oauth2/v2/auth');
            expect(config.tokenEndpoint).toBe('https://oauth2.googleapis.com/token');
            expect(config.scopes).toContain('openid');
            expect(config.scopes).toContain('profile');
            expect(config.scopes).toContain('email');
            expect(config.responseType).toBe('code');
        });
    });
    
    describe('getProviderConfig', () => {
        it('should return config for microsoft', () => {
            const config = OAuthConfig.getProviderConfig('microsoft');
            expect(config).toBeDefined();
            expect(config.authority).toBeTruthy();
        });
        
        it('should return config for google', () => {
            const config = OAuthConfig.getProviderConfig('google');
            expect(config).toBeDefined();
            expect(config.authorizationEndpoint).toBeTruthy();
        });
        
        it('should throw error for unsupported provider', () => {
            expect(() => {
                OAuthConfig.getProviderConfig('facebook');
            }).toThrow('Unsupported OAuth provider: facebook');
        });
        
        it('should throw error if client ID missing', () => {
            // Create a temporary config with missing client ID
            const originalClientId = OAuthConfig.microsoft.clientId;
            OAuthConfig.microsoft.clientId = '';
            
            expect(() => {
                OAuthConfig.getProviderConfig('microsoft');
            }).toThrow('Missing client ID for microsoft');
            
            // Restore
            OAuthConfig.microsoft.clientId = originalClientId;
        });
    });
    
    describe('validate', () => {
        it('should return valid when all providers configured', () => {
            const result = OAuthConfig.validate();
            
            expect(result.isValid).toBe(true);
            expect(result.providers.microsoft).toBe(true);
            expect(result.providers.google).toBe(true);
        });
        
        it('should return warnings for missing configurations', () => {
            // Save original
            const originalMsId = OAuthConfig.microsoft.clientId;
            const originalGoogleId = OAuthConfig.google.clientId;
            
            // Test with missing configs
            OAuthConfig.microsoft.clientId = '';
            OAuthConfig.google.clientId = '';
            
            const result = OAuthConfig.validate();
            
            expect(result.isValid).toBe(false);
            expect(result.warnings.length).toBe(2);
            expect(result.providers.microsoft).toBe(false);
            expect(result.providers.google).toBe(false);
            
            // Restore
            OAuthConfig.microsoft.clientId = originalMsId;
            OAuthConfig.google.clientId = originalGoogleId;
        });
        
        it('should be valid with at least one provider', () => {
            const originalGoogleId = OAuthConfig.google.clientId;
            OAuthConfig.google.clientId = '';
            
            const result = OAuthConfig.validate();
            
            expect(result.isValid).toBe(true); // Microsoft still configured
            expect(result.warnings.length).toBe(1);
            
            OAuthConfig.google.clientId = originalGoogleId;
        });
    });
});
