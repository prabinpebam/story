/**
 * AuthService Unit Tests
 * 
 * Tests authentication orchestration, login flow, callback handling, and session management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../../../src/core/auth/AuthService.js';
import { tokenStorage } from '../../../src/core/auth/storage/TokenStorage.js';
import { OAuthConfig } from '../../../src/core/auth/config/OAuthConfig.js';
import * as PKCEUtils from '../../../src/core/auth/utils/PKCEUtils.js';

// Mock dependencies
vi.mock('../../../src/core/auth/storage/TokenStorage.js', () => ({
    tokenStorage: {
        setTokens: vi.fn(),
        setUserProfile: vi.fn(),
        getAccessToken: vi.fn(),
        getRefreshToken: vi.fn(),
        getProvider: vi.fn(),
        getUserProfile: vi.fn(),
        isAuthenticated: vi.fn(),
        needsRefresh: vi.fn(),
        clear: vi.fn()
    }
}));

vi.mock('../../../src/core/auth/config/OAuthConfig.js', () => ({
    OAuthConfig: {
        validate: vi.fn(() => ({ isValid: true, providers: { microsoft: true, google: true } })),
        getProviderConfig: vi.fn((provider) => ({ clientId: 'test', provider }))
    }
}));

vi.mock('../../../src/core/auth/utils/PKCEUtils.js', () => ({
    getPKCEParams: vi.fn(),
    clearPKCEParams: vi.fn(),
    validateState: vi.fn()
}));

// Mock Providers
const mockMicrosoftProvider = {
    login: vi.fn(),
    handleCallback: vi.fn(),
    getUserProfile: vi.fn(),
    refreshTokens: vi.fn(),
    logout: vi.fn()
};

const mockGoogleProvider = {
    login: vi.fn(),
    handleCallback: vi.fn(),
    getUserProfile: vi.fn(),
    refreshTokens: vi.fn(),
    logout: vi.fn()
};

vi.mock('../../../src/core/auth/providers/MicrosoftProvider.js', () => ({
    MicrosoftProvider: vi.fn(() => mockMicrosoftProvider)
}));

vi.mock('../../../src/core/auth/providers/GoogleProvider.js', () => ({
    GoogleProvider: vi.fn(() => mockGoogleProvider)
}));

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset singleton state if possible, or just re-init
        authService.initialized = false;
        authService.providers = {};
        
        // Mock window.location
        delete window.location;
        window.location = {
            href: '',
            search: '',
            origin: 'http://localhost:3000'
        };
    });

    describe('init', () => {
        it('should initialize providers based on config', () => {
            authService.init();
            
            expect(OAuthConfig.validate).toHaveBeenCalled();
            expect(authService.providers.microsoft).toBeDefined();
            expect(authService.providers.google).toBeDefined();
        });

        it('should not re-initialize if already initialized', () => {
            authService.init();
            authService.init();
            
            expect(OAuthConfig.validate).toHaveBeenCalledTimes(1);
        });
    });

    describe('login', () => {
        it('should call provider login', async () => {
            authService.init();
            await authService.login('microsoft');
            
            expect(mockMicrosoftProvider.login).toHaveBeenCalled();
        });

        it('should throw error for unknown provider', async () => {
            authService.init();
            await expect(authService.login('unknown')).rejects.toThrow('Provider unknown not configured');
        });
    });

    describe('handleCallback', () => {
        beforeEach(() => {
            authService.init();
            window.location.search = '?code=auth_code&state=auth_state';
            PKCEUtils.getPKCEParams.mockReturnValue({
                codeVerifier: 'verifier',
                state: 'auth_state',
                provider: 'microsoft'
            });
            PKCEUtils.validateState.mockReturnValue(true);
            
            mockMicrosoftProvider.handleCallback.mockResolvedValue({
                access_token: 'access_token',
                refresh_token: 'refresh_token',
                expires_in: 3600
            });
            
            mockMicrosoftProvider.getUserProfile.mockResolvedValue({
                id: 'user1',
                name: 'User'
            });
        });

        it('should process successful callback', async () => {
            const profile = await authService.handleCallback();
            
            expect(mockMicrosoftProvider.handleCallback).toHaveBeenCalledWith('auth_code', 'verifier');
            expect(tokenStorage.setTokens).toHaveBeenCalledWith({
                accessToken: 'access_token',
                refreshToken: 'refresh_token',
                expiresIn: 3600,
                provider: 'microsoft'
            });
            expect(mockMicrosoftProvider.getUserProfile).toHaveBeenCalledWith('access_token');
            expect(tokenStorage.setUserProfile).toHaveBeenCalled();
            expect(PKCEUtils.clearPKCEParams).toHaveBeenCalled();
            expect(profile).toBeDefined();
        });

        it('should throw error if code missing', async () => {
            window.location.search = '?state=auth_state';
            await expect(authService.handleCallback()).rejects.toThrow('Missing code');
        });

        it('should throw error if state invalid', async () => {
            PKCEUtils.validateState.mockReturnValue(false);
            await expect(authService.handleCallback()).rejects.toThrow('Invalid state');
        });

        it('should throw error if PKCE params missing', async () => {
            PKCEUtils.getPKCEParams.mockReturnValue(null);
            await expect(authService.handleCallback()).rejects.toThrow('No PKCE parameters');
        });
    });

    describe('logout', () => {
        it('should call provider logout and clear storage', async () => {
            authService.init();
            tokenStorage.getProvider.mockReturnValue('microsoft');
            tokenStorage.getAccessToken.mockReturnValue('token');
            
            await authService.logout();
            
            expect(mockMicrosoftProvider.logout).toHaveBeenCalledWith('token');
            expect(tokenStorage.clear).toHaveBeenCalled();
            expect(window.location.href).toBe('/');
        });
    });

    describe('getAccessToken', () => {
        it('should return token if authenticated and valid', async () => {
            tokenStorage.isAuthenticated.mockReturnValue(true);
            tokenStorage.needsRefresh.mockReturnValue(false);
            tokenStorage.getAccessToken.mockReturnValue('valid_token');
            
            const token = await authService.getAccessToken();
            
            expect(token).toBe('valid_token');
        });

        it('should refresh token if needed', async () => {
            authService.init();
            tokenStorage.isAuthenticated.mockReturnValue(true);
            tokenStorage.needsRefresh.mockReturnValue(true);
            tokenStorage.getRefreshToken.mockReturnValue('refresh_token');
            tokenStorage.getProvider.mockReturnValue('microsoft');
            
            mockMicrosoftProvider.refreshTokens.mockResolvedValue({
                access_token: 'new_token',
                refresh_token: 'new_refresh',
                expires_in: 3600
            });
            
            tokenStorage.getAccessToken.mockReturnValue('new_token'); // After refresh
            
            await authService.getAccessToken();
            
            expect(mockMicrosoftProvider.refreshTokens).toHaveBeenCalledWith('refresh_token');
            expect(tokenStorage.setTokens).toHaveBeenCalled();
        });

        it('should return null if not authenticated', async () => {
            tokenStorage.isAuthenticated.mockReturnValue(false);
            const token = await authService.getAccessToken();
            expect(token).toBeNull();
        });
    });
});
