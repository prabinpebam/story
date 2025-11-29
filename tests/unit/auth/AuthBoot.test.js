/**
 * AuthBoot Unit Tests
 * 
 * Tests the authentication boot process including callback handling
 * and session restoration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the dependencies before importing
vi.mock('../../../src/core/auth/AuthService.js', () => ({
    authService: {
        init: vi.fn(),
        handleCallback: vi.fn(),
        refreshSession: vi.fn(),
        getConfigValidation: vi.fn(() => ({
            isValid: false,
            providers: { microsoft: false, google: false }
        }))
    }
}));

vi.mock('../../../src/core/auth/AuthCallback.js', () => ({
    isAuthCallback: vi.fn(() => false),
    handleAuthCallback: vi.fn(),
    storeReturnUrl: vi.fn(),
    getReturnUrl: vi.fn(() => null),
    clearReturnUrl: vi.fn()
}));

vi.mock('../../../src/core/auth/storage/TokenStorage.js', () => ({
    tokenStorage: {
        isAuthenticated: vi.fn(() => false),
        needsRefresh: vi.fn(() => false),
        getRefreshToken: vi.fn(() => null),
        getProvider: vi.fn(() => null),
        getUserProfile: vi.fn(() => null),
        clear: vi.fn()
    }
}));

// Import after mocking
import { 
    bootAuth, 
    preserveCurrentUrl, 
    getConfiguredProviders,
    isAuthenticated,
    getCurrentUser
} from '../../../src/core/auth/AuthBoot.js';
import { authService } from '../../../src/core/auth/AuthService.js';
import { isAuthCallback, handleAuthCallback, storeReturnUrl, getReturnUrl, clearReturnUrl } from '../../../src/core/auth/AuthCallback.js';
import { tokenStorage } from '../../../src/core/auth/storage/TokenStorage.js';

describe('AuthBoot', () => {
    let originalLocation;
    let originalHistory;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Store original values
        originalLocation = window.location;
        originalHistory = window.history;
        
        // Mock window.location
        delete window.location;
        window.location = {
            href: 'http://localhost:3000',
            pathname: '/',
            search: '',
            origin: 'http://localhost:3000'
        };
        
        // Mock window.history
        window.history.replaceState = vi.fn();
        
        // Mock CustomEvent
        window.dispatchEvent = vi.fn();
    });

    afterEach(() => {
        window.location = originalLocation;
        window.history = originalHistory;
    });

    describe('bootAuth', () => {
        it('should initialize auth service', async () => {
            const result = await bootAuth();
            
            expect(authService.init).toHaveBeenCalled();
            expect(result.isAuthenticated).toBe(false);
            expect(result.wasCallback).toBe(false);
            expect(result.error).toBe(null);
        });

        it('should handle OAuth callback when on callback URL', async () => {
            const mockUser = { id: 'user1', displayName: 'Test User' };
            isAuthCallback.mockReturnValue(true);
            handleAuthCallback.mockResolvedValue(mockUser);
            getReturnUrl.mockReturnValue('/dashboard');
            
            const result = await bootAuth();
            
            expect(result.wasCallback).toBe(true);
            expect(result.isAuthenticated).toBe(true);
            expect(result.user).toEqual(mockUser);
            expect(result.returnUrl).toBe('/dashboard');
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'story:auth-success'
                })
            );
        });

        it('should handle callback error gracefully', async () => {
            const mockError = new Error('OAuth failed');
            isAuthCallback.mockReturnValue(true);
            handleAuthCallback.mockRejectedValue(mockError);
            
            const result = await bootAuth();
            
            expect(result.wasCallback).toBe(true);
            expect(result.isAuthenticated).toBe(false);
            expect(result.error).toBe(mockError);
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'story:auth-error'
                })
            );
        });

        it('should restore existing session if authenticated', async () => {
            const mockUser = { id: 'user1', displayName: 'Existing User' };
            isAuthCallback.mockReturnValue(false);
            tokenStorage.isAuthenticated.mockReturnValue(true);
            tokenStorage.needsRefresh.mockReturnValue(false);
            tokenStorage.getUserProfile.mockReturnValue(mockUser);
            
            const result = await bootAuth();
            
            expect(result.isAuthenticated).toBe(true);
            expect(result.user).toEqual(mockUser);
            expect(result.wasCallback).toBe(false);
        });

        it('should refresh tokens if needed', async () => {
            const mockUser = { id: 'user1', displayName: 'Refreshed User' };
            isAuthCallback.mockReturnValue(false);
            tokenStorage.isAuthenticated.mockReturnValue(true);
            tokenStorage.needsRefresh.mockReturnValue(true);
            tokenStorage.getRefreshToken.mockReturnValue('refresh-token');
            tokenStorage.getProvider.mockReturnValue('microsoft');
            tokenStorage.getUserProfile.mockReturnValue(mockUser);
            authService.refreshSession.mockResolvedValue();
            
            const result = await bootAuth();
            
            expect(authService.refreshSession).toHaveBeenCalled();
            expect(result.isAuthenticated).toBe(true);
        });

        it('should clear session if refresh fails', async () => {
            isAuthCallback.mockReturnValue(false);
            tokenStorage.isAuthenticated.mockReturnValue(true);
            tokenStorage.needsRefresh.mockReturnValue(true);
            tokenStorage.getRefreshToken.mockReturnValue('expired-token');
            tokenStorage.getProvider.mockReturnValue('google');
            authService.refreshSession.mockRejectedValue(new Error('Refresh failed'));
            
            const result = await bootAuth();
            
            expect(tokenStorage.clear).toHaveBeenCalled();
            expect(result.isAuthenticated).toBe(false);
        });

        it('should not restore session if no refresh token', async () => {
            isAuthCallback.mockReturnValue(false);
            tokenStorage.isAuthenticated.mockReturnValue(true);
            tokenStorage.needsRefresh.mockReturnValue(true);
            tokenStorage.getRefreshToken.mockReturnValue(null);
            
            const result = await bootAuth();
            
            expect(tokenStorage.clear).toHaveBeenCalled();
            expect(result.isAuthenticated).toBe(false);
        });
    });

    describe('preserveCurrentUrl', () => {
        it('should store current URL before OAuth redirect', () => {
            window.location.href = 'http://localhost:3000/editor?doc=123';
            
            preserveCurrentUrl();
            
            expect(storeReturnUrl).toHaveBeenCalledWith('http://localhost:3000/editor?doc=123');
        });
    });

    describe('getConfiguredProviders', () => {
        it('should return provider availability', () => {
            authService.getConfigValidation.mockReturnValue({
                isValid: true,
                providers: { microsoft: true, google: false }
            });
            
            const providers = getConfiguredProviders();
            
            expect(providers).toEqual({ microsoft: true, google: false });
        });

        it('should handle missing getConfigValidation', () => {
            authService.getConfigValidation = undefined;
            
            const providers = getConfiguredProviders();
            
            expect(providers).toEqual({ microsoft: false, google: false });
        });
    });

    describe('isAuthenticated', () => {
        it('should return authentication status', () => {
            tokenStorage.isAuthenticated.mockReturnValue(true);
            
            expect(isAuthenticated()).toBe(true);
            
            tokenStorage.isAuthenticated.mockReturnValue(false);
            
            expect(isAuthenticated()).toBe(false);
        });
    });

    describe('getCurrentUser', () => {
        it('should return current user profile', () => {
            const mockUser = { id: 'user1', displayName: 'Current User' };
            tokenStorage.getUserProfile.mockReturnValue(mockUser);
            
            expect(getCurrentUser()).toEqual(mockUser);
        });

        it('should return null when not authenticated', () => {
            tokenStorage.getUserProfile.mockReturnValue(null);
            
            expect(getCurrentUser()).toBe(null);
        });
    });
});
