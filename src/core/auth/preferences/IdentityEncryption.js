/**
 * Identity-Locked Encryption
 * 
 * Provides encryption/decryption using keys derived from OAuth identity.
 * Uses HKDF-SHA256 for key derivation and AES-256-GCM for encryption.
 * 
 * The encryption key is derived from the OAuth 'sub' claim (unique user ID)
 * ensuring only the authenticated user can decrypt their preferences.
 * 
 * @module core/auth/preferences/IdentityEncryption
 */

/**
 * Salt length in bytes for key derivation
 */
const SALT_LENGTH = 32;

/**
 * AES key length in bits
 */
const KEY_LENGTH = 256;

/**
 * IV length in bytes for AES-GCM
 */
const IV_LENGTH = 12;

/**
 * Info string for HKDF - version for future key rotation
 */
const HKDF_INFO = 'story-preferences-v1';

/**
 * Identity Encryption Manager
 * Derives encryption keys from OAuth identity claims
 */
export class IdentityEncryption {
    /**
     * Generate a new random salt
     * @returns {Uint8Array} Random salt bytes
     */
    generateSalt() {
        return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    }

    /**
     * Generate a new random IV for encryption
     * @returns {Uint8Array} Random IV bytes
     */
    generateIV() {
        return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    }

    /**
     * Derive encryption key from OAuth identity claims
     * 
     * @param {Object} idTokenClaims - Claims from OAuth ID token
     * @param {string} idTokenClaims.sub - Subject (unique user ID)
     * @param {string} idTokenClaims.iss - Issuer URL
     * @param {Uint8Array} salt - Salt for key derivation
     * @returns {Promise<CryptoKey>} Derived AES-GCM key
     */
    async deriveKey(idTokenClaims, salt) {
        if (!idTokenClaims?.sub) {
            throw new Error('Missing OAuth sub claim for key derivation');
        }
        if (!idTokenClaims?.iss) {
            throw new Error('Missing OAuth iss claim for key derivation');
        }

        // Create stable identity material from OAuth claims
        // Only use stable claims: sub and iss
        // Do NOT include email or name (can change)
        const identityMaterial = JSON.stringify({
            sub: idTokenClaims.sub,
            iss: idTokenClaims.iss
        });

        // Import identity material as key material for HKDF
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(identityMaterial),
            'HKDF',
            false,
            ['deriveKey']
        );

        // Derive AES key using HKDF
        return crypto.subtle.deriveKey(
            {
                name: 'HKDF',
                salt: salt,
                info: new TextEncoder().encode(HKDF_INFO),
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypt data using identity-derived key
     * 
     * @param {Object} data - Data to encrypt (will be JSON stringified)
     * @param {Object} idTokenClaims - OAuth claims for key derivation
     * @param {Uint8Array} [salt] - Optional salt (generated if not provided)
     * @returns {Promise<EncryptedData>} Encrypted data with IV and salt
     */
    async encrypt(data, idTokenClaims, salt = null) {
        // Generate salt if not provided
        const usedSalt = salt || this.generateSalt();
        
        // Derive key from identity
        const key = await this.deriveKey(idTokenClaims, usedSalt);

        // Generate IV
        const iv = this.generateIV();

        // Encrypt data
        const plaintext = new TextEncoder().encode(JSON.stringify(data));
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            plaintext
        );

        return {
            iv: Array.from(iv),
            ciphertext: Array.from(new Uint8Array(ciphertext)),
            salt: Array.from(usedSalt)
        };
    }

    /**
     * Decrypt data using identity-derived key
     * 
     * @param {EncryptedData} encryptedData - Encrypted data with IV and salt
     * @param {Object} idTokenClaims - OAuth claims for key derivation
     * @returns {Promise<Object>} Decrypted data
     * @throws {DecryptionError} If decryption fails (wrong identity)
     */
    async decrypt(encryptedData, idTokenClaims) {
        // Convert arrays back to Uint8Arrays
        const iv = new Uint8Array(encryptedData.iv);
        const salt = new Uint8Array(encryptedData.salt);
        const ciphertext = new Uint8Array(encryptedData.ciphertext);

        // Derive key from identity
        const key = await this.deriveKey(idTokenClaims, salt);

        try {
            // Decrypt
            const plaintext = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                ciphertext
            );

            return JSON.parse(new TextDecoder().decode(plaintext));
        } catch (error) {
            throw new DecryptionError(
                'Unable to decrypt preferences. This file may belong to a different identity.',
                error
            );
        }
    }

    /**
     * Check if current identity can decrypt the data
     * 
     * @param {EncryptedData} encryptedData - Encrypted data
     * @param {Object} idTokenClaims - OAuth claims
     * @returns {Promise<boolean>} True if decryption would succeed
     */
    async canDecrypt(encryptedData, idTokenClaims) {
        try {
            await this.decrypt(encryptedData, idTokenClaims);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Create identity ID from OAuth claims
     * Format: {provider}_{sub}
     * 
     * @param {Object} idTokenClaims - OAuth claims
     * @returns {string} Identity ID
     */
    getIdentityId(idTokenClaims) {
        const provider = this.getProviderFromIssuer(idTokenClaims.iss);
        return `${provider}_${idTokenClaims.sub}`;
    }

    /**
     * Extract provider name from issuer URL
     * @private
     */
    getProviderFromIssuer(issuer) {
        if (!issuer) return 'unknown';
        if (issuer.includes('google')) return 'google';
        if (issuer.includes('microsoft') || issuer.includes('login.microsoftonline')) return 'microsoft';
        return 'unknown';
    }
}

/**
 * Error thrown when decryption fails
 */
export class DecryptionError extends Error {
    constructor(message, cause = null) {
        super(message);
        this.name = 'DecryptionError';
        this.cause = cause;
    }
}

/**
 * @typedef {Object} EncryptedData
 * @property {number[]} iv - Initialization vector
 * @property {number[]} ciphertext - Encrypted data
 * @property {number[]} salt - Salt used for key derivation
 */

// Singleton instance
export const identityEncryption = new IdentityEncryption();
