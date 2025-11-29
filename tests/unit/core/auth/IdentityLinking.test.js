/**
 * Identity Linking Tests
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
    IdentityLinking, 
    IdentityLinkingEvents,
    getIdentityLinking 
} from '../../../../src/core/auth/IdentityLinking.js';

// Mock PreferencesManager
vi.mock('../../../../src/core/auth/preferences/PreferencesManager.js', () => ({
    getPreferencesManager: vi.fn(() => ({
        file: {
            getAuthorizedIdentities: vi.fn(() => [
                { id: 'microsoft_user123', type: 'owner', addedAt: '2024-01-01' }
            ]),
            addLinkedIdentity: vi.fn(),
            removeLinkedIdentity: vi.fn(),
            canDecrypt: vi.fn(() => true)
        },
        save: vi.fn()
    }))
}));

describe('IdentityLinking', () => {
    let linking;
    let mockAuthService;

    beforeEach(() => {
        mockAuthService = {
            getCurrentUser: vi.fn(() => ({
                id: 'user123',
                email: 'user@example.com',
                name: 'Test User',
                idTokenClaims: {
                    sub: 'user123',
                    iss: 'https://login.microsoftonline.com/tenant/v2.0',
                    email: 'user@example.com',
                    name: 'Test User'
                }
            })),
            loginWithProvider: vi.fn(),
            getAccessToken: vi.fn(() => 'token')
        };

        linking = new IdentityLinking(mockAuthService);
    });

    afterEach(() => {
        linking.dispose();
    });

    describe('getCurrentIdentity', () => {
        it('should return current identity info', () => {
            const identity = linking.getCurrentIdentity();
            expect(identity).toBeTruthy();
            expect(identity.provider).toBe('microsoft');
            expect(identity.email).toBe('user@example.com');
        });

        it('should return null when not authenticated', () => {
            mockAuthService.getCurrentUser.mockReturnValue(null);
            const identity = linking.getCurrentIdentity();
            expect(identity).toBeNull();
        });
    });

    describe('getLinkedIdentities', () => {
        it('should return list of linked identities', async () => {
            const identities = await linking.getLinkedIdentities();
            expect(identities).toHaveLength(1);
            expect(identities[0].id).toBe('microsoft_user123');
        });
    });

    describe('isProviderLinked', () => {
        it('should return true for linked provider', async () => {
            const isLinked = await linking.isProviderLinked('microsoft');
            expect(isLinked).toBe(true);
        });

        it('should return false for unlinked provider', async () => {
            const isLinked = await linking.isProviderLinked('google');
            expect(isLinked).toBe(false);
        });
    });

    describe('startLinking', () => {
        it('should throw when not authenticated', async () => {
            mockAuthService.getCurrentUser.mockReturnValue(null);
            await expect(linking.startLinking('google'))
                .rejects.toThrow('Must be authenticated');
        });

        it('should throw when trying to link same provider', async () => {
            await expect(linking.startLinking('microsoft'))
                .rejects.toThrow('Already signed in with microsoft');
        });

        it('should throw when linking already in progress', async () => {
            linking.linkingInProgress = true;
            await expect(linking.startLinking('google'))
                .rejects.toThrow('already in progress');
        });

        it('should emit LINKING_STARTED event', async () => {
            const listener = vi.fn();
            linking.subscribe(listener);
            
            mockAuthService.loginWithProvider.mockResolvedValue({
                idTokenClaims: {
                    sub: 'google123',
                    iss: 'https://accounts.google.com',
                    email: 'user@gmail.com'
                }
            });

            await linking.startLinking('google');
            
            expect(listener).toHaveBeenCalledWith(
                IdentityLinkingEvents.LINKING_STARTED,
                { provider: 'google' }
            );
        });

        it('should emit IDENTITY_LINKED on success', async () => {
            const listener = vi.fn();
            linking.subscribe(listener);
            
            mockAuthService.loginWithProvider.mockResolvedValue({
                idTokenClaims: {
                    sub: 'google123',
                    iss: 'https://accounts.google.com',
                    email: 'user@gmail.com',
                    name: 'Test User'
                }
            });

            const result = await linking.startLinking('google');
            
            expect(result.provider).toBe('google');
            expect(listener).toHaveBeenCalledWith(
                IdentityLinkingEvents.IDENTITY_LINKED,
                expect.objectContaining({ provider: 'google' })
            );
        });

        it('should emit LINKING_FAILED on error', async () => {
            const listener = vi.fn();
            linking.subscribe(listener);
            
            mockAuthService.loginWithProvider.mockRejectedValue(new Error('Auth failed'));

            await expect(linking.startLinking('google')).rejects.toThrow('Auth failed');
            
            expect(listener).toHaveBeenCalledWith(
                IdentityLinkingEvents.LINKING_FAILED,
                expect.objectContaining({ provider: 'google', error: 'Auth failed' })
            );
        });
    });

    describe('unlinkIdentity', () => {
        it('should throw when not authenticated', async () => {
            mockAuthService.getCurrentUser.mockReturnValue(null);
            await expect(linking.unlinkIdentity('google_123'))
                .rejects.toThrow('Must be authenticated');
        });

        it('should throw when trying to unlink primary identity', async () => {
            await expect(linking.unlinkIdentity('microsoft_user123'))
                .rejects.toThrow('Cannot unlink your primary identity');
        });

        it('should emit IDENTITY_UNLINKED on success', async () => {
            const listener = vi.fn();
            linking.subscribe(listener);
            
            await linking.unlinkIdentity('google_123');
            
            expect(listener).toHaveBeenCalledWith(
                IdentityLinkingEvents.IDENTITY_UNLINKED,
                { identityId: 'google_123' }
            );
        });
    });

    describe('subscribe', () => {
        it('should return unsubscribe function', () => {
            const listener = vi.fn();
            const unsubscribe = linking.subscribe(listener);
            
            expect(typeof unsubscribe).toBe('function');
            
            unsubscribe();
            linking.emit(IdentityLinkingEvents.LINKING_STARTED, {});
            
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('getLinkedAccountsDisplay', () => {
        it('should return display info for linked accounts', async () => {
            const accounts = await linking.getLinkedAccountsDisplay();
            
            expect(accounts).toHaveLength(1);
            expect(accounts[0].provider).toBe('microsoft');
            expect(accounts[0].displayName).toBe('Microsoft Account');
            expect(accounts[0].isOwner).toBe(true);
        });
    });

    describe('dispose', () => {
        it('should clean up resources', () => {
            const listener = vi.fn();
            linking.subscribe(listener);
            
            linking.dispose();
            
            expect(linking.linkingInProgress).toBe(false);
        });
    });
});
