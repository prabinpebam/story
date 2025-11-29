/**
 * Identity Encryption Tests
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IdentityEncryption, DecryptionError } from '../../../../src/core/auth/preferences/IdentityEncryption.js';

// Mock SubtleCrypto for Node/jsdom environment
const mockSubtleCrypto = {
    importKey: vi.fn(),
    deriveBits: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn()
};

// Setup crypto mock if not available
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
    globalThis.crypto = {
        subtle: mockSubtleCrypto,
        getRandomValues: (array) => {
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
            return array;
        }
    };
}

describe('IdentityEncryption', () => {
    let encryption;
    let mockClaims;

    beforeEach(() => {
        encryption = new IdentityEncryption();
        mockClaims = {
            sub: 'user-123-abc',
            iss: 'https://login.microsoftonline.com/tenant-id/v2.0',
            email: 'user@example.com',
            name: 'Test User'
        };

        // Reset mocks
        vi.clearAllMocks();
    });

    describe('getIdentityId', () => {
        it('should generate consistent identity ID for same claims', () => {
            const id1 = encryption.getIdentityId(mockClaims);
            const id2 = encryption.getIdentityId(mockClaims);
            expect(id1).toBe(id2);
        });

        it('should generate different IDs for different users', () => {
            const id1 = encryption.getIdentityId(mockClaims);
            const id2 = encryption.getIdentityId({ ...mockClaims, sub: 'different-user' });
            expect(id1).not.toBe(id2);
        });

        it('should generate different IDs for different issuers', () => {
            const id1 = encryption.getIdentityId(mockClaims);
            const id2 = encryption.getIdentityId({ 
                ...mockClaims, 
                iss: 'https://accounts.google.com' 
            });
            expect(id1).not.toBe(id2);
        });

        it('should handle missing sub claim gracefully', () => {
            // getIdentityId doesn't throw - it creates an ID with undefined sub
            const id = encryption.getIdentityId({ iss: 'test' });
            expect(id).toContain('undefined');
        });

        it('should handle missing iss claim gracefully', () => {
            // getIdentityId uses getProviderFromIssuer which handles undefined
            const id = encryption.getIdentityId({ sub: 'test' });
            expect(id).toContain('test');
        });
    });

    describe('getProviderFromIssuer', () => {
        it('should identify Microsoft provider', () => {
            const provider = encryption.getProviderFromIssuer(
                'https://login.microsoftonline.com/tenant-id/v2.0'
            );
            expect(provider).toBe('microsoft');
        });

        it('should identify Google provider', () => {
            const provider = encryption.getProviderFromIssuer(
                'https://accounts.google.com'
            );
            expect(provider).toBe('google');
        });

        it('should return unknown for other issuers', () => {
            const provider = encryption.getProviderFromIssuer('https://other.example.com');
            expect(provider).toBe('unknown');
        });
    });

    describe('generateSalt', () => {
        it('should generate a Uint8Array', () => {
            const salt = encryption.generateSalt();
            expect(salt).toBeInstanceOf(Uint8Array);
        });

        it('should generate salt with correct length', () => {
            const salt = encryption.generateSalt();
            expect(salt.length).toBe(32); // 256 bits
        });

        it('should generate different salts each time', () => {
            const salt1 = encryption.generateSalt();
            const salt2 = encryption.generateSalt();
            expect(Array.from(salt1)).not.toEqual(Array.from(salt2));
        });
    });

    describe('encrypt/decrypt integration', () => {
        it('should throw DecryptionError with wrong claims', async () => {
            // Setup mock for successful encryption
            const mockKey = { type: 'secret' };
            mockSubtleCrypto.importKey.mockResolvedValue(mockKey);
            mockSubtleCrypto.deriveBits.mockResolvedValue(new ArrayBuffer(32));
            mockSubtleCrypto.encrypt.mockResolvedValue(new ArrayBuffer(48));
            mockSubtleCrypto.decrypt.mockRejectedValue(new Error('OperationError'));

            const data = { test: 'value' };
            const salt = encryption.generateSalt();

            try {
                const encrypted = await encryption.encrypt(data, mockClaims, salt);
                
                // Try to decrypt with different claims
                const wrongClaims = { ...mockClaims, sub: 'wrong-user' };
                await encryption.decrypt(encrypted, wrongClaims);
                expect.fail('Should have thrown DecryptionError');
            } catch (error) {
                expect(error).toBeInstanceOf(DecryptionError);
            }
        });
    });

    describe('canDecrypt', () => {
        it('should return false for tampered data', async () => {
            mockSubtleCrypto.decrypt.mockRejectedValue(new Error('OperationError'));

            const tamperedData = {
                iv: Array.from(new Uint8Array(12)),
                salt: Array.from(new Uint8Array(32)),
                ciphertext: Array.from(new Uint8Array(48)),
                authTag: 'included'
            };

            const result = await encryption.canDecrypt(tamperedData, mockClaims);
            expect(result).toBe(false);
        });
    });

    describe('error handling', () => {
        it('DecryptionError should have correct message', () => {
            const error = new DecryptionError('Test error message');
            expect(error.message).toBe('Test error message');
            expect(error.name).toBe('DecryptionError');
        });

        it('DecryptionError should be instanceof Error', () => {
            const error = new DecryptionError('Test');
            expect(error).toBeInstanceOf(Error);
        });
    });
});
